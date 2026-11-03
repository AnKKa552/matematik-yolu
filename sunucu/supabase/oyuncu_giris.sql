-- =====================================================================
-- OYUNCU ADI + RESİMLİ ŞİFRE İLE GİRİŞ (03.11.2026)
-- Çocuk başka bir telefonda ilerlemesine kendi başına dönebilsin diye. Aile kodu yedeğinin (aile_yedek.sql) üstüne kuruludur:
-- giriş doğruysa sunucu çocuğa ait aile kodunu geri verir; uygulama yedeği bu kodla, bugünkü yoldan yükler.
--   Oyuncu adı: çocuğun adı + hayvan + iki basamaklı sayı (ör. Elif · Kaplan · 27). İsimler çakışmasın diye.
--   Resimli şifre: 16 resimden sırayla 3 tanesi (16^3 = 4096 olasılık).
-- Neden güvenli sayılır: tahminle denemek sunucuda frenlenir. Bir oyuncu adına üst üste 5 yanlışta 15 dakika bekleme,
-- günde en fazla 15 yanlış; aynı ağdan günde en fazla 30 başarısız deneme (aile_yedek_deneme tablosu ortak).
-- Saklananlar: oyuncu adının SHA-256 özeti (adın kendisi değil), resimli şifrenin bcrypt özeti, aile kodunun kasadaki
-- anahtarla şifrelenmiş hâli. Oyuncu adını yalnız veli, şifreli Veli alanında ve yedek açıkken oluşturur (veli onayı §1-6).
-- Tablolara doğrudan erişim yok (RLS açık, politika yok); uygulama yalnız aşağıdaki iki fonksiyonu çağırır.
-- Yedek kaldırıldığında oyuncu satırının da gitmesi için oyuncu_giris_silme.sql proje sahibince SQL Editor'den çalıştırılır.
-- =====================================================================
create table if not exists public.oyuncu_giris (
  ad_ozet     text primary key,                 -- sha256('oyuncu|' || ad|hayvan|sayı), hex
  sifre_ozet  text not null,                    -- crypt(resimler, gen_salt('bf'))
  kod_sifreli bytea not null,                   -- pgp_sym_encrypt(aile kodu, kasa: oyuncu_anahtar)
  kod_ozet    text not null unique,             -- bağlı olduğu yedek (bir yedeğe bir oyuncu adı)
  yanlis      int not null default 0,           -- üst üste yanlış
  kilit       timestamptz,
  gun         date,
  gun_yanlis  int not null default 0,
  olusturma   timestamptz not null default now(),
  son_giris   timestamptz
);
alter table public.oyuncu_giris enable row level security;
revoke all on public.oyuncu_giris from anon, authenticated;

-- Kasada şifreleme anahtarı (yoksa üretilir; anahtar hiçbir dosyada durmaz)
do $$ begin
  if not exists (select 1 from vault.secrets where name = 'oyuncu_anahtar') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'oyuncu_anahtar', 'Oyuncu girişinde aile kodunu şifreleyen anahtar');
  end if;
end $$;

create or replace function public.oyuncu_ad_ozet(p_ad text) returns text language sql immutable as $$
  select encode(sha256(convert_to('oyuncu|' || coalesce(p_ad, ''), 'UTF8')), 'hex');
$$;
-- Biçim: "elif|kaplan|27" (uygulama Türkçe harfleri sadeleştirip küçük harfe çevirir), resimler: 3 onaltılık rakam "a3f"
create or replace function public.oyuncu_ad_gecerli(p_ad text) returns boolean language sql immutable as $$
  select coalesce(p_ad, '') ~ '^[a-z]{2,12}\|[a-z]{3,12}\|[1-9][0-9]$';
$$;

