-- Güvenlik denetimi düzeltmeleri (16.11.2026)
-- Cloudflare security-audit becerisiyle yapılan denetimin bulguları (rapor: CLAUDE.md §3.16).
-- Bu dosya aşağıdaki fonksiyonların CANLI tanımlarının üstüne yazılır; aile_yedek.sql, oyuncu_giris.sql,
-- yonetici.sql, soru_sesi.sql ve bildirim.sql içindeki eski tanımların yerine bunlar geçerlidir.
-- Hiçbir satır silmez; yalnız CREATE OR REPLACE ve izin ayarı içerir.

-- 1) oyuncu_giris: yanlış deneme sayaçları artık satır kilidiyle okunur (FOR UPDATE).
--    Önceden aynı anda gönderilen çok sayıda yanlış resimli şifre denemesi birbirinin sayacını eziyor,
--    5 yanlışta 15 dk kilit ve günde 15 yanlış sınırı eşzamanlı istekle aşılabiliyordu.
create or replace function public.oyuncu_giris(p_ad text, p_resim text)
 returns jsonb language plpgsql security definer set search_path to 'public', 'extensions'
as $function$
declare r oyuncu_giris; ip text := aile_ip_ozet(); den int; anahtar text;
begin
  select n into den from aile_yedek_deneme where ip_ozet = ip and gun = current_date;
  if coalesce(den, 0) >= 30 then return jsonb_build_object('ok', false, 'hata', 'cok_deneme'); end if;
  if oyuncu_ad_gecerli(p_ad) then select * into r from oyuncu_giris where ad_ozet = oyuncu_ad_ozet(p_ad) for update; end if;
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
end $function$;

-- 2) oyuncu_olustur: «alinmis» (ad başka ailede) cevabı artık ağ başına günlük deneme sayacına yazılır
--    ve sayaç dolunca fonksiyon cevap vermez. Önceden herkes kendi yedeğini açıp sınırsız sayıda
--    ad deneyerek hangi oyuncu adlarının (çocukların ilk adları) kayıtlı olduğunu öğrenebiliyordu.
create or replace function public.oyuncu_olustur(p_kod text, p_ad text, p_resim text)
 returns jsonb language plpgsql security definer set search_path to 'public', 'extensions'
as $function$
declare koz text; aoz text; sahip text; anahtar text; ip text := aile_ip_ozet(); den int;
begin
  if not aile_kod_gecerli(p_kod) then return jsonb_build_object('ok', false, 'hata', 'kod'); end if;
  if not oyuncu_ad_gecerli(p_ad) or coalesce(p_resim, '') !~ '^[0-9a-f]{3}$' then return jsonb_build_object('ok', false, 'hata', 'bicim'); end if;
  select n into den from aile_yedek_deneme where ip_ozet = ip and gun = current_date;
  if coalesce(den, 0) >= 30 then return jsonb_build_object('ok', false, 'hata', 'cok_deneme'); end if;
  koz := aile_kod_ozet(p_kod);
  if not exists (select 1 from aile_yedek where kod_ozet = koz) then return jsonb_build_object('ok', false, 'hata', 'yedek_yok'); end if;
  aoz := oyuncu_ad_ozet(p_ad);
  select kod_ozet into sahip from oyuncu_giris where ad_ozet = aoz;
  if sahip is not null and sahip <> koz then
    insert into aile_yedek_deneme (ip_ozet, gun, n) values (ip, current_date, 1) on conflict (ip_ozet, gun) do update set n = aile_yedek_deneme.n + 1;
    return jsonb_build_object('ok', false, 'hata', 'alinmis');
  end if;
  select decrypted_secret into anahtar from vault.decrypted_secrets where name = 'oyuncu_anahtar';
  insert into oyuncu_giris (ad_ozet, sifre_ozet, kod_sifreli, kod_ozet)
    values (aoz, crypt(p_resim, gen_salt('bf', 8)), pgp_sym_encrypt(upper(regexp_replace(p_kod, '[^A-Za-z0-9]', '', 'g')), anahtar), koz)
  on conflict (kod_ozet) do update set ad_ozet = excluded.ad_ozet, sifre_ozet = excluded.sifre_ozet, kod_sifreli = excluded.kod_sifreli,
    yanlis = 0, kilit = null, gun_yanlis = 0;
  return jsonb_build_object('ok', true);
end $function$;

-- 3) yonetici_giris: kilit süresi dolunca yanlış sayacı sıfırlanır. Önceden sayaç yalnız başarılı
--    girişte sıfırlandığı için kilit bitince tek bir yanlış deneme yöneticiyi yeniden 30 dk kilitliyordu
--    (adı bilen biri yarım saatte bir istekle yöneticiyi sürekli dışarıda tutabilirdi).
create or replace function public.yonetici_giris(p_ad text, p_sifre text)
 returns jsonb language plpgsql security definer set search_path to 'public', 'extensions'
