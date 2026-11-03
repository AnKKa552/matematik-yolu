-- =====================================================================
-- PİLOT ÇALIŞMA: ANONİM KULLANIM KAYDI (03.11.2026)
-- Amaç: 5–10 aileyle yapılacak pilotta çocukların nerede takıldığını, hangi soruda vazgeçtiğini, hangi yanılgının
-- sık görüldüğünü ve uygulamaya geri gelip gelmediklerini ölçmek (CLAUDE.md §10 metrikleri, §11 B3).
-- Yalnız veli, şifreli Veli alanında "Pilot çalışmaya katıl" onayını verirse açılır (§1-6). Onay metni sürümü saklanır.
-- Kimlik: cihazda üretilen rastgele 22 karakterlik bir anahtar. Ad, telefon, e-posta, aile kodu, oyuncu adı, IP
-- ya da serbest metin SAKLANMAZ. Olaylar yalnız sabit alanlardan oluşur (beceri kimliği, seviye, doğru/yanlış,
-- yanılgı kimliği, süre...). İsteğe bağlı "pilot grubu" araştırmacının verdiği kısa koddur (ör. 5A), kişiyi değil sınıfı gösterir.
-- Tablolara doğrudan erişim yok (RLS açık, politika yok); uygulama yalnız aşağıdaki fonksiyonları çağırır.
-- Ayrılma (verinin silinmesi), katılım silinince olayların da gitmesi ve 13 aydan eski olayların temizliği:
-- pilot_silme.sql (proje sahibi SQL Editor'den çalıştırır; ajan oturumu silme komutu içeren SQL'i durduruyor).
--
-- Araştırmacı sorguları (SQL Editor, servis rolüyle):
--   Katılımcılar:      select grup, count(*), min(olusturma), max(son) from pilot_katilim group by grup;
--   Geri gelme (D1/D7): with g as (select cihaz, date(zaman) gun from pilot_olay group by 1,2), ilk as (select cihaz, min(gun) g0 from g group by 1)
--                      select count(*) filter (where exists (select 1 from g where g.cihaz=ilk.cihaz and g.gun=ilk.g0+1)) d1,
--                             count(*) filter (where exists (select 1 from g where g.cihaz=ilk.cihaz and g.gun between ilk.g0+6 and ilk.g0+8)) d7, count(*) n from ilk;
--   Ders tamamlama:    select veri->>'mod' mod, count(*) filter (where tur='ders_bitti') bitti, count(*) filter (where tur='ders_birak') birakti from pilot_olay group by 1;
--   Vazgeçilen yer:    select veri->>'beceri', veri->>'soru', count(*) from pilot_olay where tur='ders_birak' group by 1,2 order by 3 desc;
--   Beceri doğruluğu:  select veri->>'beceri', count(*), round(100.0*avg(((veri->>'kanit')='ilk')::int)) ilk_yuzde from pilot_olay where tur='cevap' group by 1 order by 3;
--   Sık yanılgılar:    select veri->>'mis', count(*), count(distinct cihaz) from pilot_olay where tur='cevap' and veri->>'mis' is not null group by 1 order by 2 desc;
--   Zor soru kalıbı:   select veri->>'beceri', veri->>'kalip', count(*), round(100.0*avg(((veri->>'kanit')='ilk')::int)) from pilot_olay where tur='cevap' group by 1,2 having count(*)>=5 order by 4;
-- =====================================================================
create table if not exists public.pilot_katilim (
  cihaz      text primary key check (cihaz ~ '^[A-Za-z0-9_-]{22}$'),
  grup       text check (grup is null or grup ~ '^[A-Z0-9-]{1,12}$'),
  riza       text not null,                       -- onay metninin sürümü (ör. pilot-v1)
  olusturma  timestamptz not null default now(),
  son        timestamptz not null default now(),
  gun        date not null default current_date,  -- günlük olay sınırı için
  gun_olay   int not null default 0
);
create table if not exists public.pilot_olay (
  id      bigint generated always as identity primary key,
  cihaz   text not null references public.pilot_katilim(cihaz),
  tur     text not null check (tur in ('acilis', 'ders_basla', 'cevap', 'ders_bitti', 'ders_birak', 'kart', 'test')),
  veri    jsonb not null default '{}',
  zaman   timestamptz not null                     -- olayın cihazdaki zamanı (sunucu zamanına göre sınırlanır)
);
create index if not exists pilot_olay_cihaz_zaman on public.pilot_olay (cihaz, zaman);
create index if not exists pilot_olay_tur on public.pilot_olay (tur);
alter table public.pilot_katilim enable row level security;
alter table public.pilot_olay enable row level security;
revoke all on public.pilot_katilim, public.pilot_olay from anon, authenticated;

