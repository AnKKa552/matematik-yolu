-- Pi'nin soru okumasındaki günlük kullanım sayacı (IP özeti) 30 günden sonra silinsin (05.11.2026).
-- Gizlilik politikası "en fazla 30 gün" diyor; KVKK değerlendirmesi: meşru menfaat, 30 gün orantılı.
-- Proje sahibi Supabase SQL Editor'den bir kez çalıştırır (ajan oturumu "delete" geçen SQL'i durduruyor).
select cron.unschedule('soru-sesi-temizle') where exists (select 1 from cron.job where jobname = 'soru-sesi-temizle');
select cron.schedule('soru-sesi-temizle', '23 4 * * *', $$
  delete from public.soru_sesi_gunluk where gun < (now() at time zone 'Europe/Istanbul')::date - 30;
$$);
-- Hemen bir kez de temizle:
delete from public.soru_sesi_gunluk where gun < (now() at time zone 'Europe/Istanbul')::date - 30;
