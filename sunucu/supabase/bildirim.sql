-- =====================================================================
-- HATIRLATMA BİLDİRİMLERİ (Web Push, 20.10.2026)
-- Kural (CLAUDE.md §2): günde en fazla 2 bildirim, yalnız o gün hiç ders yapılmadıysa, 20.30'dan sonra hiç yok.
-- Veli açar/kapatır ve saati seçer (şifreli Veli alanı). Saklanan: telefonun bildirim adresi, iki saat, son ders günü,
-- seri sayısı (mesajda kullanmak için). İsim, telefon numarası, e-posta SAKLANMAZ (veri minimizasyonu, KVKK §1-6).
-- Tabloya doğrudan erişim yok (RLS açık, politika yok); uygulama yalnız aşağıdaki fonksiyonları çağırır.
-- VAPID anahtarları kasada (vault: vapid_keys); ilk kez bildirim-gonder fonksiyonu { "kur": true } ile üretir.
-- =====================================================================
create table if not exists public.bildirim_abonelik (
  endpoint    text primary key,
  p256dh      text not null,
  auth        text not null,
  acik        boolean not null default true,
  saat1       time not null default '17:30',
  saat2       time not null default '20:00',
  son_ders    date,
  seri        int not null default 0,
  gonderildi1 date,
  gonderildi2 date,
  olusturma   timestamptz not null default now(),
  guncelleme  timestamptz not null default now()
);
alter table public.bildirim_abonelik enable row level security;
revoke all on public.bildirim_abonelik from anon, authenticated;

-- Saat sınırları: okul sonrası 15.00–19.30, yatmadan önce en geç 20.30; ikisi arasında en az 1 saat
create or replace function public.bildirim_kaydet(p_endpoint text, p_p256dh text, p_auth text, p_saat1 time, p_saat2 time, p_acik boolean, p_son_ders date, p_seri int)
returns boolean language plpgsql security definer set search_path = public as $$
declare s1 time; s2 time;
begin
  if p_endpoint is null or p_endpoint !~ '^https://' or length(p_endpoint) > 1000 or length(coalesce(p_p256dh, '')) not between 20 and 200 or length(coalesce(p_auth, '')) not between 8 and 100 then return false; end if;
  s1 := least(greatest(coalesce(p_saat1, '17:30'), '15:00'), '19:30');
  s2 := least(greatest(coalesce(p_saat2, '20:00'), s1 + interval '1 hour'), '20:30');
  insert into bildirim_abonelik (endpoint, p256dh, auth, acik, saat1, saat2, son_ders, seri)
    values (p_endpoint, p_p256dh, p_auth, coalesce(p_acik, true), s1, s2, p_son_ders, least(greatest(coalesce(p_seri, 0), 0), 9999))
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, acik = excluded.acik, saat1 = excluded.saat1, saat2 = excluded.saat2,
    son_ders = greatest(bildirim_abonelik.son_ders, excluded.son_ders), seri = excluded.seri, guncelleme = now();
  return true;
end $$;

-- Ders bitince (ve uygulama açılınca) çağrılır: o gün hatırlatma gitmesin
create or replace function public.bildirim_ders(p_endpoint text, p_gun date, p_seri int)
returns void language sql security definer set search_path = public as $$
  update bildirim_abonelik set son_ders = greatest(coalesce(son_ders, p_gun), p_gun), seri = least(greatest(coalesce(p_seri, 0), 0), 9999), guncelleme = now()
  where endpoint = p_endpoint and p_gun between current_date - 2 and current_date + 2;
$$;

create or replace function public.bildirim_sil(p_endpoint text)
returns void language sql security definer set search_path = public as $$ delete from bildirim_abonelik where endpoint = p_endpoint; $$;

-- Herkese açık anahtar (applicationServerKey): gizli değildir
create or replace function public.bildirim_acik_anahtar()
returns text language sql stable security definer set search_path = public as $$
  select (decrypted_secret::jsonb) ->> 'pub' from vault.decrypted_secrets where name = 'vapid_keys';
$$;

-- Yalnız sunucu (service_role): özel anahtarı oku / ilk kez yaz
create or replace function public.bildirim_vapid_al()
returns text language sql stable security definer set search_path = public as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'vapid_keys';
$$;
create or replace function public.bildirim_vapid_kaydet(p jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from vault.secrets where name = 'vapid_keys') then return false; end if;
  perform vault.create_secret(p::text, 'vapid_keys', 'Web Push VAPID anahtarları (bildirim-gonder)');
  return true;
end $$;

revoke all on function public.bildirim_kaydet(text, text, text, time, time, boolean, date, int) from public;
revoke all on function public.bildirim_ders(text, date, int) from public;
revoke all on function public.bildirim_sil(text) from public;
revoke all on function public.bildirim_acik_anahtar() from public;
revoke all on function public.bildirim_vapid_al() from public, anon, authenticated;
revoke all on function public.bildirim_vapid_kaydet(jsonb) from public, anon, authenticated;
grant execute on function public.bildirim_kaydet(text, text, text, time, time, boolean, date, int) to anon, authenticated;
grant execute on function public.bildirim_ders(text, date, int) to anon, authenticated;
grant execute on function public.bildirim_sil(text) to anon, authenticated;
grant execute on function public.bildirim_acik_anahtar() to anon, authenticated;
grant execute on function public.bildirim_vapid_al() to service_role;
grant execute on function public.bildirim_vapid_kaydet(jsonb) to service_role;

-- 10 dakikada bir, yalnız Türkiye saatiyle 15.00–20.30 arası (UTC 12.00–17.30) gönderim fonksiyonunu tetikler
create or replace function public.bildirim_tetikle()
returns bigint language sql security definer set search_path = public as $$
  select net.http_post(
    url := 'https://yrhegvpzmjqrwdgrjfer.supabase.co/functions/v1/bildirim-gonder',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-admin-token', (select decrypted_secret from vault.decrypted_secrets where name = 'admin_token')),
    body := '{}'::jsonb, timeout_milliseconds := 60000)
$$;
revoke all on function public.bildirim_tetikle() from public, anon, authenticated;
select cron.unschedule('bildirim-gonder') where exists (select 1 from cron.job where jobname = 'bildirim-gonder');
select cron.schedule('bildirim-gonder', '*/10 12-17 * * *', $$ select public.bildirim_tetikle(); $$);