as $function$
declare y yonetici; ad_ text := lower(trim(coalesce(p_ad, ''))); b text;
begin
  if public.yonetici_ag_sinir(false) then insert into yonetici_kayit (olay, ad, ag) values ('sinir', left(ad_, 30), public.yonetici_ag()); return jsonb_build_object('ok', false, 'hata', 'sinir'); end if;
  select * into y from yonetici where ad = ad_ for update;
  if y.ad is null or y.sifre is null then
    perform extensions.crypt(coalesce(p_sifre, ''), extensions.gen_salt('bf', 12));
    perform public.yonetici_ag_sinir(true); insert into yonetici_kayit (olay, ad, ag) values ('yanlis', left(ad_, 30), public.yonetici_ag());
    return jsonb_build_object('ok', false, 'hata', 'yanlis');
  end if;
  if y.kilit is not null and y.kilit > now() then
    insert into yonetici_kayit (olay, ad, ag) values ('kilitli', ad_, public.yonetici_ag());
    return jsonb_build_object('ok', false, 'hata', 'kilitli', 'dakika', ceil(extract(epoch from y.kilit - now()) / 60));
  end if;
  if y.kilit is not null then update yonetici set yanlis = 0, kilit = null where ad = ad_; end if;
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
end $function$;

-- 4) soru_sesi_hak: tek bir ağ, günlük toplam karakter bütçesinin en çok dörtte birini kullanabilir.
--    Önceden kişi başı sınır (100 kayıt × 260 karakter) toplam bütçeden (6000) büyüktü; tek kişi
--    bütün günün bütçesini bitirip diğer çocukların Pi sesini robot sese düşürebiliyordu.
create or replace function public.soru_sesi_hak(p_anahtar text, p_karakter integer, p_cihaz_adet integer, p_toplam_karakter integer)
 returns boolean language plpgsql security definer set search_path to 'public'
as $function$
declare v_gun date := (now() at time zone 'Europe/Istanbul')::date; v_c int; v_ck int; v_t int;
begin
  insert into soru_sesi_gunluk(gun, anahtar) values (v_gun, p_anahtar), (v_gun, 'toplam') on conflict do nothing;
  select adet, karakter into v_c, v_ck from soru_sesi_gunluk where gun = v_gun and anahtar = p_anahtar for update;
  select karakter into v_t from soru_sesi_gunluk where gun = v_gun and anahtar = 'toplam' for update;
  if v_c >= p_cihaz_adet or v_t + p_karakter > p_toplam_karakter or v_ck + p_karakter > greatest(p_toplam_karakter / 4, 300) then return false; end if;
  update soru_sesi_gunluk set adet = adet + 1, karakter = karakter + p_karakter where gun = v_gun and anahtar in (p_anahtar, 'toplam');
  return true;
end $function$;
revoke execute on function public.soru_sesi_hak(text, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.soru_sesi_hak(text, integer, integer, integer) to service_role;

-- 5) bildirim_kaydet: bildirim adresi yalnız bilinen Web Push servislerinden biri olabilir
--    (Chrome/Android/Samsung: FCM, Firefox: Mozilla, Safari: Apple, Edge: Windows).
--    Önceden herhangi bir https adresi kaydedilebiliyor; sahte, yavaş adresler gerçek çocukların
--    hatırlatmalarını geciktirebiliyor ve sunucu yabancı adreslere istek gönderiyordu.
create or replace function public.bildirim_kaydet(p_endpoint text, p_p256dh text, p_auth text, p_saat1 time without time zone, p_saat2 time without time zone, p_acik boolean, p_son_ders date, p_seri integer)
 returns boolean language plpgsql security definer set search_path to 'public'
as $function$
declare s1 time; s2 time;
begin
  if p_endpoint is null or length(p_endpoint) > 1000
     or p_endpoint !~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)/'
     or length(coalesce(p_p256dh, '')) not between 20 and 200 or length(coalesce(p_auth, '')) not between 8 and 100 then return false; end if;
  s1 := least(greatest(coalesce(p_saat1, '17:30'), '15:00'), '19:30');
  s2 := least(greatest(coalesce(p_saat2, '20:00'), s1 + interval '1 hour'), '20:30');
  insert into bildirim_abonelik (endpoint, p256dh, auth, acik, saat1, saat2, son_ders, seri)
    values (p_endpoint, p_p256dh, p_auth, coalesce(p_acik, true), s1, s2, p_son_ders, least(greatest(coalesce(p_seri, 0), 0), 9999))
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, acik = excluded.acik, saat1 = excluded.saat1, saat2 = excluded.saat2,
    son_ders = greatest(bildirim_abonelik.son_ders, excluded.son_ders), seri = excluded.seri, guncelleme = now();
  return true;
end $function$;

-- 6) Kasa yardımcıları: canlıda kuruluydu ama depoda tanımı yoktu (denetim bunu doğrulanamaz buldu).
--    16.11.2026'da canlıdan okundu: ikisi de anon ve authenticated için kapalı; gizli_al yalnız
--    'elevenlabs_api_key' adını döndürür. Tanımlar kayıt için buraya yazıldı, izinler yeniden kapatılır.
create or replace function public.gizli_al(ad text)
 returns text language sql stable security definer set search_path to 'public'
as $function$ select decrypted_secret from vault.decrypted_secrets where name = ad and ad in ('elevenlabs_api_key') $function$;
create or replace function public.admin_token_dogru(t text)
 returns boolean language sql stable security definer set search_path to 'public'
as $function$ select exists (select 1 from vault.decrypted_secrets where name = 'admin_token' and decrypted_secret = t and length(t) > 20) $function$;
revoke execute on function public.gizli_al(text) from public, anon, authenticated;
revoke execute on function public.admin_token_dogru(text) from public, anon, authenticated;
grant execute on function public.gizli_al(text) to service_role;
grant execute on function public.admin_token_dogru(text) to service_role;
