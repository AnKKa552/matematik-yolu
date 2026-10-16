# Sunucu kurulumu (Supabase) — telefondan yapılabilir

Bu adımlar bittiğinde uygulama: veli e-postasıyla giriş yapar, ilerlemeyi buluta kaydeder (telefon değişse de kaybolmaz), ligi gerçek öğrencilerle oynatır, her pazar veliye kendiliğinden rapor gönderir ve Pi'nin sesini sunucudan çalar.

Hepsi tarayıcıdan (Chrome) yapılabilir. Toplam süre yaklaşık 30–45 dakika.

---

## 1. Proje aç
1. supabase.com → **Start your project** → GitHub ya da e-postayla kaydol.
2. **New project**: ad `matematik-yolu`, bölge olarak Avrupa'da bir merkez seç (ör. Frankfurt), güçlü bir veritabanı parolası belirle ve bir yere not et.
3. Proje açılınca **Project Settings → API** sayfasından iki değeri kopyala:
   - `Project URL` (https://xxxx.supabase.co)
   - `anon public` anahtarı

> `service_role` anahtarı gizlidir. Asla uygulamaya, `config.js`'e, GitHub'a ya da sohbete yazma.

## 2. Veritabanını kur
1. Sol menü **SQL Editor → New query**.
2. `sunucu/supabase/schema.sql` dosyasının tamamını yapıştır → **Run**. "Success" görmelisin.
   Bu adım tabloları, güvenlik kurallarını (her veli yalnızca kendi çocuğunu görür), lig fonksiyonlarını ve `sesler` deposunu kurar.

## 3. Giriş ayarı
1. **Authentication → Providers → Email** açık olsun ("Confirm email" açık kalabilir).
2. **Authentication → URL Configuration → Site URL**: uygulamanın yayın adresi (ör. `https://kullaniciadin.github.io/matematik-yolu/`).

## 4. Gizli değerleri gir
**Edge Functions → Secrets** (ya da Project Settings → Edge Functions → Secrets):

| Ad | Değer |
|---|---|
| `ELEVENLABS_API_KEY` | ElevenLabs anahtarın (sohbette paylaştığın anahtarı önce ElevenLabs'te **yenile**, yenisini buraya yaz) |
| `ADMIN_TOKEN` | Kendi belirlediğin uzun bir parola (ses üretimini başlatmak için) |
| `RESEND_API_KEY` | resend.com'dan alınan anahtar (e-posta raporu için) |
| `RAPOR_GONDEREN` | `Matematik Yolu <rapor@alanadin.com>` (Resend'de doğrulanmış alan adı gerekir) |
| `WA_TOKEN`, `WA_PHONE_ID`, `WA_TEMPLATE` | WhatsApp Cloud API bilgileri (bkz. adım 8, isteğe bağlı) |

## 5. Fonksiyonları yükle
**Edge Functions → Deploy a new function → Via Editor**:
1. Ad: `seslendir` → `sunucu/supabase/functions/seslendir/index.ts` içeriğini yapıştır → Deploy.
2. Ad: `haftalik-rapor` → `sunucu/supabase/functions/haftalik-rapor/index.ts` içeriğini yapıştır → Deploy.
3. `seslendir` için ayarlarda **Verify JWT** kapalı olsun (kendi `ADMIN_TOKEN` kontrolünü yapıyor).

(Bilgisayardan Supabase CLI ile de yüklenebilir: `supabase functions deploy seslendir`.)

## 6. Pi'nin seslerini sunucuda üret
Termux'ta, proje klasöründe:
```bash
node tools/ses_listesi.js
python3 tools/sunucuda_seslendir.py
```
Proje adresini ve `ADMIN_TOKEN`'ı sorar. 261 konuşma + 9 ses efekti parti parti üretilir ve `sesler` deposuna konur. Yarıda kalırsa tekrar çalıştır; var olanları atlar, kredi harcamaz.

## 7. Zamanlanmış işler
1. **Database → Extensions**: `pg_cron` ve `pg_net`'i aç.
2. SQL Editor'da `sunucu/supabase/zamanlama.sql` içindeki `<PROJE_REF>` ve `<SERVICE_ROLE_KEY>` yerlerini doldurup çalıştır.
   - Her pazartesi 00:05: lig kapanır, ilk 3 yükselir, son 3 düşer.
   - Her pazar 19:00: veli raporları gönderilir.

## 8. WhatsApp raporu (isteğe bağlı, sonra da yapılabilir)
- Meta Business hesabı + WhatsApp Business Platform (Cloud API) gerekir; işletme doğrulaması istenebilir.
- İşletmenin başlattığı mesajlar **onaylı şablon** ister. Şablon önerisi (Türkçe, "utility" kategorisi):
  `{{1}} bu hafta {{2}} gün, {{3}} dakika çalıştı. Doğruluk %{{4}}. Ayrıntılı rapor uygulamada.`
- Mesaj başına Meta ücretlendirmesi vardır; güncel tarife Meta'nın fiyat sayfasında.
- Bu hazır olana kadar raporlar e-postayla gider.

## 9. Uygulamayı sunucuya bağla
`dist/config.js` dosyasını aç:
```js
window.MY_CONFIG = { supabaseUrl: 'https://xxxx.supabase.co', anonKey: 'anon-anahtarın' };
```
Sonra `dist` klasörünü yayınla (GitHub Pages/Netlify). Veli sekmesinde "Bulut hesabı" kartı çıkar; e-posta yazıp giriş bağlantısını açınca kayıt başlar.

## 10. Kontrol listesi
- [ ] Veli sekmesinde giriş yapıldı, "Bulut hesabı bağlı" görünüyor
- [ ] Bir ders bitirince Supabase → Table Editor → `ogrenci_durum` tablosunda satır oluştu
- [ ] `haftalik_xp` tablosunda XP birikiyor, Lig sekmesinde "(demo)" yazısı kalktı
- [ ] `sesler` deposunda `manifest.json` ve mp3 dosyaları var, Pi telefonun sesi yerine kendi sesiyle konuşuyor
- [ ] `haftalik-rapor` fonksiyonu elle çağrıldığında `rapor_kayitlari` tablosuna satır düştü

## Güvenlik notları
- Veli yalnızca kendi çocuğunun verisini görebilir (Row Level Security).
- Ligde yalnızca otomatik takma ad (ör. "Cesur Tilki 42") ve XP görünür; gerçek ad, okul, veli bilgisi asla görünmez.
- Rapor ancak velinin kayıtlı açık rızası varsa gönderilir.
- Yayından önce aydınlatma metni ve açık rıza metni bir KVKK hukukçusuna onaylatılmalı.
