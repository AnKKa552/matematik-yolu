-- =====================================================================
-- İSİMSİZ SORU İSTATİSTİĞİ (06.11.2026, proje sahibinin isteği: "pilot şart değil, bağlanan herkes için")
-- Amaç: uygulamayı geliştirmek için hangi soru kalıbında hata yapıldığını, nerede uzun düşünüldüğünü, hangi
-- yanılgının sık olduğunu ve dersin nerede bırakıldığını görmek.
-- KİŞİYE BAĞLI DEĞİL: telefon cevapları kendi içinde gün gün TOPLAR (ör. "bu kalıpta 3 cevap, 1'i ilk denemede doğru,
-- toplam 52 sn") ve yalnız bu toplamları gönderir. Sunucu da yalnız toplamlara ekler. Cihaz numarası, ad, IP,
-- zaman damgası, cevap sırası SAKLANMAZ; bir satırın hangi çocuktan geldiği bilinemez (anonim veri).
-- Pilot kaydı (pilot.sql, onaylı, cihaz numaralı, ayrıntılı) bundan ayrıdır ve aynen sürer.
-- Ayarlar'dan kapatılabilir ("Uygulamayı geliştirmemize yardım et"). Tablolara doğrudan erişim yok.
--
-- Okuma sorguları (SQL Editor):
--   En zor kalıplar:   select k.beceri, k.metin, sum(s.n) n, round(100.0*sum(s.ilk)/sum(s.n)) ilk_yuzde, round(sum(s.ms_top)/sum(s.n)/1000.0,1) ort_sn
--                      from istat_soru s join istat_kalip k using (kalip) group by 1,2 having sum(s.n) >= 10 order by 4 limit 30;
--   En uzun düşünülen: ... aynı sorgu, order by ort_sn desc
--   Sık yanılgılar:    select m.key mis, sum(m.value::int) n from istat_soru, jsonb_each_text(mis) m group by 1 order by 2 desc;
--   Beceri doğruluğu:  select beceri, sum(n), round(100.0*sum(ilk)/sum(n)) from istat_soru group by 1 order by 3;
--   Ders bırakma:      select mod, beceri, sum(basla), sum(bitti), sum(birak) from istat_ders group by 1,2 order by 5 desc;
--   Bırakılan soru no: select b.key soru, sum(b.value::int) from istat_ders, jsonb_each_text(birak_soru) b group by 1 order by 1::int;
-- =====================================================================
create table if not exists public.istat_soru (
  gun     date not null,
  mod     text not null,
  beceri  text not null,
  sev     smallint not null,
  tur     text not null,
  kalip   text not null,                 -- soru kalıbının 8 haneli özeti (sayılar atılmış metin)
  n       int not null default 0,        -- cevap sayısı
  ilk     int not null default 0,        -- ilk denemede ipucusuz doğru
  ipucu   int not null default 0,        -- ipucuyla ya da ikinci denemede doğru
  cozum   int not null default 0,        -- çözüm gösterildi (yanlış)
  ms_top  bigint not null default 0,     -- toplam düşünme süresi (ms, cevap başına en fazla 10 dk)
  kova    int[] not null default '{0,0,0,0,0}', -- süre dağılımı: <10 sn, 10–30, 30–60, 1–2 dk, 2 dk+
  mis     jsonb not null default '{}',   -- yanılgı → kaç kez
  primary key (gun, mod, beceri, sev, tur, kalip)
);
create table if not exists public.istat_kalip (
  kalip   text primary key,
  beceri  text not null,
  metin   text not null,                 -- uygulamanın ürettiği soru metni, sayılar # ile (çocuk metni değil)
  ilk_gun date not null default current_date
);
create table if not exists public.istat_ders (
  gun        date not null,
  mod        text not null,
  beceri     text not null,              -- karışık derslerde '-'
  basla      int not null default 0,
  bitti      int not null default 0,
  birak      int not null default 0,
  birak_soru jsonb not null default '{}', -- kaçıncı soruda bırakıldı → kaç kez
  primary key (gun, mod, beceri)
);
create table if not exists public.istat_gunluk (gun date primary key, cagri int not null default 0);
alter table public.istat_soru enable row level security;
alter table public.istat_kalip enable row level security;
alter table public.istat_ders enable row level security;
alter table public.istat_gunluk enable row level security;
revoke all on public.istat_soru, public.istat_kalip, public.istat_ders, public.istat_gunluk from anon, authenticated;

-- p: {"soru":[{mod,beceri,sev,tur,kalip,metin,n,ilk,ipucu,cozum,ms,kova:[5],mis:{}}], "ders":[{mod,beceri,basla,bitti,birak,bs:{}}]}
-- Çağrı başına en fazla 200 soru satırı + 50 ders satırı; satır başına en fazla 300 cevap; uygulama geneli günde 100 000 çağrı.
create or replace function public.istatistik_kaydet(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  g date := (now() at time zone 'Europe/Istanbul')::date; o jsonb; k int[]; m jsonb; mk text; mv int; c int;
  n_ int; ilk_ int; ipu_ int; coz_ int; ms_ bigint; alindi int := 0;
begin
  if jsonb_typeof(p) <> 'object' then return jsonb_build_object('ok', false, 'hata', 'bicim'); end if;
  insert into istat_gunluk (gun, cagri) values (g, 1) on conflict (gun) do update set cagri = istat_gunluk.cagri + 1 returning cagri into c;
  if c > 100000 then return jsonb_build_object('ok', false, 'hata', 'sinir'); end if;
  if jsonb_typeof(p->'soru') = 'array' and jsonb_array_length(p->'soru') <= 200 then
    for o in select * from jsonb_array_elements(p->'soru') loop
      continue when jsonb_typeof(o) <> 'object'
        or coalesce(o->>'mod', '') !~ '^[a-z_]{2,15}$' or coalesce(o->>'beceri', '') !~ '^[a-z]_[a-z_]{2,30}$'
        or coalesce(o->>'sev', '') !~ '^[1-3]$' or coalesce(o->>'tur', '') !~ '^[a-z_]{2,12}$'
        or coalesce(o->>'kalip', '') !~ '^[0-9a-f]{8}$';
      begin
        n_ := (o->>'n')::int; ilk_ := coalesce((o->>'ilk')::int, 0); ipu_ := coalesce((o->>'ipucu')::int, 0); coz_ := coalesce((o->>'cozum')::int, 0);
        ms_ := coalesce((o->>'ms')::bigint, 0);
        select array_agg(least(greatest(coalesce(x::int, 0), 0), 300)) into k from jsonb_array_elements_text(coalesce(o->'kova', '[]')) with ordinality t(x, i) where i <= 5;
      exception when others then continue; end;
      continue when n_ is null or n_ < 1 or n_ > 300 or ilk_ < 0 or ipu_ < 0 or coz_ < 0 or ilk_ + ipu_ + coz_ > n_
        or ms_ < 0 or ms_ > n_::bigint * 600000;
      k := coalesce(k, '{}'); while coalesce(array_length(k, 1), 0) < 5 loop k := k || 0; end loop;
      m := '{}';
      if jsonb_typeof(o->'mis') = 'object' then
        for mk, mv in select key, least(greatest(case when value ~ '^[0-9]{1,4}$' then value::int else 0 end, 0), n_) from jsonb_each_text(o->'mis') limit 12 loop
          if mk ~ '^[a-z_]{2,40}$' and mv > 0 then m := m || jsonb_build_object(mk, mv); end if;
        end loop;
      end if;
      insert into istat_soru as s (gun, mod, beceri, sev, tur, kalip, n, ilk, ipucu, cozum, ms_top, kova, mis)
        values (g, o->>'mod', o->>'beceri', (o->>'sev')::smallint, o->>'tur', o->>'kalip', n_, ilk_, ipu_, coz_, ms_, k, m)
        on conflict (gun, mod, beceri, sev, tur, kalip) do update set
          n = s.n + excluded.n, ilk = s.ilk + excluded.ilk, ipucu = s.ipucu + excluded.ipucu, cozum = s.cozum + excluded.cozum,
          ms_top = s.ms_top + excluded.ms_top,
          kova = array[s.kova[1] + excluded.kova[1], s.kova[2] + excluded.kova[2], s.kova[3] + excluded.kova[3], s.kova[4] + excluded.kova[4], s.kova[5] + excluded.kova[5]],
          mis = (select coalesce(jsonb_object_agg(key, v), '{}') from (select key, sum(value::int) v from (select * from jsonb_each_text(s.mis) union all select * from jsonb_each_text(excluded.mis)) u group by key) t);
      if length(coalesce(o->>'metin', '')) between 3 and 300 then
        insert into istat_kalip (kalip, beceri, metin) values (o->>'kalip', o->>'beceri', o->>'metin') on conflict (kalip) do nothing;
      end if;
      alindi := alindi + 1;
    end loop;
  end if;
  if jsonb_typeof(p->'ders') = 'array' and jsonb_array_length(p->'ders') <= 50 then
    for o in select * from jsonb_array_elements(p->'ders') loop
      continue when jsonb_typeof(o) <> 'object' or coalesce(o->>'mod', '') !~ '^[a-z_]{2,15}$'
        or coalesce(o->>'beceri', '') !~ '^([a-z]_[a-z_]{2,30}|-)$';
      begin
        n_ := least(greatest(coalesce((o->>'basla')::int, 0), 0), 100); ilk_ := least(greatest(coalesce((o->>'bitti')::int, 0), 0), 100);
        ipu_ := least(greatest(coalesce((o->>'birak')::int, 0), 0), 100);
      exception when others then continue; end;
      continue when n_ + ilk_ + ipu_ = 0;
      m := '{}';
      if jsonb_typeof(o->'bs') = 'object' then
        for mk, mv in select key, least(greatest(case when value ~ '^[0-9]{1,3}$' then value::int else 0 end, 0), 100) from jsonb_each_text(o->'bs') limit 30 loop
          if mk ~ '^[0-9]{1,2}$' and mv > 0 then m := m || jsonb_build_object(mk, mv); end if;
        end loop;
      end if;
      insert into istat_ders as d (gun, mod, beceri, basla, bitti, birak, birak_soru) values (g, o->>'mod', o->>'beceri', n_, ilk_, ipu_, m)
        on conflict (gun, mod, beceri) do update set basla = d.basla + excluded.basla, bitti = d.bitti + excluded.bitti, birak = d.birak + excluded.birak,
          birak_soru = (select coalesce(jsonb_object_agg(key, v), '{}') from (select key, sum(value::int) v from (select * from jsonb_each_text(d.birak_soru) union all select * from jsonb_each_text(excluded.birak_soru)) u group by key) t);
      alindi := alindi + 1;
    end loop;
  end if;
  return jsonb_build_object('ok', true, 'alindi', alindi);
end $$;
revoke all on function public.istatistik_kaydet(jsonb) from public;
grant execute on function public.istatistik_kaydet(jsonb) to anon, authenticated;
