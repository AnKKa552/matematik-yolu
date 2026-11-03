-- Oyuncu girişinin silme parçası (03.11.2026). Proje sahibi Supabase SQL Editor'den bir kez çalıştırır
-- (ajan oturumu "delete" geçen SQL'i durduruyor).
-- Bulut yedeği silinince (veli "Yedeği sil" dediğinde ya da 18 ay kullanılmayınca) bağlı oyuncu adı ve resimli şifre de silinir.
alter table public.oyuncu_giris drop constraint if exists oyuncu_giris_yedek_fk;
alter table public.oyuncu_giris add constraint oyuncu_giris_yedek_fk
  foreign key (kod_ozet) references public.aile_yedek(kod_ozet) on delete cascade;