-- Oluştur ya da resimleri değiştir. Aile kodunu bilen (yani veli alanında yedeği açık olan) cihaz çağırabilir.
create or replace function public.oyuncu_olustur(p_kod text, p_ad text, p_resim text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare koz text; aoz text; sahip text; anahtar text;
begin
  if not aile_kod_gecerli(p_kod) then return jsonb_build_object('ok', false, 'hata', 'kod'); end if;
  if not oyuncu_ad_gecerli(p_ad) or coalesce(p_resim, '') !~ '^[0-9a-f]{3}$' then return jsonb_build_object('ok', false, 'hata', 'bicim'); end if;
  koz := aile_kod_ozet(p_kod);
  if not exists (select 1 from aile_yedek where kod_ozet = koz) then return jsonb_build_object('ok', false, 'hata', 'yedek_yok'); end if;
  aoz := oyuncu_ad_ozet(p_ad);
  select kod_ozet into sahip from oyuncu_giris where ad_ozet = aoz;
  if sahip is not null and sahip <> koz then return jsonb_build_object('ok', false, 'hata', 'alinmis'); end if;
  select decrypted_secret into anahtar from vault.decrypted_secrets where name = 'oyuncu_anahtar';
  insert into oyuncu_giris (ad_ozet, sifre_ozet, kod_sifreli, kod_ozet)
    values (aoz, crypt(p_resim, gen_salt('bf', 8)), pgp_sym_encrypt(upper(regexp_replace(p_kod, '[^A-Za-z0-9]', '', 'g')), anahtar), koz)
  on conflict (kod_ozet) do update set ad_ozet = excluded.ad_ozet, sifre_ozet = excluded.sifre_ozet, kod_sifreli = excluded.kod_sifreli,
    yanlis = 0, kilit = null, gun_yanlis = 0;
  return jsonb_build_object('ok', true);
end $$;

-- Giriş. Doğruysa aile kodu döner. Oyuncu adı yoksa da "yanlis" denir (hangi adların var olduğu dışarıdan öğrenilmesin).
create or replace function public.oyuncu_giris(p_ad text, p_resim text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare r oyuncu_giris; ip text := aile_ip_ozet(); den int; anahtar text;
begin
  select n into den from aile_yedek_deneme where ip_ozet = ip and gun = current_date;
  if coalesce(den, 0) >= 30 then return jsonb_build_object('ok', false, 'hata', 'cok_deneme'); end if;
  if oyuncu_ad_gecerli(p_ad) then select * into r from oyuncu_giris where ad_ozet = oyuncu_ad_ozet(p_ad); end if;
  -- bağlı yedek kaldırılmışsa satır yok sayılır
  if r.ad_ozet is not null and not exists (select 1 from aile_yedek where kod_ozet = r.kod_ozet) then r := null; end if;
  if r.ad_ozet is null then
    insert into aile_yedek_deneme (ip_ozet, gun, n) values (ip, current_date, 1) on conflict (ip_ozet, gun) do update set n = aile_yedek_deneme.n + 1;
    return jsonb_build_object('ok', false, 'hata', 'yanlis');
  end if;
  if r.kilit is not null and r.kilit > now() then
    return jsonb_build_object('ok', false, 'hata', 'kilit', 'dakika', greatest(1, ceil(extract(epoch from (r.kilit - now())) / 60)::int));
  end if;
  if r.gun is distinct from current_date then r.gun := current_date; r.gun_yanlis := 0; end if;
  if r.gun_yanlis >= 15 then return jsonb_build_object('ok', false, 'hata', 'kilit_gun'); end if;
  if coalesce(p_resim, '') !~ '^[0-9a-f]{3}$' or crypt(p_resim, r.sifre_ozet) <> r.sifre_ozet then
    r.yanlis := r.yanlis + 1; r.gun_yanlis := r.gun_yanlis + 1;
    update oyuncu_giris set yanlis = case when r.yanlis >= 5 then 0 else r.yanlis end,
      kilit = case when r.yanlis >= 5 then now() + interval '15 minutes' else kilit end,
      gun = r.gun, gun_yanlis = r.gun_yanlis where ad_ozet = r.ad_ozet;
    insert into aile_yedek_deneme (ip_ozet, gun, n) values (ip, current_date, 1) on conflict (ip_ozet, gun) do update set n = aile_yedek_deneme.n + 1;
    if r.yanlis >= 5 then return jsonb_build_object('ok', false, 'hata', 'kilit', 'dakika', 15); end if;
    return jsonb_build_object('ok', false, 'hata', 'yanlis');
  end if;
  update oyuncu_giris set yanlis = 0, kilit = null, gun = r.gun, son_giris = now() where ad_ozet = r.ad_ozet;
  select decrypted_secret into anahtar from vault.decrypted_secrets where name = 'oyuncu_anahtar';
  return jsonb_build_object('ok', true, 'kod', pgp_sym_decrypt(r.kod_sifreli, anahtar));
end $$;

revoke all on function public.oyuncu_olustur(text, text, text) from public;
revoke all on function public.oyuncu_giris(text, text) from public;
grant execute on function public.oyuncu_olustur(text, text, text) to anon, authenticated;
grant execute on function public.oyuncu_giris(text, text) to anon, authenticated;
