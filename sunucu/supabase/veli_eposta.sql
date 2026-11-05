-- Haftalık veli raporu e-postası (06.11.2026). Veli, şifreli Veli alanında e-postasını yazar ve onay verir;
-- adres, gelen doğrulama e-postasındaki bağlantıyla onaylanmadan rapor gitmez (başkasının adresine yazılamasın).
-- Rapor metnini telefon hazırlar (E.parentReport) ve en fazla birkaç saatte bir yükler; sunucu her pazar 18.00'de
-- (Türkiye) son 8 günde yüklenmiş raporu gönderir ve metni siler. O hafta hiç çalışılmadıysa e-posta gitmez (dürtme yok).
-- «Abonelikten çık» bağlantısı satır kimliği + HMAC imzasıdır (ayrı belirteç saklanmaz).
-- Tabloya doğrudan erişim yok (RLS açık, politika yok); her şey veli-eposta fonksiyonu (service_role) üzerinden.

create table if not exists public.veli_eposta (
  id uuid primary key default gen_random_uuid(),
  cihaz text not null unique,              -- telefonda üretilen rastgele kimlik (çocuk başına)
  gizli_ozet text not null,                -- telefonun sakladığı gizli anahtarın SHA-256 özeti
  eposta text not null,
  ad text,                                 -- çocuğun uygulamadaki adı (e-posta konusunda; kardeşleri ayırmak için)
  riza text not null,                      -- onay metni sürümü
  riza_at timestamptz not null default now(),
  onay_ozet text,                          -- doğrulama bağlantısındaki belirtecin özeti (onaylanınca boşalır)
  onaylandi timestamptz,
  rapor text,                              -- telefonun yüklediği son rapor metni (gönderilince boşalır)
  rapor_at timestamptz,
  son_gonderim timestamptz,
  dogrulama_n int not null default 0,      -- bugün gönderilen doğrulama e-postası
  dogrulama_gun date,
  olusturma timestamptz not null default now()
);
alter table public.veli_eposta enable row level security;
revoke all on public.veli_eposta from anon, authenticated;
create index if not exists veli_eposta_onay on public.veli_eposta (onay_ozet);

-- Kötüye kullanım freni: aynı ağdan (IP özeti) ve aynı adrese günde sınırlı doğrulama e-postası
create table if not exists public.veli_eposta_sayac (
  anahtar text not null,                   -- 'ag:<özet>' ya da 'adres:<özet>'
  gun date not null,
  n int not null default 0,
  primary key (anahtar, gun)
);
alter table public.veli_eposta_sayac enable row level security;
revoke all on public.veli_eposta_sayac from anon, authenticated;

create or replace function public.veli_eposta_say(p_anahtar text)
returns int language sql security definer set search_path = public as $$
  insert into public.veli_eposta_sayac (anahtar, gun, n) values (p_anahtar, (now() at time zone 'Europe/Istanbul')::date, 1)
  on conflict (anahtar, gun) do update set n = veli_eposta_sayac.n + 1
  returning n
$$;
revoke all on function public.veli_eposta_say(text) from public, anon, authenticated;
grant execute on function public.veli_eposta_say(text) to service_role;

-- Her pazar 18.00 (Türkiye, UTC+3 → 15.00 UTC) gönderim fonksiyonunu tetikler
create or replace function public.veli_eposta_tetikle()
returns bigint language sql security definer set search_path = public as $$
  select net.http_post(
    url := 'https://yrhegvpzmjqrwdgrjfer.supabase.co/functions/v1/veli-eposta',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-admin-token', (select decrypted_secret from vault.decrypted_secrets where name = 'admin_token')),
    body := '{"is":"gonder"}'::jsonb, timeout_milliseconds := 120000)
$$;
revoke all on function public.veli_eposta_tetikle() from public, anon, authenticated;
select cron.unschedule('veli-eposta-gonder') where exists (select 1 from cron.job where jobname = 'veli-eposta-gonder');
select cron.schedule('veli-eposta-gonder', '0 15 * * 0', $$ select public.veli_eposta_tetikle(); $$);
