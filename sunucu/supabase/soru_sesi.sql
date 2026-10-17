-- Pi'nin soru okuması (soru-sesi fonksiyonu) için günlük kota: cihaz (IP özeti) başına ve toplam karakter
create table if not exists public.soru_sesi_gunluk (
  gun date not null default (now() at time zone 'Europe/Istanbul')::date,
  anahtar text not null,
  adet int not null default 0,
  karakter int not null default 0,
  primary key (gun, anahtar)
);
alter table public.soru_sesi_gunluk enable row level security;
revoke all on public.soru_sesi_gunluk from anon, authenticated;

-- Hak varsa sayaçları artırıp true döner; yoksa hiçbir şeyi değiştirmeden false (atomik)
create or replace function public.soru_sesi_hak(p_anahtar text, p_karakter int, p_cihaz_adet int, p_toplam_karakter int)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_gun date := (now() at time zone 'Europe/Istanbul')::date; v_c int; v_t int;
begin
  insert into soru_sesi_gunluk(gun, anahtar) values (v_gun, p_anahtar), (v_gun, 'toplam') on conflict do nothing;
  select adet into v_c from soru_sesi_gunluk where gun = v_gun and anahtar = p_anahtar for update;
  select karakter into v_t from soru_sesi_gunluk where gun = v_gun and anahtar = 'toplam' for update;
  if v_c >= p_cihaz_adet or v_t + p_karakter > p_toplam_karakter then return false; end if;
  update soru_sesi_gunluk set adet = adet + 1, karakter = karakter + p_karakter where gun = v_gun and anahtar in (p_anahtar, 'toplam');
  return true;
end $$;
revoke execute on function public.soru_sesi_hak(text, int, int, int) from public, anon, authenticated;
grant execute on function public.soru_sesi_hak(text, int, int, int) to service_role;
