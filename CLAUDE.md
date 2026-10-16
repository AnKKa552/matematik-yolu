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
3. **Her yanlış şık bir kavram yanılgısına bağlıdır.** Rastgele çeldirici yoktur. Çeldirici, belgelenmiş bir öğrenci hatasından türetilir (`MIS` kataloğu, 67 yanılgı). Bu sayede sistem öğrencinin *neyi neden* yanlış yaptığını bilir.
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
| Kıvrımlı öğrenme yolu (path) | Tek net "sonraki adım", ilerlemeyi görünür kılar | Tema başına zikzak beceri yolu, kitaptaki sıra, düğümde yıldız/taç | ✅ Prototipte |
| Kısa dersler (3–5 dk) | Başlama eşiğini düşürür | 6–10 soruluk ders; uzunluk öğrencinin hızına göre ayarlanır | ✅ |
| XP + günlük hedef | Küçük, sık ödül | Doğru 10, telafi doğru 15, 5'li seri +5, ders sonu +15, kusursuz +10; günlük hedef 20/50/80/120 | ✅ |
| Seri (streak) + seri dondurucu | Alışkanlık oluşturma, kayıp kaçınma | Günlük seri + elmasla alınan "seri koruyucu" (ceza değil, güvence) | ✅ |
| Haftalık ligler (10 lig, ilk sıralar yükselir) | Sosyal karşılaştırma, rekabet | 5 lig (Bronz→Elmas), 10 kişilik grup, ilk 3 yükselir | ✅ Demo rakiplerle; gerçek eşleşme sunucu fazında |
| Elmas (gems), sandık | Değişken ödül | Ders sonu sandıktan elmas; elmas yalnızca seri koruyucuya harcanır | ✅ |
| Kalp/can | Dikkat, aynı zamanda abonelik satışı | **Alınmadı.** Yerine "telafi sorusu" | ❌ bilinçli |
| Maskot (Duo) | Duygusal bağ, geri bildirim | Özgün maskot **Pi** (17.10.2026'dan itibaren: mavi, ters kasketli 3B karakter; proje sahibi yapay zekâ ile üretti). 6 hal görseli `src/pwa/img/pi_*.webp` (bekle, sevin, düşün, üzgün-teselli, konuş, roket), kaynaklar `tasarim/kaynak/` | ✅ |
| Birdbrain (zorluk kişiselleştirme) | Doğru zorluk = akış | BKT ustalık modeli + seviye seçimi (bkz. §4) | ✅ |
| Half-Life Regression (aralıklı tekrar) | Unutma eğrisine göre tekrar | Beceri başına yarı ömür; "Tekrar Zamanı" | ✅ basitleştirilmiş |
| "Hatalarımı çalış" | Zayıf noktayı kapatma | "Hatalarım" defteri, yanılgı bazında tekrar | ✅ |
| Rive animasyonlu karakterler | Canlılık, düşük dosya boyutu | Prototipte CSS/SVG; üretimde Rive durum makinesi | 🔜 |
| Sesli okuma | Okuma güçlüğü olanlara erişim | Cihaz TTS (prototip) → ElevenLabs önceden üretilmiş ses (üretim) | ✅/🔜 |
| Bildirimler | Geri çağırma | Günde en fazla 1, saat 20.30'dan sonra yok, veli ayarlar | 🔜 |

**Bizim Duolingo'da olmayan farkımız:**
- **Kavram yanılgısı teşhisi** (yanlış şıkkın *nedeni* bilinir ve hedefli açıklama gelir).
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
| Haritada yaşayan karakterler | **Harita mahallesi (17.10.2026):** her temanın özgün bir komşusu var (Pergo pergelli robot, Bilge baykuş, Metre Usta kunduz, Aşçı Dilim kedi, Grafi tavşan, Denge fil, Şans ejder). Yolun 2. düğümünün yanında durur, kendine has boşta hareketi var (sallanma/eğilme/zıplama/uçma). Dokununca zıplar ve konuyla ilgili kısa bir ipucu söyler (3 cümle sırayla). Tema değişince kendini bir kez tanıtır. **Sesleri yok** (uygulamadaki tek ses Pi'nin, §6.1); sadece yazı balonu ve kısa nota. Görseller `src/pwa/img/komsu_t1…t7.webp` (12–21 KB), kaynaklar `tasarim/kaynak/komsu_k*.png`. |

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

### 4.3 Hata döngüsü (hatadan öğrenme)
1. Yanlış cevap → geri bildirim sayfası: doğru cevap + **yanılgı adı ve düzeltme açıklaması** + adım adım çözüm.
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
- Mod'lar: `lesson`, `learn` (önce anlatım, 5 soru), `review`, `mistakes`, `mix`, `speed` (60 sn), `placement` (7 temadan birer soru → başlangıç ustalığı).

---

## 5. İçerik üretim hattı (yeni beceri/soru eklerken zorunlu sıra)

1. `data/mufredat.json` → hangi tema, hangi beceri, kitapta hangi sayfalar.
2. O beceride **bilinen kavram yanılgılarını** yaz (`MIS` kataloğuna ekle: kısa ad + 1–2 cümlelik düzeltme).
3. Parametrik üreticiyi yaz: 3 zorluk seviyesi, her yanlış şık/yanlış sayı bir yanılgı etiketiyle.
4. 4 anlatım kartını yaz (`curriculum.js`): gorsel (metin + SVG), hikaye (Türk çocuğunun günlük hayatından, isimler çeşitli), adim (3–5 adım), kural (1–2 satır).
5. `node test/test_generators.js` çalıştır: her üreticiden 600×3 soru üretilir; tek doğru şık, tekrarsız şıklar, `undefined/NaN` yok, bilinmeyen yanılgı etiketi yok. **Hata 0 değilse yayın yok.**
6. Matematik öğretmeni kontrolü: rastgele 30 örnek soru gözle incelenir (dil, seviye uygunluğu, müfredat uyumu).
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
data/mufredat.json        ← 7 tema, 35 beceri, 67 yanılgı, 140 anlatım (makine okur)
src/core.js               ← yardımcılar, Türkçe sayı okunuşu, ek uyumu, SVG görseller
src/generators.js         ← 35 parametrik soru üreticisi + yanılgı kataloğu
src/curriculum.js         ← tema/beceri haritası + 4 biçimli anlatım kartları
src/engine.js             ← BKT, tekrar, bandit, oturum, rozet, veli raporu, lig
src/app.js                ← arayüz, maskot, ses, akışlar
src/cloud.js              ← Supabase bağlantısı: giriş, bulut kaydı, gerçek lig, cevap günlüğü (config.js boşsa kapalı)
sunucu/supabase/          ← schema.sql (tablolar + RLS + lig), zamanlama.sql (cron), functions/seslendir, functions/haftalik-rapor
src/fx.js                 ← doğru cevap kutlama animasyonları (5 efekt + seri kademeleri)
src/voice.js              ← Pi'nin replikleri (yazı + ses anahtarı)
tools/ses_listesi.js      ← seslendirilecek 239 metni toplar
tools/seslendir.py        ← ElevenLabs ile tüm sesleri üretir (Termux'ta çalışır)
src/style.css             ← tasarım belirteçleri (açık/koyu tema)
build.py                  ← dist/index.html (PWA) + dist/artifact.html
test/test_generators.js   ← 63 000 soruluk doğrulama
test/sim_engine.js        ← farklı öğrenci tipleriyle motor simülasyonu
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
- Veriler yalnızca cihazda; cihaz değişince ilerleme taşınmaz (Faz B).
- Lig rakipleri demo (ekranda "(demo)" yazar).
- Veli raporu tek dokunuşla WhatsApp/Telegram/e-posta açar; **otomatik** haftalık gönderim sunucu ister.
- BKT parametreleri literatürdeki tipik değerlerle elle ayarlandı; gerçek öğrenci verisiyle (pyBKT) yeniden kalibre edilecek.
- Performans görevleri, anket yapma, iletki/pergel ile çizim gibi **uygulamalı** kazanımlar ekranda tam karşılanamaz; uygulama bunlar için kitaptaki sayfaya ve sınıf etkinliğine yönlendirir. Sürükle-bırak açı ölçer ve grafik çizme etkileşimleri A2'de eklenecek.

---

## 13. Ajanlar için çalışma kuralları
- Bir değişiklikten sonra **her zaman**: `node test/test_generators.js` → `python3 build.py` → (mümkünse) `python3 test/e2e.py`.
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
