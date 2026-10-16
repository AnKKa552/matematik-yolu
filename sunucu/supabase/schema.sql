-- =====================================================================
-- MATEMATİK YOLU — Supabase veritabanı şeması (Faz B)
-- Supabase panelinde: SQL Editor → bu dosyanın tamamını yapıştır → Run
-- Güvenlik: Her tabloda Row Level Security açık. Veli yalnızca kendi
-- çocuklarının verisini görür. Lig ekranına sadece takma ad + XP çıkar.
-- =====================================================================
create extension if not exists pgcrypto;

-- ---------- Veliler (auth.users ile birebir) ----------
create table if not exists public.veliler (
  id uuid primary key references auth.users(id) on delete cascade,
  ad text,
  telefon text,                         -- WhatsApp için, 90 ile başlayan uluslararası biçim
  eposta text,
  rapor_kanali text not null default 'eposta' check (rapor_kanali in ('eposta','whatsapp','ikisi','kapali')),
  olusturma timestamptz not null default now()
);

-- ---------- Açık rıza kayıtları (KVKK) ----------
create table if not exists public.rizalar (
  id bigint generated always as identity primary key,
  veli_id uuid not null references public.veliler(id) on delete cascade,
  metin_surum text not null,            -- örn. 'aydinlatma-v1'
  onay boolean not null,
  zaman timestamptz not null default now()
);

-- ---------- Öğrenciler ----------
create table if not exists public.ogrenciler (
  id uuid primary key default gen_random_uuid(),
  veli_id uuid not null references public.veliler(id) on delete cascade,
  ad text not null,
  takma_ad text not null,               -- ligde görünen ad (gerçek ad gösterilmez)
  dogum_tarihi date,
  sinif int not null default 5,
  lig_kademe int not null default 0 check (lig_kademe between 0 and 4),
  ilk3_sayisi int not null default 0,
  olusturma timestamptz not null default now()
);
create index if not exists ogrenciler_veli_idx on public.ogrenciler(veli_id);

-- ---------- Uygulama durumu (bulut kaydı) ----------
create table if not exists public.ogrenci_durum (
  ogrenci_id uuid primary key references public.ogrenciler(id) on delete cascade,
  durum jsonb not null,                 -- uygulamanın tüm öğrenen modeli (beceriler, yanılgılar, rozetler...)
  surum bigint not null default 1,
  guncelleme timestamptz not null default now()
);

-- ---------- Cevap günlüğü (öğrenen modeli kalibrasyonu için) ----------
create table if not exists public.cevaplar (
  id bigint generated always as identity primary key,
  ogrenci_id uuid not null references public.ogrenciler(id) on delete cascade,
  beceri text not null, seviye int not null, tip text not null,
  dogru boolean not null, kismi boolean not null default false,
  yanilgi text, sure_ms int, ipucu boolean not null default false, telafi boolean not null default false,
  zaman timestamptz not null default now()
);
create index if not exists cevaplar_ogr_idx on public.cevaplar(ogrenci_id, zaman desc);

-- ---------- Lig ----------
create table if not exists public.lig_gruplari (
  id uuid primary key default gen_random_uuid(),
  hafta date not null, kademe int not null,
  uye_sayisi int not null default 0
);
create index if not exists lig_gruplari_idx on public.lig_gruplari(hafta, kademe);
create table if not exists public.haftalik_xp (
  ogrenci_id uuid not null references public.ogrenciler(id) on delete cascade,
  hafta date not null,
  grup_id uuid references public.lig_gruplari(id),
  xp int not null default 0,
  primary key (ogrenci_id, hafta)
);

-- ---------- Abonelik ve rapor günlüğü ----------
create table if not exists public.abonelikler (
  veli_id uuid primary key references public.veliler(id) on delete cascade,
  plan text not null default 'ucretsiz', durum text not null default 'aktif', bitis timestamptz
);
create table if not exists public.rapor_kayitlari (
  id bigint generated always as identity primary key,
  ogrenci_id uuid references public.ogrenciler(id) on delete cascade,
  kanal text, basarili boolean, hata text, zaman timestamptz not null default now()
);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.veliler enable row level security;
alter table public.rizalar enable row level security;
alter table public.ogrenciler enable row level security;
alter table public.ogrenci_durum enable row level security;
alter table public.cevaplar enable row level security;
alter table public.lig_gruplari enable row level security;
alter table public.haftalik_xp enable row level security;
alter table public.abonelikler enable row level security;
alter table public.rapor_kayitlari enable row level security;

create or replace function public.benim_ogrencim(o uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.ogrenciler where id = o and veli_id = auth.uid()) $$;

drop policy if exists veli_kendi on public.veliler;
create policy veli_kendi on public.veliler for all using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists riza_kendi on public.rizalar;
create policy riza_kendi on public.rizalar for all using (veli_id = auth.uid()) with check (veli_id = auth.uid());
drop policy if exists ogr_kendi on public.ogrenciler;
create policy ogr_kendi on public.ogrenciler for all using (veli_id = auth.uid()) with check (veli_id = auth.uid());
drop policy if exists durum_kendi on public.ogrenci_durum;
create policy durum_kendi on public.ogrenci_durum for all using (public.benim_ogrencim(ogrenci_id)) with check (public.benim_ogrencim(ogrenci_id));
drop policy if exists cevap_ekle on public.cevaplar;
create policy cevap_ekle on public.cevaplar for insert with check (public.benim_ogrencim(ogrenci_id));
drop policy if exists cevap_oku on public.cevaplar;
create policy cevap_oku on public.cevaplar for select using (public.benim_ogrencim(ogrenci_id));
drop policy if exists xp_oku on public.haftalik_xp;
create policy xp_oku on public.haftalik_xp for select using (public.benim_ogrencim(ogrenci_id));
drop policy if exists abonelik_oku on public.abonelikler;
create policy abonelik_oku on public.abonelikler for select using (veli_id = auth.uid());
-- lig_gruplari ve rapor_kayitlari: istemciye kapalı (yalnızca fonksiyonlar erişir)

