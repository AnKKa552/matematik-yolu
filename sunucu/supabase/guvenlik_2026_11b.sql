-- Güvenlik sağlamlaştırması, 2. tur (16.11.2026). guvenlik_2026_11.sql'den sonra çalışır;
-- buradaki tanımlar eski SQL dosyalarındakilerin yerine geçer. Canlıya uygulandı ve denendi (16.11.2026).
-- Silme içeren parça (rızalarda silme yetkisinin kaldırılması, gece temizliği) guvenlik_2026_11b_silme.sql dosyasında; o da canlıda kurulu.

-- 1) Tablo yetkileri: anon ve authenticated için gereksiz TRUNCATE/REFERENCES/TRIGGER yetkileri
--    (PostgREST kullanamaz ama bir yanlış yapılandırmada tabloyu boşaltma yolu açmasın).
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke truncate, references, trigger on public.%I from anon, authenticated', t);
  end loop;
end $$;
alter default privileges in schema public revoke truncate, references, trigger on tables from anon, authenticated;

-- 2) ogrenciler: veli yalnız ad, takma ad ve doğum tarihini yazabilir; lig kademesi ve "ilk 3" sayısı
--    yalnız sunucu fonksiyonlarınca değişir (önceden veli kendi çocuğunu Elmas lige yazabiliyordu).
revoke insert, update on public.ogrenciler from authenticated;
grant insert (veli_id, ad, takma_ad, dogum_tarihi) on public.ogrenciler to authenticated;
grant update (ad, takma_ad) on public.ogrenciler to authenticated;

-- 3) rizalar: veli onay kaydını değiştiremez (onay izi bozulmasın); yalnız ekler ve okur.
revoke update on public.rizalar from authenticated;

-- 4) ogrenci_durum: tek bir kayıt en çok 600 KB (aile yedeğiyle aynı sınır).
alter table public.ogrenci_durum drop constraint if exists ogrenci_durum_boyut;
alter table public.ogrenci_durum add constraint ogrenci_durum_boyut check (pg_column_size(durum) <= 614400) not valid;

-- 5) veliler: e-posta her zaman girişteki e-postadır, telefon yalnız rakam biçimindedir.
--    Önceden giriş yapan biri başkasının e-postasını ya da telefonunu yazıp haftalık raporu oraya yönlendirebilirdi.
create or replace function public.veli_iletisim_denetle()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
begin
  if coalesce(auth.role(), '') = 'authenticated' then
    new.eposta := auth.email();
    if new.telefon is not null then
      new.telefon := nullif(regexp_replace(new.telefon, '[^0-9+]', '', 'g'), '');
      if new.telefon is not null and new.telefon !~ '^\+?[0-9]{10,15}$' then raise exception 'telefon'; end if;
    end if;
    if coalesce(new.rapor_kanali, 'kapali') not in ('kapali', 'eposta', 'whatsapp', 'ikisi') then raise exception 'kanal'; end if;
  end if;
  return new;
end $function$;
revoke all on function public.veli_iletisim_denetle() from public, anon, authenticated;
drop trigger if exists veli_iletisim_denetle on public.veliler;
create trigger veli_iletisim_denetle before insert or update on public.veliler for each row execute function public.veli_iletisim_denetle();

-- 6) xp_ekle: haftalık lig puanı en çok 10 000 (günde 300 XP hedefinin çok üstü; sahte puanla ligi doldurmak kapandı).
create or replace function public.xp_ekle(p_ogrenci uuid, p_xp integer)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare v_hafta date := public.bu_hafta(); v_kademe int; v_grup uuid; v_var int;
begin
  if not public.benim_ogrencim(p_ogrenci) then raise exception 'yetkisiz'; end if;
  if p_xp < 0 or p_xp > 500 then raise exception 'gecersiz xp'; end if;
  select grup_id, xp into v_grup, v_var from public.haftalik_xp where ogrenci_id = p_ogrenci and hafta = v_hafta for update;
  p_xp := least(p_xp, greatest(0, 10000 - coalesce(v_var, 0)));
  if v_grup is null then
    select lig_kademe into v_kademe from public.ogrenciler where id = p_ogrenci;
    select id into v_grup from public.lig_gruplari where hafta = v_hafta and kademe = v_kademe and uye_sayisi < 10 order by uye_sayisi desc limit 1 for update skip locked;
    if v_grup is null then insert into public.lig_gruplari(hafta, kademe) values (v_hafta, v_kademe) returning id into v_grup; end if;
    update public.lig_gruplari set uye_sayisi = uye_sayisi + 1 where id = v_grup;
  end if;
  insert into public.haftalik_xp(ogrenci_id, hafta, grup_id, xp) values (p_ogrenci, v_hafta, v_grup, p_xp)
  on conflict (ogrenci_id, hafta) do update set xp = public.haftalik_xp.xp + excluded.xp, grup_id = coalesce(public.haftalik_xp.grup_id, excluded.grup_id);
