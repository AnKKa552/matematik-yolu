-- AİLE YEDEĞİ: silme parçaları (25.10.2026)
-- aile_yedek.sql'in geri kalanı sunucuda kurulu. Bu iki parça, içinde silme komutu geçtiği için ajan oturumundan
-- çalıştırılamadı (oturum silme içeren komutları durdurdu). Supabase paneli → SQL Editor'e yapıştırıp bir kez çalıştırın.
-- 1) Velinin "Yedeği sil" düğmesi (KVKK: silme hakkı)
create or replace function public.aile_yedek_sil(p_kod text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not aile_kod_gecerli(p_kod) then return false; end if;
  delete from aile_yedek where kod_ozet = aile_kod_ozet(p_kod);
  return found;
end $$;
revoke all on function public.aile_yedek_sil(text) from public;
grant execute on function public.aile_yedek_sil(text) to anon, authenticated;
-- 2) Saklama süresi: 18 ay dokunulmayan yedek ve eski deneme sayaçları her ayın 1'inde silinir
select cron.unschedule('aile-yedek-temizle') where exists (select 1 from cron.job where jobname = 'aile-yedek-temizle');
select cron.schedule('aile-yedek-temizle', '17 3 1 * *', $c$
  delete from public.aile_yedek where guncelleme < now() - interval '18 months';
  delete from public.aile_yedek_deneme where gun < current_date - 7;
$c$);
