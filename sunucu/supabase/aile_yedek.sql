-- =====================================================================
-- AİLE KODU İLE BULUT YEDEĞİ (25.10.2026)
-- Telefon değişince ilerleme kaybolmasın diye. E-posta, şifre, hesap YOK: veli onay verir, uygulama tahmin edilemez
-- bir aile kodu üretir (16 karakter, ~80 bit, cihazda crypto.getRandomValues). Sunucu kodu değil yalnız SHA-256 özetini saklar.
-- Yeni telefonda kod girilince ilerleme geri gelir.
-- Saklanan: çocuğun öğrenme durumu (beceriler, yıldızlar, yanılgılar, rozetler, takma ad yok) ve çocuğun ilk adı.
-- Veli adı, telefon, e-posta, veli şifresi, bildirim adresi uygulama tarafında ÇIKARILIR, buraya gelmez (veri minimizasyonu, KVKK §1-6).
-- Veli onayı (metin sürümü + zaman) satırda durur. 18 ay dokunulmayan yedek kendiliğinden silinir. Veli "Yedeği sil" ile hemen siler.
-- Tablolara doğrudan erişim yok (RLS açık, politika yok); uygulama yalnız aşağıdaki fonksiyonları çağırır.
-- =====================================================================
create table if not exists public.aile_yedek (
  kod_ozet    text primary key,            -- sha256(aile kodu), hex
  durum       jsonb not null,
  surum       bigint not null,             -- uygulamadaki son kayıt zamanı (ms)
  boyut       int not null,
  riza_surum  text not null,
  riza_at     timestamptz not null,
  olusturma   timestamptz not null default now(),
  guncelleme  timestamptz not null default now(),
  son_okuma   timestamptz
);
alter table public.aile_yedek enable row level security;
revoke all on public.aile_yedek from anon, authenticated;

-- Kaba kuvvet freni: aynı ağdan günde en fazla 30 başarısız kod denemesi (80 bitlik kodda zaten imkânsız; ek güvence)
create table if not exists public.aile_yedek_deneme (ip_ozet text not null, gun date not null, n int not null default 0, primary key (ip_ozet, gun));
alter table public.aile_yedek_deneme enable row level security;
revoke all on public.aile_yedek_deneme from anon, authenticated;

create or replace function public.aile_kod_ozet(p_kod text) returns text language sql immutable as $$
  select encode(sha256(convert_to(upper(regexp_replace(coalesce(p_kod, ''), '[^A-Za-z0-9]', '', 'g')), 'UTF8')), 'hex');
$$;
create or replace function public.aile_kod_gecerli(p_kod text) returns boolean language sql immutable as $$
  select upper(regexp_replace(coalesce(p_kod, ''), '[^A-Za-z0-9]', '', 'g')) ~ '^[A-Z2-9]{16}$';
$$;
create or replace function public.aile_ip_ozet() returns text language sql stable as $$
  select encode(sha256(convert_to(coalesce(split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1), 'yok') || '|aile', 'UTF8')), 'hex');
$$;

-- Kaydet. p_onceki: bu cihazın en son gördüğü bulut sürümü. Başka bir cihaz arada daha yeni bir kayıt yaptıysa
-- üzerine yazılmaz, {cakisma: true} döner (uygulama veliye hangisini tutacağını sorar). p_zorla = true ise yazar.
create or replace function public.aile_yedek_kaydet(p_kod text, p_durum jsonb, p_surum bigint, p_onceki bigint, p_riza text, p_zorla boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare oz text; mevcut bigint; b int;
begin
  if not aile_kod_gecerli(p_kod) then return jsonb_build_object('ok', false, 'hata', 'kod'); end if;
  if p_riza is null or length(p_riza) > 40 then return jsonb_build_object('ok', false, 'hata', 'riza'); end if;
  b := octet_length(p_durum::text);
  if b > 600000 or jsonb_typeof(p_durum) <> 'object' then return jsonb_build_object('ok', false, 'hata', 'boyut'); end if;
  oz := aile_kod_ozet(p_kod);
  select surum into mevcut from aile_yedek where kod_ozet = oz;
  if mevcut is not null and not coalesce(p_zorla, false) and mevcut > coalesce(p_onceki, 0) and mevcut <> p_surum then
    return jsonb_build_object('ok', false, 'cakisma', true, 'surum', mevcut);
  end if;
  insert into aile_yedek (kod_ozet, durum, surum, boyut, riza_surum, riza_at)
    values (oz, p_durum, p_surum, b, p_riza, now())
  on conflict (kod_ozet) do update set durum = excluded.durum, surum = excluded.surum, boyut = excluded.boyut, guncelleme = now();
  return jsonb_build_object('ok', true, 'surum', p_surum);
end $$;

-- Getir. p_ozet = true: yalnız sürüm (açılışta "başka cihaz yeni bir şey kaydetti mi?" bakışı, ucuz).
create or replace function public.aile_yedek_getir(p_kod text, p_ozet boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r aile_yedek; ip text := aile_ip_ozet(); den int;
begin
  select n into den from aile_yedek_deneme where ip_ozet = ip and gun = current_date;
  if coalesce(den, 0) >= 30 then return jsonb_build_object('ok', false, 'hata', 'cok_deneme'); end if;
  if aile_kod_gecerli(p_kod) then select * into r from aile_yedek where kod_ozet = aile_kod_ozet(p_kod); end if;
  if r.kod_ozet is null then
    insert into aile_yedek_deneme (ip_ozet, gun, n) values (ip, current_date, 1) on conflict (ip_ozet, gun) do update set n = aile_yedek_deneme.n + 1;
    return jsonb_build_object('ok', false, 'hata', 'yok');
  end if;
  if coalesce(p_ozet, false) then return jsonb_build_object('ok', true, 'surum', r.surum); end if;
  update aile_yedek set son_okuma = now() where kod_ozet = r.kod_ozet;
  return jsonb_build_object('ok', true, 'surum', r.surum, 'durum', r.durum);
end $$;

create or replace function public.aile_yedek_sil(p_kod text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not aile_kod_gecerli(p_kod) then return false; end if;
  delete from aile_yedek where kod_ozet = aile_kod_ozet(p_kod);
  return found;
end $$;

revoke all on function public.aile_yedek_kaydet(text, jsonb, bigint, bigint, text, boolean) from public;
revoke all on function public.aile_yedek_getir(text, boolean) from public;
revoke all on function public.aile_yedek_sil(text) from public;
grant execute on function public.aile_yedek_kaydet(text, jsonb, bigint, bigint, text, boolean) to anon, authenticated;
grant execute on function public.aile_yedek_getir(text, boolean) to anon, authenticated;
grant execute on function public.aile_yedek_sil(text) to anon, authenticated;

-- Saklama süresi: 18 ay dokunulmayan yedek ve eski deneme sayaçları her ayın 1'inde silinir
select cron.unschedule('aile-yedek-temizle') where exists (select 1 from cron.job where jobname = 'aile-yedek-temizle');
select cron.schedule('aile-yedek-temizle', '17 3 1 * *', $$
  delete from public.aile_yedek where guncelleme < now() - interval '18 months';
  delete from public.aile_yedek_deneme where gun < current_date - 7;
$$);