end $function$;

-- 7) İsimsiz kayıt fonksiyonlarına ağ başına günlük sınır. Sayaç tek UPDATE ile artar (yarış yok).
--    Ağ kimliği aile_ip_ozet(): x-forwarded-for'un ilk değerinin özeti; IP saklanmaz.
create table if not exists public.ag_sayac (ag text not null, tur text not null, gun date not null, n int not null default 0, primary key (ag, tur, gun));
alter table public.ag_sayac enable row level security;
revoke all on public.ag_sayac from anon, authenticated;

create or replace function public.ag_hak(p_tur text, p_sinir int)
 returns boolean language plpgsql security definer set search_path to 'public'
as $function$
declare n_ int;
begin
  insert into ag_sayac (ag, tur, gun, n) values (public.aile_ip_ozet(), p_tur, current_date, 1)
    on conflict (ag, tur, gun) do update set n = ag_sayac.n + 1 returning n into n_;
  return n_ <= p_sinir;
end $function$;
revoke all on function public.ag_hak(text, int) from public, anon, authenticated;

create or replace function public.pilot_katil(p_cihaz text, p_riza text, p_grup text DEFAULT NULL::text)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare g text := nullif(upper(regexp_replace(coalesce(p_grup, ''), '[^A-Za-z0-9-]', '', 'g')), '');
begin
  if coalesce(p_cihaz, '') !~ '^[A-Za-z0-9_-]{22}$' then return jsonb_build_object('ok', false, 'hata', 'cihaz'); end if;
  if coalesce(p_riza, '') !~ '^(pilot|izin)-v[0-9]{1,3}$' then return jsonb_build_object('ok', false, 'hata', 'riza'); end if;
  if g is not null and length(g) > 12 then return jsonb_build_object('ok', false, 'hata', 'grup'); end if;
  if not public.ag_hak('pilot_katil', 40) then return jsonb_build_object('ok', false, 'hata', 'sinir'); end if;
  insert into pilot_katilim (cihaz, grup, riza) values (p_cihaz, g, p_riza)
    on conflict (cihaz) do update set grup = excluded.grup, riza = excluded.riza, son = now();
  return jsonb_build_object('ok', true);
end $function$;

create or replace function public.pilot_kaydet(p_cihaz text, p_olaylar jsonb)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare k pilot_katilim; o jsonb; n int := 0; z timestamptz;
begin
  if coalesce(p_cihaz, '') !~ '^[A-Za-z0-9_-]{22}$' then return jsonb_build_object('ok', false, 'hata', 'cihaz'); end if;
  select * into k from pilot_katilim where cihaz = p_cihaz for update;
  if k.cihaz is null then return jsonb_build_object('ok', false, 'hata', 'katilim_yok'); end if;
  if jsonb_typeof(p_olaylar) <> 'array' or jsonb_array_length(p_olaylar) > 100 then return jsonb_build_object('ok', false, 'hata', 'bicim'); end if;
  if k.gun is distinct from current_date then k.gun_olay := 0; end if;
  if k.gun_olay >= 3000 then return jsonb_build_object('ok', false, 'hata', 'sinir'); end if;
  if not public.ag_hak('pilot_kaydet', 3000) then return jsonb_build_object('ok', false, 'hata', 'sinir'); end if;
  for o in select * from jsonb_array_elements(p_olaylar) loop
    exit when k.gun_olay + n >= 3000;
    continue when jsonb_typeof(o) <> 'object' or (o->>'tur') is null
      or (o->>'tur') not in ('acilis', 'ders_basla', 'cevap', 'ders_bitti', 'ders_birak', 'kart', 'test')
      or jsonb_typeof(coalesce(o->'veri', '{}'::jsonb)) <> 'object' or pg_column_size(coalesce(o->'veri', '{}'::jsonb)) > 1024;
    begin z := to_timestamp((o->>'z')::double precision / 1000); exception when others then z := now(); end;
    if z is null or z > now() + interval '10 minutes' or z < now() - interval '30 days' then z := now(); end if;
    insert into pilot_olay (cihaz, tur, veri, zaman) values (p_cihaz, o->>'tur', coalesce(o->'veri', '{}'::jsonb), z);
    n := n + 1;
  end loop;
  update pilot_katilim set son = now(), gun = current_date, gun_olay = k.gun_olay + n where cihaz = p_cihaz;
  return jsonb_build_object('ok', true, 'alindi', n);
