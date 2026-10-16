-- =====================================================================
-- ZAMANLANMIŞ İŞLER (pg_cron + pg_net)
-- Önce: Database → Extensions → pg_cron ve pg_net'i aç.
-- <PROJE_REF> ve <SERVICE_ROLE_KEY> değerlerini kendi projenle değiştir.
-- Saatler UTC'dir: Türkiye = UTC+3.
-- =====================================================================
-- Pazartesi 00:05 (TR) → pazar 21:05 UTC: haftalık ligi kapat
select cron.schedule('lig-hafta-kapat', '5 21 * * 0', $$ select public.hafta_kapat(); $$);
-- Pazar 19:00 (TR) → 16:00 UTC: veli raporlarını gönder
select cron.schedule('haftalik-veli-raporu', '0 16 * * 0', $$
  select net.http_post(
    url := 'https://<PROJE_REF>.supabase.co/functions/v1/haftalik-rapor',
    headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>', 'Content-Type', 'application/json'),
    body := '{}'::jsonb);
$$);
