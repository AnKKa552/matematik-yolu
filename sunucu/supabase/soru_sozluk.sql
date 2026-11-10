-- Pi'nin soru okuması (soru-sesi) için izinli kelimeler: tabloda durur, fonksiyon buradan okur (10 dk bellekte tutar).
-- 10.11.2026: sözlük eskiden fonksiyonun içindeydi (sozluk.ts); her yeni soru kalıbında 17 KB'lık dosyayla fonksiyonu
-- yeniden yüklemek gerekiyordu. Artık yeni kelimeler yalnız tabloya eklenir.
--
-- GÜNCELLEME (üreticiler değişince):
--   1) node tools/soru_sozluk.js          → functions/soru-sesi/sozluk.ts yenilenir
--   2) git push                            (dosya GitHub'da görünür olmalı)
--   3) select net.http_get('https://raw.githubusercontent.com/AnKKa552/matematik-yolu/main/sunucu/supabase/functions/soru-sesi/sozluk.ts');
--      → dönen sayı = istek numarası; birkaç saniye bekle
--   4) insert into public.soru_sozluk (kelime)
--      select jsonb_array_elements_text((regexp_match(content, 'new Set\((\[.*\])\)'))[1]::jsonb)
--      from net._http_response where id = <istek numarası> on conflict do nothing;
--   5) Denetim: select count(*), md5(string_agg(kelime, ',' order by kelime collate "C")) from public.soru_sozluk;
--      Yerelde:  node -e "const l=JSON.parse(require('fs').readFileSync('sunucu/supabase/functions/soru-sesi/sozluk.ts','utf8').match(/new Set\((\[.*\])\)/)[1]);console.log(l.length,require('crypto').createHash('md5').update(l.join(',')).digest('hex'))"
--      (Eski kelimeler tablodan silinmez; tabloda fazladan kelime varsa özet tutmaz ama zararı yoktur: sayı ≥ yerel sayı olmalı.)
create table if not exists public.soru_sozluk (kelime text primary key, eklendi timestamptz not null default now());
alter table public.soru_sozluk enable row level security;   -- politika yok: anon okuyamaz, yazamaz
revoke all on public.soru_sozluk from anon, authenticated;
create or replace function public.soru_sozluk_al() returns jsonb language sql stable security definer set search_path = public as
$$ select coalesce(jsonb_agg(kelime), '[]'::jsonb) from public.soru_sozluk $$;
revoke all on function public.soru_sozluk_al() from public, anon, authenticated;
grant execute on function public.soru_sozluk_al() to service_role;
