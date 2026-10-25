# MATEMATİK YOLU — Ana Şartname (sistemin beyni)

> Bu dosya, bu projede çalışan her yapay zekâ ajanının (Claude, Gemini vb.) ve her geliştiricinin **ilk okuyacağı** belgedir.
> Kurallar "MUTLAKA / ASLA" diye yazıldıysa pazarlık konusu değildir. Bir istek bu belgeyle çelişirse, işe başlamadan önce çelişkiyi proje sahibine bildir.
> Geliştirme ortamı: Android telefon + Termux.

---

## 0. Görev tanımı (tek cümle)

**5. sınıf öğrencisine Maarif Modeli matematiğini, Duolingo'nun alışkanlık ve oyun mekaniklerini tersine mühendislikle kendimize uyarlayarak, her öğrencinin öğrenme biçimine göre anlatan, hatasından öğreten ve sevdiren; veliye düzenli rapor veren, ücretli satılabilir bir mobil uygulama yapmak.**

Temel felsefe: *Her öğrenci başka bir çiçektir.* Sistem öğrenciyi etiketlemez; **cevaplarından ve davranışından ölçer**, ona göre anlatımı, zorluğu, tempoyu ve motivasyon dilini ayarlar.

---

## 1. Değişmez kurallar

1. **Tek bilgi kaynağı müfredattır.** Konu, beceri ve sıra yalnızca `data/mufredat.json` dosyasından gelir (MEB 5. Sınıf Matematik 1. ve 2. kitap, 7 tema, 35 beceri). Müfredat dışı konu ekleme.
2. **Hiçbir sorunun cevabı tahminle üretilmez.** Her soru parametrik bir üreticiden (`src/generators.js`) çıkar ve cevabı **kodla hesaplanır**. LLM yalnızca dil, hikâye ve açıklama metni yazabilir. LLM'in yazdığı her sayısal ifade, yayına girmeden önce kodla yeniden hesaplanıp karşılaştırılır.
3. **Her yanlış şık bir kavram yanılgısına bağlıdır.** Rastgele çeldirici yoktur. Çeldirici, belgelenmiş bir öğrenci hatasından türetilir (`MIS` kataloğu, 105 yanılgı). Bu sayede sistem öğrencinin *neyi neden* yanlış yaptığını bilir.
4. **Kitap = referans kalıp, asla kopya.** Ders kitabındaki her soru tipi bir "kalıp" olarak incelenir; uygulamada o kalıptan **yeni sayılar, yeni bağlam ve yeni metinle** sınırsız varyasyon üretilir. Her varyasyon `q.ref` alanında esinlendiği kitap sayfasını taşır (öğretmen izi; öğrenciye "📗 Kitabındaki soruya benzer · 1. kitap s. 109" olarak görünür). Bkz. §5.2.
5. **Telif:** MEB kitabının 2. sayfasında şu yazar: *"Her hakkı saklıdır ve Millî Eğitim Bakanlığına aittir. Kitabın metin, soru ve şekilleri kısmen de olsa hiçbir surette alınıp yayımlanamaz."* Bu nedenle ticari üründe:
   - ✅ Kazanımlar, konu adları, kavram listesi, tema sırası ve konuların **bizim kelimelerimizle yeniden anlatımı** serbesttir; fikirler ve müfredat telif konusu değildir. Öğrenci arayüzünde sayfa numarası gösterilmez (müfredat zaten belli); sayfa bilgisi yalnızca iç veride tutulur.
   - ❌ Kitabın metni, soruları, etkinlikleri, görselleri ve sayfa görüntüleri uygulamaya **konmaz**. `assets/` içindeki sayfa görüntüleri yalnızca geliştirici incelemesi içindir, ürüne girmez.
   - Bütün sorular ve anlatımlar özgündür.
6. **Çocuk güvenliği ve KVKK:** Öğrenciler reşit değildir. Kişisel veri toplamadan önce **velinin açık rızası** ve aydınlatma metni gerekir. Gereğinden fazla veri toplanmaz (veri minimizasyonu). Ürün yayına çıkmadan önce aydınlatma metni, açık rıza metni ve veri işleme süreçleri bir KVKK hukukçusuna onaylatılır.
7. **Karanlık desen yok:** Can/kalp bitti diye ders kilitlenmez. Para karşılığı "can" satılmaz. Çocuğu suçlayan bildirim ("Duo üzgün…" tarzı) gönderilmez. Çocuk uygulamasında reklam gösterilmez.
8. **Hata ceza değil, veridir.** Yanlış cevaptan sonra puan düşmez; öğrenci açıklama görür ve bir alt seviyeden **telafi sorusu** çözer. Telafiyi doğru yapınca *daha fazla* XP alır (+15, normal doğru +10).

---

## 2. Duolingo tersine mühendislik tablosu

| Duolingo mekaniği | Psikolojik işlevi | Matematik Yolu uyarlaması | Durum |
|---|---|---|---|
| Kıvrımlı öğrenme yolu (path) | Tek net "sonraki adım", ilerlemeyi görünür kılar | Tek harita (Matematik Diyarı), kitaptaki sıra, düğümde yıldız/taç; okul konusu «🏫» ile işaretli (§3.4) | ✅ Prototipte |
| Kısa dersler (3–5 dk) | Başlama eşiğini düşürür | 6–10 soruluk ders; uzunluk öğrencinin hızına göre ayarlanır | ✅ |
| XP + günlük hedef | Küçük, sık ödül | Doğru 10, telafi doğru 15, 5'li seri +5, ders sonu +15, kusursuz +10; günlük hedef 20/50/80/120 | ✅ |
| Seri (streak) + seri dondurucu | Alışkanlık oluşturma, kayıp kaçınma | Günlük seri + elmasla alınan "seri koruyucu" (ceza değil, güvence). Gelinmeyen günlerde kendiliğinden kullanılır, en fazla 2 taşınır (§3.2) | ✅ |
| Haftalık ligler (10 lig, ilk sıralar yükselir) | Sosyal karşılaştırma, rekabet | 5 lig (Bronz→Elmas), 10 kişilik grup, ilk 3 yükselir | ✅ Demo rakiplerle; gerçek eşleşme sunucu fazında |
| Elmas (gems), sandık | Değişken ödül | Ders sonu, yol ve hazine sandıklarından elmas (ahşap/nadir/efsane, dokun-dokun açılır, §2.1); elmas yalnız seri koruyucuya ve Pi'nin dolabına (kostüm, iz rengi) harcanır, parayla satılmaz | ✅ |
| Kalp/can | Dikkat, aynı zamanda abonelik satışı | **Alınmadı.** Yerine "telafi sorusu" | ❌ bilinçli |
| Maskot (Duo) | Duygusal bağ, geri bildirim | Özgün maskot **Pi** (17.10.2026'dan itibaren: mavi, ters kasketli 3B karakter; proje sahibi yapay zekâ ile üretti). 6 hal görseli `src/pwa/img/pi_*.webp` (bekle, sevin, düşün, üzgün-teselli, konuş, roket), kaynaklar `tasarim/kaynak/` | ✅ |
| Birdbrain (zorluk kişiselleştirme) | Doğru zorluk = akış | BKT ustalık modeli + seviye seçimi (bkz. §4) | ✅ |
| Half-Life Regression (aralıklı tekrar) | Unutma eğrisine göre tekrar | Beceri başına yarı ömür; "Tekrar Zamanı" | ✅ basitleştirilmiş |
| "Hatalarımı çalış" | Zayıf noktayı kapatma | "Hatalarım" defteri, yanılgı bazında tekrar | ✅ |
| Rive animasyonlu karakterler | Canlılık, düşük dosya boyutu | Prototipte CSS/SVG; üretimde Rive durum makinesi | 🔜 |
| Sesli okuma | Okuma güçlüğü olanlara erişim | Cihaz TTS (prototip) → ElevenLabs önceden üretilmiş ses (üretim) | ✅/🔜 |
| Bildirimler | Geri çağırma | **Günde en fazla 2** (okul sonrası + yatmadan önce), yalnız o gün hiç ders yapılmadıysa, saat 20.30'dan sonra yok, veli açar ve saati seçer (§3.2; kural 20.10.2026'da proje sahibinin kararıyla 1'den 2'ye çıktı) | ✅ |

**Bizim Duolingo'da olmayan farkımız:**
- **Kavram yanılgısı teşhisi** (yanlış şıkkın *nedeni* bilinir ve hedefli açıklama gelir).
- **Hata Avcısı** (§5.1.2): çocuk başkasının çözümündeki hatayı bulur, kim haklı karar verir, hatanın sebebini söyler (muhakeme).
- **Problem Atölyesi** (§5.1.3): çok adımlı problemi anla → planla → çöz → kontrol et aşamalarında çözer; veli raporu zorluğun hangi aşamada olduğunu söyler.
- **Anlatım biçimi uyarlaması**: aynı konu 4 biçimde (Görsel model / Hikâye / Adım adım / Kısa ve net), sistem öğrenciye hangisinin işlediğini ölçerek seçer.
- **Veli raporu**: güçlü/zayıf konu, aktif ve düzelmiş yanılgılar, en iyi anlatım biçimi, kitaptaki sayfaya yönlendiren öneri.
- **Kitapla köprü**: her beceri öğrencinin kendi ders kitabındaki sayfayı gösterir.


