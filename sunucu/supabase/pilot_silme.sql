-- Pilot çalışmanın silme parçası (03.11.2026). Proje sahibi Supabase SQL Editor'den bir kez çalıştırır
-- (ajan oturumu "delete" geçen SQL'i durduruyor). Önce pilot.sql kurulu olmalı.
-- 0) Katılım silinince olaylar da silinsin
alter table public.pilot_olay drop constraint if exists pilot_olay_cihaz_fkey;
alter table public.pilot_olay add constraint pilot_olay_cihaz_fkey foreign key (cihaz) references public.pilot_katilim(cihaz) on delete cascade;

-- 1) Veli "Pilottan ayrıl" deyince o cihazın bütün kayıtları silinir (olaylar katılımla birlikte gider).
create or replace function public.pilot_ayril(p_cihaz text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_cihaz, '') !~ '^[A-Za-z0-9_-]{22}$' then return jsonb_build_object('ok', false, 'hata', 'cihaz'); end if;
  delete from pilot_katilim where cihaz = p_cihaz;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.pilot_ayril(text) from public;
grant execute on function public.pilot_ayril(text) to anon, authenticated;

-- 2) 13 aydan eski olaylar ve 13 aydır hiç olay göndermemiş katılımlar her ayın 1'inde silinir.
select cron.schedule('pilot-temizle', '17 3 1 * *', $$
  delete from public.pilot_olay where zaman < now() - interval '13 months';
  delete from public.pilot_katilim where son < now() - interval '13 months';
$$);
