# Matematik Yolu — Google Play'e taşıma rehberi (10.11.2026)

Bu klasördeki görseller ve metinler Play Console'a doğrudan yüklenir/yapıştırılır.
Kurallar 10.11.2026'da Google'ın yardım sayfalarından doğrulandı; Play Console ekranlarındaki adlar zamanla değişebilir.

## 0. Sıra (özet)
1. PWABuilder ile Android paketini (.aab) üret (kendi yükleme anahtarınla).
2. Play Console'da uygulamayı oluştur, mağaza sayfasını ve beyanları doldur (aşağıdaki metinler).
3. **Kapalı test** aç, .aab'yi yükle, **en az 12 test kullanıcısını** ekle. Hepsi **14 gün kesintisiz** testte kalmalı.
4. «Uygulama bütünlüğü → Uygulama imzalama» sayfasındaki **uygulama imzalama anahtarı SHA-256** parmak izini Claude'a gönder (sitede `assetlinks.json`'a eklenecek; eklenmezse uygulamanın üstünde adres çubuğu görünür).
5. 14 gün dolunca Kontrol Paneli → **«Üretime başvur»** (inceleme genelde 7 gün ya da daha kısa).

## 1. Paket (PWABuilder)
- pwabuilder.com → adres: `https://matematikyolu.com` → **Package for stores → Android → Options**
- Package ID: `com.matematikyolu.app` · App name: `Matematik Yolu` · Launcher name: `Matematik Yolu`
- Version: `1.0.0` · Version code: `1`
- **Signing key: «Use mine»** → `matematikyolu-yukleme.jks`, alias `matematikyolu`, iki şifre (anahtar sende; depoda yok, kimseyle paylaşma)
- **Location delegation: KAPALI** (çocuk uygulamasında konum izni istenmez)
- **Google Play billing: KAPALI** (satış yok)
- Notification delegation: AÇIK (veli bildirimleri için)
- İndirilen zip'ten `.aab` dosyası Play'e yüklenir. Zip'teki `assetlinks.json`'u siteye koymaya gerek yok (zaten var).

## 2. Mağaza sayfası (Ana mağaza girişi)
**Uygulama adı (en çok 30):** Matematik Yolu: 5. Sınıf
**Kısa açıklama (en çok 80):** 5. sınıf matematiği: sesli anlatım, hatadan öğrenme ve veliye ayrıntılı rapor.

