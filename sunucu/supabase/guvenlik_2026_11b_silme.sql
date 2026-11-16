-- guvenlik_2026_11b.sql'in silme içeren parçası. Canlıda kurulu (16.11.2026, cron işi guvenlik-temizle).

-- Veli onay kaydını silemesin (onay izi korunsun).
revoke delete on public.rizalar from authenticated;

-- Ağ sayaçları (ag_sayac) 3 günden, isimsiz istatistik toplamları 400 günden eski olunca her gece silinir.
select cron.schedule('guvenlik-temizle', '41 3 * * *', $$
  delete from public.ag_sayac where gun < current_date - 3;
  delete from public.istat_soru where gun < current_date - 400;
  delete from public.istat_ders where gun < current_date - 400;
  delete from public.istat_ziyaret where gun < current_date - 400;
  delete from public.istat_gunluk where gun < current_date - 400;
$$);
