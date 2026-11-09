-- =====================================================================
-- YÖNETİCİ GİRİŞİ (09.11.2026, proje sahibinin isteği: "yönetici adı ve şifresiyle giriş, istatistikleri yalnız ben göreyim")
-- Sayfa: https://matematikyolu.com/yonetim/  (kaynak src/yonetim.html)
--
-- Güvenlik:
--  * Şifre yalnız bcrypt özeti olarak saklanır (crypt + gen_salt('bf', 12)); düz şifre hiçbir yerde durmaz.
--  * İlk hesap yalnız TEK KULLANIMLIK, süreli KURULUM KODUYLA açılır (kod da yalnız özetiyle saklanır).
--    Bir yönetici varken kurulum kodu işe yaramaz.
--  * Giriş: aynı hesapta üst üste 5 yanlışta 30 dk kilit; aynı ağdan günde 10 başarısız deneme (kurulum + giriş).
--    Bilinmeyen ad da "yanlis" döner (hangi adların var olduğu öğrenilmesin).
--  * Başarılı giriş 8 saatlik rastgele bir oturum belirteci verir (32 bayt); sunucuda yalnız SHA-256 özeti durur.
--    Çıkışta ve şifre değişince oturumlar kapanır.
--  * Tablolara doğrudan erişim yok (RLS açık, politika yok, anon/authenticated yetkisi geri alındı);
--    yalnız aşağıdaki fonksiyonlar çağrılabilir. Her giriş/deneme yonetici_kayit'a yazılır (ağ özeti, IP değil).
--
-- Yeni kurulum kodu üretmek (yalnız SQL Editor'den; hiç yönetici yokken işe yarar):
--   select public.yonetici_kurulum_kodu();     -- kodu bir kez gösterir, 48 saat geçerli
-- Şifreyi unutursanız: SQL Editor'den  update public.yonetici set sifre = null;  sonra yeni kurulum kodu
--   üretin (yonetici_kurulum_kodu şifresi boş hesap varken de çalışır) ve sayfadan yeni şifre belirleyin.
-- Son girişler:  select * from public.yonetici_kayit order by zaman desc limit 50;
-- =====================================================================
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.yonetici (
  ad        text primary key,
  sifre     text,                         -- bcrypt; null = şifre sıfırlandı, yeni kurulum kodu gerekir
  yanlis    int not null default 0,
  kilit     timestamptz,
  olusturma timestamptz not null default now(),
  son_giris timestamptz
);
create table if not exists public.yonetici_kurulum (
  kod_ozet  text primary key,
  bitis     timestamptz not null,
  kullanildi timestamptz
);
create table if not exists public.yonetici_oturum (
  belirtec_ozet text primary key,
  ad        text not null references public.yonetici(ad) on update cascade,
  olusturma timestamptz not null default now(),
  bitis     timestamptz not null
);
create table if not exists public.yonetici_deneme (ag text not null, gun date not null, n int not null default 0, primary key (ag, gun));
create table if not exists public.yonetici_kayit (
  zaman timestamptz not null default now(),
  olay  text not null,                    -- giris, yanlis, kilitli, sinir, kurulum, kurulum_yanlis, cikis, sifre
  ad    text,
  ag    text                              -- ağ adresinin kısaltılmış özeti (IP saklanmaz)
);
alter table public.yonetici enable row level security;
alter table public.yonetici_kurulum enable row level security;
alter table public.yonetici_oturum enable row level security;
alter table public.yonetici_deneme enable row level security;
alter table public.yonetici_kayit enable row level security;
revoke all on public.yonetici, public.yonetici_kurulum, public.yonetici_oturum, public.yonetici_deneme, public.yonetici_kayit from anon, authenticated;

-- Ağ özeti (aile_ip_ozet ile aynı kaynak; kısaltılmış)
create or replace function public.yonetici_ag() returns text language sql stable set search_path = public, extensions as $$
  select left(public.aile_ip_ozet(), 16) $$;
revoke execute on function public.yonetici_ag() from public, anon, authenticated;

-- Ağ başına günlük başarısız deneme sayacı: true = sınır aşıldı
create or replace function public.yonetici_ag_sinir(p_artir boolean) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare g date := (now() at time zone 'Europe/Istanbul')::date; a text := public.yonetici_ag(); n_ int;
begin
  if p_artir then
    insert into yonetici_deneme (ag, gun, n) values (a, g, 1) on conflict (ag, gun) do update set n = yonetici_deneme.n + 1 returning n into n_;
  else
    select n into n_ from yonetici_deneme where ag = a and gun = g;
  end if;
  return coalesce(n_, 0) >= 10;
end $$;
revoke execute on function public.yonetici_ag_sinir(boolean) from public, anon, authenticated;

-- Şifre kuralı: en az 12 karakter, harf ve rakam içersin, ad ile aynı olmasın
create or replace function public.yonetici_sifre_uygun(p_ad text, p_sifre text) returns boolean language sql immutable set search_path = public as $$
  select p_sifre is not null and length(p_sifre) between 12 and 128 and p_sifre ~ '[A-Za-zÇĞİÖŞÜçğıöşü]' and p_sifre ~ '[0-9]'
    and lower(p_sifre) not like '%' || lower(coalesce(p_ad, '')) || '%' $$;
revoke execute on function public.yonetici_sifre_uygun(text, text) from public, anon, authenticated;

-- Kurulum kodu üret (yalnız sahibi, SQL Editor'den). Kod bir kez gösterilir.
create or replace function public.yonetici_kurulum_kodu() returns text
language plpgsql security definer set search_path = public, extensions as $$
declare k text;
begin
  if exists (select 1 from yonetici where sifre is not null) then raise exception 'Zaten şifreli bir yönetici var. Önce şifreyi sıfırlayın.'; end if;
  k := upper(encode(extensions.gen_random_bytes(10), 'hex'));   -- 20 onaltılık karakter, ~80 bit
  update yonetici_kurulum set kullanildi = now() where kullanildi is null;  -- eski kodlar geçersiz
  insert into yonetici_kurulum (kod_ozet, bitis) values (encode(extensions.digest(k, 'sha256'), 'hex'), now() + interval '48 hours');
  return k;
end $$;
revoke execute on function public.yonetici_kurulum_kodu() from public, anon, authenticated;

-- İlk hesabı (ya da sıfırlanan şifreyi) kurulum koduyla kur
create or replace function public.yonetici_kur(p_kod text, p_ad text, p_sifre text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare oz text; ad_ text := lower(trim(coalesce(p_ad, ''))); var_ad text;
begin
  if public.yonetici_ag_sinir(false) then insert into yonetici_kayit (olay, ag) values ('sinir', public.yonetici_ag()); return jsonb_build_object('ok', false, 'hata', 'sinir'); end if;
  oz := encode(extensions.digest(upper(trim(coalesce(p_kod, ''))), 'sha256'), 'hex');
  if not exists (select 1 from yonetici_kurulum where kod_ozet = oz and kullanildi is null and bitis > now()) then
    perform public.yonetici_ag_sinir(true); insert into yonetici_kayit (olay, ag) values ('kurulum_yanlis', public.yonetici_ag());
    return jsonb_build_object('ok', false, 'hata', 'kod');
  end if;
  if ad_ !~ '^[a-z0-9_.]{3,30}$' then return jsonb_build_object('ok', false, 'hata', 'ad'); end if;
  if not public.yonetici_sifre_uygun(ad_, p_sifre) then return jsonb_build_object('ok', false, 'hata', 'sifre'); end if;
  select ad into var_ad from yonetici limit 1;
  if var_ad is not null and exists (select 1 from yonetici where sifre is not null) then return jsonb_build_object('ok', false, 'hata', 'var'); end if;
  if var_ad is null then
    insert into yonetici (ad, sifre) values (ad_, extensions.crypt(p_sifre, extensions.gen_salt('bf', 12)));
  else
    update yonetici set ad = ad_, sifre = extensions.crypt(p_sifre, extensions.gen_salt('bf', 12)), yanlis = 0, kilit = null where ad = var_ad;
    update yonetici_oturum set bitis = now() where bitis > now();
  end if;
  update yonetici_kurulum set kullanildi = now() where kod_ozet = oz;
  insert into yonetici_kayit (olay, ad, ag) values ('kurulum', ad_, public.yonetici_ag());
  return jsonb_build_object('ok', true);
end $$;

-- Giriş: doğruysa 8 saatlik oturum belirteci döner
create or replace function public.yonetici_giris(p_ad text, p_sifre text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare y yonetici; ad_ text := lower(trim(coalesce(p_ad, ''))); b text;
begin
  if public.yonetici_ag_sinir(false) then insert into yonetici_kayit (olay, ad, ag) values ('sinir', left(ad_, 30), public.yonetici_ag()); return jsonb_build_object('ok', false, 'hata', 'sinir'); end if;
  select * into y from yonetici where ad = ad_ for update;
  if y.ad is null or y.sifre is null then
    perform extensions.crypt(coalesce(p_sifre, ''), extensions.gen_salt('bf', 12));  -- süre farkından ad anlaşılmasın
    perform public.yonetici_ag_sinir(true); insert into yonetici_kayit (olay, ad, ag) values ('yanlis', left(ad_, 30), public.yonetici_ag());
    return jsonb_build_object('ok', false, 'hata', 'yanlis');
  end if;
  if y.kilit is not null and y.kilit > now() then
    insert into yonetici_kayit (olay, ad, ag) values ('kilitli', ad_, public.yonetici_ag());
    return jsonb_build_object('ok', false, 'hata', 'kilitli', 'dakika', ceil(extract(epoch from y.kilit - now()) / 60));
  end if;
  if extensions.crypt(coalesce(p_sifre, ''), y.sifre) <> y.sifre then
    perform public.yonetici_ag_sinir(true);
    update yonetici set yanlis = yanlis + 1, kilit = case when yanlis + 1 >= 5 then now() + interval '30 minutes' else kilit end where ad = ad_;
    insert into yonetici_kayit (olay, ad, ag) values ('yanlis', ad_, public.yonetici_ag());
    return jsonb_build_object('ok', false, 'hata', 'yanlis');
  end if;
  b := encode(extensions.gen_random_bytes(32), 'hex');
  insert into yonetici_oturum (belirtec_ozet, ad, bitis) values (encode(extensions.digest(b, 'sha256'), 'hex'), ad_, now() + interval '8 hours');
  update yonetici set yanlis = 0, kilit = null, son_giris = now() where ad = ad_;
  insert into yonetici_kayit (olay, ad, ag) values ('giris', ad_, public.yonetici_ag());
  return jsonb_build_object('ok', true, 'belirtec', b, 'ad', ad_);
end $$;

-- Belirteç → yönetici adı (geçersizse null)
create or replace function public.yonetici_kim(p_belirtec text) returns text
language sql stable security definer set search_path = public, extensions as $$
  select o.ad from yonetici_oturum o join yonetici y on y.ad = o.ad
  where o.belirtec_ozet = encode(extensions.digest(coalesce(p_belirtec, ''), 'sha256'), 'hex') and o.bitis > now() and y.sifre is not null $$;
revoke execute on function public.yonetici_kim(text) from public, anon, authenticated;

create or replace function public.yonetici_cikis(p_belirtec text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare a text := public.yonetici_kim(p_belirtec);
begin
  if a is null then return jsonb_build_object('ok', true); end if;
  update yonetici_oturum set bitis = now() where belirtec_ozet = encode(extensions.digest(p_belirtec, 'sha256'), 'hex');
  insert into yonetici_kayit (olay, ad, ag) values ('cikis', a, public.yonetici_ag());
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.yonetici_sifre_degistir(p_belirtec text, p_eski text, p_yeni text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare a text := public.yonetici_kim(p_belirtec); y yonetici;
begin
  if a is null then return jsonb_build_object('ok', false, 'hata', 'oturum'); end if;
  select * into y from yonetici where ad = a;
  if extensions.crypt(coalesce(p_eski, ''), y.sifre) <> y.sifre then return jsonb_build_object('ok', false, 'hata', 'yanlis'); end if;
  if not public.yonetici_sifre_uygun(a, p_yeni) then return jsonb_build_object('ok', false, 'hata', 'sifre'); end if;
  update yonetici set sifre = extensions.crypt(p_yeni, extensions.gen_salt('bf', 12)) where ad = a;
  update yonetici_oturum set bitis = now() where ad = a and bitis > now();   -- bütün oturumlar kapanır, yeniden giriş
  insert into yonetici_kayit (olay, ad, ag) values ('sifre', a, public.yonetici_ag());
  return jsonb_build_object('ok', true);
end $$;

-- İstatistik özeti (yalnız geçerli oturumla). p_gun: son kaç gün (1–365)
create or replace function public.yonetici_ozet(p_belirtec text, p_gun int default 30) returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
declare a text := public.yonetici_kim(p_belirtec); g date := (now() at time zone 'Europe/Istanbul')::date;
  bas date; pzt date; r jsonb;
begin
  if a is null then return jsonb_build_object('ok', false, 'hata', 'oturum'); end if;
  bas := g - (least(greatest(coalesce(p_gun, 30), 1), 365) - 1);
  pzt := date_trunc('week', g)::date;
  with s as (
    select s.beceri, s.kalip, max(left(regexp_replace(coalesce(k.metin, ''), '\|[a-z_]+$', ''), 160)) metin, max(s.tur) tur,
      sum(s.n) n, sum(s.ilk) ilk, sum(s.ipucu) ipucu, sum(s.cozum) cozum, round(sum(s.ms_top)::numeric / nullif(sum(s.n), 0) / 1000, 1) ort_sn
    from istat_soru s left join istat_kalip k using (kalip) where s.gun >= bas group by s.beceri, s.kalip)
  select jsonb_build_object('ok', true, 'ad', a, 'bas', bas, 'bugun', g,
    'kullanici', jsonb_build_object(
      'bugun', coalesce((select sayi from istat_ziyaret where gun = g and tur = 'gun'), 0),
      'hafta', coalesce((select sum(sayi) from istat_ziyaret where gun >= pzt and tur = 'hafta'), 0),
      'ay', coalesce((select sum(sayi) from istat_ziyaret where gun >= date_trunc('month', g)::date and tur = 'ay'), 0),
      'yeni_donem', coalesce((select sum(sayi) from istat_ziyaret where gun >= bas and tur = 'yeni'), 0),
      'ilk_kayit', (select min(gun) from istat_ziyaret)),
    'gunluk', coalesce((select jsonb_agg(x order by x.gun) from (
        select d::date gun,
          coalesce(sum(z.sayi) filter (where z.tur = 'gun'), 0) acan, coalesce(sum(z.sayi) filter (where z.tur = 'yeni'), 0) yeni,
          coalesce(sum(z.sayi) filter (where z.tur = 'kayitli'), 0) kayitli,
          coalesce(sum(z.sayi) filter (where z.tur in ('d1','d2_7','d8_30','d31')), 0) donen,
          coalesce((select sum(basla) from istat_ders where gun = d::date), 0) ders,
          coalesce((select sum(bitti) from istat_ders where gun = d::date), 0) biten,
          coalesce((select sum(n) from istat_soru where gun = d::date), 0) cevap
        from generate_series(bas, g, interval '1 day') d left join istat_ziyaret z on z.gun = d::date group by d) x), '[]'),
    'donus', (select jsonb_object_agg(tur, t) from (select tur, sum(sayi) t from istat_ziyaret where gun >= bas and tur in ('d1','d2_7','d8_30','d31') group by tur) x),
    'toplam', (select jsonb_build_object('cevap', coalesce(sum(n), 0), 'ilk', coalesce(sum(ilk), 0), 'ipucu', coalesce(sum(ipucu), 0), 'cozum', coalesce(sum(cozum), 0),
        'ort_sn', round(sum(ms_top)::numeric / nullif(sum(n), 0) / 1000, 1)) from istat_soru where gun >= bas),
    'zor', coalesce((select jsonb_agg(x) from (select * from s where cozum + ipucu > 0 order by (cozum + ipucu)::numeric / n desc, n desc limit 25) x), '[]'),
    'uzun', coalesce((select jsonb_agg(x) from (select * from s order by ort_sn desc nulls last limit 15) x), '[]'),
    'ipucu', coalesce((select jsonb_agg(x) from (select * from s where ipucu > 0 order by ipucu desc, n desc limit 15) x), '[]'),
    'beceri', coalesce((select jsonb_agg(x order by x.ilk_yuzde) from (select beceri, sum(n) n, round(100.0 * sum(ilk) / nullif(sum(n), 0)) ilk_yuzde,
        round(100.0 * sum(ipucu) / nullif(sum(n), 0)) ipucu_yuzde, round(sum(ms_top)::numeric / nullif(sum(n), 0) / 1000, 1) ort_sn
        from istat_soru where gun >= bas group by beceri) x), '[]'),
    'yanilgi', coalesce((select jsonb_agg(x order by x.n desc) from (select m.key mis, sum(m.value::int) n from istat_soru s2, jsonb_each_text(s2.mis) m
        where s2.gun >= bas group by m.key order by 2 desc limit 20) x), '[]'),
    'birakma', coalesce((select jsonb_agg(x order by x.birak desc) from (select mod, beceri, sum(basla) basla, sum(bitti) bitti, sum(birak) birak
        from istat_ders where gun >= bas group by mod, beceri having sum(basla) > 0 order by sum(birak) desc limit 20) x), '[]'),
    'birak_soru', (select jsonb_object_agg(k, v) from (select b.key k, sum(b.value::int) v from istat_ders d2, jsonb_each_text(d2.birak_soru) b where d2.gun >= bas group by b.key) x),
    'hizmet', jsonb_build_object(
      'yedek', (select count(*) from aile_yedek), 'yedek_7g', (select count(*) from aile_yedek where guncelleme > now() - interval '7 days'),
      'oyuncu', (select count(*) from oyuncu_giris), 'pilot', (select count(*) from pilot_katilim),
      'bildirim', (select count(*) from bildirim_abonelik), 'eposta', (select count(*) from veli_eposta where onaylandi is not null)),
    'girisler', coalesce((select jsonb_agg(x) from (select zaman, olay, ad from yonetici_kayit order by zaman desc limit 15) x), '[]')
  ) into r;
  return r;
end $$;

revoke all on function public.yonetici_kur(text, text, text), public.yonetici_giris(text, text), public.yonetici_cikis(text),
  public.yonetici_sifre_degistir(text, text, text), public.yonetici_ozet(text, int) from public;
grant execute on function public.yonetici_kur(text, text, text), public.yonetici_giris(text, text), public.yonetici_cikis(text),
  public.yonetici_sifre_degistir(text, text, text), public.yonetici_ozet(text, int) to anon, authenticated;