**Tam açıklama:**
```
Matematik Yolu, 5. sınıf öğrencilerinin matematiği adım adım, oynar gibi öğrenmesi için hazırlandı. Maarif Modeli 5. sınıf matematik programındaki 35 konunun hepsi, ders kitabındaki sırayla tek bir haritada.

NASIL ÇALIŞIR?
• Kısa dersler: 6–10 soru, birkaç dakika. Her gün küçük bir adım.
• Pi konuşur: Maskotumuz Pi soruları ve konu anlatımlarını sesli okur. Okumakta zorlanan çocuk da rahat çalışır.
• Hata ceza değil, ipucu: Yanlış cevapta puan düşmez. Pi önce ipucu verir, sonra yanlışın NEDENİNİ anlatır ve daha kolay bir soruyla toparlar.
• Konuyu 4 yolla anlatır: Görsel model, hikâye, adım adım ve kısa kural. Uygulama hangi anlatımın çocuğunuza işe yaradığını cevaplarından ölçer.
• Parmağınla kur: Kesri boya, açıölçerle açıyı çiz, sütun grafiğini kendin yap.
• Hata Avcısı: Başka bir öğrencinin çözümündeki hatayı bul, kim haklı karar ver. Muhakeme gelişir.
• Problem Atölyesi: Çok adımlı gerçek hayat problemlerini anla, planla, çöz, kontrol et.
• Tekrar zamanı: Unutulmaya başlayan konuları zamanında yeniden sorar.

VELİLER İÇİN
• Şifreli veli bölümü: Çocuğunuz hangi konuda güçlü, nerede zorlanıyor ve NEDEN zorlanıyor; hangi kavram yanılgıları sürüyor, hangileri düzeldi.
• Okul takvimine göre «bu hafta okulda işlenen konu» ve kişisel haftalık plan.
• Raporu tek dokunuşla WhatsApp, Telegram ya da e-postayla paylaşabilirsiniz.

GÜVENLİ VE SADE
• Reklam yok. Satın alma yok.
• Hesap açmak gerekmez; ilerleme telefonda tutulur.
• Bulut yedeği ve isimsiz kullanım kaydı yalnız velinin onayıyla açılır.
• Can/kalp sistemi yok; ders hiçbir zaman kilitlenmez.
• Aynı telefonda kardeşler ayrı ayrı oynayabilir.

Matematik Yolu, Millî Eğitim Bakanlığının resmî uygulaması değildir; MEB 5. sınıf matematik programını izleyen bağımsız bir eğitim uygulamasıdır. Sorular ve anlatımlar özgündür, ders kitabından kopyalanmamıştır.

Gizlilik: https://matematikyolu.com/gizlilik/
Destek: destek@matematikyolu.com
```
**Grafikler:** uygulama simgesi `simge_512.png` (512×512) · öne çıkan görsel `tanitim_1024x500.png` · telefon ekran görüntüleri `ekran_*.png` (1080×1920, 8 adet, bu sırayla).
**Kategori:** Eğitim · **Etiketler:** Eğitim, Matematik (Play'in listesinden en yakınları)
**İletişim:** e-posta `destek@matematikyolu.com` · web sitesi `https://matematikyolu.com`
**Gizlilik politikası:** `https://matematikyolu.com/gizlilik/`

## 3. Uygulama içeriği (beyanlar)
- **Uygulama erişimi:** «Tüm işlevler özel erişim gerekmeden kullanılabilir.» (Veli bölümünün 4 rakamlı şifresini ilk girişte kullanıcı kendisi belirler; ayrı bir hesap yok.)
- **Reklamlar:** Hayır, uygulamada reklam yok.
- **Reklam kimliği (Advertising ID):** Hayır, kullanılmıyor.
- **İçerik derecelendirmesi (IARC anketi):** kategori olarak eğitim/referans türünü seç; şiddet, korku, cinsellik, kumar, uyuşturucu, küfür: hepsi **Hayır**. Kullanıcıların birbirleriyle iletişimi/sohbet: **Hayır** (lig rakipleri demo, mesajlaşma yok). Konum paylaşımı: **Hayır**. Dijital satın alma: **Hayır**. Beklenen sonuç: herkes için (3+ / Genel).
- **Hedef kitle ve içerik:** yaş grubu **9–12** (yalnız bu). Uygulama çocuklara yöneliktir → Google Play **Aileler politikası** geçerli: reklam yok, konum yok, cihaz kimliği (AAID, IMEI vb.) gönderilmiyor, gizlilik politikası var. «Çocuklara hitap edebilir» uyarılarına uygun cevap ver.
- **Haber uygulaması:** Hayır · **Sağlık / finans / devlet uygulaması:** Hayır (MEB'in resmî uygulaması değildir).
- **Veri güvenliği:** aşağıdaki bölüm.

## 4. Veri güvenliği formu (taslak — KVKK hukukçusuna da gösterilmeli)
Genel sorular:
- Uygulama kullanıcı verisi topluyor ya da paylaşıyor mu? **Evet** (aşağıdakiler; çoğu isteğe bağlı).
- Toplanan veriler aktarım sırasında şifreleniyor mu? **Evet** (her bağlantı HTTPS).
- Kullanıcılar verilerinin silinmesini isteyebilir mi? **Evet** → `https://matematikyolu.com/veri-sil/`
- Veriler üçüncü taraflarla **paylaşılıyor mu? Hayır.** (Supabase, ElevenLabs gibi sağlayıcılar bizim adımıza çalışan hizmet sağlayıcıdır; Play'in tanımında «paylaşım» sayılmaz.)

Toplanan veri türleri:
| Play'deki tür | Ne | Zorunlu mu? | Amaç |
|---|---|---|---|
| Kişisel bilgiler → **Ad** | Çocuğun adı/rumuzu, yalnız bulut yedeği açılırsa yedeğin içinde | İsteğe bağlı (veli onayı) | Uygulama işlevi (yedek, telefon değişince geri yükleme) |
| Uygulama etkinliği → **Uygulama etkileşimleri** | Çözülen sorular, ilerleme (yedekte); isimsiz soru istatistiği (toplamlar) | Yedek isteğe bağlı; istatistik varsayılan açık, Ayarlar'dan kapatılabilir | Uygulama işlevi; analiz (uygulamayı geliştirme) |
| Cihaz veya diğer kimlikler | Uygulamanın ürettiği rastgele numara (yalnız onaylı kullanım kaydında); bildirim adresi (veli bildirimi açarsa) | İsteğe bağlı | Analiz; uygulama işlevi (bildirim) |

Her türde: **«Veriler geçici olarak mı işleniyor?» Hayır** · **«Kullanıcıyla ilişkilendiriliyor mu?»** isimsiz istatistik için Hayır; yedek ve kullanım kaydı için Evet (rastgele kodla).
Toplanmayanlar: konum, kişiler, fotoğraf, mikrofon, telefon numarası, e-posta (haftalık rapor e-postası şu an kapalı; açılırsa «E-posta adresi» eklenmeli), reklam kimliği.
> Not: Soru seslendirmesinde kötüye kullanımı önlemek için IP adresinin **özeti** günlük sayaçta tutulur ve 30 günde silinir. Bunun «Cihaz veya diğer kimlikler → Dolandırıcılık önleme, güvenlik» olarak eklenip eklenmeyeceği hukukçuya sorulmalı (temkinli seçim: ekle).

## 5. Kapalı test
- Test → **Kapalı test** → yeni kanal (ör. «Pilot aileler») → `.aab` yükle → sürüm notu: «İlk sürüm».
- Test kullanıcıları: e-posta listesi (Google hesapları) ya da Google Grubu. **En az 12 kişi, 14 gün kesintisiz.** Ayrılıp yeniden katılan kişinin 14 günü baştan sayılır.
- Kişilere «katılım bağlantısını» gönder; bağlantıyı açıp **«Test kullanıcısı ol»** demeleri ve uygulamayı Play'den yüklemeleri gerekir.
- 14 gün içinde uygulamayı gerçekten kullanmaları önemli: Google «düşük katılım» gerekçesiyle üretim başvurusunu geri çevirebiliyor.

## 6. Üretime başvuru
Kontrol Paneli → «Üretime başvur»: üç bölüm (kapalı test, uygulama, üretime hazırlık). Cevaplar için örnek:
- Test kullanıcılarını nasıl buldun? «Pilot çalışmaya katılan 5. sınıf aileleri ve öğretmenler.»
- Ne geri bildirim aldın, ne değiştirdin? (Pilotta gerçekten değişenleri yaz: ör. çark renkleri, anlatım kartlarının dili, yeni soru tipleri.)

Kaynaklar: [Yeni kişisel geliştirici hesapları için test şartları](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en) · [Aileler politikası](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)