-- Katıl (ya da grubu güncelle). Aynı cihaz tekrar katılırsa yalnız grup ve onay sürümü yenilenir.
create or replace function public.pilot_katil(p_cihaz text, p_riza text, p_grup text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare g text := nullif(upper(regexp_replace(coalesce(p_grup, ''), '[^A-Za-z0-9-]', '', 'g')), '');
begin
  if coalesce(p_cihaz, '') !~ '^[A-Za-z0-9_-]{22}$' then return jsonb_build_object('ok', false, 'hata', 'cihaz'); end if;
  if coalesce(p_riza, '') !~ '^pilot-v[0-9]{1,3}$' then return jsonb_build_object('ok', false, 'hata', 'riza'); end if;
  if g is not null and length(g) > 12 then return jsonb_build_object('ok', false, 'hata', 'grup'); end if;
  insert into pilot_katilim (cihaz, grup, riza) values (p_cihaz, g, p_riza)
    on conflict (cihaz) do update set grup = excluded.grup, riza = excluded.riza, son = now();
  return jsonb_build_object('ok', true);
end $$;

-- Olayları toplu gönder. En fazla 100 olay/çağrı, olay başına 1 KB, cihaz başına günde 3000 olay.
-- Bilinmeyen tür ya da fazla büyük olay sessizce atlanır; dönen "alindi" kaç olayın yazıldığını söyler.
create or replace function public.pilot_kaydet(p_cihaz text, p_olaylar jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare k pilot_katilim; o jsonb; n int := 0; z timestamptz;
begin
  if coalesce(p_cihaz, '') !~ '^[A-Za-z0-9_-]{22}$' then return jsonb_build_object('ok', false, 'hata', 'cihaz'); end if;
  select * into k from pilot_katilim where cihaz = p_cihaz;
  if k.cihaz is null then return jsonb_build_object('ok', false, 'hata', 'katilim_yok'); end if;
  if jsonb_typeof(p_olaylar) <> 'array' or jsonb_array_length(p_olaylar) > 100 then return jsonb_build_object('ok', false, 'hata', 'bicim'); end if;
  if k.gun is distinct from current_date then k.gun_olay := 0; end if;
  if k.gun_olay >= 3000 then return jsonb_build_object('ok', false, 'hata', 'sinir'); end if;
  for o in select * from jsonb_array_elements(p_olaylar) loop
    exit when k.gun_olay + n >= 3000;
    continue when jsonb_typeof(o) <> 'object' or (o->>'tur') is null
      or (o->>'tur') not in ('acilis', 'ders_basla', 'cevap', 'ders_bitti', 'ders_birak', 'kart', 'test')
      or jsonb_typeof(coalesce(o->'veri', '{}'::jsonb)) <> 'object' or pg_column_size(coalesce(o->'veri', '{}'::jsonb)) > 1024;
    -- cihaz saati yanlışsa: gelecekteki ya da 30 günden eski zaman sunucu zamanına çekilir
    begin z := to_timestamp((o->>'z')::double precision / 1000); exception when others then z := now(); end;
    if z is null or z > now() + interval '10 minutes' or z < now() - interval '30 days' then z := now(); end if;
    insert into pilot_olay (cihaz, tur, veri, zaman) values (p_cihaz, o->>'tur', coalesce(o->'veri', '{}'::jsonb), z);
    n := n + 1;
  end loop;
  update pilot_katilim set son = now(), gun = current_date, gun_olay = k.gun_olay + n where cihaz = p_cihaz;
  return jsonb_build_object('ok', true, 'alindi', n);
end $$;

revoke all on function public.pilot_katil(text, text, text) from public;
revoke all on function public.pilot_kaydet(text, jsonb) from public;
grant execute on function public.pilot_katil(text, text, text) to anon, authenticated;
grant execute on function public.pilot_kaydet(text, jsonb) to anon, authenticated;