-- =====================================================================
-- LİG FONKSİYONLARI
-- =====================================================================
create or replace function public.bu_hafta() returns date language sql stable as
$$ select (date_trunc('week', (now() at time zone 'Europe/Istanbul')))::date $$;

-- Ders sonunda çağrılır: XP ekler, öğrenciyi gerekirse kademesindeki 10 kişilik bir gruba yerleştirir.
create or replace function public.xp_ekle(p_ogrenci uuid, p_xp int) returns void
language plpgsql security definer set search_path = public as $$
declare v_hafta date := public.bu_hafta(); v_kademe int; v_grup uuid;
begin
  if not public.benim_ogrencim(p_ogrenci) then raise exception 'yetkisiz'; end if;
  if p_xp < 0 or p_xp > 500 then raise exception 'gecersiz xp'; end if;   -- tek derste makul üst sınır
  select grup_id into v_grup from public.haftalik_xp where ogrenci_id = p_ogrenci and hafta = v_hafta;
  if v_grup is null then
    select lig_kademe into v_kademe from public.ogrenciler where id = p_ogrenci;
    select id into v_grup from public.lig_gruplari where hafta = v_hafta and kademe = v_kademe and uye_sayisi < 10 order by uye_sayisi desc limit 1 for update skip locked;
    if v_grup is null then insert into public.lig_gruplari(hafta, kademe) values (v_hafta, v_kademe) returning id into v_grup; end if;
    update public.lig_gruplari set uye_sayisi = uye_sayisi + 1 where id = v_grup;
  end if;
  insert into public.haftalik_xp(ogrenci_id, hafta, grup_id, xp) values (p_ogrenci, v_hafta, v_grup, p_xp)
  on conflict (ogrenci_id, hafta) do update set xp = public.haftalik_xp.xp + excluded.xp, grup_id = coalesce(public.haftalik_xp.grup_id, excluded.grup_id);
end $$;

-- Lig tablosu: sadece takma ad, XP ve sıra döner (gerçek ad, veli bilgisi asla dönmez).
create or replace function public.lig_getir(p_ogrenci uuid)
returns table(sira int, takma_ad text, xp int, ben boolean, kademe int)
language plpgsql security definer set search_path = public as $$
declare v_grup uuid;
begin
  if not public.benim_ogrencim(p_ogrenci) then raise exception 'yetkisiz'; end if;
  select grup_id into v_grup from public.haftalik_xp where ogrenci_id = p_ogrenci and hafta = public.bu_hafta();
  if v_grup is null then return; end if;
  return query
    select (row_number() over (order by h.xp desc))::int, o.takma_ad, h.xp, (o.id = p_ogrenci), o.lig_kademe
    from public.haftalik_xp h join public.ogrenciler o on o.id = h.ogrenci_id
    where h.grup_id = v_grup order by h.xp desc;
end $$;

-- Haftayı kapat (pazartesi 00:05): ilk 3 yükselir, son 3 düşer (grupta en az 6 kişi varsa).
create or replace function public.hafta_kapat() returns void
language plpgsql security definer set search_path = public as $$
declare v_gecen date := public.bu_hafta() - 7; r record;
begin
  for r in
    select h.ogrenci_id, h.xp, g.uye_sayisi,
           row_number() over (partition by h.grup_id order by h.xp desc) as sira,
           count(*) over (partition by h.grup_id) as n
    from public.haftalik_xp h join public.lig_gruplari g on g.id = h.grup_id
    where h.hafta = v_gecen
  loop
    if r.sira <= 3 and r.xp > 0 then
      update public.ogrenciler set lig_kademe = least(4, lig_kademe + 1), ilk3_sayisi = ilk3_sayisi + 1 where id = r.ogrenci_id;
    elsif r.n >= 6 and r.sira > r.n - 3 then
      update public.ogrenciler set lig_kademe = greatest(0, lig_kademe - 1) where id = r.ogrenci_id;
    end if;
  end loop;
end $$;

-- Yeni kullanıcı kaydolunca veli satırı otomatik açılır
create or replace function public.yeni_veli() returns trigger
language plpgsql security definer set search_path = public as $$
begin insert into public.veliler(id, eposta) values (new.id, new.email) on conflict do nothing; return new; end $$;
drop trigger if exists yeni_veli_tetik on auth.users;
create trigger yeni_veli_tetik after insert on auth.users for each row execute function public.yeni_veli();

-- Açık yetkiler ("Yeni tabloları otomatik göster" kapalı kurulum için). Anonim kullanıcıya hiçbir tablo açılmaz.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.veliler, public.rizalar, public.ogrenciler, public.ogrenci_durum to authenticated;
grant select, insert on public.cevaplar to authenticated;
grant select on public.haftalik_xp, public.abonelikler to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.benim_ogrencim(uuid) to authenticated;
grant execute on function public.xp_ekle(uuid, int) to authenticated;
grant execute on function public.lig_getir(uuid) to authenticated;
revoke execute on function public.hafta_kapat() from public, anon, authenticated;

-- =====================================================================
-- SES DEPOSU: herkes okuyabilir, yalnızca sunucu fonksiyonu yazar
-- =====================================================================
insert into storage.buckets (id, name, public) values ('sesler', 'sesler', true) on conflict (id) do nothing;
