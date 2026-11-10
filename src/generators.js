/* ============================================================
   Matematik Yolu — Soru üreticileri (35 beceri, 3 zorluk)
   Her yanlış şık bir KAVRAM YANILGISI etiketine bağlıdır.
   Cevaplar kodla hesaplanır; test/test_generators.js ile doğrulanır.
   ============================================================ */
(function (G) {
  'use strict';
  const { U, V } = (typeof module !== 'undefined') ? require('./core.js') : { U: G.MY_U, V: G.MY_V };
  const { ri, pick, shuffle, fmtN, fmtD, fr, mixed, gcd, nk, wk } = U;

  /* ------------ KAVRAM YANILGISI KATALOĞU ------------ */
  const MIS = {
    // Geometri
    isin_dogru: { t: 'Işın ile doğruyu karıştırma', fix: 'Işının bir başlangıç noktası vardır ve tek yönde sonsuza gider. Doğru ise iki yönde de sonsuza uzar.' },
    dp_dogru: { t: 'Doğru parçası ile doğruyu karıştırma', fix: 'Doğru parçasının iki uç noktası vardır, bu yüzden uzunluğu ölçülebilir. Doğrunun ucu yoktur.' },
    isin_dp: { t: 'Işın ile doğru parçasını karıştırma', fix: 'Doğru parçasının iki uç noktası vardır, iki ucunda da durur. Işının ise yalnız bir başlangıç noktası vardır ve öbür yönde sonsuza gider.' },
    dp_uzunluk: { t: 'Doğru parçası ile uzunluğunu karıştırma', fix: 'Köşeli parantezle yazılan gösterim doğru parçasının kendisidir. İki dik çizgi arasına yazılan gösterim ise o doğru parçasının uzunluğudur.' },
    isin_yon: { t: 'Işının başlangıç noktasını karıştırma', fix: 'Işın, adındaki ilk harften başlar ve ikinci harfin olduğu yöne doğru sonsuza gider. Harflerin sırası önemlidir.' },
    nokta_dogru: { t: 'Noktalardan geçen doğru sayısını karıştırma', fix: 'İki farklı noktadan yalnız bir doğru geçer. Tek bir noktadan ise sonsuz sayıda doğru geçer, çünkü doğru o noktanın çevresinde her yöne döndürülebilir.' },
    aci_olcu: { t: 'Özel açıların ölçülerini karıştırma', fix: 'Dik açı 90°, doğru açı 180°, tam açı 360°tır. Doğru açı iki dik açı, tam açı iki doğru açı eder.' },
    nokta_sayma: { t: 'Doğru parçalarını eksik sayma', fix: 'Sadece yan yana olanları değil, aradaki noktaları atlayan doğru parçalarını da say: A-C de bir doğru parçasıdır.' },
    cap_yaricap: { t: 'Çap ile yarıçapı karıştırma', fix: 'Yarıçap, merkezden çembere uzanan doğru parçasıdır. Çap ise merkezden geçen ve iki ucu çember üzerinde olan doğru parçasıdır. Çap = 2 × yarıçap.' },
    dik_yatay: { t: '"Dik olmak için yatay-dikey olmalı" sanma', fix: 'İki doğru dönük çizilse de aralarındaki açı 90° ise birbirine diktir. Köşedeki küçük kare işareti bunu gösterir.' },
    paralel_kesisen: { t: 'Paralel ile kesişeni karıştırma', fix: 'Paralel doğrular ne kadar uzatılırsa uzatılsın hiç kesişmez, aralarındaki uzaklık hep aynıdır.' },
    aci_tur: { t: 'Açı türlerini karıştırma', fix: '90°\'den küçükse dar, tam 90° ise dik, 90° ile 180° arasındaysa geniş açıdır. 180° doğru açı, 360° tam açıdır.' },
    iletki_ters: { t: 'Açıölçerde yanlış ölçeği okuma', fix: 'Açıölçerde iki sıra sayı vardır. Açının kolu hangi taraftaki 0\'dan başlıyorsa o sıradaki sayıyı oku. Açı dar görünüyorsa ölçüsü 90\'dan küçük olmalı.' },
    aci_olcme: { t: 'Açıölçerle ölçerken yanlış çizgiyi okuma', fix: 'Açıölçerin merkezini açının köşesine, 0 çizgisini sabit kola koy. Diğer kolun geçtiği çizgiye kadar, sabit koldaki 0\'dan başlayarak 10\'ar 10\'ar say, sonra 5\'leri ekle.' },
    aci_kol: { t: 'Açıyı kol uzunluğuna göre karşılaştırma', fix: 'Açının büyüklüğü kolların ne kadar uzun olduğuna değil, kolların ne kadar açıldığına bağlıdır.' },
    tumler_butunler: { t: 'Tümler ile bütünleri karıştırma', fix: 'Tümler açıların toplamı 90°, bütünler açıların toplamı 180°\'dir. Akılda kalsın: "Tümler: Tek dik açı".' },
    ters_aci: { t: 'Ters açıları eşit görmeme', fix: 'Kesişen iki doğrunun karşı karşıya duran açılarına ters açı denir ve ölçüleri her zaman eşittir.' },
    cokgen_sayi: { t: 'Kenar, köşe ve iç açı sayısını karıştırma', fix: 'Bir çokgende kenar, köşe ve iç açı sayısı birbirine eşittir.' },
    kosegen_kenar: { t: 'Kenarı köşegen sanma', fix: 'Köşegen, yan yana OLMAYAN iki köşeyi birleştirir. Bir köşeden kendisine ve iki komşusuna köşegen çizilmez.' },
    duzgun_eksik: { t: 'Düzgün çokgen tanımını eksik bilme', fix: 'Düzgün çokgende hem bütün kenarlar hem de bütün iç açılar eşittir. Sadece kenarların eşit olması yetmez.' },
    ucgen_360: { t: 'Üçgenin iç açılarını 360° sanma', fix: 'Üçgenin iç açılarının toplamı 180°\'dir (bir doğru açı). 360° dörtgenin iç açılarının toplamıdır.' },
    ucgen_sinif: { t: 'Üçgeni yanlış sınıflandırma', fix: 'Üçgenin türüne EN BÜYÜK açısına bakarak karar ver: 90°\'den büyükse geniş açılı, tam 90° ise dik, hepsi 90°\'den küçükse dar açılı üçgendir.' },
    // Doğal sayılar
    sifir_atlama: { t: 'Bölükteki sıfırları atlama', fix: 'Her bölük üç basamaklıdır. Okunmayan bölükleri 000 ile doldurmayı unutma.' },
    boluk_kayma: { t: 'Bölük adlarını kaydırma', fix: 'Sağdan sola: birler, binler, milyonlar, milyarlar bölüğü. Her bölükte üç basamak vardır.' },
    basamak_deger: { t: 'Basamak değeri yerine rakamı söyleme', fix: 'Basamak değeri = rakam × bulunduğu basamağın değeri. Örneğin 5 yüzler basamağındaysa değeri 500\'dür.' },
    basamak_kayma: { t: 'Basamağı bir kaydırma', fix: 'Basamakları sağdan saymaya birlerden başla: birler, onlar, yüzler, binler...' },
    cozumleme_bitisik: { t: 'Çözümlemede sıfırları kaybetme', fix: 'Çözümlenmiş sayıyı toplarken her parçayı kendi basamağına yaz; boş kalan basamaklara 0 koy.' },
    ilk_rakam: { t: 'Sadece ilk rakama bakarak karşılaştırma', fix: 'Önce basamak sayısına bak: basamak sayısı fazla olan sayı daha büyüktür. Eşitse soldan rakam rakam karşılaştır.' },
    ters_islem: { t: 'Bilinmeyeni bulurken ters işlemi seçmeme', fix: 'Toplamda bilinmeyen terimi bulmak için toplamdan diğer terimi ÇIKAR. Çıkarmada eksileni bulmak için çıkan ile farkı TOPLA.' },
    elde_unutma: { t: 'Eldeyi veya onluk bozmayı unutma', fix: 'İşlemi basamak basamak yap; 10 ve üzeri olunca eldeyi bir sonraki basamağa ekle.' },
    sifir_sayisi: { t: 'Kısa yoldan çarpma/bölmede sıfırları yanlış sayma', fix: 'Sıfırları ayır, sıfır olmayan kısımları çarp, sonra ayırdığın TÜM sıfırları sona ekle. Bölmede ortak sıfırları sil.' },
    kismi_carpim: { t: 'Çarpmada ikinci satırı kaydırmama', fix: 'İki basamaklı sayıyla çarparken onlar basamağıyla çarptığın sonucu bir basamak sola kaydırarak yaz (aslında 10 ile çarpıyorsun).' },
    saat_ondalik: { t: 'Saati ondalık sayı gibi çıkarma', fix: '1 saat 60 dakikadır, 100 değil! Önce tam saate kadar olan dakikaları say, sonra kalanları ekle.' },
    problem_adim: { t: 'Çok adımlı problemde adım atlama', fix: 'Problemi adımlara ayır: Verilenler neler? İstenen ne? Önce ara sonucu bul, sonra asıl soruyu çöz.' },
    yuvarlama_kesme: { t: 'Yuvarlarken sadece kesip atma', fix: 'Yuvarlayacağın basamağın sağındaki rakama bak: 5 veya daha büyükse bir artır, 5\'ten küçükse aynı bırak.' },
    yuvarlama_yukari: { t: 'Yuvarlarken hep yukarı yuvarlama', fix: 'Her sayı yukarı yuvarlanmaz. Yuvarlayacağın basamağın sağındaki rakam 5\'ten küçükse o basamak aynı kalır, sağındaki basamaklar sıfır olur.' },
    cift_sayma: { t: 'Aynı dikdörtgeni iki kez sayma ya da kareyi saymama', fix: 'Kenarları 3 ve 5 olan dikdörtgen ile kenarları 5 ve 3 olan dikdörtgen aynıdır, bir kez sayılır. Kare de özel bir dikdörtgendir, o da sayılır.' },
    sade_tek: { t: 'Sadeleştirirken yalnız payı ya da yalnız paydayı bölme', fix: 'Sadeleştirirken pay da payda da aynı sayıya bölünür. Yalnız birini bölersen kesrin değeri değişir.' },
    // Ölçme
    cevre_yarim: { t: 'Çevreyi hesaplarken sadece iki kenarı toplama', fix: 'Çevre, şeklin etrafındaki TÜM kenarların toplamıdır. Dikdörtgenin 4 kenarı vardır: Çevre = 2 × (uzun kenar + kısa kenar).' },
    cevre_alan: { t: 'Çevre ile alanı karıştırma', fix: 'Çevre bir uzunluktur (etrafını dolaşmak, cm). Alan ise yüzeyin kapladığı yerdir (içini kaplamak, cm²).' },
    birim: { t: 'Alan birimini yanlış yazma', fix: 'Alan birim karelerle ölçülür: cm², m². Uzunluk birimi (cm, m) alan için kullanılmaz.' },
    kare_cevre: { t: 'Karenin çevresini 2\'ye bölerek kenarı bulma', fix: 'Karenin 4 kenarı eşittir. Bir kenar = çevre ÷ 4.' },
    ters_cevre: { t: 'Çevreden kenar bulurken yarıya bölmeyi unutma', fix: 'Çevre = 2 × (a + b) olduğu için önce çevreyi 2\'ye böl (a + b), sonra bilinen kenarı çıkar.' },
    cevre_alan_ayni: { t: '"Çevreleri eşitse alanları da eşittir" sanma', fix: 'Aynı çevreye sahip dikdörtgenlerin alanları farklı olabilir. Kenarlar birbirine yaklaştıkça alan büyür; en büyük alan kareye aittir.' },
    // Kesirler
    kesir_tur: { t: 'Kesir türlerini karıştırma', fix: 'Payı 1 olan kesir birim kesirdir. Payı paydasına eşit ya da paydasından büyük olan kesir bileşik kesirdir. Tam kısmı ve kesir kısmı birlikte yazılan gösterim tam sayılı kesirdir.' },
    tamsayili: { t: 'Bileşik ↔ tam sayılı kesir dönüşüm hatası', fix: 'Payı paydaya böl: Bölüm tam kısım, kalan yeni pay olur, payda aynı kalır. Geri dönüş: (tam × payda) + pay.' },
    denk_toplama: { t: 'Denk kesir için pay ve paydaya aynı sayıyı ekleme', fix: 'Denk kesir için pay ve paydayı aynı sayıyla ÇARP veya BÖL. Toplamak kesrin değerini değiştirir.' },
    ondalik_basamak: { t: 'Ondalık gösterimde basamak sayısını karıştırma', fix: 'Paydası 10 ise virgülden sonra 1, paydası 100 ise 2 basamak olur: 3/100 = 0,03.' },
    ondalik_okunus: { t: 'Ondalık gösterimi yanlış okuma', fix: 'Virgülden sonra 1 basamak varsa "onda", 2 basamak varsa "yüzde" diye okunur: 4,25 → dört tam yüzde yirmi beş.' },
    ondalik_parca: { t: 'Ondalık gösterimde tam kısım ile ondalık kısmı karıştırma', fix: 'Virgülün solundaki sayı tam kısım, sağındaki sayı ondalık kısımdır: 4,25\'te tam kısım 4, ondalık kısım 25\'tir.' },
    yuzde_ondalik: { t: 'Yüzdeyi ondalığa yanlış çevirme', fix: '% işareti "yüzde", yani paydası 100 demektir: %5 = 5/100 = 0,05 (0,5 değil!).' },
    payda_buyuk: { t: '"Paydası büyük olan kesir büyüktür" sanma', fix: 'Payda bütünün kaç parçaya bölündüğünü gösterir. Parça sayısı arttıkça her parça KÜÇÜLÜR: 1/8 < 1/3.' },
    bos_kisim: { t: 'Boyalı yerine boş kısmı sayma', fix: 'Kesrin payı, istenen (boyalı) parça sayısıdır. Boş kalan parçaları değil, boyadığın parçaları say.' },
    pay_payda_ters: { t: 'Pay ile paydayı karıştırma', fix: 'Payda (alttaki sayı) bütünün kaç EŞ parçaya bölündüğünü, pay (üstteki sayı) bu parçalardan kaçının alındığını söyler.' },
    kesir_model: { t: 'Bütünü ve parçaları karıştırma', fix: 'Önce bütünü paydadaki sayı kadar EŞ parçaya böl, sonra paydaki sayı kadar parçayı al. Parça sayısı ile alınan sayıyı ayrı ayrı say.' },
    cizgi_sayma: { t: 'Sayı doğrusunda çizgileri sayma', fix: 'Sayı doğrusunda çizgileri değil, ARALIKLARI say. 0\'dan başla; her atlama bir parçadır. 0 noktası sayılmaz.' },
    pay_payda_ayri: { t: 'Kesirleri karşılaştırırken sadece paya bakma', fix: 'Paydalar farklıysa önce paydaları eşitle (genişlet), sonra payları karşılaştır.' },
    uzun_buyuk: { t: '"Basamağı çok olan ondalık sayı büyüktür" sanma', fix: 'Ondalık sayıları karşılaştırırken önce tam kısma, sonra onda birler basamağına bak: 0,7 > 0,58 çünkü 7 onda > 5 onda.' },
    tam_kisim: { t: 'Ondalık sayılarda önce virgülden sonrasına bakma', fix: 'Önce tam kısma (virgülün soluna) bakılır. 225,11 > 224,91 çünkü 225 > 224; kuruş kısmına sadece tam kısımlar eşitse bakılır.' },
    esit_payda: { t: 'Paydaları eşit kesirleri karşılaştıramama', fix: 'Paydaları eşit kesirlerde parçalar aynı büyüklüktedir. Payı büyük olan kesir daha büyüktür: 8/12 > 3/12.' },
    sifir_fark: { t: 'Sondaki sıfırın değeri değiştirdiğini sanma', fix: 'Ondalık kısmın sonuna eklenen sıfır değeri değiştirmez: 0,7 = 0,70 (7 onda = 70 yüzde).' },
    // İstatistik
    soru_tek: { t: 'Araştırma sorusunu tek kişiye/tek cevaba yönlendirme', fix: 'İstatistiksel araştırma sorusu bir GRUBA sorulur ve birden çok farklı cevabı olabilir.' },
    veri_kaynak: { t: 'Hazır veri ile kendi topladığımız veriyi karıştırma', fix: 'Hazır veri, başkalarının toplayıp yayımladığı veridir (TÜİK, kayıtlar, gazete). Anket, gözlem, görüşme ve ölçümle veriyi kendimiz toplarız.' },
    anket_kural: { t: 'Anket hazırlama kurallarını karıştırma', fix: 'Anket soruları kısa, açık ve yönlendirmesiz olur. Katılanların adı ve kişisel bilgileri gizli tutulur.' },
    adim_sira: { t: 'Araştırma adımlarının sırasını karıştırma', fix: 'Sıra: 1) Araştırma sorusunu belirleme 2) Verileri toplama ve analize hazırlama 3) Veri görselleştirme ve özetleme 4) Sonuçları yorumlama.' },
    daire_toplam: { t: 'Daire grafiğinde dilimlerin toplamını kontrol etmeme', fix: 'Daire grafiğinin tamamı bütündür. Bütün dilimlerin yüzdeleri toplanınca tam %100 etmelidir; etmiyorsa grafik hatalıdır.' },
    grafik_secim: { t: 'Veriye uygun grafiği seçememe', fix: 'Nokta grafiğinde her veri bir noktadır; veri çok olunca çizmek ve okumak zorlaşır, sütun grafiği daha kullanışlıdır. Parça-bütün ilişkisi için daire grafiği uygundur.' },
    grafik_cizim: { t: 'Sütun grafiğinde sütun boyunu yanlış çizme', fix: 'Her sütunun tepesi, tablodaki sayının eksende yazdığı çizgiye kadar çıkmalı. Eksendeki sayılar 1\'er değil 2\'şer ya da 5\'er artabilir; çizgileri değil, yazan sayıları oku.' },
    grafik_okuma: { t: 'Grafikten yanlış değer okuma', fix: 'Sütunun tepesinden sola doğru düz bir çizgi çekip eksendeki değeri oku. Hangi kategoriye baktığını kontrol et.' },
    fark_toplam: { t: '"Fark" sorulduğunda toplama yapma', fix: '"Kaç fazla / fark" soruları çıkarma ister; "toplam / hepsi" soruları toplama ister.' },
    dilim_oran: { t: 'Daire grafiğinde dilim oranını yanlış belirleme', fix: 'Bütün daire = tüm veri. Yarım daire 1/2, çeyrek daire 1/4\'tür. Kişi sayısı = toplam × dilimin oranı.' },
    asiri_genelleme: { t: 'Veriden kesin olmayan sonuç çıkarma', fix: 'Grafik sadece toplanan veriyi anlatır. "Herkes", "her zaman" gibi kesin yargılar veriyle desteklenmiyorsa doğru değildir.' },
    eksen_yanilsama: { t: 'Kesik eksenli grafikte yanılma', fix: 'Grafikteki eksen 0\'dan başlamıyorsa sütun boyları yanıltıcı olabilir. Her zaman eksendeki gerçek sayıları oku.' },
    // Cebir
    esittir_sonuc: { t: '"=" işaretini "sonucu yaz" diye görme', fix: '"=" işareti iki tarafın DENGEDE olduğunu gösterir. Sol taraf ne kadarsa sağ taraf da o kadar olmalı.' },
    denge_bozma: { t: 'Eşitliğin korunumunu bilmeme', fix: 'Bir eşitliğin iki tarafına da aynı işlemi yaparsan denge bozulmaz. Bir tarafa 2 eklersen diğer tarafa da 2 eklemelisin.' },
    ozellik_karis: { t: 'İşlem özelliklerini karıştırma', fix: 'Değişme: yer değiştirme (a×b=b×a). Birleşme: gruplama ((a+b)+c=a+(b+c)). Dağılma: çarpımı içeriye dağıtma (a×(b+c)=a×b+a×c).' },
    dagilma_eksik: { t: 'Dağılmada sadece ilk terimi çarpma', fix: 'Parantezin önündeki sayı parantez içindeki HER terimle çarpılır: 6×(10+2) = 6×10 + 6×2.' },
    cikarma_degisme: { t: 'Çıkarma/bölmede değişme özelliği var sanma', fix: 'Değişme özelliği toplama ve çarpmada vardır. 9 − 4 ile 4 − 9 aynı değildir.' },
    us_carpim: { t: 'Kareyi 2 ile çarpmak sanma', fix: '5² = 5 × 5 = 25 demektir, 5 × 2 değil. Küp: 3³ = 3 × 3 × 3 = 27.' },
    oncelik_soldan: { t: 'İşlem önceliğini atlayıp soldan sağa yapma', fix: 'Önce parantez, sonra üslü ifade, sonra çarpma-bölme, en son toplama-çıkarma yapılır.' },
    oruntu_baslangic: { t: 'Örüntüde ilk terimi hesaba katmama', fix: 'Kural ilk terimi de vermeli. Terimler 1., 2., 3. diye sayılıyorsa: n. terim = ilk terim + (n − 1) × artış. Sadece adım × artış demek ilk terimi unutmak olur.' },
    ayni_oncelik: { t: 'Aynı öncelikli işlemleri soldan sağa yapmama', fix: 'Çarpma ile bölme aynı önceliktedir; toplama ile çıkarma da aynı önceliktedir. Art arda gelince soldan sağa doğru sırayla yapılır.' },
    oruntu_kural: { t: 'Örüntünün kuralını bir adımda deneyip bırakma', fix: 'Kuralı bulmak için adım sayısı ile terimi karşılaştır ve kuralı birkaç adımda dene. 4, 7, 10 örüntüsünde kural: adım sayısının 3 katının 1 fazlası.' },
    oruntu_sabit: { t: 'Her örüntünün sabit artışlı olduğunu sanma', fix: 'Bazı örüntülerde artış her adımda değişir (1, 3, 6, 10: artış 2, 3, 4). Böyle örüntülerde "ilk terim + (adım − 1) × artış" kuralı kullanılamaz.' },
    oruntu_bir: { t: 'Örüntüde artış sayısını bir fazla sayma', fix: 'Terimler 1., 2., 3. diye sayılıyorsa 1. terimde henüz artış yoktur; n. terime kadar (n − 1) kez artış olur.' },
    baslangic_unutma: { t: 'Başlangıçtaki miktarı eklememe', fix: 'Başta var olan miktar sonuca eklenir: toplam = başlangıç + geçen süre × her seferki artış.' },
    baslangic_sira: { t: 'Başlangıç anını 1. adım sanma', fix: 'Başlangıç, hiç zaman geçmemiş andır (0. gün ya da 0. hafta); o anda henüz ekleme yoktur. n gün ya da hafta sonra n kez ekleme olur: toplam = başlangıç + n × artış.' },
    algoritma_sira: { t: 'Algoritma adımlarını sırasız uygulama', fix: 'Algoritma adımları yazıldığı sırayla, tek tek uygulanır. Her adımdan sonra elindeki sayıyı not et.' },
    karar_dongu: { t: 'Karar adımında "Hayır" cevabının nereye gittiğini karıştırma', fix: 'Karar kutusunda cevap "Hayır" ise ok hangi adımı gösteriyorsa oraya dönülür. Koşul sağlanana kadar o adım tekrarlanır (döngü).' },
    dongu_sayma: { t: 'Döngü tekrarlarını yanlış sayma', fix: 'Döngünün her turunda değeri yaz ve koşulu kontrol et. Kaç kez tekrar ettiğini tek tek işaretle.' },
    // Olasılık
    olay_tur: { t: 'Kesin, imkânsız ve mümkün olayları karıştırma', fix: 'Kesin olay mutlaka olur (olasılık 1), imkânsız olay asla olmaz (0). Arada kalanlar mümkün olaylardır.' },
    olasilik_buyuk: { t: 'Olasılığın 1\'den büyük olabileceğini sanma', fix: 'Bir olayın olasılığı 0 ile 1 arasındadır (0 ve 1 dâhil). İmkânsız olayın olasılığı 0, kesin olayın olasılığı 1\'dir. İstediğin renkteki toplar, bütün toplardan fazla olamaz.' },
    olasilik_tercih: { t: 'Olasılığı sevdiği renge ya da şansa göre tahmin etme', fix: 'Olasılık kişisel seçime bağlı değildir. Torbada hangi renkten daha çok top varsa, o rengin çekilme olasılığı daha fazladır.' },
    iki_sonuc_esit: { t: 'İki sonuç varsa olasılıkları eşit sanma', fix: 'Sonuçların sayısı değil, her sonucu veren parçaların sayısı önemlidir. 4 yüzü mavi, 2 yüzü kırmızı küpte mavi gelme olasılığı daha fazladır.' },
    olasilik_oran: { t: 'Olasılık kesrini yanlış kurma', fix: 'Kesri parça-bütün ilişkisiyle kur: pay, istediğin renkteki dilim ya da top sayısı; payda, bütün dilimlerin ya da topların sayısı.' },
    az_cok: { t: 'Az olası ile çok olasıyı karıştırma', fix: '1/2\'den küçük olasılıklar az olası, 1/2\'den büyükler çok olasıdır. Tam 1/2 ise eşit olasıdır.' },
    sifir_basta: { t: 'En küçük sayıyı 0 ile başlatma', fix: 'Bir sayının en soldaki basamağı 0 olamaz. En küçük sayıyı yazarken önce 0 dışındaki en küçük rakamı, hemen ardından 0\'ı yaz.' },
    fiyat_okuma: { t: 'Fiyatı lira-kuruş olarak yanlış okuma', fix: 'Virgülün solu lira, sağı kuruştur. 1 lira 100 kuruş olduğu için virgülden sonra hep 2 basamak yazılır: 14,50 TL → on dört lira elli kuruş.' },
    istenen_verilen: { t: 'Verileni istenen sanma', fix: 'Problemde verilen sayıları ve sorulan şeyi ayır. Soru cümlesi (genellikle en sonda) neyin istendiğini söyler; istenen, problemde henüz yazmayan şeydir.' },
    kontrol_tekrar: { t: 'Kontrolü aynı yolu tekrarlayarak yapma', fix: 'Aynı yolu tekrarlarsan aynı hatayı yine yapabilirsin. Kontrolde cevaptan geriye gidilir: ters işlemle problemdeki bilinen bir sayıya ulaşılır.' },
    kontrol_yuzeysel: { t: 'Cevabın büyüklüğünü kontrol sanma', fix: 'Sonucun makul görünmesi tahmindir, kanıt değildir. Ters işlemle problemdeki bir bilgiye tam olarak ulaşırsan cevabın doğru olduğunu gösterirsin.' },
    ara_sonuc: { t: 'Ara sonucu cevap sanma', fix: 'Bulduğun sayı sorunun cevabı mı, yoksa cevaba giden yolda bir ara adım mı? Soru cümlesine dönüp kontrol et.' },
    kalan_yok: { t: 'Bölmede kalanı hesaba katmama', fix: 'Kalan, artan kişi ya da eşya demektir. Herkesin binmesi gerekiyorsa artanlar için bir araç daha gerekir: bölümü bir artır.' },
    hata_ilk: { t: 'Hatanın başladığı yeri değil, sonucunu seçme', fix: 'İlk hatadan sonraki adımlar o hatayı taşıdığı için onlar da yanlış görünür. Hatanın başladığı yeri bulmak için adımları baştan sırayla kontrol et: ilk yanlış olan hangisi?' },
    hata_yeri: { t: 'Doğru bir adımı hatalı sanma', fix: 'Her adımı kendin yeniden hesapla. Hatalı adım, sonucun bozulmaya başladığı ilk adımdır; sonraki adımlar o hatayı taşır.' },
    aci_isim: { t: 'Açıyı adlandırırken köşe harfini yanlış yere yazma', fix: 'Açı üç harfle adlandırılırken köşenin harfi her zaman ortaya yazılır: köşesi B olan açı ABC ya da CBA açısıdır. Tek harfle yalnız köşe harfi yazılır: B açısı.' },
    paralel_kesen: { t: 'Paralel doğruları kesen doğrunun açılarını karıştırma', fix: 'İki paralel doğruyu bir doğru kestiğinde oluşan dar açıların hepsi birbirine eş, geniş açıların hepsi de birbirine eştir. Bir dar açı ile bir geniş açının toplamı 180°\'dir.' },
    dis_aci: { t: 'Dış açıyı iç açıyla karıştırma', fix: 'Çokgende bir iç açının komşu bütünleri o köşedeki dış açıdır. İç açı ile dış açının toplamı 180°\'dir.' },
    cokgen_isim: { t: 'Çokgeni adlandırırken köşeleri sırasız yazma', fix: 'Çokgen adlandırılırken herhangi bir köşeden başlanır ve köşe harfleri yan yana sırayla okunur. Atlayarak yazılan harfler başka bir şekil gösterir.' },
    ucgen_aci_siniri: { t: 'Bir üçgende iki dik ya da iki geniş açı olabileceğini sanma', fix: 'Üçgenin iç açılarının toplamı 180°\'dir. Bu yüzden bir üçgende en fazla bir dik açı ya da bir geniş açı olabilir.' },
    cember_insa: { t: 'Çemberlerle inşa edilen üçgenin türünü yanlış bulma', fix: 'Üçgenin kenarları iki çemberin yarıçapları ve merkezler arasındaki uzaklıktır. Üçü eşitse eşkenar, ikisi eşitse ikizkenar, hepsi farklıysa çeşitkenar üçgen oluşur.' },
    nokta_ad: { t: 'Çizimi noktayla karıştırma', fix: 'Nokta tek bir yeri gösterir ve boyutu yoktur. Uzayıp giden bir çizgi doğru, ışın ya da doğru parçasıdır; adını uçlarına bakarak verirsin.' },
    cember_parca: { t: 'Çemberin parçalarını karıştırma', fix: 'Merkez bir noktadır. Çember yalnızca kenardaki eğri çizgidir. Daire, çember ile iç bölgesinin birleşimidir. Çap ve yarıçap ise doğru parçalarıdır.' },
    basamak_karsilastir: { t: 'Eşit basamaklı sayılarda yanlış basamağa bakma', fix: 'Basamak sayıları eşitse soldan başla ve ilk farklı rakamı karşılaştır. Rakamı büyük olan sayı daha büyüktür.' },
    tahmin_tam: { t: 'Tahmin yerine tam sonucu hesaplama', fix: 'Tahmin istenince önce sayıları istenen basamağa yuvarlarsın, sonra yuvarlanmış sayılarla işlem yaparsın. Tam sonuç tahmin değildir.' },
    genel: { t: 'İşlem hatası', fix: 'Çözümü adım adım tekrar kontrol et.' },
  };

  /* ------------ yardımcılar ------------ */
  // Doğru + yanlışlardan şık seti; aynı metinleri ayıklar
  // Şıkkın sayısal değeri (kesir, tam sayılı kesir, yüzde, ondalık); sayı değilse null
  const sikDeger = (t) => { const x = String(t).replace(/<span class="fr"><span>(\d+)<\/span><span>(\d+)<\/span><\/span>/g, '($1/$2)').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim(); let m;
    if ((m = x.match(/^(\d+)\s*\((\d+)\/(\d+)\)$/))) return +m[1] + m[2] / m[3]; if ((m = x.match(/^\((\d+)\/(\d+)\)$/))) return m[1] / m[2];
    if ((m = x.match(/^%\s?(\d+(?:,\d+)?)$/))) return parseFloat(m[1].replace(',', '.')) / 100; if ((m = x.match(/^(\d+(?:,\d+)?)$/))) return parseFloat(m[1].replace(',', '.')); return null; };
  function mc(correct, wrongs, fillers, ayniDegerSerbest) {
    const seen = new Set([String(correct)]), opts = [{ t: String(correct), ok: true }];
    // Doğru cevapla aynı değeri taşıyan "yanlış" şık iki doğru cevap demektir (%10 = 10/100 = 1/10): atılır (25.10.2026)
    const dv = ayniDegerSerbest ? null : sikDeger(correct);
    if (dv != null) wrongs = wrongs.filter(w => { const v = sikDeger(w[0]); if (v != null && String(w[0]) !== String(correct) && Math.abs(v - dv) < 1e-9) { if (G.MY_CARPISMA) G.MY_CARPISMA(w[1]); return false; } return true; }); if (G.MY_CARPISMA) for (const w of wrongs) if (String(w[0]) === String(correct)) G.MY_CARPISMA(w[1]);
    for (const [t, mis, ac] of wrongs) { const k = String(t); if (!seen.has(k) && opts.length < 4) { seen.add(k); opts.push(ac ? { t: k, ok: false, mis, ac } : { t: k, ok: false, mis }); } }
    // Dolgu şıkları yalnız bir yanılgıya bağlıysa eklenir (§1-3: rastgele çeldirici yok). 'genel' dolgu atlanır; soru 3 şıkla kalabilir.
    if (fillers) for (const [t, mis] of fillers) { const k = String(t), v = dv != null ? sikDeger(k) : null; if (v != null && Math.abs(v - dv) < 1e-9) continue; if (mis && mis !== 'genel' && !seen.has(k) && opts.length < 4) { seen.add(k); opts.push({ t: k, ok: false, mis }); } }
    return shuffle(opts);
  }
  // Sayısal yakın yanlışlar (dolgu için)
  const near = (v, f = (x) => fmtN(x)) => [[f(v + ri(1, 3) * (v > 50 ? 10 : 1)), 'genel'], [f(Math.max(0, v - ri(1, 3) * (v > 50 ? 10 : 1))), 'genel'], [f(v + 1), 'genel'], [f(Math.max(0, v - 1)), 'genel']];
  // Sayı girişinde yanılgılı değer doğru cevapla aynıysa (ör. yarım dilimde "toplam ÷ dilim sayısı" = cevap) ya da
  // başka bir yanılgıyla çakışıyorsa atılır: doğru cevap yanılgı sayılmasın, teşhis belirsiz kalmasın.
  const Q = (o) => { const q = Object.assign({ type: 'mc', hint: '', steps: [] }, o);
    if (q.inputMis && q.answer !== undefined) { if (G.MY_CARPISMA) for (const m of q.inputMis) if (String(m.v) === String(q.answer)) G.MY_CARPISMA(m.mis); const goruldu = new Set([String(q.answer)]); q.inputMis = q.inputMis.filter(m => { const k = String(m.v); if (goruldu.has(k)) return false; goruldu.add(k); return true; }); }
    return q; };
  const cmpQ = (o, rel, misMap) => {
    // rel: '<' | '>' | '='
    const all = ['<', '=', '>'];
    o.options = all.map(s => ({ t: s, ok: s === rel, mis: s === rel ? undefined : (misMap[s] || 'genel') }));
    o.type = 'cmp'; o.fixed = true; return Q(o);
  };
  const tfQ = (o, truth, misIfWrong) => { o.options = [{ t: 'Doğru', ok: truth, mis: truth ? undefined : misIfWrong }, { t: 'Yanlış', ok: !truth, mis: !truth ? undefined : misIfWrong }]; o.type = 'tf'; o.fixed = true; return Q(o); };
  const NAMES = ['Ela', 'Kerem', 'Defne', 'Yusuf', 'Zeynep', 'Emir', 'Asel', 'Mert', 'Nehir', 'Aras', 'Elif', 'Ömer', 'Ada', 'Eymen', 'Duru', 'Can'];

  /* =========================================================
     TEMA 1 — GEOMETRİK ŞEKİLLER
     ========================================================= */
  const GEN = {};
  GEN.g_temel = (lv) => {
    if (lv === 1) {
      const k = pick(['dp', 'isin', 'dogru']);
      const name = { dp: 'Doğru parçası', isin: 'Işın', dogru: 'Doğru', nokta: 'Nokta' };
      const wr = { dp: [['Doğru', 'dp_dogru'], ['Işın', 'isin_dp']], isin: [['Doğru', 'isin_dogru'], ['Doğru parçası', 'isin_dp']], dogru: [['Işın', 'isin_dogru'], ['Doğru parçası', 'dp_dogru']] }[k];
      // 03.11.2026 (öğretmen geri bildirimi: aynı kök çok tekrar ediyordu): yarısı şekilsiz tanım sorusu, şekilli soruda da kök değişir
      if (Math.random() < 0.45) {
        const tn = {
          dp: pick(['İki ucu da belli olan, iki uç noktası arasında kalan çizgiye ne denir?', 'Uzunluğu cetvelle ölçülebilen çizgi hangisidir?']),
          isin: pick(['Bir noktadan başlayıp tek yönde sonsuza giden çizgiye ne denir?', 'El fenerinden çıkan ışık hangi geometrik çizimle modellenir?']),
          dogru: pick(['İki yönde de sonsuza uzayan, hiç ucu olmayan çizgiye ne denir?', 'Hiç başlangıç ve bitiş noktası olmayan çizgi hangisidir?']),
        }[k];
        return Q({ prompt: tn, options: mc(name[k], wr, [['Nokta', 'nokta_ad']]), steps: ['Doğru parçası: iki uç noktası var, ölçülebilir.', 'Işın: bir başlangıç noktası var, tek yönde sonsuza gider.', 'Doğru: ucu yok, iki yönde sonsuza gider.'] });
      }
      const harf = pick([['A', 'B'], ['K', 'L'], ['M', 'N'], ['P', 'R'], ['C', 'D'], ['E', 'F']]);
      return Q({ prompt: pick(['Şekildeki geometrik çizimin adı nedir?', 'Şekilde hangi geometrik çizim görülüyor?', `Şekilde ${harf[0]} ve ${harf[1]} noktalarıyla gösterilen çizimin adı nedir?`]), visual: V.lineKind(k, harf), options: mc(name[k], wr, [['Nokta', 'nokta_ad']]), steps: ['Uçlarına bak: iki uç noktası varsa doğru parçası,', 'bir başlangıç noktası ve tek ok varsa ışın,', 'iki yönde ok varsa doğrudur.'], hint: 'Okların sayısına bak!' });
    }
    if (lv === 2) {
      const [X, Y] = pick([['A', 'B'], ['K', 'L'], ['M', 'N'], ['P', 'R'], ['C', 'D'], ['E', 'F']]), XY = X + Y;
      const it = pick([
        [`[${XY}] gösterimi neyi ifade eder?`, `${XY} doğru parçasını`, [[`${XY} ışınını`, 'isin_dp'], [`${XY} doğrusunu`, 'dp_dogru'], [`${XY} uzunluğunu`, 'dp_uzunluk']], [`İki uçta da köşeli parantez var: çizgi ${X} noktasında da ${Y} noktasında da durur.`, `İki ucu belli olan çizim doğru parçasıdır: [${XY}] → ${XY} doğru parçası.`]],
        [`[${XY} gösterimi neyi ifade eder?`, `${X} noktasından başlayan ${XY} ışınını`, [[`${XY} doğru parçasını`, 'isin_dp'], [`${XY} doğrusunu`, 'isin_dogru'], [`${Y} noktasından başlayan ışını`, 'isin_yon']], [`Köşeli parantez yalnız ${X} tarafında: çizgi ${X} noktasından başlar.`, `${Y} tarafında parantez yok: çizgi ${Y} yönünde sonsuza gider.`, `Bir başlangıç noktası olan ve tek yönde giden çizim ışındır: [${XY} → ${X} noktasından başlayan ${XY} ışını.`]],
        [`|${XY}| gösterimi neyi ifade eder?`, `${XY} doğru parçasının uzunluğunu`, [[`${XY} doğrusunu`, 'dp_uzunluk'], [`${XY} ışınını`, 'dp_uzunluk'], [`${XY} doğru parçasının kendisini`, 'dp_uzunluk']], [`[${XY}] doğru parçasının kendisidir (bir çizim).`, `İki dik çizgi arasına yazılan |${XY}| ise bu doğru parçasının uzunluğudur (bir sayı, örneğin 5 cm).`]],
        ['Hangisi iki yönde de sınırsız uzar?', 'Doğru', [['Işın', 'isin_dogru'], ['Doğru parçası', 'dp_dogru'], ['Nokta', 'nokta_ad']], ['Doğru parçası iki ucunda da durur.', 'Işın bir noktadan başlar, yalnız tek yönde sonsuza gider.', 'Doğrunun hiç ucu yoktur: iki yönde de sınırsız uzar.']],
        ['Hangisinin uzunluğu ölçülebilir?', 'Doğru parçası', [['Doğru', 'dp_dogru'], ['Işın', 'isin_dp']], ['Bir çizgiyi ölçmek için başının ve sonunun belli olması gerekir.', 'Doğru ve ışın sonsuza gider, ölçülemez.', 'Doğru parçasının iki ucu bellidir: uzunluğu ölçülebilir.']],
        ['Hangisinin bir başlangıç noktası vardır ama bitiş noktası yoktur?', 'Işın', [['Doğru', 'isin_dogru'], ['Doğru parçası', 'isin_dp'], ['Nokta', 'nokta_ad']], ['Doğru parçasının iki ucu da bellidir (başı da sonu da var).', 'Doğrunun hiç ucu yoktur (başı da sonu da yok).', 'Işın bir noktadan başlar ve tek yönde sonsuza gider: başı var, sonu yok.']],
        ['Hangisinin iki uç noktası vardır?', 'Doğru parçası', [['Işın', 'isin_dp'], ['Doğru', 'dp_dogru']], ['Işının yalnız bir ucu (başlangıç noktası) vardır.', 'Doğrunun hiç ucu yoktur.', 'İki uç noktası olan çizim doğru parçasıdır.']],
      ]);
      return Q({ prompt: it[0], options: mc(it[1], it[2]), steps: it[3] });
    }
    // Seviye 3: n nokta (3–6), farklı harfler ve bağlamlar; n·(n−1)/2 doğru parçası
    const n = ri(3, 5), set = pick([['A', 'B', 'C', 'D', 'E'], ['K', 'L', 'M', 'N', 'O'], ['P', 'R', 'S', 'T', 'U']]).slice(0, n), ans = n * (n - 1) / 2;
    const yol = Math.random() < 0.5, prompt = !yol ? `Bir doğru üzerinde sırasıyla ${set.join(', ')} noktaları var. Bu noktalarla kaç farklı doğru parçası oluşur?` : `Düz bir yol üzerinde sırasıyla ${set.join(', ')} durakları var. Uç noktaları bu duraklardan ikisi olan kaç farklı doğru parçası vardır?`;
    const parcalar = Array.from({ length: n - 1 }, (_, i) => n - 1 - i);
    return Q({ type: 'input', prompt, visual: V.noktaDogru(set), answer: String(ans), inputMis: [{ v: n - 1, mis: 'nokta_sayma' }, { v: n * (n - 1), mis: 'nokta_sayma' }],
      // Her noktadan yalnız sağa doğru say: aynı parça iki kez sayılmaz (PR ile RP aynı parça)
      steps: [...set.slice(0, -1).map((h, i) => `${h} noktasından sağa doğru: ${set.slice(i + 1).map(k => h + k).join(', ')} → ${n - 1 - i} tane`), `Toplam: ${parcalar.join(' + ')} = ${ans}`],
      cozumGorsel: U.parcaSayGorsel(set), hint: 'Sadece yan yana olanları sayma; aradaki noktaları atlayan doğru parçaları da var.' });
  };
  GEN.g_cember = (lv) => {
    if (lv === 1) {
      const r = ri(3, 15), askD = Math.random() < .5;
      if (askD) return Q({ type: 'input', prompt: `Yarıçapı ${r} cm olan çemberin çapı kaç cm'dir?`, visual: V.circle('r', r + ' cm'), answer: String(2 * r), unit: 'cm', inputMis: [{ v: r, mis: 'cap_yaricap' }, { v: r / 2, mis: 'cap_yaricap' }], steps: ['Çap = 2 × yarıçap', `Çap = 2 × ${r} = ${2 * r} cm`] });
      const d = 2 * r;
      return Q({ type: 'input', prompt: `Çapı ${d} cm olan çemberin yarıçapı kaç cm'dir?`, visual: V.circle('d', d + ' cm'), answer: String(r), unit: 'cm', inputMis: [{ v: 2 * d, mis: 'cap_yaricap' }, { v: d, mis: 'cap_yaricap' }], steps: ['Yarıçap = çap ÷ 2', `Yarıçap = ${d} ÷ 2 = ${r} cm`] });
    }
    if (lv === 2) {
      const it = pick([
        ['Çemberin merkezinden geçen ve iki ucu çember üzerinde olan doğru parçasına ne denir?', 'Çap', [['Yarıçap', 'cap_yaricap'], ['Merkez', 'cember_parca'], ['Daire', 'cember_parca']], ['Yarıçap merkezden başlar ve çemberde biter.', 'Çap ise çemberin bir noktasından başlar, merkezden geçer ve karşıdaki noktada biter.', 'Merkezden geçen ve iki ucu çemberde olan doğru parçası çaptır.']],
        ['Merkezi çember üzerindeki bir noktaya birleştiren doğru parçasına ne denir?', 'Yarıçap', [['Çap', 'cap_yaricap'], ['Çember', 'cember_parca'], ['Merkez', 'cember_parca']], ['Merkez bir noktadır, çember ise kenardaki eğri çizgidir.', 'Merkezi çemberin üzerindeki bir noktaya birleştiren doğru parçası yarıçaptır.', 'Çap bundan farklıdır: merkezden geçer ve iki ucu da çemberdedir.']],
        ['Çember ile iç bölgesinin birleşimine ne denir?', 'Daire', [['Çember', 'cember_parca'], ['Çap', 'cap_yaricap'], ['Merkez', 'cember_parca']], ['Çember yalnız kenardaki eğri çizgidir, içi boştur.', 'Çemberin içindeki bölgeyi de eklersen daire olur (içi dolu).']],
        ['Pergelle çember çizerken pergelin sivri ucunun durduğu nokta çemberin neresi olur?', 'Merkezi', [['Çapı', 'cember_parca'], ['Yarıçapı', 'cap_yaricap'], ['Çemberin üzerindeki bir nokta', 'cember_parca']], ['Pergelin sivri ucu çizim boyunca aynı yerde durur.', 'Kalem ucu bu noktanın çevresinde, hep aynı uzaklıkta döner.', 'Çemberin her noktasına eşit uzaklıktaki bu nokta çemberin merkezidir.']],
        ['Uzunluğu yarıçapın 2 katı olan ve merkezden geçen doğru parçasına ne denir?', 'Çap', [['Yarıçap', 'cap_yaricap'], ['Çember', 'cember_parca'], ['Merkez', 'cember_parca']], ['Yarıçap merkezden çembere gider.', 'Merkezden geçip karşı tarafa kadar devam edersen iki yarıçap uç uca eklenir.', 'Uzunluğu yarıçapın 2 katı olan bu doğru parçası çaptır.']],
        ['Bir bilezik çemberi, bir bozuk para ise daireyi modeller. Bunun nedeni nedir?', 'Bilezikte yalnız kenar çizgisi var, parada iç bölge de dolu', [['İkisi de aynı şeydir', 'cember_parca'], ['Bilezik daha büyüktür', 'cember_parca'], ['Paranın çapı yoktur', 'cap_yaricap']], ['Bileziğin ortası boştur: yalnız kenardaki çizgi vardır → çember.', 'Bozuk paranın içi doludur: kenar çizgisi ve iç bölge birlikte → daire.']],
        ['Bir çemberde merkezden çembere çizilen bütün yarıçaplar için hangisi doğrudur?', 'Hepsinin uzunluğu eşittir', [['Çember üzerinde ilerledikçe uzarlar', 'cember_parca'], ['Her biri çapa eşittir', 'cap_yaricap'], ['Bir çemberde yalnız bir yarıçap vardır', 'cember_parca']], ['Çember, pergelin açıklığı hiç değiştirilmeden çizilir.', 'Bu yüzden merkezden çemberin her noktasına olan uzaklık aynıdır.', 'Bir çemberde sonsuz sayıda yarıçap çizilebilir ve hepsinin uzunluğu eşittir.']],
      ]);
      return Q({ prompt: it[0], options: mc(it[1], it[2]), steps: it[3] });
    }
    // Aynı merkezli çember (25.10.2026): eski sürümde cevap hep birinci çemberin yarıçapına eşit çıkıyordu (çapı 16 → 8);
    // çapla yarıçapı karıştıran çocuk da doğruyu buluyordu. Şimdi ikinci yarıçap = birinci yarıçap ± k.
    const r1 = ri(5, 12), uzun = Math.random() < 0.5, k = ri(2, uzun ? 5 : Math.min(4, r1 - 3)), r2 = uzun ? r1 + k : r1 - k, d = 2 * r1, cev = 2 * r2;
    return Q({ type: 'input', prompt: `Çapı ${d} cm olan bir çemberle aynı merkezli ikinci bir çemberin yarıçapı, birinci çemberin yarıçapından ${k} cm daha ${uzun ? 'uzundur' : 'kısadır'}. İkinci çemberin ÇAPI kaç cm'dir?`,
      visual: V.ikiCember(r1, r2, d + ' cm'), answer: String(cev), unit: 'cm',
      inputMis: [{ v: r2, mis: 'cap_yaricap' }, { v: uzun ? d + k : d - k, mis: 'cap_yaricap' }, { v: uzun ? r1 * 4 + k : r1 * 4 - k, mis: 'cap_yaricap' }],
      steps: [`1. çemberin yarıçapı = ${d} ÷ 2 = ${r1} cm`, `2. çemberin yarıçapı = ${r1} ${uzun ? '+' : '−'} ${k} = ${r2} cm`, `2. çemberin çapı = 2 × ${r2} = ${cev} cm`] });
  };
  GEN.g_dikme_paralel = (lv) => {
    if (lv === 1 || lv === 2) {
      const [h1, h2] = pick([['d', 'k'], ['a', 'b'], ['m', 'n'], ['x', 'y']]);
      const names = { dik: `${h1} ⊥ ${h2} (birbirine diktir)`, paralel: `${h1} // ${h2} (paraleldir)`, kesisen: 'Kesişir ama dik değildir' };
      const rel = pick(['dik', 'paralel', 'kesisen']), rot = lv === 2 ? pick([20, 30, -25, 35, -40]) : pick([0, 90]);
      const wr = Object.keys(names).filter(k => k !== rel).map(k => [names[k], rel === 'dik' || k === 'dik' ? 'dik_yatay' : 'paralel_kesisen']);
      return Q({ prompt: `Şekildeki ${h1} ve ${h2} doğrularının durumu nedir?`, visual: V.twoLines(rel, rot, [h1, h2], pick([50, 60, 125, 130])), options: mc(names[rel], wr, [['Çakışıktır', 'paralel_kesisen']]), steps: ['Köşede küçük kare (dik açı işareti) varsa doğrular diktir: ⊥', 'Hiç kesişmiyor ve arası hep aynıysa paraleldir: //', 'Kesişiyor ama dik açı yoksa sadece kesişen doğrulardır.'], hint: lv === 2 ? 'Şekil döndürülmüş olabilir; dik açı işaretine bak.' : 'Dik açı işareti var mı?' });
    }
    const [x, y, z] = pick([['d', 'k', 'm'], ['a', 'b', 'c'], ['x', 'y', 'z'], ['e', 'f', 'g']]);
    const it = pick([
      [`Aynı düzlemde ${x} ⊥ ${y} ve ${y} ⊥ ${z} ise ${x} ile ${z} doğruları için ne söylenebilir?`, `${x} // ${z} (paraleldir)`, [[`${x} ⊥ ${z} (diktir)`, 'paralel_kesisen'], ['Kesişir ama dik değildir', 'paralel_kesisen'], ['Bir şey söylenemez', 'paralel_kesisen']]],
      [`Aynı düzlemde ${x} // ${y} ve ${y} // ${z} ise ${x} ile ${z} doğruları için ne söylenebilir?`, `${x} // ${z} (paraleldir)`, [[`${x} ⊥ ${z} (diktir)`, 'paralel_kesisen'], ['Kesişir ama dik değildir', 'paralel_kesisen'], ['Bir şey söylenemez', 'paralel_kesisen']]],
      [`Aynı düzlemde ${x} ⊥ ${y} ve ${y} // ${z} ise ${x} ile ${z} doğruları için ne söylenebilir?`, `${x} ⊥ ${z} (diktir)`, [[`${x} // ${z} (paraleldir)`, 'paralel_kesisen'], ['Hiç kesişmez', 'paralel_kesisen'], ['Bir şey söylenemez', 'dik_yatay']]],
      ['"//" sembolü ne anlama gelir?', 'Paraleldir', [['Diktir', 'paralel_kesisen'], ['Kesişir', 'paralel_kesisen'], ['Çakışıktır', 'paralel_kesisen']]],
      ['"⊥" sembolü ne anlama gelir?', 'Diktir', [['Paraleldir', 'paralel_kesisen'], ['Çakışıktır', 'dik_yatay'], ['Hiç kesişmez', 'paralel_kesisen']]],
      ['Paralel iki doğru kaç noktada kesişir?', 'Hiçbir noktada', [['1 noktada', 'paralel_kesisen'], ['2 noktada', 'paralel_kesisen'], ['Sonsuz noktada', 'paralel_kesisen']]],
      ['Kesişen iki farklı doğru kaç noktada kesişir?', '1 noktada', [['Hiçbir noktada', 'paralel_kesisen'], ['2 noktada', 'paralel_kesisen'], ['Sonsuz noktada', 'paralel_kesisen']]],
    ]);
    const p0 = it[0];   // 10.11.2026: adımlar soruya özel (önceden yedi soruya aynı üç cümle çıkıyordu)
    const adim = /⊥.*ve.*⊥/.test(p0) ? [`${x} ve ${z} doğrularının ikisi de ${y} doğrusuna dik.`, 'Aynı doğruya dik olan iki doğru aynı yönde uzanır: birbirine paraleldir.', `${x} // ${z}`]
      : /\/\/.*ve.*\/\//.test(p0) ? [`${x} ve ${z} doğrularının ikisi de ${y} doğrusuna paralel.`, 'Aynı doğruya paralel olan doğrular birbirine de paraleldir.', `${x} // ${z}`]
      : /ise/.test(p0) ? [`${y} ile ${z} paralel: aynı yönde uzanırlar.`, `${x}, ${y} doğrusuna dikse onunla aynı yönde uzanan ${z} doğrusuna da diktir.`, `${x} ⊥ ${z}`]
      : /"\/\/"/.test(p0) ? ['// sembolü yan yana duran, hiç kesişmeyen iki çizgiye benzer.', 'a // b yazısı «a doğrusu b doğrusuna paraleldir» diye okunur.']
      : /"⊥"/.test(p0) ? ['⊥ sembolünde bir çizgi öbürünün üstünde dimdik durur.', 'a ⊥ b yazısı «a doğrusu b doğrusuna diktir» diye okunur: aralarında dik açı vardır.']
      : /^Paralel/.test(p0) ? ['Paralel doğruların arasındaki uzaklık hep aynı kalır.', 'Ne kadar uzatılırsa uzatılsın buluşmazlar: hiç ortak noktaları yoktur.']
      : ['Kesişen iki farklı doğru bir noktada buluşur.', 'O noktadan sonra birbirinden uzaklaşırlar, bir daha buluşmazlar: yalnız 1 ortak nokta.'];
    return Q({ prompt: it[0], options: mc(it[1], it[2]), steps: adim });
  };
  const ACI_TUR = (d) => d < 90 ? 'Dar açı' : d === 90 ? 'Dik açı' : d < 180 ? 'Geniş açı' : d === 180 ? 'Doğru açı' : 'Tam açı';
  GEN.g_aci = (lv) => {
    if (lv === 1) {
      if (Math.random() < .25) {
        const d = pick([40, 50, 60, 70]);
        return Q({ prompt: 'Aşağıdaki iki açıdan hangisinin ölçüsü daha büyüktür?', visual: V.twoAngles(d), options: mc('İkisi eşittir', [['Kolları uzun olan', 'aci_kol'], ['Kolları kısa olan', 'aci_kol']], [['Karar verilemez', 'aci_kol']]), steps: ['Açının büyüklüğü kolların açıklığına bağlıdır.', 'İki açının açıklığı aynı → ölçüleri eşit.'] });
      }
      const d = pick([30, 45, 60, 75, 90, 90, 110, 130, 150, 180]);
      const wr = ['Dar açı', 'Dik açı', 'Geniş açı', 'Doğru açı'].filter(t => t !== ACI_TUR(d)).map(t => [t, 'aci_tur']);
      return Q({ prompt: `Ölçüsü ${d}° olan açı hangi türdendir?`, visual: V.angle(d, { label: d + '°', rot: pick([0, 0, 15]) }), options: mc(ACI_TUR(d), wr), steps: ['90°\'den küçük → dar', '90° → dik', '90° ile 180° arası → geniş', '180° → doğru açı'] });
    }
    if (lv === 2) {
      const d = pick([20, 35, 40, 50, 55, 65, 70, 80, 100, 110, 125, 140, 150, 160]);
      return Q({ prompt: pick(['Şekildeki açının ölçüsü aşağıdakilerden hangisi olabilir? (Gözünle tahmin et: dar mı, geniş mi?)', 'Açıölçer kullanmadan karar ver: şekildeki açı kaç derece olabilir? (Gözünle tahmin et)', 'Şekildeki açıyı bir dik açıyla karşılaştır. Ölçüsü hangisi olabilir? (Gözünle tahmin et)']), visual: V.angle(d, { rot: pick([0, 0, 20, -15]) }), options: mc(d + '°', [[(180 - d) + '°', 'iletki_ters'], [(d < 90 ? 90 + d : d - 60) + '°', 'aci_tur']]), steps: [d < 90 ? 'Açı dik açıdan (köşe gibi) daha kapalı → dar açı, ölçüsü 90°\'den küçük.' : 'Açı dik açıdan daha açık → geniş açı, ölçüsü 90°\'den büyük.', `Açıölçerin doğru sırası ${d}° gösterir; ${180 - d}° öbür sıradaki sayıdır.`] });
    }
    const it = pick([
      () => { const k = ri(2, 4); return Q({ type: 'input', prompt: `${k} tane dik açının ölçüleri toplamı kaç derecedir?`, answer: String(90 * k), unit: '°', inputMis: [{ v: 180 * k, mis: 'aci_olcu' }], steps: ['Bir dik açı 90°', `${k} × 90 = ${90 * k}°`] }); },
      () => { const d = pick([30, 45, 60, 90]), tam = Math.random() < 0.5, top = tam ? 360 : 180, yan = (tam ? 180 : 360) / d;
        return Q({ type: 'input', prompt: `Bir ${tam ? 'tam' : 'doğru'} açı kaç tane ${d} derecelik açıdan oluşur?`, answer: String(top / d), inputMis: [{ v: yan, mis: 'aci_olcu' }], steps: [`${tam ? 'Tam açı 360°' : 'Doğru açı 180°'}`, `${top} ÷ ${d} = ${top / d}`] }); },
    ]);
    return it();
  };
  GEN.g_aci_iliski = (lv) => {
    if (lv === 1) {
      const a = ri(2, 8) * 10 + pick([0, 5]);
      return Q({ type: 'input', prompt: `${a}°'lik bir açının TÜMLERİ kaç derecedir?`, answer: String(90 - a), unit: '°', inputMis: [{ v: 180 - a, mis: 'tumler_butunler' }], steps: ['Tümler açıların toplamı 90°', `90 − ${a} = ${90 - a}°`], hint: 'Tümler → toplam 90°' });
    }
    if (lv === 2) {
      const a = ri(3, 16) * 10 + pick([0, 5]);
      return Q({ type: 'input', prompt: `${a}°'lik bir açının BÜTÜNLERİ kaç derecedir?`, answer: String(180 - a), unit: '°', inputMis: [{ v: 90 - a, mis: 'tumler_butunler' }, { v: 360 - a, mis: 'tumler_butunler' }], steps: ['Bütünler açıların toplamı 180°', `180 − ${a} = ${180 - a}°`] });
    }
    const a = pick([50, 60, 70, 40, 65, 55]), askTers = Math.random() < .5;
    if (askTers) return Q({ type: 'input', prompt: `Kesişen iki doğrunun oluşturduğu açılardan biri ${a}°'dir. Bu açının TERS açısı kaç derecedir?`, visual: V.crossAngles(a, [a + '°', '', '?', '']), answer: String(a), unit: '°', inputMis: [{ v: 180 - a, mis: 'ters_aci' }], steps: ['Ters açılar karşı karşıyadır ve ölçüleri eşittir.', `Cevap: ${a}°`] });
    return Q({ type: 'input', prompt: `Kesişen iki doğrudan oluşan ${a}°'lik açının yanındaki (komşu) açı kaç derecedir?`, visual: V.crossAngles(a, [a + '°', '?', '', '']), answer: String(180 - a), unit: '°', inputMis: [{ v: a, mis: 'ters_aci' }, { v: 90 - a, mis: 'tumler_butunler' }], steps: ['Bir doğru üzerindeki komşu açılar doğru açıyı (180°) oluşturur.', `180 − ${a} = ${180 - a}°`] });
  };
  // Program sınırı (MAT.5.4, 2024): "Alan çalışmalarında dikdörtgenlerin alanı en fazla 36 birim kare olmalıdır."
  // Kenarlar farklı (kare değil) ve çevre ≠ alan (yanılgılı cevap doğruyla çakışmasın).
  const dikKenar = (enAz = 3) => { let a, b; do { a = ri(enAz, 18); b = ri(2, a - 1); } while (a * b > 36 || a * b === 2 * (a + b)); return [a, b]; };
  const CG = { 3: 'Üçgen', 4: 'Dörtgen', 5: 'Beşgen', 6: 'Altıgen', 7: 'Yedigen', 8: 'Sekizgen', 9: 'Dokuzgen', 10: 'Ongen' };
  GEN.g_cokgen = (lv) => {
    if (lv === 1) {
      const n = ri(5, 8), what = pick(['kenar', 'köşe', 'iç açı']);
      return Q({ type: 'input', prompt: `Bir ${CG[n].toLocaleLowerCase('tr-TR')}in kaç ${{ 'kenar': 'kenarı', 'köşe': 'köşesi', 'iç açı': 'iç açısı' }[what]} vardır?`, visual: V.polygon(n), answer: String(n), inputMis: [{ v: n - 1, mis: 'cokgen_sayi' }, { v: n + 1, mis: 'cokgen_sayi' }], steps: ['Çokgenlerde kenar = köşe = iç açı sayısı.', `${CG[n]}: ${n}`] });
    }
    if (lv === 2) {
      const tip = pick(['tanim', 'tf', 'tf', 'cevre']);
      if (tip === 'tanim') return Q({ prompt: 'Hangisi düzgün çokgenin tanımıdır?', options: mc('Bütün kenarları ve bütün iç açıları eşit olan çokgen', [['Sadece bütün kenarları eşit olan çokgen', 'duzgun_eksik'], ['Sadece bütün açıları eşit olan çokgen', 'duzgun_eksik'], ['Köşegeni olmayan çokgen', 'kosegen_kenar']]), steps: ['Düzgün = kenarlar eşit + açılar eşit (ikisi birden).', 'Örnek: Eşkenar üçgen, kare.'] });
      if (tip === 'tf') { const [ad, dogru, neden] = pick([['Kare', true, 'Bütün kenarları ve bütün açıları eşittir.'], ['Eşkenar üçgen', true, 'Bütün kenarları ve bütün açıları eşittir.'], ['Dikdörtgen', false, 'Açıları eşittir (90°) ama bütün kenarları eşit olmak zorunda değildir.'], ['Eşkenar dörtgen', false, 'Kenarları eşittir ama bütün açıları eşit olmak zorunda değildir.']]);
        return tfQ({ prompt: `${ad} düzgün bir çokgen midir?`, steps: ['Düzgün çokgen: bütün kenarlar VE bütün açılar eşit.', `${ad}: ${neden}`] }, dogru, 'duzgun_eksik'); }
      const n = ri(5, 8), a = ri(3, 12);
      return Q({ type: 'input', prompt: `Düzgün bir ${CG[n].toLocaleLowerCase('tr-TR')}in bir kenarı ${a} cm. Bu çokgenin bütün kenarlarının uzunlukları toplamı kaç cm?`, visual: V.polygon(n), answer: String(n * a), unit: 'cm', inputMis: [{ v: a * (n - 1), mis: 'cokgen_sayi' }, { v: a + n, mis: 'cokgen_sayi' }], steps: ['Düzgün çokgende bütün kenarlar eşittir.', `${n} kenar × ${a} cm = ${n * a} cm`] });
    }
    // Program sınırı (MAT.5.3, 2024): "Çokgenlerde köşegen sayısına değinilmez." Köşegen yalnız tanımıyla sorulur.
    if (Math.random() < 0.4) return Q({ prompt: 'Bir çokgende yan yana OLMAYAN iki köşeyi birleştiren doğru parçasına ne denir?', visual: V.polygon(ri(5, 6), true), options: mc('Köşegen', [['Kenar', 'kosegen_kenar'], ['Çap', 'cember_parca'], ['Işın', 'isin_dogru']]), steps: ['Kenar: yan yana iki köşeyi birleştirir.', 'Köşegen: yan yana olmayan iki köşeyi birleştirir.'] });
    // Düzgün çokgen: bütün kenarların toplamından bir kenarı bul (kenarlar eşit)
    const n = ri(5, 8), a = ri(3, 9), top = n * a;
    const yanlis = [top / 4, top / (n - 1), top / (n + 1)].filter(v => Number.isInteger(v) && v !== a);
    return Q({ type: 'input', prompt: `Düzgün bir ${CG[n].toLocaleLowerCase('tr-TR')}in bütün kenarlarının uzunlukları toplamı ${top} cm. Bir kenarı kaç cm?`, visual: V.polygon(n), answer: String(a), unit: 'cm', inputMis: yanlis.slice(0, 2).map(v => ({ v, mis: 'cokgen_sayi' })), hint: `${CG[n]} kaç kenarlı? Düzgün çokgende kenarlar eşit.`, steps: [`${CG[n]}: ${n} kenar, hepsi eşit.`, `Bir kenar = ${top} ÷ ${n} = ${a} cm`] });
  };
  GEN.g_ucgen = (lv) => {
    if (lv === 1) {
      let a = ri(3, 10) * 10, b = ri(2, 8) * 10; if (a + b >= 170) b = 170 - a - 10 > 10 ? 170 - a - 10 : 20; if (a + b >= 180) { a = 60; b = 50; } if (a + b === 90) b += 10;  // ara sonuç (a + b) cevaba eşit olmasın
      return Q({ type: 'input', prompt: `Bir üçgenin iki iç açısının ölçüsü ${a}° ve ${b}°'dir. Üçüncü açının ölçüsü kaç derecedir?`, answer: String(180 - a - b), unit: '°', inputMis: [{ v: 360 - a - b, mis: 'ucgen_360' }, { v: a + b, mis: 'ara_sonuc', ac: `${a + b}° bilinen iki açının toplamı, yani bir ara sonuç. Üçüncü açı için bunu 180°'den çıkar.` }], steps: ['Üçgenin iç açıları toplamı 180°', `${a} + ${b} = ${a + b}`, `180 − ${a + b} = ${180 - a - b}°`] });
    }
    if (lv === 2) {
      const t = pick(['dar', 'dik', 'genis']); let A;
      if (t === 'dar') { const x = ri(5, 8) * 10, y = ri(5, 8) * 10; A = [x, y, 180 - x - y]; if (A[2] >= 90 || A[2] <= 0) A = [60, 70, 50]; }
      if (t === 'dik') { const x = ri(2, 7) * 10; A = [90, x, 90 - x]; }
      if (t === 'genis') { const x = ri(10, 14) * 10, y = ri(1, (170 - x) / 10) * 10; A = [x, y, 180 - x - y]; if (A[2] <= 0) A = [120, 30, 30]; }
      A = shuffle(A);
      const name = { dar: 'Dar açılı üçgen', dik: 'Dik açılı üçgen', genis: 'Geniş açılı üçgen' };
      return Q({ prompt: `İç açıları ${A[0]}°, ${A[1]}° ve ${A[2]}° olan üçgen açılarına göre hangisidir?`, options: mc(name[t], Object.keys(name).filter(k => k !== t).map(k => [name[k], 'ucgen_sinif'])), steps: [`En büyük açı: ${Math.max(...A)}°`, Math.max(...A) > 90 ? '90°\'den büyük → geniş açılı' : Math.max(...A) === 90 ? 'Tam 90° → dik açılı üçgen' : 'Hepsi 90°\'den küçük → dar açılı'] });
    }
    if (Math.random() < .35) return Q({ type: 'input', prompt: 'Eşkenar üçgenin bir iç açısı kaç derecedir?', answer: '60', unit: '°', inputMis: [{ v: 180, mis: 'ucgen_360' }, { v: 120, mis: 'ucgen_360' }], steps: ['Eşkenar üçgenin üç açısı eşit.', '180 ÷ 3 = 60°'] });
    const x = pick([20, 40, 50, 60, 70, 80, 100, 120, 30]);
    return Q({ type: 'input', prompt: `İkizkenar bir üçgende eşit kenarların arasındaki (tepe) açı ${x}°'dir. Taban açılarından biri kaç derecedir?`, visual: V.ikizkenar(x), answer: String((180 - x) / 2), unit: '°', inputMis: [{ v: 180 - x, mis: 'ara_sonuc', ac: `${180 - x}° iki taban açısının toplamı. Taban açıları eşit olduğu için bunu 2'ye bölmelisin.` }, { v: (360 - x) / 2, mis: 'ucgen_360' }], steps: ['İkizkenar üçgende taban açıları eşittir.', `180 − ${x} = ${180 - x}`, `${180 - x} ÷ 2 = ${(180 - x) / 2}°`] });
  };

  /* =========================================================
     TEMA 2 — DOĞAL SAYILAR VE İŞLEMLER
     ========================================================= */
  const groupsOf = (n) => { const g = []; let x = n; while (x > 0) { g.unshift(x % 1000); x = Math.floor(x / 1000); } return g; };
  const fromGroups = (g) => g.reduce((a, v) => a * 1000 + v, 0);
  function bigNum(lv) {
    const ng = lv === 1 ? 3 : lv === 2 ? pick([3, 4]) : 4; const g = [];
    for (let i = 0; i < ng; i++) g.push(i === 0 ? ri(1, 99) : (lv > 1 && Math.random() < .3 ? 0 : ri(lv > 1 ? 1 : 100, 999)));
    if (lv > 1) { const i = ri(1, ng - 1); g[i] = pick([0, ri(1, 9), ri(10, 99)]); }
    return fromGroups(g);
  }
  GEN.n_okuma = (lv) => {
    let n = bigNum(lv), g = groupsOf(n);
    if (g.length >= 3 && !g.slice(1).some(v => v < 100)) { g[1] = ri(1, 99); n = fromGroups(g); }
    const wrongs = [];
    // sıfırları atlayarak yazma: küçük bölükleri 3 basamağa tamamlamamak
    const dropZero = (() => { const s = g.map((v, i) => i === 0 ? String(v) : String(v)).join(''); return +s; })();
    if (dropZero !== n) wrongs.push([fmtN(dropZero), 'sifir_atlama']);
    // bir bölük kaydırma
    const shiftL = fromGroups(g.slice(0, -1)); if (shiftL > 0) wrongs.push([fmtN(shiftL), 'boluk_kayma']);
    wrongs.push([fmtN(n * 10), 'basamak_kayma']);
    if (Math.random() < .5 || lv === 1) {
      return Q({ prompt: `Okunuşu "${U.cap(U.words(n))}" olan sayı hangisidir?`, options: mc(fmtN(n), wrongs, near(n)), steps: ['Sayıyı bölüklere ayır (her bölük 3 basamak):', g.map((v, i) => String(v).padStart(i ? 3 : 1, '0')).join(' | '), 'Okunmayan basamaklara 0 yaz.'], hint: 'Her bölük 3 basamaklıdır.' });
    }
    const wrongW = [];
    if (dropZero !== n) wrongW.push([U.cap(U.words(dropZero)), 'sifir_atlama']);
    if (shiftL > 0) wrongW.push([U.cap(U.words(shiftL)), 'boluk_kayma']);
    wrongW.push([U.cap(U.words(n * 10)), 'basamak_kayma']);
    return Q({ prompt: `${fmtN(n)} sayısının okunuşu hangisidir?`, options: mc(U.cap(U.words(n)), wrongW, [[U.cap(U.words(n + 1000)), 'genel']]), steps: ['Sayıyı sağdan üçerli bölüklere ayır: ' + g.map((v, i) => String(v).padStart(i ? 3 : 1, '0')).join(' | ')].concat(g.map((v, i) => { const pos = g.length - 1 - i, ad = ['birler', 'binler', 'milyonlar', 'milyarlar'][pos]; return `${String(v).padStart(i ? 3 : 1, '0')} (${ad} bölüğü): ${v ? U.words(v * Math.pow(1000, pos)) : 'okunmaz'}`; }), [`Okunuş: ${U.cap(U.words(n))}`]) });  // 10.11.2026: bölükler bu sayı için gösterilir
  };
  const BAS = ['birler', 'onlar', 'yüzler', 'binler', 'on binler', 'yüz binler', 'milyonlar', 'on milyonlar', 'yüz milyonlar', 'milyarlar'];
  GEN.n_basamak = (lv) => {
    if (lv === 1 || lv === 2) {
      const len = lv === 1 ? ri(6, 7) : ri(8, 10); let digits = [];
      for (let i = 0; i < len; i++) digits.push(i === 0 ? ri(1, 9) : ri(0, 9));
      let pos; do pos = ri(1, len - 1); while (lv === 2 && pos === len - 1 - pos); // sağdan indeks; soldan saymak aynı basamağı vermesin
      let idx = len - 1 - pos; if (digits[idx] === 0) digits[idx] = ri(2, 9);
      const n = +digits.join(''), d = digits[idx], val = d * Math.pow(10, pos);
      if (lv === 1) {
        return Q({ prompt: `${fmtN(n)} sayısında altı çizili <u>${d}</u> rakamının basamak değeri kaçtır? (${BAS[pos]} basamağında)`, options: mc(fmtN(val), [[String(d), 'basamak_deger'], [fmtN(val * 10), 'basamak_kayma'], [fmtN(val / 10), 'basamak_kayma']]), steps: [`${d} rakamı ${BAS[pos]} basamağında.`, `Basamak değeri = ${d} × ${fmtN(Math.pow(10, pos))} = ${fmtN(val)}`] });
      }
      return Q({ prompt: `${fmtN(n)} sayısında soldan ${idx + 1}. rakam olan ${d}, hangi basamaktadır?`, options: mc(U.cap(BAS[pos]) + ' basamağı', [[U.cap(BAS[pos + 1] || BAS[pos - 2]) + ' basamağı', 'basamak_kayma'], [U.cap(BAS[pos - 1]) + ' basamağı', 'basamak_kayma'], [U.cap(BAS[idx] || 'birler') + ' basamağı', 'basamak_kayma']]), steps: ['Basamakları SAĞDAN saymaya başla: birler, onlar, yüzler...', `${d} sağdan ${pos + 1}. sırada → ${BAS[pos]} basamağı`] });
    }
    // çözümleme
    const parts = []; let used; do used = shuffle([0, 1, 2, 3, 4, 5, 6, 7]).slice(0, 4).sort((a, b) => b - a); while (used[0] === 3 && used[3] === 0);  // 3-2-1-0 iken bitişik yazmak doğru cevabı verir
    used.forEach(p => parts.push(ri(1, 9) * Math.pow(10, p)));
    const n = parts.reduce((a, b) => a + b, 0), concat = +parts.map(p => String(p)[0]).join('');
    return Q({ prompt: `${parts.map(fmtN).join(' + ')} çözümlemesi verilen sayı hangisidir?`, options: mc(fmtN(n), [[fmtN(concat), 'cozumleme_bitisik'], [fmtN(n * 10), 'basamak_kayma'], [fmtN(n - parts[parts.length - 1] + parts[parts.length - 1] * 10), 'basamak_kayma']]), steps: ['Her parçayı alt alta, basamaklarına göre yaz.', 'Boş basamaklara 0 koyarak topla.', `Sonuç: ${fmtN(n)}`] });
  };
  GEN.n_karsilastir = (lv) => {
    let a, b;
    if (lv === 1) { a = ri(1e6, 9e6); b = a + pick([-1, 1]) * ri(1000, 900000); }
    else if (lv === 2) { // tuzak: kısa sayının ilk rakamı büyük
      const s = ri(6, 8); a = ri(1, 3) * Math.pow(10, s) + ri(0, Math.pow(10, s) - 1); b = ri(5, 9) * Math.pow(10, s - 1) + ri(0, Math.pow(10, s - 1) - 1);
      if (Math.random() < .5) [a, b] = [b, a];
    } else { const base = ri(1, 99) * 1e9; a = base + ri(0, 999) * 1e6 + 750000; b = base + Math.floor((a - base) / 1e6) * 1e6 + 750; if (Math.random() < .25) b = a; if (Math.random() < .5) [a, b] = [b, a]; }
    const rel = a > b ? '>' : a < b ? '<' : '=';
    const la = String(a).length, lb = String(b).length;
    const misMap = { '<': la !== lb ? 'ilk_rakam' : 'basamak_karsilastir', '>': la !== lb ? 'ilk_rakam' : 'basamak_karsilastir', '=': la !== lb ? 'ilk_rakam' : 'basamak_karsilastir' };
    return cmpQ({ prompt: 'Boş yere hangi sembol gelmelidir?', cmp: [fmtN(a), fmtN(b)], steps: [`${fmtN(a)} → ${la} basamaklı, ${fmtN(b)} → ${lb} basamaklı.`, la !== lb ? 'Basamak sayısı fazla olan daha büyüktür.' : 'Basamak sayıları eşit; soldan başlayıp ilk farklı rakamı karşılaştır.', `${fmtN(a)} ${rel} ${fmtN(b)}`] }, rel, misMap);
  };
  GEN.n_toplacikar = (lv) => {
    if (lv === 1) {
      const a = ri(10000, 89999), b = ri(1000, 9999), op = pick(['+', '−']);
      const ans = op === '+' ? a + b : a - b;
      // elde unutma yanlışı
      const noCarry = op === '+' ? +String(a).split('').reverse().map((d, i) => (+d + +(String(b).split('').reverse()[i] || 0)) % 10).reverse().join('') : +String(a).split('').reverse().map((d, i) => Math.abs(+d - +(String(b).split('').reverse()[i] || 0))).reverse().join('');
      return Q({ type: 'input', prompt: `${fmtN(a)} ${op} ${fmtN(b)} = ?`, answer: String(ans), ipucuGorsel: U.altAltaGorsel(a, b, op === '+' ? '+' : '−', 'ipucu'), cozumGorsel: U.altAltaGorsel(a, b, op === '+' ? '+' : '−', 'cozum'), inputMis: noCarry !== ans ? [{ v: noCarry, mis: 'elde_unutma' }] : [], steps: ['Sayıları basamaklarını hizalayarak alt alta yaz.', op === '+' ? 'Birlerden başla; 10 ve üzerini eldeye aktar.' : 'Birlerden başla; üstteki rakam küçükse soldan onluk boz.', `Sonuç: ${fmtN(ans)}`] });
    }
    if (lv === 2) {
      const b = ri(10000, 40000), c = ri(20000, 60000);
      if (Math.random() < .5) return Q({ type: 'input', prompt: `....... + ${fmtN(b)} = ${fmtN(b + c)}  → Boş yere hangi sayı gelmelidir?`, answer: String(c), inputMis: [{ v: 2 * b + c, mis: 'ters_islem' }], steps: ['Toplamda bilinmeyen terim = toplam − bilinen terim', `${fmtN(b + c)} − ${fmtN(b)} = ${fmtN(c)}`] });
      return Q({ type: 'input', prompt: `....... − ${fmtN(b)} = ${fmtN(c)}  → Eksilen kaçtır?`, answer: String(b + c), inputMis: [{ v: Math.abs(c - b), mis: 'ters_islem' }], steps: ['Eksilen = çıkan + fark', `${fmtN(b)} + ${fmtN(c)} = ${fmtN(b + c)}`] });
    }
    const nm = pick(NAMES), p1 = ri(5, 25) * 100 + pick([0, 50]), p2 = ri(5, 25) * 100 - pick([0, 1]) * 1, have = Math.ceil((p1 + p2) / 100) * 100 + ri(5, 40) * 100, left = have - p1 - p2;
    return Q({ type: 'input', prompt: `${wk(nm, 'in')} ${fmtN(have)} TL'si vardı. ${fmtN(p1)} TL'ye bir bisiklet kaskı ve ${fmtN(p2)} TL'ye bir spor ayakkabı aldı. Geriye kaç TL'si kaldı?`, answer: String(left), unit: 'TL', inputMis: [{ v: have - p1, mis: 'problem_adim' }, { v: p1 + p2, mis: 'problem_adim' }, { v: have + p1 + p2, mis: 'ters_islem' }], steps: [`Harcanan: ${fmtN(p1)} + ${fmtN(p2)} = ${fmtN(p1 + p2)} TL`, `Kalan: ${fmtN(have)} − ${fmtN(p1 + p2)} = ${fmtN(left)} TL`] });
  };
  GEN.n_carpbol = (lv) => {
    if (lv === 1) {
      const a = pick([12, 15, 25, 32, 45, 64, 75, 80]), z = pick([10, 100, 1000]), m = pick([2, 3, 4, 5]) * z, ans = a * m;
      const zeros = String(m).length - 1;
      return Q({ prompt: `${a} × ${fmtN(m)} işleminin sonucu kaçtır?`, options: mc(fmtN(ans), [[fmtN(ans / 10), 'sifir_sayisi'], [fmtN(ans * 10), 'sifir_sayisi'], [fmtN(z === 10 ? ans * 100 : ans / z), 'sifir_sayisi']]), steps: (() => { let a0 = a, za = 0; while (a0 % 10 === 0) { a0 /= 10; za++; } const zt = za + zeros; return [`Sıfırları ayır: ${a0} × ${m / z}; iki sayıda toplam ${zt} sıfır var.`, `${a0} × ${m / z} = ${a0 * m / z}`, `Sona ${zt} sıfır ekle → ${fmtN(ans)}`]; })() });
    }
    if (lv === 2) {
      const it = pick(['bol', 'carpan']);
      if (it === 'bol') { const q = pick([20, 30, 40, 50, 300, 400]), d = pick([20, 30, 200, 300, 1500]), n = q * d; return Q({ prompt: `${fmtN(n)} ÷ ${fmtN(d)} işleminin sonucu kaçtır?`, options: mc(fmtN(q), [[fmtN(q * 10), 'sifir_sayisi'], [fmtN(q / 10), 'sifir_sayisi'], [fmtN(q * 100), 'sifir_sayisi']]), steps: (() => { let k = 1; while (d % (k * 10) === 0 && n % (k * 10) === 0) k *= 10; const ks = String(k).length - 1; return [`Bölünenden ve bölenden aynı sayıda sıfır sil: ikisinden de ${ks} sıfır.`, `${fmtN(n / k)} ÷ ${fmtN(d / k)} = ${fmtN(q)}`, `Kontrol: ${fmtN(q)} × ${fmtN(d)} = ${fmtN(n)}`]; })() }); }
      const a = pick([75, 150, 14, 36, 25, 12]), z = pick([10, 100, 1000]);
      return Q({ type: 'input', prompt: `${a} × ....... = ${fmtN(a * z)}`, answer: String(z), inputMis: [{ v: z / 10, mis: 'sifir_sayisi' }, { v: z * 10, mis: 'sifir_sayisi' }], steps: [`${fmtN(a * z)}, ${a} sayısının sonuna ${String(z).length - 1} sıfır eklenmiş hâli.`, `O hâlde çarpan ${fmtN(z)}`] });
    }
    const a = ri(21, 89), b = ri(11, 39), ans = a * b, wrong = a * (b % 10) + a * Math.floor(b / 10);
    return Q({ type: 'input', prompt: `${a} × ${b} = ?`, answer: String(ans), inputMis: [{ v: wrong, mis: 'kismi_carpim' }], steps: [`${a} × ${b % 10} = ${a * (b % 10)}`, `${a} × ${Math.floor(b / 10) * 10} = ${fmtN(a * Math.floor(b / 10) * 10)}  (bir basamak sola kaydır)`, `Topla: ${a * (b % 10)} + ${fmtN(a * Math.floor(b / 10) * 10)} = ${fmtN(ans)}`] });
  };
  const hm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}.${String(m % 60).padStart(2, '0')}`;
  GEN.n_problem = (lv) => {
    if (lv === 1) {
      const nm = pick(NAMES), per = ri(12, 48), days = pick([7, 10, 15, 20, 30]);
      return Q({ type: 'input', prompt: `${nm} kumbarasına her gün ${per} TL atıyor. ${days} gün sonra kumbarada kaç TL birikir?`, answer: String(per * days), unit: 'TL', inputMis: [{ v: per + days, mis: 'problem_adim' }], steps: ['Her gün aynı miktar → çarpma', `${per} × ${days} = ${per * days} TL`] });
    }
    if (lv === 2) {
      const s = ri(10, 15) * 60 + ri(30, 55), dur = ri(35, 80), e = s + dur;
      const wrongDec = Math.round(((+hm(e).replace('.', '')) - (+hm(s).replace('.', ''))));
      return Q({ type: 'input', prompt: `Bir tiyatro oyunu saat ${U.tk(Math.floor(s / 60), s % 60, 'de')} başlayıp ${U.tk(Math.floor(e / 60), e % 60, 'de')} bitti. Oyun kaç dakika sürdü?`, answer: String(dur), unit: 'dk', inputMis: [{ v: wrongDec, mis: 'saat_ondalik' }], steps: [`${hm(s)} → ${hm(Math.ceil(s / 60) * 60)}: ${Math.ceil(s / 60) * 60 - s} dakika`, `${hm(Math.ceil(s / 60) * 60)} → ${hm(e)}: ${e - Math.ceil(s / 60) * 60} dakika`, `Toplam: ${dur} dakika`], hint: 'Başlangıç ve bitiş saatlerini dakikaya çevirerek düşün. Bir saat kaç dakikadır?' });
    }
    const n = ri(3, 6), price = ri(15, 45) * 10, budget = Math.ceil((n * price + ri(1, 9) * 100) / 100) * 100, left = budget - n * price;
    const item = pick(['fidan', 'kitap', 'top', 'boya seti']);
    return Q({ type: 'input', prompt: `Bir okul ${fmtN(budget)} TL bütçeyle tanesi ${price} TL olan ${n} ${item} aldı. Kalan parayla tanesi 50 TL olan defterlerden en fazla kaç tane alınabilir?`, answer: String(Math.floor(left / 50)), unit: 'tane', inputMis: [{ v: Math.floor(budget / 50), mis: 'problem_adim' }, { v: left, mis: 'problem_adim' }], steps: [`Harcanan: ${n} × ${price} = ${fmtN(n * price)} TL`, `Kalan: ${fmtN(budget)} − ${fmtN(n * price)} = ${fmtN(left)} TL`, `${fmtN(left)} ÷ 50 = ${Math.floor(left / 50)}${left % 50 ? ' (kalan ' + (left % 50) + ' TL yetmez)' : ''}`] });
  };
  GEN.n_tahmin = (lv) => {
    const to = lv === 1 ? 10 : lv === 2 ? 100 : 1000;
    if (lv < 3) {
      let n, rnd, trunc; do { n = ri(1000, 99999); if (Math.random() < .75) { const r = n % to; const up = to / 2 + ri(0, to / 2 - 1); n = n - r + up; } rnd = Math.round(n / to) * to; trunc = Math.floor(n / to) * to; } while (rnd % (to * 10) === 0);  // bir üst basamağa yuvarlamak aynı sonucu vermesin
      return Q({ prompt: `${fmtN(n)} sayısını en yakın ${to === 10 ? 'onluğa' : 'yüzlüğe'} yuvarlayınca hangi sayı elde edilir?`, options: mc(fmtN(rnd), rnd > trunc ? [[fmtN(trunc), 'yuvarlama_kesme'], [fmtN(Math.round(n / (to * 10)) * to * 10), 'basamak_kayma']] : [[fmtN(rnd + to), 'yuvarlama_yukari'], [fmtN(Math.round(n / (to * 10)) * to * 10), 'basamak_kayma']]), steps: [`${to === 10 ? 'Birler' : 'Onlar'} basamağına bak: ${String(n).slice(-(String(to).length - 1))[0]}`, `${+String(n).slice(-(String(to).length - 1))[0] >= 5 ? '5 veya büyük → yukarı yuvarla' : '5\'ten küçük → aynı bırak'}`, `Sonuç: ${fmtN(rnd)}`] });
    }
    let a = (ri(1, 4) * 10 + ri(5, 9)) * 100 + ri(1, 99), b = (ri(1, 4) * 10 + ri(0, 4)) * 100 + ri(1, 99);  // biri yukarı, biri aşağı yuvarlanır: «hep kes» de «hep yukarı» da yanlış tahmin verir (10.11.2026)
    if (Math.random() < .5) [a, b] = [b, a];
    const ra = Math.round(a / 1000) * 1000, rb = Math.round(b / 1000) * 1000;
    return Q({ prompt: `${fmtN(a)} + ${fmtN(b)} toplamını sayıları en yakın binliğe yuvarlayarak TAHMİN edin.`, options: mc(fmtN(ra + rb), [[fmtN(Math.floor(a / 1000) * 1000 + Math.floor(b / 1000) * 1000), 'yuvarlama_kesme'], [fmtN(Math.ceil(a / 1000) * 1000 + Math.ceil(b / 1000) * 1000), 'yuvarlama_yukari'], [fmtN(a + b), 'tahmin_tam']]), steps: [`${fmtN(a)} ≈ ${fmtN(ra)}`, `${fmtN(b)} ≈ ${fmtN(rb)}`, `Tahmin: ${fmtN(ra + rb)}`] });
  };

  /* =========================================================
     TEMA 3 — GEOMETRİK NİCELİKLER
     ========================================================= */
  GEN.a_cevre = (lv) => {
    if (lv < 3) {
      const sq = lv === 2 && Math.random() < .5; let a, b; do { a = ri(4, 18); b = sq ? a : ri(2, a - 1 || 2); } while (a * b === 2 * (a + b));  // 4×4, 6×3: çevre = alan
      return Q({ type: 'input', prompt: sq ? `Bir kenarı ${a} cm olan karenin çevre uzunluğu kaç cm'dir?` : `Kenar uzunlukları ${a} cm ve ${b} cm olan dikdörtgenin çevre uzunluğu kaç cm'dir?`, visual: V.rect(a, b, 'cm'), answer: String(2 * (a + b)), unit: 'cm', inputMis: [{ v: a + b, mis: 'cevre_yarim' }, { v: a * b, mis: 'cevre_alan' }], steps: sq ? ['Karenin 4 kenarı eşittir.', `Ç = 4 × ${a} = ${4 * a} cm`] : ['Ç = 2 × (uzun kenar + kısa kenar)', `Ç = 2 × (${a} + ${b}) = 2 × ${a + b} = ${2 * (a + b)} cm`] });
    }
    const a = ri(6, 20), b = ri(3, a - 1), P = 2 * (a + b);
    return Q({ type: 'input', prompt: `Çevre uzunluğu ${P} cm olan bir dikdörtgenin uzun kenarı ${a} cm'dir. Kısa kenarı kaç cm'dir?`, answer: String(b), unit: 'cm', inputMis: [{ v: P - a, mis: 'ters_cevre' }, { v: P - 2 * a, mis: 'ters_cevre' }], steps: [`Ç ÷ 2 = ${P} ÷ 2 = ${a + b} (bir uzun + bir kısa kenar)`, `Kısa kenar = ${a + b} − ${a} = ${b} cm`] });
  };
  GEN.a_alan = (lv) => {
    if (lv === 1) {
      let a, b; do [a, b] = dikKenar(3); while (a * b === 2 * (a + b)); // 6×3: alan = çevre; eşit kenar = kare; "dikdörtgen" denen soruda kenarlar farklı; alan ≤ 36
      return Q({ type: 'input', prompt: 'Şekildeki dikdörtgenin alanı kaç birimkaredir?', visual: V.rect(a, b, '', true), answer: String(a * b), unit: 'birimkare', inputMis: [{ v: 2 * (a + b), mis: 'cevre_alan' }, { v: a + b, mis: 'cevre_alan' }], steps: [`Bir sırada ${a} kare, ${b} sıra var.`, `${a} × ${b} = ${a * b} birimkare`] });
    }
    if (lv === 2) {
      const [a, b] = dikKenar(4), u = pick(['cm', 'm']);
      return Q({ prompt: `Kenar uzunlukları ${a} ${u} ve ${b} ${u} olan dikdörtgenin alanı nedir?`, visual: V.rect(a, b, u), options: mc(`${a * b} ${u}²`, [[`${a * b} ${u}`, 'birim'], [`${2 * (a + b)} ${u}²`, 'cevre_alan'], [`${2 * (a + b)} ${u}`, 'cevre_alan']], [[`${a + b} ${u}²`, 'cevre_alan'], [`${a * b + a} ${u}²`, 'genel']]), steps: ['Alan = uzun kenar × kısa kenar', `A = ${a} × ${b} = ${a * b} ${u}²`, 'Alan birimi kare birimdir (²).'] });
    }
    const [a, b] = Math.random() < 0.5 ? dikKenar(4) : dikKenar(4).reverse();
    return Q({ type: 'input', prompt: `Alanı ${a * b} m² olan dikdörtgen biçimindeki bir bahçenin bir kenarı ${a} m'dir. Diğer kenarı kaç m'dir?`, answer: String(b), unit: 'm', inputMis: [{ v: a * b - a, mis: 'cevre_alan' }, { v: a * b / 2 - a, mis: 'cevre_alan' }], steps: ['Alan = a × b  →  b = Alan ÷ a', `${a * b} ÷ ${a} = ${b} m`] });
  };
  GEN.a_cevre_alan = (lv) => {
    if (lv === 1) {
      const [a, b] = dikKenar(4), ask = pick(['çevre', 'alan']); // b < a: kenarlar eşit olunca "dikdörtgen" kafa karıştırıyordu (kare)
      const ok = ask === 'çevre' ? `${2 * (a + b)} cm` : `${a * b} cm²`, other = ask === 'çevre' ? `${a * b} cm` : `${2 * (a + b)} cm²`;
      return Q({ prompt: ask === 'çevre' ? `Kenarları ${a} cm ve ${b} cm olan dikdörtgen bir kartonun etrafına şerit yapıştırılacak. Ne kadar şerit gerekir?` : `Kenarları ${a} cm ve ${b} cm olan dikdörtgen bir kartonun üstü renkli kâğıtla tamamen kaplanacak. Ne kadar kâğıt gerekir?`, options: mc(ok, [[other, 'cevre_alan'], [ask === 'çevre' ? `${a + b} cm` : `${a + b} cm²`, ask === 'çevre' ? 'cevre_yarim' : 'cevre_alan']], [[ask === 'çevre' ? `${2 * (a + b)} cm²` : `${a * b} cm`, 'birim']]), steps: [ask === 'çevre' ? 'Etrafına şerit → çevre (uzunluk, cm)' : 'Üstünü kaplamak → alan (cm²)', ask === 'çevre' ? `2 × (${a} + ${b}) = ${2 * (a + b)} cm` : `${a} × ${b} = ${a * b} cm²`] });
    }
    if (lv === 2) {
      const tip = pick(['genel', 'genel2', 'sayi', 'sayi']);
      if (tip === 'genel') return tfQ({ prompt: 'Çevre uzunlukları eşit olan iki dikdörtgenin alanları da her zaman eşittir.', steps: ['Örnek: 5×1 ve 3×3 dikdörtgenlerinin çevresi 12 cm.', 'Alanları: 5 cm² ve 9 cm² → farklı!', 'Yani ifade YANLIŞ.'] }, false, 'cevre_alan_ayni');
      if (tip === 'genel2') return tfQ({ prompt: 'Alanları eşit olan iki dikdörtgenin çevreleri de her zaman eşittir.', steps: ['Örnek: 4×1 ve 2×2 dikdörtgenlerinin alanı 4 cm².', 'Çevreleri: 10 cm ve 8 cm → farklı!', 'Yani ifade YANLIŞ.'] }, false, 'cevre_alan_ayni');
      const h = ri(6, 12), x = ri(1, Math.floor(h / 2) - 1), y = ri(x + 1, Math.floor(h / 2)), neAlan = Math.random() < 0.5;
      return tfQ({ prompt: `${h - x} cm × ${x} cm ve ${h - y} cm × ${y} cm boyutlarındaki iki dikdörtgenin ${neAlan ? 'alanları' : 'çevreleri'} eşittir.`, steps: [`Çevreler: 2 × (${h - x} + ${x}) = ${2 * h} cm ve 2 × (${h - y} + ${y}) = ${2 * h} cm → eşit.`, `Alanlar: ${h - x} × ${x} = ${(h - x) * x} cm² ve ${h - y} × ${y} = ${(h - y) * y} cm² → farklı.`, 'Çevresi eşit dikdörtgenlerin alanı farklı olabilir.'] }, !neAlan, neAlan ? 'cevre_alan_ayni' : 'cevre_alan');
    }
    const P = pick([12, 16, 20, 24]), s = P / 4, h = P / 2; // en büyük alan (kare) ≤ 36
    if (Math.random() < 0.4) {
      return Q({ prompt: `Kenar uzunlukları doğal sayı ve çevre uzunluğu ${P} cm olan dikdörtgenler arasında alanı EN KÜÇÜK olanın alanı kaç cm²'dir?`, options: mc(`${h - 1} cm²`, [[`${s * s} cm²`, 'cevre_alan_ayni'], [`${(h - 2) * 2} cm²`, 'cevre_alan_ayni']], [[`${P} cm²`, 'cevre_alan']]), steps: [`Uzun + kısa kenar = ${P} ÷ 2 = ${h}`, `Denemeler: ${h - 1}×1=${h - 1}, ${h - 2}×2=${(h - 2) * 2}, ..., ${s}×${s}=${s * s}`, `Kenarlar arasındaki fark en çok olunca alan en küçük: ${h - 1}×1 = ${h - 1} cm²`] });
    }
    const alt = [[(h - 1) * 1, 'cevre_alan_ayni'], [(h - 2) * 2, 'cevre_alan_ayni'], [(h - 3) * 3, 'cevre_alan_ayni']].filter(([v]) => v !== s * s);  // P = 12'de 3×3 karenin kendisi
    return Q({ prompt: `Kenar uzunlukları doğal sayı ve çevre uzunluğu ${P} cm olan dikdörtgenler arasında alanı EN BÜYÜK olanın alanı kaç cm²'dir?`, options: mc(`${s * s} cm²`, alt.map(([v, m]) => [`${v} cm²`, m]), [[`${P} cm²`, 'cevre_alan']]), steps: [`Uzun + kısa kenar = ${P} ÷ 2 = ${h}`, `Denemeler: ${h - 1}×1=${h - 1}, ${h - 2}×2=${(h - 2) * 2}, ..., ${s}×${s}=${s * s}`, `Kenarlar eşit olunca (kare) alan en büyük: ${s * s} cm²`] });
  };

  /* =========================================================
     TEMA 4 — KESİRLER
     ========================================================= */
  GEN.f_tur = (lv) => {
    if (lv === 1) {
      if (Math.random() < .5) { const n = pick([4, 5, 6, 8]), k = pick(Array.from({ length: n - 1 }, (_, j) => j + 1).filter(j => 2 * j !== n)); return Q({ prompt: 'Şeklin boyalı kısmı bütünün kaçta kaçıdır?', visual: V.bar(k, n), options: mc(fr(k, n), [[fr(n - k, n), 'bos_kisim'], [fr(k, n - k), 'kesir_model'], [fr(n, k), 'pay_payda_ters']]), steps: [`Bütün ${n} eş parçaya bölünmüş → payda ${n}`, `${k} parça boyalı → pay ${k}`] }); }
      // Kitabın terimleri (2. kitap s. 12, 18): birim kesir, bileşik kesir, tam sayılı kesir. "Basit kesir" kitapta geçmez.
      const t = pick(['birim', 'bilesik', 'tamsayili']); let n, d, w = 0;
      if (t === 'birim') { n = 1; d = ri(2, 12); } if (t === 'bilesik') { d = ri(2, 9); n = d + ri(1, 9); } if (t === 'tamsayili') { d = ri(3, 9); n = ri(1, d - 1); w = ri(1, 4); }
      const name = { birim: 'Birim kesir', bilesik: 'Bileşik kesir', tamsayili: 'Tam sayılı kesir' };
      const yanlis = Object.keys(name).filter(k => k !== t).map(k => [name[k], 'kesir_tur']);
      return Q({ prompt: `${w ? U.mixed(w, n, d) : fr(n, d)} kesri hangi türdendir?`, options: mc(name[t], yanlis), steps: ['Payı 1 olan kesir → birim kesir', 'Payı paydasına eşit ya da paydasından büyük kesir → bileşik kesir', 'Tam kısmı ve kesir kısmı olan gösterim → tam sayılı kesir'] });
    }
    if (lv === 2) {
      const d = ri(3, 9), w = ri(1, 4); let r; do r = ri(1, d - 1); while (r === w); const n = w * d + r;  // r = w olunca tam kısımla payı karıştırmak görünmez
      return Q({ prompt: `${fr(n, d)} bileşik kesrinin tam sayılı kesir olarak gösterimi hangisidir?`, options: mc(mixed(w, r, d), [[mixed(r, w, d), 'tamsayili'], [mixed(w, r, n), 'tamsayili'], [mixed(w + 1, r, d), 'tamsayili']]), steps: [`${n} ÷ ${d} = ${w}, kalan ${r}`, `Tam kısım ${w}, pay ${r}, payda ${d}`] });
    }
    const d = ri(3, 9), w = ri(2, 5), r = ri(1, d - 1), n = w * d + r;  // w = 1 iken w × r + d = w × d + r (yanılgı doğru çıkar)
    return Q({ prompt: `${mixed(w, r, d)} tam sayılı kesrinin bileşik kesir gösterimi hangisidir?`, options: mc(fr(n, d), [[fr(w + r, d), 'tamsayili'], [fr(w * r + d, d), 'tamsayili'], [fr(w * d, r), 'tamsayili']]), steps: [`(Tam × payda) + pay = ${w} × ${d} + ${r} = ${n}`, `Payda aynı kalır → ${n}/${d}`] });
  };
  GEN.f_denk = (lv) => {
    const n = ri(1, 5), d = n + ri(1, 6), k = ri(2, 5);
    if (lv === 1) return Q({ type: 'input', prompt: `${fr(n, d)} = ${fr('?', d * k)}   Soru işareti yerine hangi sayı gelmelidir?`, answer: String(n * k), inputMis: [{ v: n + (d * k - d), mis: 'denk_toplama' }], steps: [`Payda ${d} iken ${d * k} olmuş: ${k} ile çarpılmış.`, `Pay da ${k} ile çarpılır: ${n} × ${k} = ${n * k}`] });
    if (lv === 2) {
      const g = gcd(n, d), nn = n / g, dd = d / g, N = nn * k, D = dd * k;
      return Q({ prompt: `${fr(N, D)} kesrinin en sade hâli hangisidir?`, options: mc(fr(nn, dd), [[fr(N - 1, D - 1), 'denk_toplama'], [fr(nn, D), 'sade_tek'], [fr(N, dd), 'sade_tek']], [[fr(nn + 1, dd + 1), 'denk_toplama']]), steps: [`Pay ve paydayı ortak bölen ${k} ile böl.`, `${N} ÷ ${k} = ${nn}, ${D} ÷ ${k} = ${dd}`] });
    }
    const base = pick([[3, 4], [2, 3], [2, 5], [3, 5], [1, 4]]), [a, b] = base;
    const goods = [2, 3, 4].map(m => fr(a * m, b * m)), bad = fr(a + 2, b + 2);
    const opts = shuffle([{ t: bad, ok: true }, ...shuffle(goods).slice(0, 3).map(t => ({ t, ok: false, mis: 'denk_toplama' }))]);
    return Q({ prompt: `Aşağıdakilerden hangisi ${fr(a, b)} kesrine denk DEĞİLDİR?`, options: opts, steps: ['Denk kesirler, pay ve paydanın AYNI sayıyla çarpılmasıyla elde edilir.', `${a + 2}/${b + 2}: pay ve paydaya 2 EKLENMİŞ → denk değil.`] });
  };
  GEN.f_ondalik = (lv) => {
    if (lv === 1) {
      const d = pick([10, 100]), n = d === 10 ? ri(1, 29) : pick([ri(1, 9), ri(11, 299)]);
      const ok = fmtD(n / d, d === 10 ? 1 : 2), wr = d === 100 ? [[fmtD(n / 10, 1), 'ondalik_basamak'], [fmtD(n / 1000, 3), 'ondalik_basamak']] : [[fmtD(n / 100, 2), 'ondalik_basamak'], [String(n), 'ondalik_basamak']];
      return Q({ prompt: `${fr(n, d)} kesrinin ondalık gösterimi hangisidir?`, options: mc(ok, wr, [[fmtD(n / d + 1, d === 10 ? 1 : 2), 'genel']]), steps: [`Payda ${d} → virgülden sonra ${d === 10 ? 1 : 2} basamak.`, `${n}/${d} = ${ok}`] });
    }
    if (lv === 2) {
      const [n, d] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [7, 20], [9, 20], [12, 25], [3, 25], [11, 50], [7, 50]]);
      const k = (d <= 5 ? (10 % d === 0 ? 10 : 100) : 100) / d, D = d * k, N = n * k;
      return Q({ prompt: `${fr(n, d)} kesrinin ondalık gösterimi hangisidir?`, options: mc(fmtD(n / d, D === 10 ? 1 : 2), [[fmtD(n / 10, 1), 'ondalik_basamak'], [n + ',' + d, 'ondalik_basamak'], [fmtD(N / 1000, 3), 'ondalik_basamak']]), steps: [`Paydayı 10 veya 100 yap: ${fr(n, d)} = ${fr(N, D)} (×${k})`, `${N}/${D} = ${fmtD(n / d)}`] });
    }
    const w = ri(1, 9), dec = pick([ri(11, 99), ri(1, 9)]), two = dec > 9 || Math.random() < .3;
    const val = two ? `${w},${String(dec).padStart(2, '0')}` : `${w},${dec}`;
    const decW = U.words(two ? dec : dec);
    const ok = `${U.cap(U.words(w))} tam ${two ? 'yüzde' : 'onda'} ${decW}`;
    return Q({ prompt: `${val} ondalık gösteriminin okunuşu hangisidir?`, options: mc(ok, [[`${U.cap(U.words(w))} tam ${two ? 'onda' : 'yüzde'} ${decW}`, 'ondalik_okunus'], [`${U.cap(U.words(w * (two ? 100 : 10) + dec))}`, 'ondalik_okunus'], [`${U.cap(U.words(w))} tam binde ${decW}`, 'ondalik_okunus']]), steps: [`Tam kısım: ${w}`, `Virgülden sonra ${two ? '2 basamak → "yüzde"' : '1 basamak → "onda"'}`, ok] });
  };
  GEN.f_yuzde = (lv) => {
    if (lv === 1) {
      const p = pick([ri(1, 9), ri(10, 99)]);
      if (Math.random() < .5) return Q({ prompt: `%${p} ifadesinin ondalık gösterimi hangisidir?`, options: mc(fmtD(p / 100, 2), [[fmtD(p / 10, 1), 'yuzde_ondalik'], [String(p), 'yuzde_ondalik'], [fmtD(p / 1000, 3), 'yuzde_ondalik']]), steps: [`%${p} = ${p}/100`, `${p}/100 = ${fmtD(p / 100, 2)}`] });
      return Q({ prompt: `${fr(p, 100)} kesrinin yüzde ile gösterimi hangisidir?`, options: mc('%' + p, [['%' + (p * 10), 'yuzde_ondalik'], ['%' + fmtD(p / 100, 2), 'yuzde_ondalik'], ['%' + (100 - p), 'bos_kisim']]), steps: ['Paydası 100 olan kesir doğrudan yüzde olarak okunur.', `${p}/100 = %${p}`] });
    }
    if (lv === 2) { const k = ri(5, 95); return Q({ type: 'input', prompt: 'Yüzlük tablonun yüzde kaçı boyalıdır? (Sadece sayıyı yaz)', visual: V.grid100(k), answer: String(k), unit: '%', inputMis: [{ v: 100 - k, mis: 'bos_kisim', ac: `${100 - k} kare boyanmamış olanlar. Soru boyalı kısmı soruyor.` }, { v: k / 10, mis: 'yuzde_ondalik' }], steps: ['Tabloda 100 kare var.', `${k} kare boyalı → ${k}/100 = %${k}`], hint: 'Boyalı kareleri say. Bütün tabloda kaç kare var?' }); }
    const [n, d] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [7, 10], [3, 20], [9, 25], [1, 20]]);
    const p = n * 100 / d;
    return Q({ type: 'input', prompt: `${fr(n, d)} kesri yüzde kaça eşittir? (Sadece sayıyı yaz)`, answer: String(p), unit: '%', inputMis: [{ v: n * 10 + d, mis: 'yuzde_ondalik' }, { v: n / d, mis: 'yuzde_ondalik' }], steps: [`Paydayı 100 yap: ${100 / d} ile genişlet.`, `${fr(n, d)} = ${fr(n * 100 / d, 100)} = %${p}`] });
  };
  GEN.f_karsilastir = (lv) => {
    let a, b, c, d, misMap;
    if (lv === 1) { b = d = ri(5, 12); a = ri(1, b - 1); do { c = ri(1, b - 1); } while (c === a); misMap = { '<': 'esit_payda', '>': 'esit_payda', '=': 'esit_payda' }; }
    else if (lv === 2) { a = c = ri(1, 4); b = ri(a + 1, 9); do { d = ri(a + 1, 12); } while (d === b); misMap = { '<': 'payda_buyuk', '>': 'payda_buyuk', '=': 'payda_buyuk' }; }
    else { b = pick([2, 3, 4, 5]); const k = pick([2, 3]); d = b * k; a = ri(1, b - 1); c = ri(1, d - 1); if (c === a * k) c = c > 1 ? c - 1 : c + 1; if (Math.random() < .5) [a, b, c, d] = [c, d, a, b]; misMap = { '<': 'pay_payda_ayri', '>': 'pay_payda_ayri', '=': 'pay_payda_ayri' }; misMap[b > d ? '>' : '<'] = 'payda_buyuk'; misMap[a > c ? '>' : a < c ? '<' : '='] = 'pay_payda_ayri'; }  // 10.11.2026: paydası büyük olanı büyük sanmanın verdiği sembol payda_buyuk
    const L = a / b, R = c / d, rel = Math.abs(L - R) < 1e-9 ? '=' : L > R ? '>' : '<';
    return cmpQ({ prompt: 'Boş yere hangi sembol gelmelidir?', cmp: [fr(a, b), fr(c, d)], visual: lv === 1 ? `<div class="vis-ikili">${V.bar(a, b)}${V.bar(c, d)}</div>` : undefined, steps: lv === 1 ? ['Paydalar eşit → payı büyük olan büyüktür.'] : lv === 2 ? ['Paylar eşit → paydası KÜÇÜK olan büyüktür (parçalar daha büyük).'] : [`Paydaları eşitle: ortak payda ${Math.max(b, d)} olsun.`, `${a}/${b} = ${a * Math.max(b, d) / b}/${Math.max(b, d)}, ${c}/${d} = ${c * Math.max(b, d) / d}/${Math.max(b, d)}`, `Sonuç: ${a}/${b} ${rel} ${c}/${d}`] }, rel, misMap);
  };
  GEN.f_ondalik_karsilastir = (lv) => {
    let L, R, lt, rt, misMap = { '<': 'genel', '>': 'genel', '=': 'genel' };
    if (lv === 1) { // 0,7 ? 0,58 tuzağı
      const x = ri(3, 9), y = ri(10, x * 10 - 1); L = x / 10; R = y / 100; lt = fmtD(L, 1); rt = fmtD(R, 2); misMap['<'] = 'uzun_buyuk'; misMap['='] = 'uzun_buyuk';
      if (Math.random() < .5) { [L, R, lt, rt] = [R, L, rt, lt]; misMap = { '>': 'uzun_buyuk', '=': 'uzun_buyuk', '<': 'genel' }; }
    } else if (lv === 2) {
      const x = ri(1, 9) + ri(0, 9) / 10; L = x; R = x; lt = fmtD(x, 1); rt = fmtD(x, 2); misMap = { '<': 'sifir_fark', '>': 'sifir_fark' };
      if (Math.random() < .5) { R = x + pick([0.01, 0.05]); rt = fmtD(R, 2); misMap = { '>': 'uzun_buyuk', '=': 'sifir_fark' }; }
    } else {
      const p = ri(10, 90); L = p / 100; lt = '%' + p; const q = pick([p - ri(1, 9), p + ri(1, 9), p]) / 100; R = q; rt = Math.random() < .5 ? fmtD(q, 2) : fmtD(q, 2).replace(/0$/, '');
      misMap = { '<': 'yuzde_ondalik', '>': 'yuzde_ondalik', '=': 'yuzde_ondalik' };
    }
    const rel = Math.abs(L - R) < 1e-9 ? '=' : L > R ? '>' : '<'; delete misMap[rel];
    return cmpQ({ prompt: 'Boş yere hangi sembol gelmelidir?', cmp: [lt, rt], steps: ['İkisini de aynı biçime çevir (ör. yüzde birlik).', `${lt} = ${Math.round(L * 100)} yüzde, ${rt} = ${Math.round(R * 100)} yüzde`, `${lt} ${rel} ${rt}`] }, rel, misMap);
  };

  /* =========================================================
     TEMA 5 — İSTATİSTİKSEL ARAŞTIRMA SÜRECİ
     ========================================================= */
  const CATS = [['Elma', 'Muz', 'Çilek', 'Kiraz', 'Erik'], ['Futbol', 'Voleybol', 'Basketbol', 'Yüzme', 'Tenis'], ['Kedi', 'Köpek', 'Kuş', 'Balık', 'Tavşan'], ['Roman', 'Masal', 'Şiir', 'Çizgi R.', 'Bilim']];
  GEN.s_arastirma = (lv) => {
    if (lv === 1 && Math.random() < 0.4) return Q({ prompt: 'Hangisi istatistiksel bir araştırma sorusu olmaya UYGUN DEĞİLDİR?', options: mc(pick(['Ayşe\'nin en sevdiği renk nedir?', 'Öğretmenimizin doğum günü ne zaman?', 'Bugün hangi gün?', 'Türkiye\'nin başkenti neresidir?']), [['5/A sınıfındaki öğrencilerin en sevdiği meyve hangisidir?', 'soru_tek'], ['Okulumuzdaki öğrenciler okula hangi ulaşım aracıyla geliyor?', 'soru_tek'], ['Sınıfımızdaki öğrencilerin kardeş sayıları kaçtır?', 'soru_tek']]), steps: ['Araştırma sorusu bir GRUBA yöneltilir ve farklı cevapları olabilir.', 'Tek bir kişiye ya da tek cevaplı bir bilgiye yönelen soru araştırma sorusu değildir.'] });
    if (lv === 1) return Q({ prompt: pick(['Hangisi istatistiksel bir araştırma sorusu olmaya UYGUNDUR?', 'Sınıfta bir araştırma yapacağız. Hangisi iyi bir araştırma sorusudur?']), options: mc(pick(['5/A sınıfındaki öğrencilerin en sevdiği meyve hangisidir?', 'Okulumuzdaki öğrenciler okula hangi ulaşım aracıyla geliyor?', 'Mahallemizdeki ailelerin en çok tercih ettiği tatil yeri neresidir?']), [[pick(['Ayşe\'nin en sevdiği renk nedir?', 'Öğretmenimizin doğum günü ne zaman?']), 'soru_tek'], ['Bugün hangi gün?', 'soru_tek'], ['Türkiye\'nin başkenti neresidir?', 'soru_tek']]), steps: ['Araştırma sorusu bir GRUBA yöneltilir.', 'Birden çok farklı cevabı olabilir (değişkenlik vardır).'] });
    // Kitaptaki adlar (2. kitap s. 62–69)
    const ADIMLAR = ['Araştırma sorusunu belirleme', 'Verileri toplama ve analize hazırlama', 'Veri görselleştirme ve özetleme', 'Sonuçları yorumlama'];
    const adimSteps = ADIMLAR.map((a, i) => `${i + 1}) ${a}`);
    if (lv === 2) {
      if (Math.random() < 0.5) {
        const i = ri(0, 3), yon = i === 0 ? 'sonra' : i === 3 ? 'önce' : pick(['önce', 'sonra']), dogru = ADIMLAR[yon === 'önce' ? i - 1 : i + 1];
        const prompt = pick([true, false]) && (i === 0 || i === 3) ? `İstatistiksel araştırma sürecinin ${i === 0 ? 'İLK' : 'SON'} adımı hangisidir?` : `"${ADIMLAR[i]}" adımından hemen ${yon} hangi adım gelir?`;
        const cevap = prompt.includes('İLK') ? ADIMLAR[0] : prompt.includes('SON') ? ADIMLAR[3] : dogru;
        return Q({ prompt, options: mc(cevap, ADIMLAR.filter(x => x !== cevap).map(x => [x, 'adim_sira'])), steps: adimSteps });
      }
      const [konu, soru] = pick([['meyve', 'en sevdiği meyve'], ['spor', 'en çok yaptığı spor'], ['kitap türü', 'en çok okuduğu kitap türü'], ['renk', 'en sevdiği renk'], ['ulaşım aracı', 'okula geliş şekli']]);
      const [ornek, k] = pick([[`"Sınıfımızdaki öğrencilerin ${soru} nedir?" sorusunu yazmak`, 0], [`Arkadaşlarımıza ${soru} hakkında anket yapıp cevapları sıklık tablosuna yazmak`, 1], [`Sıklık tablosundaki ${konu} verilerini sütun grafiğine dönüştürmek`, 2], [`Grafiğe bakarak "En çok seçilen ${konu} hangisi?" sorusunu cevaplamak`, 3]]);
      return Q({ prompt: `${ornek} hangi araştırma adımına örnektir?`, options: mc(ADIMLAR[k], ADIMLAR.filter((_, j) => j !== k).map(x => [x, 'adim_sira'])), steps: adimSteps });
    }
    const hazir = pick(['TÜİK\'in yayımladığı istatistikler', 'Meteorolojinin yayımladığı sıcaklık kayıtları', 'Okul kütüphanesinin kitap ödünç kayıtları', 'Gazetede yayımlanan nüfus bilgileri']);
    const kendi = pick(['Sınıfta yaptığımız anket', 'Arkadaşlarımızla yaptığımız görüşme', 'Okul bahçesinde yaptığımız gözlem', 'Sınıfta yaptığımız ölçüm']);
    const it = pick([
      ['Aşağıdakilerden hangisi HAZIR veri kaynağıdır?', hazir, [['Sınıfta yaptığımız anket', 'veri_kaynak'], ['Arkadaşlarımızla yaptığımız görüşme', 'veri_kaynak'], ['Okul bahçesinde yaptığımız gözlem', 'veri_kaynak']], ['Hazır veri, başkalarının daha önce toplayıp yayımladığı veridir.', `${hazir}: bu veriyi biz toplamadık, hazır bulduk.`, 'Anket, görüşme ve gözlemde ise veriyi kendimiz toplarız.']],
      ['Aşağıdakilerden hangisi verileri KENDİMİZİN topladığı bir yöntemdir?', kendi, [['TÜİK\'in yayımladığı istatistikler', 'veri_kaynak'], ['Meteorolojinin yayımladığı sıcaklık kayıtları', 'veri_kaynak'], ['Gazetede yayımlanan nüfus bilgileri', 'veri_kaynak']], ['Anket, görüşme, gözlem ve ölçümle veriyi kendimiz toplarız.', `${kendi}: veriyi biz topluyoruz.`, 'TÜİK, meteoroloji ve gazete verileri ise başkalarının topladığı hazır verilerdir.']],
      ['Anket hazırlarken hangisine DİKKAT EDİLMELİDİR?', 'Kişisel bilgilerin gizliliği korunmalıdır', [['Katılanların adres bilgisi mutlaka alınmalıdır', 'anket_kural'], ['Sorular tek bir kişiye göre hazırlanmalıdır', 'soru_tek'], ['Tanımadığımız kişilerin anketlerine hemen cevap vermeliyiz', 'anket_kural']], ['Ankete katılanların adı, adresi gibi kişisel bilgileri gizli tutulur.', 'Anket soruları tek bir kişiye göre değil, bütün gruba göre hazırlanır.']],
      ['Bir anket sorusu nasıl olmalıdır?', 'Kısa, açık ve herkesin anlayacağı şekilde', [['Cevabı yönlendirecek şekilde', 'anket_kural'], ['Çok uzun ve karmaşık', 'anket_kural'], ['Katılanların kişisel bilgilerini soran', 'anket_kural']], ['İyi bir anket sorusunu herkes aynı şekilde anlar: kısa ve açıktır.', 'Soru, cevabı yönlendirmemeli ve kişisel bilgi istememelidir.']],
      ['Araştırma raporunda ankete katılanların adları yazılmalı mıdır?', 'Hayır, kişisel bilgiler gizli tutulur', [['Evet, herkesin adı yazılmalıdır', 'anket_kural'], ['Sadece en çok cevap verenin adı yazılır', 'anket_kural'], ['Sadece öğretmenin adı yazılır', 'anket_kural']], ['Araştırmada önemli olan kimin ne dediği değil, grubun cevaplarının dağılımıdır.', 'Katılanların adları ve kişisel bilgileri rapora yazılmaz, gizli tutulur.']],
    ]);
    return Q({ prompt: it[0], options: mc(it[1], it[2]), steps: it[3] });
  };
  GEN.s_tablo_sutun = (lv) => {
    const u = lv === 3 ? 10 : 2, cats = pick(CATS).slice(0, 4), vals = cats.map(() => ri(1, 6) * u); while (new Set(vals).size < 4) vals[ri(0, 3)] = ri(1, 7) * u;
    const mx = Math.max(...vals), mn = Math.min(...vals), iMx = vals.indexOf(mx), iMn = vals.indexOf(mn);
    const chart = V.barChart(cats, vals, { max: Math.ceil(mx / u) * u, step: u, aria: 'sütun grafiği' });
    if (lv === 1) { const az = Math.random() < 0.45, hi = az ? iMn : iMx;
      return Q({ prompt: az ? pick(['Grafiğe göre en az tercih edilen hangisidir?', 'Grafikte en kısa sütun hangi seçeneğe aittir?']) : pick(['Grafiğe göre en çok tercih edilen hangisidir?', 'Grafikte en uzun sütun hangi seçeneğe aittir?']), visual: chart, options: mc(cats[hi], cats.filter((_, i) => i !== hi).map(c => [c, 'grafik_okuma'])), steps: [az ? 'En kısa sütunu bul.' : 'En uzun sütunu bul.', `${az ? 'En kısa' : 'En uzun'}: ${cats[hi]} (${vals[hi]})`] }); }
    if (lv === 2) { const i = ri(0, 3); return Q({ type: 'input', prompt: `Grafiğe göre "${cats[i]}" seçeneğini kaç kişi tercih etmiştir?`, visual: chart, answer: String(vals[i]), inputMis: vals.filter((v, j) => j !== i && v !== vals[i]).map(v => ({ v, mis: 'grafik_okuma' })), steps: [`${cats[i]} sütununun tepesinden eksene bak.`, `Değer: ${vals[i]}`] }); }
    return Q({ type: 'input', prompt: `En çok tercih edilen seçenek, en az tercih edilenden kaç kişi FAZLADIR?`, visual: chart, answer: String(mx - mn), inputMis: [{ v: mx + mn, mis: 'fark_toplam' }], steps: [`En çok: ${cats[iMx]} = ${mx}`, `En az: ${cats[iMn]} = ${mn}`, `Fark: ${mx} − ${mn} = ${mx - mn}`] });
  };
  GEN.s_daire = (lv) => {
    // Bütün dilimleri eşit setler yok: "her dilim eşittir" yanılgısı (toplam ÷ dilim sayısı) doğru cevabı vermesin
    const sets = [[[1, 2], [1, 4], [1, 4]], [[1, 2], [1, 4], [1, 8], [1, 8]], [[3, 8], [3, 8], [1, 4]], [[1, 2], [3, 8], [1, 8]], [[1, 4], [3, 4]]];
    const parts = pick(sets), cats = shuffle(pick(CATS)).slice(0, parts.length), vals = parts.map(([n, d]) => n / d);
    const adaylar = parts.map((p, j) => j).filter(j => parts[j][0] * parts.length !== parts[j][1]);
    const total = pick([24, 32, 40, 48, 80, 120]), i = pick(adaylar), [n, d] = parts[i];
    const chart = V.pieChart(cats, vals);
    if (lv === 1) return Q({ prompt: `Daire grafiğine göre "${cats[i]}" dilimi bütünün kaçta kaçıdır?`, visual: chart, options: mc(fr(n, d), [[fr(n, d * 2), 'dilim_oran'], [fr(1, parts.length), 'dilim_oran'], [fr(n * 2 > d ? 1 : n * 2, n * 2 > d ? 3 : d), 'dilim_oran']], [[fr(1, 3), 'dilim_oran']]), steps: ['Bütün daire = 1', n * 2 === d ? 'Yarım daire = 1/2' : n * 4 === d ? 'Çeyrek daire = 1/4' : `Dilim ${d} eş parçadan ${n} tanesi kadar.`, `Cevap: ${n}/${d}`] });
    return Q({ type: 'input', prompt: `${total} öğrenciyle yapılan anketin sonucu daire grafiğinde verilmiştir. "${cats[i]}" seçeneğini kaç öğrenci tercih etmiştir?`, visual: chart, answer: String(total * n / d), unit: 'öğrenci', inputMis: [{ v: total / parts.length, mis: 'dilim_oran' }, { v: total * n / d / 2, mis: 'dilim_oran' }], steps: [`"${cats[i]}" dilimi bütünün ${n}/${d} kadarı.`, n === 1 ? `${total} ÷ ${d} = ${total / d} öğrenci` : `${total} ÷ ${d} = ${total / d}`].concat(n === 1 ? [] : [`${total / d} × ${n} = ${total * n / d} öğrenci`]) });
  };
  GEN.s_okuryazar = (lv) => {
    if (lv === 1) {
      const cats = pick(CATS).slice(0, 4), vals = cats.map(() => ri(1, 6)); while (new Set(vals).size < 3) vals[ri(0, 3)] = ri(1, 6);
      const tot = vals.reduce((a, b) => a + b, 0);
      if (Math.random() < 0.45) { // 03.11.2026: aynı grafikte farkı sorma (kök çeşitliliği)
        let i = vals.indexOf(Math.max(...vals)), j = vals.indexOf(Math.min(...vals));
        return Q({ type: 'input', prompt: `Nokta grafiğinde her nokta bir öğrenciyi gösteriyor. "${cats[i]}" seçeneğini seçenler, "${cats[j]}" seçeneğini seçenlerden kaç kişi fazladır?`, visual: V.dotPlot(cats, vals), answer: String(vals[i] - vals[j]), inputMis: [{ v: vals[i] + vals[j], mis: 'fark_toplam' }, { v: vals[i], mis: 'grafik_okuma' }], steps: [`${cats[i]}: ${vals[i]} nokta, ${cats[j]}: ${vals[j]} nokta.`, `Fark: ${vals[i]} − ${vals[j]} = ${vals[i] - vals[j]}`] });
      }
      return Q({ type: 'input', prompt: 'Nokta grafiğinde her nokta bir öğrenciyi gösteriyor. Ankete toplam kaç öğrenci katılmıştır?', visual: V.dotPlot(cats, vals), answer: String(tot), inputMis: [{ v: cats.length, mis: 'grafik_okuma' }, { v: Math.max(...vals), mis: 'grafik_okuma' }], steps: ['Bütün noktaları say.', `${vals.join(' + ')} = ${tot}`] });
    }
    if (lv === 2) {
      const cats = ['A', 'B'], a = ri(40, 46), b = a + ri(3, 6);
      return Q({ prompt: `Grafikte dikey eksen 38'den başlıyor. A ürünü ${a}, B ürünü ${b} adet satılmış. Grafikteki B sütunu A sütunundan çok daha uzun görünüyor. Hangisi DOĞRUDUR?`, visual: V.barChart(cats, [a, b], { min: 38, max: 50, step: 2, aria: 'kesik eksenli sütun grafiği' }), options: mc(`B, A'dan sadece ${b - a} adet fazla satılmıştır`, [['B, A\'nın birkaç katı satılmıştır', 'eksen_yanilsama'], ['A neredeyse hiç satılmamıştır', 'eksen_yanilsama'], ['Grafikten bir şey anlaşılmaz', 'eksen_yanilsama']]), steps: ['Eksen 0\'dan değil 38\'den başlıyor → sütun boyları farkı abartıyor.', `Gerçek sayılar: ${a} ve ${b}`, `Fark: ${b - a}`] });
    }
    // 03.11.2026: bağlam havuzu (önceden hep meyve anketiydi)
    const bg = pick([
      { cats: ['Elma', 'Muz', 'Çilek'], tur: 'meyve', dogru: 'Bu sınıfta en çok tercih edilen meyve elmadır', y: ['Türkiye\'deki tüm çocuklar en çok elmayı sever', 'Bu sınıftaki hiç kimse muz sevmez', 'Gelecek yıl da en çok elma seçilecektir'] },
      { cats: ['Futbol', 'Yüzme', 'Satranç'], tur: 'spor', dogru: 'Bu sınıfta en çok tercih edilen spor futboldur', y: ['Bütün okullarda en sevilen spor futboldur', 'Bu sınıfta hiç kimse yüzmeyi sevmez', 'Bu sınıftaki herkes futbol oynamayı bilir'] },
      { cats: ['Mavi', 'Yeşil', 'Mor'], tur: 'renk', dogru: 'Bu sınıfta en çok tercih edilen renk mavidir', y: ['Dünyadaki herkesin en sevdiği renk mavidir', 'Bu sınıfta hiç kimse yeşili sevmez', 'Bu sınıf gelecek yıl da en çok maviyi seçecektir'] },
    ]);
    const cats = bg.cats, vals = [ri(6, 9), ri(2, 4), ri(3, 5)];
    return Q({ prompt: `Bir sınıfta yapılan ankete göre ${cats[0]} ${vals[0]}, ${cats[1]} ${vals[1]}, ${cats[2]} ${vals[2]} öğrenci tarafından seçilmiştir. Bu veriye göre hangisi KESİNLİKLE söylenebilir?`, visual: V.barChart(cats, vals, { max: 10, aria: 'sütun grafiği' }), options: mc(bg.dogru, bg.y.map(t => [t, 'asiri_genelleme'])), steps: ['Veri sadece BU sınıftan toplandı.', 'Başka gruplara veya geleceğe genelleme yapılamaz.', `${cats[1]} seçen ${vals[1]} öğrenci var: «hiç kimse sevmez» denemez.`] });
  };

  /* =========================================================
     TEMA 6 — İŞLEMLERLE CEBİRSEL DÜŞÜNME
     ========================================================= */
  GEN.e_esitlik = (lv) => {
    if (lv === 1) {
      const a = ri(3, 12), b = ri(2, 12); let c = ri(1, a + b - 1); while (c === a || c === b) c = ri(1, a + b - 1);
      return Q({ type: 'input', prompt: `${a} + ${b} = ....... + ${c}   Boş yere hangi sayı gelmelidir?`, answer: String(a + b - c), inputMis: [{ v: a + b, mis: 'esittir_sonuc' }, { v: a + b + c, mis: 'esittir_sonuc' }], steps: [`Sol taraf: ${a} + ${b} = ${a + b}`, `Sağ taraf da ${a + b} olmalı: ....... + ${c} = ${a + b}`, `${a + b} − ${c} = ${a + b - c}`], hint: 'Önce bilinen taraftaki işlemi yap. Öbür taraf da aynı sonucu vermeli: boş yere hangi sayı gelirse sonuç tutar?' });
    }
    if (lv === 2) {
      const L = [ri(2, 9), ri(2, 9)], r = ri(1, L[0] + L[1] - 1);
      return Q({ type: 'input', prompt: 'Terazi dengededir. Soru işaretli kutu kaç kilogramdır?', visual: V.balance(L.map(x => x + 'kg'), [r + 'kg', '?']), answer: String(L[0] + L[1] - r), unit: 'kg', inputMis: [{ v: L[0] + L[1], mis: 'esittir_sonuc' }, { v: L[0] + L[1] + r, mis: 'esittir_sonuc' }], steps: [`Sol kefe: ${L[0]} + ${L[1]} = ${L[0] + L[1]} kg`, `Sağ kefe de ${L[0] + L[1]} kg olmalı.`, `${L[0] + L[1]} − ${r} = ${L[0] + L[1] - r} kg`] });
    }
    const x = ri(3, 20), a = ri(2, 9), b = ri(2, 9);
    return Q({ type: 'input', prompt: `▲ + ${a} = ${x + a} olduğuna göre ▲ + ${a + b} kaçtır?`, answer: String(x + a + b), inputMis: [{ v: x + a, mis: 'denge_bozma' }, { v: x, mis: 'denge_bozma' }], steps: [`İki tarafa da ${b} eklersek denge bozulmaz.`, `▲ + ${a} + ${b} = ${x + a} + ${b}`, `▲ + ${a + b} = ${x + a + b}`] });
  };
  GEN.e_ozellik = (lv) => {
    if (lv === 1) {
      const a = ri(2, 9); let b = ri(2, 9); while (b === a) b = ri(2, 9); const c = ri(2, 9);
      const it = pick([
        [`${a} × ${b} = ${b} × ${a}`, 'Değişme özelliği'], [`${a} + ${b} = ${b} + ${a}`, 'Değişme özelliği'],
        [`(${a} + ${b}) + ${c} = ${a} + (${b} + ${c})`, 'Birleşme özelliği'], [`(${a} × ${b}) × ${c} = ${a} × (${b} × ${c})`, 'Birleşme özelliği'],
        [`${a} × (${b} + ${c}) = ${a} × ${b} + ${a} × ${c}`, 'Toplama üzerine dağılma özelliği'],
      ]);
      const all = ['Değişme özelliği', 'Birleşme özelliği', 'Toplama üzerine dağılma özelliği'];
      return Q({ prompt: `${it[0]} eşitliğinde hangi işlem özelliği kullanılmıştır?`, options: mc(it[1], all.filter(x => x !== it[1]).map(x => [x, 'ozellik_karis']), [['Eşitliğin korunumu', 'ozellik_karis']]), steps: ['Yer değişmiş → değişme', 'Parantez yer değişmiş (gruplama) → birleşme', 'Çarpım parantezin içine dağılmış → dağılma'] });
    }
    if (lv === 2) {
      const a = ri(12, 49), b = pick([11, 12, 21, 102, 13]), t = Math.floor(b / 10) * 10, o = b - t;
      return Q({ type: 'input', prompt: `${a} × ${b} = ${a} × ${t} + ${a} × .......   Boş yere hangi sayı gelmelidir?`, answer: String(o), inputMis: [{ v: b, mis: 'dagilma_eksik' }, { v: a * o, mis: 'dagilma_eksik' }], steps: [`${b} = ${t} + ${o}`, `${a} × (${t} + ${o}) = ${a} × ${t} + ${a} × ${o}`] });
    }
    const a = ri(3, 9), b = ri(2, a - 1), c = ri(2, 9), bb = c + ri(1, 5), x = bb + c + ri(3, 20);
    const it = pick([
      [`${a} − ${b} = ${b} − ${a}`, false, 'cikarma_degisme', [`Sol taraf: ${a} − ${b} = ${a - b}`, `Sağ taraf: ${b} − ${a}. Küçük sayıdan büyük sayı çıkarılıyor; sonuç ${a - b} olamaz.`, 'İki taraf eşit değil: çıkarmada sayıların yeri değiştirilemez.']],
      [`${a * b} ÷ ${b} = ${b} ÷ ${a * b}`, false, 'cikarma_degisme', [`Sol taraf: ${a * b} ÷ ${b} = ${a}`, `Sağ taraf: ${b} ÷ ${a * b}. Küçük sayı büyük sayıya bölünüyor; sonuç ${a} olamaz.`, 'İki taraf eşit değil: bölmede sayıların yeri değiştirilemez.']],
      [`${a} × ${b} = ${b} × ${a}`, true, 'ozellik_karis', [`Sol taraf: ${a} × ${b} = ${a * b}`, `Sağ taraf: ${b} × ${a} = ${a * b}`, 'İki taraf eşit: çarpmada sayıların yeri değişse de sonuç değişmez (değişme özelliği).']],
      [`${a} + ${c} = ${c} + ${a}`, true, 'ozellik_karis', [`Sol taraf: ${a} + ${c} = ${a + c}`, `Sağ taraf: ${c} + ${a} = ${a + c}`, 'İki taraf eşit: toplamada sayıların yeri değişse de sonuç değişmez (değişme özelliği).']],
      [`${a} × (${b} + ${c}) = ${a} × ${b} + ${c}`, false, 'dagilma_eksik', [`Sol taraf: ${a} × (${b} + ${c}) = ${a} × ${b + c} = ${a * (b + c)}`, `Sağ taraf: ${a} × ${b} + ${c} = ${a * b} + ${c} = ${a * b + c}`, `İki taraf eşit değil: ${a}, parantezin içindeki iki sayıyla da çarpılmalıydı.`]],
      [`${a} × (${b} + ${c}) = ${a} × ${b} + ${a} × ${c}`, true, 'dagilma_eksik', [`Sol taraf: ${a} × (${b} + ${c}) = ${a} × ${b + c} = ${a * (b + c)}`, `Sağ taraf: ${a} × ${b} + ${a} × ${c} = ${a * b} + ${a * c} = ${a * b + a * c}`, 'İki taraf eşit: çarpma, parantezin içindeki her sayıya dağıtılmış (dağılma özelliği).']],
      [`(${a} + ${b}) + ${c} = ${a} + (${b} + ${c})`, true, 'ozellik_karis', [`Sol taraf: (${a} + ${b}) + ${c} = ${a + b} + ${c} = ${a + b + c}`, `Sağ taraf: ${a} + (${b} + ${c}) = ${a} + ${b + c} = ${a + b + c}`, 'İki taraf eşit: toplamada parantezin yeri değişse de sonuç değişmez (birleşme özelliği).']],
      [`(${x} − ${bb}) − ${c} = ${x} − (${bb} − ${c})`, false, 'cikarma_degisme', [`Sol taraf: (${x} − ${bb}) − ${c} = ${x - bb} − ${c} = ${x - bb - c}`, `Sağ taraf: ${x} − (${bb} − ${c}) = ${x} − ${bb - c} = ${x - bb + c}`, 'İki taraf eşit değil: çıkarmada parantezin yeri değiştirilemez.']],
    ]);
    return tfQ({ prompt: `"${it[0]}" eşitliği doğru mudur?`, steps: it[3] }, it[1], it[2]);  // 10.11.2026: iki taraf hesaplanıp gösterilir
  };
  GEN.e_us = (lv) => {
    if (lv === 1) { const a = ri(3, 12); return Q({ type: 'input', prompt: `${a}² (${nk(a, 'in')} karesi) kaçtır?`, answer: String(a * a), inputMis: [{ v: 2 * a, mis: 'us_carpim' }, { v: a + 2, mis: 'us_carpim' }], steps: [`${a}² = ${a} × ${a}`, `= ${a * a}`] }); }
    if (lv === 2) { const a = ri(2, 6); return Q({ type: 'input', prompt: `${a}³ (${nk(a, 'in')} küpü) kaçtır?`, answer: String(a ** 3), inputMis: [{ v: 3 * a, mis: 'us_carpim' }, { v: a * a, mis: 'us_carpim' }], steps: [`${a}³ = ${a} × ${a} × ${a}`, `= ${a * a} × ${a} = ${a ** 3}`] }); }
    const a = ri(2, 4), b = ri(2, 6);
    return Q({ type: 'input', prompt: `${a}³ + ${b}² işleminin sonucu kaçtır?`, answer: String(a ** 3 + b * b), inputMis: [{ v: 3 * a + 2 * b, mis: 'us_carpim' }], steps: [`${a}³ = ${a ** 3}`, `${b}² = ${b * b}`, `${a ** 3} + ${b * b} = ${a ** 3 + b * b}`] });
  };
  GEN.e_oncelik = (lv) => {
    if (lv === 1) { const a = ri(2, 20), b = ri(2, 9), c = ri(2, 9); return Q({ type: 'input', prompt: `${a} + ${b} × ${c} = ?`, answer: String(a + b * c), inputMis: [{ v: (a + b) * c, mis: 'oncelik_soldan' }], steps: ['Önce çarpma!', `${b} × ${c} = ${b * c}`, `${a} + ${b * c} = ${a + b * c}`] }); }
    if (lv === 2) {
      const a = ri(2, 9), b = ri(2, 9), c = ri(2, 6), d = ri(1, Math.min(9, (a + b) * c - 1));  // sonuç hiç eksi olmasın (5. sınıf)
      return Q({ type: 'input', prompt: `(${a} + ${b}) × ${c} − ${d} = ?`, answer: String((a + b) * c - d), inputMis: [...(c > d ? [{ v: (a + b) * (c - d), mis: 'oncelik_soldan' }] : []), ...(a + b * c > d ? [{ v: a + b * c - d, mis: 'oncelik_soldan' }] : [])], steps: [`Önce parantez: ${a} + ${b} = ${a + b}`, `Sonra çarpma: ${a + b} × ${c} = ${(a + b) * c}`, `En son çıkarma: ${(a + b) * c} − ${d} = ${(a + b) * c - d}`] });
    }
    const a = ri(2, 9), b = ri(3, 5), c = ri(2, 4);  // b = 2 olunca b² = 2 × b, üs yanılgısı görünmez
    return Q({ type: 'input', prompt: `${a} + ${b}² × ${c} = ?`, answer: String(a + b * b * c), inputMis: [{ v: (a + b) ** 2 * c, mis: 'oncelik_soldan' }, { v: (a + b * b) * c, mis: 'oncelik_soldan' }, { v: a + 2 * b * c, mis: 'us_carpim' }], steps: [`Önce üs: ${b}² = ${b * b}`, `Sonra çarpma: ${b * b} × ${c} = ${b * b * c}`, `En son toplama: ${a} + ${b * b * c} = ${a + b * b * c}`] });
  };
  GEN.e_oruntu = (lv) => {
    const d = ri(2, 7); let a; do a = ri(1, 9); while (a === d);  // a = d iken başlangıcı unutmak doğru cevabı verir
    if (lv === 1) { const seq = [0, 1, 2, 3].map(i => a + i * d); return Q({ type: 'input', prompt: `${seq.join(', ')}, ....  Örüntünün bir sonraki terimi kaçtır?`, answer: String(a + 4 * d), inputMis: [{ v: a + 5 * d, mis: 'oruntu_bir' }], steps: [`Terimler ${nk(d, 'er')} artıyor.`, `${seq[3]} + ${d} = ${a + 4 * d}`] }); }
    if (lv === 2) {
      const n = pick([10, 12, 15, 20]);
      return Q({ type: 'input', prompt: `${a} ile başlayan ve ${nk(d, 'er')} artan örüntünün ${n}. terimi kaçtır?`, answer: String(a + (n - 1) * d), inputMis: [{ v: n * d, mis: 'oruntu_baslangic' }, { v: a + n * d, mis: 'oruntu_bir' }], steps: [`1. terim ${a}. Her adımda ${d} artıyor.`, `${n}. terime kadar ${n - 1} artış olur: ${n - 1} × ${d} = ${(n - 1) * d}`, `${a} + ${(n - 1) * d} = ${a + (n - 1) * d}`] });
    }
    const m = pick([2, 3]), c = pick([1, 2]), f = (k) => m * k + c, n = pick([10, 15, 20]);
    return Q({ type: 'input', prompt: `Şekil örüntüsünde her adımdaki nokta sayısı ${m} artıyor (1. adım ${f(1)}, 2. adım ${f(2)}, 3. adım ${f(3)} nokta). ${n}. adımda kaç nokta olur?`, visual: V.dotPattern(f, 3), answer: String(f(n)), inputMis: [{ v: m * n, mis: 'oruntu_baslangic' }, { v: f(n + 1), mis: 'oruntu_bir' }], steps: [`Kural: adım sayısı × ${m} + ${c}`, `Kontrol: 1×${m}+${c}=${f(1)} ✓`, `${n} × ${m} + ${c} = ${f(n)}`] });
  };
  GEN.e_algoritma = (lv) => {
    if (lv === 1) {
      const x = ri(2, 15), m = pick([2, 3]), p = ri(3, 12);
      return Q({ type: 'input', prompt: `Algoritma: 1. Başla  2. Sayı = ${x}  3. Sayıyı ${m} ile çarp  4. Sonuca ${p} ekle  5. Sonucu yaz  6. Bitir.  Yazılan sonuç kaçtır?`, answer: String(x * m + p), inputMis: [{ v: (x + p) * m, mis: 'algoritma_sira' }], steps: [`Sayı = ${x}`, `${x} × ${m} = ${x * m}`, `${x * m} + ${p} = ${x * m + p}`] });
    }
    if (lv === 2) {
      const x = ri(3, 20), k = pick([2, 4, 6, 10]);
      return Q({ type: 'input', prompt: `"Aklından bir sayı tut, 2 ile çarp, ${k} ekle, 2'ye böl, tuttuğun sayıyı çıkar." ${x} sayısını tutan biri hangi sonucu bulur?`, answer: String(k / 2), inputMis: [{ v: x, mis: 'algoritma_sira' }, { v: k, mis: 'algoritma_sira' }], steps: [`${x} × 2 = ${2 * x}`, `${2 * x} + ${k} = ${2 * x + k}`, `${2 * x + k} ÷ 2 = ${x + k / 2}`, `${x + k / 2} − ${x} = ${k / 2}  (Sihir: her sayı için aynı sonuç!)`] });
    }
    const step = pick([3, 4, 5]), lim = step * ri(4, 7);
    return Q({ type: 'input', prompt: `1. Başla  2. Toplam = 0  3. Toplama ${step} ekle  4. Toplam ${lim} ise 5. adıma geç, değilse 3. adıma dön  5. Bitir.  3. adım kaç kez çalışır?`, answer: String(lim / step), inputMis: [{ v: lim / step + 1, mis: 'dongu_sayma' }, { v: lim / step - 1, mis: 'dongu_sayma' }], steps: [`Her turda toplam ${step} artar: ${[1, 2, 3].map(i => i * step).join(', ')}, ...`, `${lim} olunca durur.`, `${lim} ÷ ${step} = ${lim / step} kez`] });
  };

  /* =========================================================
     TEMA 7 — VERİDEN OLASILIĞA
     ========================================================= */
  const OLAY = [
    ['Bir sayı küpü atıldığında 7 gelmesi', 'İmkânsız'], ['Bir sayı küpü atıldığında 1 ile 6 arasında bir sayı gelmesi', 'Kesin'], ['Madenî para atıldığında yazı gelmesi', 'Mümkün'],
    ['Yarın güneşin doğudan doğması', 'Kesin'], ['Bir haftanın 8 gün olması', 'İmkânsız'], ['İçinde sadece kırmızı top olan torbadan mavi top çekilmesi', 'İmkânsız'],
    ['İçinde sadece kırmızı top olan torbadan kırmızı top çekilmesi', 'Kesin'], ['Bir sayı küpü atıldığında çift sayı gelmesi', 'Mümkün'], ['Şubat ayının 30 çekmesi', 'İmkânsız'],
    ['Pikniğe gideceğimiz gün yağmur yağması', 'Mümkün'], ['Bir basketbolcunun üç sayılık atışını isabet ettirmesi', 'Mümkün'], ['Bir torbadan çekilen bilyenin, torbada olmayan renkte olması', 'İmkânsız'],
  ];
  GEN.p_olay = (lv) => {
    if (lv < 3) {
      const [e, t] = pick(OLAY), all = ['Kesin', 'İmkânsız', 'Mümkün'];
      return Q({ prompt: `"${e}" olayı hangisidir?`, options: mc(t, all.filter(x => x !== t).map(x => [x, 'olay_tur'])), steps: ['Mutlaka olacaksa → kesin (olasılık 1)', 'Asla olamazsa → imkânsız (olasılık 0)', 'Olabilir de olmayabilir de → mümkün'] });
    }
    // Seviye 3: olayın olasılık DEĞERİ (0 ya da 1); bağlam ve sayılar değişir
    const renk = pick(['kırmızı', 'mavi', 'yeşil', 'sarı']), diger = pick(['kırmızı', 'mavi', 'yeşil', 'sarı'].filter(r => r !== renk)), n = ri(3, 12);
    const [olay, deger] = pick([
      ['Kesin bir olay', '1'], ['İmkânsız bir olay', '0'],
      [`Bir sayı küpü atıldığında ${ri(7, 12)} gelmesi`, '0'], ['Bir sayı küpü atıldığında 7 sayısından küçük bir sayı gelmesi', '1'], ['Bir sayı küpü atıldığında 0 gelmesi', '0'],
      [`İçinde sadece ${n} ${renk} top olan torbadan ${renk} top çekilmesi`, '1'], [`İçinde sadece ${n} ${renk} top olan torbadan ${diger} top çekilmesi`, '0'],
      [`Bir haftanın ${ri(8, 10)} gün olması`, '0'], ['Madenî para atıldığında yazı ya da tura gelmesi', '1'],
    ]);
    const tersi = deger === '1' ? '0' : '1', soru = olay.endsWith('olay') ? `${olay}ın olasılık değeri kaçtır?` : `"${olay}" olayının olasılık değeri kaçtır?`;
    return Q({ prompt: soru, options: mc(deger, [[tersi, 'olay_tur'], [fr(1, 2), 'olay_tur'], [pick(['10', '100']), 'olasilik_buyuk']]), steps: ['Kesin olay → olasılık 1', 'İmkânsız olay → olasılık 0', 'Olasılık 0 ile 1 arasındadır; 1\'den büyük olamaz.'] });
  };
  GEN.p_spektrum = (lv) => {
    const n = pick([4, 6, 8]), k = ri(0, n), cols = shuffle(Array.from({ length: n }, (_, i) => i < k ? 'sb' : (i % 2 ? 'sy' : 'sr')));  // 07.11.2026: mavi olmayan dilimler de belirgin renkte (gri dilimler «hiç renk yok» gibi görünüyordu)
    if (lv === 1) {
      // 03.11.2026: kök hep "MAVİ dilim" idi; şimdi bazen "mavi OLMAYAN dilim" (tümleyeni düşünmek de ölçülür)
      const degil = Math.random() < 0.4, kh = degil ? n - k : k;
      const t = kh === 0 ? 'İmkânsız' : kh === n ? 'Kesin' : kh * 2 === n ? 'Eşit olası' : kh * 2 < n ? 'Az olası' : 'Çok olası';
      return Q({ prompt: degil ? 'Çark çevrildiğinde okun mavi OLMAYAN bir dilimde durması nasıl bir olaydır?' : pick(['Çark çevrildiğinde okun MAVİ dilimde durması nasıl bir olaydır?', 'Bu çark çevrilince okun MAVİ bir dilime gelmesi için hangisi söylenebilir?']), visual: V.spinner(cols), options: mc(t, ['İmkânsız', 'Az olası', 'Eşit olası', 'Çok olası', 'Kesin'].filter(x => x !== t).map(x => [x, x === 'Az olası' || x === 'Çok olası' ? 'az_cok' : 'olay_tur'])), steps: [degil ? `${n} dilimden ${k} tanesi mavi, ${n - k} tanesi mavi değil.` : `${n} dilimden ${k} tanesi mavi.`, kh === 0 ? (degil ? 'Mavi olmayan hiç dilim yok: ok oraya gelemez → imkânsız' : 'Hiç mavi dilim yok: ok maviye gelemez → imkânsız') : kh === n ? (degil ? 'Dilimlerin hepsi mavi değil: ok mutlaka mavi olmayan bir dilime gelir → kesin' : 'Dilimlerin hepsi mavi: ok mutlaka maviye gelir → kesin') : kh * 2 < n ? 'Yarısından az → az olası' : kh * 2 > n ? 'Yarısından fazla → çok olası' : 'Tam yarısı → eşit olası'] });  // 10.11.2026: 0 ve hepsi durumunda adım cevapla çelişiyordu («çok olası» diyordu, cevap «kesin»)
    }
    if (lv === 2) {
      let kk = Math.max(1, Math.min(n - 1, k)); if (2 * kk === n) kk = Math.random() < .5 ? kk - 1 : kk + 1; const cc = shuffle(Array.from({ length: n }, (_, i) => i < kk ? 'sb' : (i % 2 ? 'sy' : 'sr')));
      if (Math.random() < 0.4) { const m = n - kk;
        return Q({ prompt: 'Çark çevrildiğinde okun mavi OLMAYAN bir dilimde durma olasılığı kaçtır?', visual: V.spinner(cc), options: mc(fr(m, n), [[fr(kk, n), 'olasilik_oran'], [fr(m, kk), 'olasilik_oran'], [fr(n, m), 'olasilik_buyuk']]), steps: [`Parça: mavi olmayan ${m} dilim. Bütün: ${n} dilim.`, `Mavi olmayan dilimler bütünün ${fr(m, n)} kadarı.`] }); }
      return Q({ prompt: pick(['Çark çevrildiğinde okun MAVİ dilimde durma olasılığı kaçtır?', 'Bu çarkta okun MAVİ bir dilime gelme olasılığını hangi kesir gösterir?']), visual: V.spinner(cc), options: mc(fr(kk, n), [[fr(n - kk, n), 'olasilik_oran'], [fr(kk, n - kk === kk ? n + 1 : n - kk), 'olasilik_oran'], [fr(n, kk), 'olasilik_buyuk']]), steps: [`Parça: ${kk} mavi dilim. Bütün: ${n} dilim.`, `Mavi dilimler bütünün ${fr(kk, n)} kadarı.`] });
    }
    const tur = ri(0, 3);
    if (tur === 1) {
      // Gerekçe: tahmin, torbadaki top sayılarına dayanmalı (kişisel tercih ya da şans gerekçe değildir)
      const [cok, az] = shuffle(['kırmızı', 'mavi', 'yeşil', 'sarı']).slice(0, 2), a = ri(3, 7), b = ri(1, a - 1), ad = pick(NAMES);
      return Q({ prompt: `Renkleri dışında özdeş ${a} ${cok} ve ${b} ${az} top bir torbaya atılıyor. ${ad}, "Rastgele çekilen topun ${cok} olma olasılığı çoktur." diyor. Hangisi doğru bir gerekçedir?`,
        options: mc(`Torbada ${cok} toplar ${az} toplardan fazla.`, [[`${cok[0].toLocaleUpperCase('tr-TR') + cok.slice(1)} en sevdiği renk.`, 'olasilik_tercih'], [`${b} onun şanslı sayısı.`, 'olasilik_tercih'], ['İki renk var, olasılıklar her zaman eşittir.', 'iki_sonuc_esit']]),
        steps: [`${a + b} toptan ${a} tanesi ${cok}: yarısından fazla.`, 'Bu yüzden çekilen topun ' + cok + ' olma olasılığı çoktur.'] });
    }
    if (tur === 2) {
      // Adil oyun: renk küpü; yüz sayıları eşitse adil
      const m = ri(1, 5), k = 6 - m, adil = m === k, [o1, o2] = shuffle(NAMES).slice(0, 2);
      return Q({ prompt: `Bir renk küpünün ${m} yüzü mavi, ${k} yüzü kırmızı. Küp atılınca mavi gelirse ${o1}, kırmızı gelirse ${o2} puan alıyor. Bu oyun adil midir?`,
        options: mc(adil ? 'Evet, iki rengin olasılığı eşit.' : `Hayır, ${m > k ? 'mavi' : 'kırmızı'} gelme olasılığı daha fazla.`,
          adil ? [['Hayır, mavi gelme olasılığı daha fazla.', 'az_cok'], ['Hayır, kırmızı gelme olasılığı daha fazla.', 'az_cok']]
               : [['Evet, iki renk var; olasılıklar eşittir.', 'iki_sonuc_esit'], [`Hayır, ${m > k ? 'kırmızı' : 'mavi'} gelme olasılığı daha fazla.`, 'az_cok']]),
        steps: [`6 yüzden ${m} tanesi mavi, ${k} tanesi kırmızı.`, adil ? 'Yüz sayıları eşit, olasılıklar eşit: oyun adil.' : 'Yüz sayıları farklı, olasılıklar farklı: oyun adil değil.'] });
    }
    if (tur === 3) {
      // Spektrum: ondalık ya da yüzde gösterimin yeri
      const [g, t] = pick([['0', 'İmkânsız'], ['%0', 'İmkânsız'], ['0,2', 'Az olası'], ['%25', 'Az olası'], ['0,5', 'Eşit olası'], ['%50', 'Eşit olası'], ['0,8', 'Çok olası'], ['%75', 'Çok olası'], ['1', 'Kesin'], ['%100', 'Kesin']]);
      return Q({ prompt: `Bir olayın olasılığı ${g}. Bu olay olasılık spektrumunda nerededir?`, options: mc(t, ['İmkânsız', 'Az olası', 'Eşit olası', 'Çok olası', 'Kesin'].filter(x => x !== t).map(x => [x, (t === 'Az olası' && x === 'Çok olası') || (t === 'Çok olası' && x === 'Az olası') ? 'az_cok' : 'olay_tur'])),
        steps: ['Spektrum 0\'dan (imkânsız) 1\'e (kesin) gider; %0 ile %100 de aynıdır.', '0,5 (%50) ortadadır: eşit olası. Küçükse az olası, büyükse çok olası.'] });
    }
    return tfQ({ prompt: pick([`Bir olayın olasılığı ${fr(5, 4)} olabilir.`, 'Bir olayın olasılığı %120 olabilir.']), steps: ['Olasılık her zaman 0 ile 1 arasındadır.', '1\'den büyük olasılık (veya %100\'den fazlası) olamaz.'] }, false, 'olasilik_buyuk');
  };


  /* =========================================================
     KİTAP KALIPLARINDAN VARYASYONLAR
     Ders kitabındaki soru tipleri REFERANS alınır; metin, sayı ve bağlam
     tamamen yeniden üretilir (telif: kitap metni kopyalanmaz).
     q.ref → hangi kitap sayfasındaki kalıptan esinlendiği (öğretmen izi).
     ========================================================= */
  const VAR = {};
  VAR.n_karsilastir = [(lv) => {
    const k = lv === 1 ? 4 : lv === 2 ? 5 : 6, pool = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, k);
    if (lv > 1 && !pool.includes(0)) pool[0] = 0;
    const big = pool.slice().sort((a, b) => b - a).join(''), asc = pool.slice().sort((a, b) => a - b);
    let small = asc.join(''); if (asc[0] === 0) { const nz = asc.find(d => d > 0); const rest = asc.slice(); rest.splice(rest.indexOf(nz), 1); small = nz + rest.join(''); }
    const askBig = Math.random() < .5, ok = askBig ? big : small;
    const wr = askBig ? [[pool.join(''), 'ilk_rakam'], [small, 'ilk_rakam'], [big.slice(0, -2) + big.slice(-1) + big.slice(-2, -1), 'basamak_kayma']] : [[asc.join('') === small ? small.slice(0, 1) + small.slice(2, 3) + small.slice(1, 2) + small.slice(3) : asc.join(''), asc[0] === 0 ? 'sifir_basta' : 'basamak_kayma'], [big, 'ilk_rakam'], [pool.join(''), 'ilk_rakam']];
    return Q({ prompt: `${pool.join(', ')} rakamlarının her biri birer kez kullanılarak yazılabilecek ${k} basamaklı EN ${askBig ? 'BÜYÜK' : 'KÜÇÜK'} sayı hangisidir?`, options: mc(fmtN(+ok), wr.filter(w => w[0].length === k && (w[0][0] !== '0' || w[1] === 'sifir_basta')).map(([t, m]) => [t.length === k && t[0] !== '0' ? fmtN(+t) : t.replace(/\B(?=(\d{3})+(?!\d))/g, U.NB), m]), near(+ok)), steps: askBig ? ['En büyük sayı için rakamları büyükten küçüğe diz.', `→ ${fmtN(+big)}`] : ['En küçük sayı için rakamları küçükten büyüğe diz.', pool.includes(0) ? 'Ama sayı 0 ile başlayamaz: 0\'dan sonraki en küçük rakamı başa al, 0\'ı ikinci sıraya yaz.' : '', `→ ${fmtN(+small)}`].filter(Boolean), ref: '1. kitap s. 109' });
  }];
  VAR.n_okuma = [(lv) => {
    const g = [ri(100, 999), ri(0, 99), ri(100, 999), ri(100, 999)]; const n = fromGroups(g), hide = lv === 3 ? 1 : 0;
    const shown = g.map((v, i) => i === hide ? '▢' : String(v).padStart(i ? 3 : 1, '0')).join(' ');
    return Q({ type: 'input', prompt: `On iki basamaklı "${shown}" sayısının okunuşu "${U.cap(U.words(n))}"dir. ▢ yerine hangi sayı yazılmalıdır?`, answer: String(g[hide]), inputMis: [g[hide ? 0 : 1], g[2]].filter((v, i, L) => v !== g[hide] && L.indexOf(v) === i).map(v => ({ v, mis: 'boluk_kayma' })), steps: [`Okunuşta "${hide ? 'milyon' : 'milyar'}" kelimesinden önceki kısım: ${U.words(g[hide])}`, `▢ = ${g[hide]}${hide && g[hide] < 100 ? ' (bölükte ' + String(g[hide]).padStart(3, '0') + ' olarak yazılır)' : ''}`], ref: '1. kitap s. 109' });
  }];
  VAR.n_problem = [(lv) => {
    const items = shuffle([['ekmek', ri(12, 20)], ['peynir', ri(150, 260)], ['süt', ri(30, 45)], ['yumurta', ri(70, 120)], ['zeytin', ri(90, 160)], ['makarna', ri(15, 30)]]).slice(0, lv + 1);
    const tot = items.reduce((a, [, p]) => a + p, 0), paid = Math.ceil((tot + 1) / 100) * 100 + (lv === 3 ? 100 : 0);
    return Q({ type: 'input', prompt: `Alışveriş fişi: ${items.map(([n, p]) => `${n} ${p} TL`).join(', ')}. Kasaya ${fmtN(paid)} TL verildi. Kaç TL para üstü alınır?`, answer: String(paid - tot), unit: 'TL', inputMis: [{ v: tot, mis: 'problem_adim' }, { v: paid + tot, mis: 'ters_islem' }], steps: [`Toplam tutar: ${items.map(([, p]) => p).join(' + ')} = ${tot} TL`, `Para üstü: ${fmtN(paid)} − ${tot} = ${paid - tot} TL`], ref: '1. kitap s. 120–121' });
  }];
  VAR.f_ondalik = [(lv) => {
    const lira = lv === 1 ? ri(2, 19) : ri(20, 299), kurus = pick([ri(11, 99), 50, ri(1, 9) * 10, 5]);
    const ks = String(kurus).padStart(2, '0'), price = `${lira},${ks}`;
    const ok = `${U.cap(U.words(lira))} lira ${U.words(kurus)} kuruş`;
    const wr = [[`${U.cap(U.words(lira * 100 + kurus))} lira`, 'fiyat_okuma'], [`${U.cap(U.words(kurus))} lira ${U.words(lira)} kuruş`, 'fiyat_okuma']];
    if (kurus % 10 === 0) wr.push([`${U.cap(U.words(lira))} lira ${U.words(kurus / 10)} kuruş`, 'ondalik_basamak']); else wr.push([`${U.cap(U.words(lira))} lira ${U.words(kurus * 10 % 1000)} kuruş`, 'ondalik_basamak']);
    return Q({ prompt: `Market etiketinde "${price} TL" yazıyor. Bu fiyat nasıl okunur?`, options: mc(ok, wr), steps: ['Virgülün solu lira, sağı kuruş.', `${lira} lira ve ${ks} kuruş → ${ok}`], ref: '2. kitap s. 21' });
  }];
  VAR.f_ondalik_karsilastir = [(lv) => {
    const item = pick(['Süt', 'Sıvı yağ', 'Çay', 'Tereyağı', 'Un', 'Pirinç']); let a, b, as, bs;
    const w = ri(20, 240);
    if (lv === 1) { a = w + ri(1, 9) / 100 + .1; b = w - 1 + ri(90, 99) / 100; as = fmtD(a, 2); bs = fmtD(b, 2); }
    else if (lv === 2) { const d = ri(1, 9) / 10; a = w + d; b = w + d; as = fmtD(a, 2); bs = fmtD(b, 1); }
    else { const x = ri(10, 89); a = w + x / 100; b = w + (x + pick([-5, 5, 3, -3])) / 100; as = fmtD(a, 2); bs = fmtD(b, 2).replace(/0$/, ''); }
    if (Math.random() < .5) [a, b, as, bs] = [b, a, bs, as];
    const eq = Math.abs(a - b) < 1e-9, ok = eq ? 'İki markette fiyat aynı' : a < b ? 'A market' : 'B market';
    // Yanlış marketi seçmenin nedeni seviyeye göre farklı: 1'de lira kısmı farklı (kuruşa bakmak), 3'te basamak sayısı farklıysa "uzun büyük", eşitse yanlış basamağa bakmak
    const yanlisNeden = eq ? 'sifir_fark' : lv === 1 ? 'tam_kisim' : as.length !== bs.length ? 'uzun_buyuk' : 'basamak_karsilastir';
    const wr = [['A market', yanlisNeden], ['B market', yanlisNeden], ['İki markette fiyat aynı', 'sifir_fark']].filter(x => x[0] !== ok);
    return Q({ prompt: `${item}: A markette ${as} TL, B markette ${bs} TL. Hangi markette daha UCUZ?`, options: mc(ok, wr), steps: ['Önce lira (tam) kısmını karşılaştır.', 'Eşitse kuruş kısmına bak; basamak sayısını eşitle (0,5 = 0,50).', eq ? 'Fiyatlar aynı.' : `${fmtD(Math.min(a, b), 2)} TL daha ucuz.`], ref: '2. kitap s. 42' });
  }];
  VAR.f_yuzde = [(lv) => {
    const p = pick([10, 20, 25, 30, 40, 50, 15, 35]);
    return Q({ prompt: `Bir mağazada "%${p} İNDİRİM" tabelası var. %${p} hangi kesre eşittir?`, options: mc(fr(p, 100), [[fr(1, p), 'yuzde_ondalik'], [fr(p, 10), 'yuzde_ondalik'], [fr(p, 1000), 'yuzde_ondalik']]), steps: ['% işareti "yüzde", yani "100\'de" demektir.', `%${p} = ${p}/100`], ref: '2. kitap s. 17, 43' });
  }];
  VAR.a_alan = [(lv) => {
    // Kare olmasın (kenarlar farklı) ve çevre ≠ alan (3×6, 4×4: yanılgılı cevap doğru cevapla çakışır)
    let a, b; do { a = ri(3, 6); b = ri(2, a - 1); } while (a * b === 2 * (a + b)); const pr = pick([150, 200, 250, 300, 350, 400]);
    return Q({ type: 'input', prompt: `${a} m'ye ${b} m olan dikdörtgen biçimindeki odaya parke döşenecek. Parkenin metrekaresi ${pr} TL'dir. Parke kaç TL tutar?`, answer: String(a * b * pr), unit: 'TL', inputMis: [{ v: 2 * (a + b) * pr, mis: 'cevre_alan' }, { v: a * b, mis: 'problem_adim' }], steps: [`Odanın alanı: ${a} × ${b} = ${a * b} m²`, `Fiyat: ${a * b} × ${pr} = ${fmtN(a * b * pr)} TL`], ref: '1. kitap s. 158' });
  }];
  VAR.a_cevre = [(lv) => {
    const a = ri(8, 25), b = ri(4, a - 1), k = pick([2, 3, 4]);
    return Q({ type: 'input', prompt: `Kenarları ${a} m ve ${b} m olan dikdörtgen bir bahçenin etrafı ${k} sıra tel ile çevrilecek. Kaç metre tel gerekir?`, answer: String(k * 2 * (a + b)), unit: 'm', inputMis: [{ v: 2 * (a + b), mis: 'problem_adim' }, { v: k * (a + b), mis: 'cevre_yarim' }, { v: k * a * b, mis: 'cevre_alan' }], steps: [`Bahçenin çevresi: 2 × (${a} + ${b}) = ${2 * (a + b)} m`, `${k} sıra: ${k} × ${2 * (a + b)} = ${k * 2 * (a + b)} m`], ref: '1. kitap s. 142–144' });
  }];
  VAR.g_ucgen = [(lv) => {
    const a = ri(2, 8) * 10 + pick([0, 5]);
    return Q({ type: 'input', prompt: `Dik açılı bir üçgende dar açılardan biri ${a}°'dir. Diğer dar açı kaç derecedir?`, answer: String(90 - a), unit: '°', inputMis: [{ v: 180 - a, mis: 'ucgen_360' }, { v: 270 - a, mis: 'ucgen_360' }], steps: ['Dik üçgende bir açı 90°.', `Kalan iki açının toplamı: 180 − 90 = 90°`, `90 − ${a} = ${90 - a}°`], ref: '1. kitap s. 73' });
  }];
  VAR.e_oruntu = [(lv) => {
    const a = pick([0, 10, 20, 25, 50]), d = pick([5, 10, 15, 20]), n = pick([6, 8, 10, 12]);
    if (a === 0) return Q({ type: 'input', prompt: `Boş bir kumbaraya her gün ${d} TL atılıyor. ${n}. günün sonunda kumbarada kaç TL olur?`, answer: String(d * n), unit: 'TL', inputMis: [{ v: d * (n - 1), mis: 'baslangic_sira' }], steps: [`Her gün ${d} TL: ${d}, ${2 * d}, ${3 * d}, ...`, `${n}. gün: ${n} × ${d} = ${d * n} TL`], ref: '2. kitap s. 139' });
    return Q({ type: 'input', prompt: `Kumbarada başta ${a} TL vardı. Her gün ${d} TL ekleniyor. ${n}. günün sonunda kumbarada kaç TL olur?`, answer: String(a + d * n), unit: 'TL', inputMis: [{ v: d * n, mis: 'baslangic_unutma' }, { v: a + d * (n - 1), mis: 'baslangic_sira' }], steps: [`Başlangıç (0. gün): ${a} TL. ${n} gün sonra ${n} kez ekleme olur.`, `${n} günde eklenen: ${n} × ${d} = ${d * n} TL`, `Başlangıçtaki parayı unutma: ${a} + ${d * n} = ${a + d * n} TL`], ref: '2. kitap s. 139' });
  }];
  VAR.e_algoritma = [(lv) => {
    // 10.11.2026: sorular kitaptaki ayran şemasına gönderme yapıyordu ama çocuk şemayı görmüyordu; adımlar artık soruda yazıyor
    const AYRAN = 'Ayran yapma akış şeması: Başla, sonra yoğurt eklenir, sonra tuz eklenir, sonra "Tuz yeterli mi?" sorusu, cevap Evet ise bardağa doldurulur, Bitir. ';  // kelimeler soru-sesi sözlüğünde olanlardan seçildi
    const it = pick([
      [AYRAN + 'Bu akış şemasındaki "Tuz yeterli mi?" sorusu hangi tür adımdır?', 'Karar adımı (Evet/Hayır)', [['İşlem adımı', 'algoritma_sira'], ['Başlangıç adımı', 'algoritma_sira'], ['Bitiş adımı', 'algoritma_sira']], ['«Tuz yeterli mi?» adımında bir iş yapılmıyor, bir soru soruluyor.', 'Cevap Evet ya da Hayır olur ve yol buna göre ayrılır.', 'Soru sorulan ve yolu ikiye ayıran adım karar adımıdır.']],
      ['Bir algoritmanın akış şeması hangi adımla başlar?', 'Başla', [['Bitir', 'algoritma_sira'], ['Karar', 'algoritma_sira'], ['Sonucu yaz', 'algoritma_sira']], ['Her akış şemasının ilk kutusu «Başla», son kutusu «Bitir»dir.', 'İşlem ve karar adımları bu ikisinin arasında yer alır.']],
      [AYRAN + '"Tuz yeterli mi?" sorusunun cevabı "Hayır" ise ne yapılır?', 'Tuz ekleme adımına geri dönülür', [['Algoritma biter', 'karar_dongu'], ['Baştan yoğurt eklenir', 'karar_dongu'], ['Bardağa doldurulur', 'karar_dongu']], ['Cevap «Hayır» ise tuz henüz yetmiyor demektir.', 'Bu yüzden bir önceki adıma dönülür: biraz daha tuz eklenir ve soru yeniden sorulur.', 'Cevap «Evet» olunca bardağa doldurulur ve algoritma biter.']],
    ]);
    return Q({ prompt: it[0], options: mc(it[1], it[2]), steps: it[3], ref: '2. kitap s. 150–152' });
  }];
  for (const [id, list] of Object.entries(VAR)) {
    const base = GEN[id];
    GEN[id] = (lv) => (Math.random() < 0.4 ? pick(list)(lv) : base(lv));
    GEN[id].variants = list.length;
  }

  /* =========================================================
     YENİ ETKİLEŞİM TİPLERİ
     match → "Çiftleri eşleştir" (3 çift, dokun-dokun; 1 hata = "neredeyse")
     grid  → "Örüntüyü takip et" (tablo + eksik hücre; kartlardan seç)
     ========================================================= */
  const MQ = (prompt, pairs, mis, steps, ref) => Q({ type: 'match', prompt, pairs: shuffle(pairs), mis, steps, ref });
  const MATCH = {};
  const FRAC_POOL = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 10], [7, 10], [9, 100], [3, 5], [1, 10]];
  MATCH.f_ondalik = [() => { const ps = shuffle(FRAC_POOL).slice(0, 3); return MQ('Kesirleri ondalık gösterimleriyle eşleştir.', ps.map(([n, d]) => ({ a: fr(n, d), b: fmtD(n / d) })), 'ondalik_basamak', ps.map(([n, d]) => `${n}/${d} = ${fmtD(n / d)}`)); }];
  MATCH.f_yuzde = [() => { const ps = shuffle(FRAC_POOL).slice(0, 3); return MQ('Kesirleri yüzde gösterimleriyle eşleştir.', ps.map(([n, d]) => ({ a: fr(n, d), b: '%' + Math.round(n * 100 / d) })), 'yuzde_ondalik', ps.map(([n, d]) => `${n}/${d} = ${n * 100 / d}/100 = %${n * 100 / d}`)); }];
  MATCH.f_tur = [() => { const ds = shuffle([3, 4, 5, 6, 8]).slice(0, 3); const ps = ds.map(d => [ri(1, d - 1), d]); return MQ('Kesirleri modelleriyle eşleştir.', ps.map(([n, d]) => ({ a: fr(n, d), b: V.pie(n, d) })), 'kesir_model', ['Payda: bütün kaç eş parçaya bölünmüş.', 'Pay: kaç parça boyalı.']); }];
  MATCH.f_denk = [() => { const bs = shuffle([[1, 2], [1, 3], [2, 3], [3, 4], [2, 5], [1, 4]]).slice(0, 3); return MQ('Denk kesirleri eşleştir.', bs.map(([n, d]) => { const k = ri(2, 4); return { a: fr(n, d), b: fr(n * k, d * k) }; }), 'denk_toplama', ['Denk kesirde pay ve payda AYNI sayıyla çarpılır.']); }];
  MATCH.g_aci = [() => { const ts = shuffle([[pick([30, 45, 60, 75]), 'Dar açı'], [90, 'Dik açı'], [pick([110, 130, 150]), 'Geniş açı'], [180, 'Doğru açı']]).slice(0, 3); return MQ('Açı ölçülerini türleriyle eşleştir.', ts.map(([d, t]) => ({ a: d + '°', b: t })), 'aci_tur', ['< 90° dar, = 90° dik, 90°–180° arası geniş, 180° doğru açı.']); }];
  MATCH.g_cokgen = [() => { const ns = shuffle([3, 4, 5, 6, 8]).slice(0, 3); return MQ('Çokgenleri adlarıyla eşleştir.', ns.map(n => ({ a: V.polygon(n), b: CG[n] })), 'cokgen_sayi', ['Her şeklin kenarlarını say.', 'Kenar sayısı çokgenin adını verir: 3 üçgen, 4 dörtgen, 5 beşgen, 6 altıgen, 8 sekizgen.']); }];
  MATCH.n_okuma = [() => { const a = ri(1, 9), b = ri(1, 9); const ns = [a * 1e6 + b * 1e4, a * 1e6 + b * 1e5, a * 1e5 + b * 1e4]; return MQ('Sayıları okunuşlarıyla eşleştir.', ns.map(n => ({ a: fmtN(n), b: U.cap(U.words(n)) })), 'sifir_atlama', ['Sayıyı üçerli bölüklere ayır ve her bölüğü oku.']); }];
  MATCH.e_us = [() => { const xs = shuffle([[2, 2], [3, 2], [4, 2], [5, 2], [2, 3], [3, 3]]).filter((v, i, arr) => arr.findIndex(w => w[0] ** w[1] === v[0] ** v[1]) === i).slice(0, 3); return MQ('Üslü ifadeleri değerleriyle eşleştir.', xs.map(([b, e]) => ({ a: `${b}${e === 2 ? '²' : '³'}`, b: String(b ** e) })), 'us_carpim', ['a² = a × a, a³ = a × a × a']); }];
  MATCH.p_spektrum = [() => { const it = shuffle([[fr(0, 4), 'İmkânsız'], [fr(1, 4), 'Az olası'], [fr(2, 4), 'Eşit olası'], [fr(3, 4), 'Çok olası'], [fr(4, 4), 'Kesin']]).slice(0, 3); return MQ('Olasılıkları spektrumdaki yerleriyle eşleştir.', it.map(([a, b]) => ({ a, b })), 'az_cok', ['0 imkânsız, 1/2 eşit olası, 1 kesin; arası az ya da çok olası.']); }];
  const GQ = (prompt, rows, ok, wrongs, steps, mis) => Q({ type: 'mc', grid: rows, prompt, options: mc(ok, wrongs.map(w => [w, mis])), steps, cards: true });
  const GRID = {};
  GRID.e_oruntu = [(lv) => { const m = ri(2, 5), c = ri(1, 6), f = (x) => m * x + c, xs = [1, 2, 3], q = pick([5, 6, 10]); return GQ('Örüntüyü takip et: Kurala göre eksik sayı hangisi?', [...xs.map(x => [`${x}. adım`, String(f(x))]), [`${q}. adım`, '?']], String(f(q)), [String(f(q) + m), String(m * q), String(f(q - 1))], [`Her adımda ${m} artıyor; kural: adım × ${m}${c ? ' + ' + c : ''}`, `${q} × ${m}${c ? ' + ' + c : ''} = ${f(q)}`], 'oruntu_baslangic'); }];
  GRID.f_denk = [(lv) => { const k = ri(2, 4), bs = [[1, 2], [1, 3], [1, 4]], d = pick([5, 6, 8]); return GQ('Örüntüyü takip et: Eksik kesir hangisi?', [...bs.map(([n, dd]) => [fr(n, dd), fr(n * k, dd * k)]), [fr(1, d), '?']], fr(k, d * k), [fr(1 + k, d + k), fr(k, d)], [`Her satırda pay ve payda ${k} ile çarpılmış.`, `1/${d} → ${k}/${d * k}`], 'denk_toplama'); }];
  GRID.e_us = [(lv) => { const e = pick([2, 3]), bs = e === 2 ? [2, 3, 4] : [1, 2, 3], q = e === 2 ? pick([5, 6, 7]) : 4; return GQ('Örüntüyü takip et: Eksik değer hangisi?', [...bs.map(b => [`${b}${e === 2 ? '²' : '³'}`, String(b ** e)]), [`${q}${e === 2 ? '²' : '³'}`, '?']], String(q ** e), [String(q * e), String(e === 2 ? q + 2 : q * q)], [`${q}${e === 2 ? '²' : '³'} = ${Array(e).fill(q).join(' × ')} = ${q ** e}`], 'us_carpim'); }];
  /* ---------- Parmakla kesir: böl, boya, sayı doğrusunda göster (type 'kes') ----------
     model: 'pie' | 'bar' | 'line'. Öğrencinin cevabı {parca, boyali} ya da {konum}; denetim KES_CHECK ile kodla yapılır. */
  const KQ = (o) => Q(Object.assign({ type: 'kes' }, o));
  const KES = {};
  KES.f_tur = [(lv) => {
    if (lv === 1) { const d = ri(3, 8), n = ri(1, d - 1), model = pick(['pie', 'bar']);
      return KQ({ model, prompt: `Şeklin ${fr(n, d)} kadarını boya. Parçalara dokun!`, hedef: [n, d], parca: d, cevap: fr(n, d), steps: [`Payda ${d}: şekil ${d} eş parçaya bölünmüş.`, `Pay ${n}: ${n} parçayı boya.`], hint: 'Pay kaç parça boyanacağını söyler.' }); }
    if (lv === 2) { const d = ri(3, 8), n = ri(1, d - 1);
      return KQ({ model: 'line', prompt: `${fr(n, d)} kesrini sayı doğrusunda göster. Doğru çizgiye dokun!`, hedef: [n, d], parca: d, ust: 1, cevap: fr(n, d), steps: [`0 ile 1 arası ${d} eş aralığa bölünmüş.`, `0'dan başla, ${n} aralık atla.`], hint: 'Çizgileri değil, aralıkları say.' }); }
    const d = ri(2, 6), n = d + ri(1, d - 1);
    return KQ({ model: 'line', prompt: `${fr(n, d)} kesrini sayı doğrusunda göster.`, hedef: [n, d], parca: d, ust: 2, cevap: `${fr(n, d)} = ${mixed(1, n - d, d)}`, steps: [`Her birlik ${d} eş aralığa bölünmüş.`, `${n} aralık atla: 1'i geçip ${n - d} aralık daha.`], hint: `${d} aralık = 1 bütün.` });
  }];
  KES.f_denk = [(lv) => {
    const [n, d] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5]]);
    if (lv === 3) { return KQ({ model: pick(['pie', 'bar']), prompt: `Önce dilim sayısını seç, sonra ${fr(n, d)} kadarını boya. Denk bir kesir de olur!`, hedef: [n, d], parca: null, denk: true, cevap: `${fr(n, d)} ya da ona denk bir kesir`, steps: [`${d} parçaya böl, ${n} tanesini boya.`, `Ya da ${d * 2} parçaya böl, ${n * 2} tanesini boya: ${fr(n * 2, d * 2)} = ${fr(n, d)}`], hint: 'Pay ve paydayı aynı sayıyla çarparsan denk kesir bulursun.' }); }
    const k = lv === 1 ? 2 : pick([3, 4]), P = d * k; if (P > 12) return KES.f_denk[0](1);
    return KQ({ model: 'bar', prompt: `Bu şerit ${P} eş parçaya bölünmüş. Şeridin ${fr(n, d)} kadarını boya.`, hedef: [n, d], parca: P, denk: true, cevap: `${fr(n * k, P)} (= ${fr(n, d)})`, steps: [`${fr(n, d)} kesrini paydası ${P} olacak şekilde genişlet: pay ve paydayı ${k} ile çarp.`, `${fr(n, d)} = ${fr(n * k, P)} → ${n * k} parça boya.`], hint: `Her ${d} parçalık grupta değil; ${P} parçanın ${n * k} tanesi.` });
  }];
  KES.f_ondalik = [(lv) => { const n = ri(1, 9); return KQ({ model: 'bar', prompt: `Şerit 10 eş parçaya bölünmüş. Şeridin ${fmtD(n / 10)} kadarını boya.`, hedef: [n, 10], parca: 10, cevap: `${fmtD(n / 10)} = ${fr(n, 10)}`, steps: [`${fmtD(n / 10)} = ${fr(n, 10)} (onda ${n})`, `10 parçanın ${n} tanesini boya.`], hint: '0,1 bir parça demektir.' }); }];
  const KES_CHECK = (q, a) => {
    const [n, d] = q.hedef;
    if (q.model === 'line') { const k = a.konum; if (k === n) return { ok: true, mis: null }; return { ok: false, mis: Math.abs(k - n) === 1 ? 'cizgi_sayma' : (k === d - n ? 'bos_kisim' : 'kesir_model') }; }
    const p = a.parca, b = a.boyali;
    const ok = q.denk ? b * d === n * p : (p === d && b === n);
    if (ok) return { ok: true, mis: null };
    if (b * d === (d - n) * p) return { ok: false, mis: 'bos_kisim' };
    if (b * n === d * p || (p === n && b > 0)) return { ok: false, mis: 'pay_payda_ters' };
    return { ok: false, mis: 'kesir_model' };
  };
  /* ---------- Açıölçerle açı çiz (type 'olc') ve sütun grafiği çiz (type 'graf'), 25.10.2026 ----------
     Çocuk şıktan seçmez, parmağıyla kurar; cevap kodla değerlendirilir, her yanlış durum bir yanılgıya bağlıdır. */
  const OLC_CHECK = (q, a) => { const x = a.aci, d = q.hedef; if (x === d) return { ok: true, mis: null };
    if (x === 180 - d) return { ok: false, mis: 'iletki_ters' }; if (ACI_TUR(x) !== ACI_TUR(d)) return { ok: false, mis: 'aci_tur' }; return { ok: false, mis: 'aci_olcme' }; };
  const OLC = {};
  OLC.g_aci = [(lv) => {
    const taban = pick(['sag', 'sol']), sira = taban === 'sag' ? 'sağdaki 0\'dan başlayan (iç) sıra' : 'soldaki 0\'dan başlayan (dış) sıra';
    if (lv === 2 && Math.random() < 0.5) { let d; do { d = ri(2, 16) * 10; } while (d === 90);
      return Q({ type: 'input', prompt: 'Açıölçer açının üzerine yerleştirildi. Açının ölçüsü kaç derecedir?', visual: V.olcer({ taban, aci: d, aria: 'açıölçerin üzerinde bir açı' }), answer: String(d), unit: '°', inputMis: [{ v: 180 - d, mis: 'iletki_ters' }],
        hint: 'Sabit kol hangi taraftaki 0\'ın üstünde? O 0\'dan başlayan sayıları oku.', steps: [`Sabit kol ${taban === 'sag' ? 'sağa' : 'sola'} bakıyor: ${sira} okunur.`, `Diğer kol ${d} çizgisinden geçiyor: ${d}°.`, d < 90 ? 'Kontrol: açı dar görünüyor, ölçüsü 90°\'den küçük olmalı ✓' : 'Kontrol: açı geniş görünüyor, ölçüsü 90°\'den büyük olmalı ✓'] }); }
    let d; do { d = ri(lv === 3 ? 3 : 2, lv === 3 ? 33 : 16) * (lv === 3 ? 5 : 10); } while (d === 90 || d === 180);
    return Q({ type: 'olc', prompt: `Açıölçeri kullanarak ölçüsü ${d}° olan bir açı çiz. Turuncu noktayı sürükle!`, hedef: d, taban, cevap: `${d}°`,
      hint: 'Sabit kol hangi taraftaki 0\'ın üstünde? O 0\'dan başlayan sayıları say.', steps: [`Sabit kol ${taban === 'sag' ? 'sağa' : 'sola'} bakıyor: ${sira} kullanılır.`, `0'dan başlayıp ${d} çizgisine kadar say ve kolu oraya çevir.`, d < 90 ? 'Kontrol: dar bir açı çıkmalı.' : 'Kontrol: geniş bir açı çıkmalı.'] });
  }];
  const GRAF_CHECK = (q, a) => { const h = a.h || [], w = q.degerler.map(v => v / q.adim);
    if (h.length === w.length && h.every((x, i) => x === w[i])) return { ok: true, mis: null };
    const yanlis = h.map((x, i) => x !== w[i] ? i : -1).filter(i => i >= 0);
    if ([...h].sort((x, y) => x - y).join() === [...w].sort((x, y) => x - y).join()) return { ok: false, mis: 'grafik_okuma', yanlis };
    return { ok: false, mis: 'grafik_cizim', yanlis }; };
  const GRAF = {};
  GRAF.s_tablo_sutun = [(lv) => {
    const adim = lv === 1 ? 1 : lv === 2 ? 2 : pick([5, 10]), ust = lv === 1 ? 7 : 6, ci = ri(0, CATS.length - 1), kat = shuffle(CATS[ci]).slice(0, 4);
    let k; do { k = kat.map(() => ri(1, ust)); } while (new Set(k).size < 3);
    const degerler = k.map(x => x * adim), konu = ['En sevilen meyve', 'En sevilen spor', 'En sevilen hayvan', 'En sevilen kitap türü'][ci];
    return Q({ type: 'graf', prompt: `Sıklık tablosundaki verilere göre sütun grafiğini çiz. Her sütunun tepesine dokun!`, kategoriler: kat, degerler, adim, ust, baslik: konu,
      grid: kat.map((c, i) => [c, String(degerler[i])]), cevap: kat.map((c, i) => `${c}: ${degerler[i]}`).join(' · '),
      hint: adim > 1 ? `Eksendeki sayılar ${adim}'${adim === 10 ? 'ar' : adim === 5 ? 'er' : 'şer'} artıyor. Çizgileri değil, yazan sayıyı oku.` : 'Her sütun, tablodaki sayının yazdığı çizgiye kadar çıkmalı.',
      steps: [`Dikey eksen 0'dan başlıyor, ${adim}'${adim === 10 ? 'ar' : adim === 5 ? 'er' : adim === 2 ? 'şer' : 'er'} artıyor.`, ...kat.map((c, i) => `${c}: ${degerler[i]} → ${degerler[i]} yazan çizgiye kadar.`).slice(0, 2), 'Diğer sütunları da aynı yolla çiz.'] });
  }];
  for (const [id, list] of Object.entries(OLC)) { const base = GEN[id]; GEN[id] = (lv) => (lv >= 2 && Math.random() < 0.3 ? pick(list)(lv) : base(lv)); }
  for (const [id, list] of Object.entries(GRAF)) { const base = GEN[id]; GEN[id] = (lv) => (Math.random() < 0.25 ? pick(list)(lv) : base(lv)); }
  for (const [id, list] of Object.entries(KES)) { const base = GEN[id]; GEN[id] = (lv) => (Math.random() < 0.25 ? pick(list)(lv) : base(lv)); }
  for (const [id, list] of Object.entries(MATCH)) { const base = GEN[id]; GEN[id] = (lv) => (Math.random() < 0.22 ? pick(list)(lv) : base(lv)); }
  /* =========================================================
     KİTAPLA EŞLEŞTİRME EKLERİ (20.10.2026): kitapta işlenip uygulamada eksik kalan
     kavramlar için özgün sorular. Metin ve sayılar bizimdir; kitaptan kopya değildir.
     ========================================================= */
  const EK = {}, ekle = (id, lvs, p, fn) => { const e = EK[id] = EK[id] || { p, L: {} }; for (const lv of lvs) (e.L[lv] = e.L[lv] || []).push(fn); };
  const HARF3 = () => pick([['A', 'B', 'C'], ['K', 'L', 'M'], ['D', 'E', 'F'], ['P', 'R', 'S'], ['X', 'Y', 'Z']]);
  // TEMA 1
  ekle('g_temel', [2, 3], 0.3, () => { const [a, b, c] = HARF3();
    return Q({ prompt: `Köşesi ${b} olan ve kolları ${b}${a} ile ${b}${c} ışınları olan açı nasıl adlandırılır?`, visual: V.aciAdli(a, b, c), options: mc(`${a}${b}${c} açısı`, [[`${b}${a}${c} açısı`, 'aci_isim'], [`${a}${c}${b} açısı`, 'aci_isim'], [`${a} açısı`, 'aci_isim']]),
      steps: ['Açının köşesi ortaya yazılır.', `${a}${b}${c} açısı, ${c}${b}${a} açısı ya da kısaca ${b} açısı denir.`] }); });
  ekle('g_temel', [3], 0.35, () => { const it = pick([
      ['İki farklı noktadan kaç farklı doğru geçer?', 'Yalnız 1 doğru', [['2 doğru', 'nokta_dogru'], ['Sonsuz sayıda doğru', 'nokta_dogru'], ['Hiç doğru geçmez', 'nokta_dogru']], 'İki noktadan yalnız bir doğru geçer.'],
      ['Bir noktadan kaç farklı doğru geçer?', 'Sonsuz sayıda doğru', [['Yalnız 1 doğru', 'nokta_dogru'], ['2 doğru', 'nokta_dogru'], ['4 doğru', 'nokta_dogru']], 'Bir noktadan sonsuz sayıda doğru geçer; doğru her yöne çevrilebilir.']]);
    return Q({ prompt: it[0], options: mc(it[1], it[2]), steps: [it[3]] }); });
  ekle('g_cember', [2, 3], 0.35, () => { const k = ri(2, 9), cap = Math.random() < 0.5;
    return Q({ type: 'input', prompt: `Pergelin sivri ucu ile kalem ucu arasındaki açıklık ${k} cm. Bu açıklıkla bir çember çiziliyor. Çemberin ${cap ? 'çapı' : 'yarıçapı'} kaç cm'dir?`, answer: String(cap ? 2 * k : k), unit: 'cm', inputMis: cap ? [{ v: k, mis: 'cap_yaricap' }] : [{ v: 2 * k, mis: 'cap_yaricap' }].concat(k % 2 ? [] : [{ v: k / 2, mis: 'cap_yaricap' }]),
      hint: 'Pergelin sivri ucu çemberin merkezinde durur, kalem ucu çemberin üzerinde döner. Merkez ile çember arasındaki uzaklığa ne denir?',
      steps: ['Pergelin iki ucu arasındaki açıklık, çemberin yarıçapına eşittir.', cap ? `Çap = 2 × ${k} = ${2 * k} cm` : `Yarıçap = ${k} cm`] }); });
  ekle('g_cember', [1, 2], 0.25, () => { const D = ['bozuk para', 'yuvarlak masanın üst yüzü', 'pizza'], C = ['hulahop', 'yüzük', 'bilezik'], soruDaire = Math.random() < 0.5, [dg, yn] = soruDaire ? [D, C] : [C, D];
    return Q({ prompt: `Hangisi bir ${soruDaire ? 'daire' : 'çember'} modelidir?`, options: mc(pick(dg), shuffle(yn).slice(0, 2).map(x => [x, 'cember_parca'])), steps: ['Çember yalnız kenardaki eğri çizgidir (hulahop, yüzük).', 'Daire çember ile iç bölgesidir (bozuk para, pizza).'] }); });
  ekle('g_dikme_paralel', [2, 3], 0.35, () => { const it = pick([
      ['Bir doğruya, dışındaki bir noktadan kaç dikme çizilebilir?', 'Yalnız 1 dikme', [['2 dikme', 'dik_yatay'], ['Sonsuz sayıda dikme', 'dik_yatay']], 'Bir doğruya dışındaki bir noktadan yalnız bir dikme çizilebilir.'],
      ['Bir noktadan bir doğruya çizilen EN KISA doğru parçası hangisidir?', 'Doğruya dik çizilen doğru parçası (dikme)', [['Doğruya paralel çizilen doğru parçası', 'paralel_kesisen'], ['Doğruyla dar açı yapan doğru parçası', 'dik_yatay']], 'En kısa yol dikmedir; gönye ile çizilir.'],
      ['Bütün noktaları ortak olan iki doğruya ne denir?', 'Çakışık doğrular', [['Paralel doğrular', 'paralel_kesisen'], ['Kesişen doğrular', 'paralel_kesisen'], ['Dik doğrular', 'dik_yatay']], 'Tüm noktaları ortak olan doğrular çakışıktır; paralel doğruların hiç ortak noktası yoktur.']]);
    return Q({ prompt: it[0], options: mc(it[1], it[2]), steps: [it[3]] }); });
  ekle('g_aci_iliski', [3], 0.35, () => { const a = pick([35, 40, 50, 55, 65, 70]), sorGenis = Math.random() < 0.5;
    return Q({ type: 'input', prompt: `İki paralel doğruyu bir doğru kesiyor. Oluşan dar açılardan biri ${a}°. ${sorGenis ? 'Oluşan geniş açılardan biri' : 'Oluşan başka bir dar açı'} kaç derecedir?`, visual: V.paralelKesen(a, sorGenis), answer: String(sorGenis ? 180 - a : a), unit: '°',
      inputMis: [{ v: sorGenis ? a : 180 - a, mis: 'paralel_kesen' }, { v: 90 - a, mis: 'tumler_butunler' }], steps: ['Paralel doğruları kesen doğruyla oluşan dar açıların hepsi eştir, geniş açıların hepsi eştir.', sorGenis ? `Geniş açı = 180 − ${a} = ${180 - a}°` : `Dar açılar eş: ${a}°`] }); });
  ekle('g_cokgen', [2, 3], 0.35, () => { const ic = pick([60, 72, 100, 108, 110, 120, 135, 140]);  // 90°: iç açı = dış açı
    return Q({ type: 'input', prompt: `Bir çokgenin bir köşesindeki iç açı ${ic}°. Bu köşedeki dış açı kaç derecedir?`, answer: String(180 - ic), unit: '°', inputMis: [{ v: ic, mis: 'dis_aci' }, { v: 360 - ic, mis: 'dis_aci' }],
      steps: ['Dış açı, iç açının komşu bütünleridir.', `180 − ${ic} = ${180 - ic}°`] }); });
  ekle('g_cokgen', [1, 2], 0.25, () => { const n = pick([4, 5, 6]), H = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, n), k = ri(1, n - 1), dogru = H.slice(k).concat(H.slice(0, k)).join(''), ters = [H[0], ...H.slice(1).reverse()].join('');
    return Q({ prompt: `Şekildeki gibi köşeleri sırasıyla ${H.join(', ')} olan ${CG[n].toLocaleLowerCase('tr-TR')} nasıl adlandırılabilir?`, visual: V.cokgenAdli(H), hint: 'Parmağınla şeklin kenarları boyunca dolaş. Hangi harfler yan yana geliyor? Bir köşeden diğerine atlamak yok.', options: mc(`${dogru} ${CG[n].toLocaleLowerCase('tr-TR')}i`, (() => { const gecerli = new Set(); for (let i = 0; i < n; i++) { const r = H.slice(i).concat(H.slice(0, i)); gecerli.add(r.join('')); gecerli.add([...r].reverse().join('')); }
        const y = new Set(); let g = 0; while (y.size < 3 && g++ < 200) { const p = shuffle(H).join(''); if (!gecerli.has(p)) y.add(p); } return [...y].map(x => [`${x} ${CG[n].toLocaleLowerCase('tr-TR')}i`, 'cokgen_isim']); })()),
      steps: ['Herhangi bir köşeden başla, köşeleri yan yana sırayla oku.', `Örneğin ${H.join('')}, ${dogru} ya da ${ters} ${CG[n].toLocaleLowerCase('tr-TR')}i.`] }); });
  ekle('g_cokgen', [3], 0.25, () => Q({ prompt: 'Hangi çokgenin hiç köşegeni yoktur?', options: mc('Üçgen', [['Dörtgen', 'kosegen_kenar'], ['Beşgen', 'kosegen_kenar'], ['Altıgen', 'kosegen_kenar']]), steps: ['Üçgende her köşe diğer iki köşeyle yan yanadır.', 'Yan yana olmayan köşe yok, bu yüzden köşegen de yok.'] }));
  ekle('g_ucgen', [1, 2], 0.3, () => { const t = pick(['eskenar', 'ikiz', 'cesit']); let K;
    if (t === 'eskenar') { const a = ri(3, 9); K = [a, a, a]; } else if (t === 'ikiz') { const a = ri(4, 9); let b; do { b = ri(2, 2 * a - 1); } while (b === a); K = shuffle([a, a, b]); } else { const a = ri(4, 7), b = a + ri(1, 2), c = b + ri(1, 2); K = shuffle([a, b, c]); }
    const ad = { eskenar: 'Eşkenar üçgen', ikiz: 'İkizkenar üçgen', cesit: 'Çeşitkenar üçgen' };
    return Q({ prompt: `Kenar uzunlukları ${K[0]} cm, ${K[1]} cm ve ${K[2]} cm olan üçgen kenarlarına göre hangisidir?`, options: mc(ad[t], Object.keys(ad).filter(k => k !== t).map(k => [ad[k], 'ucgen_sinif'])),
      steps: ['Üç kenar eşitse eşkenar, yalnız iki kenar eşitse ikizkenar, hepsi farklıysa çeşitkenar üçgendir.', t === 'eskenar' ? `${K[0]}, ${K[1]}, ${K[2]}: üç kenar da eşit → eşkenar üçgen.` : t === 'ikiz' ? `${K[0]}, ${K[1]}, ${K[2]}: yalnız iki kenar eşit → ikizkenar üçgen.` : `${K[0]}, ${K[1]}, ${K[2]}: üç kenar da farklı → çeşitkenar üçgen.`] }); });
  ekle('g_ucgen', [3], 0.35, () => { const it = pick([['iki geniş açısı', false, 'İki geniş açının toplamı 180°\'den büyük olur; üçüncü açıya yer kalmaz. Olamaz.'], ['iki dik açısı', false, 'İki dik açı 90° + 90° = 180° eder; üçüncü açıya hiç yer kalmaz. Olamaz.'], ['bir geniş açısı', true, 'Örnek: 100°, 50°, 30°. Toplam 180°. Olabilir (geniş açılı üçgen).'], ['bir dik açısı ve iki dar açısı', true, 'Örnek: 90°, 60°, 30°. Toplam 180°. Olabilir (dik açılı üçgen).']]);
    return tfQ({ prompt: `Bir üçgenin ${it[0]} olabilir.`, steps: ['Üçgenin iç açılarının toplamı 180°.', it[2]] }, it[1], 'ucgen_aci_siniri'); });
  ekle('g_ucgen', [3], 0.3, () => { let r1, r2, d; do { r1 = ri(2, 5); r2 = pick([r1, r1, ri(2, 5)]); d = pick([r1, r2, ri(2, 6)]); } while (!(d < r1 + r2 && d > Math.abs(r1 - r2)));
    const K = [r1, r2, d], es = new Set(K).size, t = es === 1 ? 'Eşkenar üçgen' : es === 2 ? 'İkizkenar üçgen' : 'Çeşitkenar üçgen';
    return Q({ prompt: `A merkezli çemberin yarıçapı ${r1} cm, B merkezli çemberin yarıçapı ${r2} cm ve |AB| = ${d} cm. Bu iki çember iki noktada kesişiyor. A, B ve kesişim noktalarından biri birleştirilince kenarlarına göre hangi üçgen oluşur?`, visual: V.cemberInsa(r1, r2, d),
      options: mc(t, ['Eşkenar üçgen', 'İkizkenar üçgen', 'Çeşitkenar üçgen'].filter(x => x !== t).map(x => [x, 'cember_insa'])),
      steps: [`Kenarlar: iki yarıçap (${r1} cm ve ${r2} cm) ve merkezler arası uzaklık (${d} cm).`, es === 1 ? 'Üçü eşit → eşkenar.' : es === 2 ? 'İkisi eşit → ikizkenar.' : 'Hepsi farklı → çeşitkenar.'] }); });
  // TEMA 2
  ekle('n_basamak', [2, 3], 0.3, () => { const pos = [1e6, ...shuffle([1e5, 1e4, 1e3, 100, 10, 1]).slice(0, ri(2, 3))], x = pos.reduce((t, b) => t + ri(1, 9) * b, 0);
    const par = []; let k = x, bv = 1; while (k > 0) { const r = k % 10; if (r) par.unshift([r, bv]); k = Math.floor(k / 10); bv *= 10; }
    const yaz = par.map(([r, b]) => `(${r} × ${fmtN(b)})`).join(' + ');
    const bitisik = Number(par.map(([r]) => r).join('')), kay = par.reduce((a, [r, b]) => a + r * b * 10, 0);
    return Q({ prompt: `${yaz} biçiminde çözümlenen sayı hangisidir?`, options: mc(fmtN(x), [[fmtN(bitisik), 'cozumleme_bitisik'], [fmtN(kay), 'basamak_kayma']]),
      steps: ['Her çarpımı hesapla: rakam × basamak değeri.', `${par.map(([r, b]) => fmtN(r * b)).join(' + ')} = ${fmtN(x)}`] }); });
  ekle('n_karsilastir', [2, 3], 0.35, () => { const bas = ri(1, 9) * 1e6 + ri(0, 9) * 1e5; const sayi = shuffle([bas + ri(10, 99) * 1000 + ri(100, 999), bas + ri(100, 999) * 1000 - ri(1, 9) * 1e5 * 0 + ri(0, 9), bas - ri(1, 9) * 1e4]).filter((v, i, a) => a.indexOf(v) === i);
    if (sayi.length < 3) return kartQ();
    const dogru = [...sayi].sort((a, b) => a - b), ters = [...dogru].reverse(), yaz = (L) => L.map(fmtN).join(' < '), rakam = [...sayi].sort((a, b) => String(a).localeCompare(String(b)) || 0);
    const wr = [[yaz(ters), 'basamak_karsilastir'], [yaz([dogru[1], dogru[0], dogru[2]]), 'basamak_karsilastir'], [yaz([dogru[0], dogru[2], dogru[1]]), 'basamak_karsilastir']].filter(w => w[0] !== yaz(dogru));
    return Q({ prompt: `${sayi.map(fmtN).join(', ')} sayılarının küçükten büyüğe sıralanışı hangisidir?`, options: mc(yaz(dogru), wr), steps: ['Basamak sayıları aynı: soldan ilk farklı basamağa bak.', yaz(dogru)] }); });
  const kartQ = () => { const k = shuffle([ri(100, 999), ri(100, 999), pick([ri(10, 99), ri(1, 9)])].filter((v, i, a) => a.indexOf(v) === i)).map(v => String(v).padStart(3, '0'));
    if (k.length < 3) return kartQ();
    const desc = [...k].sort((a, b) => b.localeCompare(a)), dogru = desc.join(''), asc = [...desc].reverse().join('');
    const per = [[desc[1], desc[0], desc[2]], [desc[0], desc[2], desc[1]], [desc[2], desc[0], desc[1]]].map(L => L.join(''));
    const wr = shuffle([asc, ...per]).filter((v, i, a) => v !== dogru && a.indexOf(v) === i).slice(0, 3).map(v => [fmtN(Number(v)), 'ilk_rakam']);
    return Q({ prompt: `Üzerinde ${k.join(', ')} yazan üç kart birer kez yan yana dizilerek 9 basamaklı en büyük sayı yazılıyor. Bu sayı hangisidir?`, options: mc(fmtN(Number(dogru)), wr),
      steps: ['Kartları, soldan ilk rakamı büyük olan önce gelecek şekilde diz.', 'Kart değil, kartın soldaki rakamları karşılaştırılır (058 kartı 0 ile başlar).', fmtN(Number(dogru))] }); };
  ekle('n_karsilastir', [3], 0.2, () => kartQ());
  ekle('n_carpbol', [2, 3], 0.35, () => { const tip = ri(0, 2), b = pick([20, 30, 40, 50, 60, 200, 300, 400, 500]), c = pick([4, 5, 6, 7, 8, 9, 12, 15, 30, 40, 70]);
    if (tip === 0) return Q({ type: 'input', prompt: `${fmtN(b * c)} ÷ ....... = ${c}`, answer: String(b), inputMis: [{ v: b * c * c, mis: 'ters_islem' }], steps: ['Bölen = bölünen ÷ bölüm', `${fmtN(b * c)} ÷ ${c} = ${fmtN(b)}`] });
    if (tip === 1) return Q({ type: 'input', prompt: `....... ÷ ${b} = ${c}`, answer: String(b * c), inputMis: [{ v: c, mis: 'ters_islem' }].filter(m => m.v !== b * c), steps: ['Bölünen = bölen × bölüm', `${b} × ${c} = ${fmtN(b * c)}`] });
    return Q({ type: 'input', prompt: `....... × ${c} = ${fmtN(b * c)}`, answer: String(b), inputMis: [{ v: b * c * c, mis: 'ters_islem' }], steps: ['Bilinmeyen çarpan = çarpım ÷ bilinen çarpan', `${fmtN(b * c)} ÷ ${c} = ${fmtN(b)}`] }); });
  ekle('n_problem', [2, 3], 0.35, () => { const tip = ri(0, 1);
    if (tip === 0) { const kap = pick([8, 9, 11, 12, 14]), n = kap * ri(15, 30) + ri(1, kap - 1), ans = Math.ceil(n / kap), [ne, ara] = pick([['öğrenci', 'teleferik'], ['kişi', 'asansör'], ['öğrenci', 'tekne']]);
      return Q({ type: 'input', prompt: `${n} ${ne} bir ${ara} ile karşıya geçecek. ${ara[0].toLocaleUpperCase('tr-TR') + ara.slice(1)} bir seferde en fazla ${kap} ${ne} taşıyor. Herkesin geçmesi için en az kaç sefer gerekir?`, answer: String(ans), inputMis: [{ v: ans - 1, mis: 'kalan_yok', ac: `${n} ÷ ${kap} işleminde ${n - kap * (ans - 1)} ${ne} artıyor. Onlar için bir sefer daha gerekir.` }],
        steps: [`${n} ÷ ${kap} = ${ans - 1}, kalan ${n - kap * (ans - 1)}`, `Artan ${ne} için bir sefer daha: ${ans - 1} + 1 = ${ans}`] }); }
    const ay = pick([600, 700, 800, 900, 1000]), ad = ri(6, 12), borc = ay * ad + ri(1, 9) * 50, ans = Math.ceil(borc / ay);
    return Q({ type: 'input', prompt: `Bir televizyonun fiyatı ${fmtN(borc)} TL. Her ay en fazla ${fmtN(ay)} TL ödenecek. Borç en az kaç ayda biter?`, answer: String(ans), unit: 'ay', inputMis: [{ v: ans - 1, mis: 'kalan_yok', ac: `${ans - 1} ayda ${fmtN(ay * (ans - 1))} TL ödenir; ${fmtN(borc - ay * (ans - 1))} TL borç kalır. Onun için bir ay daha gerekir.` }],
      steps: [`${fmtN(borc)} ÷ ${fmtN(ay)} = ${ans - 1}, kalan ${fmtN(borc - ay * (ans - 1))}`, `Kalan borç için bir ay daha: ${ans} ay`] }); });
  ekle('n_problem', [3], 0.25, () => { const bas = pick([14, 15, 16, 17, 18, 19]), d = shuffle([30, 35, 40, 45, 50]).slice(0, 3), mola = pick([5, 10, 15]), top = d[0] + d[1] + d[2] + 2 * mola, bit = bas * 60 + top, s2 = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}.${String(m % 60).padStart(2, '0')}`;
    const molasiz = bas * 60 + d[0] + d[1] + d[2];
    return Q({ prompt: `Ela saat ${s2(bas * 60)}'de ders çalışmaya başladı. Sırayla ${d[0]}, ${d[1]} ve ${d[2]} dakika üç ders çalıştı. Her iki ders arasında ${mola} dakika mola verdi. Ela saat kaçta bitirdi?`,
      options: mc(s2(bit), [[s2(molasiz), 'problem_adim'], [s2(bas * 60 + d[0] + d[1] + d[2] + 3 * mola), 'problem_adim'], [`${Math.floor(bas + top / 100)}.${String(Math.round(top % 100)).padStart(2, '0')}`, 'saat_ondalik']].filter(w => w[0] !== s2(bit))),
      steps: [`Ders: ${d[0]} + ${d[1]} + ${d[2]} = ${d[0] + d[1] + d[2]} dakika`, `Mola: 3 ders arasında 2 mola → 2 × ${mola} = ${2 * mola} dakika`, `Toplam ${top} dakika = ${Math.floor(top / 60)} saat ${top % 60} dakika → ${s2(bit)}`] }); });
  // TEMA 3
  ekle('a_cevre', [2, 3], 0.3, () => { const P = pick([10, 12, 14, 16, 18, 20]), h = P / 2, L = []; for (let a = 1; a <= h / 2; a++) L.push(`${a} cm ve ${h - a} cm`);
    return Q({ type: 'input', prompt: `Kenar uzunlukları santimetre cinsinden doğal sayı olan ve çevre uzunluğu ${P} cm olan kaç farklı dikdörtgen çizilebilir? (Kare de özel bir dikdörtgendir.)`, answer: String(L.length), inputMis: [{ v: h - 1, mis: 'cift_sayma' }, { v: L.length - 1, mis: 'cift_sayma' }].filter(m => m.v !== L.length && m.v > 0),
      steps: [`İki ardışık kenarın toplamı ${P} ÷ 2 = ${h} cm.`, `Olanlar: ${L.join('; ')}.`, `${L.length} farklı dikdörtgen (${h - 1} ve 1 ile 1 ve ${h - 1} aynı dikdörtgendir).`] }); });
  ekle('a_cevre', [3], 0.25, () => { const P = pick([13, 15, 17, 19, 21, 25]);
    return tfQ({ prompt: `Kenar uzunlukları santimetre cinsinden doğal sayı olan ve çevre uzunluğu ${P} cm olan bir dikdörtgen çizilebilir.`, steps: ['Çevre = 2 × (iki ardışık kenarın toplamı) olduğu için çevre her zaman çift sayıdır.', `${P} tek sayı; kenarları doğal sayı olan böyle bir dikdörtgen çizilemez.`] }, false, 'cevre_yarim'); });
  ekle('a_alan', [2, 3], 0.3, () => { const A = pick([12, 16, 18, 20, 24, 30, 36]), L = []; for (let a = 1; a * a <= A; a++) if (A % a === 0) L.push([a, A / a]);
    if (Math.random() < 0.5) return Q({ type: 'input', prompt: `Alanı ${A} m² olan ve kenar uzunlukları metre cinsinden doğal sayı olan kaç farklı dikdörtgen vardır? (Kare de özel bir dikdörtgendir.)`, answer: String(L.length), inputMis: [{ v: 2 * L.length - (L.some(([a, b]) => a === b) ? 1 : 0), mis: 'cift_sayma' }].filter(m => m.v !== L.length),
      steps: [`Çarpımı ${A} olan kenar çiftleri: ${L.map(([a, b]) => a + ' ve ' + b).join('; ')}.`, `${L.length} farklı dikdörtgen.`] });
    const en = L.reduce((m, x) => (x[0] + x[1] < m[0] + m[1] ? x : m)), boy = L[0];
    return Q({ type: 'input', prompt: `Alanı ${A} m² olan, kenar uzunlukları metre cinsinden doğal sayı olan dikdörtgen biçimli bir pistin etrafına çit çekilecek. Çitin EN KISA olması için pistin çevresi kaç metre olmalıdır?`, answer: String(2 * (en[0] + en[1])), unit: 'm', inputMis: [{ v: 2 * (boy[0] + boy[1]), mis: 'cevre_alan_ayni' }, { v: A, mis: 'cevre_alan' }].filter(m => m.v !== 2 * (en[0] + en[1])),
      steps: [`Alanı ${A} m² olan dikdörtgenler: ${L.map(([a, b]) => `${a} × ${b} (çevre ${2 * (a + b)} m)`).join('; ')}.`, `En kısa çevre: ${2 * (en[0] + en[1])} m. Kenarlar birbirine yaklaştıkça çevre kısalır.`] }); });
  ekle('a_cevre_alan', [1, 2], 0.25, () => { const [a, b] = dikKenar(), [H1, H2, H3, H4] = pick([['A', 'B', 'C', 'D'], ['K', 'L', 'M', 'N'], ['P', 'R', 'S', 'T']]), ad = H1 + H2 + H3 + H4, sorA = Math.random() < 0.5;
    return Q({ prompt: `Kenar uzunlukları ${a} cm ve ${b} cm olan ${ad} dikdörtgeni için ${sorA ? `A(${ad})` : `Ç(${ad})`} kaçtır?`, options: mc(sorA ? `${a * b} cm²` : `${2 * (a + b)} cm`, sorA ? [[`${2 * (a + b)} cm`, 'cevre_alan'], [`${a * b} cm`, 'birim'], [`${a + b} cm²`, 'cevre_alan']] : [[`${a * b} cm²`, 'cevre_alan'], [`${a + b} cm`, 'cevre_yarim'], [`${2 * (a + b)} cm²`, 'birim']]),
      steps: ['Ç(…) çevre uzunluğunu, A(…) alanı gösterir.', sorA ? `A(${ad}) = ${a} × ${b} = ${a * b} cm²` : `Ç(${ad}) = 2 × (${a} + ${b}) = ${2 * (a + b)} cm`] }); });
  // TEMA 4
  ekle('f_ondalik', [1, 2], 0.25, () => { const t = ri(1, 99); let o; do { o = pick([ri(1, 9), ri(10, 99)]); } while (o === t || o % 10 === 0); const g = `${t},${String(o).padStart(o < 10 ? 1 : 2, '0')}`, sorTam = Math.random() < 0.5;
    return Q({ prompt: `${g} ondalık gösteriminde ${sorTam ? 'tam kısım' : 'ondalık kısım'} hangisidir?`, options: mc(String(sorTam ? t : o), [[String(sorTam ? o : t), 'ondalik_parca'], [String(t) + String(o), 'ondalik_parca']]),
      steps: ['Virgülün solu tam kısım, sağı ondalık kısımdır.', `${g}: tam kısım ${t}, ondalık kısım ${o}.`] }); });
  ekle('f_yuzde', [2, 3], 0.3, () => { const p = pick([110, 120, 130, 150, 170, 250, 270]), od = String(p / 100).replace('.', ',');
    return Q({ prompt: `%${p} ifadesinin ondalık gösterimi hangisidir?`, options: mc(od, [[String(p / 1000).replace('.', ','), 'yuzde_ondalik'], [String(p / 10).replace('.', ','), 'yuzde_ondalik'], [String(p), 'yuzde_ondalik']]),
      steps: [`%${p} = ${p}/100`, `${p} ÷ 100 = ${od}. Yüzde 100'den büyükse ondalık gösterim 1'den büyüktür.`] }); });
  ekle('f_karsilastir', [2, 3], 0.3, () => { const d = ri(3, 8), w = ri(1, 3), n = ri(1, d - 1), b = w * d + n + pick([-2, -1, 0, 1, 2]), L = w + n / d, R = b / d, rel = Math.abs(L - R) < 1e-9 ? '=' : L > R ? '>' : '<';
    return cmpQ({ prompt: 'Boş yere hangi sembol gelmelidir?', cmp: [U.mixed(w, n, d), fr(b, d)], steps: [`${U.mixed(w, n, d)} = ${fr(w * d + n, d)} (${w} × ${d} + ${n} = ${w * d + n})`, `${fr(w * d + n, d)} ile ${fr(b, d)}: paydalar eşit, paylara bak.`] }, rel, { '<': 'tamsayili', '>': 'tamsayili', '=': 'tamsayili' }); });
  ekle('f_ondalik_karsilastir', [2, 3], 0.3, () => { const deg = shuffle([5, 8, 12, 20, 25, 30, 35, 40, 45, 60, 75]).slice(0, 3), [a, b, c] = deg, gos = [`%${a}`, `0,${String(b).padStart(2, '0')}`.replace(/0$/, ''), `%${c}`];
    const bu = Math.random() < 0.5, hedef = bu ? Math.max(...deg) : Math.min(...deg), i = deg.indexOf(hedef);
    return Q({ prompt: `${gos.join(', ')} gösterimlerinden en ${bu ? 'büyüğü' : 'küçüğü'} hangisidir?`, options: mc(gos[i], gos.filter((_, k) => k !== i).map(g => [g, g.startsWith('%') ? 'yuzde_ondalik' : 'uzun_buyuk'])),
      steps: ['Hepsini aynı gösterime çevir: %… = …/100.', deg.map((v, k) => `${gos[k]} = ${v}/100`).join(', '), `En ${bu ? 'büyük' : 'küçük'}: ${gos[i]}`] }); });
  // TEMA 5
  ekle('s_arastirma', [2, 3], 0.35, () => { const it = pick([
      ['Aynı araştırma başka bir sınıfta yapılınca farklı sonuçlar çıktı. Buna ne denir?', 'Verinin değişebilirliği', [['Araştırmanın hatalı yapılması', 'asiri_genelleme'], ['Verinin görselleştirilmesi', 'adim_sira'], ['Araştırma sorusunun belirlenmesi', 'adim_sira']], 'Aynı araştırma farklı gruplarla yapılınca farklı sonuçlar çıkabilir. Buna verinin değişebilirliği denir.'],
      ['Hangisi bir araştırma sorusunda OLMAMASI gereken bir özelliktir?', 'Tek bir cevabının olması', [['Amacının net olması', 'soru_tek'], ['Veri toplanarak cevaplanabilmesi', 'soru_tek'], ['Bir gruba yönelik olması', 'soru_tek']], 'Araştırma sorusunun tek bir cevabı olmamalı; bir gruba yönelik olmalı ve veri toplanarak cevaplanabilmeli.']]);
    return Q({ prompt: it[0], options: mc(it[1], it[2]), steps: [it[3]] }); });
  ekle('s_tablo_sutun', [2, 3], 0.25, () => Q({ prompt: 'Bir okuldaki 280 öğrencinin okula geliş şekli gösterilecek. Hangi grafikte her öğrenciyi tek tek çizmek gerektiği için bu kadar çok veriyi göstermek zorlaşır?', options: mc('Nokta grafiği', [['Sütun grafiği', 'grafik_secim'], ['Daire grafiği', 'grafik_secim']]),
    steps: ['Nokta grafiğinde her veri bir noktadır.', 'Veri çok olduğunda sütun grafiği daha kullanışlıdır.'] }));
  ekle('s_daire', [2, 3], 0.35, () => { if (Math.random() < 0.5) { let d; do { d = shuffle([5, 10, 15, 20, 25, 30, 35, 40]).slice(0, 4); } while (false); const ek = pick([0, 0, 5, 10, -5]), son = 100 - d.reduce((a, b) => a + b, 0) + ek;
        if (son <= 0) return GEN.s_daire(2); const L = [...d, son], top = L.reduce((a, b) => a + b, 0);
        return tfQ({ prompt: `Bir daire grafiğindeki dilimlerde %${L.join(', %')} yazıyor. Bu daire grafiği doğru çizilmiştir.`, steps: [`Dilimlerin toplamı: ${L.join(' + ')} = %${top}`, top === 100 ? 'Toplam %100 → bütün tamam, grafik doğru olabilir.' : `Toplam %100 değil → grafik hatalıdır.`] }, top === 100, 'daire_toplam'); }
    const top = pick([40, 60, 80, 120, 200, 300, 400]), p = pick([10, 20, 25, 50, 75]), ans = top * p / 100;
    return Q({ type: 'input', prompt: `${top} kişiyle yapılan bir ankette daire grafiğine göre katılanların %${p}'i kahvaltıda simit seçmiştir. Kaç kişi simit seçmiştir?`, answer: String(ans), unit: 'kişi', inputMis: [{ v: p, mis: 'dilim_oran' }, { v: top - ans, mis: 'bos_kisim' }].filter(m => m.v !== ans),
      steps: [`%${p} = ${p}/100`, `${top} kişinin ${p}/100'ü: ${top} ÷ 100 × ${p} = ${ans}`] }); });
  // TEMA 6
  ekle('e_esitlik', [2, 3], 0.35, () => { if (Math.random() < 0.5) { const top = pick([24, 30, 36, 40, 50]), a = ri(5, top - 10), k = ri(2, 6), artan = Math.random() < 0.5;
        return Q({ prompt: `${a} + ${top - a} = ${top} toplamında birinci sayı ${k} ${artan ? 'artırılırsa' : 'azaltılırsa'} toplamın değişmemesi için ikinci sayı ne yapılmalıdır?`,
          options: mc(`${k} ${artan ? 'azaltılmalı' : 'artırılmalı'}`, [[`${k} ${artan ? 'artırılmalı' : 'azaltılmalı'}`, 'denge_bozma'], ['Değiştirilmemeli', 'denge_bozma'], [`${2 * k} ${artan ? 'azaltılmalı' : 'artırılmalı'}`, 'denge_bozma']]),
          steps: [`Birinci sayı ${artan ? '+' : '−'}${k} olunca toplamın aynı kalması için ikinci sayı ${artan ? '−' : '+'}${k} olmalı.`, `(${a} ${artan ? '+' : '−'} ${k}) + (${top - a} ${artan ? '−' : '+'} ${k}) = ${top}`] }); }
    const x = ri(3, 15), b = ri(2, 9), k = ri(2, 5), sol = x + b;
    return Q({ type: 'input', prompt: `▲ + ${b} = ${sol} eşitliğinin her iki tarafı ${k} ile çarpılıyor. (▲ + ${b}) × ${k} = ? Soru işareti yerine hangi sayı gelmelidir?`, answer: String(sol * k), inputMis: [{ v: sol, mis: 'denge_bozma' }, { v: sol + k, mis: 'denge_bozma' }].filter(m => m.v !== sol * k),
      steps: ['Eşitliğin her iki tarafı 0 hariç aynı sayıyla çarpılırsa eşitlik korunur.', `${sol} × ${k} = ${sol * k}`] }); });
  ekle('e_ozellik', [2, 3], 0.35, () => { const t = ri(0, 2), a = ri(3, 15), b = ri(10, 40), c = ri(2, 9);
    if (t === 0) return Q({ type: 'input', prompt: `${a} + ▲ = ${b} + ${a} eşitliğinde ▲ yerine hangi sayı gelmelidir?`, answer: String(b), inputMis: [{ v: a + b, mis: 'esittir_sonuc' }, { v: b - a, mis: 'ozellik_karis' }].filter(m => m.v !== b && m.v > 0), steps: ['Toplamada sayıların yeri değişse de sonuç değişmez (değişme özelliği).', `▲ = ${b}`] });
    if (t === 1) { const d = ri(2, 9), e = d + ri(2, 9); return Q({ type: 'input', prompt: `${c} × (${e} − ${d}) = (${c} × ${e}) − (${c} × ▲) eşitliğinde ▲ yerine hangi sayı gelmelidir?`, answer: String(d), inputMis: [{ v: c * d, mis: 'dagilma_eksik' }, { v: e, mis: 'dagilma_eksik' }], steps: ['Parantezin önündeki sayı, parantez içindeki her sayıyla ayrı ayrı çarpılır (çıkarma üzerine dağılma).', `▲ = ${d}`] }); }
    return Q({ type: 'input', prompt: `${c} × (${a} × ${b}) = (▲ × ${a}) × ${b} eşitliğinde ▲ yerine hangi sayı gelmelidir?`, answer: String(c), inputMis: [{ v: c * a, mis: 'ozellik_karis' }, { v: b, mis: 'ozellik_karis' }].filter(m => m.v !== c), steps: ['Çarpmada sayıların gruplanması sonucu değiştirmez (birleşme özelliği).', `▲ = ${c}`] }); });
  ekle('e_us', [1, 2], 0.3, () => { const n = ri(2, 9), us = pick([2, 3]), ADS = { 2: ['ikinin', 'İkinin'], 3: ['üçün', 'Üçün'], 4: ['dördün', 'Dördün'], 5: ['beşin', 'Beşin'], 6: ['altının', 'Altının'], 7: ['yedinin', 'Yedinin'], 8: ['sekizin', 'Sekizin'], 9: ['dokuzun', 'Dokuzun'] }, ad = ADS[n][1];
    const SAY = { 2: 'İki', 3: 'Üç', 4: 'Dört', 5: 'Beş', 6: 'Altı', 7: 'Yedi', 8: 'Sekiz', 9: 'Dokuz' };
    return Q({ prompt: `${n}${us === 2 ? '²' : '³'} üslü ifadesi nasıl okunur?`, options: mc(`${ad} ${us === 2 ? 'karesi' : 'küpü'}`, [[`${ad} ${us === 2 ? 'küpü' : 'karesi'}`, 'us_carpim'], [`${SAY[n]} çarpı ${us === 2 ? 'iki' : 'üç'}`, 'us_carpim']]),
      steps: ['Sağ üstteki 2 "karesi", 3 "küpü" diye okunur.', `${n}${us === 2 ? '²' : '³'} = ${Array(us).fill(n).join(' × ')} = ${n ** us}`] }); });
  ekle('e_oncelik', [2, 3], 0.35, () => { if (Math.random() < 0.5) { const b = pick([2, 3, 4, 5]), c = ri(2, 6), m = ri(2, 6), a = b * c * m, dogru = a / b * c, sag = m;
        return Q({ type: 'input', prompt: `${a} ÷ ${b} × ${c} = ?`, answer: String(dogru), inputMis: [{ v: sag, mis: 'ayni_oncelik' }],
          steps: ['Bölme ile çarpma aynı önceliktedir: soldan sağa yap.', `${a} ÷ ${b} = ${a / b}`, `${a / b} × ${c} = ${dogru}`] }); }
    const tv = ri(3, 9), tav = ri(3, 15);
    return Q({ prompt: `Bir kümeste ${tv} tavuk ve ${tav} tavşan var. Toplam ayak sayısını hangi sayı cümlesi verir?`, options: mc(`${tv} × 2 + ${tav} × 4`, [[`${tv} × 4 + ${tav} × 4`, 'problem_adim'], [`(${tv} + ${tav}) × 2`, 'problem_adim'], [`${tv} + ${tav} × 2 × 4`, 'oncelik_soldan']]),
      steps: ['Tavuğun 2, tavşanın 4 ayağı var.', `${tv} × 2 + ${tav} × 4 = ${2 * tv} + ${4 * tav} = ${2 * tv + 4 * tav}`] }); });
  ekle('e_oruntu', [2, 3], 0.35, () => { const t = ri(0, 2), a = ri(2, 9), d = ri(2, 6);
    if (t === 0) { const n = ri(8, 20), v = a + (n - 1) * d; return Q({ type: 'input', prompt: `${a}, ${a + d}, ${a + 2 * d}, ... örüntüsünde ${v} sayısı kaçıncı adımdadır?`, answer: String(n), inputMis: [{ v: n - 1, mis: 'oruntu_bir' }, { v: n + 1, mis: 'oruntu_bir' }],
        steps: [`Artış ${d}. ${v} − ${a} = ${v - a}`, `${v - a} ÷ ${d} = ${n - 1} kez artış`, `${n - 1} + 1 = ${n}. adım`] }); }
    if (t === 1) { const k = a - d; const kural = k > 0 ? `Adım sayısının ${d} katının ${k} fazlası` : k < 0 ? `Adım sayısının ${d} katının ${-k} eksiği` : `Adım sayısının ${d} katı`;
      const wr = [[`Adım sayısının ${d} fazlası`, 'oruntu_kural'], [`Adım sayısının ${a} katı`, 'oruntu_kural']].filter(w => w[0] !== kural);
      return Q({ prompt: `${a}, ${a + d}, ${a + 2 * d}, ${a + 3 * d}, ... örüntüsünün kuralı hangisidir?`, options: mc(kural, wr.concat([[`Adım sayısının ${d + 1} katı`, 'oruntu_kural']]).filter((w, i, L) => w[0] !== kural && L.findIndex(z => z[0] === w[0]) === i)),
        steps: ['Kuralı birkaç adımda dene:', `1. adım: ${d} × 1${k > 0 ? ' + ' + k : k < 0 ? ' − ' + -k : ''} = ${a}`, `2. adım: ${d} × 2${k > 0 ? ' + ' + k : k < 0 ? ' − ' + -k : ''} = ${a + d}`, `3. adım: ${d} × 3${k > 0 ? ' + ' + k : k < 0 ? ' − ' + -k : ''} = ${a + 2 * d}`] }); }
    const sabit = [`${a}, ${a + d}, ${a + 2 * d}, ${a + 3 * d}`, `${a + 1}, ${a + 1 + d + 1}, ${a + 1 + 2 * (d + 1)}, ${a + 1 + 3 * (d + 1)}`, `${10 * a}, ${10 * a + 10}, ${10 * a + 20}, ${10 * a + 30}`], degisen = pick(['1, 3, 6, 10', '2, 3, 5, 8', '1, 2, 4, 7']);
    return Q({ prompt: 'Hangisi her adımda AYNI miktar artan bir örüntü DEĞİLDİR?', options: mc(degisen, sabit.map(x => [x, 'oruntu_sabit'])), steps: [`${degisen}: artış her adımda değişiyor.`, 'Diğerlerinde artış hep aynı.'] }); });
  ekle('e_algoritma', [2, 3], 0.35, () => { if (Math.random() < 0.5) { const b = ri(3, 9), n = ri(3, 7), r = ri(0, b - 1), A = b * n + r;
        return Q({ type: 'input', prompt: `Algoritma: 1. Başla 2. Bölünen = ${A}, Bölen = ${b}, Sayaç = 0 3. Bölünen bölenden küçük mü? Evet ise 6. adıma git 4. Bölünenden böleni çıkar, sayacı 1 artır 5. 3. adıma dön 6. Sayacı yaz 7. Bitir. Yazılan sayı kaçtır?`, answer: String(n), inputMis: [{ v: n + 1, mis: 'karar_dongu' }, { v: n - 1, mis: 'karar_dongu' }].filter(m => m.v > 0),
          steps: [`Her turda ${b} çıkar: ${Array.from({ length: n + 1 }, (_, i) => A - i * b).join(' → ')}`, `${n} kez çıkarıldı. Bu algoritma ${A} ÷ ${b} bölme işlemini yapar (bölüm ${n}${r ? ', kalan ' + r : ''}).`] }); }
    const k = ri(8, 25), s5 = ri(3, 9);
    return Q({ prompt: `${k} tane ${s5} sayısını tek tek toplamak yerine algoritmada hangi işlem kullanılabilir?`, options: mc(`${k} × ${s5}`, [[`${k} + ${s5}`, 'algoritma_sira'], [`${k} ÷ ${s5}`, 'algoritma_sira'], [`${s5}²`, 'us_carpim']]),
      steps: ['Aynı sayıyı tekrar tekrar toplamak çarpmadır.', `${k} × ${s5} = ${k * s5}`] }); });
  // TEMA 7
  ekle('p_olay', [1, 2], 0.3, () => { const [g, t] = pick([['%100', 'Kesin olay'], ['1', 'Kesin olay'], ['%0', 'İmkânsız olay'], ['0', 'İmkânsız olay']]);
    return Q({ prompt: `Olasılığı ${g} olan bir olay hangisidir?`, options: mc(t, ['Kesin olay', 'İmkânsız olay', 'Eşit olasılıklı olay'].filter(x => x !== t).map(x => [x, 'olay_tur'])),
      steps: ['Gerçekleşme olasılığı 1 (%100) olan olay kesin olaydır.', 'Gerçekleşme olasılığı 0 (%0) olan olay imkânsız olaydır.'] }); });
  for (const [id, list] of Object.entries(GRID)) { const base = GEN[id]; GEN[id] = (lv) => (Math.random() < 0.22 ? pick(list)(lv) : base(lv)); }


  /* =========================================================
     HATA AVCISI — muhakeme soruları (Maarif: matematiksel muhakeme)
     Her senaryo: bir problem + kodla kurulmuş DOĞRU çözüm adımları + belgelenmiş
     yanılgılardan türetilmiş HATALI çözüm(ler). Bir senaryodan üç biçim türer:
       bul   → hayali öğrencinin defterinde hatalı adımı bul (ya da "hata yok")
       kim   → iki öğrenci farklı sonuç buldu: kim haklı?
       neden → hatanın sebebi hangi yanılgı?
     Hatalı adım = sonucun bozulmaya başladığı İLK adım (sonraki adımlar hatayı taşır).
     ========================================================= */
  const SEN = {};
  const S = (soru, dogru, sonuc, hatalar, yakin) => ({ soru, dogru, sonuc, hatalar, yakin: yakin || [] });
  const H = (mis, at, satirlar, sonuc) => ({ mis, at, satirlar, sonuc });
  SEN.a_cevre = (lv) => {
    let a, b; do { a = ri(5, lv === 3 ? 25 : 14); b = ri(3, a - 1); } while (a * b === 2 * (a + b));
    const l0 = `Kenarlar: ${a}, ${b}, ${a}, ${b}`;
    return S(`Uzun kenarı ${a} cm, kısa kenarı ${b} cm olan dikdörtgenin çevresi kaç cm?`, [l0, `${a} + ${b} = ${a + b}`, `Çevre = ${a + b} × 2 = ${2 * (a + b)} cm`], `${2 * (a + b)} cm`,
      [H('cevre_yarim', 2, [l0, `${a} + ${b} = ${a + b}`, `Çevre = ${a + b} cm`], `${a + b} cm`), H('cevre_alan', 1, [l0, `${a} × ${b} = ${a * b}`, `Çevre = ${a * b} cm`], `${a * b} cm`)], ['ters_cevre', 'birim']);
  };
  SEN.a_alan = (lv) => {
    const [a, b] = dikKenar(4);
    const l0 = 'Alan = uzun kenar × kısa kenar', l1 = `Alan = ${a} × ${b}`;
    return S(`Kenarları ${a} metre ve ${b} metre olan dikdörtgen bir odanın alanı kaç metrekaredir?`, [l0, l1, `Alan = ${a * b} m²`], `${a * b} m²`,
      [H('cevre_alan', 0, ['Alan = kenarların toplamı', `Alan = ${a} + ${b} + ${a} + ${b}`, `Alan = ${2 * (a + b)} m²`], `${2 * (a + b)} m²`), H('birim', 2, [l0, l1, `Alan = ${a * b} m`], `${a * b} m`)], ['cevre_yarim', 'ters_cevre']);
  };
  SEN.a_cevre_alan = (lv) => {
    if (Math.random() < 0.5) {
      const k = ri(3, 15), P = 4 * k, l0 = 'Karenin 4 kenarı eşittir';
      return S(`Çevresi ${P} cm olan karenin bir kenarı kaç cm?`, [l0, `Kenar = ${P} ÷ 4`, `Kenar = ${k} cm`], `${k} cm`, [H('kare_cevre', 1, [l0, `Kenar = ${P} ÷ 2`, `Kenar = ${2 * k} cm`], `${2 * k} cm`)], ['ters_cevre', 'cevre_alan']);
    }
    const b = ri(3, 9), a = b + ri(2, 8), P = 2 * (a + b);
    return S(`Çevresi ${P} cm, uzun kenarı ${a} cm olan dikdörtgenin kısa kenarı kaç cm?`, [`İki kenarın toplamı = ${P} ÷ 2 = ${a + b}`, `Kısa kenar = ${a + b} − ${a}`, `Kısa kenar = ${b} cm`], `${b} cm`,
      [H('ters_cevre', 0, [`İki kenarın toplamı = ${P}`, `Kısa kenar = ${P} − ${a}`, `Kısa kenar = ${P - a} cm`], `${P - a} cm`)], ['cevre_alan', 'cevre_yarim']);
  };
  SEN.g_aci_iliski = (lv) => {
    const x = ri(3, 17) * 5;
    if (Math.random() < 0.5) return S(`${x} derecelik bir açının tümleri kaç derecedir?`, ['Tümler açıların toplamı 90°', `90 − ${x} = ${90 - x}`, `Tümleri ${90 - x}°`], `${90 - x}°`,
      [H('tumler_butunler', 0, ['Tümler açıların toplamı 180°', `180 − ${x} = ${180 - x}`, `Tümleri ${180 - x}°`], `${180 - x}°`)], ['ters_aci', 'aci_tur']);
    return S(`${x} derecelik bir açının bütünleri kaç derecedir?`, ['Bütünler açıların toplamı 180°', `180 − ${x} = ${180 - x}`, `Bütünleri ${180 - x}°`], `${180 - x}°`,
      [H('tumler_butunler', 0, ['Bütünler açıların toplamı 90°', `90 − ${x} = ${90 - x}`, `Bütünleri ${90 - x}°`], `${90 - x}°`)], ['ters_aci', 'aci_tur']);
  };
  SEN.g_ucgen = (lv) => {
    const a = ri(6, 16) * 5, b = ri(6, 16) * 5, l1 = `${a} + ${b} = ${a + b}`;
    return S(`Bir üçgenin iki iç açısı ${a}° ve ${b}°. Üçüncü açı kaç derecedir?`, ['İç açıların toplamı 180°', l1, `180 − ${a + b} = ${180 - a - b}°`], `${180 - a - b}°`,
      [H('ucgen_360', 0, ['İç açıların toplamı 360°', l1, `360 − ${a + b} = ${360 - a - b}°`], `${360 - a - b}°`)], ['ucgen_sinif', 'tumler_butunler', 'aci_tur']);
  };
  SEN.g_cember = (lv) => {
    const r = 2 * ri(2, 10);
    return S(`Yarıçapı ${r} cm olan çemberin çapı kaç cm?`, ['Çap, yarıçapın 2 katıdır', `Çap = 2 × ${r}`, `Çap = ${2 * r} cm`], `${2 * r} cm`,
      [H('cap_yaricap', 0, ['Çap, yarıçapın yarısıdır', `Çap = ${r} ÷ 2`, `Çap = ${r / 2} cm`], `${r / 2} cm`)], ['dp_dogru', 'isin_dogru']);
  };
  SEN.n_toplacikar = (lv) => {
    if (Math.random() < 0.5) {
      const a1 = ri(2, 9), b1 = ri(10 - a1, 9), a10 = ri(1, 7), b10 = ri(0, 8 - a10), a100 = ri(1, 8), b100 = ri(1, 9 - a100);
      const a = a100 * 100 + a10 * 10 + a1, b = b100 * 100 + b10 * 10 + b1, l0 = `Birler: ${a1} + ${b1} = ${a1 + b1} → ${a1 + b1 - 10} yaz, 1 elde`;
      return S(`${a} + ${b} işlemini yap.`, [l0, `Onlar: ${a10} + ${b10} + 1 = ${a10 + b10 + 1}`, `Yüzler: ${a100} + ${b100} = ${a100 + b100} → Sonuç: ${a + b}`], String(a + b),
        [H('elde_unutma', 1, [l0, `Onlar: ${a10} + ${b10} = ${a10 + b10}`, `Yüzler: ${a100} + ${b100} = ${a100 + b100} → Sonuç: ${a + b - 10}`], String(a + b - 10))], ['basamak_kayma', 'ters_islem']);
    }
    const a1 = ri(0, 7), b1 = ri(a1 + 1, 9), a10 = ri(2, 9), b10 = ri(0, a10 - 1), a100 = ri(3, 9), b100 = ri(1, a100 - 1);
    const a = a100 * 100 + a10 * 10 + a1, b = b100 * 100 + b10 * 10 + b1, d = a - b, yz = `Yüzler: ${a100} − ${b100} = ${a100 - b100}`;
    const l0 = `Birler: ${a1} − ${b1} olmaz, onluk boz: ${a1 + 10} − ${b1} = ${a1 + 10 - b1}`, ters = (a100 - b100) * 100 + (a10 - b10) * 10 + (b1 - a1);
    return S(`${a} − ${b} işlemini yap.`, [l0, `Onlar: ${a10 - 1} − ${b10} = ${a10 - 1 - b10}`, `${yz} → Sonuç: ${d}`], String(d),
      [H('elde_unutma', 1, [l0, `Onlar: ${a10} − ${b10} = ${a10 - b10}`, `${yz} → Sonuç: ${d + 10}`], String(d + 10)),
       H('elde_unutma', 0, [`Birler: ${b1} − ${a1} = ${b1 - a1}`, `Onlar: ${a10} − ${b10} = ${a10 - b10}`, `${yz} → Sonuç: ${ters}`], String(ters))], ['basamak_kayma', 'ters_islem']);
  };
  SEN.n_carpbol = (lv) => {
    const d1 = ri(2, 9), d2 = ri(2, 9), p = ri(1, 2), q = ri(1, lv === 3 ? 3 : 2), x = d1 * 10 ** p, y = d2 * 10 ** q, l0 = `Sıfırları ayır: ${d1} × ${d2} = ${d1 * d2}`, mx = Math.max(p, q);
    return S(`${fmtN(x)} × ${fmtN(y)} işlemini kısa yoldan yap.`, [l0, `Ayırdığım sıfırlar: ${p} + ${q} = ${p + q} tane`, `Sonuç: ${fmtN(x * y)}`], fmtN(x * y),
      [H('sifir_sayisi', 1, [l0, `Ayırdığım sıfırlar: ${mx} tane`, `Sonuç: ${fmtN(d1 * d2 * 10 ** mx)}`], fmtN(d1 * d2 * 10 ** mx))], ['kismi_carpim', 'elde_unutma']);
  };
  SEN.n_basamak = (lv) => {
    const len = lv === 3 ? 6 : 5, ds = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, len), N = Number(ds.join('')), pos = ri(1, len - 2), dig = ds[len - 1 - pos], val = dig * 10 ** pos, l0 = `${dig} rakamı ${BAS[pos]} basamağında`;
    return S(`${fmtN(N)} sayısında ${dig} rakamının basamak değeri kaçtır?`, [l0, `Basamak değeri = ${dig} × ${fmtN(10 ** pos)}`, `Sonuç: ${fmtN(val)}`], fmtN(val),
      [H('basamak_kayma', 0, [`${dig} rakamı ${BAS[pos + 1]} basamağında`, `Basamak değeri = ${dig} × ${fmtN(10 ** (pos + 1))}`, `Sonuç: ${fmtN(val * 10)}`], fmtN(val * 10)),
       H('basamak_deger', 1, [l0, 'Basamak değeri, rakamın kendisidir', `Sonuç: ${dig}`], String(dig))], ['sifir_atlama', 'boluk_kayma']);
  };
  SEN.n_okuma = (lv) => {
    const M = ri(1, 9), T = ri(11, 99), u = ri(101, 999), N = M * 1e6 + T * 1e3 + u, bad = Number(`${M}${T}${u}`);
    return S(`${U.cap(U.words(N))} sayısını rakamla yaz.`, [`Milyonlar bölüğü: ${M}`, `Binler bölüğü: ${String(T).padStart(3, '0')}`, `Sayı: ${fmtN(N)}`], fmtN(N),
      [H('sifir_atlama', 1, [`Milyonlar bölüğü: ${M}`, `Binler bölüğü: ${T}`, `Sayı: ${fmtN(bad)}`], fmtN(bad))], ['boluk_kayma', 'basamak_deger']);
  };
  SEN.n_problem = (lv) => {
    let s, e; do { s = ri(8, 17) * 60 + ri(5, 11) * 5; e = s + ri(5, lv === 3 ? 30 : 20) * 5; } while (e % 60 >= s % 60 || e % 60 === 0);
    const sh = Math.floor(s / 60), sm = s % 60, eh = Math.floor(e / 60), em = e % 60, nh = (sh + 1) * 60;
    const dec = eh * 100 + em - sh * 100 - sm, Hh = Math.floor(dec / 100), Mm = dec % 100;
    return S(`Film saat ${U.tk(sh, sm, 'de')} başladı, ${U.tk(eh, em, 'de')} bitti. Film kaç dakika sürdü?`,
      [`${hm(s)} → ${hm(nh)}: ${nh - s} dakika`, `${hm(nh)} → ${hm(e)}: ${e - nh} dakika`, `Toplam: ${nh - s} + ${e - nh} = ${e - s} dakika`], `${e - s} dakika`,
      [H('saat_ondalik', 0, [`Saatleri sayı gibi çıkar: ${fmtD(eh + em / 100, 2)} − ${fmtD(sh + sm / 100, 2)}`, `${fmtD(dec / 100, 2)} → ${Hh} saat ${Mm} dakika`, `Toplam: ${Hh * 60 + Mm} dakika`], `${Hh * 60 + Mm} dakika`)], ['problem_adim', 'elde_unutma']);
  };
  SEN.f_denk = (lv) => {
    const [n, d] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5]]), k = ri(2, 4), D = d * k, e = D - d;
    return S(`${fr(n, d)} kesrine denk ve paydası ${D} olan kesir hangisidir?`, [`Payda ${d} → ${D}: ${k} ile çarpılmış`, `Pay da ${k} ile çarpılır: ${n} × ${k} = ${n * k}`, `Cevap: ${fr(n * k, D)}`], fr(n * k, D),
      [H('denk_toplama', 0, [`Payda ${d} → ${D}: ${e} eklenmiş`, `Paya da ${e} eklenir: ${n} + ${e} = ${n + e}`, `Cevap: ${fr(n + e, D)}`], fr(n + e, D))], ['payda_buyuk', 'pay_payda_ters']);
  };
  SEN.f_karsilastir = (lv) => {
    if (lv < 3 && Math.random() < 0.6) {
      const n = ri(1, 3), a = ri(n + 1, 6), b = ri(a + 1, 12), l0 = `Payları eşit: ikisinde de ${n} parça`;
      return S(`${fr(n, a)} ile ${fr(n, b)} kesirlerinden hangisi büyüktür?`, [l0, 'Paydası küçük olanın parçaları daha büyüktür', `Büyük olan: ${fr(n, a)}`], fr(n, a),
        [H('payda_buyuk', 1, [l0, 'Paydası büyük olan kesir daha büyüktür', `Büyük olan: ${fr(n, b)}`], fr(n, b))], ['pay_payda_ayri', 'denk_toplama']);
    }
    let n1, d1, n2, d2; do { d1 = ri(3, 6); n1 = ri(1, d1 - 1); d2 = ri(d1 + 2, 10); n2 = ri(n1 + 1, d2 - 1); } while (n1 * d2 <= n2 * d1 || gcd(n1, d1) > 1 || gcd(n2, d2) > 1);
    const L = d1 * d2 / gcd(d1, d2), A = n1 * L / d1, B = n2 * L / d2;
    return S(`${fr(n1, d1)} ile ${fr(n2, d2)} kesirlerinden hangisi büyüktür?`, [`Paydaları eşitle: ${fr(n1, d1)} = ${fr(A, L)} ve ${fr(n2, d2)} = ${fr(B, L)}`, `${A} > ${B}`, `Büyük olan: ${fr(n1, d1)}`], fr(n1, d1),
      [H('pay_payda_ayri', 0, [`Paylara bak: ${n2} > ${n1}`, 'Payı büyük olan kesir daha büyüktür', `Büyük olan: ${fr(n2, d2)}`], fr(n2, d2))], ['payda_buyuk', 'denk_toplama']);
  };
  SEN.f_ondalik_karsilastir = (lv) => {
    const x = ri(3, 9), A = x * 10, B = A - ri(1, 9), a = fmtD(x / 10), b = fmtD(B / 100);
    return S(`${a} ile ${b} sayılarından hangisi büyüktür?`, [`Basamak sayısını eşitle: ${a} = ${fmtD(A / 100, 2)}`, `${A} yüzde bir > ${B} yüzde bir`, `Büyük olan: ${a}`], a,
      [H('uzun_buyuk', 0, [`${b} sayısının basamağı daha çok`, 'Basamağı çok olan sayı daha büyüktür', `Büyük olan: ${b}`], b)], ['sifir_fark', 'ondalik_basamak']);
  };
  SEN.f_yuzde = (lv) => {
    const p = ri(2, 9), l0 = `%${p} = ${fr(p, 100)}`;
    return S(`%${p} ondalık gösterimle nasıl yazılır?`, [l0, `${p}, yüzde birler basamağına yazılır`, `Sonuç: ${fmtD(p / 100)}`], fmtD(p / 100),
      [H('yuzde_ondalik', 1, [l0, `${p}, virgülden hemen sonraya yazılır`, `Sonuç: ${fmtD(p / 10)}`], fmtD(p / 10))], ['ondalik_basamak', 'sifir_fark']);
  };
  SEN.s_tablo_sutun = (lv) => {
    const [X, Y] = shuffle(pick(CATS).filter(c => !c.includes('.'))).slice(0, 2), a = ri(9, 25), b = ri(3, a - 2);
    return S(`Sütun grafiğine göre ${a} kişi ${X.toLocaleLowerCase('tr-TR')}, ${b} kişi ${Y.toLocaleLowerCase('tr-TR')} seçmiş. ${X} seçenler, ${Y.toLocaleLowerCase('tr-TR')} seçenlerden kaç kişi fazladır?`, ['"Kaç kişi fazla" farkı sorar', `Fark = ${a} − ${b}`, `Sonuç: ${a - b} kişi`], `${a - b} kişi`,
      [H('fark_toplam', 0, ['"Kaç kişi fazla" toplamı sorar', `Toplam = ${a} + ${b}`, `Sonuç: ${a + b} kişi`], `${a + b} kişi`)], ['grafik_okuma', 'asiri_genelleme']);
  };
  SEN.e_oncelik = (lv) => {
    const b = ri(2, 9), c = ri(2, 9);
    if (Math.random() < 0.6) {
      const a = ri(2, 20);
      return S(`${a} + ${b} × ${c} işleminin sonucu kaçtır?`, [`Önce çarpma: ${b} × ${c} = ${b * c}`, `Sonra toplama: ${a} + ${b * c}`, `Sonuç: ${a + b * c}`], String(a + b * c),
        [H('oncelik_soldan', 0, [`Önce toplama: ${a} + ${b} = ${a + b}`, `Sonra çarpma: ${a + b} × ${c}`, `Sonuç: ${(a + b) * c}`], String((a + b) * c))], ['dagilma_eksik', 'ozellik_karis']);
    }
    const a = b * c + ri(5, 30);
    return S(`${a} − ${b} × ${c} işleminin sonucu kaçtır?`, [`Önce çarpma: ${b} × ${c} = ${b * c}`, `Sonra çıkarma: ${a} − ${b * c}`, `Sonuç: ${a - b * c}`], String(a - b * c),
      [H('oncelik_soldan', 0, [`Önce çıkarma: ${a} − ${b} = ${a - b}`, `Sonra çarpma: ${a - b} × ${c}`, `Sonuç: ${(a - b) * c}`], String((a - b) * c))], ['cikarma_degisme', 'ozellik_karis']);
  };
  SEN.e_us = (lv) => {
    const b = ri(2, 20);
    if (lv === 3 && Math.random() < 0.5) {
      const a = ri(2, 5);
      return S(`${a}³ + ${b} işleminin sonucu kaçtır?`, [`${a}³ = ${a} × ${a} × ${a} = ${a ** 3}`, `${a ** 3} + ${b}`, `Sonuç: ${a ** 3 + b}`], String(a ** 3 + b),
        [H('us_carpim', 0, [`${a}³ = ${a} × 3 = ${3 * a}`, `${3 * a} + ${b}`, `Sonuç: ${3 * a + b}`], String(3 * a + b))], ['oncelik_soldan', 'ozellik_karis']);
    }
    const a = ri(3, 9);
    return S(`${a}² + ${b} işleminin sonucu kaçtır?`, [`${a}² = ${a} × ${a} = ${a * a}`, `${a * a} + ${b}`, `Sonuç: ${a * a + b}`], String(a * a + b),
      [H('us_carpim', 0, [`${a}² = ${a} × 2 = ${2 * a}`, `${2 * a} + ${b}`, `Sonuç: ${2 * a + b}`], String(2 * a + b))], ['oncelik_soldan', 'ozellik_karis']);
  };
  SEN.e_esitlik = (lv) => {
    if (Math.random() < 0.5) {
      const a = ri(5, 40), x = ri(5, 40), s = a + x;
      return S(`▢ + ${a} = ${s} eşitliğinde kutuya hangi sayı gelmelidir?`, ['Bilinmeyen terim = toplam − diğer terim', `▢ = ${s} − ${a}`, `▢ = ${x}`], String(x),
        [H('ters_islem', 0, ['Bilinmeyen terim = iki sayının toplamı', `▢ = ${s} + ${a}`, `▢ = ${s + a}`], String(s + a))], ['denge_bozma', 'esittir_sonuc']);
    }
    const a = ri(5, 20), b = ri(5, 20), c = ri(2, 15), L = a + b, l0 = `Sol taraf: ${a} + ${b} = ${L}`;
    return S(`${a} + ${b} = ▢ + ${c} eşitliğinde kutuya hangi sayı gelmelidir?`, [l0, `Sağ taraf da ${L} olmalı: ▢ + ${c} = ${L}`, `▢ = ${L - c}`], String(L - c),
      [H('esittir_sonuc', 1, [l0, 'Eşittirden sonra sonucu yazarım', `▢ = ${L}`], String(L))], ['denge_bozma', 'ters_islem']);
  };
  SEN.e_oruntu = (lv) => {
    const m = ri(2, 6), c = ri(1, 6), t = (n) => m * n + c, N = pick([10, 12, 15, 20]), l0 = `Her adımda ${m} artıyor`;
    return S(`${t(1)}, ${t(2)}, ${t(3)}, ${t(4)}, ... örüntüsünün ${N}. adımı kaçtır?`, [l0, `Kural: adım × ${m} + ${c}`, `${N}. adım: ${N} × ${m} + ${c} = ${t(N)}`], String(t(N)),
      [H('oruntu_baslangic', 1, [l0, `Kural: adım × ${m}`, `${N}. adım: ${N} × ${m} = ${m * N}`], String(m * N))], ['oruntu_bir', 'algoritma_sira']);
  };
  SEN.p_spektrum = (lv) => {
    const r = ri(2, 6), m = ri(r + 1, 9), l1 = `Pay (parça): ${r} kırmızı top`;
    return S(`Torbada ${r} kırmızı, ${m} mavi top var. Torbadan rastgele çekilen topun kırmızı olma olasılığı kaçtır?`, [`Payda (bütün): tüm toplar, ${r} + ${m} = ${r + m}`, l1, `Olasılık = ${fr(r, r + m)}`], fr(r, r + m),
      [H('olasilik_oran', 0, [`Payda (bütün): kırmızı olmayan toplar, ${m}`, l1, `Olasılık = ${fr(r, m)}`], fr(r, m))], ['olasilik_buyuk', 'az_cok']);
  };

  // ---- 10.11.2026: kalan 14 becerinin senaryoları (35/35). Sayısız konularda sonuç tırnak içinde bir yargıdır. ----
  SEN.g_temel = (lv) => {
    const n = lv === 1 ? 3 : ri(3, 5), L = pick([['A', 'B', 'C', 'D', 'E'], ['K', 'L', 'M', 'N', 'P'], ['P', 'R', 'S', 'T', 'U']]).slice(0, n);
    const ilk = L.slice(1).map(x => L[0] + x), son = []; for (let i = 1; i < n; i++) for (let j = i + 1; j < n; j++) son.push(L[i] + L[j]);
    const yan = L.slice(1).map((x, i) => L[i] + x), top = ilk.length + son.length;
    return S(`${L.join(', ')} noktaları aynı doğru üzerinde, bu sırayla duruyor. Bu noktalarla kaç doğru parçası oluşur?`,
      [`${L[0]} noktasından başlayanlar: ${ilk.join(', ')} (${ilk.length} tane)`, `Sonraki noktalardan başlayanlar: ${son.join(', ')} (${son.length} tane)`, `Toplam: ${ilk.length} + ${son.length} = ${top} doğru parçası`], `${top} doğru parçası`,
      [H('nokta_sayma', 0, [`Yalnız yan yana noktalar birleşir: ${yan.join(', ')}`, 'Arada nokta atlayan doğru parçası sayılmaz', `Toplam: ${yan.length} doğru parçası`], `${yan.length} doğru parçası`)], ['dp_dogru', 'dp_uzunluk']);
  };
  SEN.g_dikme_paralel = (lv) => {
    const [a, b, c] = pick([['a', 'b', 'c'], ['d', 'e', 'f'], ['k', 'l', 'm']]);
    if (Math.random() < 0.5) { const l0 = `${a} doğrusu ${b} doğrusuyla 90° yapar`, l1 = `${c} doğrusu da ${b} doğrusuyla 90° yapar`;
      return S(`${a} doğrusu ${b} doğrusuna dik. ${c} doğrusu da ${b} doğrusuna dik. ${a} ile ${c} doğruları birbirine göre nasıldır?`, [l0, l1, 'Aynı doğruya dik olan iki doğru birbirine paraleldir'], '"Paralel"',
        [H('paralel_kesisen', 2, [l0, l1, 'Aynı doğruya dik olan iki doğru birbirine de diktir'], '"Dik"')], ['dik_yatay', 'paralel_kesen']); }
    const l0 = `${a} ile ${b} paralel: ikisi de aynı yöne uzanır`, l1 = `${c} doğrusu ${b} doğrusuyla 90° yapar`;
    return S(`${a} doğrusu ${b} doğrusuna paralel. ${c} doğrusu ${b} doğrusuna dik. ${a} ile ${c} doğruları birbirine göre nasıldır?`, [l0, l1, `${c} doğrusu ${a} doğrusuyla da 90° yapar`], '"Dik"',
      [H('paralel_kesisen', 2, [l0, l1, `${c} doğrusu ${a} doğrusuyla hiç kesişmez`], '"Paralel"')], ['dik_yatay', 'paralel_kesen']);
  };
  SEN.g_aci = (lv) => {
    let d; do { d = lv === 3 ? ri(3, 33) * 5 : ri(2, 16) * 10; } while (d === 90);
    const sag = Math.random() < 0.5, taraf = sag ? 'sağdaki' : 'soldaki', dogruSira = sag ? 'iç' : 'dış', yanlisSira = sag ? 'dış' : 'iç';
    const ic = sag ? d : 180 - d, dis = 180 - ic;
    return S(`Açıölçerde açının bir kolu ${taraf} 0 çizgisinde. Diğer kol iç sırada ${ic}, dış sırada ${dis} sayısını gösteriyor. Açının ölçüsü kaç derecedir?`,
      [`Kol ${taraf} 0 çizgisinde: 0 ile başlayan sıra ${dogruSira} sıradır`, `${U.cap(dogruSira)} sırada okunan sayı: ${d}`, `Açının ölçüsü ${d}°`], `${d}°`,
      [H('iletki_ters', 0, [`Kol ${taraf} 0 çizgisinde: ${yanlisSira} sıra okunur`, `${U.cap(yanlisSira)} sırada okunan sayı: ${180 - d}`, `Açının ölçüsü ${180 - d}°`], `${180 - d}°`)], ['aci_olcme', 'aci_tur']);
  };
  SEN.g_cokgen = (lv) => {
    const x = ri(lv === 3 ? 21 : 6, lv === 3 ? 33 : 16) * 5, l0 = 'İç açı ile aynı köşedeki dış açı yan yana durur, birlikte bir doğru açı oluşturur';
    return S(`Bir çokgenin bir iç açısı ${x}°. Aynı köşedeki dış açı kaç derecedir?`, [l0, `İç açı + dış açı = 180°`, `Dış açı = 180 − ${x} = ${180 - x}°`], `${180 - x}°`,
      [H('dis_aci', 1, [l0, 'İç açı + dış açı = 360°', `Dış açı = 360 − ${x} = ${360 - x}°`], `${360 - x}°`)], ['tumler_butunler', 'cokgen_sayi']);
  };
  SEN.n_karsilastir = (lv) => {
    const k = lv === 3 ? 5 : 4, ds = [0, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, k - 1)], sirali = [...ds].sort((p, q) => p - q), karisik = shuffle(ds);
    const dogru = [sirali[1], 0, ...sirali.slice(2)].join(''), l0 = `Rakamları küçükten büyüğe sırala: ${sirali.join(', ')}`;
    return S(`${karisik.join(', ')} rakamlarını birer kez kullanarak yazılabilecek en küçük ${k === 4 ? 'dört' : 'beş'} basamaklı sayı kaçtır?`,
      [l0, `Sayı 0 ile başlayamaz: başa ${sirali[1]}, hemen ardına 0 yazılır`, `En küçük sayı: ${fmtN(Number(dogru))}`], fmtN(Number(dogru)),
      [H('sifir_basta', 1, [l0, 'En küçük rakam en başa yazılır: başa 0 gelir', `En küçük sayı: ${sirali.join('')}`], sirali.join(''))], ['ilk_rakam', 'basamak_karsilastir']);
  };
  SEN.n_tahmin = (lv) => {
    const yuz = lv === 3 || Math.random() < 0.5, kes = Math.random() < 0.5;   // kes: doğru yuvarlama aşağı (hatalı öğrenci hep yukarı yuvarlar)
    const ust = ri(1, 8), sag = kes ? ri(1, 4) : ri(5, 9), bin = ri(1, 9), N = yuz ? bin * 1000 + ust * 100 + sag * 10 + ri(1, 9) : bin * 100 + ust * 10 + sag, to = yuz ? 100 : 10;
    const asagi = Math.floor(N / to) * to, yukari = asagi + to, ad = yuz ? 'yüzler' : 'onlar', l0 = `${U.cap(ad)} basamağındaki rakam: ${ust}. Sağındaki rakam: ${sag}`;
    const soru = `${fmtN(N)} sayısını en yakın ${yuz ? 'yüzlüğe' : 'onluğa'} yuvarla.`;
    return kes ? S(soru, [l0, `${sag}, 5'ten küçük: ${ad} basamağı aynı kalır`, `Sonuç: ${fmtN(asagi)}`], fmtN(asagi), [H('yuvarlama_yukari', 1, [l0, `Yuvarlarken ${ad} basamağı hep 1 artar`, `Sonuç: ${fmtN(yukari)}`], fmtN(yukari))], ['yuvarlama_kesme', 'basamak_kayma'])
      : S(soru, [l0, `${sag}, 5'ten küçük değil: ${ad} basamağı 1 artar`, `Sonuç: ${fmtN(yukari)}`], fmtN(yukari), [H('yuvarlama_kesme', 1, [l0, `Sağdaki rakamlar atılır, ${ad} basamağı aynı kalır`, `Sonuç: ${fmtN(asagi)}`], fmtN(asagi))], ['yuvarlama_yukari', 'basamak_kayma']);
  };
  SEN.f_tur = (lv) => {
    let d, w, r; do { d = ri(3, lv === 3 ? 9 : 6); w = ri(1, lv === 3 ? 5 : 3); r = ri(1, d - 1); } while (w === r);
    const n = w * d + r, l0 = `${n} ÷ ${d} işleminde bölüm ${w}, kalan ${r}`;
    return S(`${fr(n, d)} bileşik kesrini tam sayılı kesir olarak yaz.`, [l0, 'Bölüm tam kısım olur, kalan pay olur, payda değişmez', `Sonuç: ${mixed(w, r, d)}`], mixed(w, r, d),
      [H('tamsayili', 1, [l0, 'Kalan tam kısım olur, bölüm pay olur, payda değişmez', `Sonuç: ${mixed(r, w, d)}`], mixed(r, w, d))], ['kesir_tur', 'pay_payda_ters']);
  };
  SEN.f_ondalik = (lv) => {
    const p = ri(1, 9);
    return S(`${fr(p, 100)} kesrini ondalık gösterimle yaz.`, ['Payda 100: virgülden sonra 2 basamak olur', `${p} tek basamaklı: önüne 0 yazılır`, `Sonuç: ${fmtD(p / 100)}`], fmtD(p / 100),
      [H('ondalik_basamak', 0, ['Payda 100: virgülden sonra 1 basamak olur', `${p} virgülden hemen sonra yazılır`, `Sonuç: ${fmtD(p / 10)}`], fmtD(p / 10))], ['ondalik_parca', 'ondalik_okunus']);
  };
  SEN.s_arastirma = (lv) => {
    const konu = pick(['en sevilen meyveyi', 'en çok oynanan oyunu', 'okula nasıl gelindiğini', 'en sevilen dersi']);
    return S(`${pick(NAMES)}, sınıfında ${konu} araştıracak. İlk yapması gereken iş nedir?`, ['Araştırma bir soruyla başlar', 'Soru belli olunca veriler toplanır ve düzenlenir', 'İlk iş: araştırma sorusunu belirleme'], '"Araştırma sorusunu belirleme"',
      [H('adim_sira', 0, ['Araştırma grafik çizmekle başlar', 'Grafik çizilince veriler toplanır', 'İlk iş: veri görselleştirme'], '"Veri görselleştirme"')], ['veri_kaynak', 'anket_kural']);
  };
  SEN.s_daire = (lv) => {
    const [p, k] = pick([[10, 10], [20, 5], [25, 4], [50, 2]]), T = ri(1, 4) * 20, X = pick(pick(CATS).filter(c => !c.includes('.'))).toLocaleLowerCase('tr-TR'), l1 = `${T} ÷ ${k} = ${T / k}`;
    return S(`Daire grafiğine göre ${T} öğrencinin %${p} kadarı ${X} seçmiş. ${U.cap(X)} seçen kaç öğrenci vardır?`, [`%${p}, bütünün ${fr(1, k)} kadarıdır`, l1, `Sonuç: ${T / k} öğrenci`], `${T / k} öğrenci`,
      [H('dilim_oran', 0, [`%${p}, ${p} öğrenci demektir`, 'Başka işlem gerekmez', `Sonuç: ${p} öğrenci`], `${p} öğrenci`)], ['daire_toplam', 'grafik_okuma']);
  };
  SEN.s_okuryazar = (lv) => {
    const T = ri(20, 30), a = ri(Math.floor(T / 2) + 1, T - 4), X = pick(pick(CATS).filter(c => !c.includes('.'))).toLocaleLowerCase('tr-TR'), l0 = `Veri yalnız bu sınıftan toplandı: ${T} öğrenci`;
    return S(`${T} kişilik bir sınıfta ${a} öğrenci ${X} seçti. Bu veriye göre "Okuldaki bütün öğrenciler ${X} sever" denebilir mi?`, [l0, `${X} seçmeyenler de var: ${T} − ${a} = ${T - a} öğrenci`, 'Bir sınıfın verisi bütün okul için kesin yargı vermez'], '"Denemez"',
      [H('asiri_genelleme', 1, [l0, `En çok seçilen ${X}: çoğunluk ne derse herkes için geçerlidir`, 'Bir sınıfın verisi bütün okul için yeterlidir'], '"Denebilir"')], ['grafik_okuma', 'eksen_yanilsama']);
  };
  SEN.e_ozellik = (lv) => {
    const a = ri(3, 9), b = pick([10, 20, 30]), c = ri(2, 9);
    return S(`${a} × (${b} + ${c}) işlemini dağılma özelliğiyle yap.`, [`Dağıt: ${a} × ${b} + ${a} × ${c}`, `${a * b} + ${a * c}`, `Sonuç: ${a * b + a * c}`], String(a * b + a * c),
      [H('dagilma_eksik', 0, [`Dağıt: ${a} × ${b} + ${c}`, `${a * b} + ${c}`, `Sonuç: ${a * b + c}`], String(a * b + c))], ['ozellik_karis', 'oncelik_soldan']);
  };
  SEN.e_algoritma = (lv) => {
    const x = ri(2, 9), m = ri(2, lv === 3 ? 6 : 4), c = ri(2, 9), l0 = `Başla: sayı ${x}`;
    return S(`Bir algoritmanın adımları: Bir. Sayıyı al. İki. Sayıyı ${m} ile çarp. Üç. Sonuca ${c} ekle. Başlangıç sayısı ${x} ise sonuç kaç olur?`,
      [l0, `Önce ${m} ile çarp: ${x} × ${m} = ${x * m}`, `Sonra ${c} ekle: ${x * m} + ${c} = ${x * m + c}`], String(x * m + c),
      [H('algoritma_sira', 1, [l0, `Önce ${c} ekle: ${x} + ${c} = ${x + c}`, `Sonra ${m} ile çarp: ${x + c} × ${m} = ${(x + c) * m}`], String((x + c) * m))], ['karar_dongu', 'dongu_sayma']);
  };
  SEN.p_olay = (lv) => {
    if (Math.random() < 0.5) { const k = ri(3, 9), l0 = `Torbadaki topların hepsi kırmızı: ${k} top`;
      return S(`Bir torbada yalnız ${k} kırmızı top var. Bu torbadan mavi top çekme olayı nasıl bir olaydır?`, [l0, 'Torbada hiç mavi top yok: mavi top asla çekilemez', 'Bu olay imkânsızdır'], '"İmkânsız"',
        [H('olay_tur', 1, [l0, 'Mavi top çekmek zordur ama şans yardım ederse olabilir', 'Bu olay mümkündür'], '"Mümkün"')], ['az_cok', 'olasilik_tercih']); }
    const l0 = 'Sayı küpünün yüzlerindeki sayılar: 1, 2, 3, 4, 5, 6';
    return S('Bir sayı küpü atılıyor. Üst yüze 7 sayısından küçük bir sayı gelmesi nasıl bir olaydır?', [l0, 'Bu sayıların hepsi 7 sayısından küçük: her atışta olur', 'Bu olay kesindir'], '"Kesin"',
      [H('olay_tur', 1, [l0, 'Hangi sayının geleceği önceden bilinemez: kesin denemez', 'Bu olay mümkündür'], '"Mümkün"')], ['az_cok', 'olasilik_tercih']);
  };

  const ADIM = (i, s) => `<span class="adno">${i + 1}</span><span class="adtx">${s}</span>`;
  const HATA_YOK = '✅ Hata yok, hepsi doğru';
  const HSORU = (sc) => `<span class="hsoru">${sc.soru}</span><br>`;
  const hataBul = (sc, ad) => {
    const temiz = Math.random() < 0.2, h = pick(sc.hatalar), sat = temiz ? sc.dogru : h.satirlar;
    // İlk hatadan SONRAKİ satırlar da yanlıştır (hatayı taşır); onları seçmek "doğru adımı hatalı sanma" değil, "hatanın başladığı yeri kaçırma"dır
    const options = sat.map((s, i) => (!temiz && i === h.at) ? { t: ADIM(i, s), ok: true } : { t: ADIM(i, s), ok: false, mis: (!temiz && i > h.at) ? 'hata_ilk' : 'hata_yeri' });
    options.push(temiz ? { t: HATA_YOK, ok: true } : { t: HATA_YOK, ok: false, mis: h.mis });
    return Q({ hata: 'bul', ad, fixed: true, prompt: `${HSORU(sc)}<b>${ad}</b> böyle çözdü. Hata ilk hangi adımda başlıyor? Hiç hata yoksa son şıkkı seç.`, options,
      hataAt: temiz ? null : h.at, duzeltme: temiz ? null : sc.dogru[h.at],
      hint: 'Her adımı kendin yeniden hesapla. Sonucu bozan ilk adımı ara.',
      steps: temiz ? ['Bu çözümde hata yok, her adım doğru.', `Doğru sonuç: ${sc.sonuc}`] : [`Hata ${h.at + 1}. adımda başlıyor: ${h.satirlar[h.at]}`, `Doğrusu: ${sc.dogru[h.at]}`].concat(h.at < sat.length - 1 ? [`Sonraki adımlar bu hatayı taşıdığı için onlar da yanlış.`] : []).concat([`Doğru sonuç: ${sc.sonuc}`]) });
  };
  const kimHakli = (sc, a1, a2) => {
    const h = pick(sc.hatalar), ilkDogru = Math.random() < 0.5;
    const [s1, s2] = ilkDogru ? [sc.sonuc, h.sonuc] : [h.sonuc, sc.sonuc], [d1, d2] = ilkDogru ? [sc.dogru, h.satirlar] : [h.satirlar, sc.dogru];
    const options = [{ t: `${a1} haklı`, ok: ilkDogru, mis: ilkDogru ? undefined : h.mis }, { t: `${a2} haklı`, ok: !ilkDogru, mis: ilkDogru ? h.mis : undefined }];
    const yanlisAd = ilkDogru ? a2 : a1;
    return Q({ hata: 'kim', fixed: true, prompt: `${HSORU(sc)}<b>${a1}</b> ${s1}, <b>${a2}</b> ${s2} buldu. Kim haklı?`, options,
      defter: [{ ad: a1, satirlar: d1, hata: ilkDogru ? null : h.at }, { ad: a2, satirlar: d2, hata: ilkDogru ? h.at : null }],
      hint: 'Soruyu önce kendin çöz, sonra iki çözümü adım adım karşılaştır.',
      steps: [`${U.wk(yanlisAd, 'in')} hatası ${h.at + 1}. adımda: ${h.satirlar[h.at]}`, `Doğrusu: ${sc.dogru[h.at]}`, `Doğru sonuç: ${sc.sonuc}`] });
  };
  const nedenQ = (sc, ad) => {
    const h = pick(sc.hatalar), diger = shuffle([...new Set([...sc.hatalar.map(x => x.mis), ...sc.yakin])].filter(m => m !== h.mis && MIS[m].t !== MIS[h.mis].t)).slice(0, 2);
    const options = shuffle([{ t: MIS[h.mis].t, ok: true }, ...diger.map(m => ({ t: MIS[m].t, ok: false, mis: h.mis }))]);
    return Q({ hata: 'neden', prompt: `${HSORU(sc)}<b>${ad}</b> yanlış sonuç buldu. Hatasının sebebi ne?`, options,
      defter: [{ ad, satirlar: h.satirlar, isaret: h.at }],
      hint: 'İşaretli adıma bak: orada hangi kural unutulmuş?',
      steps: [`İşaretli adım: ${h.satirlar[h.at]}`, `Doğrusu: ${sc.dogru[h.at]}`, MIS[h.mis].fix] });
  };
  // tur: 'bul' | 'kim' | 'neden' (verilmezse seviyeye göre seçilir)
  const hataQ = (id, lv, tur) => {
    const sc = SEN[id](lv), [a1, a2] = shuffle(NAMES).slice(0, 2);
    tur = tur || (lv >= 3 ? pick(['bul', 'bul', 'kim', 'neden']) : pick(['bul', 'kim']));
    return tur === 'bul' ? hataBul(sc, a1) : tur === 'kim' ? kimHakli(sc, a1, a2) : nedenQ(sc, a1);
  };
  // Normal derste (seviye 2–3) soruların ~%15'i Hata Avcısı biçiminde gelir
  for (const id of Object.keys(SEN)) { const base = GEN[id]; GEN[id] = (lv) => (lv >= 2 && Math.random() < 0.15 ? hataQ(id, lv) : base(lv)); }
  const HATA = { ids: Object.keys(SEN), q: hataQ, SEN };

  /* =========================================================
     PROBLEM ATÖLYESİ — çok adımlı, gerçek hayat problemleri (Maarif: problem çözme)
     Her şablon bir problemi 4 aşamaya böler: 1 Anla (ne isteniyor?) · 2 Planla (hangi yol?)
     · 3 Çöz (1–2 ara adım, sayı girişi) · 4 Kontrol (hangi işlem cevabı doğrular?).
     Sonraki adımın metni bir önceki adımın DOĞRU değerini verir: çocuk bir adımda yanılsa da
     hata zincirlenmez, problemi sonuna kadar götürür. Her yanlış şık/sayı bir yanılgıya bağlıdır.
     ========================================================= */
  const PROB = {};
  const P = (o) => o;
  // Şablon alanları: skill, baslik, baglam, anla:[ok, wrongs], plan:[ok, wrongs], coz:[{prompt, answer|options, unit, inputMis, steps, ip}], kontrol:[prompt, ok, wrongs, neden]
  // wrongs: [metin, yanılgı, açıklama] — açıklama (ac) o şıkkı seçen çocuğun hatasını DOĞRUDAN anlatır (genel yanılgı metninden önce gösterilir).
  // inputMis: {v, mis, ac}. ip: ikinci şansta gösterilen, cevabı vermeyen ipucu.
  const PARA = [50, 100, 200, 500];
  PROB.market = () => {
    const ad = pick(NAMES), nd = ri(2, 5), fd = ri(8, 25), nk = ri(2, 6), fk = ri(3, 12), top = nd * fd + nk * fk;
    const ver = PARA.find(v => v > top && v - top !== top), pu = ver - top;
    return P({ skill: 'n_problem', baslik: 'Kırtasiye alışverişi',
      tablo: { verilen: [`${nd} defter, tanesi ${fd} TL`, `${nk} kalem, tanesi ${fk} TL`, `Kasaya ${ver} TL verildi`], ara: ['Toplam tutar'], istenen: 'Para üstü' }, kur: { kartlar: [ver, nd, fd, nk, fk], ornek: `${ver} − (${nd} × ${fd} + ${nk} × ${fk})`, ne: 'para üstünü' },
      baglam: `${ad} kırtasiyeden tanesi ${fd} TL olan ${nd} defter ve tanesi ${fk} TL olan ${nk} kalem aldı. Kasaya ${ver} TL verdi. ${ad} kaç TL para üstü alır?`,
      anla: ['Alacağı para üstü', [['Defterlere ödediği para', 'ara_sonuc', 'Defterlerin parası, cevaba giden yolda bir ara adım. Soru kasadan geri alınacak parayı soruyor.'], ['Ödediği toplam para', 'ara_sonuc', 'Toplam tutar bir ara sonuç. Soru "kaç TL para üstü alır?" diyor: kasadan geri alınan para.'], ['Bir kalemin fiyatı', 'istenen_verilen', `Bir kalemin fiyatı problemde zaten verilmiş (${fk} TL). Soru, verilmeyen yeni bir şeyi soruyor: para üstünü.`]]],
      plan: ['Önce toplam tutarı bulurum, sonra verilen paradan çıkarırım.', [['Verilen paraya toplam tutarı eklerim.', 'ters_islem', 'Para üstü, verilen paradan alışverişin tutarı çıkınca kalan paradır. Eklersek verdiğimizden fazla para çıkar; bu olamaz.'], ['Sadece defterlerin fiyatını verilen paradan çıkarırım.', 'problem_adim', 'Kalemlerin parası da ödenecek. Önce defterlerin ve kalemlerin toplam tutarını bulmalıyız.'], ['Defter ve kalem sayılarını toplarım.', 'istenen_verilen', 'Ürün sayılarını toplamak bize parayı vermez. Her ürünün fiyatını adediyle çarpmalıyız.']]],
      coz: [{ prompt: `${ad} toplam kaç TL ödeyecek?`, answer: top, unit: 'TL', ip: 'Defterlerin parasını ve kalemlerin parasını ayrı ayrı bul, sonra topla.',
          inputMis: [{ v: nd * fd, mis: 'problem_adim', ac: `Bu sadece defterlerin parası (${nd} × ${fd}). Kalemlerin parasını da eklemelisin.` }, { v: nk * fk, mis: 'problem_adim', ac: `Bu sadece kalemlerin parası (${nk} × ${fk}). Defterlerin parasını da eklemelisin.` }, { v: fd + fk, mis: 'problem_adim', ac: 'Bir defterle bir kalemin fiyatını topladın. Her ürünün fiyatını adediyle çarpman gerekiyor.' }],
          steps: [`Defterler: ${nd} × ${fd} = ${nd * fd} TL`, `Kalemler: ${nk} × ${fk} = ${nk * fk} TL`, `Toplam: ${nd * fd} + ${nk * fk} = ${top} TL`] },
        { prompt: `Toplam tutarı ${top} TL bulduk. ${ad} kaç TL para üstü alır?`, answer: pu, unit: 'TL', ip: 'Ödenen para = alışveriş tutarı + para üstü. Buna göre para üstünü nasıl bulursun?',
          inputMis: [{ v: ver + top, mis: 'ters_islem', ac: `Ödenen para = alışveriş tutarı + para üstü. ${ver} = ${top} + para üstü olduğuna göre para üstü = ${ver} − ${top} olmalı.` }, { v: top, mis: 'ara_sonuc', ac: 'Bu alışverişin tutarı, para üstü değil. Kasaya verilen paradan bunu çıkarmalısın.' }],
          steps: ['Ödenen para = alışveriş tutarı + para üstü', `${ver} = ${top} + para üstü`, `Para üstü: ${ver} − ${top} = ${pu} TL`] }],
      kontrol: [`Para üstünü ${pu} TL buldun. Hangi işlem bu cevabı doğrular?`, `${pu} + ${top} = ${ver}`, [[`${ver} + ${top} = ${ver + top}`, 'ters_islem', 'Bu işlem verilen paraya tutarı ekliyor; problemdeki hiçbir şeyi doğrulamaz.'], [`${pu} + ${nd * fd} = ${pu + nd * fd}`, 'problem_adim', 'Sadece defterlerin parasını ekledin. Para üstü ile TOPLAM tutar birlikte verilen paraya eşit olmalı.']], 'Para üstü ile ödenen tutarın toplamı, kasaya verilen paraya eşit olmalı.'],
      derin: [`${ver} − ${nd} × ${fd} − ${nk} × ${fk}`, [[`${ver} − ${nd} × ${fd} + ${nk} × ${fk}`, 'ters_islem', 'Kalemlerin parası da kasaya verilen paradan ÇIKAR; eklenmez.'], [`${ver} − ${nd} − ${fd} − ${nk} − ${fk}`, 'problem_adim', 'Adetleri ve fiyatları ayrı ayrı çıkardın. Her ürünün parası adet × fiyattır.']]] });
  };
  PROB.bahce = () => {
    const a = ri(8, 25), b = ri(4, a - 2), k = ri(2, 4), c = 2 * (a + b), tel = k * c;
    return P({ skill: 'a_cevre', baslik: 'Bahçeye tel çekme',
      tablo: { verilen: [`Uzun kenar ${a} m`, `Kısa kenar ${b} m`, `${k} sıra tel`], ara: ['Bahçenin çevresi'], istenen: 'Gereken toplam tel' }, kur: { kartlar: [2, a, b, k], ornek: `2 × (${a} + ${b}) × ${k}`, ne: 'gereken teli' },
      baglam: `Dikdörtgen biçimindeki bir bahçenin uzun kenarı ${a} m, kısa kenarı ${b} m. Bahçenin etrafı ${k} sıra telle çevrilecek. Kaç metre tel gerekir?`,
      anla: ['Gereken toplam tel uzunluğu', [['Bahçenin alanı', 'cevre_alan', 'Tel bahçenin ETRAFINA çekilir. Etrafın uzunluğu çevredir, alan değil.'], ['Bahçenin bir tur çevresi', 'ara_sonuc', `Bir tur çevre bir ara sonuç. Tel ${k} sıra çekilecek; soru toplam teli soruyor.`], ['Bahçenin uzun kenarı', 'istenen_verilen', `Uzun kenar problemde verilmiş (${a} m). Soru, verilmeyen toplam tel uzunluğunu soruyor.`]]],
      plan: ['Önce çevreyi bulurum, sonra sıra sayısıyla çarparım.', [['Kenarları çarparım, sonra sıra sayısıyla çarparım.', 'cevre_alan', 'Kenarları çarpmak alanı verir. Tel için etraftaki uzunluk, yani çevre gerekir.'], ['İki kenarı toplayıp sıra sayısıyla çarparım.', 'cevre_yarim', 'İki kenar bahçenin sadece yarısını dolaşır. Dikdörtgenin dört kenarı var.'], ['Çevreyi bulurum, sıra sayısını eklerim.', 'problem_adim', `Her sıra bir çevre kadar tel ister. ${k} sıra için çevreyi ${k} ile ÇARPMALIYIZ.`]]],
      coz: [{ prompt: 'Bahçenin çevresi kaç metre?', answer: c, unit: 'm', ip: 'Bahçenin etrafında bir tur dolaşsan hangi kenarlardan geçersin? Hepsini topla.',
          inputMis: [{ v: a + b, mis: 'cevre_yarim', ac: 'Sadece iki kenarı topladın; bu yarım tur. Dört kenarın hepsini topla.' }, { v: a * b, mis: 'cevre_alan', ac: 'Kenarları çarptın; bu alanı verir. Çevre için kenarları topla.' }],
          steps: [`Çevre = ${a} + ${b} + ${a} + ${b}`, `Çevre = ${c} m`] },
        { prompt: `Bahçenin çevresi ${c} m. ${k} sıra için kaç metre tel gerekir?`, answer: tel, unit: 'm', ip: `Bir sıra tel bir çevre kadardır. ${k} sıra kaç çevre eder?`,
          inputMis: [{ v: c + k, mis: 'problem_adim', ac: 'Sıra sayısını ekledin. Her sıra bir çevre kadar tel ister: çevreyi sıra sayısıyla çarp.' }, { v: k * (a + b), mis: 'cevre_yarim', ac: `Yarım çevreyi çarptın. Tam çevreyi (${c} m) kullanmalısın.` }],
          steps: ['Her sıra bir çevre kadar tel ister.', `${k} × ${c} = ${tel} m`] }],
      kontrol: [`Tel uzunluğunu ${tel} m buldun. Hangi işlem bu cevabı doğrular?`, `${tel} ÷ ${k} = ${c}`, [[`${tel} × ${k} = ${tel * k}`, 'ters_islem', 'Bu işlem sayıyı büyütüyor, geriye gitmiyor. Çarpmayı kontrol etmek için bölmeyi kullan.'], [`${tel} − ${k} = ${tel - k}`, 'ters_islem', 'Sıra sayısını çıkarmak anlamlı değil. Toplam teli sıra sayısına bölersen bir sırayı bulursun.']], 'Toplam teli sıra sayısına bölersen bir sıranın uzunluğunu, yani çevreyi bulmalısın.'],
      derin: [`2 × ${k} × (${a} + ${b})`, [[`${k} × (${a} + ${b})`, 'cevre_yarim', 'Parantezdeki iki kenar sadece yarım tur. Tam çevre için 2 ile de çarpmalısın.'], [`${k} × ${a} × ${b}`, 'cevre_alan', 'Kenarları çarpmak alanı verir. Tel için çevre gerekir.']]] });
  };
  PROB.parke = () => {
    const [a, b] = dikKenar(3);
    const f = pick([150, 200, 250, 300, 350, 400]), alan = a * b, tutar = alan * f;
    return P({ skill: 'a_alan', baslik: 'Odaya parke döşeme',
      tablo: { verilen: [`Kenarlar ${a} m ve ${b} m`, `Metrekaresi ${f} TL`], ara: ['Odanın alanı'], istenen: 'Ödenecek toplam para' }, kur: { kartlar: [a, b, f], ornek: `${a} × ${b} × ${f}`, ne: 'ödenecek parayı' },
      baglam: `Kenarları ${a} m ve ${b} m olan dikdörtgen bir odaya parke döşenecek. Parkenin metrekaresi ${f} TL. Parke için kaç TL ödenir?`,
      anla: ['Parkeye ödenecek toplam para', [['Odanın çevresi', 'cevre_alan', 'Parke zemini kaplar. Zeminin büyüklüğü alandır, çevre değil.'], ['Odanın alanı', 'ara_sonuc', 'Alan bir ara sonuç. Soru parke için ödenecek parayı soruyor.'], ['Bir metrekare parkenin fiyatı', 'istenen_verilen', `Metrekare fiyatı problemde verilmiş (${f} TL). Soru toplam ödenecek parayı soruyor.`]]],
      plan: ['Önce alanı bulurum, sonra metrekare fiyatıyla çarparım.', [['Önce çevreyi bulurum, sonra fiyatla çarparım.', 'cevre_alan', 'Parke zemini kaplar. Kaç metrekare olduğunu alan söyler, çevre değil.'], ['Kenarları toplayıp fiyatla çarparım.', 'cevre_alan', 'Kenarları toplamak çevreye götürür. Zemin için kenarları çarpıp alanı bulmalıyız.'], ['Alanı bulurum, fiyatı eklerim.', 'problem_adim', `Her metrekare için ${f} TL ödenir. Metrekare sayısı kadar ÇARPMALIYIZ.`]]],
      coz: [{ prompt: 'Odanın alanı kaç metrekare?', answer: alan, unit: 'm²', ip: 'Zemini 1 metrekarelik karelere bölsen kaç kare olurdu? Kenarları kullan.',
          inputMis: [{ v: 2 * (a + b), mis: 'cevre_alan', ac: 'Bu odanın çevresi. Alan için kenarları çarp.' }, { v: a + b, mis: 'cevre_alan', ac: 'Kenarları topladın. Alan için kenarları çarp.' }],
          steps: [`Alan = ${a} × ${b} = ${alan} m²`] },
        { prompt: `Odanın alanı ${alan} m². Parke için kaç TL ödenir?`, answer: tutar, unit: 'TL', ip: `Her bir metrekare ${f} TL. ${alan} metrekare için hangi işlemi yaparsın?`,
          inputMis: [{ v: 2 * (a + b) * f, mis: 'cevre_alan', ac: `Çevreyle fiyatı çarptın. Alanı (${alan} m²) kullanmalısın.` }, { v: alan + f, mis: 'problem_adim', ac: `Alanla fiyatı topladın. Her metrekare ${f} TL olduğu için çarpmalısın.` }],
          steps: [`Her metrekare ${f} TL.`, `${alan} × ${f} = ${fmtN(tutar)} TL`] }],
      kontrol: [`Parkeye ${fmtN(tutar)} TL ödeneceğini buldun. Hangi işlem bu cevabı doğrular?`, `${fmtN(tutar)} ÷ ${f} = ${alan}`, [[`${fmtN(tutar)} × ${f} = ${fmtN(tutar * f)}`, 'ters_islem', 'Bu işlem sayıyı büyütüyor, geriye gitmiyor. Çarpmayı kontrol etmek için bölmeyi kullan.'], [`${fmtN(tutar)} − ${f} = ${fmtN(tutar - f)}`, 'ters_islem', 'Fiyatı çıkarmak anlamlı değil. Toplam parayı metrekare fiyatına bölersen alanı bulursun.']], 'Toplam parayı metrekare fiyatına bölersen odanın alanını bulmalısın.'],
      derin: [`(${a} × ${f}) × ${b}`, [[`(${a} + ${b}) × ${f}`, 'cevre_alan', `Kenarları toplamak alanı vermez. Zemindeki metrekare sayısı ${a} × ${b}.`], [`${a} × ${b} + ${f}`, 'problem_adim', `Fiyatı eklemek yetmez. Her metrekare için ${f} TL ödenir; çarpmalısın.`]]] });
  };
  PROB.okuma = () => {
    const ad = pick(NAMES), gun = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'], v = shuffle(Array.from({ length: 33 }, (_, i) => i + 8)).slice(0, 5);
    const mx = Math.max(...v), mn = Math.min(...v), fark = mx - mn;
    const tablo = `<table class="atab"><tr><th>Gün</th><th>Sayfa</th></tr>${gun.map((g, i) => `<tr><td>${g}</td><td>${v[i]}</td></tr>`).join('')}</table>`;
    const yan1 = [{ v: mn, mis: 'grafik_okuma', ac: 'Bu en küçük sayı. En ÇOK okuduğu günü, yani en büyük sayıyı ara.' }]; if (v[4] !== mx && v[4] !== mn) yan1.push({ v: v[4], mis: 'grafik_okuma', ac: 'Bu Cuma günü. Tablonun tamamına bakıp en büyük sayıyı bul.' });
    return P({ skill: 's_tablo_sutun', baslik: 'Kitap okuma tablosu',
      tablo: { verilen: ['Her günün sayfa sayısı (tabloda)'], ara: ['En çok okunan sayfa sayısı', 'En az okunan sayfa sayısı'], istenen: 'İkisi arasındaki fark' }, kur: { kartlar: v.slice(), ornek: `${mx} − ${mn}`, ne: 'farkı' },
      baglam: `${ad} bir hafta boyunca okuduğu sayfa sayılarını tabloya yazdı. En çok okuduğu gün, en az okuduğu günden kaç sayfa fazla okudu?${tablo}`,
      anla: ['En çok ve en az okunan günler arasındaki fark', [['Hafta boyunca okunan toplam sayfa', 'fark_toplam', '"Kaç sayfa fazla" bir fark sorusudur, toplam sorusu değil.'], ['En çok okunan günün adı', 'istenen_verilen', 'Soru bir gün adı değil, bir sayı soruyor: kaç sayfa FAZLA okunduğunu.'], ['Cuma günü okunan sayfa', 'istenen_verilen', 'Cuma günü tabloda zaten yazıyor. Soru en çok ve en az okunan günlerin farkını soruyor.']]],
      plan: ['En büyük ve en küçük sayıyı bulurum, büyükten küçüğü çıkarırım.', [['Bütün sayıları toplarım.', 'fark_toplam', 'Hepsini toplamak haftalık toplamı verir. "Kaç fazla" için iki sayının farkına bakılır.'], ['İlk ve son günün sayılarını çıkarırım.', 'grafik_okuma', 'İlk ve son gün en çok ya da en az okunan gün olmayabilir. Önce en büyük ve en küçük sayıyı bul.'], ['En büyük ve en küçük sayıyı toplarım.', 'fark_toplam', '"Kaç fazla" farkı sorar; büyükten küçüğü çıkarmalıyız.']]],
      coz: [{ prompt: 'En çok okuduğu gün kaç sayfa okudu?', answer: mx, unit: 'sayfa', ip: 'Tablodaki bütün sayıları karşılaştır. Hangisi en büyük?', inputMis: yan1, steps: [`Tablodaki en büyük sayı: ${mx}`, `En küçük sayı: ${mn}`] },
        { prompt: `En çok ${mx}, en az ${mn} sayfa okudu. Fark kaç sayfa?`, answer: fark, unit: 'sayfa', ip: 'Büyük sayı küçükten kaç fazla? Hangi işlem bunu söyler?',
          inputMis: [{ v: mx + mn, mis: 'fark_toplam', ac: 'İki sayıyı topladın. "Kaç fazla" sorusunda büyükten küçüğü çıkarırız.' }], steps: [`${mx} − ${mn} = ${fark} sayfa`] }],
      kontrol: [`Farkı ${fark} sayfa buldun. Hangi işlem bu cevabı doğrular?`, `${fark} + ${mn} = ${mx}`, [[`${fark} + ${mx} = ${fark + mx}`, 'ters_islem', 'Farkı büyük sayıya eklemek bir şey doğrulamaz. Farkı KÜÇÜK sayıya eklersen büyük sayıya ulaşmalısın.'], [`${mx} + ${mn} = ${mx + mn}`, 'fark_toplam', 'Bu iki sayının toplamı; farkı kontrol etmez.']], 'Farkı küçük sayıya eklersen büyük sayıyı bulmalısın.'] });
  };
  PROB.terazi = () => {
    let a, b, c; do { a = ri(3, 12); b = ri(2, 9); c = ri(2, a + b - 2); } while (c === a || c === b);
    const sol = a + b, kutu = sol - c;
    return P({ skill: 'e_esitlik', baslik: 'Dengedeki terazi',
      tablo: { verilen: [`Sol kefede ${a} kg ve ${b} kg`, `Sağ kefede ${c} kg ve kutu`, 'Terazi dengede'], ara: ['Sol kefedeki toplam'], istenen: 'Kutunun kütlesi' }, kur: { kartlar: [a, b, c], ornek: `${a} + ${b} − ${c}`, ne: 'kutunun kütlesini' },
      baglam: `Dengedeki bir terazinin sol kefesinde ${a} kg ve ${b} kg ağırlık var. Sağ kefesinde ${c} kg ağırlık ve bir kutu var. Kutu kaç kg?`,
      anla: ['Kutunun kütlesi', [['Sol kefedeki toplam kütle', 'ara_sonuc', 'Sol kefedeki toplam bir ara sonuç. Soru kutunun kaç kg olduğunu soruyor.'], ['Bütün ağırlıkların toplamı', 'denge_bozma', 'Soru tek bir şeyi soruyor: kutunun kütlesi. Bütün ağırlıkları toplamak dengeyi kullanmaz.'], ['Sağ kefedeki ağırlık', 'istenen_verilen', `Sağ kefedeki ağırlık verilmiş (${c} kg). Bilinmeyen, kutunun kütlesi.`]]],
      plan: ['Sol kefedeki toplamı bulurum, sağdaki ağırlığı bu toplamdan çıkarırım.', [['Bütün ağırlıkları toplarım.', 'denge_bozma', 'Terazi dengedeyse iki kefe EŞİTTİR. Hepsini toplamak bu eşitliği kullanmaz.'], ['Sol kefedeki toplam, kutunun kütlesidir.', 'esittir_sonuc', `Sağ kefede kutunun yanında ${c} kg da var. Kutu + ${c} kg, sol kefeye eşit olmalı.`], ['Sol kefedeki toplama sağdaki ağırlığı eklerim.', 'ters_islem', `Kutu ile ${c} kg birlikte sol kefeye eşit. Kutuyu bulmak için toplamdan ${c} kg ÇIKARMALIYIZ.`]]],
      coz: [{ prompt: 'Sol kefede toplam kaç kg var?', answer: sol, unit: 'kg', ip: 'Sol kefede hangi ağırlıklar var? Onları topla.',
          inputMis: [{ v: sol + c, mis: 'denge_bozma', ac: 'Sağdaki ağırlığı da ekledin. Sadece sol kefedekileri topla.' }], steps: [`${a} + ${b} = ${sol} kg`] },
        { prompt: `Sol kefede ${sol} kg var. Terazi dengede olduğuna göre kutu kaç kg?`, answer: kutu, unit: 'kg', ip: `Kutu ile ${c} kg birlikte ${sol} kg ediyor. Kutu kaç kg olmalı?`,
          inputMis: [{ v: sol, mis: 'esittir_sonuc', ac: `Bu sol kefenin tamamı. Sağda kutunun yanında ${c} kg da var; onu çıkarmalısın.` }, { v: sol + c, mis: 'ters_islem', ac: `Ekledin. Kutu + ${c} = ${sol} olduğuna göre kutu = ${sol} − ${c} olmalı.` }],
          steps: [`Sağ kefe de ${sol} kg olmalı: ${c} + kutu = ${sol}`, `Kutu = ${sol} − ${c} = ${kutu} kg`] }],
      kontrol: [`Kutuyu ${kutu} kg buldun. Hangi işlem bu cevabı doğrular?`, `${c} + ${kutu} = ${sol}`, [[`${kutu} + ${sol} = ${kutu + sol}`, 'denge_bozma', 'Kutuyu sol kefeye eklemek dengeyi kontrol etmez. Sağ kefedekileri topla, sol kefeye eşit mi bak.'], [`${a} + ${kutu} = ${a + kutu}`, 'denge_bozma', `Sağ kefede ${a} kg yok. Sağ kefede ${c} kg ve kutu var.`]], 'Sağ kefedeki ağırlıklar toplanınca sol kefedeki toplama eşit olmalı.'],
      derin: [b >= c ? `${a} + (${b} − ${c})` : `${a} − (${c} − ${b})`, [[`${a} + ${b} + ${c}`, 'denge_bozma', `Bütün ağırlıkları toplamak dengeyi kullanmaz. Kutu ile ${c} kg birlikte sol kefeye eşit.`], [`${a} + ${b}`, 'esittir_sonuc', `Bu sol kefenin tamamı. Sağda kutunun yanında ${c} kg da var.`]]] });
  };
  PROB.kumbara = () => {
    // Örüntü: 0. hafta = başlangıç. n hafta sonra n kez artış olur → toplam = başlangıç + n × artış (ilk terim + (n − 1) × artış DEĞİL)
    const ad = pick(NAMES), s = ri(2, 12) * 5, d = pick([5, 10, 15, 20, 25]), n = ri(6, 12), top = s + n * d;
    const tablo = `<table class="atab yatay"><tr><th>Geçen hafta</th><td>0 <small>(başlangıç)</small></td><td>1</td><td>2</td><td>3</td></tr><tr><th>Para (TL)</th><td>${s}</td><td>${s + d}</td><td>${s + 2 * d}</td><td>${s + 3 * d}</td></tr></table>`;
    return P({ skill: 'e_oruntu', baslik: 'Kumbara örüntüsü',
      tablo: { verilen: ['Başlangıç parası (0. hafta)', `${n} hafta`], ara: ['Haftalık artış'], istenen: `${n} hafta sonraki para` },
      baglam: `${U.wk(ad, 'in')} kumbarasındaki para her hafta aynı miktarda artıyor. Tabloda başlangıç ve ilk haftalar var. ${n} hafta sonra kumbarada kaç TL olur?${tablo}`,
      anla: [`${n} hafta sonra kumbaradaki para`, [['Paranın her hafta ne kadar arttığı', 'ara_sonuc', `Haftalık artış bir ara sonuç. Soru ${n} hafta sonraki parayı soruyor.`], ['Kumbarada başta olan para', 'istenen_verilen', `Başlangıç parası tabloda yazıyor (0. hafta: ${s} TL). Soru ${n} hafta SONRASINI soruyor.`], ['Tablodaki son sayı', 'istenen_verilen', `Tablodaki son sayı 3 hafta sonrası. Soru ${n} hafta sonrasını soruyor.`]]],
      plan: ['Haftalık artışı bulurum; toplam = başlangıç + hafta sayısı × artış.', [['Haftalık artışı hafta sayısıyla çarparım, başka bir şey yapmam.', 'baslangic_unutma', `Kumbarada başta ${s} TL vardı; onu eklemezsen sonuç eksik kalır.`], ['Başlangıcı 1. hafta sayıp artışı bir eksik hafta kadar eklerim.', 'baslangic_sira', `Başlangıç 0. haftadır; o anda henüz para eklenmedi. ${n} hafta sonra ${n} kez artış olur.`], ['Tablodaki son sayıya artışı bir kez eklerim.', 'problem_adim', `Bu sadece 4. haftayı verir. ${n}. haftaya ulaşmak için kuralı kullanmalıyız.`]]],
      coz: [{ prompt: 'Kumbaradaki para her hafta kaç TL artıyor?', answer: d, unit: 'TL', ip: 'İki komşu haftadaki parayı karşılaştır. Aradaki fark ne kadar?',
          inputMis: [{ v: s + d, mis: 'grafik_okuma', ac: `Bu 1. haftanın sonundaki toplam para. Artış, iki komşu hafta arasındaki farktır: ${s + d} − ${s}.` }, { v: s, mis: 'istenen_verilen', ac: 'Bu başlangıç parası. Artış için iki komşu haftanın farkına bak.' }],
          steps: [`${s + d} − ${s} = ${d}`, `${s + 2 * d} − ${s + d} = ${d}`, `Her hafta ${d} TL artıyor.`] },
        { prompt: `Para her hafta ${d} TL artıyor. ${n} hafta sonra kumbarada kaç TL olur?`, answer: top, unit: 'TL', ip: 'Toplam = başlangıç + hafta sayısı × artış. Başlangıç tabloda 0. haftada yazıyor.',
          inputMis: [{ v: n * d, mis: 'baslangic_unutma', ac: `Bu sadece ${n} haftada eklenen para. Başta kumbarada olan ${s} TL'yi de eklemelisin.` }, { v: s + (n - 1) * d, mis: 'baslangic_sira', ac: `Başlangıç 0. hafta. ${n} hafta sonra ${n} kez artış olur: ${s} + ${n} × ${d}.` }],
          steps: ['Kural: toplam = başlangıç + hafta sayısı × artış', `${n} × ${d} = ${n * d}`, `${s} + ${n * d} = ${top} TL`] }],
      kontrol: [`${top} TL buldun. Hangisi bu cevabı doğrular?`, `${top} − ${s} = ${n * d} ve ${n * d} ÷ ${d} = ${n} hafta`, [[`${top} + ${s} = ${top + s}`, 'ters_islem', 'Başlangıç parasını bir daha eklemek bir şey doğrulamaz. Sonuçtan başlangıcı ÇIKARIRSAN eklenen parayı bulursun.'], [`${top} − ${d} = ${top - d}`, 'ters_islem', 'Bir haftalık artışı çıkarmak sadece bir önceki haftayı verir; cevabı doğrulamaz.']], 'Sonuçtan başlangıcı çıkarırsan eklenen parayı bulursun; bunu haftalık artışa bölünce hafta sayısına ulaşmalısın.'],
      derin: [`${s + 3 * d} + ${n - 3} × ${d}`, [[`${s + 3 * d} + ${n} × ${d}`, 'problem_adim', `Tablodaki 3. haftadan devam edersen ${n} değil, ${n - 3} hafta daha artış eklenir.`], [`${n} × ${d}`, 'baslangic_unutma', `Başlangıçtaki ${s} TL unutulmuş.`]]] });
  };
  PROB.gezi = () => {
    let o, t, k; do { o = ri(40, 140); t = ri(2, 6); k = pick([14, 16, 18, 20, 25]); } while ((o + t) % k === 0);
    const kisi = o + t, arac = Math.ceil(kisi / k), sadeceOgr = Math.ceil(o / k), artan = kisi % k;
    const yan2 = [{ v: arac - 1, mis: 'kalan_yok', ac: `Bölünce ${artan} kişi arttı. Onlar da geziye gelecek, bir minibüs daha gerekir.` }]; if (sadeceOgr !== arac) yan2.push({ v: sadeceOgr, mis: 'problem_adim', ac: `Sadece öğrencileri böldün. Toplam ${kisi} kişiyi kullanmalısın.` });
    return P({ skill: 'n_carpbol', baslik: 'Okul gezisi',
      tablo: { verilen: [`${o} öğrenci`, `${t} öğretmen`, `Minibüs ${k} kişi alıyor`], ara: ['Toplam kişi sayısı'], istenen: 'En az minibüs sayısı' },
      baglam: `Okul gezisine ${o} öğrenci ve ${t} öğretmen katılacak. Bir minibüs en fazla ${k} kişi alıyor. En az kaç minibüs gerekir?`,
      anla: ['Herkes için gereken en az minibüs sayısı', [['Geziye katılan toplam kişi sayısı', 'ara_sonuc', 'Toplam kişi bir ara sonuç. Soru kaç minibüs gerektiğini soruyor.'], ['Bir minibüsün aldığı kişi sayısı', 'istenen_verilen', `Bu problemde verilmiş (${k} kişi). Soru minibüs sayısını soruyor.`], ['Sadece öğrenciler için gereken minibüs sayısı', 'problem_adim', 'Öğretmenler de geziye katılıyor; herkesin binmesi gerekiyor.']]],
      plan: ['Toplam kişiyi bulurum, minibüsün aldığı kişiye bölerim; artan kişi varsa bir minibüs eklerim.', [['Toplam kişiyi minibüsün aldığı kişiye bölerim, kalanı dikkate almam.', 'kalan_yok', 'Kalan kişiler de geziye gidecek! Artan kişiler için bir minibüs daha gerekir.'], ['Toplam kişiyi minibüsün aldığı kişiyle çarparım.', 'ters_islem', 'Çarparsak çok büyük bir sayı çıkar. Kişileri minibüslere paylaştırmak bölmedir.'], ['Sadece öğrenci sayısını bölerim.', 'problem_adim', 'Öğretmenler de minibüse binecek. Önce toplam kişiyi bulmalıyız.']]],
      coz: [{ prompt: 'Geziye toplam kaç kişi katılacak?', answer: kisi, unit: 'kişi', ip: 'Geziye kimler katılıyor? Hepsini say.',
          inputMis: [{ v: o, mis: 'problem_adim', ac: 'Öğretmenleri unuttun. Öğrencileri ve öğretmenleri topla.' }], steps: [`${o} + ${t} = ${kisi} kişi`] },
        { prompt: `Toplam ${kisi} kişi var. En az kaç minibüs gerekir?`, answer: arac, unit: 'minibüs', ip: `${kisi} kişiyi ${k} kişilik gruplara ayır. Artan kişi kalırsa ne yaparsın?`, inputMis: yan2,
          steps: [`${kisi} ÷ ${k} = ${Math.floor(kisi / k)}, kalan ${artan}`, `Kalan ${artan} kişi için bir minibüs daha: ${arac}`] }],
      kontrol: [`${arac} minibüs buldun. Hangisi bu cevabı doğrular?`, `${arac} × ${k} = ${arac * k} kişilik yer var, ${kisi} kişiye yeter.`, [[`${arac - 1} × ${k} = ${(arac - 1) * k} kişilik yer de yeter.`, 'kalan_yok', `${(arac - 1) * k} kişilik yer ${kisi} kişiye yetmez; ${kisi - (arac - 1) * k} kişi dışarıda kalır.`], [`${kisi} × ${k} = ${kisi * k}`, 'ters_islem', 'Kişi sayısını minibüs kapasitesiyle çarpmak bir şey doğrulamaz. Minibüs sayısı × kapasite, kişi sayısına yetmeli.']], 'Minibüslerdeki toplam yer, geziye katılan kişi sayısından az olmamalı.'] });
  };
  PROB.torba = () => {
    const ad = pick(NAMES), r = ri(2, 6), m = ri(2, 7), y = ri(1, 5), top = r + m + y;
    return P({ skill: 'p_spektrum', baslik: 'Renkli toplar',
      tablo: { verilen: [`${r} kırmızı, ${m} mavi top`, `${y} sarı top eklendi`], ara: ['Yeni toplam top sayısı'], istenen: 'Kırmızı gelme olasılığı' },
      baglam: `Bir torbada ${r} kırmızı ve ${m} mavi top var. ${ad} torbaya ${y} sarı top daha ekledi. Torbadan rastgele bir top çekilirse kırmızı gelme olasılığı kaçtır?`,
      anla: ['Sarılar eklendikten sonra kırmızı gelme olasılığı', [['Torbadaki toplam top sayısı', 'ara_sonuc', 'Toplam top bir ara sonuç. Soru bir olasılık soruyor.'], ['Sarılar eklenmeden önceki olasılık', 'problem_adim', 'Soru, sarılar EKLENDİKTEN sonraki durumu soruyor.'], ['Kırmızı top sayısı', 'istenen_verilen', `Kırmızı top sayısı verilmiş (${r}). Soru kırmızı GELME olasılığını soruyor.`]]],
      plan: ['Yeni toplam top sayısını bulurum; kırmızı topların bütün topların kaçta kaçı olduğunu kesirle gösteririm.', [['Kırmızı topları yalnız mavi toplarla karşılaştırırım; kesrin paydası mavi top sayısı olur.', 'olasilik_oran', 'Kesrin paydası BÜTÜN toplardır, sadece maviler değil.'], ['Sarıları saymadan kırmızıların kaçta kaç olduğunu bulurum.', 'problem_adim', 'Sarılar da torbada ve çekilebilirler. Yeni toplamı kullanmalıyız.'], ['Kesrin payına bütün topları, paydasına kırmızı topları yazarım.', 'pay_payda_ters', 'Pay ile payda yer değiştirmiş. Pay kırmızı topların sayısı (parça), payda bütün topların sayısı (bütün) olmalı.']]],
      coz: [{ prompt: 'Torbada şimdi kaç top var?', answer: top, unit: 'top', ip: 'Torbada hangi renk toplar var? Hepsini topla.',
          inputMis: [{ v: r + m, mis: 'problem_adim', ac: `Sarı topları unuttun. ${y} sarı top da eklendi.` }], steps: [`${r} + ${m} + ${y} = ${top} top`] },
        { prompt: `Torbada ${top} top var, ${r} tanesi kırmızı. Kırmızı gelme olasılığı kaçtır?`, ip: 'Kırmızı toplar, bütün topların kaçta kaçı? (parça / bütün)',
          options: mc(fr(r, top), [[fr(r, r + m), 'problem_adim', `Sarılar eklenmeden önceki toplamı kullandın. Şimdi torbada ${top} top var.`], [fr(r, m + y), 'olasilik_oran', 'Paydaya kırmızı olmayanları koydun. Payda bütün toplar olmalı.'], [fr(top, r), 'pay_payda_ters', 'Pay ile payda ters. Pay kırmızı topların sayısı (parça), payda bütün topların sayısı (bütün) olmalı.']]),
          steps: [`Parça: ${r} kırmızı top. Bütün: ${top} top.`, `Kırmızı toplar bütün topların ${fr(r, top)} kadarı.`] }],
      // Kontrol: 5. sınıfta kesirlerle toplama yok; paydanın bütün topları saydığı toplama ile doğrulanır
      kontrol: [`Kırmızı gelme olasılığını ${fr(r, top)} buldun. Bunu nasıl kontrol edersin?`, `Bütün renkleri say: ${r} + ${m} + ${y} = ${top}; payda ${top} olmalı.`, [[`Kırmızı ve mavileri say: ${r} + ${m} = ${r + m}; payda ${r + m} olmalı.`, 'problem_adim', 'Sarıları unuttun. Sarılar da torbada; payda BÜTÜN topları saymalı.'], ['Olasılık 1\'den büyük de olabilir, kontrol gerekmez.', 'olasilik_buyuk', 'Olasılık en fazla 1 olabilir (kesin olay).']], 'Kesrin paydası torbadaki bütün topların sayısı olmalı; bütün renkleri toplayınca paydayı bulmalısın.'] });
  };
  PROB.ucgen = () => {
    const x = ri(20, 70), u = 90 - x;
    return P({ skill: 'g_ucgen', baslik: 'Üçgen park',
      tablo: { verilen: ['Bir açı 90°', `Bir açı ${x}°`], ara: ['Bilinen iki açının toplamı'], istenen: 'Üçüncü açının ölçüsü' }, kur: { kartlar: [180, 90, x], ornek: `180 − (90 + ${x})`, ne: 'üçüncü açıyı' },
      baglam: `Üçgen biçimindeki bir parkın köşelerinden birindeki açı 90°, diğerindeki açı ${x}°. Üçüncü köşedeki açı kaç derecedir?`,
      anla: ['Üçüncü köşedeki açının ölçüsü', [['Bilinen iki açının toplamı', 'ara_sonuc', 'İki açının toplamı bir ara sonuç. Soru üçüncü açıyı soruyor.'], ['Parkın çevresi', 'istenen_verilen', 'Problemde uzunluk yok, açılar var. Soru bir açının ölçüsünü soruyor.'], ['Üç açının toplamı', 'ucgen_360', 'Üç açının toplamı her üçgende aynıdır (180°). Soru üçüncü açının ölçüsünü soruyor.']]],
      plan: ['Bilinen iki açıyı toplarım, sonucu 180°\'den çıkarırım.', [['Bilinen iki açıyı toplarım, sonucu 360°\'den çıkarırım.', 'ucgen_360', 'Üçgenin iç açılarının toplamı 180°, 360° değil. 360° dörtgenin iç açılarının toplamıdır.'], ['Bilinen iki açıyı toplarım, cevap budur.', 'ara_sonuc', 'İki açının toplamı üçüncü açı değildir. Toplamı 180°\'den çıkarmalısın.'], ['Bilinen iki açının farkını alırım.', 'problem_adim', 'Fark almanın bir dayanağı yok. Üç açının toplamının 180° olduğunu kullan.']]],
      coz: [{ prompt: 'Bilinen iki açının toplamı kaç derece?', answer: 90 + x, unit: '°', ip: `Bilinen açılar 90° ve ${x}°. İkisi birlikte kaç derece eder?`,
          inputMis: [{ v: 90 - x, mis: 'problem_adim', ac: 'Çıkarma yaptın. Bu adımda iki açıyı TOPLAMALISIN.' }], steps: [`90 + ${x} = ${90 + x}°`] },
        { prompt: `Bilinen iki açının toplamı ${90 + x}°. Üçüncü açı kaç derecedir?`, answer: u, unit: '°', ip: `Üç açının toplamı 180°. İkisi birlikte ${90 + x}°. Geriye ne kalır?`,
          inputMis: [{ v: 270 - x, mis: 'ucgen_360', ac: '360°\'den çıkardın. Üçgenin iç açılarının toplamı 180°.' }, { v: 90 + x, mis: 'ara_sonuc', ac: 'Bu iki açının toplamı. 180°\'den çıkararak üçüncü açıyı bul.' }],
          steps: ['Üçgenin iç açıları toplamı 180°.', `180 − ${90 + x} = ${u}°`] }],
      kontrol: [`Üçüncü açıyı ${u}° buldun. Hangi işlem bu cevabı doğrular?`, `90 + ${x} + ${u} = 180`, [[`${u} + ${x} = 90`, 'problem_adim', 'Bu işlem doğru ama 90° açıyı hesaba katmıyor. Üç açının toplamı 180° olmalı.'], [`90 + ${x} = ${90 + x}`, 'problem_adim', 'Bu sadece iki açı. Üçüncüyü de ekleyip 180° bulmalısın.']], 'Üç açıyı toplayınca 180° bulmalısın.'],
      derin: [`90 − ${x}`, [[`180 − ${x}`, 'problem_adim', '90°\'lik açı unutulmuş. Üç açı birlikte 180° eder.'], [`360 − 90 − ${x}`, 'ucgen_360', 'Üçgenin iç açılarının toplamı 180°, 360° değil.']]] });
  };
  PROB.pizza = () => {
    const [a1, a2] = shuffle(NAMES).slice(0, 2); let b, k, n1, n2; do { b = pick([2, 3, 4]); k = b === 4 ? ri(2, 3) : ri(2, 4); n1 = ri(1, b - 1); n2 = ri(1, b * k - 1); } while (n2 === n1 * k);
    const D = b * k, N1 = n1 * k, kazanan = N1 > n2 ? a1 : a2;
    const yanlisMis = (x) => { const [nx, dx] = x === a1 ? [n1, b] : [n2, D], [ny, dy] = x === a1 ? [n2, D] : [n1, b]; return nx > ny ? 'pay_payda_ayri' : dx > dy ? 'payda_buyuk' : 'esit_payda'; };
    const buyukK = kazanan === a1 ? fr(N1, D) : fr(n2, D), kucukK = kazanan === a1 ? fr(n2, D) : fr(N1, D), acK = `Paydalar eşitken payı büyük olan büyüktür: ${buyukK} > ${kucukK}.`;
    return P({ skill: 'f_karsilastir', baslik: 'Pizza yarışı',
      tablo: { verilen: [`${a1} birinin ${fr(n1, b)} kadarını yedi`, `${a2} diğerinin ${fr(n2, D)} kadarını yedi`, 'Pizzalar aynı büyüklükte'], ara: [`Paydası ${D} olan denk kesir`], istenen: 'Kim daha çok yedi' },
      baglam: `Aynı büyüklükteki iki pizzadan ${a1} birinin ${fr(n1, b)} kadarını, ${a2} diğerinin ${fr(n2, D)} kadarını yedi. Kim daha çok pizza yedi?`,
      anla: ['Kimin daha çok pizza yediği', [['İkisinin toplam yediği pizza', 'fark_toplam', 'Soru "kim daha çok?" diyor: bu bir karşılaştırma, toplama değil.'], ['Pizzaların kaç dilime bölündüğü', 'istenen_verilen', 'Dilim sayıları (paydalar) problemde verilmiş. Soru kimin daha çok yediğini soruyor.'], ['Pizzalardan ne kadar kaldığı', 'bos_kisim', 'Soru yenen kısmı soruyor, kalan kısmı değil.']]],
      plan: ['Paydaları eşitlerim (denk kesir), sonra payları karşılaştırırım.', [['Paydası büyük olan kesir daha büyüktür, ona bakarım.', 'payda_buyuk', 'Payda büyüdükçe dilimler KÜÇÜLÜR. Paydaya bakarak karar verilmez.'], ['Sadece paylara bakarım, payı büyük olan daha büyüktür.', 'pay_payda_ayri', 'Paydalar farklıyken dilimler farklı büyüklüktedir; sadece paya bakılmaz. Önce paydaları eşitle.'], ['Pay ve paydaya aynı sayıyı ekleyip karşılaştırırım.', 'denk_toplama', 'Aynı sayıyı eklemek kesrin değerini değiştirir. Denk kesir için pay ve paydayı aynı sayıyla ÇARPMALIYIZ.']]],
      coz: [{ prompt: `${fr(n1, b)} kesrini paydası ${D} olan denk kesre çevir. Pay kaç olur?`, answer: N1, unit: '', ip: `Payda ${b} iken ${D} oldu. Kaç ile çarpıldı? Paya da aynısını yap.`,
          inputMis: [{ v: n1 + D - b, mis: 'denk_toplama', ac: `Paya ekleme yaptın. Payda ${k} ile çarpıldıysa pay da ${k} ile çarpılır.` }, { v: n1, mis: 'denk_toplama', ac: `Payı değiştirmedin. Payda ${k} katına çıktıysa pay da ${k} katına çıkmalı.` }],
          steps: [`Payda ${b} → ${D}: ${k} ile çarpıldı.`, `Pay da ${k} ile çarpılır: ${n1} × ${k} = ${N1} → ${fr(N1, D)}`] },
        { prompt: `${fr(n1, b)} = ${fr(N1, D)} oldu. ${fr(N1, D)} ile ${fr(n2, D)} karşılaştırılınca kim daha çok yemiş?`, ip: 'Paydalar eşit. Hangisinin payı büyük?',
          options: [{ t: a1, ok: kazanan === a1, mis: kazanan === a1 ? undefined : yanlisMis(a1), ac: kazanan === a1 ? undefined : acK }, { t: a2, ok: kazanan === a2, mis: kazanan === a2 ? undefined : yanlisMis(a2), ac: kazanan === a2 ? undefined : acK }], fixed: true,
          steps: ['Paydalar eşit: payı büyük olan büyüktür.', `${buyukK} > ${kucukK} → ${kazanan} daha çok yedi.`] }],
      kontrol: [`${kazanan} daha çok yedi dedin. Hangisi bu cevabı doğrular?`, `Paydalar eşitlenince ${buyukK} > ${kucukK} oluyor.`, [[`${b} < ${D} olduğu için paydası ${D} olan kesir daha büyüktür.`, 'payda_buyuk', 'Payda büyüdükçe dilimler küçülür; paydaya bakarak karar verilmez.'], ['Payı büyük olan kesir her zaman daha büyüktür.', 'pay_payda_ayri', 'Bu her zaman doğru değil; paydalar farklıysa yanılırsın. Önce paydaları eşitle.']], 'Paydaları eşit kesirlerde payı büyük olan daha büyüktür.'] });
  };
  // ---- 10.11.2026: 5 yeni şablon (bütçe, halı, anket, bozuk para, elma kasası) ----
  PROB.butce = () => {
    const ad = pick(NAMES); let B, a, b, top, kalan;
    do { B = ri(8, 19) * 100 + ri(0, 9) * 10; a = ri(121, 479); b = ri(121, 479); top = a + b; kalan = B - top; } while (a === b || kalan < 60 || kalan === top || kalan === a || kalan === b || B - a === kalan);
    const yan1 = [{ v: a, mis: 'problem_adim', ac: `Bu yalnız ayakkabının fiyatı. Montun fiyatını (${b} TL) da eklemelisin.` }, { v: Math.abs(a - b), mis: 'fark_toplam', ac: 'İki fiyatın farkını aldın. Harcanan para, iki fiyatın TOPLAMIDIR.' }];
    if (a % 10 + b % 10 >= 10) yan1.push({ v: top - 10, mis: 'elde_unutma', ac: 'Birler basamağındaki toplam 10\'u geçti; eldeyi onlar basamağına eklemeyi unuttun.' });
    return P({ skill: 'n_toplacikar', baslik: 'Kumbara bütçesi',
      tablo: { verilen: [`Kumbarada ${fmtN(B)} TL`, `Ayakkabı ${a} TL`, `Mont ${b} TL`], ara: ['Harcanan toplam para'], istenen: 'Kumbarada kalan para' }, kur: { kartlar: [B, a, b], ornek: `${fmtN(B)} − (${a} + ${b})`, ne: 'kalan parayı' },
      baglam: `${U.wk(ad, 'in')} kumbarasında ${fmtN(B)} TL vardı. ${a} TL'ye bir ayakkabı, ${b} TL'ye bir mont aldı. Kumbarasında kaç TL kaldı?`,
      anla: ['Kumbarada kalan para', [['Harcadığı toplam para', 'ara_sonuc', 'Harcanan para bir ara sonuç. Soru kumbarada KALAN parayı soruyor.'], ['Ayakkabının fiyatı', 'istenen_verilen', `Ayakkabının fiyatı problemde verilmiş (${a} TL). Soru verilmeyen bir şeyi soruyor.`], ['Başta kumbarada olan para', 'istenen_verilen', `Baştaki para problemde yazıyor (${fmtN(B)} TL). Soru alışverişten SONRA kalanı soruyor.`]]],
      plan: ['Önce harcadığı toplam parayı bulurum, sonra kumbaradaki paradan çıkarırım.', [['Kumbaradaki paraya harcadıklarını eklerim.', 'ters_islem', 'Harcanan para kumbaradan ÇIKAR. Eklersek para artmış olur; bu olamaz.'], ['Sadece ayakkabının fiyatını kumbaradaki paradan çıkarırım.', 'problem_adim', 'Mont da alındı. Önce iki ürünün toplam fiyatını bulmalıyız.'], ['Ayakkabı ile montun fiyat farkını bulurum.', 'fark_toplam', 'Fark hangisinin daha pahalı olduğunu söyler; harcanan parayı değil. Harcanan para iki fiyatın toplamıdır.']]],
      coz: [{ prompt: `${ad} toplam kaç TL harcadı?`, answer: top, unit: 'TL', ip: 'Aldığı iki ürünün fiyatlarını birleştir.', inputMis: yan1,
          steps: [`Ayakkabı ve mont: ${a} + ${b} = ${top} TL`] },
        { prompt: `Toplam ${top} TL harcadı. Kumbarasında kaç TL kaldı?`, answer: kalan, unit: 'TL', ip: 'Baştaki paradan harcanan para çıkınca geriye ne kalır?',
          inputMis: [{ v: B + top, mis: 'ters_islem', ac: `Harcanan parayı ekledin. Harcanan para kumbaradan çıkar: ${fmtN(B)} − ${top}.` }, { v: top, mis: 'ara_sonuc', ac: 'Bu harcanan para, kalan değil. Baştaki paradan bunu çıkarmalısın.' }, { v: B - a, mis: 'problem_adim', ac: `Sadece ayakkabıyı çıkardın. Toplam harcamayı (${top} TL) çıkarmalısın.` }],
          steps: [`Kalan = baştaki para − harcanan para`, `${fmtN(B)} − ${top} = ${fmtN(kalan)} TL`] }],
      kontrol: [`Kalan parayı ${fmtN(kalan)} TL buldun. Hangi işlem bu cevabı doğrular?`, `${fmtN(kalan)} + ${top} = ${fmtN(B)}`, [[`${fmtN(B)} + ${top} = ${fmtN(B + top)}`, 'ters_islem', 'Baştaki paraya harcamayı eklemek hiçbir şeyi doğrulamaz. Kalan + harcanan, baştaki paraya eşit olmalı.'], [`${fmtN(kalan)} + ${a} = ${fmtN(kalan + a)}`, 'problem_adim', 'Sadece ayakkabıyı ekledin. Kalan para ile TOPLAM harcama birlikte baştaki paraya eşit olmalı.']], 'Kalan para ile harcanan paranın toplamı, başta kumbarada olan paraya eşit olmalı.'],
      derin: [`${fmtN(B)} − ${a} − ${b}`, [[`${fmtN(B)} − ${a} + ${b}`, 'ters_islem', 'Montun parası da kumbaradan ÇIKAR; eklenmez.'], [`${a} + ${b}`, 'ara_sonuc', 'Bu yalnız harcanan para; kumbarada kalanı vermez.']]] });
  };
  PROB.hali = () => {
    let a, b; do { [a, b] = dikKenar(4); } while (a * b === a + b || 2 * (a + b) - a === a * b || (a + b) === a * b);
    const P2 = 2 * (a + b), yari = a + b, alan = a * b;
    const yan1 = [{ v: P2 - a, mis: 'ters_cevre', ac: `Çevrede uzun kenar İKİ kez var. Önce çevreyi ikiye böl (${yari}), sonra uzun kenarı çıkar.` }, { v: yari, mis: 'ara_sonuc', ac: `Bu iki kenarın toplamı (yarım çevre). Uzun kenarı (${a} m) da çıkarmalısın.` }];
    return P({ skill: 'a_cevre_alan', baslik: 'Odaya halı',
      tablo: { verilen: [`Çevresi ${P2} m`, `Uzun kenarı ${a} m`], ara: ['Kısa kenar'], istenen: 'Gereken halının alanı' },
      baglam: `Dikdörtgen biçimindeki bir odanın çevresi ${P2} m, uzun kenarı ${a} m. Odanın tabanının tamamına halı serilecek. Kaç metrekare halı gerekir?`,
      anla: ['Gereken halının alanı', [['Odanın çevresi', 'istenen_verilen', `Çevre problemde verilmiş (${P2} m). Soru halının kaç metrekare olacağını soruyor.`], ['Odanın kısa kenarı', 'ara_sonuc', 'Kısa kenar bir ara sonuç. Soru gereken halıyı soruyor.'], ['Odanın etrafına gereken şerit uzunluğu', 'cevre_alan', 'Halı tabanı kaplar. Etraftaki uzunluk değil, tabanın alanı gerekir.']]],
      plan: ['Çevreyi ikiye bölüp uzun kenarı çıkarırım; kısa kenarı bulunca iki kenarı çarparım.', [['Çevreden uzun kenarı çıkarırım, bulduğum sayı kısa kenardır.', 'ters_cevre', 'Çevrede uzun kenar iki kez var. Önce çevreyi ikiye bölmelisin.'], ['Çevre ile uzun kenarı çarparım.', 'cevre_alan', 'Çevre ile kenarı çarpmak alanı vermez. Alan için iki kenarı çarparız; önce kısa kenarı bulmalıyız.'], ['Kısa kenarı bulurum, iki kenarı toplarım.', 'cevre_alan', 'Kenarları toplamak çevreye götürür. Taban için kenarları çarpıp alanı bulmalıyız.']]],
      coz: [{ prompt: 'Odanın kısa kenarı kaç metre?', answer: b, unit: 'm', ip: 'Çevrede her kenar iki kez var. Bir uzun ve bir kısa kenar çevrenin kaçta kaçıdır?', inputMis: yan1,
          steps: [`Bir uzun + bir kısa kenar: ${P2} ÷ 2 = ${yari}`, `Kısa kenar: ${yari} − ${a} = ${b} m`] },
        { prompt: `Kısa kenar ${b} m. Kaç metrekare halı gerekir?`, answer: alan, unit: 'm²', ip: 'Tabanı 1 metrekarelik karelere bölsen kaç kare olurdu? Kenarları kullan.',
          inputMis: [{ v: P2, mis: 'cevre_alan', ac: 'Bu odanın çevresi. Halı için alan gerekir: kenarları çarp.' }, { v: yari, mis: 'cevre_alan', ac: 'Kenarları topladın. Alan için kenarları çarp.' }],
          steps: [`Alan = ${a} × ${b} = ${alan} m²`] }],
      kontrol: [`${alan} m² buldun. Hangisi bu cevabı doğrular?`, `${alan} ÷ ${a} = ${b} ve ${a} + ${b} + ${a} + ${b} = ${P2}`, [[`${alan} + ${P2} = ${alan + P2}`, 'cevre_alan', 'Alanla çevreyi toplamak hiçbir şeyi doğrulamaz.'], [`${alan} − ${a} = ${alan - a}`, 'ters_islem', 'Kenarı alandan çıkarmak anlamlı değil. Alanı kenara BÖLERSEN öbür kenarı bulursun.']], 'Alanı uzun kenara bölünce kısa kenarı bulmalısın; dört kenar toplanınca da verilen çevre çıkmalı.'],
      derin: [`${a} × (${P2} ÷ 2 − ${a})`, [[`${a} × (${P2} − ${a})`, 'ters_cevre', 'Çevreyi ikiye bölmeden uzun kenarı çıkardın; kısa kenar yanlış çıkar.'], [`${a} + (${P2} ÷ 2 − ${a})`, 'cevre_alan', 'Kenarları topladın; alan için çarpmalısın.']]] });
  };
  // [bütünü kaça böler, okunuşu, iyelik eki (%50'si), ilgi eki (%50'nin)]
  const YUZDE_PAY = { 50: [2, 'yarısı', 'si', 'nin'], 25: [4, 'dörtte biri', 'i', 'in'], 20: [5, 'beşte biri', 'si', 'nin'], 10: [10, 'onda biri', 'u', 'un'] };
  PROB.anket = () => {
    const [X, Y] = shuffle(['futbolu', 'voleybolu', 'basketbolu', 'yüzmeyi', 'tenisi']).slice(0, 2);
    let T, p1, p2, x, y, fark;
    do { T = pick([20, 40, 60, 80]); [p1, p2] = pick([[50, 25], [50, 20], [50, 10], [25, 10], [20, 10], [50, 25]]); x = T / YUZDE_PAY[p1][0]; y = T / YUZDE_PAY[p2][0]; fark = x - y; } while (fark === p1 - p2 || fark === y || x + y === fark);
    const ad = (s) => s.replace(/(u|yi|i)$/, (m) => ({ u: '', yi: '', i: '' })[m]).replace(/futbol$/, 'Futbol').replace(/voleybol$/, 'Voleybol').replace(/basketbol$/, 'Basketbol').replace(/yüzme$/, 'Yüzme').replace(/tenis$/, 'Tenis');
    const Xa = ad(X), Ya = ad(Y), d1 = YUZDE_PAY[p1][0], d2 = YUZDE_PAY[p2][0];
    return P({ skill: 's_daire', baslik: 'Spor anketi',
      tablo: { verilen: [`${T} öğrenci katıldı`, `%${p1} ${X} seçti`, `%${p2} ${Y} seçti`], ara: [`${Xa} seçenlerin sayısı`, `${Ya} seçenlerin sayısı`], istenen: 'İki sayı arasındaki fark' },
      baglam: `Bir ankete ${T} öğrenci katıldı. Daire grafiğine göre öğrencilerin %${p1}'${YUZDE_PAY[p1][2]} ${X}, %${p2}'${YUZDE_PAY[p2][2]} ${Y} seçti. ${Xa} seçenler, ${Ya.toLocaleLowerCase('tr-TR')} seçenlerden kaç kişi fazladır?`,
      anla: ['İki sporu seçenlerin sayıca farkı', [[`${Xa} seçenlerin sayısı`, 'ara_sonuc', 'Bu bir ara sonuç. Soru iki sporu seçenler arasındaki FARKI soruyor.'], ['İki sporu seçenlerin toplamı', 'fark_toplam', '"Kaç kişi fazla" bir fark sorusudur, toplam sorusu değil.'], ['Ankete katılan öğrenci sayısı', 'istenen_verilen', `Katılan öğrenci sayısı problemde verilmiş (${T}).`]]],
      plan: ['Yüzdelerden iki sporu seçenlerin sayısını bulurum, büyükten küçüğü çıkarırım.', [['Yüzdeleri çıkarırım; çıkan sayı kişi sayısıdır.', 'dilim_oran', `Yüzde, kişi sayısı değildir. %${p1}, ${T} öğrencinin bir parçasıdır; önce kaç kişi ettiğini bulmalıyız.`], ['İki sporu seçenlerin sayısını toplarım.', 'fark_toplam', '"Kaç kişi fazla" farkı sorar; büyükten küçüğü çıkarmalıyız.'], ['Daire grafiğinde büyük dilimi bulurum; cevap budur.', 'grafik_okuma', 'Büyük dilim hangi sporun önde olduğunu söyler; kaç kişi fark olduğunu söylemez.']]],
      coz: [{ prompt: `${Xa} seçen kaç öğrenci var?`, answer: x, unit: 'öğrenci', ip: `%${p1}, bütünün kaçta kaçıdır? Bütün, ankete katılan bütün öğrencilerdir.`,
          inputMis: [{ v: p1, mis: 'dilim_oran', ac: `%${p1}, ${p1} öğrenci demek değildir. ${T} öğrencinin ${YUZDE_PAY[p1][1]} kadarıdır.` }],
          steps: [`%${p1}, bütünün ${YUZDE_PAY[p1][1]}`, `${T} ÷ ${d1} = ${x} öğrenci`] },
        { prompt: `${Xa} seçen ${x} öğrenci var. ${Ya} seçenlerden kaç kişi fazladır?`, answer: fark, unit: 'öğrenci', ip: `Önce %${p2}'${YUZDE_PAY[p2][3]} kaç öğrenci ettiğini bul. Sonra iki sayıyı karşılaştır.`,
          inputMis: [{ v: p1 - p2, mis: 'dilim_oran', ac: 'Yüzdeleri çıkardın; bu kişi sayısı değil. Önce iki sporun öğrenci sayısını bul.' }, { v: x + y, mis: 'fark_toplam', ac: 'İki sayıyı topladın. "Kaç kişi fazla" sorusunda büyükten küçüğü çıkarırız.' }, { v: y, mis: 'ara_sonuc', ac: `Bu ${Ya.toLocaleLowerCase('tr-TR')} seçenlerin sayısı. Farkı bulmak için ${x} sayısından çıkarmalısın.` }],
          steps: [`%${p2}, bütünün ${YUZDE_PAY[p2][1]}: ${T} ÷ ${d2} = ${y} öğrenci`, `Fark: ${x} − ${y} = ${fark} öğrenci`] }],
      kontrol: [`Farkı ${fark} öğrenci buldun. Hangi işlem bu cevabı doğrular?`, `${fark} + ${y} = ${x}`, [[`${fark} + ${x} = ${fark + x}`, 'ters_islem', 'Farkı büyük sayıya eklemek bir şey doğrulamaz. Farkı KÜÇÜK sayıya eklersen büyük sayıyı bulmalısın.'], [`${x} + ${y} = ${x + y}`, 'fark_toplam', 'Bu iki sayının toplamı; farkı kontrol etmez.']], 'Farkı küçük sayıya eklersen büyük sayıyı bulmalısın.'],
      derin: [`${T} ÷ ${d1} − ${T} ÷ ${d2}`, [[`${p1} − ${p2}`, 'dilim_oran', 'Yüzdeleri çıkarmak kişi sayısını vermez.'], [`${T} ÷ ${d1} + ${T} ÷ ${d2}`, 'fark_toplam', 'Bu iki sayının toplamı; fark gerekiyor.']]] });
  };
  PROB.bozuk = () => {
    const ad = pick(NAMES); let L, c50, c25, k; do { L = ri(1, 5); c50 = ri(2, 7); c25 = ri(1, 7); k = 50 * c50 + 25 * c25; } while (k % 100 === 0 || c50 + c25 === k);
    const tl = (v) => `${fmtD(v, 2)} TL`, top = L + k / 100, kurusTop = 100 * L + k;
    return P({ skill: 'f_ondalik', baslik: 'Bozuk paralar',
      tablo: { verilen: [`${L} tane 1 TL`, `${c50} tane 50 kuruş`, `${c25} tane 25 kuruş`], ara: ['Bozuk paraların kuruş olarak toplamı'], istenen: 'Kumbaradaki toplam para (TL)' },
      baglam: `${U.wk(ad, 'in')} kumbarasından ${L} tane 1 TL, ${c50} tane 50 kuruş ve ${c25} tane 25 kuruş çıktı. Kumbarada toplam kaç TL var?`,
      anla: ['Kumbaradaki toplam para (TL olarak)', [['Kumbaradaki paraların adedi', 'problem_adim', 'Soru kaç tane para olduğunu değil, hepsinin birlikte kaç TL ettiğini soruyor.'], ['Bozuk paraların kuruş olarak toplamı', 'ara_sonuc', 'Kuruşların toplamı bir ara sonuç. Soru hepsinin kaç TL ettiğini soruyor.'], ['50 kuruşların sayısı', 'istenen_verilen', `50 kuruşların sayısı problemde verilmiş (${c50}).`]]],
      plan: ['Bozuk paraları kuruş olarak toplarım, kuruşu liraya çevirip 1 TL\'leri eklerim.', [['Bütün paraların adedini toplarım.', 'problem_adim', 'Adet, paranın değerini söylemez. Her paranın değerini adediyle çarpmalıyız.'], ['Kuruşları liralarla doğrudan toplarım.', 'fiyat_okuma', 'Lira ile kuruş doğrudan toplanmaz. 100 kuruş 1 TL eder; önce aynı birime çevirmeliyiz.'], ['Sadece 1 TL\'leri sayarım; kuruşlar para sayılmaz.', 'problem_adim', 'Kuruşlar da paradır. Onlar da toplama girer.']]],
      coz: [{ prompt: '50 kuruşlar ve 25 kuruşlar birlikte kaç kuruş eder?', answer: k, unit: 'kuruş', ip: 'Her bozuk paranın değerini adediyle çarp, sonra topla.',
          inputMis: [{ v: c50 + c25, mis: 'problem_adim', ac: 'Paraların adedini topladın. Her paranın değerini adediyle çarp: 50 kuruşlar ve 25 kuruşlar ayrı ayrı.' }, { v: 50 * c50, mis: 'problem_adim', ac: `Bu yalnız 50 kuruşlar. 25 kuruşları (${c25} tane) da eklemelisin.` }],
          steps: [`50 kuruşlar: ${c50} × 50 = ${50 * c50} kuruş`, `25 kuruşlar: ${c25} × 25 = ${25 * c25} kuruş`, `Toplam: ${50 * c50} + ${25 * c25} = ${k} kuruş`] },
        { prompt: `Bozuk paralar ${k} kuruş ediyor. Kumbarada toplam kaç TL var?`, ip: '100 kuruş 1 TL eder. Kuruşları liraya çevir, sonra 1 TL\'leri ekle.',
          options: mc(tl(top), [[`${L + k} TL`, 'fiyat_okuma', 'Kuruşu lira gibi topladın. 100 kuruş 1 TL eder; önce kuruşu liraya çevirmelisin.'], [`${L},${k} TL`, 'ondalik_basamak', `Kuruşu virgülden sonra olduğu gibi yazdın. ${k} kuruş, ${Math.floor(k / 100)} TL ve ${k % 100} kuruştur; virgülden sonra 2 basamak olur.`], [tl(k / 100), 'problem_adim', `${L} tane 1 TL'yi unuttun. Onları da eklemelisin.`]]),
          steps: [`${k} kuruş = ${tl(k / 100)}`, `${L} TL + ${tl(k / 100)} = ${tl(top)}`] }],
      kontrol: [`${tl(top)} buldun. Hangisi bu cevabı doğrular?`, `${L} TL = ${100 * L} kuruş; ${100 * L} + ${k} = ${kurusTop} kuruş; ${kurusTop} kuruş = ${tl(top)}`, [[`${L} + ${k} = ${L + k}`, 'fiyat_okuma', 'Lira ile kuruş doğrudan toplanmaz; önce aynı birime çevirmelisin.'], [`${L} + ${c50} + ${c25} = ${L + c50 + c25}`, 'problem_adim', 'Paraların adedini saydın; değerlerini değil.']], 'Hepsini kuruşa çevirip toplayınca aynı tutara ulaşmalısın; 100 kuruş 1 TL eder.'] });
  };
  PROB.kasa = () => {
    let k, kasa, f, N; do { k = pick([12, 15, 20, 24, 25]); kasa = ri(6, 28); f = pick([40, 50, 60, 75, 80, 120, 150]); N = kasa * k; } while (kasa === f || kasa * f === N * f || kasa + f === kasa * f);
    const tut = kasa * f;
    return P({ skill: 'n_carpbol', baslik: 'Elma kasaları',
      tablo: { verilen: [`${N} elma`, `Bir kasaya ${k} elma`, `Bir kasa ${f} TL`], ara: ['Kasa sayısı'], istenen: 'Kazanılan toplam para' }, kur: { kartlar: [N, k, f], ornek: `${N} ÷ ${k} × ${f}`, ne: 'kazanılan parayı' },
      baglam: `Bir bahçeden ${N} elma toplandı. Elmalar her kasaya ${k} tane olacak biçimde yerleştirildi. Bir kasa elma ${f} TL'ye satıldı. Bütün kasalar satılınca kaç TL kazanılır?`,
      anla: ['Satıştan kazanılan toplam para', [['Kasa sayısı', 'ara_sonuc', 'Kasa sayısı bir ara sonuç. Soru kazanılan parayı soruyor.'], ['Bir kasanın fiyatı', 'istenen_verilen', `Bir kasanın fiyatı problemde verilmiş (${f} TL).`], ['Toplanan elma sayısı', 'istenen_verilen', `Elma sayısı problemde verilmiş (${N}).`]]],
      plan: ['Elmaları kasalara bölerim, kasa sayısını bir kasanın fiyatıyla çarparım.', [['Elma sayısını bir kasanın fiyatıyla çarparım.', 'problem_adim', 'Fiyat bir ELMANIN değil, bir KASANIN fiyatı. Önce kaç kasa olduğunu bulmalıyız.'], ['Elma sayısını bir kasadaki elma sayısıyla çarparım.', 'ters_islem', 'Elmaları kasalara paylaştırmak bölmedir. Çarparsak çok büyük bir sayı çıkar.'], ['Kasa sayısına bir kasanın fiyatını eklerim.', 'problem_adim', `Her kasa için ${f} TL kazanılır. Kasa sayısı kadar ÇARPMALIYIZ.`]]],
      coz: [{ prompt: 'Kaç kasa elma oldu?', answer: kasa, unit: 'kasa', ip: `${N} elmayı ${k} elmalık gruplara ayırırsan kaç grup olur?`,
          inputMis: [{ v: N * k, mis: 'ters_islem', ac: 'Çarptın. Elmaları kasalara paylaştırmak bölmedir.' }, { v: N - k, mis: 'ters_islem', ac: 'Bir kasa kadar elma çıkardın. Kaç kasa olduğunu bölme söyler.' }],
          steps: [`${N} ÷ ${k} = ${kasa} kasa`] },
        { prompt: `${kasa} kasa elma var. Hepsi satılınca kaç TL kazanılır?`, answer: tut, unit: 'TL', ip: `Bir kasa ${f} TL. ${kasa} kasa için hangi işlemi yaparsın?`,
          inputMis: [{ v: kasa + f, mis: 'problem_adim', ac: `Kasa sayısıyla fiyatı topladın. Her kasa ${f} TL olduğu için çarpmalısın.` }, { v: N * f, mis: 'problem_adim', ac: 'Elma sayısıyla çarptın. Fiyat bir KASANIN fiyatı; kasa sayısıyla çarpmalısın.' }],
          steps: [`Her kasa ${f} TL.`, `${kasa} × ${f} = ${fmtN(tut)} TL`] }],
      kontrol: [`${fmtN(tut)} TL buldun. Hangi işlem bu cevabı doğrular?`, `${fmtN(tut)} ÷ ${f} = ${kasa}`, [[`${fmtN(tut)} × ${f} = ${fmtN(tut * f)}`, 'ters_islem', 'Bu işlem sayıyı büyütüyor, geriye gitmiyor. Çarpmayı kontrol etmek için bölmeyi kullan.'], [`${fmtN(tut)} − ${f} = ${fmtN(tut - f)}`, 'ters_islem', 'Fiyatı çıkarmak anlamlı değil. Toplam parayı bir kasanın fiyatına bölersen kasa sayısını bulursun.']], 'Toplam parayı bir kasanın fiyatına bölersen kasa sayısını bulmalısın.'],
      derin: [`${f} × ${N} ÷ ${k}`, [[`${N} × ${f}`, 'problem_adim', 'Fiyat bir kasanın fiyatı; elma sayısıyla çarpılmaz.'], [`${N} ÷ ${k} + ${f}`, 'problem_adim', 'Kasa sayısına fiyatı ekledin; çarpmalısın.']]] });
  };
  const ASAMA = { anla: 'Anla', plan: 'Planla', tahmin: 'Tahmin et', coz: 'Çöz', kontrol: 'Kontrol et', derin: 'Derinleştir', bagimsiz: 'Kendin dene' };
  const ASAMA_IP = {
    anla: 'Problemin son cümlesini oku. Sorulan şey problemde verilmiş bir sayı mı, yoksa bulmamız gereken yeni bir şey mi?',
    plan: 'Cevabı bulmadan önce hangi ara sonucu bilmen gerekiyor? O ara sonucu hangi işlem verir?',
    kontrol: 'Bulduğun cevaptan geriye doğru git: ters işlemle problemdeki bilinen bir sayıya ulaşabiliyor musun?',
    tahmin: 'Sayıları yuvarla (örneğin 23 yerine 20 düşün) ve kafandan yaklaşık hesapla. Sonuç büyük mü çıkmalı, küçük mü?',
    gerekce: 'Bu işlem, bulduğun cevaptan problemdeki hangi bilgiye geri dönüyor?',
    derin: 'Her işlemi sırayla hesapla (önce parantez, sonra çarpma, sonra toplama ve çıkarma). Hangisi aynı sonucu veriyor?',
  };
  const BIRIM = { TL: 'TL', m: 'metre', 'm²': 'metrekare', kg: 'kilogram', sayfa: 'sayfa', '°': 'derece', 'kişi': 'kişi', 'minibüs': 'minibüs', top: 'top', 'öğrenci': 'öğrenci', kasa: 'kasa', 'kuruş': 'kuruş' };
  // Tahmin aralığının sınırı: iki değer arasındaki en "yuvarlak" sayı (önce 1000'lik, sonra 500'lük, 100'lük...)
  // İki değerin ikisinden de yeterince uzak (aralığın en az 1/4'ü) olan en yuvarlak sayı; yoksa null.
  const yuvarlakSinir = (lo, hi) => { const pay = (hi - lo) / 4;
    for (const st of [1000, 500, 100, 50, 10, 5, 1]) { let en = null, enUz = -1; for (let m = Math.floor(lo / st) + 1; m * st < hi; m++) { const uz = Math.min(m * st - lo, hi - m * st); if (uz > enUz) { en = m * st; enUz = uz; } } if (en !== null && enUz >= pay) return en; }
    return null; };
  const denN = (n) => `${fmtN(n)}'${U.ek(U.lastWord(n), 'den')}`;
  // Tahmin: yanlış aralıklar, son adımın yanılgılı sonuçlarına göre kurulur (rastgele aralık yok).
  const tahminSorusu = (pr) => {
    const son = pr.coz[pr.coz.length - 1]; if (son.options || typeof son.answer !== 'number' || !BIRIM[son.unit]) return null;
    const ans = son.answer, uzak = (x, y) => Math.abs(x - y) >= Math.max(3, 0.3 * Math.min(x, y));
    // Cevaptan ve birbirinden yeterince uzak yanılgılı sonuçlar; önce cevaba en yakınlar (her iki yandan birer, sonra aynı yandan)
    const aday = son.inputMis.filter(m => m.v > 0 && uzak(m.v, ans)).sort((x, y) => Math.abs(x.v - ans) - Math.abs(y.v - ans));
    const sec = [];
    for (const yan of [-1, 1]) { const m = aday.find(x => Math.sign(x.v - ans) === yan); if (m) sec.push(m); }
    for (const m of aday) if (sec.length < 2 && !sec.includes(m) && sec.every(x => uzak(x.v, m.v))) sec.push(m);
    if (!sec.length) return null;
    const noktalar = [...sec.map(m => ({ v: m.v, m })), { v: ans }].sort((x, y) => x.v - y.v);
    const sinir = noktalar.slice(1).map((x, i) => yuvarlakSinir(noktalar[i].v, x.v));
    if (sinir.some(x => x === null)) return null;
    const metin = (i) => i === 0 ? `${denN(sinir[0])} az` : i === noktalar.length - 1 ? `${denN(sinir[i - 1])} fazla` : `${fmtN(sinir[i - 1])} ile ${fmtN(sinir[i])} arası`;
    const neden = (m) => `Sonuç bu aralıkta çıkıyorsa büyük ihtimalle şu oldu: ${m.ac}`;
    const okMetin = metin(noktalar.findIndex(x => !x.m));
    return { prompt: `Hesaplamadan önce tahmin et: cevap kaç ${BIRIM[son.unit]} çıkar?`, fixed: true, tahminDeger: ans,
      options: noktalar.map((x, i) => x.m ? { t: metin(i), ok: false, mis: x.m.mis, ac: neden(x.m) } : { t: metin(i), ok: true }),
      ip: ASAMA_IP.tahmin, hint: ASAMA_IP.tahmin, steps: ['Sayıları yuvarlayıp kafadan yaklaşık hesaplarız; tam sonuç gerekmez.', `Tam cevap ${fmtN(ans)} ${son.unit}: «${okMetin}».`] };
  };
  // Gerekçe: kontrol işlemi verilir, çocuk bu işlemin cevabı NEDEN doğruladığını seçer (açıklama becerisi).
  const kucukBas = (t) => t.charAt(0).toLocaleLowerCase('tr-TR') + t.slice(1);
  const GEREKCE_YANLIS = [
    ['Çünkü bulduğum sonucu aynı yolla bir kez daha hesapladım.', 'kontrol_tekrar', 'Bu işlem aynı yolu tekrarlamıyor; cevaptan geriye gidiyor. Aynı yolu tekrarlamak aynı hatayı tekrar ettirebilir.'],
    ['Çünkü sonuç makul bir büyüklükte; bu kadarı yeter.', 'kontrol_yuzeysel', 'Büyüklüğe bakmak tahmin için iyidir ama cevabı kanıtlamaz. Kontrol işlemi problemdeki bir bilgiye tam olarak ulaşmalı.']];
  const gerekceSorusu = (pr) => ({ prompt: `Kontrol için şu işlemi yaptın:<div class="kislem">${pr.kontrol[1]}</div>Bu işlem cevabı neden doğrular?`, okuma: 'Kontrol için yaptığın işlem ekranda. Bu işlem cevabı neden doğrular?',
    options: mc('Çünkü ' + kucukBas(pr.kontrol[3]), GEREKCE_YANLIS), ip: ASAMA_IP.gerekce, hint: ASAMA_IP.gerekce, steps: [pr.kontrol[3]], kontrolNeden: pr.kontrol[3] });
  /* ---------- İşlem ifadesi: parçala + hesapla (kartlarla işlem kurma ve derinleştir için) ----------
     Dilbilgisi: ifade = terim (('+'|'−') terim)* ; terim = çarpan (('×'|'÷') çarpan)* ; çarpan = sayı | '(' ifade ')'.
     Hatalı dizilişte ya da sıfıra bölmede null döner. */
  const ifadeParcala = (t) => String(t).replace(/<[^>]+>/g, '').replace(/[   ]/g, ' ').replace(/(\d) (?=\d{3}\b)/g, '$1').match(/\d+(?:,\d+)?|[+−×÷()]/g) || [];
  const ifadeHesapla = (toks) => {
    let i = 0; const al = () => toks[i], ye = () => toks[i++];
    const carpan = () => { const t = ye(); if (t === undefined) return null; if (t === '(') { const v = ifade(); if (ye() !== ')' || v === null) return null; return v; } const n = typeof t === 'number' ? t : /^\d/.test(t) ? parseFloat(String(t).replace(',', '.')) : NaN; return isNaN(n) ? null : n; };
    const terim = () => { let v = carpan(); while (v !== null && (al() === '×' || al() === '÷')) { const op = ye(), w = carpan(); if (w === null || (op === '÷' && w === 0)) return null; v = op === '×' ? v * w : v / w; } return v; };
    const ifade = () => { let v = terim(); while (v !== null && (al() === '+' || al() === '−')) { const op = ye(), w = terim(); if (w === null) return null; v = op === '+' ? v + w : v - w; } return v; };
    const v = ifade(); return v === null || i !== toks.length ? null : v;
  };
  const sayiYaz = (v) => Number.isInteger(v) ? fmtN(v) : String(Math.round(v * 100) / 100).replace('.', ',');
  // Anla tablosu: her bilgi "verilen" mi, "önce bulunacak ara sonuç" mu, "sorulan" mı?
  const TABLO_AD = { v: 'Verilen', a: 'Önce bul', s: 'Sorulan' };
  const tabloSorusu = (pr) => {
    const satirlar = shuffle([...pr.tablo.verilen.map(t => ({ t, d: 'v' })), ...pr.tablo.ara.map(t => ({ t, d: 'a' })), { t: pr.tablo.istenen, d: 's' }]);
    const ip = 'Problemde yazan bilgiler "verilen"dir. Soru cümlesinin sorduğu şey "sorulan"dır. Sorulana ulaşmak için önce hesaplaman gereken şey "önce bul" olur.';
    return { type: 'tablo', prompt: 'Problemdeki bilgileri yerleştir: Verilen mi, önce bulunacak mı, sorulan mı?', okuma: `${tabloSiz(pr.baglam)} Problemdeki bilgileri yerleştir.`, satirlar, ip, hint: ip,
      cevap: satirlar.map(r => `${r.t} → <b>${TABLO_AD[r.d]}</b>`).join('<br>'), steps: [`Sorulan: ${pr.tablo.istenen}`, `Önce bulunacak: ${pr.tablo.ara.join(', ')}`, `Verilenler: ${pr.tablo.verilen.join('; ')}`] };
  };
  const TABLO_CHECK = (q, ans) => {
    const yanlis = q.satirlar.map((r, i) => ({ r, i, sec: ans[i] })).filter(x => x.sec !== x.r.d);
    if (!yanlis.length) return { ok: true, mis: null };
    const sira = { s: 0, a: 1, v: 2 }, w = yanlis.sort((x, y) => sira[x.r.d] - sira[y.r.d])[0], t = `"${w.r.t}"`;
    const ac = { 'sv': `${t} problemde yazmıyor; soru cümlesi bunu soruyor. Bu "sorulan".`, 'sa': `${t} en son bulacağımız cevap; ara adım değil. Bu "sorulan".`,
      'av': `${t} problemde yazmıyor; onu önce biz hesaplayacağız. Bu "önce bul".`, 'as': `${t} cevaba giden yolda bir ara adım. Soru başka bir şeyi soruyor.`,
      'va': `${t} problemde zaten yazıyor; hesaplamamıza gerek yok. Bu "verilen".`, 'vs': `${t} problemde zaten yazıyor. Soru, yazmayan bir şeyi soruyor.` }[w.r.d + w.sec] || `${t} yanlış sütunda.`;
    return { ok: false, mis: (w.r.d === 'a' && w.sec === 's') || (w.r.d === 's' && w.sec === 'a') ? 'ara_sonuc' : 'istenen_verilen', ac, yanlisSatir: yanlis.map(x => x.i) };
  };
  // Kartlarla işlem kur: kartlar problemdeki sayılar; doğru DEĞERİ veren her işlem kabul edilir (parantezli/parantezsiz).
  const kurSorusu = (pr) => {
    const son = pr.coz[pr.coz.length - 1], hedef = son.answer, yan = [];
    const ekle = (v, mis, ac) => { if (v !== null && Math.abs(v - hedef) > 1e-9 && !yan.some(y => Math.abs(y.v - v) < 1e-9)) yan.push({ v, mis, ac }); };
    son.inputMis.forEach(m => ekle(m.v, m.mis, m.ac));
    if (pr.coz.length > 1 && typeof pr.coz[0].answer === 'number') ekle(pr.coz[0].answer, 'ara_sonuc', 'Bu işlem bir ara sonucu veriyor. Soruya ulaşmak için bir adım daha gerekiyor.');
    if (pr.derin) pr.derin[1].forEach(([e, mis, ac]) => ekle(ifadeHesapla(ifadeParcala(e)), mis, ac));
    const ip = `Önce ${pr.tablo.ara[0].toLocaleLowerCase('tr-TR')} hangi işlemle bulunur, düşün. Sonra onu kullanarak ${pr.kur.ne} bulan işlemi ekle. Gerekirse parantez kullan.`;
    const ne = pr.kur.ne.charAt(0).toLocaleUpperCase('tr-TR') + pr.kur.ne.slice(1);
    return { type: 'kur', prompt: `${ne} bulan işlemi kartlarla kur.`, okuma: `${ne} bulan işlemi kartlarla kur. Her sayı kartını bir kez kullanabilirsin.`, kartlar: pr.kur.kartlar.slice(), hedef, ornek: pr.kur.ornek, yanilgi: yan,
      ip, hint: ip, cevap: `${pr.kur.ornek} = ${sayiYaz(hedef)}`, steps: [`Bir doğru işlem: ${pr.kur.ornek} = ${sayiYaz(hedef)}`, 'İşlem önceliği: önce parantez, sonra çarpma ve bölme, en son toplama ve çıkarma.'] };
  };
  // ans: ['n0', '+', '(', 'n2', ...]  (nK = K. sayı kartı; her kart en fazla bir kez)
  const kurIfade = (q, ans) => ans.map(t => /^n\d+$/.test(t) ? q.kartlar[+t.slice(1)] : t);
  const kurGecerli = (q, ans) => { const kul = ans.filter(t => /^n\d+$/.test(t)); return kul.length >= 2 && new Set(kul).size === kul.length && ifadeHesapla(kurIfade(q, ans)) !== null; };
  const KUR_CHECK = (q, ans) => {
    if (!kurGecerli(q, ans)) return { ok: false, mis: 'problem_adim', ac: 'İşlem tamamlanmamış. Sayı ve işlem kartlarını sırayla dizip parantezleri kapat.' };
    const v = ifadeHesapla(kurIfade(q, ans)), deger = sayiYaz(v);
    if (Math.abs(v - q.hedef) < 1e-9) return { ok: true, mis: null, deger };
    const y = q.yanilgi.find(m => Math.abs(m.v - v) < 1e-9);
    return y ? { ok: false, mis: y.mis, ac: `Kurduğun işlem ${deger} veriyor. ${y.ac}`, deger } : { ok: false, mis: 'problem_adim', ac: `Kurduğun işlem ${deger} veriyor; bu problemin cevabı değil. Problemdeki ilişkiyi adım adım düşün: önce ne bulunur, sonra ne?`, deger };
  };
  // Derinleştir: aynı problemin başka bir çözüm yolu. Sadece ilk denemede çözen çocuğa gelir (motor karar verir).
  const derinSorusu = (pr) => { const son = pr.coz[pr.coz.length - 1], ad = pick(NAMES);
    return { prompt: `${ad} bu problemi başka bir yolla çözmek istiyor. Hangi işlem de aynı cevabı (${fmtN(son.answer)}) verir?`, options: mc(pr.derin[0], pr.derin[1]),
      ip: ASAMA_IP.derin, hint: ASAMA_IP.derin, derinCevap: son.answer, steps: [`${pr.derin[0]} işlemi de ${fmtN(son.answer)} verir.`, 'Bir problemin birden çok doğru çözüm yolu olabilir; hepsi aynı cevaba ulaşır.'] }; };
  // Bir problemi sıralı soru nesnelerine çevirir (her biri sıradan bir mc/input sorusu + q.atolye bilgisi).
  // Sonda "Kendin dene": aynı türde, YENİ sayılarla, iskelesiz tek soru → öğrenmenin bağımsız kanıtı.
  const tabloSiz = (b) => b.replace(/<table[\s\S]*<\/table>/, '');
  const atolyeSorulari = (id, sec = {}) => {
    const pr = PROB[id](), pid = Math.random().toString(36).slice(2), list = [];
    const ek = (asama, o, b) => list.push(Q(Object.assign({ atolye: { pid, sablon: id, asama, baslik: (b || pr).baslik, baglam: (b || pr).baglam }, skill: pr.skill }, o)));
    const tablo = pr.tablo && (sec.tablo === undefined ? Math.random() < 0.5 : sec.tablo), kur = pr.kur && (sec.kur === undefined ? Math.random() < 0.5 : sec.kur);
    if (tablo) ek('anla', tabloSorusu(pr)); else ek('anla', { prompt: 'Soruda ne isteniyor?', okuma: `${tabloSiz(pr.baglam)} Soruda ne isteniyor?`, options: mc(pr.anla[0], pr.anla[1]), ip: ASAMA_IP.anla, steps: [`İstenen: ${pr.anla[0]}`, 'Soru cümlesi genellikle problemin en sonundadır.'], hint: ASAMA_IP.anla });
    if (kur) ek('plan', kurSorusu(pr)); else ek('plan', { prompt: 'Bu problemi hangi yolla çözersin?', options: mc(pr.plan[0], pr.plan[1]), ip: ASAMA_IP.plan, steps: [`Doğru yol: ${pr.plan[0]}`], hint: ASAMA_IP.plan });
    const th = tahminSorusu(pr); if (th) ek('tahmin', th);
    pr.coz.forEach((c, i) => ek('coz', c.options ? { prompt: `${i + 1}. adım: ${c.prompt}`, options: c.options, fixed: c.fixed, ip: c.ip, steps: c.steps, hint: c.ip } :
      { type: 'input', prompt: `${i + 1}. adım: ${c.prompt}`, answer: String(c.answer), unit: c.unit, inputMis: c.inputMis.filter(m => m.v !== c.answer), ip: c.ip, steps: c.steps, hint: c.ip }));
    const gerekce = sec.gerekce === undefined ? Math.random() < 0.5 : sec.gerekce;
    if (gerekce) ek('kontrol', Object.assign(gerekceSorusu(pr), { gerekce: true }));
    else ek('kontrol', { prompt: pr.kontrol[0], options: mc(pr.kontrol[1], pr.kontrol[2]), ip: ASAMA_IP.kontrol, steps: [pr.kontrol[3]], hint: ASAMA_IP.kontrol, kontrolNeden: pr.kontrol[3] });
    if (pr.derin && sec.derin !== false) ek('derin', derinSorusu(pr));
    // Kendin dene
    let p2 = PROB[id](); for (let t = 0; t < 8 && tabloSiz(p2.baglam) === tabloSiz(pr.baglam); t++) p2 = PROB[id]();
    const son = p2.coz[p2.coz.length - 1], ara = p2.coz[0], tumAdimlar = p2.coz.flatMap(c => c.steps), ipB = `Az önceki yolu izle: ${p2.plan[0]}`;
    const tekBasina = { prompt: 'Şimdi sıra sende! Bu yeni problemi tek başına çöz.', okuma: `${tabloSiz(p2.baglam)} Şimdi sıra sende, tek başına çöz.`, ip: ipB, hint: ipB, steps: tumAdimlar, bagimsiz: true };
    if (son.options) ek('bagimsiz', Object.assign(tekBasina, { options: son.options, fixed: son.fixed }), p2);
    else {
      const yan = son.inputMis.filter(m => m.v !== son.answer).slice();
      if (!son.options && ara !== son && ara.answer !== son.answer && !yan.some(m => m.v === ara.answer)) yan.push({ v: ara.answer, mis: 'ara_sonuc', ac: 'Bu bir ara sonuç. Problem bir adım daha istiyor; soru cümlesine dönüp bak.' });
      ek('bagimsiz', Object.assign(tekBasina, { type: 'input', answer: String(son.answer), unit: son.unit, inputMis: yan }), p2);
    }
    list.forEach((q, i) => { q.atolye.sira = i; q.atolye.toplam = list.length; q.atolye.no = sec.no || 1; q.atolye.sonCoz = q.atolye.asama === 'coz' && list[i + 1].atolye.asama !== 'coz'; });
    return list;
  };
  const ATOLYE = { tabloKontrol: TABLO_CHECK, kurKontrol: KUR_CHECK, kurGecerli, kurIfade, ifadeHesapla, ifadeParcala, sayiYaz, TABLO_AD, ids: Object.keys(PROB), skillOf: (id) => ({ market: 'n_problem', bahce: 'a_cevre', parke: 'a_alan', okuma: 's_tablo_sutun', terazi: 'e_esitlik', kumbara: 'e_oruntu', gezi: 'n_carpbol', torba: 'p_spektrum', ucgen: 'g_ucgen', pizza: 'f_karsilastir', butce: 'n_toplacikar', hali: 'a_cevre_alan', anket: 's_daire', bozuk: 'f_ondalik', kasa: 'n_carpbol' })[id], sorular: atolyeSorulari, ASAMA, PROB };

  /* =========================================================
     SORUYA ÖZEL İPUÇLARI (25.10.2026)
     Kendi ipucu olmayan sorularda ampul, becerinin genel kural kartını gösteriyordu; o kural çoğu soruya uymuyordu
     (ör. çokgen adlandırma sorusunda "n kenarlı çokgen: n köşe…"). Her kalıp için yöntemi gösteren, cevabı söylemeyen
     bir ipucu: [beceri, sorunun düz metninde aranan kalıp, ipucu]. İlk eşleşen kullanılır.
     Test (test_generators.js): her ders sorusunun ipucu olmalı ve ipucu doğru cevabı içermemeli.
     ========================================================= */
  const IPUCU = [
    // TEMA 1
    ['g_temel', /çizgiye ne denir|çizgi hangisidir|ışık hangi geometrik/, 'Çizginin uçlarını düşün: kaç ucu var, uçlarında duruyor mu, yoksa sonsuza mı gidiyor?'],
    ['g_temel', /gösterimi neyi ifade eder/, 'Gösterimin iki ucuna bak: köşeli parantez olan uçta çizgi durur, parantez olmayan uçta devam eder. İki yanda dik çizgi varsa çizimin kendisi değil, bir ölçüsü anlatılır.'],
    ['g_temel', /sınırsız uzar|başlangıç noktası|uç noktası|ölçülebilir/, 'Şıklardaki her birinin uçlarını düşün: kaç ucu var, uçları bir yerde bitiyor mu?'],
    ['g_temel', /açı nasıl adlandırılır/, 'Açı üç harfle adlandırılırken köşenin harfi hangi sıraya yazılır?'],
    ['g_temel', /kaç farklı doğru geçer/, 'Kâğıda nokta koyup cetvelle dene: bu noktalardan kaç farklı doğru çizebilirsin?'],
    ['g_cember', /yarıçapı .*çapı kaç|Yarıçapı \d+ cm olan çemberin çapı/, 'Çap, merkezden geçip çemberin bir ucundan öbür ucuna gider. Yarıçapın kaç katıdır?'],
    ['g_cember', /Çapı .*aynı merkezli/, 'Önce birinci çemberin yarıçapını bul, sonra ikinci çemberin yarıçapını, en son ikinci çemberin çapını.'],
    ['g_cember', /Çapı \d+ cm olan çemberin yarıçapı/, 'Yarıçap, merkez ile çember arasındaki uzaklıktır. Çapın kaçta kaçıdır?'],
    ['g_cember', /sivri ucunun/, 'Pergelin sivri ucu çizim boyunca hiç kımıldamaz. Çemberin her noktası bu noktaya eşit uzaklıktadır.'],
    ['g_cember', /bütün yarıçaplar/, 'Pergelin açıklığını değiştirmeden çember çizdiğini düşün. Merkezden çembere giden her çizgi ne kadar uzun olur?'],
    ['g_cember', /bilezik/, 'Bileziğin ortası boş, paranın içi dolu. Çember ile dairenin farkı neydi?'],
    ['g_cember', /ne denir/, 'Bir çember çiz ve merkezini işaretle. Sorulan parça merkezden mi başlıyor, merkezden mi geçiyor, yoksa iç bölgeyi mi anlatıyor?'],
    ['g_cember', /modelidir/, 'Çember yalnız kenardaki çizgidir, içi boştur. Daire ise iç bölgesiyle birlikte doludur.'],
    ['g_dikme_paralel', /sembolü ne anlama gelir/, 'Sembolün şekline bak: iki çizgi yan yana mı duruyor, yoksa birbirini köşe yaparak mı kesiyor?'],
    ['g_dikme_paralel', /ise .* ne söylenebilir/, 'Doğruları kâğıda çiz: önce ilk ilişkiyi, sonra ikincisini çiz. Sonra ilk ve son doğruya bak.'],
    ['g_dikme_paralel', /kaç noktada kesişir/, 'İki doğruyu çizip uzattığını düşün: buluşuyorlar mı, buluşuyorlarsa kaç yerde?'],
    ['g_dikme_paralel', /kaç dikme/, 'Kâğıda bir doğru ve dışında bir nokta çiz. Gönyeyle bu noktadan doğruya kaç farklı dik çizgi çizebilirsin?'],
    ['g_dikme_paralel', /EN KISA/, 'Noktadan doğruya farklı yönlerde parçalar çiz. Hangisi en kısa görünüyor, doğruyla hangi açıyı yapıyor?'],
    ['g_dikme_paralel', /Bütün noktaları ortak/, 'İki doğru tam üst üste gelirse ne olur? Kaç ortak noktaları olur?'],
    ['g_aci', /hangisinin ölçüsü daha büyüktür/, 'Kolların uzunluğuna değil, iki kolun arasındaki açıklığa bak.'],
    ['g_aci', /hangi türdendir/, 'Ölçüyü 90° ve 180° ile karşılaştır.'],
    ['g_aci', /Gözünle tahmin et/, 'Açıyı bir kâğıdın köşesiyle (dik açıyla) karşılaştır: daha kapalı mı, daha açık mı?'],
    ['g_aci', /dik açının ölçüleri toplamı/, 'Bir dik açı kaç derecedir? O kadar dik açıyı topla.'],
    ['g_aci', /kaç tane \d+ derecelik/, 'Doğru açının ve tam açının kaç derece olduğunu hatırla. İçine bu küçük açıdan kaç tane sığar?'],
    ['g_aci_iliski', /BÜTÜNLERİ|TÜMLERİ|bütünleri|tümleri/, 'Tümler açılar birlikte bir dik açı, bütünler açılar birlikte bir doğru açı oluşturur. Soruda hangisi isteniyor?'],
    ['g_aci_iliski', /TERS açısı/, 'Kesişen iki doğruda karşı karşıya duran açılar ters açılardır. Ters açıların ölçüleri hakkında ne biliyorsun?'],
    ['g_aci_iliski', /komşu/, 'Kesişen doğrularda yan yana duran iki açı birlikte bir doğru açı oluşturur.'],
    ['g_aci_iliski', /paralel doğruyu bir doğru kesiyor/, 'Şekildeki açıları karşılaştır: kesen doğru iki paralel doğruyu aynı eğimle keser. Aynı görünen açılar hangileri? Sorulan açı dar mı, geniş mi?'],
    ['g_cokgen', /kaç (köşesi|kenarı|iç açısı) vardır/, 'Çokgenin adı kaç kenarı olduğunu söyler (üç-gen, dört-gen…). Bir çokgenin kenar, köşe ve iç açı sayıları birbirine eşittir.'],
    ['g_cokgen', /düzgün çokgenin tanımı/, 'Kare ile dikdörtgeni düşün: ikisinin de açıları eşit. Peki kenarları? Hangisi düzgün çokgendir ve neden?'],
    ['g_cokgen', /düzgün bir çokgen midir/, 'Düzgün çokgende hem bütün kenarlar hem bütün açılar eşittir. Bu şeklin kenarları ve açıları eşit mi?'],
    ['g_cokgen', /bütün kenarlarının uzunlukları toplamı/, 'Düzgün çokgenin bütün kenarları eşittir. Bu çokgenin kaç kenarı var?'],
    ['g_cokgen', /yan yana OLMAYAN/, 'Yan yana iki köşeyi birleştiren parça kenardır. Yan yana olmayanları birleştiren parçanın adı ne?'],
    ['g_cokgen', /dış açı/, 'İç açı ile dış açı aynı köşede yan yana durur ve birlikte doğru açı oluşturur.'],
    ['g_cokgen', /hiç köşegeni yoktur/, 'Şekilleri çiz: yan yana olmayan iki köşe bulabiliyor musun?'],
    ['g_ucgen', /iki iç açısının ölçüsü/, 'Üçgenin iç açılarının toplamı kaç derecedir? Verilen iki açıyı bu toplamdan çıkar.'],
    ['g_ucgen', /açılarına göre hangisidir/, 'En büyük açıya bak: 90°\'den küçük mü, 90°\'ye eşit mi, büyük mü?'],
    ['g_ucgen', /Eşkenar üçgenin bir iç açısı/, 'Eşkenar üçgenin üç açısı eşittir. İç açıların toplamını üç eşit parçaya böl.'],
    ['g_ucgen', /Taban açılarından/, 'Tepe açısını iç açıların toplamından çıkar; kalan kısım iki eşit taban açısına paylaşılır.'],
    ['g_ucgen', /Dik açılı bir üçgende/, 'Dik açı 90° ise kalan iki dar açının toplamı kaç derece olur?'],
    ['g_ucgen', /kenarlarına göre hangisidir/, 'Kaç kenarın uzunluğu eşit: üçü mü, ikisi mi, hiçbiri mi?'],
    ['g_ucgen', /olabilir\.?$/, 'Üçgenin iç açılarının toplamı 180°. Bu açıları bir arada düşün: toplam 180°\'yi aşıyor mu?'],
    ['g_ucgen', /çemberin yarıçapı/, 'Kesişim noktası iki çemberin de üstündedir: A\'ya uzaklığı ilk çemberin yarıçapı, B\'ye uzaklığı ikinci çemberin yarıçapıdır. Üç kenarı karşılaştır.'],
    // TEMA 2
    ['n_okuma', /sayısının okunuşu hangisidir/, 'Sayıyı sağdan üçerli bölüklere ayır, her bölüğü okuyup bölüğün adını söyle: milyar, milyon, bin.'],
    ['n_okuma', /▢/, 'Kutunun hangi bölüğün yerinde olduğunu bul. Okunuşta o bölüğün adından hemen önce söylenen sayıya bak. Bölük üç basamaklıdır.'],
    ['n_basamak', /basamak değeri/, 'Basamak değeri = rakam × bulunduğu basamağın değeri. O basamağın değerinde kaç sıfır var?'],
    ['n_basamak', /hangi basamaktadır/, 'Basamaklar sağdan sola sayılır: birler, onlar, yüzler, binler… Önce bu rakamın sağdan kaçıncı sırada olduğunu bul.'],
    ['n_basamak', /çözümle/, 'Her parçayı kendi basamağına yerleştir. Boş kalan basamaklara 0 yaz.'],
    ['n_karsilastir', /rakamlarının her biri birer kez/, 'En soldaki basamağa hangi rakam gelmeli? Bir sayının en soldaki rakamı 0 olabilir mi?'],
    ['n_karsilastir', /sıralanışı/, 'Önce basamak sayılarını karşılaştır. Basamak sayıları eşitse en soldaki rakamdan başlayarak karşılaştır.'],
    ['n_karsilastir', /kart/, 'Her kartı bir bölük gibi düşün. En büyük sayı için hangi kart en solda olmalı?'],
    ['n_karsilastir', /sembol/, 'Önce basamak sayılarına bak. Eşitse en soldaki rakamdan başlayarak karşılaştır.'],
    ['n_toplacikar', /= \?$/, 'Basamakları alt alta hizala ve birler basamağından başla. Eldeyi ya da onluk bozmayı unutma.'],
    ['n_toplacikar', /^\.+ \+/, 'Bilinmeyen toplananı bulmak için toplamdan bilinen toplananı çıkar.'],
    ['n_toplacikar', /Eksilen kaçtır/, 'Eksileni bulmak için çıkan ile farkı topla.'],
    ['n_toplacikar', /Geriye kaç/, 'Önce harcanan paraları topla, sonra bunu eldeki paradan çıkar.'],
    ['n_carpbol', /^\d[\d ]* × \.+|^\.+ ×/, 'Bilinmeyen çarpanı bulmak için çarpımı bilinen çarpana böl.'],
    ['n_carpbol', /^\d[\d ]* ÷ \.+/, 'Bilinmeyen böleni bulmak için bölüneni bölüme böl.'],
    ['n_carpbol', /^\.+ ÷/, 'Bilinmeyen bölüneni bulmak için bölümle böleni çarp.'],
    ['n_carpbol', /× .*işleminin sonucu/, 'Sıfırları ayır: önce sıfırsız sayıları çarp, sonra bütün sıfırları sonuna ekle.'],
    ['n_carpbol', /÷ .*işleminin sonucu/, 'Bölünenden ve bölenden aynı sayıda sıfırı silebilirsin. Sonra kalan sayıları böl.'],
    ['n_carpbol', /× \d+ = \?/, 'Önce birler basamağıyla, sonra onlar basamağıyla çarp ve alt alta topla. Onlar satırında bir basamak sola kaymayı unutma.'],
    ['n_problem', /kumbarasına her gün/, 'Her gün aynı miktar ekleniyor. Kaç gün, her gün kaç TL?'],
    ['n_problem', /bütçeyle/, 'Önce harcanan parayı bul ve bütçeden çıkar. Kalan para kaç deftere yeter? Bir deftere yetmeyen artan parayı sayma.'],
    ['n_problem', /Alışveriş fişi/, 'Önce fişteki fiyatları topla, sonra kasaya verilen paradan çıkar.'],
    ['n_problem', /en az kaç sefer/, 'Kişileri bir seferde taşınan sayıya böl. Artan kişiler kalırsa onlar için de sefer gerekir mi?'],
    ['n_problem', /Borç en az kaç ayda/, 'Toplam fiyatı her ay ödenen miktara böl. Borcun bir kısmı artarsa onun için de bir ay gerekir mi?'],
    ['n_problem', /mola/, 'Ders sürelerini ve aradaki molaları ayrı ayrı topla. Üç ders arasında kaç mola var? Sonra başlangıç saatine ekle.'],
    ['n_tahmin', /yuvarlayınca/, 'Yuvarlanacak basamağın hemen sağındaki rakama bak: 5 ya da daha büyükse bir artır, küçükse aynı bırak. Sağındaki basamaklar 0 olur.'],
    ['n_tahmin', /TAHMİN/, 'Önce her sayıyı ayrı ayrı en yakın binliğe yuvarla, sonra yuvarlanmış sayıları topla.'],
    // TEMA 3
    ['a_cevre', /karenin çevre/, 'Karenin kaç kenarı var? Hepsinin uzunluğu aynı.'],
    ['a_cevre', /uzun kenarı .*Kısa kenarı/, 'Çevrenin yarısı, bir uzun kenar ile bir kısa kenarın toplamıdır.'],
    ['a_cevre', /sıra tel/, 'Önce bir sıra tel için bahçenin çevresini bul, sonra kaç sıra tel çekileceğini düşün.'],
    ['a_cevre', /kaç farklı dikdörtgen/, 'Çevrenin yarısı bir uzun ve bir kısa kenarın toplamıdır. Toplamı bu yarıyı veren doğal sayı çiftlerini yaz; aynı çifti iki kez sayma.'],
    ['a_cevre', /dikdörtgen çizilebilir\.?$/, 'Çevre = 2 × (uzun kenar + kısa kenar). Doğal sayıların 2 katı tek sayı olabilir mi?'],
    ['a_cevre', /dikdörtgenin çevre/, 'Çevre, dört kenarın toplamıdır. Dikdörtgende karşılıklı kenarlar eşittir.'],
    ['a_alan', /birimkare/, 'Kareleri tek tek saymak yerine bir sıradaki kare sayısını ve sıra sayısını bul.'],
    ['a_alan', /parke/, 'Önce odanın alanını bul. Her metrekare için ödenen parayı bu alanla düşün.'],
    ['a_alan', /kaç farklı dikdörtgen/, 'Çarpımı bu alanı veren doğal sayı çiftlerini sırayla yaz (1 × …, 2 × …). Aynı çifti iki kez sayma.'],
    ['a_alan', /çit/, 'Alanı veren kenar çiftlerini yaz ve her birinin çevresini hesapla. Kenarlar birbirine yaklaştıkça çevre ne oluyor?'],
    ['a_alan', /Diğer kenarı/, 'Verilen kenarı hangi sayıyla çarparsan alanı bulursun?'],
    ['a_alan', /alanı nedir/, 'Dikdörtgenin alanı, iki komşu kenarının uzunluklarının çarpımıdır. Birimi kare olarak yaz (cm², m²).'],
    ['a_cevre_alan', /şerit|kâğıt|kapla|etrafına/, 'Etrafına bir şey çekiliyorsa çevre, üstü kaplanıyorsa alan gerekir. Bu soruda hangisi?'],
    ['a_cevre_alan', /Çevre uzunlukları eşit/, 'Çevreleri aynı iki farklı dikdörtgen düşün (ör. 5 × 1 ve 3 × 3). Alanları da aynı mı?'],
    ['a_cevre_alan', /Alanları eşit/, 'Alanları aynı iki farklı dikdörtgen düşün (ör. 12 × 1 ve 4 × 3). Çevreleri de aynı mı?'],
    ['a_cevre_alan', /boyutlarındaki iki dikdörtgenin/, 'İki dikdörtgen için ayrı ayrı hesapla, sonra karşılaştır. Alan için kenarları çarp, çevre için dört kenarı topla.'],
    ['a_cevre_alan', /EN KÜÇÜK/, 'Bu çevreye sahip dikdörtgenleri kenar çiftleriyle yaz. Kenarlar arasındaki fark büyüdükçe alan ne oluyor?'],
    ['a_cevre_alan', /EN BÜYÜK/, 'Bu çevreye sahip dikdörtgenleri kenar çiftleriyle yaz. Kenarlar birbirine yaklaştıkça alan ne oluyor?'],
    ['a_cevre_alan', /Ç\(|A\(/, 'Ç( ) çevreyi, A( ) alanı gösterir. Hangisi soruluyor?'],
    // TEMA 4
    ['f_tur', /boyalı kısmı/, 'Payda: şekil kaç eş parçaya bölünmüş? Pay: kaç parça boyalı?'],
    ['f_tur', /hangi türdendir/, 'Payı paydayla karşılaştır. Kesrin yanında bir tam sayı var mı?'],
    ['f_tur', /tam sayılı kesir olarak/, 'Payın içinde paydadan kaç tane var? O kadar tam olur, artan kısım pay olarak kalır.'],
    ['f_tur', /bileşik kesir gösterimi/, 'Tam sayıyı paydayla çarp, payı ekle; payda aynı kalır.'],
    ['f_denk', /Soru işareti yerine/, 'Paydaya ne olmuş? Pay ile paydayı aynı sayıyla çarparsan ya da bölersen denk kesir elde edersin.'],
    ['f_denk', /Örüntüyü takip et/, 'Her satırda pay ve paydaya ne yapılmış? Aynısını eksik satıra uygula.'],
    ['f_denk', /en sade/, 'Pay ile paydayı bölen en büyük ortak sayıyı bul ve ikisini de ona böl.'],
    ['f_denk', /denk DEĞİLDİR/, 'Her şıkkı sadeleştir ya da genişlet. Verilen kesre dönüşmeyen hangisi?'],
    ['f_ondalik', /kesrinin ondalık gösterimi/, 'Paydayı 10, 100 ya da 1000 yap (gerekirse pay ve paydayı aynı sayıyla çarp). Payda 10 ise virgülden sonra 1, 100 ise 2 basamak olur.'],
    ['f_ondalik', /gösteriminin okunuşu/, 'Önce virgülün solundaki tam kısmı oku ve «tam» de. Virgülden sonra kaç basamak varsa «onda», «yüzde» ya da «binde» diye oku.'],
    ['f_ondalik', /etiketinde/, 'Virgülün solu lira, sağı kuruştur.'],
    ['f_ondalik', /kısım hangisidir/, 'Sayıyı virgülden ikiye ayır. Bütünleri gösteren taraf hangisi, bütünden küçük parçaları gösteren taraf hangisi?'],
    ['f_yuzde', /ifadesinin ondalık/, 'Yüzde, paydası 100 olan kesir demektir. Önce kesir olarak yaz, sonra ondalık gösterime çevir.'],
    ['f_yuzde', /kesrinin yüzde ile/, 'Paydası 100 olan kesrin payı, yüzde sembolünün yanına yazılır.'],
    ['f_yuzde', /yüzde kaça eşittir/, 'Kesri, paydası yüz olan denk bir kesre çevir.'],
    ['f_yuzde', /İNDİRİM/, 'Yüzde, paydası 100 olan kesir demektir.'],
    ['f_karsilastir', /sembol/, 'Kesirleri aynı biçime getir: tam sayılı kesir varsa bileşik kesre çevir, paydalar farklıysa denk kesirle eşitle. Sonra payları karşılaştır.'],
    ['f_ondalik_karsilastir', /sembol/, 'Önce tam kısımları karşılaştır. Eşitse virgülden sonraki basamakları sırayla karşılaştır; eksik basamağa 0 yazabilirsin.'],
    ['f_ondalik_karsilastir', /UCUZ/, 'İki fiyatı karşılaştır: önce lira kısmına, eşitse kuruş kısmına bak. Daha küçük olan daha ucuzdur.'],
    ['f_ondalik_karsilastir', /gösterimlerinden/, 'Hepsini aynı gösterime çevir: yüzdeleri ondalık gösterime (ya da tersini). Sonra karşılaştır.'],
    // TEMA 5
    ['s_arastirma', /UYGUN DEĞİLDİR/, 'İyi bir araştırma sorusu bir gruba sorulur ve farklı cevaplar çıkabilir. Hangisinin tek bir cevabı var ya da tek bir kişiyle ilgili?'],
    ['s_arastirma', /iyi bir araştırma sorusudur/, 'İyi bir araştırma sorusunun cevabı veri toplanarak bulunur ve farklı cevaplar çıkabilir. Hangisi böyle?'],
    ['s_arastirma', /araştırma sorusu olmaya UYGUN/, 'İyi bir araştırma sorusunun cevabı veri toplanarak bulunur ve farklı cevaplar çıkabilir. Hangisi böyle?'],
    ['s_arastirma', /adımından hemen|İLK adımı|SON adımı/, 'Bir araştırmayı baştan sona düşün: önce ne yapılır, en son ne yapılır? Sorulan adımı bu sıraya yerleştir.'],
    ['s_arastirma', /hangi araştırma adımına örnektir/, 'Bu iş araştırmanın başında mı, ortasında mı, sonunda mı yapılır?'],
    ['s_arastirma', /KENDİMİZİN|HAZIR veri/, 'Bu yöntemde verileri biz mi topluyoruz, yoksa başkası toplayıp yayımlamış mı?'],
    ['s_arastirma', /[Aa]nket|raporunda/, 'Ankete katılanların haklarını ve sorunun herkes tarafından aynı şekilde anlaşılmasını düşün.'],
    ['s_arastirma', /farklı sonuçlar|OLMAMASI/, 'Araştırma sorusunun özelliklerini hatırla: cevabı veri toplanarak bulunur ve kişiden kişiye farklı cevaplar çıkabilir.'],
    ['s_tablo_sutun', /en (çok|az) tercih edilen hangisidir|sütun hangi seçeneğe/, 'Sütunların boylarını karşılaştır.'],
    ['s_tablo_sutun', /seçeneğini kaç kişi/, 'Sütunun tepesinden eksene doğru düz bir çizgi çekip değeri oku. Eksen kaçar artıyor?'],
    ['s_tablo_sutun', /FAZLADIR/, 'Önce en uzun ve en kısa sütunun değerini oku, sonra büyükten küçüğü çıkar.'],
    ['s_tablo_sutun', /hangi grafikte/i, 'Hangi grafikte her veri tek tek çizilir? Çok sayıda veride bu kolay mı?'],
    ['s_daire', /bütünün kaçta kaçı/, 'Daireyi eş dilimlere bölünmüş gibi düşün: bu dilim bütünün kaç eş parçasından biri?'],
    ['s_daire', /seçeneğini kaç öğrenci/, 'Önce dilimin bütünün kaçta kaçı olduğunu bul. Sonra toplam öğrenci sayısını o kadar eş parçaya böl.'],
    ['s_daire', /doğru çizilmiştir/, 'Daire grafiğinin tamamı %100\'dür. Dilimlerdeki yüzdeleri topla.'],
    ['s_daire', /%\d+'i/, 'Yüzdeyi kesre çevir: bütünün kaç eş parçasından kaçı? Sonra toplam kişi sayısıyla hesapla.'],
    ['s_okuryazar', /kaç kişi fazladır/, 'İki sütundaki noktaları ayrı ayrı say, sonra çoktan azı çıkar.'],
    ['s_okuryazar', /Nokta grafiğinde/, 'Her sütundaki noktaları say ve topla.'],
    ['s_okuryazar', /dikey eksen/, 'Sütun boylarına değil, eksendeki sayılara bak. İki değerin farkını hesapla.'],
    ['s_okuryazar', /KESİNLİKLE/, 'Veriler yalnız bu sınıfı anlatır. «Herkes», «her zaman» gibi kesin ifadeler bu veriyle desteklenebilir mi?'],
    // TEMA 6
    ['e_esitlik', /Terazi dengededir/, 'Dengede iki kefedeki toplam kütle eşittir. Önce bilinen kefenin toplamını bul.'],
    ['e_esitlik', /olduğuna göre ▲/, 'Önce ▲\'nin kaç olduğunu bul, sonra ikinci işlemde yerine koy.'],
    ['e_esitlik', /değişmemesi/, 'Birinci sayı değişince toplam ne kadar değişir? Toplamı eski hâline getirmek için ikinci sayıya ne yapmalısın?'],
    ['e_esitlik', /her iki tarafı/, 'Eşitliğin iki tarafını aynı sayıyla çarparsan eşitlik bozulmaz. Önce sağ tarafı düşün.'],
    ['e_ozellik', /hangi işlem özelliği/, 'Eşitliğin iki tarafını karşılaştır: sayıların yeri mi değişmiş, parantezin yeri mi, yoksa çarpma parantezin içindeki her sayıya mı uygulanmış?'],
    ['e_ozellik', /\+ .*× \.+/, 'Çarpılan sayı iki parçaya ayrılmış. Verilen parçayla hangi sayıyı toplarsan ilk sayıyı bulursun?'],
    ['e_ozellik', /eşitliği doğru mudur/, 'İki tarafı ayrı ayrı hesapla. Sonuçlar aynı mı?'],
    ['e_ozellik', /▲ yerine/, 'Eşitliğin iki tarafındaki sayıları eşleştir. Hangi özellik kullanılmış? Ona göre ▲\'nin yerine geleni bul.'],
    ['e_us', /karesi\) kaçtır/, 'Bir sayının karesi, o sayının kendisiyle çarpımıdır: sayı × sayı.'],
    ['e_us', /küpü\) kaçtır/, 'Bir sayının küpü, o sayının kendisiyle 3 kez çarpımıdır: sayı × sayı × sayı.'],
    ['e_us', /işleminin sonucu/, 'Önce her üslü ifadeyi ayrı ayrı hesapla, sonra işlemi yap.'],
    ['e_us', /Örüntüyü takip et/, 'Tablodaki her satırda soldaki ifadeyi hesapla ve sağdakiyle karşılaştır. Aynı kuralı eksik satıra uygula.'],
    ['e_us', /nasıl okunur/, 'Önce büyük yazılan sayı (taban) okunur. Sağ üstteki küçük sayı 2 ya da 3 ise özel bir adla okunur. Bu ifadede küçük sayı kaç?'],
    ['e_oncelik', /tavuk|ayak/, 'Bir tavuğun ve bir tavşanın kaç ayağı var? Her hayvan grubunun ayaklarını ayrı hesapla, sonra topla.'],
    ['e_oncelik', /\(/, 'Önce parantezin içini hesapla. Sonra çarpma ve bölme, en son toplama ve çıkarma.'],
    ['e_oncelik', /[²³]/, 'İşlem sırası: parantez, üslü ifade, çarpma-bölme, toplama-çıkarma.'],
    ['e_oncelik', /^[\d ]+[×÷] [\d ]+[×÷] [\d ]+ = \?/, 'Çarpma ve bölme aynı önceliktedir: soldan sağa doğru sırayla yap.'],
    ['e_oncelik', /= \?/, 'Önce çarpma ve bölme, sonra toplama ve çıkarma yapılır.'],
    ['e_oruntu', /Örüntüyü takip et/, 'Tablodaki adım numarası ile sayı arasındaki ilişkiyi bul. Aynı kuralı eksik satıra uygula.'],
    ['e_oruntu', /bir sonraki terim/, 'Ardışık iki terimin farkına bak. Her adımda ne kadar artıyor?'],
    ['e_oruntu', /artan örüntünün \d+\. terimi|adımda kaç nokta/, 'Birinci terimden istenen terime kadar kaç kez artış eklenir? Küçük bir örnekte say: 1. terimden 3. terime kaç artış var?'],
    ['e_oruntu', /Boş bir kumbaraya/, 'Başta kumbara boş. Her gün aynı miktar ekleniyor: kaç gün boyunca ekleme yapıldı?'],
    ['e_oruntu', /başta .* vardı/, 'Başlangıçtaki parayı unutma. Üstüne her gün eklenenleri koy.'],
    ['e_oruntu', /kaçıncı adım/, 'Örüntü kaçar artıyor? 1. adımdaki sayıdan bu sayıya ulaşmak için kaç kez artış gerekiyor?'],
    ['e_oruntu', /kuralı hangisidir/, 'Şıklardaki kuralı 1. ve 2. adıma uygulayıp dene. Hangisi örüntünün terimlerini veriyor?'],
    ['e_oruntu', /AYNI miktar/, 'Her şıkta ardışık terimlerin farkını hesapla. Farkları değişen hangisi?'],
    ['e_algoritma', /Sonucu yaz/, 'Adımları sırayla, birer birer uygula. Her adımdan sonra elindeki sayıyı not et.'],
    ['e_algoritma', /Aklından bir sayı tut/, 'Tutulan sayıyla başla ve her işlemi sırayla uygula.'],
    ['e_algoritma', /kaç kez çalışır/, 'Döngüdeki adımı her çalıştırdığında toplamı yaz ve kaç kez yaptığını say.'],
    ['e_algoritma', /Sayaç/, 'Bölünen bölenden küçük olana kadar çıkarmaya devam et; her çıkarmada sayacı 1 artır.'],
    ['e_algoritma', /cevabı "Hayır"/, 'Cevap «Hayır» ise iş henüz bitmemiştir. Eksik olan ne, onu tamamlamak için hangi adıma gitmek gerekir?'],
    ['e_algoritma', /hangi tür adımdır/, 'Bu adımda bir iş yapılmıyor, bir soru soruluyor. Sorunun cevabına göre ne olur?'],
    ['e_algoritma', /hangi adımla başlar/, 'Her akış şemasının bir ilk, bir de son kutusu vardır. İlk kutuda ne yazar?'],
    ['e_algoritma', /tek tek toplamak yerine/, 'Aynı sayıyı tekrar tekrar toplamanın kısa yolu hangi işlemdir?'],
    // TEMA 7
    ['p_olay', /olayının olasılık değeri/, 'Bu olay kesin mi, imkânsız mı, yoksa bazen mi oluyor? Kesin ve imkânsız olayların olasılık değerlerini hatırla.'],
    ['p_olay', /olayı hangisidir/, 'Bu olay her zaman mı oluyor, hiç mi olmuyor, yoksa bazen oluyor bazen olmuyor mu?'],
    ['p_olay', /olayın olasılık değeri kaçtır/, 'Olasılık spektrumunu düşün: hiç olmayacak olaylar bir uçta, mutlaka olacak olaylar öbür uçtadır. Uçlardaki değerleri hatırla.'],
    ['p_olay', /Olasılığı/, 'Olasılık değeri en küçük olabilecek sayıysa, o olay hiç olabilir mi?'],
    ['p_spektrum', /mavi OLMAYAN/, 'Önce mavi olmayan dilimleri say, sonra bütün dilimlerle karşılaştır.'],
    ['p_spektrum', /hangisi söylenebilir/, 'Mavi dilimleri bütün dilimlerle karşılaştır: yarısından az mı, yarısı mı, yarısından fazla mı?'],
    ['p_spektrum', /hangi kesir gösterir/, 'Mavi dilim sayısı parça, bütün dilim sayısı bütündür. Parça-bütün ilişkisini kesirle yaz.'],
    ['p_spektrum', /nasıl bir olaydır/, 'Mavi dilimleri bütün dilimlerle karşılaştır: yarısından az mı, yarısı mı, yarısından fazla mı?'],
    ['p_spektrum', /olasılığı kaçtır/, 'Mavi dilim sayısı parça, bütün dilim sayısı bütündür. Parça-bütün ilişkisini kesirle yaz.'],
    ['p_spektrum', /olma olasılığı çoktur/, 'Hangi renkten daha çok top var? Bir iddia «çünkü…» diye torbadaki top sayılarıyla desteklenmeli.'],
    ['p_spektrum', /adil midir/, 'Oyun adil ise iki oyuncunun kazanma olasılığı eşit olmalı. Küpteki renklerin yüz sayılarını karşılaştır.'],
    ['p_spektrum', /spektrumunda nerededir/, 'Olasılık spektrumunun iki ucunu düşün: bir ucu hiç olmayacak, öbür ucu mutlaka olacak olaylardır. Bu olay hangi uçta ya da ortada?'],
    ['p_spektrum', /olabilir\.?$/, 'Olasılık değeri hangi iki sayı arasında olabilir? Bu değer o aralıkta mı?'],
  ];
  const IPUCU_HATA = { bul: 'Defterdeki satırları sırayla kendin yap. Her satırda doğru kural mı kullanılmış, işlem doğru mu?', kim: 'İki defteri yan yana koy. Nerede ayrılmaya başlıyorlar? O satırda hangisi doğru kuralı kullanmış?', neden: 'İşaretli satırda kullanılan kuralı doğru kuralla karşılaştır. Hangi bilgi karıştırılmış?' };
  const ipucuDuz = (x) => String(x || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
  const ipucuBul = (id, q) => { const p = ipucuDuz(q.prompt); for (const [sk, re, h] of IPUCU) if (sk === id && re.test(p)) return typeof h === 'function' ? h(q) : h; return ''; };
  { const hq = HATA.q; HATA.q = (...a) => { const q = hq(...a); if (!q.hint) q.hint = IPUCU_HATA[q.hata] || ''; return q; }; }
  /* ---- 10.11.2026: tek ya da az kalıplı seviyelere yeni soru kalıpları (§11 A2 «her beceriye 2. şablon») ----
     Ölçüm: her seviyede 1500 soru, sayılar/adlar atılmış metin = kalıp. 1 kalıplı seviyeler önce ele alındı. */
  // n_tahmin: ters yön — hangi sayı yuvarlanınca R olur? Her yanlış şık bir yuvarlama yanılgısının «doğru» sandığı sayıdır.
  ekle('n_tahmin', [1, 2], 0.4, (lv) => {
    const to = lv === 1 ? 10 : 100, ad = to === 10 ? 'onluğa' : 'yüzlüğe', yarim = to / 2; let R; do { R = (to === 10 ? ri(101, 999) : ri(11, 99)) * to; } while (R % (to * 10) === 0);
    let n; do { n = R - yarim + ri(0, to - 1); } while (n === R);
    const nKes = R + ri(yarim, to - 1), nYuk = R - to + ri(1, yarim - 1);
    return Q({ prompt: `Aşağıdaki sayılardan hangisi en yakın ${ad} yuvarlanınca ${fmtN(R)} olur?`,
      options: mc(fmtN(n), [[fmtN(nKes), 'yuvarlama_kesme', `${fmtN(nKes)} sayısında yuvarlayacağın basamağın sağı 5 ya da daha büyük; yukarı yuvarlanır ve ${fmtN(R + to)} olur.`], [fmtN(nYuk), 'yuvarlama_yukari', `${fmtN(nYuk)} sayısında yuvarlayacağın basamağın sağı 5'ten küçük; aşağı yuvarlanır ve ${fmtN(R - to)} olur.`]]),
      hint: 'Her şıkkı tek tek yuvarla: yuvarlayacağın basamağın sağındaki rakam 5 ya da daha büyükse yukarı, küçükse aşağı.',
      steps: [`En yakın ${ad} yuvarlanınca ${fmtN(R)} olan sayılar ${fmtN(R - yarim)} ile ${fmtN(R + yarim - 1)} arasındadır.`, `${fmtN(n)} bu aralıkta; yuvarlanınca ${fmtN(R)} olur.`] });
  });
  // n_tahmin seviye 3: fark ve çarpım tahmini (biri yukarı, biri aşağı yuvarlanır)
  ekle('n_tahmin', [3], 0.5, () => {
    if (Math.random() < 0.5) {
      let a, b; do { a = ri(5, 9) * 1000 + ri(1, 4) * 100 + ri(0, 99); b = ri(1, 4) * 1000 + ri(5, 9) * 100 + ri(0, 99); } while (a - b < 1500);
      const ra = Math.round(a / 1000) * 1000, rb = Math.round(b / 1000) * 1000, fa = Math.floor(a / 1000) * 1000, fb = Math.floor(b / 1000) * 1000;
      return Q({ prompt: `${fmtN(a)} − ${fmtN(b)} farkını sayıları en yakın binliğe yuvarlayarak TAHMİN edin.`,
        options: mc(fmtN(ra - rb), [[fmtN(fa - fb), 'yuvarlama_kesme', `Sayıları yuvarlamadan kestin. ${fmtN(b)} sayısında yüzler basamağı 5 ya da büyük; ${fmtN(rb)} olur.`], [fmtN(a - b), 'tahmin_tam', 'Bu tam sonuç. Tahminde önce sayıları yuvarlayıp sonra işlem yaparız.']]),
        hint: 'Önce iki sayıyı ayrı ayrı en yakın binliğe yuvarla (yüzler basamağına bak), sonra yuvarlanmış sayıları çıkar.',
        steps: [`${fmtN(a)} → ${fmtN(ra)}`, `${fmtN(b)} → ${fmtN(rb)}`, `${fmtN(ra)} − ${fmtN(rb)} = ${fmtN(ra - rb)}`] });
    }
    let a = ri(2, 8) * 10 + ri(5, 9), b = ri(2, 9) * 10 + ri(1, 4); if (Math.random() < 0.5) [a, b] = [b, a];
    const ra = Math.round(a / 10) * 10, rb = Math.round(b / 10) * 10, fa = Math.floor(a / 10) * 10, fb = Math.floor(b / 10) * 10, ca = Math.ceil(a / 10) * 10, cb = Math.ceil(b / 10) * 10;
    return Q({ prompt: `${a} × ${b} çarpımını sayıları en yakın onluğa yuvarlayarak TAHMİN edin.`,
      options: mc(fmtN(ra * rb), [[fmtN(fa * fb), 'yuvarlama_kesme', 'Birler basamağını atıp kestin. Birler basamağı 5 ya da büyük olan sayı yukarı yuvarlanır.'], [fmtN(ca * cb), 'yuvarlama_yukari', 'İki sayıyı da yukarı yuvarladın. Birler basamağı 5\'ten küçük olan sayı aşağı yuvarlanır.'], [fmtN(a * b), 'tahmin_tam', 'Bu tam sonuç. Tahminde önce sayıları yuvarlayıp sonra işlem yaparız.']]),
      hint: 'Önce iki sayıyı ayrı ayrı en yakın onluğa yuvarla (birler basamağına bak), sonra yuvarlanmış sayıları çarp.',
      steps: [`${a} → ${ra}`, `${b} → ${rb}`, `${ra} × ${rb} = ${fmtN(ra * rb)}`] });
  });
  // f_karsilastir: üç kesirden en büyüğü / en küçüğü (seviye 1: eşit payda, seviye 2: eşit pay)
  ekle('f_karsilastir', [1, 2], 0.4, (lv) => {
    const enBuyuk = Math.random() < 0.6;
    if (lv === 1) {
      const d = ri(6, 12), ps = shuffle(Array.from({ length: d - 1 }, (_, i) => i + 1)).slice(0, 3), s = ps.slice().sort((x, y) => x - y), ok = enBuyuk ? s[2] : s[0];
      return Q({ prompt: `${ps.map(p => fr(p, d)).join(', ')}<br>Bu kesirlerden hangisi en ${enBuyuk ? 'büyüktür' : 'küçüktür'}?`, fixed: true,
        options: ps.map(p => p === ok ? { t: fr(p, d), ok: true } : { t: fr(p, d), ok: false, mis: 'esit_payda', ac: `Paydalar eşit (${d}): bütün aynı sayıda eş parçaya bölünmüş. Payı ${enBuyuk ? 'en büyük' : 'en küçük'} olan, ${enBuyuk ? 'en çok' : 'en az'} parçayı alır.` }),
        hint: 'Paydalar eşit: her kesirde parçalar aynı büyüklükte. Kaç parça alındığına bak.',
        steps: [`Paydalar eşit: ${d}.`, `Paylar: ${s.join(' < ')}`, `En ${enBuyuk ? 'büyük' : 'küçük'}: ${fr(ok, d)}`] });
    }
    const n = ri(1, 3), ds = shuffle(Array.from({ length: 10 - n }, (_, i) => i + n + 1)).slice(0, 3), s = ds.slice().sort((x, y) => x - y), ok = enBuyuk ? s[0] : s[2];
    return Q({ prompt: `${ds.map(x => fr(n, x)).join(', ')}<br>Bu kesirlerden hangisi en ${enBuyuk ? 'büyüktür' : 'küçüktür'}?`, fixed: true,
      options: ds.map(x => x === ok ? { t: fr(n, x), ok: true } : { t: fr(n, x), ok: false, mis: 'payda_buyuk', ac: `Paylar eşit (${n}). Payda büyüdükçe bütün daha çok parçaya bölünür ve her parça küçülür.` }),
      hint: 'Paylar eşit. Bir bütünü daha çok parçaya bölünce her parça büyür mü, küçülür mü?',
      steps: [`Paylar eşit: ${n}.`, `Paydası küçük olanın parçaları büyüktür: ${s.map(x => fr(n, x)).join(' > ')}`, `En ${enBuyuk ? 'büyük' : 'küçük'}: ${fr(n, ok)}`] });
  });
  // f_karsilastir seviye 2: günlük hayat (aynı pay, farklı payda)
  ekle('f_karsilastir', [2], 0.4, () => {
    const [A, B] = shuffle(NAMES).slice(0, 2), sey = pick(['çikolatadan', 'pastadan', 'kekten', 'pizzadan']), n = ri(1, 3); let d1, d2; do { d1 = ri(n + 1, 10); d2 = ri(n + 1, 10); } while (d1 === d2);
    const kaz = d1 < d2 ? A : B, kay = kaz === A ? B : A, [dk, db] = [Math.min(d1, d2), Math.max(d1, d2)];
    return Q({ prompt: `Aynı büyüklükteki iki ${sey} birinin ${fr(n, d1)} kadarını ${A}, diğerinin ${fr(n, d2)} kadarını ${B} aldı. Kim daha çok aldı?`,
      options: mc(kaz, [[kay, 'payda_buyuk', `${kay} paydası büyük olan kesri aldı. Paydası büyük olunca bütün daha çok parçaya bölünür, parçalar küçülür.`], ['İkisi eşit aldı', 'pay_payda_ayri', `Paylar aynı (${n}) ama paydalar farklı. Parçaların büyüklüğü farklı olduğu için eşit değildir.`]]),
      hint: 'Paylar aynı. Hangisinde bütün daha az parçaya bölünmüş? Az parçaya bölünen bütünün parçası büyüktür.',
      steps: [`Paylar eşit: ${n}.`, `${fr(n, dk)} > ${fr(n, db)} çünkü ${dk} parçaya bölünen bütünün parçası daha büyüktür.`, `Daha çok alan: ${kaz}`] });
  });
  // f_karsilastir seviye 3: üç kesri sıralama (paydalar birbirinin katı); yanlış sıralar «paya bak» ve «paydaya bak» yanılgılarının sıralarıdır
  ekle('f_karsilastir', [3], 0.4, () => {
    let k, n, ok, sp, sd; do {
      const b = pick([2, 3]); const ds = shuffle([b, b * 2, b * 4]); k = ds.map(d => ({ d, p: ri(1, d - 1) }));
      const v = (x) => x.p / x.d; n = new Set(k.map(v)).size === 3 && new Set(k.map(x => x.p)).size === 3;
      ok = k.slice().sort((x, y) => v(x) - v(y)); sp = k.slice().sort((x, y) => x.p - y.p); sd = k.slice().sort((x, y) => x.d - y.d);
    } while (!n || [ok, sp, sd].map(s => s.map(x => x.p + '/' + x.d).join()).some((t, i, a) => a.indexOf(t) !== i));
    const D = Math.max(...k.map(x => x.d)), yaz = (s) => s.map(x => fr(x.p, x.d)).join(' < ');
    return Q({ prompt: `${k.map(x => fr(x.p, x.d)).join(', ')}<br>Bu kesirlerin küçükten büyüğe doğru sıralanışı hangisidir?`,
      options: mc(yaz(ok), [[yaz(sp), 'pay_payda_ayri', 'Yalnız paylara baktın. Paydalar farklıyken parçalar farklı büyüklüktedir; önce paydaları eşitle.'], [yaz(sd), 'payda_buyuk', 'Paydası büyük olanı büyük saydın. Payda büyüdükçe parçalar küçülür; önce paydaları eşitle.']]),
      hint: `Paydaları eşitle: her kesri paydası en büyük payda olan denk kesre çevir, sonra payları karşılaştır.`,
      steps: [...k.map(x => `${fr(x.p, x.d)} = ${fr(x.p * D / x.d, D)}`), `Paylara bak: ${yaz(ok)}`] });
  });
  // g_aci_iliski: komşu açılar ve «bütünler mi?» (seviye 1–2)
  ekle('g_aci_iliski', [1, 2], 0.4, (lv) => {
    const x = (lv === 1 ? ri(2, 8) : ri(3, 16)) * 10 + pick([0, 5]);
    if (lv === 1) {
      if (Math.random() < 0.5) return Q({ type: 'input', prompt: `Bir dik açı, iki komşu açıya ayrılmıştır. Açılardan biri ${x}° ise diğeri kaç derecedir?`, answer: String(90 - x), unit: '°',
        inputMis: [{ v: 180 - x, mis: 'tumler_butunler' }], hint: 'Dik açının ölçüsünü hatırla. İki komşu açı birlikte onu oluşturur.', steps: ['Dik açı 90°. İki komşu açı birlikte 90° eder: tümler açılar.', `90 − ${x} = ${90 - x}°`] });
      let y; do { y = ri(2, 8) * 10 + pick([0, 5]); } while (y === x || y === 90 - x);
      return Q({ prompt: 'Aşağıdaki açı çiftlerinden hangisi birbirinin tümleridir?', options: mc(`${x}° ve ${90 - x}°`, [[`${x}° ve ${180 - x}°`, 'tumler_butunler', `Bu iki açının toplamı 180°; bunlar bütünler. Tümler açıların toplamı 90° olmalı.`], [`${y}° ve ${180 - y}°`, 'tumler_butunler', `Bu iki açının toplamı 180°; bunlar bütünler. Tümler açıların toplamı 90° olmalı.`]]),
        hint: 'Her çiftin açılarını topla. Tümler açıların toplamı kaç derece olmalı?', steps: [`${x} + ${90 - x} = 90`, 'Toplamı 90° olan iki açı tümlerdir.'] });
    }
    if (Math.random() < 0.5) return Q({ type: 'input', prompt: `Bir doğru açı, iki komşu açıya ayrılmıştır. Açılardan biri ${x}° ise diğeri kaç derecedir?`, answer: String(180 - x), unit: '°',
      inputMis: [...(x < 90 ? [{ v: 90 - x, mis: 'tumler_butunler' }] : []), { v: 360 - x, mis: 'tumler_butunler' }], hint: 'Doğru açının ölçüsünü hatırla. İki komşu açı birlikte onu oluşturur.', steps: ['Doğru açı 180°. İki komşu açı birlikte 180° eder: bütünler açılar.', `180 − ${x} = ${180 - x}°`] });
    const tip = pick([180, 90, 170]), y = tip - x > 0 ? tip - x : 180 - x, top = x + y;
    return tfQ({ prompt: `${x}° ve ${y}° ölçülerindeki iki açı birbirinin bütünleridir.`, hint: 'İki açıyı topla. Bütünler açıların toplamı kaç derece olmalı?',
      steps: [`${x} + ${y} = ${top}`, top === 180 ? 'Toplam 180° → bütünler. İfade DOĞRU.' : top === 90 ? 'Toplam 90° → bunlar tümler, bütünler değil. İfade YANLIŞ.' : `Toplam ${top}°, 180° değil. İfade YANLIŞ.`] }, top === 180, 'tumler_butunler');
  });
  // e_oncelik: yeni biçimler (seviye 1: çıkarma/bölme ile; seviye 2: parantez + iki işlem)
  ekle('e_oncelik', [1], 0.5, () => {
    const t = pick(['eksi', 'bol', 'iki']);
    if (t === 'eksi') { const b = ri(2, 9), c = ri(2, 9), a = b * c + ri(3, 30); const yan = (a - b) * c; return Q({ type: 'input', prompt: `${a} − ${b} × ${c} = ?`, answer: String(a - b * c), inputMis: yan !== a - b * c ? [{ v: yan, mis: 'oncelik_soldan' }] : [], hint: 'Çıkarma ile çarpma bir arada: hangisi önce yapılır?', steps: ['Önce çarpma!', `${b} × ${c} = ${b * c}`, `${a} − ${b * c} = ${a - b * c}`] }); }
    if (t === 'bol') { const c = ri(2, 9), b = c * ri(2, 9), a = ri(3, 30); const sol = (a + b) % c === 0 ? (a + b) / c : null; return Q({ type: 'input', prompt: `${a} + ${b} ÷ ${c} = ?`, answer: String(a + b / c), inputMis: sol !== null && sol !== a + b / c ? [{ v: sol, mis: 'oncelik_soldan' }] : [], hint: 'Toplama ile bölme bir arada: hangisi önce yapılır?', steps: ['Önce bölme!', `${b} ÷ ${c} = ${b / c}`, `${a} + ${b / c} = ${a + b / c}`] }); }
    let a, b, c, d; do { a = ri(3, 9); b = ri(3, 9); c = ri(2, 6); d = ri(2, 6); } while (a * b <= c * d || (a * b - c) * d === a * b - c * d);
    return Q({ type: 'input', prompt: `${a} × ${b} − ${c} × ${d} = ?`, answer: String(a * b - c * d), inputMis: [{ v: (a * b - c) * d, mis: 'oncelik_soldan' }], hint: 'İki çarpma ve bir çıkarma var. Hangileri önce yapılır?', steps: ['Önce iki çarpma:', `${a} × ${b} = ${a * b} ve ${c} × ${d} = ${c * d}`, `${a * b} − ${c * d} = ${a * b - c * d}`] });
  });
  ekle('e_oncelik', [2], 0.4, () => {
    if (Math.random() < 0.5) { let a, b, c, d; do { a = ri(2, 9); b = ri(5, 12); c = ri(1, b - 2); d = ri(2, 15); } while (a * b - c + d === a * (b - c) + d);
      return Q({ type: 'input', prompt: `${a} × (${b} − ${c}) + ${d} = ?`, answer: String(a * (b - c) + d), inputMis: [{ v: a * b - c + d, mis: 'oncelik_soldan' }], hint: 'Parantez varsa önce neresi yapılır? Sonra çarpma mı, toplama mı?', steps: [`Önce parantez: ${b} − ${c} = ${b - c}`, `Sonra çarpma: ${a} × ${b - c} = ${a * (b - c)}`, `En son toplama: ${a * (b - c)} + ${d} = ${a * (b - c) + d}`] }); }
    let a, b, c, d; do { a = ri(2, 20); b = ri(2, 9); c = ri(2, 9); d = ri(1, 15); } while (d >= a + b * c || (a + b) * c - d === a + b * c - d);
    return Q({ type: 'input', prompt: `${a} + ${b} × ${c} − ${d} = ?`, answer: String(a + b * c - d), inputMis: [{ v: (a + b) * c - d, mis: 'oncelik_soldan' }], hint: 'Toplama, çarpma ve çıkarma bir arada. Önce hangisi?', steps: [`Önce çarpma: ${b} × ${c} = ${b * c}`, `Sonra soldan sağa: ${a} + ${b * c} = ${a + b * c}`, `${a + b * c} − ${d} = ${a + b * c - d}`] });
  });
  // e_esitlik seviye 1: boş yer başka yerde, çarpmalı eşitlik, «hangisi doğru bir eşitlik?»
  ekle('e_esitlik', [1], 0.5, () => {
    const t = pick(['yer', 'carp', 'hangi']);
    if (t === 'yer') { let a, b, c; do { a = ri(3, 12); b = ri(2, 12); c = ri(2, 12); } while (a >= b + c || a === b || a === c); const top = b + c, bas = Math.random() < 0.5;
      return Q({ type: 'input', prompt: `${bas ? '.......' : a} + ${bas ? a : '.......'} = ${b} + ${c}   Boş yere hangi sayı gelmelidir?`, answer: String(top - a), inputMis: [{ v: top, mis: 'esittir_sonuc' }, { v: top + a, mis: 'esittir_sonuc' }], hint: 'Eşittir işaretinin iki yanı aynı değerde olmalı. Önce bilinen tarafı hesapla.', steps: [`Sağ taraf: ${b} + ${c} = ${top}`, `Sol taraf da ${top} olmalı.`, `${top} − ${a} = ${top - a}`] }); }
    if (t === 'carp') { const c = ri(2, 5), m = ri(2, 4), y = ri(2, 5), a = c * m, x = m * y;
      return Q({ type: 'input', prompt: `${a} × ${y} = ${c} × .......   Boş yere hangi sayı gelmelidir?`, answer: String(x), inputMis: [{ v: a * y, mis: 'esittir_sonuc' }], hint: 'Eşittir işaretinin iki yanı aynı değerde olmalı. Önce sol tarafı hesapla.', steps: [`Sol taraf: ${a} × ${y} = ${a * y}`, `${c} × ....... = ${a * y} olmalı.`, `${a * y} ÷ ${c} = ${x}`] }); }
    const a = ri(3, 12), b = ri(3, 12), e = ri(2, 6); let c; do { c = ri(2, a + b - 2); } while (c === a || c === b);
    return Q({ prompt: 'Aşağıdakilerden hangisi doğru bir eşitliktir?', options: mc(`${a} + ${b} = ${c} + ${a + b - c}`, [[`${a} + ${b} = ${a + b} + ${e}`, 'esittir_sonuc', `"=" işareti "sonucu yaz" demek değildir; iki yan aynı değerde olmalı. Sağ taraf ${a + b + e}, sol taraf ${a + b}.`], [`${a} + ${b} = ${a + 1} + ${b + 1}`, 'denge_bozma', `İki terimi de 1 artırınca toplam 2 artar: sağ taraf ${a + b + 2}, sol taraf ${a + b}. Denge bozulur.`]]),
      hint: 'Her şıkta eşittirin iki yanını ayrı ayrı hesapla. İki yan aynı mı?', steps: [`Sol: ${a} + ${b} = ${a + b}`, `Sağ: ${c} + ${a + b - c} = ${a + b}`, 'İki yan eşit → doğru eşitlik.'] });
  });
  // a_cevre seviye 1: kare ve eşkenar üçgen
  ekle('a_cevre', [1], 0.35, () => {
    const k = ri(3, 15);
    if (Math.random() < 0.5 && k !== 4) return Q({ type: 'input', prompt: `Bir kenarı ${k} cm olan karenin çevre uzunluğu kaç cm'dir?`, answer: String(4 * k), unit: 'cm', inputMis: [{ v: k * k, mis: 'cevre_alan' }, { v: 2 * k, mis: 'cevre_yarim' }], hint: 'Karenin kaç kenarı var ve kenarları nasıl? Çevre, bütün kenarların toplamıdır.', steps: ['Karenin 4 kenarı eşittir.', `${k} + ${k} + ${k} + ${k} = ${4 * k} cm`] });
    return Q({ type: 'input', prompt: `Bütün kenarları ${k} cm olan bir üçgenin çevre uzunluğu kaç cm'dir?`, answer: String(3 * k), unit: 'cm', inputMis: [{ v: 4 * k, mis: 'cokgen_sayi' }, { v: 2 * k, mis: 'cevre_yarim' }], hint: 'Üçgenin kaç kenarı var? Çevre, bütün kenarların toplamıdır.', steps: ['Üçgenin 3 kenarı var, hepsi eşit.', `${k} + ${k} + ${k} = ${3 * k} cm`] });
  });
  // a_alan seviye 1–2: alanı ve bir kenarı verilen dikdörtgenin diğer kenarı
  ekle('a_alan', [1, 2], 0.35, () => {
    const [a, b] = dikKenar(3), A = a * b, [ver, ist] = Math.random() < 0.5 ? [a, b] : [b, a], yan = [{ v: A - ver, mis: 'ters_islem' }];
    if (A % 2 === 0 && A / 2 - ver > 0 && A / 2 - ver !== ist && A / 2 - ver !== A - ver) yan.push({ v: A / 2 - ver, mis: 'cevre_alan' });
    return Q({ type: 'input', prompt: `Alanı ${A} m² olan dikdörtgen biçimindeki bir halının bir kenarı ${ver} m'dir. Diğer kenarı kaç metredir?`, answer: String(ist), unit: 'm', inputMis: yan.filter(m => m.v !== ist),
      hint: 'Dikdörtgenin alanı iki kenarın çarpımıdır. Hangi sayıyı bu kenarla çarpınca alan çıkar?', steps: [`Alan = kenar × kenar → ${ver} × ....... = ${A}`, `${A} ÷ ${ver} = ${ist} m`] });
  });
  // a_cevre_alan seviye 3: çevreleri eşit iki dikdörtgenin alanlarını karşılaştırma
  ekle('a_cevre_alan', [3], 0.45, () => {
    const h = pick([8, 10, 12]); let x, y; do { x = ri(1, h / 2 - 1); y = ri(x + 1, h / 2); } while ((h - x) * x === (h - y) * y);
    const A1 = (h - x) * x, A2 = (h - y) * y, [kx, ky] = A2 > A1 ? [`${h - y} cm × ${y} cm`, `${h - x} cm × ${x} cm`] : [`${h - x} cm × ${x} cm`, `${h - y} cm × ${y} cm`];
    return Q({ prompt: `${h - x} cm × ${x} cm ve ${h - y} cm × ${y} cm boyutlarında iki dikdörtgen var. Hangisi doğrudur?`,
      options: mc(`Çevreleri eşittir; alanı büyük olan ${kx} olandır.`, [['Çevreleri eşit olduğu için alanları da eşittir.', 'cevre_alan_ayni', `Çevreleri eşit (${2 * h} cm) ama alanları ${A1} cm² ve ${A2} cm²: farklı.`], [`Alanları eşittir; çevresi büyük olan ${ky} olandır.`, 'cevre_alan', `Çevre ile alanı karıştırdın. Çevreler eşit (${2 * h} cm), alanlar farklı.`]]),
      hint: 'İki dikdörtgenin önce çevrelerini, sonra alanlarını ayrı ayrı hesapla.',
      steps: [`Çevreler: 2 × (${h - x} + ${x}) = ${2 * h} cm ve 2 × (${h - y} + ${y}) = ${2 * h} cm`, `Alanlar: ${h - x} × ${x} = ${A1} cm² ve ${h - y} × ${y} = ${A2} cm²`, 'Çevreleri eşit dikdörtgenlerin alanları farklı olabilir.'] });
  });
  // n_toplacikar: seviye 1 günlük hayat problemi, seviye 2 bilinmeyen eksilen/çıkan
  ekle('n_toplacikar', [1], 0.35, () => {
    const a = ri(10, 60) * 1000 + ri(0, 999), b = ri(1, 9) * 1000 + ri(100, 999), ekle_ = Math.random() < 0.5, ans = ekle_ ? a + b : a - b, yan = [{ v: ekle_ ? a - b : a + b, mis: 'ters_islem' }];
    if (ekle_ && a % 10 + b % 10 >= 10) yan.push({ v: ans - 10, mis: 'elde_unutma' });
    return Q({ type: 'input', prompt: ekle_ ? `Bir kütüphanede ${fmtN(a)} kitap vardı. ${fmtN(b)} kitap daha geldi. Kütüphanede kaç kitap oldu?` : `Bir kütüphanede ${fmtN(a)} kitap vardı. ${fmtN(b)} kitap başka okullara gönderildi. Kütüphanede kaç kitap kaldı?`,
      answer: String(ans), unit: 'kitap', inputMis: yan, hint: ekle_ ? 'Kitaplar arttı mı, azaldı mı? Buna göre hangi işlemi yaparsın?' : 'Kitaplar arttı mı, azaldı mı? Buna göre hangi işlemi yaparsın?',
      steps: [ekle_ ? 'Kitap geldi → sayı artar → toplama.' : 'Kitap gönderildi → sayı azalır → çıkarma.', `${fmtN(a)} ${ekle_ ? '+' : '−'} ${fmtN(b)} = ${fmtN(ans)}`] });
  });
  ekle('n_toplacikar', [2], 0.4, () => {
    const a = ri(12, 60) * 1000 + ri(0, 999), b = ri(2, 9) * 1000 + ri(0, 999);
    if (Math.random() < 0.5) return Q({ type: 'input', prompt: `....... − ${fmtN(b)} = ${fmtN(a)}   Boş yere hangi sayı gelmelidir?`, answer: String(a + b), inputMis: [{ v: a - b, mis: 'ters_islem' }], hint: 'Bir sayıdan bir şey çıkarınca kalan verilmiş. Başta kaç vardı? Ters işlemi düşün.', steps: ['Eksilen = fark + çıkan', `${fmtN(a)} + ${fmtN(b)} = ${fmtN(a + b)}`] });
    return Q({ type: 'input', prompt: `${fmtN(a)} − ....... = ${fmtN(b)}   Boş yere hangi sayı gelmelidir?`, answer: String(a - b), inputMis: [{ v: a + b, mis: 'ters_islem' }], hint: 'Büyük sayıdan ne kadar çıkarınca küçük sayı kalır? Ters işlemi düşün.', steps: ['Çıkan = eksilen − fark', `${fmtN(a)} − ${fmtN(b)} = ${fmtN(a - b)}`] });
  });
  // n_carpbol seviye 1: 10, 100, 1000'e bölme
  ekle('n_carpbol', [1], 0.35, () => {
    const z = pick([10, 100, 1000]), q = pick([3, 4, 5, 6, 7, 8, 9, 12, 15, 25, 45]) * pick([1, 10]), n = q * z, sifir = String(z).length - 1;
    return Q({ prompt: `${fmtN(n)} ÷ ${fmtN(z)} işleminin sonucu kaçtır?`, options: mc(fmtN(q), [[fmtN(q * 10), 'sifir_sayisi', `Bir sıfır eksik attın. ${fmtN(z)} ile bölerken sondan ${sifir} sıfır atılır.`], ...(q % 10 === 0 ? [[fmtN(q / 10), 'sifir_sayisi', `Bir sıfır fazla attın. ${fmtN(z)} ile bölerken sondan ${sifir} sıfır atılır.`]] : []), [fmtN(n * z), 'ters_islem', 'Çarptın. Bölmede sayı küçülür; sondan sıfır atılır.']]),
      hint: '10, 100 ya da 1000 ile bölerken sondan kaç sıfır atılır? Bölen sayıdaki sıfırları say.', steps: [`${fmtN(z)} sayısında ${sifir} sıfır var.`, `${fmtN(n)} sayısının sonundan ${sifir} sıfır atılır: ${fmtN(q)}`] });
  });
  G.MY_GEN = GEN; G.MY_MIS = MIS; G.MY_KES = KES_CHECK; G.MY_OLC = OLC_CHECK; G.MY_GRAF = GRAF_CHECK; G.MY_HATA = HATA; G.MY_ATOLYE = ATOLYE;
  for (const [id, e] of Object.entries(EK)) { const base = GEN[id]; GEN[id] = (lv) => { const L = e.L[lv]; return L && Math.random() < e.p ? pick(L)(lv) : base(lv); }; }
  // Soruya özel ipucu en son eklenir (EK dahil bütün üreticilerin üstünde)
  for (const id of Object.keys(GEN)) { const base = GEN[id]; GEN[id] = (lv) => { const q = base(lv); if (!q.hint && !q.hata && !q.atolye) q.hint = q.type === 'match' ? 'Önce emin olduğun çifti eşleştir. Geriye kalanlar arasında seçmek kolaylaşır.' : ipucuBul(id, q); return q; }; }
  if (typeof module !== 'undefined') module.exports = { GEN, MIS, KES_CHECK, OLC_CHECK, GRAF_CHECK, HATA, ATOLYE };
})(typeof window !== 'undefined' ? window : globalThis);
