-- Hız düzeltmeleri (17.11.2026, Supabase performans denetimi + supabase-postgres-best-practices).
-- Canlıya uygulandı. Hepsi yeniden çalıştırılabilir (idempotent).

-- 1) Bağlantı (foreign key) sütunlarına dizin: Postgres bunları kendiliğinden dizinlemez.
create index if not exists haftalik_xp_grup_idx on public.haftalik_xp (grup_id);
create index if not exists rapor_kayitlari_ogrenci_idx on public.rapor_kayitlari (ogrenci_id);
create index if not exists rizalar_veli_idx on public.rizalar (veli_id);
create index if not exists yonetici_oturum_ad_idx on public.yonetici_oturum (ad);

-- 2) Erişim kurallarında auth.uid() her satırda değil, sorgu başına bir kez hesaplansın.
alter policy veli_kendi on public.veliler using (id = (select auth.uid())) with check (id = (select auth.uid()));
alter policy riza_kendi on public.rizalar using (veli_id = (select auth.uid())) with check (veli_id = (select auth.uid()));
alter policy ogr_kendi on public.ogrenciler using (veli_id = (select auth.uid())) with check (veli_id = (select auth.uid()));
alter policy abonelik_oku on public.abonelikler using (veli_id = (select auth.uid()));

-- 3) Yönetici giriş günlüğüne birincil anahtar.
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.yonetici_kayit'::regclass and contype = 'p') then
    alter table public.yonetici_kayit add column id bigint generated always as identity primary key;
  end if;
end $$;