### 2.1 Video analizi ile eklenenler (16.10.2026, 3 ekran kaydı)
Mekanikler (fikir/işleyiş) alındı; görsel tasarım, karakterler, metinler ve sesler **tamamen özgün** üretildi.
| Gözlenen mekanik | Bizdeki özgün karşılığı |
|---|---|
| "Çiftleri eşleştir" (dokun-dokun, doğru çift yeşil damga ile kaybolur, yanlış kırmızı titrer) | `type: 'match'` — kesir↔ondalık/yüzde/model, açı↔tür, çokgen↔ad, sayı↔okunuş, üs↔değer, olasılık↔spektrum. 3 çift, kontrol butonu yok, son çiftte otomatik biter |
| "Örüntüyü takip et" (tablo + eksik hücre + kart seçenekler) | `q.grid` — örüntü kuralı, denk kesir örüntüsü, kare/küp örüntüsü |
| Sarı "İyi, ama tam olmadı" ara geri bildirim | Eşleştirmede 1 hata = kısmi doğru: +5 XP, ustalığa zayıf kanıt, seri bozulmaz |
| Üstte "KOMBO xN" sayacı | "⚡ KOMBO xN", 5+ sıcak renk; 3/5/8 kademeli kutlama (§6.2) |
| Doğru kartta parlayan şerit | Doğru seçenek ve eşleşen kartta ışık süpürme animasyonu |
| Ders ortasında maskotlu "Bravo!" ara ekranı | Yarı yolda 1,5 sn Pi ara ekranı, doğruluğa göre mesaj |
| Yükleme ekranında motivasyon notu | Derse girerken 0,9 sn ipucu (uydurma istatistik YOK, genel öğrenme ilkeleri) |
| Düğüm üstünde "BAŞLAT +XP" balonu, "Yeni konsept" etiketi | Beceri penceresi; ilk dersin ilk 3 sorusunda "✨ YENİ KONSEPT" |
| Aylık görev + günlük görevler + sandık ödülü | Görev sekmesi: 3 günlük görev (havuzdan tarihe göre), aylık 30 görev hedefi, elmas ödülü |
| Lig kademeleri, yükselme ve düşme bölgesi | 5 kademe şeridi, ilk 3 yükselir, son 3 düşer, haftalık devir ve "ilk 3" sayacı |
| Profil özet kartları | Seri, toplam XP, lig, ilk 3 sayısı, tema kupası, gerçek görev |
| Bölüm sonu kale/kupa | Tema Sınavı (10 soru, %70) → kupa + 50 elmas |
| Ders sonu "3 yıldız kazandın", sandık açma, "+1 Görev Puanı" (17.10.2026, 2. video seti) | **Ders sonu ödül akışı** (özgün tasarım): (1) **Yıldız ekranı**: altın yay göstergesi doğruluk kadar dolar, ortada XP 0'dan sayar, 3 yıldız sırayla zıplayarak gelir (sesli). Yıldız cezalandırmaz: dersi bitiren en az 1 yıldız alır, %70+ 2, %90+ 3. (2) **Sandık**: kapalı sandık sallanır; 22.10.2026'dan beri nadirlikli ve 3 dokunuşla açılır (bkz. "Nadir sandık" satırı), konfeti ve elmas sayacı (`img/sandik_kapali/acik.webp`). Sandık değişken ödüldür ama **para ile satılmaz**, elmas yalnız seri koruyucuya ve Pi'nin dolabına gider (§1-7). (3) **Görev ilerlemesi**: günlük görev çubukları ve aylık görev dolar, biten görevin ödülü yazar. Adımlar yalnızca anlamlıysa gelir (sandık elmas varsa, görev ekranı görev bittiyse). Seviye belirleme/hız yarışı/hazır mıyız'da yıldız yok. |
| Anlatım kartları (yazı) → Pi'nin anlattığı mini ders (17.10.2026) | **Mini ders (karaoke):** "▶️ Pi anlatsın" ile (ve kart açılınca kendiliğinden) Pi kartı kendi sesiyle anlatır; o an anlattığı cümle ya da adım vurgulanır, anlatılmamışlar soluk, bitenler normal. Zamanlama ek ses üretmeden yapılır: her parçanın başlangıcı, metindeki payına göre kayıtlı sesin süresinden hesaplanır. Ses yoksa/kapalıysa parçalar okuma hızında (~14 harf/sn) açılır. Görsel modeldeki şekiller **çizilerek** gelir (SVG `pathLength` + çizgi animasyonu; kesikli çizgiler bozulmasın diye solarak gelir). Hareketi azalt açıksa çizim yok. **Adım adım canlanan sahneler** (`DERS_SAHNE` in app.js): "Adım adım" kartında Pi hangi adımı anlatıyorsa şekil o adıma geçer. Şimdilik 5 beceri: Çevre (kenarlar yanar, Pi kenar boyunca yürür, 8+4=12, ×2=24), Alan (birim kareler tek tek dolar, 5×3=15), Denk kesir (şerit bölünür, ×2/÷2, "+1 eklersen aynı değil"), İşlem önceliği (sırayla parantez → üs → çarpma → çıkarma = 28), Büyük sayı okuma (bölükler, adları, okunuş, 000 bölüğü, yazarken sıfırlar). Örnek sayılar elle doğrulandı. Sıradaki: kalan becerilere de sahne eklemek. |
| Aydınlık, canlı harita (17.10.2026) | Her temanın kendi 3B manzarası (`src/pwa/img/fon_t1…t7.webp`, 65–225 KB, Higgsfield gpt_image_2_5 yüksek kalite 2K): Geometri şekil kasabası, Doğal Sayılar uçan blok adaları, Geometrik Nicelikler ölçülü bahçe, Kesirler pasta-pizza köyü, İstatistik grafik şehri, Cebir terazi vadisi, Olasılık zar lunaparkı. Ortası sakin bırakıldı (düğümler okunsun); düğüm adları beyaz etikette. Koyu temada da manzara görünür, üstüne hafif alacakaranlık örtüsü. |
| Konuşan karakter (Duolingo'daki ağzı oynayan karakterler) | **Konuşan Pi:** soru, Pi'nin yanındaki konuşma balonunda durur. Pi'nin 3 ağız karesi (`pi_agiz0/1/2.webp`; kapalı/yarım/açık, ağız bölgesi aynı görüntüye yamandı, titreme yok). Pi'nin kayıtlı sesi çalarken Web Audio AnalyserNode ile sesin **gerçek şiddeti** ölçülür ve ağız buna göre açılır (dudak senkronu). Ses bağlamı dokunuşla açılmadıysa ya da robot ses konuşuyorsa ağız doğal ritimle oynar. Pi'ye dokununca soru okunur. Anlatım kartında da aynı Pi konuşur. |
| Canlı, oyun gibi harita (19.10.2026, proje sahibinin "soluk" geri bildirimi) | Manzara doygunluğu artırıldı (koyu temada karartma kalktı); düğümler tema renginde parlak 3B (ışık yansıması, beyaz çerçeve), şu anki düğüm zıplar, sarı "BAŞLA/DEVAM" balonu; düğümleri **altın noktalı bir iz** bağlar (`izCiz`, gerçek konumlardan SVG). **Yol sandıkları:** her 3 beceriden sonra bir sandık; önündeki beceride 1 yıldız olunca sallanır, "AÇ!" der, dokununca bir kez 5–20 elmas (`st.sandiklar`). Para ile satılmaz (§1-7). Soru ekranı bilinçli olarak sade kaldı (dikkat). |
| Kostüm dükkânı (Duolingo'daki karakter kıyafetleri) | **Pi'nin dolabı (19.10.2026):** ana sayfada ya da Ben sekmesinde Pi'ye dokununca açılır. 8 kostüm (astronot 60, süper kahraman 80, futbolcu 80, mucit 90, sihirbaz 100, dedektif 100, korsan 120, kral 200 elmas) ve 4 harita izi rengi (altın ücretsiz, neon mavi 30, şeker pembe 30, gökkuşağı 40). Almadan önce onay sorulur; elmas yetmiyorsa kaç elmas daha lazım olduğu yazar. Kostüm **her yerde** görünür (21.10.2026, proje sahibinin geri bildirimi: "aldım ama derste giymiyor"): ana sayfa, profil, derste konuşan Pi, anlatım kartı, doğru/yanlış tepkileri, ders sonu. Ağız kareleri yalnız normal Pi için var; kostümlü Pi konuşurken zıplamaz ya da sallanmaz, yalnız yavaş nefes alır (proje sahibi: büyüyüp zıplama amatörce duruyordu); sevinç/üzüntü tepkilerinde zıplama ve sallanma animasyonu kalır. **Derste Pi büyüdü (21.10.2026):** soru ekranında 70 → 104 px, anlatım kartında 68 → 100 px; kostümlü (tam boy) Pi'nin kutusu %18 daha uzun; 360 px ve daha dar ekranda 84 px. Görsel yüklenmezse normal Pi'ye düşülür. Durum `st.dolap = {sahip, giyili, izler, iz}`. Kostüm görselleri Higgsfield gpt_image_2_5 (Pi referanslı) + arka plan kaldırma; `gorsel-al` fonksiyonu kırpıp (istenirse `beyaz: true` ile beyaz arka planı kenardan taşma doldurmayla siler) 360 px PNG olarak herkese açık `gorsel` deposuna koyar (`kostum_<id>.png`, 175–267 KB; açılınca tarayıcı önbelleğinde kalır). Görsel gelmezse her günkü Pi görünür. **Elmas parayla satılmaz** (§1-7). |
| Koleksiyon (çocukların kart/çıkartma biriktirme oyunu) | **Çıkartma albümü (19.10.2026):** 7 tema × 6 çıkartma = 42 (emoji, beyaz kenarlı yapıştırma görünümü; her temanın 6.'sı **parlak** ve nadir, %12). Yol sandığı her açılışta o temadan 1 çıkartma verir; ders sonu sandığı %40 olasılıkla dersin temasından verir (hız yarışı, seviye belirleme, hazır mıyız hariç). Aynısı çıkarsa +3 elmas; bir tema sayfası tamamlanınca bir kez +30 elmas. Albüm: Ben sekmesi → 📒 Çıkartma albümüm (tema sekmeleri, boş yerler «?», parlak yer «✨»). Durum `st.album = {sahip: {t1_0: adet}, tamam: {t1: zaman}}`. |
| Haftalık özel etkinlik | **Haftalık hazine avı (19.10.2026):** her pazartesi çocuğun çalıştığı temalardan birinin haritasına (sırayla döner; hiç çalışmadıysa 1. tema) bir hazine sandığı gizlenir. Her bitirilen ders 1 anahtar (seviye belirleme, hazır mıyız hariç); 3 anahtarla sandık açılır: +40 elmas + o temanın eksik bir çıkartması (önce parlak; hepsi varsa +10 elmas). Görev sekmesinde «Haftanın hazine avı» kartı ilerlemeyi gösterir, «Git» haritada sandığa kaydırır. Kaçırılınca ceza ya da suçlayıcı mesaj yok, pazartesi yenisi gelir (§1-7). Durum `st.hazine = {hafta, anahtar, acildi, tema}`. |
| Haritada yaşayan karakterler | **Harita mahallesi (17.10.2026):** her temanın özgün bir komşusu var (Pergo pergelli robot, Bilge baykuş, Metre Usta kunduz, Aşçı Dilim kedi, Grafi tavşan, Denge fil, Şans ejder). Yolun 2. düğümünün yanında durur, kendine has boşta hareketi var (sallanma/eğilme/zıplama/uçma). Dokununca zıplar ve konuyla ilgili kısa bir ipucu söyler (3 cümle sırayla). Tema değişince kendini bir kez tanıtır. **Sesleri yok** (uygulamadaki tek ses Pi'nin, §6.1); sadece yazı balonu ve kısa nota. Görseller `src/pwa/img/komsu_t1…t7.webp` (12–21 KB), kaynaklar `tasarim/kaynak/komsu_k*.png`. |
| Nadir sandık, dokun-dokun açma, sürpriz ödül (22.10.2026, 3 referans video; proje sahibi: "çocuklar kazanmayı, puan toplamayı, yarışmayı seviyor") | **Sandık sahnesi** (`sandikSahneHtml` in app.js): ders sonu, yol sandığı ve haftanın hazinesi aynı tam ekran sahneyi kullanır. Üstte nadirlik şeridi, arkada dönen ışık halkası, «Dokun! Dokun!» ve 3 nokta; her dokunuşta sandık daha çok sarsılır, ses yükselir, telefon titrer; 3. dokunuşta ışık patlaması, kapak açılır, ödüller tek tek gelir. **3 nadirlik, kendi görselleriyle:** ahşap (`sandik_ahsap_*`), nadir (eski mor-turkuaz `img/sandik_*.webp`), efsane/altın (`sandik_altin_*`); yeni görseller Supabase `gorsel` deposunda (Higgsfield gpt_image_2_5, eski sandık referanslı; arka planı `gorsel-al` `beyaz: true` ile silindi), gelmezse eski sandık görünür. **Nadirlik öğrenmeyi ödüllendirir** (`E.sandikNadirlik`): ilk denemede doğruluk %90+ → %75 efsane; %70+ → nadir (%10 efsane); altı → ahşap (%15 nadir). Elmas (`E.SANDIK_ELMAS`): ahşap 5–10, nadir 10–20, efsane 20–35. Çıkartma şansı ahşap %25, nadir %40, efsane %70. **Sürpriz ek ödül** (`sandikBonus`): efsanede her zaman, nadirde %25: 🚀 **Roket Gücü** (sonraki 2 dersinde 2 kat XP; saate değil ders sayısına bağlı, çocuğa süre baskısı yok; `st.roket = {kalan}`, `E.finish` uygular, üst çubukta 🚀 rozeti) ya da 🧊 seri koruyucu (2'den azsa). Yol sandığı nadir, hazine efsane. **Ödül sandık açılmadan belirlenir ve kaydedilir**: dokunmak heyecan içindir, şans oyunu değildir; sahne yarıda kalsa da ödül kaybolmaz. Para ile satılmaz, reklamla açılmaz (§1-7). Ders sonu ekranında esprili alt başlık yalnız gerçekten olduysa: «Kusursuz! Tek hata bile yok 🎯», «Hatalarından geri dönmeyi bildin 💪», «Şimşek gibiydin ⚡». Hareketi azalt açıksa sarsıntı/halka/patlama yok, ödüller hemen görünür. |
| Tek harita (20.10.2026, proje sahibinin isteği) | **Matematik Diyarı:** tema düğmeleriyle ayrı ayrı açılan 7 harita kalktı; 35 konu tek, sürekli bir yolda. Kitabın 7 teması 7 **bölge** oldu, adları manzaralarından: Şekil Kasabası, Sayı Adaları, Ölçü Bahçesi, Kesir Köyü, Grafik Şehri, Denge Vadisi, Şans Lunaparkı (`BOLGE`, `bolgeHtml` in app.js). Her bölgenin başında renkli bir kapı kartı (bölge no, ilerleme, konu adı ve kitapla köprü için küçük «📗 Kitabında: 1. Kitap, 1. Tema»), kendi manzarası (üst ve alt kenarı solarak bir sonrakine geçer), komşusu, yol sandıkları, hazine durağı ve sonunda **Bölge Sınavı** (eski Tema Sınavı, kupa + 50 elmas). Altın iz bütün haritayı baştan sona bağlar. Üstte toplam ilerleme (x/35 konu, x/7 kupa) ve bölge düğmeleri: dokununca o bölgeye kayar, komşu kendini tanıtır. Harita açılınca sıradaki düğüme kendiliğinden gider; aynı ekranda yeniden çizerken (pencere açma vb.) kaydırma yerinde kalır (`render`). Bölgelerin ilk konusu kilitsiz kalır (öğretmen konuları farklı sırada işleyebilir). Çocuğun gördüğü yerlerde «tema» yerine «bölge» (albüm, hazine, sınav, rozet, Pi'nin `bolge_sinav`/`bolge_kupa` repliği); **Kitap sekmesi ve veli raporu kitabın adlarıyla «Tema» demeye devam eder.** |

### 2.2 Kitaplarım (iki kitabın tam haritası)
"Kitap" sekmesinde 1. ve 2. kitabın içindekilerindeki **83 başlığın tamamı** sayfa numarasıyla yer alır ve her başlık bir eyleme bağlıdır:
konu → ilgili becerinin dersi; Hazır mıyız? → 5 soruluk ön bilgi kontrolü; İzleme testi / Ölçme ve Değerlendirme → Tema Sınavı; Performans Görevi → özgün gerçek hayat görevi (7 tema, metinler bize ait); Başlayalım/Zihin Haritası → "kitabından oku" yönlendirmesi. Her temada kitabın kendi karekodlarındaki resmi EBA bağlantıları dışarı açılır.
**Kitap metni, soruları ve sayfa görüntüleri uygulamaya konmaz** (§1-5). MEB'den yazılı izin alınırsa yapı, sayfa görüntülerini eklemeye hazırdır.

---

## 3. "Çiçek modeli": öğrenciyi neye göre tanıyoruz

**Bilimsel not:** "Görsel/işitsel/kinestetik öğrenme stili" etiketleyip içeriği o etikete göre vermenin öğrenmeyi artırdığına dair sağlam kanıt yoktur (Pashler ve ark., 2008, *Learning Styles: Concepts and Evidence*). Bu yüzden öğrenciye anketle stil etiketi **yapıştırmıyoruz**. Bunun yerine her öğrencide **ölçülebilen** şu boyutları izliyoruz:

| Boyut | Nasıl ölçülür | Neyi değiştirir |
|---|---|---|
| Beceri ustalığı (35 beceri) | BKT olasılığı + son 10 cevabın doğruluğu | Soru zorluğu (1–3), ders uzunluğu, kilit açma |
| İşe yarayan anlatım biçimi | Anlatım kartından sonraki ilk 3 sorunun doğruluğu + "Başka türlü anlat" tıklamaları (Thompson örneklemeli bandit) | Konu anlatım kartının ve "Başka anlat" açıklamasının biçimi |
| Kavram yanılgıları | Hangi yanlış şıkkın seçildiği / hangi yanlış sayının girildiği | Hedefli açıklama, telafi sorusu, "Hatalarım" listesi, veli raporu |
| Tempo | Cevap süresinin ortancası | Ders uzunluğu (yavaş düşünene 6 soru), Hızlı Yarış önerisi |
| İpucu bağımlılığı | İpucu kullanma oranı | İpuçlu doğru cevap ustalığa zayıf kanıt sayılır |
| Hatadan dönüş gücü | Telafi sorularındaki başarı oranı | Veli raporu, motivasyon mesajı |
| Unutma hızı | Beceri bazında yarı ömür | Tekrar zamanlaması |
| Motivasyon tercihi | Kayıtta sorulan tek soru (yarışmak/toplamak/keşfetmek) | Ana ekranda öne çıkan öğe (lig, rozet, hikâye). Öğrenme kararı vermez, sadece sunumu etkiler |

Bu boyutların hepsi "Ben → Öğrenme Parmak İzim" ekranında öğrenciye, "Veli" ekranında veliye gösterilir.

---

### 3.1 Kullanılabilirlik turu (19.10.2026)
Uygulama, ilk kez açan bir çocuğun gözünden baştan sona gezildi (her ekran ölçüldü: dokunuş sayısı, yazı miktarı, 44 px altı dokunma alanı). Düzeltilenler:
- **Kayıt tek alan:** "Sana ne diyelim?" (yalnız ad). Doğum tarihi, okul ve soyad **istenmez** (hiçbir yerde kullanılmıyordu; KVKK veri minimizasyonu §1-6). Veli adımı atlanabilir kalır.
- **Dürüst veli raporu:** güçlü/zayıf konu etiketi için o konuda **en az 4 cevap** gerekir (seviye belirlemedeki tek soruyla "destek gereken konu" yazılmaz). 1 dakikadan kısa çalışma "0 dk" değil "<1 dk".
- **Lig, yeni başlayanı kırmaz:** çocuğun ilk lig haftasında düşme yok ("🌱 İlk haftan: bu hafta ligden düşmezsin"), düşme bölgesi gösterilmez; demo rakipler hafta başında sıfıra yakın XP ile başlar (önceden yeni çocuk ilk gün kırmızı bölgede başlıyordu).
- **Üst çubuk açıklamalı:** 🔥 💎 ⚡ 🧊 simgelerine dokununca ne oldukları tek cümleyle yazar.
- **Dokunma alanları ≥ 44 px:** tema düğmeleri, dersi kapat ✕, soru 🔊, kitap sekmeleri, EBA bağlantıları, küçük düğmeler.
- **Veli alanı şifreli (19.10.2026):** çocuk, kendi hakkındaki veli raporunu (zayıf konular, yanılgılar) görmesin. Veli ilk girişte 4 rakamlı şifre belirler (1111/1234 gibi kolay şifre reddedilir); 5 yanlışta 1 dk bekleme; Veli sekmesinden çıkınca ya da "🔒 Kilitle" ile yeniden kilitlenir. "Şifremi unuttum" şifreyi sıfırlar ama **veli bilgilerini ve onayı da siler** (çocuk sıfırlayıp veli yerine onay veremesin); çocuğun ilerlemesi silinmez. Kapıda çocuğa nazik not + "Ben sekmesine git". Bu bir çocuk kapısıdır, kriptografik güvenlik değildir (`st.veli = {tuz, pin}`, basit özet). Bilinçli olarak matematik sorusu değil: matematik uygulamasında çocuk onu çözer.
- **Veli bilgileri ve KVKK onayı çocuğun kaydından çıktı:** kayıt 3 adım (karşılama → ad → motivasyon). Veli adı, telefon, e-posta ve onay kutusu yalnız şifreli Veli alanında "Bilgileri düzenle" formunda; telefon/e-posta girilirse onay zorunlu. Onayı çocuk değil veli verir.
- **Ben ekranı gelişim dilinde:** "Kavram yanılgılarım" → "🪤 Pi ile üzerinde çalıştığımız tuzaklar"; etiketler "göz kulak" (tek gözlem) · "çalışıyoruz" · "aştın ✓". Klinik dil ("yanılgı", "destek gereken konu") yalnız veli raporunda.
- **Görsel veli raporu:** Veli alanında rapor artık kartlar ve çubuklar: son 7 günün günlük dakikası, tema bazında ustalık (yalnız çalışılan konular) + güçlü/destek gereken etiketleri, cevap kanıtı çubuğu, problem çözme aşamaları + içgörü cümlesi, yanılgılar (çalışılıyor / olası / düzeltti), haftalık öneri. Paylaşılan metin değişmedi; "📝 Gönderilecek mesaj metni" kutusunda durur. Veri `E.parentReport` dönüşünde (`gunluk`, `temalar`, `act`, `olasi`, `fixed`, `probIcgoru`, `tip`).
- **Görev sekmesinde "BUGÜN BUNU YAP":** tek, net öneri kartı (`bugunOneri` in app.js). Öncelik: hiç çalışmadıysa ilk konu (önce anlatım) → hatırlama olasılığı 0,5'in altına düşmüş konu varsa tekrar → 3+ hata birikmişse Hatalarım → yoldaki sıradaki konu (açık ve ustalığı 0,7 altı; hiç çalışılmadıysa anlatımla başlar) → hepsi iyiyse karışık pratik. Gerekçe tek cümle; günlük hedef dolduysa "Bugünkü hedefin tamam!" der, zorlamaz.
- Not: test ortamında görülen "Unexpected token '<'" hatası uygulamadan değil, ağ engelinin supabase-js yerine HTML döndürmesinden kaynaklanır (gerçek cihazda yok).

### 3.2 Hatırlatma bildirimleri, seri koruyucu, açılış ekranı (20.10.2026)
- **Hatırlatma bildirimleri (Web Push):** veli, şifreli Veli alanında "🔔 Bildirimleri aç" der (izin + abonelik; bu, veli onayı olarak kaydedilir `st.bildirim.onay`). Saat seçimi: okul sonrası 15.30/16.30/17.30/18.30, yatmadan önce 19.00/19.30/20.00/20.30 (ikisi arasında en az 1 saat). Bildirim **yalnız o gün hiç ders yapılmadıysa** gider; günde en fazla 2; 20.30'dan sonra asla; saatinden 60 dk geçtiyse gönderilmez. Mesajlar suçlamaz, korkutmaz (§1-7): "Pi seni bekliyor 🚀", "Yatmadan önce 3 dakika? 🌙", serisi 2+ olana bazen "🔥 3 günlük serin seni bekliyor". "Pi üzgün", "serini kaybedeceksin" gibi cümle YOK; çocuğun adı bildirimde yok.
  - Sunucu: `sunucu/supabase/bildirim.sql` (tablo `bildirim_abonelik`, RLS açık politika yok; fonksiyonlar `bildirim_kaydet/ders/sil/acik_anahtar` anon'a açık, `bildirim_vapid_al/kaydet` yalnız service_role; pg_cron `bildirim-gonder` her 10 dk UTC 12–17). Fonksiyon `functions/bildirim-gonder` (jsr:@negrel/webpush 0.5.0, admin_token ile). VAPID anahtarları sunucuda üretildi ve kasada (`vapid_keys`); özel anahtar hiçbir dosyada yok. Gidemeyen (silinmiş) abonelik kendiliğinden silinir.
  - Saklanan veri: bildirim adresi, iki saat, son ders günü, seri sayısı. İsim/telefon/e-posta yok. Kapatınca satır silinir. **KVKK hukukçu onayı yayın öncesi gerekir** (§1-6).
  - iPhone'da Web Push yalnız ana ekrana eklenmiş uygulamada çalışır (iOS 16.4+); kart bunu söyler. Uygulama açılınca ve her ders sonunda son ders günü sunucuya bildirilir (`bildirimDers`).
- **Seri koruyucu kendiliğinden (`E.seriKontrol`):** uygulama açılınca, uygulamaya geri dönülünce ve ders sonunda bakılır. Gelinmeyen her gün için bir koruyucu kullanılır; koruyucular bütün boş günlere yetmiyorsa **hiç harcanmaz** ve seri 0 olur, ilk ders 1. gün sayılır. Konular, yıldızlar, XP, elmas etkilenmez. Çocuğa nazik not: "🧊 Dün gelemedin; seri koruyucun serini korudu!" ya da "🌱 Yeni bir seri başlıyor! Konuların ve yıldızların yerinde duruyor." En fazla 2 koruyucu taşınır (`E.KORUYUCU_EN_FAZLA`), fazlası satın alınamaz (elmas boşa gitmesin). Korunan günler `st.donmus`.
- **Açılış ekranı:** 550 KB'lık sayfa yüklenirken ekran bomboş/koyu kalıyordu (proje sahibinin ekran görüntüsü). Artık `#app` içinde anında görünen Pi simgeli açılış ekranı var (yalnız satır içi CSS); Google yazı tipi sayfayı bekletmez (`media=print onload`). Service worker sayfayı tarayıcının HTTP önbelleğini atlayarak ister (`cache: 'no-cache'`): GitHub Pages 10 dk önbelleğe aldığı için yayından hemen sonra ilk açılışta eski sürüm gelebiliyordu.

### 3.3 Ampul ipucu cevabı söylemez (21.10.2026, proje sahibinin ekran görüntüsü)
- Hata: sorunun kendi ipucu (`q.hint`) yoksa 💡 ampul **çözümün 1. adımını** gösteriyordu. Soruların ~%87'sinde ayrı ipucu yok; 30 000 örnekte ~1 700'ünde 1. adım cevabı doğrudan söylüyordu (ör. pergel sorusunda "Pergelin açıklığı yarıçapa eşittir" → cevap 7 cm).
- Düzeltme (`ampulIpucu` in app.js): sırayla `q.hint` → becerinin "Kısa ve net" kural kartı ("Hatırla: …") → kural kartı cevabı içeriyorsa (ek alan hâli dahil, ör. «ışın» → «ışının») genel yönlendirme "Ne veriliyor, ne soruluyor?". Çözüm adımları yalnız yanlıştan sonra "Nasıl çözülür?" kutusunda görünür. **Yeni üretici yazarken mümkünse `hint` ekle; ipucu cevabı ya da cevabı veren kuralı söylememeli.**
- Pergel sorusu: dil düzeltildi ("Pergelin sivri ucu ile kalem ucu arasındaki açıklık 7 cm. Bu açıklıkla bir çember çiziliyor."), kendi ipucu eklendi (merkez–çember uzaklığına ne denir?), yarıya bölme de `cap_yaricap` yanılgısına bağlandı. `cap_yaricap` açıklaması netleşti (ses `mis_cap_yaricap_2`). İkinci yanlıştan sonraki başlık "Neredeyse!" yerine "Birlikte bakalım" (cevap uzaksa "neredeyse" yanlış bilgi veriyordu).

### 3.4 Kişisel öğrenme planı (24.10.2026, proje sahibinin isteği: "her öğrencinin öğrenme yetisini keşfedip ona yönelik program")
Üç parça; hepsi çocuğun **cevaplarından** çalışır, anket ya da stil etiketi yok (§3).
- **Okul takvimi** (`OKUL_TAKVIM` in curriculum.js, `E.okulHafta`, `E.okulKonusu`, `E.okulGeride`): MEB **2026-2027 5. sınıf matematik taslak çerçeve yıllık planı** (tymm.meb.gov.tr, "Ortaokul Matematik Dersi Yıllık Planlar" ZIP'i, Eylül 2026; geliştirici fonksiyonu `plan-oku` ile okundu) haftalara bölündü: her pazartesi → planda işlenen beceri(ler); tatil haftalarında son konu sürer. Varsayılan bu takvimdir; öğretmen farklı sırada işleyebileceği için çocuk/veli haritadaki «🏫 Okulda bu hafta» kartından **konuyu elle seçebilir** ya da eşleştirmeyi kapatabilir (`st.okul = {mod: 'takvim'|'elle'|'kapali', sk}`). Okul konusu haritada «🏫» ile işaretlenir, kilitliyse açılır, "Bugün bunu yap" önerisinde öne çıkar (ilk ders de okul konusundan başlar). Okulda işlenmiş ama hiç çalışılmamış konular plana ve veli raporuna "📌" ile girer. **Taslak plandır**; yıl değişince takvim güncellenmeli (`OKUL_YIL`). Takvim dışında (yaz) okul kartı "Seç" der.
- **Ön bilgi haritası ve yoklaması** (`ONKOSUL` in curriculum.js → `s.temel`, `E.temelAday`, `E.temelTetikle`, `E.temelKaydet`, `E.temelEksikler`): her becerinin temalar arası temelleri, en olası kaynak önce (ör. denk kesir ← kesir türleri, çarpma-bölme; daire grafiği ← sütun grafiği, yüzde). Çocuk bir derste **aynı konuda 2 kez çözüm görürse** (iki denemesi de yanlış) ve zayıf ya da hiç ölçülmemiş bir temel varsa, telafiden sonra o temelden **2 kolay soru** gelir («🔎 Kısa bir kontrol»). Ders sayacını ilerletmez, telafi doğurmaz, ders yoklama bitmeden kapanmaz. İkisi ilk denemede doğruysa **sağlam** (14 gün yeniden yoklanmaz), değilse **eksik**: ders sonunda "🧱 Pi bir şey fark etti" kartı, "Bugün bunu yap"ta en üst öncelik (unutulan tekrardan sonra), haftalık planda "Temeli güçlendir", veli raporunda "🧱 Ön bilgi kontrolü" satırı ve öneri. Ders başına en fazla bir yoklama. Durum `st.temel[beceri][temel] = {sonuc, at, ok, n}`.
- **Haftalık plan** (`E.haftalikPlan`, `planKart` in app.js): her pazartesi 3 hedef seçilir ve hafta boyu sabit kalır, ilerleme canlı: (1) okul konusu (yoksa yoldaki konu) → 2 yıldız; (2) bulunan temel eksiği → 1 yıldız, yoksa en zayıf çalışılmış konu, yoksa okulda geride kalan konu, yoksa tekrar; (3) alışkanlık: haftada N gün (geçen haftanın 1 fazlası, 3–5). Görev sekmesinde "Bugün bunu yap"ın altında; her satır dokununca o işi başlatır. Üçü bitince bir kez +25 elmas (`E.PLAN_ODUL`). Veli alanında "🎯 Kişisel plan" kartı ve rapor metninde "📋 Bu haftanın planı".
- Test: `node test/test_plan.js` (takvim tarihleri, elle seçim, yoklamanın tetiklenmesi/sayaç/telafi kuralları, plan ve rapor).

### 3.5 Aile kodu ile bulut yedeği (25.10.2026)
Telefon değişince ilerleme kaybolmasın diye; satış öncesi zorunlu. **E-posta, şifre, hesap yok.**
- **Neden e-postalı giriş değil:** eski yol (`cloud.js`, Supabase sihirli bağlantı) üç sorun taşıyordu: (1) yeni telefonda çocuk önce kayıt oluyor, boş kayıt "daha yeni" sayılıp buluttakinin **üstüne yazılıyordu** (veri kaybı; düzeltildi: artık toplam XP'si fazla olan tutulur); (2) Supabase'in hazır e-posta servisi saatte birkaç e-posta atar ve yalnız proje ekibine gönderir, gerçek velilere ulaşmaz (özel SMTP + alan adı gerekir); (3) e-postadaki bağlantı kurulu uygulamayı değil tarayıcıyı açar (iPhone'da her zaman). E-postalı giriş kodu duruyor ama arayüzde yalnız zaten giriş yapmış hesaba görünür.
- **Akış:** Veli alanında (şifreli) "☁️ İlerlemeyi yedekle" kartı → onay kutusu (velinin açık onayı, metin sürümü `aile-yedek-v1`) → cihaz 16 karakterlik **aile kodu** üretir (`crypto.getRandomValues`, alfabe `ABCDEFGHJKMNPQRSTUVWXYZ23456789`, karışan I L O 0 1 yok, ~79 bit, `ABCD-EFGH-JKMN-PQRS` biçiminde gösterilir). Kart kodu gösterir: Kopyala, "Kendime gönder" (WhatsApp), son yedek zamanı, Şimdi yedekle, Yedeği sil. Yeni telefonda karşılama ekranında **"📲 Başka telefonda kullanıyordum"** (ya da Veli alanında "kodum var") → kod → önce **özet** (ad, XP, konu, seri) → "Evet, yükle". Yazarken küçük harf, boşluk, O/0 ve I/L/1 karışıklığı tolere edilir.
- **Buluta ne gider:** `aileTemiz`: çocuğun durum nesnesi; **çıkarılanlar:** veli adı, telefon, e-posta, onay alanı, veli şifresi (`st.veli`), bildirim aboneliği, aile kodunun kendisi. Geri yüklerken bu telefondaki veli bilgileri, şifre ve bildirim korunur.
- **Sunucu** (`sunucu/supabase/aile_yedek.sql`): tablo `aile_yedek` (anahtar = kodun SHA-256 özeti; kod saklanmaz), `aile_yedek_deneme` (ağ özeti başına günde 30 başarısız deneme sınırı). Fonksiyonlar `aile_yedek_kaydet / getir / sil` (SECURITY DEFINER, anon'a açık, tabloya doğrudan erişim yok), 600 KB sınırı, 18 ay dokunulmayan yedek her ay silinir (pg_cron `aile-yedek-temizle`).
- **Eşitleme:** her `save()`'den 4 sn sonra gönderilir (`kirli` bayrağı), uygulama arka plana geçince hemen; açılışta ve geri dönünce sürüm bakılır, başka cihaz daha yeni kaydettiyse yüklenir. **Çakışma** (iki cihaz arada ayrı ayrı ilerledi): sunucu üstüne yazmayı reddeder (`p_onceki`), uygulama toplam XP'si fazla olanı tutar. Tek çocukta nadirdir; iki cihazdaki ayrı ilerleme birleştirilmez (bilinçli basitlik).
- Kart, sunucuda fonksiyonlar kurulu değilse görünmez (`aileSunucuBak`: geçersiz kodla `aile_yedek_kaydet` → `{hata:'kod'}`, yan etkisiz yoklama).
- **Kurulum durumu (25.10.2026):** hepsi sunucuda kurulu. Tablolar, `aile_yedek_kaydet` ve `aile_yedek_getir` ajan oturumundan kuruldu. Ajan oturumu içinde `delete` geçen SQL'i durdurduğu için `aile_yedek_sil` ve aylık temizlik işini proje sahibi Supabase SQL Editor'den çalıştırdı (`sunucu/supabase/aile_yedek_silme.sql`). İpucu: Supabase panelinde Chrome çevirisi açıksa sayfa "removeChild" hatasıyla çöker; sorgu yine de çalışır.
- Test: `python3 test/e2e_aile.py` (iki telefon, sahte sunucu aynı kurallarla: onaysız açılmaz, veli bilgisi gitmez, yanlış kod, özet, geri yükleme, iki yönlü eşitleme, çakışma, silme).
- **KVKK:** onay metni ve "Neler saklanır?" açıklaması yayın öncesi hukukçuya onaylatılmalı (§1-6).

## 4. Uyarlanabilir motorun algoritmaları (`src/engine.js`)

### 4.1 Ustalık: Bayesian Knowledge Tracing (BKT)
- Parametreler: öğrenme geçişi `T = 0.07`, dikkatsizlik `S = 0.10`, tahmin `G`: sayı girişi 0.15, iki şıklı 0.5, diğerlerinde 1/şık sayısı.
- Doğru: `post = p(1−S) / (p(1−S) + (1−p)G)`; yanlış: `post = pS / (pS + (1−p)(1−G))`; sonra `p = post + (1−post)T`.
- İpucuyla doğru cevap kanıtın %40'ı kadar sayılır, `T` yarıya iner.
- **Etkin ustalık** = `min(pL, son10Doğruluk + 0.2)` (en az 5 cevap varsa). Bu, BKT'nin aşırı iyimserliğini gerçek doğrulukla sınırlar. Kalibrasyon (§12): gerçek veri biriktikçe parametreler pyBKT ile öğrenciden öğrenilecek.
- Taç/yıldız eşikleri: 0.30 / 0.50 / 0.70 / 0.85 / 0.95.

### 4.2 Zorluk seçimi (yakın gelişim alanı)
- Etkin ustalık < 0.35 → seviye 1; < 0.70 → seviye 2; üstü → seviye 3.
- Son cevap yanlışsa bir seviye aşağı. Arka arkaya 3 doğruda %35 olasılıkla bir seviye yukarı ("esnetme").
- Hedef: öğrencinin ders içi doğruluğu kabaca %70–85 bandında kalsın. Çok kolay sıkar, çok zor kırar.

### 4.3 Hata döngüsü (hatadan öğrenme) — 17.10.2026'da ikinci şansla güncellendi
0. **İkinci şans:** ilk yanlışta cevap SÖYLENMEZ. "🤔 Bir daha düşün!" kutusunda hedefli ipucu çıkar (öncelik: şıkka özel ipucu → sorunun/atölye adımının ipucu → gözlenen yanılgının kuralı); seçilen yanlış şık üstü çizili ve kapalıdır. Çocuk bir kez daha dener. İkinci denemede doğru = "İpucuyla buldun!", +5 XP, ustalığa zayıf kanıt (ipucu gibi), seri bozulmaz ama büyümez; dersin yıldız hesabında yarım sayılır. İlk denemedeki yanılgı yine deftere yazılır (`E.yanilgiNotu`). **İkinci şans yok:** hız yarışı, seviye belirleme, tema sınavı, hazır mıyız (ölçme anları), eşleştirme ve iki şıklı sorular (kim haklı, doğru/yanlış; ikinci denemede cevap belli olur).
1. İkinci yanlış → geri bildirim sayfası: doğru cevap + **"🧭 Neden olmadı?"** (o şıkka/sayıya özel açıklama, `ac`) + genel kural (yanılgı adı ve düzeltme, 🔊) + adım adım çözüm.
2. "Başka anlat" → konunun başka bir biçimdeki anlatım kartı (bandit en iyi biçim dışından seçer).
3. "Anladım" → **telafi sorusu**: aynı beceri, bir alt seviye. Ders sayacı ilerlemez; telafi ders bitmeden mutlaka gelir.
4. Yanılgı defterine yazılır; aynı yanılgıda telafi veya "Hatalarım" tekrarı doğru yapılınca "düzeldi" sayılır.

### 4.4 Aralıklı tekrar (HLR'den esinlenme)
- Hatırlama olasılığı `p = 2^(−Δsaat / yarıÖmür)`. Başlangıç yarı ömrü 24 saat.
- Aralıklı doğru cevap yarı ömrü ikiye katlar (en fazla 60 gün), hemen tekrar doğru ×1.15, yanlış yarıya indirir (en az 6 saat).
- `p < 0.7` olan beceriler "Tekrar Zamanı"na düşer. Normal derste soruların ~%12'si tekrar sorusudur.

### 4.5 Anlatım biçimi bandit'i
- Her biçim için Beta(a, b). Kart gösterilince biçim Thompson örneklemesiyle seçilir.
- Ödül: karttan sonraki ilk 3 sorudan en az 2'si doğruysa 1, değilse 0. "Başka türlü" tıklaması mevcut biçime 0.25 ödül (zayıf olumsuz sinyal).
- Simülasyonda (60 deneme) gerçek en iyi biçimi seçme oranı ~%55–90 arası (`test/sim_engine.js`).

### 4.6 Ders oturumu
- Varsayılan 8 soru; cevap süresi ortancası 35 sn'yi aşarsa 6; ustalık > 0.7 ise 10.
- **Tekrar koruması (17.10.2026):** `E.nextQ`, asıl seçiciyi (`E.nextQ0`) en fazla 40 kez dener. Aynı oturumda birebir aynı soru (`E.soruAnahtari`: metin + görsel özeti + şıklar/cevap) **asla** tekrar gelmez; üst üste aynı kalıp (`E.kalipAnahtari`: sayılar ve harfler atılmış metin) ilk 20 denemede reddedilir. Atölye ve seviye belirleme muaf. Neden: dar havuzlu üreticiler (g_temel, g_cokgen, s_arastirma, g_dikme_paralel, p_olay…) aynı soruyu üst üste veriyordu (simülasyonda 4200 soruda 880 birebir tekrar → 0). Yeni üretici yazarken her seviyede en az ~10 farklı soru çıkabilmeli; `scratchpad/tekrar_olc.js` benzeri bir ölçümle kontrol et.
- Mod'lar: `lesson`, `learn` (önce anlatım, 5 soru), `review`, `mistakes`, `mix`, `speed` (60 sn), `placement` (7 temadan birer soru → başlangıç ustalığı), `hata` (Hata Avcısı, 6 soru, §5.1.2), `atolye` (Problem Atölyesi, 2 problem × 6–8 adım, §5.1.3).

### 4.7 Üç kademeli kanıt (17.10.2026)
Her cevap `kanit` ile kaydedilir: **ilk** (ipucusuz ilk denemede doğru) · **ipucu** (💡 ipucuyla ya da ikinci denemede doğru) · **cozum** (çözüm gösterildi). Beceri (`sk.kanit`), toplam (`st.kanit`) ve atölye aşaması bazında tutulur. Profilde "Cevaplarım nasıl geldi?" çubuğu, veli raporunda "🧾 Cevapların: ilk denemede doğru %… · ipucuyla %… · çözüm gösterildi %…" satırı. "Doğruluk" artık **ilk denemede doğru** oranıdır. XP çalışmayı ödüllendirir; öğrenmeyi gösteren ustalık ve ilk deneme oranıdır (rapor bunu açıkça yazar).
- **Olası güçlük ↔ yanılgı (17.10.2026):** bir yanılgı tek soruda görüldüyse "olası güçlük" (profilde "olası · 1 kez", raporda "🔎 Olası güçlükler… izleniyor"); en az 2 FARKLI soruda görüldüyse "yanılgı" olarak raporlanır (`st.mis[id].q` = gözlendiği soru kimlikleri). Seçilen şıktan yapılan teşhis olasılığa dayanır; tek gözlemle çocuğa etiket konmaz.
- **Sayılar sayılarıyla:** her yüzdenin yanında dayandığı sayı yazar ("%75 3/4", "12 cevaba göre"); bir aşamada 5'ten az veri varsa "ön değerlendirme" denir.
- **Dürüst gösterge kuralı:** ölçülmemiş bir şey sayı gibi gösterilmez. Anlatım biçimi en az 2 kart sonrası ölçülmüş sayılır, öncesinde "henüz ölçülmedi". Profilde "ℹ️ Bu sayılar nasıl hesaplanıyor?" açıklaması var.

---

## 5. İçerik üretim hattı (yeni beceri/soru eklerken zorunlu sıra)

1. `data/mufredat.json` → hangi tema, hangi beceri, kitapta hangi sayfalar.
2. O beceride **bilinen kavram yanılgılarını** yaz (`MIS` kataloğuna ekle: kısa ad + 1–2 cümlelik düzeltme).
3. Parametrik üreticiyi yaz: 3 zorluk seviyesi, her yanlış şık/yanlış sayı bir yanılgı etiketiyle.
4. 4 anlatım kartını yaz (`curriculum.js`): gorsel (metin + SVG), hikaye (Türk çocuğunun günlük hayatından, isimler çeşitli), adim (3–5 adım), kural (1–2 satır).
5. `node test/test_generators.js` çalıştır: her üreticiden 600×3 soru üretilir; tek doğru şık, tekrarsız şıklar, `undefined/NaN` yok, bilinmeyen yanılgı etiketi yok. **Hata 0 değilse yayın yok.**
6. Matematik öğretmeni kontrolü: rastgele örnek sorular gözle incelenir (dil, seviye uygunluğu, müfredat uyumu). Araç: **Öğretmen inceleme paneli** (§5.4).
7. Türkçe ek uyumu için `U.nk()`, `U.wk()`, `U.tk()` yardımcılarını kullan (12'nin, 40'ın, 3'er, 11.40'ta). Sayıya elle `'in` yazma.

### 5.1 Soru nesnesi şeması
```json
{
  "skill": "f_karsilastir", "level": 2,
  "type": "mc | input | cmp | tf",
  "prompt": "HTML (kesir için <span class=\"fr\">)",
  "visual": "SVG dizgesi veya yok",
  "options": [{ "t": "metin", "ok": true }, { "t": "metin", "ok": false, "mis": "payda_buyuk" }],
  "answer": "sayı (input tipinde)", "unit": "cm",
  "inputMis": [{ "v": 19, "mis": "cevre_yarim" }],
  "hint": "ipucu", "steps": ["adım 1", "adım 2"]
}
```

### 5.1.0 Çözüm görseli (`q.cozumGorsel`, 19.10.2026, proje sahibinin önerisi)
Sayma ya da şekil gerektiren sorularda, yanlış cevaptan sonra "🪜 Nasıl çözülür?" kutusu açık gelir ve adımların üstünde çözümü çizen bir şekil durur. İlk örnek: doğru üzerindeki noktalarla kaç doğru parçası oluştuğu (`g_temel` seviye 3, `U.parcaSayGorsel`). Noktalar doğru üzerinde, her doğru parçası bir yay olarak **tek tek çizilir**; aynı noktadan başlayan parçalar aynı renktedir ve altında renkli etiketler durur ("P → PR, PS", "R → RS"). Adımlar da her noktadan yalnız sağa doğru sayar, böylece aynı parça iki kez sayılmaz. Hareketi azalt açıksa çizim animasyonu kapanır. Yeni bir görsel: `core.js`te SVG döndüren bir `U.…Gorsel` yaz, üreticide `cozumGorsel` alanına koy.

### 5.1.1 Parmakla kesir (`type: 'kes'`, 17.10.2026)
Öğrenci şıktan seçmez; modeli kendi eliyle kurar. `model`: `pie` (pasta), `bar` (şerit) ya da `line` (sayı doğrusu). Alanlar: `hedef: [pay, payda]`, `parca` (sabit parça sayısı; `null` ise öğrenci − / + ile 1–12 arası kendisi böler), `denk` (true ise denk kesir de doğru: 6/8 = 3/4), `ust` (sayı doğrusunun sonu, 1 ya da 2), `cevap` (geri bildirimde gösterilen metin).
- Cevap `{parca, boyali}` ya da `{konum}` olarak gelir ve `KES_CHECK` ile **kodla** değerlendirilir. Açık uçlu olduğu için her yanlış durum bir yanılgıya bağlanır: tümleyeni boyamak → `bos_kisim`; ters kesir → `pay_payda_ters`; sayı doğrusunda bir eksik/fazla → `cizgi_sayma`; geri kalan her şey → `kesir_model`.
- Nerede: `f_tur` (boya; sayı doğrusu 0–1; bileşik kesir 0–2), `f_denk` (12 parçalık şeritte 3/4 boya; kendin böl ve boya), `f_ondalik` (10 parçalık şeritte 0,7 boya). Bu becerilerde soruların %25'i. Hız yarışında gelmez (dokunmak zaman alır). BKT tahmin olasılığı 0,1.
- Test: `test_generators.js` her `kes` sorusunda doğru cevabın kabulünü ve olası **bütün** yanlış durumların bilinen bir yanılgıya düştüğünü dener.

### 5.1.2 Hata Avcısı — muhakeme soruları (17.10.2026)
Maarif programının alan becerilerinden **matematiksel muhakeme** için: çocuk cevabı bulmakla kalmaz, başkasının çözümünü değerlendirir. Kaynak `generators.js → SEN` (21 beceri, 7 temanın hepsi).
- **Senaryo** = problem + kodla kurulmuş doğru çözüm adımları (en fazla 3) + belgelenmiş bir yanılgıdan türetilmiş hatalı çözüm(ler) (`H(mis, at, satirlar, sonuc)`). Hatalı adım = sonucun bozulmaya başladığı **ilk** adım; ondan önceki satırlar doğru çözümle birebir aynıdır. Hatalı çözümün aritmetiği de doğrudur: yanılgı **kavramsaldır** (ör. "Tümler açıların toplamı 180°", ardından 180 − 35 = 145 doğru hesaplanır).
- Bir senaryodan üç biçim türer (`HATA.q(id, lv, tur)`):
  - **bul**: hayali öğrencinin defterindeki satırlar şık olur, artı "✅ Hata yok, hepsi doğru". Senaryoların %20'si hatasızdır (ezberle "hep bir hata var" denmesin). Doğru bir adımı seçmek → `hata_yeri`; hatalıyken "hata yok" demek → o senaryonun yanılgısı (çocuk hatayı görmüyorsa muhtemelen aynı yanılgıya sahiptir: teşhis değeri yüksek).
  - **kim**: iki öğrenci farklı sonuç bulur, iki defter yan yana. Cevaptan sonra hatalı satır işaretlenir.
  - **neden**: hatalı satır işaretli; şıklar yanılgı adlarıdır (biri gerçek, ikisi aynı konudan yakın yanılgı).
- Nerede: normal derste seviye 2–3'te soruların ~%15'i; Pratik Merkezi'nde **🔍 Hata Avcısı** modu (6 soru, biçimler sırayla bul/kim/bul/neden/bul/kim; çalışılmış becerilerden). Hız yarışında ve telafi sorusunda gelmez (`E.makeQ(id, lv, sade)`).
- Test: `test_generators.js` her senaryoda adımlardaki **her işlemi bağımsız hesaplar**, önek eşitliğini, sonuçların farklılığını, üç biçimin şık kurallarını ve Pi'nin okuyabileceği metni denetler.
- Yeni senaryo eklerken: önce `MIS`'te yanılgı olmalı; doğru ve hatalı çözümü aynı uzunlukta yaz; hatalı satır dışında aynı metni kullan; `node tools/soru_sozluk.js` → `soru-sesi` fonksiyonunu yeniden yükle.

### 5.1.3 Problem Atölyesi — çok adımlı gerçek hayat problemleri (17.10.2026)
Maarif'in **problem çözme** becerisi ve okulda artan "yeni nesil" sorular için. Kaynak `generators.js → PROB` (10 şablon, 7 temanın hepsi: kırtasiye alışverişi, okul gezisi, bahçeye tel, parke, kitap okuma tablosu, terazi, kumbara, pizza yarışı, renkli toplar, üçgen park).
- Her problem 4 aşamaya bölünür ve sıradan soru nesnelerine çevrilir (`ATOLYE.sorular(id)` → `q.atolye = {sablon, asama, baslik, baglam, sira, toplam}`):
  1. **Anla**: "Soruda ne isteniyor?" (yanlış şıklar: ara sonucu, toplamı ya da gereksiz bilgiyi istenen sanmak)
  2. **Planla**: "Hangi yolla çözersin?" (yanlış planlar yanılgılara bağlı: ters işlem, çevre-alan, kalanı yok saymak…)
  3. **Çöz**: 1–2 ara adım, sayı girişi; her yanlış sayı bir yanılgı
  4. **Kontrol et**: "Hangi işlem cevabını doğrular?" (ters işlemle sağlama)
- **Hata zincirlenmez:** sonraki adımın metni önceki adımın doğru değerini verir ("Toplam tutarı 130 TL bulduk…"). Her adımda önce ikinci şans (ipucu + yeniden deneme) vardır; ikinci yanlışta açıklamalı çözüm ve "Doğru değerle bir sonraki adıma geçiyoruz".
- **Bağlama özel geri bildirim:** her yanlış şık ve yanlış sayı kendi açıklamasını taşır (`[metin, yanılgı, açıklama]`, `inputMis: {v, mis, ac}`). Örnek: para üstünde toplama yapan çocuğa "Ödenen para = alışveriş tutarı + para üstü; para üstü = 200 − 130". "Anla" adımındaki yanlışlar iki yeni yanılgıya bağlıdır: `istenen_verilen` (verileni istenen sanma), `ara_sonuc` (ara sonucu cevap sanma). Test, her yanlışın açıklaması ve her adımın ipucu olduğunu, ipucunun cevabı söylemediğini denetler.
- **5. Kendin dene (bağımsız kanıt):** her problemin sonunda aynı türde, **yeni sayılarla**, iskelesiz tek soru (ara adım yok). İkinci şansı var ama "doğru değerle devam" yok. Öğrenmenin en güçlü kanıtı olarak ayrı ölçülür (`st.atolye.bagimsiz`), profilde 🎯 çubuğu, raporda ayrı satır.
- Pi, ilk adımda problemin tamamını okur (`q.okuma`; tablo okunmaz, ekranda görünür).
- **Ölçüm:** `st.atolye` aşama bazında doğruluk tutar. Profilde "Problem çözme adımlarım" çubukları; veli raporunda "🧩 Problem çözme: Anla %… · Planla %… · Çöz %… · Kontrol %…". Anlama/planlama, çözmeden 15 puan geride ise rapor "Hesaplamada değil, problemi anlamada zorlanıyor" der: satışın kalbi olan veli raporu için güçlü bir içgörü.
- Nerede: Pratik Merkezi → **🧩 Problem Atölyesi** (2 problem × 6 adım; çalışılmış temalardan). Yeni yanılgı: `kalan_yok` (bölmede kalanı hesaba katmama).
- **Örüntüde başlangıç ↔ ilk terim (17.10.2026, dış inceleme):** iki durum KARIŞTIRILMAZ. (a) Terimler 1., 2., 3. diye sayılıyorsa: n. terim = ilk terim + (n − 1) × artış → yanılgılar `oruntu_baslangic`, `oruntu_bir`. (b) Başlangıç anı varsa (0. gün/hafta, sonra n kez ekleme): toplam = başlangıç + n × artış → yanılgılar `baslangic_unutma`, `baslangic_sira` (başlangıcı 1. adım sanıp bir eksik artış eklemek). Kumbara problemi ve kitaptaki kumbara kalıbı (b) türüdür. Kumbara atölye problemi artık gerçek bir örüntü: hafta–para tablosu (0 = başlangıç), önce "her hafta kaç TL artıyor?", sonra kural.
- Metni değişen yanılgı açıklamasının sesi **yeni sürüm adıyla** üretilir (`MIS_SES_SURUM` in app.js, ör. `mis_oruntu_bir_2`): telefonda saklanan eski ses çalınmasın. `seslendir` fonksiyonunda `yenile: [anahtar]` ile üzerine yazma da var, ama cihaz önbelleği yüzünden sürüm adı tercih edilir.
- **Faz 2 (17.10.2026): tahmin, gerekçe, derinleştir.** Bir problemin adımları: anla → planla → *tahmin et* → çöz (1–2) → kontrol et → *derinleştir* → kendin dene. Şeritte 5 durak kalır; tahmin "Planla", derinleştir "Kontrol et" durağında gösterilir.
  - **Tahmin et** (`tahminSorusu`): "Hesaplamadan önce tahmin et: cevap kaç TL çıkar?" 2–3 aralık. Aralıklar rastgele değil: son adımın yanılgılı sonuçlarına göre kurulur (para üstünde toplama yapanın sonucu "fazla" aralığına düşer). Sınır, iki değer arasındaki en yuvarlak sayıdır ve ikisine de aralığın en az 1/4'ü kadar uzaktır; uygun sınır yoksa yanılgı ya da tahmin adımı atlanır (gezi, torba, pizza, kumbara çoğunlukla). **Tahmin doğru/yanlış diye işaretlenmez**: "📝 Tahminini not ettim" denir, şıklar renklenmez; son çözüm adımından sonra "🎯 Tahminin tuttu!" ya da "📏 Tahminin «…» idi; cevap «…» aralığında" gösterilir. Tahmin ustalığa, yanılgı defterine, seriye ve ders doğruluğuna **girmez** (kestirim kanıt değildir); sadece `st.atolye.tahmin` ve +2 XP.
  - **Gerekçe** (`gerekceSorusu`): dersin 2. probleminde kontrol adımı "Kontrol için şu işlemi yaptın: … Bu işlem cevabı neden doğrular?" olur. Doğru şık şablonun kontrol nedeni; yanlışlar iki yeni yanılgı: `kontrol_tekrar` (aynı yolu tekrarlamak), `kontrol_yuzeysel` (makul büyüklüğü kanıt sanmak). Ölçümde "Kontrol et" aşamasına sayılır.
  - **Derinleştir** (`derinSorusu`, şablondaki `derin: [doğru ifade, [[ifade, yanılgı, açıklama]…]]`): "Hangi işlem de aynı cevabı (160) verir?" Başka bir çözüm yolu (ör. `2 × 4 × (14 + 6)`, `(8 × 200) × 6`, `10 − (6 − 2)`, `70 + 8 × 10`). 6 şablonda var (market, bahce, parke, terazi, kumbara, ucgen). **Sadece o problemin çözüm adımlarının hepsini ilk denemede yapan çocuğa gelir** (motor atlar; zorlanan çocuğu yormaz). Test her ifadeyi parantez ve işlem önceliğiyle bağımsız hesaplar: doğru ifade cevabı vermeli, yanlışlar vermemeli.
  - Profil ve veli raporunda "Tahmin et" ve "Derinleştir" ölçüldüyse ayrı satır olarak görünür; zayıf aşama içgörüsü yalnız anla/planla/çöz/kontrol'den hesaplanır.
- **Faz 3 (17.10.2026): anla tablosu ve kartlarla işlem kurma.** Dersin 1. probleminde "Anla" adımı tablo, 2. probleminde "Planla" adımı işlem kurma olur (şablonda veri yoksa klasik çoktan seçmeli kalır).
  - **Anla tablosu** (`type: 'tablo'`, şablondaki `tablo: {verilen: [...], ara: [...], istenen}`): her bilgi satırında üç düğme: 📥 Verilen / 🔧 Önce bul / 🎯 Sorulan (sürükle-bırak yok, tek dokunuş; 10 şablonun hepsinde). `TABLO_CHECK` önce sorulan, sonra ara sonuç hatasına bakar: ara ↔ sorulan karışırsa `ara_sonuc`, verilen ile karışırsa `istenen_verilen`; açıklama satıra özeldir ("«Toplam tutar» cevaba giden yolda bir ara adım…"). İkinci şansta yalnız yanlış satırlar boşalır.
  - **Kartlarla işlem kur** (`type: 'kur'`, şablondaki `kur: {kartlar, ornek, ne}`): sayı kartları yalnız problemdeki sayılardır (her biri bir kez), işlem kartları + − × ÷ ( ) ve ⌫. Değer kodla hesaplanır (`ifadeHesapla`: parantez ve işlem önceliği; hatalı dizilişte ya da sıfıra bölmede null). **Doğru değeri veren her işlem kabul edilir** (`12 + 7 − 8` da `12 − 8 + 7` de). En az iki sayı kartı gerekir (tek kartla cevap yazılamaz). Yanlış değer sırayla şunlarla eşleştirilir: son adımın yanılgılı sonuçları, ara sonuç (`ara_sonuc`), derinleştir yanılgıları; hiçbiri tutmazsa `problem_adim` + "Kurduğun işlem 102 veriyor…". 7 şablonda var (gezi: yukarı yuvarlama, torba/pizza: kesir → yok).
  - Test: tablonun doğru yerleşimi kabul edilir, tek satırın her yanlış yerleşimi bilinen yanılgı + açıklama verir; işlem örneği kartlarla kurulup kabul edilir; iki kartlık bütün işlemler ya doğru ya bilinen yanılgıdır; tek kart, aynı kartı iki kez kullanma ve yarım işlem reddedilir.
- Kutlama yazısı ("Bravo!") geri bildirim kartının hemen üstünde ve daha küçük çıkar; soru metninin üstünü kapatmaz.
- Test: her şablon 400 kez üretilir; adım çözümlerindeki ve kontrol şıkkındaki her işlem bağımsız hesaplanır, şık/yanılgı kuralları ve Pi'nin okuyacağı metin denetlenir.

### 5.4 Öğretmen inceleme paneli (17.10.2026)
- Adres: `ogretmen.html?kod=<davet kodu>` (GitHub Pages'te `docs/ogretmen.html`; kaynak `src/ogretmen.html|js|css`, `build.py` üretir). Kodsuz ya da geçersiz kodla açılmaz, kayıt yapamaz.
- **Kim inceler:** henüz belirlenmedi (proje sahibi arıyor). Tercihen bu yıl ya da geçen yıl 5. sınıf okutmuş, Maarif kitabını bilen bir ortaokul matematik öğretmeni; mümkünse iki kişi. Bu bir resmî onay değil, **bizim kalite kuralımız**.
- **Örneklem (412):** her beceriden 10 soru (seviye 1·1·1·2·2·2·2·3·3·3), Hata Avcısı 42, Problem Atölyesi 20 (her şablondan biri klasik, biri tablo + işlem kurma + gerekçe). Sorular **tohumlu** rastgele üretilir (`soru_id` → hep aynı soru); ayrıca değerlendirilen sorunun tam kopyası (`soru` jsonb) ve yayın sürümü saklanır.
- Öğretmen her soruda doğru cevabı, **her yanlış şıkkın bağlı olduğu yanılgıyı**, öğrenciye gösterilen açıklamayı, ipucunu ve çözüm adımlarını görür. Karar: ✅ Uygun (tek dokunuş) · ✏️ Düzeltilsin · ❌ Uygun değil (etiket: dil, seviye, matematik hatası, müfredat dışı, çeldirici, açıklama, görsel, yöntem + not). Kararlar önce cihaza, sonra sunucuya; internet yoksa sırada bekler. Başka cihazdan girince eski kararlar geri gelir.
- Sunucu: `sunucu/supabase/ogretmen_inceleme.sql` (tablolar `inceleme_kodlari`, `soru_incelemeleri`; fonksiyonlar `inceleme_kod_gecerli`, `inceleme_kaydet`, `inceleme_listesi`, hepsi SECURITY DEFINER ve kod denetler; tabloya doğrudan yazma reddedilir). Yeni davet, iptal ve sonuç okuma sorguları dosyanın başında. Davet kodu gizli tutulur, yalnız öğretmenle paylaşılır.
- **İlk bulgusu (17.10.2026):** panel denenirken 15 konu-seviyede "genel/işlem hatası" etiketli dolgu şıkları çıktı (§1-3 ihlali). Düzeltildi: `mc()` artık yanılgıya bağlı olmayan dolguyu eklemez (soru 3 şıkla kalabilir); gerçek hatalar doğru etikete bağlandı (`bos_kisim`, `ara_sonuc`, `sifir_sayisi`); 4 yeni yanılgı: `nokta_ad`, `cember_parca`, `basamak_karsilastir`, `tahmin_tam`; müfredatta olmayan "kiriş" şıkkı çıkarıldı. Test artık `genel` etiketli tek bir yanlış şıkta bile hata verir.

### 5.5 Matematik ve program denetimi (19.10.2026)
Öğretmen bulunana kadar ajan denetimi yapıldı: 35 becerinin her seviyesinden örnekler, 21 Hata Avcısı senaryosu, 10 atölye şablonu, 140 anlatım kartı ve 32 görsel tek tek çözülüp kontrol edildi; konular MEB TYMM 5. sınıf programının resmî sayfalarıyla (tymm.meb.gov.tr, ünite 448 Geometrik Şekiller, 450 İşlemlerle Cebirsel Düşünme, 451 Geometrik Nicelikler, 452 İstatistik, 455 Veriden Olasılığa) karşılaştırıldı. **Program sınırları (uyulması zorunlu):**
- **Çokgenlerde köşegen SAYISINA değinilmez** (MAT.5.3). Köşegen yalnız tanımıyla sorulur; "bir köşeden n − 3 köşegen" soruları ve kart cümleleri kaldırıldı.
- Üçgen dışındaki çokgenlerin iç açıları toplamına değinilmez.
- **Dikdörtgenin alanı en fazla 36 birim kare** (MAT.5.4); kenarlar doğal sayı; birim dönüşümü yok. Üreticilerde `dikKenar()` bunu sağlar. Program kareyi özel bir dikdörtgen sayar (yine de "dikdörtgen" denen soruda kenarlar farklı tutulur).
- Üslü ifade yalnız kare ve küp. Algoritmada değişken kavramı yok.
- **Olasılık 5. sınıfta öznel/spektrum düzeyindedir** (MAT.5.6.1–2): "istenen / tüm" formülü tanımlanmaz; kesir **parça-bütün** ilişkisiyle gösterilir. Metinler buna göre değiştirildi (kart, yanılgı açıklaması, ipuçları). Kesirlerle toplama 5. sınıf kitabında yok; torba problemindeki "olasılıklar toplamı 1" kontrolü kaldırıldı.
**Bulunan ve düzeltilen hatalar:** işlem önceliği hikâye kartında yanlış örnek ("3 × 4 + 2" soldan sağa yine 14 verir; "2 + 3 × 4" yapıldı); yanılgılı değerin doğru cevaba eşit olduğu sorular (daire grafiğinde yarım dilim, 4×4 ve 3×6 odada çevre = alan) → `Q()` artık bunları atar, test yakalar; yanlış etiketlenen yanılgılar (market fiyatı → `tam_kisim`, karenin çevresi ÷2 → `kare_cevre`, araştırma soruları → `veri_kaynak`/`anket_kural`, akış şeması karar → `karar_dongu`, eşit paydalı karşılaştırma → `esit_payda`); anlamsız çeldiriciler (75 × 50 → 385, 4³ → 68, örüntüde +1, işlem önceliğinde negatif sonuç). Metni değişen kart/yanılgı sesleri sürüm adıyla yeniden üretildi (`KART_SES_SURUM`, `MIS_SES_SURUM`).
**Kitapla doğrulandı (19.10.2026, 2026-2027 baskısı):** olasılıkta kitap çark ve torba için "olasılığını kesir, yüzde ya da ondalık gösterim olarak **tahmin** ediniz" der (2. kitap s. 168, 172, 174); formül vermez, gerekçe ister. Bizim kesirli sorularımız buna uygun, parça-bütün dili doğru. Anahtar kavramlar (1. kitap s. 12): tümler, bütünler, komşu, ters açı, çakışık doğrular, kesen, düzgün çokgen geçer. Kitapta zar yerine **sayı küpü** denir (2. kitap s. 172; sorular buna çevrildi). Çember notasyonu kitapta yarıçap **r**, çap **R** (1. kitap s. 28). 2026-2027 baskısının sayfa numaraları `mufredat.json`daki sayfalarla aynı.
**Olasılık dili kitaba göre düzeltildi (19.10.2026, 2. kitap s. 164–178 incelendi):** kitap olasılığı formülle değil **tahmin + gerekçe** ile işler (kesir, yüzde, ondalık; spektrum; "çünkü kırmızı topların sayısı fazla"). Uygulamada kalan "istenen / tüm", "bu toplama bölerim", "mavi dilim / tüm dilimler" ifadeleri parça–bütün diline çevrildi (torba atölyesi planı ve adımları, çark sorusu adımları, `olasilik_buyuk` açıklaması, spektrum görsel kartı; sesler `_2` sürümüyle yeniden üretildi). `p_spektrum` seviye 3'e kitaptaki etkinlik türlerinden esinlenen 3 yeni özgün soru eklendi: **gerekçe** (sevdiği renk / şanslı sayı gerekçe değildir), **adil oyun** (renk küpü), **spektrumda yer** (0,2 · %75 · 1…). İki yeni yanılgı: `olasilik_tercih`, `iki_sonuc_esit` (toplam 92).
**Kitap metni (yalnız geliştirici):** iki kitabın sayfa metni Supabase `gelistirici_kitap` tablosunda (RLS açık, politika yok; yalnız servis rolü). `kitap-metin` fonksiyonu PDF'i parça parça okuyup yazar, `kitap-md` Markdown'u özel `gelistirici` deposuna koyar ve 7 günlük imzalı bağlantı verir. İndirilen kopyalar için yerel klasör `kaynak/` (gitignore). **Kitap metni depoya, uygulamaya ya da herkese açık bir yere konmaz** (§1-5). Metni çıkmayan sayfalar: 1. kitap s. 100, 2. kitap s. 144.

### 5.6 İki kitapla konu konu karşılaştırma (19.10.2026)
35 becerinin hepsi 1. ve 2. kitabın (2026-2027 baskısı) ilgili sayfalarıyla karşılaştırıldı. Kitabın kullandığı kavram, terim ve soru türü uygulamada yoksa **özgün** yeni soru eklendi (mekanizma `generators.js → EK`: `ekle(beceri, seviyeler, olasılık, üretici)`; becerinin asıl üreticisini sarar, verilen olasılıkla ek türü seçer). Yeni sorular kitap metni kopyalanmadan, yalnız matematiksel yapı alınarak yazıldı (§1-4, §1-5).
- **Terimler kitaba uyduruldu:** "iletki" → **açıölçer**; "dik üçgen" → **dik açılı üçgen**; "basit kesir" kitapta yok → kesir türleri **birim / bileşik / tam sayılı**; araştırma adımları kitaptaki 4 adla (soru belirleme → verileri toplama ve analize hazırlama → veri görselleştirme ve özetleme → sonuçları yorumlama); düzgün çokgende "çevre" (3. tema konusu) yerine "bütün kenarlarının uzunlukları toplamı".
- **Tema 1:** açı adlandırma (köşe harfi ortada), iki noktadan tek doğru / bir noktadan sonsuz doğru, pergel açıklığı = yarıçap, çember-daire modelleri, tek dikme ve en kısa yol, çakışık doğrular, paralel + kesen eş açılar, çokgende dış açı, çokgen adlandırma, köşegeni olmayan çokgen, kenarlarına göre üçgen, üçgende iki dik/geniş açı olamaz, çemberlerle üçgen inşası. Nokta sayma 3–5 noktaya indirildi.
- **Tema 2:** çarpım biçiminde çözümleme, üç sayıyı sıralama, bölük kartlarıyla en büyük sayı (058 kartı), bilinmeyen bölen/bölünen/çarpan, kalanlı bölmede yukarı yuvarlama (teleferik, taksit), molalı zaman problemi. **Bulunan hata:** `n_toplacikar` seviye 3 "kalan para" sorusu bazen negatif cevap veriyordu; düzeltildi ve test artık negatif cevabı hata sayar.
- **Tema 3:** Ç(ABCD)/A(ABCD) gösterimi, çevresi ya da alanı verilen kaç farklı dikdörtgen, çevresi tek sayı olan dikdörtgen çizilemez, alanı verilen pist için en kısa çit. Kitapta 36 birim kareden büyük alan örnekleri de var; uygulamanın 36 sınırı (§5.5) temkin için korundu.
- **Tema 4:** tam kısım / ondalık kısım, %100'den büyük yüzdeler, tam sayılı ↔ bileşik kesir karşılaştırma, yüzde ve ondalık gösterimleri birlikte sıralama.
- **Tema 5:** verinin değişebilirliği, araştırma sorusunun ölçütleri, çok veride nokta grafiğinin zorluğu, daire grafiğinde yüzdeler toplamı %100, yüzdeli daire grafiğinden kişi sayısı.
- **Tema 6:** toplamı koruyan telafi, eşitliğin iki yanını aynı sayıyla çarpma, işlem özelliklerinde sembol (▲) bulma, kare/küp okunuşu, aynı öncelikte soldan sağa (64 ÷ 4 × 8), problemden sayı cümlesi (tavuk-tavşan), örüntüde "kaçıncı adım", örüntü kuralı ("adım sayısının 3 katının 1 fazlası"), artışı sabit olmayan örüntü, tekrarlı çıkarmayla bölme algoritması (sayaç), tekrarlı toplama → çarpma.
- **Tema 7:** olasılığı kesin (%100, 1) ve imkânsız (%0, 0) olan olaylar (dil düzeltmesi §5.5'te).
- 12 yeni yanılgı (katalog 105): `aci_isim`, `paralel_kesen`, `dis_aci`, `cokgen_isim`, `ucgen_aci_siniri`, `cember_insa`, `ondalik_parca`, `daire_toplam`, `grafik_secim`, `ayni_oncelik`, `oruntu_kural`, `oruntu_sabit`. Metni değişen sesler sürüm adıyla üretildi: `mis_iletki_ters_2`, `mis_adim_sira_2`, `kart_g_aci_adim_2`, `kart_f_tur_adim_2`.

### 5.2 Kitap kalıbı → varyasyon tablosu (uygulananlar)
| Kitap kalıbı (sayfa) | Bizim varyasyonumuz | Beceri |
|---|---|---|
| 0–9 rakamlarını birer kez kullanarak en büyük/küçük sayı (1. kitap s. 109) | 4–6 rastgele rakam, en büyük/en küçük; "0 ile başlatma" yanılgısı | n_karsilastir |
| Okunuşu verilen 12 basamaklı sayıda eksik bölük (1. kitap s. 109) | Rastgele 12 basamaklı sayı, gizlenen milyar/milyon bölüğü | n_okuma |
| Alışveriş/bütçe problemleri (1. kitap s. 120–121) | Rastgele market fişi + para üstü | n_problem |
| Tiyatro süresi (1. kitap s. 133) | Rastgele başlangıç/bitiş saati, "saati ondalık gibi çıkarma" yanılgısı | n_problem |
| Etiket fiyatı okuma (2. kitap s. 21) | Rastgele lira-kuruş okunuşu | f_ondalik |
| İki marketin fiyat karşılaştırması (2. kitap s. 42) | Rastgele ürün/fiyat; 239,50 = 239,5 tuzağı | f_ondalik_karsilastir |
| İndirim tabelası % (2. kitap s. 17, 43) | %p → p/100 | f_yuzde |
| Parke fiyat listesi (1. kitap s. 158) | Oda alanı × m² fiyatı | a_alan |
| Bahçe çevresi/tel (1. kitap s. 142–144) | k sıra tel = k × çevre | a_cevre |
| Üçgenin iki açısı verilmiş (1. kitap s. 73) | Dik üçgende diğer dar açı | g_ucgen |
| Kumbara örüntüsü (2. kitap s. 139) | Başlangıç parası + günlük ekleme | e_oruntu |
| Ayran akış şeması (2. kitap s. 150–152) | Karar adımı, başla/bitir, döngü | e_algoritma |
| Terazi dengesi (2. kitap s. 120) | Rastgele kütlelerle eksik ağırlık | e_esitlik |

Yeni kalıp eklerken: kitaptaki sorunun **matematiksel yapısını** çıkar (ne veriliyor, ne isteniyor, hangi hata yapılabilir), sonra kitap metnine bakmadan yeni bağlamla yaz. Varyasyon üreticileri `generators.js → VAR` içinde; bir beceri çağrıldığında %40 olasılıkla kitap kalıbı varyasyonu gelir.

### 5.3 LLM'in rolü (üretim fazında)
- LLM **hikâye/bağlam metni** ve **açıklama dili** üretir; şablona sayı yerleştirme kodla yapılır.
- LLM çıktısı JSON şemasına uymalı; sayı içeren her cümle kodla yeniden hesaplanır, uyuşmazsa çıktı atılır.
- Öğrenciyle serbest sohbet (Sokratik öğretmen) ancak §1-5 güvenlik kuralları, içerik filtresi ve kayıt altına alma ile açılır.

---

## 6. Ses ve animasyon hattı

### 6.1 Seslendirme — KARAR VERİLDİ
- **Pi'nin tek bir sesi var; uygulamadaki her şeyi (replik, konu anlatımı, yanılgı açıklaması) aynı ses okur.** Çocuk Pi'yi hem arkadaş hem öğretmen olarak tanır; ses değişirse karakter dağılır.
- **Seçilen ses (17.10.2026):** ElevenLabs "Damla – Energetic YouTuber" (`voice_id: A2XgcJ6lQVEFeIaIUyrc`), model `eleven_v4`, mp3 44.1 kHz **128 kbps**; Pi'nin kısa repliklerine `[cheerful]` yön etiketi. Sesler `sesler/damla/` klasöründe. Önceki ses (Gamze, 64 kbps) telefonda "telefon görüşmesi gibi" duyulduğu için değiştirildi; eski dosyalar depo kökünde duruyor. Seçim, proje sahibinin 4 sesi dinleyerek karşılaştırmasıyla yapıldı.
- **Model:** toplu üretimde `eleven_multilingual_v2` (kararlı, Türkçe destekli). Duygu etiketli kısa replikler istenirse `eleven_v4` (`[cheerful]`, `[excited]` etiketleri).
- **Ses ayarı:** stability 0.5, similarity 0.8, speaker boost açık (eleven_v4). Biçim: mp3, 44.1 kHz, 128 kbps.
- **Yönlendirme (öğrenciyi uygulamada tutmak için):** açılışta "tekrar hoş geldin", derse girişte cesaretlendirme, 25 sn takılınca ipucuna yönlendirme (ampul sallanır), her yanlışta incitmeyen bir cümle, telafi sorusundan önce "sen yaparsın", yarı yolda ve ders sonunda kutlama; yanılgı açıklaması 🔊 ile sesli dinlenir.
- **Araya girmeme kuralı (17.10.2026):** 25 sn takılma yönlendirmesi, soru okuması ya da başka bir Pi sesi sürerken **asla** çalmaz (6 sn sonra yeniden bakar); ekrana her dokunuş sayacı sıfırlar. Neden: iPhone'da soru robot sesle okunurken Pi'nin "Soruyu bir daha oku…" repliği okumayı yarıda kesti (proje sahibinin videosu, `dinle` fonksiyonuyla yazıya döküldü).
- **Pi soruyu kendi sesiyle okur (17.10.2026):** çocuk 🔊'ya ya da Pi'ye dokununca soru metni Damla sesiyle okunur (ağız sesle senkron). `U.soruSesi` metni hazırlar (cm → santimetre, işlem parantezi → "parantez aç/kapa", TL ekleri). Ses SHA-256 özetiyle `sesler/soru/<özet>.mp3` olarak saklanır; aynı soru bir daha gelince **hiç kredi harcanmaz** (telefonda da Cache API'de durur). Yoksa `soru-sesi` fonksiyonu bir kez üretir. **Güvenlik:** fonksiyon yalnızca uygulamanın üretebileceği kelimelerden oluşan metni seslendirir (`functions/soru-sesi/sozluk.ts`, `node tools/soru_sozluk.js` ile üretilir; test eskiyse uyarır) → kimse Pi'nin sesine keyfî cümle söyletemez. **Maliyet sınırı:** cihaz (IP özeti) başına günde 40 yeni ses, uygulama geneli günde 6 000 karakter (`SORU_SESI_CIHAZ_ADET`, `SORU_SESI_TOPLAM_KARAKTER` ile değiştirilir; sayaç `soru_sesi_gunluk` tablosu). Sunucu reddederse ya da 8 sn'de cevap gelmezse robot sese düşülür (çocuk sessiz kalmaz). Pi şimdilik yalnızca soru kökünü okur, şıkları okumaz. Üreticiler değişince: `node tools/soru_sozluk.js` → `soru-sesi` fonksiyonunu yeniden yükle.
- **Ne zaman konuşur (özet):** konu anlatım kartı açılınca; 3/5/8'li seride ve telafi doğrusunda (her zaman); normal doğruda %40 olasılıkla kısa övgü ("Harika!"); yanlışta %50 olasılıkla teselli; ders sonunda. Her soruda konuşmaz (sıkıcı ve yorucu olur).
- **Mimari:** sesler önceden üretilir → Supabase `sesler` deposu (`<anahtar>.mp3` + `manifest.json`). Uygulama mp3'ü `fetch` ile alır, telefonda Cache API'de (`pi-sesleri-v1`) saklar ve blob olarak çalar; çevrimdışı katman (sw.js) ses/range isteklerine **karışmaz** (Android Chrome'da Pi sesinin yerine robot ses çalması bu yüzdendi, 16.10.2026). Pi'nin sabit replikleri çalınamazsa **robot sese düşülmez, sessiz kalınır**; cihaz sesi yalnızca değişken sayılı soru okumada kullanılır. Ayarlarda "Pi'nin sesi hazır (N kayıt)" göstergesi var.
- **Önerilen yol (sunucu):** `seslendir` Edge Function'ı ElevenLabs anahtarını Supabase Secrets'ta tutar, sesleri `sesler` deposuna koyar; uygulama `config.js` doluysa sesleri oradan çalar. Tetikleme: `python3 tools/sunucuda_seslendir.py`.
- **Sunucusuz yol (Termux):** `bash tools/sesleri_uret.sh` — anahtarı gizli sorar, **hiçbir dosyaya yazmaz**. Anahtar asla depoya, zip'e veya koda konmaz.
- **Üretim:** `node tools/ses_listesi.js` (239 kayıt, ~27 600 karakter: 30 Pi repliği + 140 anlatım kartı + 69 yanılgı açıklaması) → `python3 tools/seslendir.py --grup pi` → `python3 tools/seslendir.py`. Betik var olan dosyaları atlar; yarıda kalırsa kaldığı yerden devam eder.
- **Ölçülmüş maliyet:** ~470 karakterlik bir çekim ≈ 437 kredi (≈ 0,08 USD, eleven_v4). Buna göre tüm paket yaklaşık 26–28 bin kredi tutar ve **bir kerelik** maliyettir. Kesin rakam planına bağlıdır; `--dene` ile önce sayılır.
- **Ses anahtarları yalnızca `a-z0-9_` olur** (Supabase deposu Türkçe harfli dosya adını reddeder; 16.10.2026'da `mis_bolük_kayma` bu yüzden 27 kez boşuna üretildi). `tools/ses_listesi.js`, `seslendir` fonksiyonu ve `ses_kuyrugu` tablosu bunu denetler. Yanılgı kimliklerinde Türkçe harf kullanma.
- **Dikkat:** `data/seslendirme.json` 16.10.2026'da elle temizlendi ("boşluk", `<`, `→`, "doğru dur" gibi okunuş hataları). `node tools/ses_listesi.js` yeniden çalıştırılırsa bu düzeltmeler silinir; önce temizleme kurallarını `U.toSpeech`'e taşı.
- **Metin normalleştirme (TTS'e gitmeden önce, `U.toSpeech`):** kesir → "dörtte üç", `%5` → "yüzde beş", `×` "çarpı", `÷` "bölü", `−` "eksi", `²` "kare", `°` "derece", `15 702 436` → boşluksuz sayı.

### 6.2 Animasyon — KARAR VERİLDİ
**Doğru cevap kutlaması (`src/fx.js`)**: kontrol butonuna basıldığı anda tam ekran, ~1,1–1,5 sn, dokununca geçilir, dersin akışını durdurmaz.
| Durum | Animasyon | Ses |
|---|---|---|
| Normal doğru | 5 efektten biri, aynısı arka arkaya gelmez: yıldız patlaması, konfeti topu, havai fişek, Pi roketi, emoji yağmuru + zıplayan övgü yazısı + uçan "+10 XP" | çift nota "ding" + %40 Pi övgüsü |
| 3–4'lü seri | "🔥 3 Seri!" alev halkası ve alev yağmuru | hızlı yükselen arpej + Pi: "Seri ateşi yandı!" |
| 5–7'li seri | "DURDURULAMAZ!" altın yazı, 3 havai fişek, ekran sarsılır, Pi zıplar | fanfar + Pi |
| 8+ seri | "EFSANE!" gökkuşağı yazı, 5 havai fişek + konfeti, Pi zıplar | büyük fanfar + Pi |
| Telafi doğru | 🌱→🌿→🌳 filiz büyür, "Hatandan öğrendin!" | yumuşak yükselen melodi + Pi |
- Telefon titreşimi: normal 25 ms, seri/telafi kısa desen.
- "Hareketi azalt" açık cihazlarda sadece büyük ✓ ve +XP gösterilir.
- Canvas parçacık motoru (kütüphane yok) → düşük pil ve dosya maliyeti.
- Üretim fazında Pi'nin `bekle / sevin / üzül / düşün / konuş` durumları **Rive** dosyasına taşınır (Duolingo karakter animasyonlarında Rive kullanıyor; dosyalar küçük ve etkileşimli).
- **Telafi sahnesi (17.10.2026):** telafi sorusu doğru yapılınca eski filiz efekti yerine Pi'nin enerji kalkanıyla güçlendiği aksiyonlu sahne (`sahne_telafi`, 720p) + "💪 Hatandan öğrendin!". Sahne oynatılamazsa filiz efekti yedek olarak kalır.
- **Bilim kurgu sahneleri (17.10.2026):** seri 3 (`ates`), 5 (`durdurulamaz`), 8 ve sonrasında her 5'te (`efsane`) ve ders sonunda (`bitti`) 2–3 sn'lik dikey video (`src/pwa/img/sahne_*.mp4`). Higgsfield: önce Pi referanslı 9:16 açılış karesi (gpt_image_2_5), sonra Seedance 2.0 Mini ile 4 sn sessiz video; ffmpeg ile kırpılıp ~480p H.264'e sıkıştırıldı. Dokununca geçilir, bitince kapanır, en fazla 4,2 sn. **Sıradan doğru cevapta sahne yok** (ders temposu). Hız yarışında ve seviye belirlemede oynamaz; "hareketi azalt" açıksa hiç oynamaz. Ders başında arka planda blob olarak indirilir.
- **Higgsfield** uygulama *dışı* içerik için: tema açılış videoları (10–20 sn), mağaza tanıtım videosu, sosyal medya reklamları, Pi karakter sayfası. Uygulama içine ağır video konmaz.

## 7. Mimari (telefondan geliştirilebilir yol)

### Faz A — PWA (bu prototip) ✅
- Tek dosya: HTML + CSS + saf JavaScript, kütüphane yok, derleme yok. `python3 build.py` → `dist/`.
- Veri: tarayıcının `localStorage`'ı (cihazda). Çevrimdışı çalışır (`sw.js`).
- Yayın: GitHub Pages / Netlify / Vercel (ücretsiz), Termux'tan `git push` ile.
- Telefona kurulum: Chrome → "Ana ekrana ekle".

### Faz B — Sunucu (ücretli satış için gerekli) — KOD HAZIR, kurulum `sunucu/SUNUCU_KURULUM.md`
- **Supabase** (Postgres + Auth + Row Level Security + Edge Functions). Mevcut yığınla uyumlu (Supabase + pgvector zaten planda).
- Tablolar: `veliler`, `ogrenciler` (veli_id), `beceri_durumu` (ogrenci_id, beceri_id, pL, n, ok, yari_omur, son), `cevaplar` (her cevap: soru parametreleri, seçilen şık, yanılgı, süre, ipucu), `yanilgilar`, `oturumlar`, `bicim_bandit`, `abonelikler`, `rizalar` (metin sürümü + zaman damgası).
- Lig eşleşmesi: haftalık, aynı lig + benzer XP'li 10 gerçek öğrenci; takma ad zorunlu, sohbet yok.
- Otomatik veli raporu: haftalık zamanlanmış Edge Function → e-posta servisi + **WhatsApp Business Platform** (Cloud API). WhatsApp'ta işletmenin başlattığı mesajlar Meta onaylı şablon gerektirir; veli opt-in'i şarttır.
- Öğretmen paneli: sınıf bazında beceri ısı haritası, en sık yanılgılar.

### Faz C — Mağaza
- Google Play: PWA'yı **Trusted Web Activity** olarak paketle (PWABuilder) veya Capacitor ile sar.
- Play Store'da dijital içerik satışında Google Play Faturalandırma kullanılmalıdır. Web'den satışta Türkiye'de çalışan ödeme altyapıları (ör. iyzico, PayTR) kullanılabilir.
- Play Store "Aileler" politikaları ve çocuk uygulaması gereksinimleri yayın öncesi kontrol edilir.

---

## 8. Dosya haritası
```
CLAUDE.md                 ← bu belge
README.md                 ← telefonda çalıştırma / yayınlama
data/mufredat.json        ← 7 tema, 35 beceri, 105 yanılgı, 140 anlatım (makine okur)
src/core.js               ← yardımcılar, Türkçe sayı okunuşu, ek uyumu, SVG görseller
src/generators.js         ← 35 parametrik soru üreticisi + yanılgı kataloğu (105) + Hata Avcısı senaryoları (SEN) + Problem Atölyesi şablonları (PROB)
src/curriculum.js         ← tema/beceri haritası + 4 biçimli anlatım kartları
src/engine.js             ← BKT, tekrar, bandit, oturum, rozet, veli raporu, lig
src/app.js                ← arayüz, maskot, ses, akışlar
src/cloud.js              ← Supabase bağlantısı: giriş, bulut kaydı, gerçek lig, cevap günlüğü (config.js boşsa kapalı)
sunucu/supabase/          ← schema.sql (tablolar + RLS + lig), zamanlama.sql (cron), functions/seslendir, functions/haftalik-rapor, functions/soru-sesi (Pi'nin soru okuması), functions/dinle (geliştirici: ses → yazı)
tools/soru_sozluk.js      ← soru-sesi için izinli kelime sözlüğü
src/fx.js                 ← doğru cevap kutlama animasyonları (5 efekt + seri kademeleri)
src/voice.js              ← Pi'nin replikleri (yazı + ses anahtarı)
tools/ses_listesi.js      ← seslendirilecek 239 metni toplar
tools/seslendir.py        ← ElevenLabs ile tüm sesleri üretir (Termux'ta çalışır)
src/style.css             ← tasarım belirteçleri (açık/koyu tema)
build.py                  ← dist/index.html (PWA) + dist/artifact.html
test/test_generators.js   ← 63 000 soruluk doğrulama
test/sim_engine.js        ← farklı öğrenci tipleriyle motor simülasyonu
test/test_plan.js         ← okul takvimi, ön bilgi yoklaması, haftalık plan testleri
test/e2e_aile.py          ← aile kodu ile yedek: iki telefonlu uçtan uca test (sahte sunucu)
test/e2e.py               ← telefon boyutunda uçtan uca tarayıcı testi (Playwright)
```

---

## 9. Tasarım dili
- Renk belirteçleri `style.css :root` içinde; açık ve koyu tema. Ana renk mor-mavi (#5B4BFF), vurgu turuncu, doğru yeşil, yanlış kırmızı; her temanın kendi rengi.
- Font: Nunito (yuvarlak, çocuk dostu, Türkçe karakter tam).
- 3B "basılır" butonlar, büyük dokunma alanları (en az 48 px), tek elle kullanım (alt menü, alt butonlar).
- Kesir her yerde üst üste yazılır (`U.fr`), sayılar kitap gibi 3'lü boşlukla (`15 702 436`), ondalıkta virgül.
- `prefers-reduced-motion` açıksa animasyon ve konfeti kapanır.

---

## 10. Gelir modeli (kesin olanlar ve test edilecekler)

**Kesin olarak önerdiklerim:**
- **Freemium + aile aboneliği:** her temanın ilk becerileri ve günlük sınırlı ders ücretsiz; tüm temalar, sınırsız ders, Hatalarım/Tekrar, haftalık otomatik veli raporu ücretli.
- **Okul/kurum lisansı (B2B):** öğretmen paneli + sınıf raporları, öğrenci başına yıllık lisans.
- Çocuk uygulamasında **reklam yok** (güven ve mevzuat).
- Satışın kalbi **veli raporudur**: veli "çocuğum neyi bilmiyor, neden?" sorusunun cevabını görür. Ücretsiz sürümde rapor örneği gösterilir.

**Kesin değil, mutlaka test edilecek:** fiyat seviyesi, ücretsiz sınırın nerede çizileceği, aylık/yıllık oranı. Yöntem: ilk 100 ailelik pilot, iki fiyat seviyesi, dönüşüm ve 30 günlük elde tutma ölçülür.

**Ölçülecek metrikler:** D1/D7/D30 elde tutma, haftalık aktif öğrenci, ders tamamlama oranı, beceri başına ustalık artışı, yanılgı düzelme oranı, ön test–son test farkı (pilot okulda), veli raporu açılma oranı, ücretsizden ücretliye dönüşüm.

---

## 11. Yol haritası ve kabul ölçütleri

| Faz | İçerik | Kabul ölçütü |
|---|---|---|
| A1 ✅ | 35 beceri üretici, 4 biçimli anlatım, motor, oyunlaştırma, veli raporu paylaşımı | Test 0 hata; telefonda tüm akışlar konsol hatasız |
| A2 | Öğretmen soru incelemesi; her beceriye 2. üretici şablonu; Rive Pi; ElevenLabs ses paketi | Öğretmen onaylı 30 örnek/beceri; ses dosyaları < 5 MB toplam |
| B1 | Supabase hesapları, veli rızası akışı, bulut senkron | KVKK hukukçu onayı; RLS testleri |
| B2 | Gerçek lig, haftalık otomatik rapor (e-posta + WhatsApp şablonu) | Meta şablon onayı; rapor gönderim başarı oranı > %98 |
| B3 | Pilot okul (2 sınıf, 6 hafta), ön/son test | Ustalık artışı ve elle tutulur öğretmen geri bildirimi |
| C | Play Store (TWA), abonelik, öğretmen paneli | Mağaza onayı; ödeme akışı uçtan uca test |

---

## 12. Prototipte bilinçli olarak eksik bırakılanlar
- Veriler cihazda; veli isterse aile koduyla buluta yedeklenir ve yeni telefona taşınır (§3.5). Gerçek hesap (e-postalı giriş) özel SMTP ister.
- Lig rakipleri demo (ekranda "(demo)" yazar).
- Veli raporu tek dokunuşla WhatsApp/Telegram/e-posta açar; **otomatik** haftalık gönderim sunucu ister.
- BKT parametreleri literatürdeki tipik değerlerle elle ayarlandı; gerçek öğrenci verisiyle (pyBKT) yeniden kalibre edilecek.
- Performans görevleri, anket yapma, iletki/pergel ile çizim gibi **uygulamalı** kazanımlar ekranda tam karşılanamaz; uygulama bunlar için kitaptaki sayfaya ve sınıf etkinliğine yönlendirir. Kesirde parmakla bölme/boyama ve sayı doğrusu eklendi (§5.1.1); sürükle-bırak açı ölçer ve grafik çizme etkileşimleri A2'de eklenecek.

---

## 13. Ajanlar için çalışma kuralları
- Bir değişiklikten sonra **her zaman**: `node test/test_generators.js` → `node test/test_plan.js` → `python3 build.py` → (mümkünse) `python3 test/e2e.py` ve `python3 test/e2e_aile.py`. (e2e artık depodaki güncel `dist/`i açar; 17.10.2026'ya kadar sabit bir yoldan eski bir kopyayı açıyordu.)
- Yeni dosya ekleme yerine mevcut yapıyı genişlet. Kütüphane eklemeden önce gerekçe yaz; tek dosya PWA yapısı korunur (Faz A).
- Kullanıcıya görünen her metin Türkçe, 10–11 yaşa uygun, kısa cümleli. Teknik terimleri kitabın kullandığı adlarla yaz (bütünler, tümler, sıklık tablosu…).
- Emin olmadığın bir bilgiyi (fiyat, mevzuat ayrıntısı, platform politikası) kesinmiş gibi yazma; "doğrulanmalı" diye işaretle.

## Kaynaklar
- MEB, 5. Sınıf Matematik Ders Kitabı 1. ve 2. kitap (2024, TTKB 17.07.2024 kabul).
- Duolingo, "Learning how to help you learn: Introducing Birdbrain" — https://blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain
- Duolingo, "How we learn how you learn" (Half-Life Regression) — https://blog.duolingo.com/how-we-learn-how-you-learn/
- Rive, "Duolingo's AI-powered video call brings Lily to life" — https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life
- Pashler, McDaniel, Rohrer, Bjork (2008), *Learning Styles: Concepts and Evidence* — https://digitalcommons.usf.edu/psy_facpub/1765/
- pyBKT (Bayesian Knowledge Tracing kütüphanesi) — https://arxiv.org/abs/2105.00385
- open-spaced-repetition / FSRS (alternatif tekrar algoritması) — https://github.com/open-spaced-repetition