end $function$;

-- istatistik_kaydet: gövde aynı kalır, başına ağ sınırı eklenir (sarmalayıcı yerine yeniden adlandırma).
do $$ declare d text; begin
  select pg_get_functiondef('public.istatistik_kaydet(jsonb)'::regprocedure) into d;
  if position('ag_hak(' in d) = 0 then
    d := replace(d, E'  if jsonb_typeof(p) <> ''object'' then return jsonb_build_object(''ok'', false, ''hata'', ''bicim''); end if;\n',
      E'  if jsonb_typeof(p) <> ''object'' then return jsonb_build_object(''ok'', false, ''hata'', ''bicim''); end if;\n  if not public.ag_hak(''istat'', 2000) then return jsonb_build_object(''ok'', false, ''hata'', ''sinir''); end if;\n');
    if position('ag_hak(' in d) = 0 then raise exception 'istatistik_kaydet beklenen biçimde değil'; end if;
    execute d;
  end if;
end $$;

-- 8) yonetici_giris: kilitliyken de cevap "yanlis" (ad var mı yok mu, şifre doğru mu anlaşılmasın).
--    Kilitliyken şifre denetlenmez; her durumda aynı süre (bcrypt) harcanır.
create or replace function public.yonetici_giris(p_ad text, p_sifre text)
 returns jsonb language plpgsql security definer set search_path to 'public', 'extensions'
as $function$
declare y yonetici; ad_ text := lower(trim(coalesce(p_ad, ''))); b text;
begin
  if public.yonetici_ag_sinir(false) then insert into yonetici_kayit (olay, ad, ag) values ('sinir', left(ad_, 30), public.yonetici_ag()); return jsonb_build_object('ok', false, 'hata', 'sinir'); end if;
  select * into y from yonetici where ad = ad_ for update;
  if y.ad is null or y.sifre is null then
    perform extensions.crypt(coalesce(p_sifre, ''), extensions.gen_salt('bf', 12));
    perform public.yonetici_ag_sinir(true); insert into yonetici_kayit (olay, ad, ag) values ('yanlis', left(ad_, 30), public.yonetici_ag());
    return jsonb_build_object('ok', false, 'hata', 'yanlis');
  end if;
  if y.kilit is not null and y.kilit > now() then
    perform extensions.crypt(coalesce(p_sifre, ''), extensions.gen_salt('bf', 12));
    perform public.yonetici_ag_sinir(true);
    insert into yonetici_kayit (olay, ad, ag) values ('kilitli', ad_, public.yonetici_ag());
    return jsonb_build_object('ok', false, 'hata', 'yanlis');
  end if;
  if y.kilit is not null then update yonetici set yanlis = 0, kilit = null where ad = ad_; end if;
  if extensions.crypt(coalesce(p_sifre, ''), y.sifre) <> y.sifre then
    perform public.yonetici_ag_sinir(true);
    update yonetici set yanlis = yanlis + 1, kilit = case when yanlis + 1 >= 5 then now() + interval '30 minutes' else kilit end where ad = ad_;
    insert into yonetici_kayit (olay, ad, ag) values ('yanlis', ad_, public.yonetici_ag());
    return jsonb_build_object('ok', false, 'hata', 'yanlis');
  end if;
  b := encode(extensions.gen_random_bytes(32), 'hex');
  insert into yonetici_oturum (belirtec_ozet, ad, bitis) values (encode(extensions.digest(b, 'sha256'), 'hex'), ad_, now() + interval '8 hours');
  update yonetici set yanlis = 0, kilit = null, son_giris = now() where ad = ad_;
  insert into yonetici_kayit (olay, ad, ag) values ('giris', ad_, public.yonetici_ag());
  return jsonb_build_object('ok', true, 'belirtec', b, 'ad', ad_);
end $function$;
