-- Öğretmen soru inceleme paneli (CLAUDE.md §5 adım 6). 17.10.2026'da uygulandı (migration: ogretmen_inceleme_paneli, ogretmen_inceleme_kod_kontrol).
-- Tablolar doğrudan erişime kapalı (RLS açık, politika yok). Yazma/okuma yalnız davet kodunu denetleyen fonksiyonlarla.
-- Yeni öğretmen daveti:  insert into public.inceleme_kodlari (kod, ad) values ('ogr-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12), 'Ad Soyad') returning kod;
-- Davet iptali:          update public.inceleme_kodlari set aktif = false where kod = '...';
-- Sonuçları okuma:       select beceri, soru_id, karar, etiketler, aciklama, inceleyen, zaman from public.soru_incelemeleri order by zaman desc;
create table if not exists public.inceleme_kodlari (kod text primary key, ad text, aktif boolean not null default true, olusturma timestamptz not null default now());
create table if not exists public.soru_incelemeleri (
  id bigint generated always as identity primary key,
  kod text not null references public.inceleme_kodlari(kod) on delete cascade,
  inceleyen text, soru_id text not null, beceri text, seviye int,
  karar text not null check (karar in ('uygun','duzelt','uygun_degil')),
  etiketler text[] not null default '{}', aciklama text, soru jsonb, surum text,
  zaman timestamptz not null default now(), unique (kod, soru_id));
alter table public.inceleme_kodlari enable row level security;
alter table public.soru_incelemeleri enable row level security;
create or replace function public.inceleme_kaydet(p_kod text, p_inceleyen text, p_soru_id text, p_beceri text, p_seviye int,
  p_karar text, p_etiketler text[], p_aciklama text, p_soru jsonb, p_surum text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from inceleme_kodlari where kod = p_kod and aktif) then return false; end if;
  if length(coalesce(p_soru_id,'')) not between 3 and 80 or length(coalesce(p_aciklama,'')) > 2000
     or length(coalesce(p_inceleyen,'')) > 80 or pg_column_size(p_soru) > 40000 or coalesce(array_length(p_etiketler,1),0) > 10 then
    raise exception 'gecersiz';
  end if;
  insert into soru_incelemeleri (kod, inceleyen, soru_id, beceri, seviye, karar, etiketler, aciklama, soru, surum)
  values (p_kod, p_inceleyen, p_soru_id, p_beceri, p_seviye, p_karar, coalesce(p_etiketler,'{}'), p_aciklama, p_soru, p_surum)
  on conflict (kod, soru_id) do update set inceleyen = excluded.inceleyen, karar = excluded.karar, etiketler = excluded.etiketler,
    aciklama = excluded.aciklama, soru = excluded.soru, surum = excluded.surum, zaman = now();
  return true;
end $$;
create or replace function public.inceleme_listesi(p_kod text)
returns table (soru_id text, karar text, etiketler text[], aciklama text, zaman timestamptz)
language sql stable security definer set search_path = public as $$
  select i.soru_id, i.karar, i.etiketler, i.aciklama, i.zaman from soru_incelemeleri i
  join inceleme_kodlari k on k.kod = i.kod and k.aktif where i.kod = p_kod;
$$;
create or replace function public.inceleme_kod_gecerli(p_kod text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from inceleme_kodlari where kod = p_kod and aktif);
$$;
revoke all on function public.inceleme_kaydet(text,text,text,text,int,text,text[],text,jsonb,text) from public;
revoke all on function public.inceleme_listesi(text) from public;
revoke all on function public.inceleme_kod_gecerli(text) from public;
grant execute on function public.inceleme_kaydet(text,text,text,text,int,text,text[],text,jsonb,text) to anon, authenticated;
grant execute on function public.inceleme_listesi(text) to anon, authenticated;
grant execute on function public.inceleme_kod_gecerli(text) to anon, authenticated;
