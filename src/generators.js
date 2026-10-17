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
    nokta_sayma: { t: 'Doğru parçalarını eksik sayma', fix: 'Sadece yan yana olanları değil, aradaki noktaları atlayan doğru parçalarını da say: A-C de bir doğru parçasıdır.' },
    cap_yaricap: { t: 'Çap ile yarıçapı karıştırma', fix: 'Çap, merkezden geçip çemberin iki ucuna değer. Çap = 2 × yarıçap.' },
    dik_yatay: { t: '"Dik olmak için yatay-dikey olmalı" sanma', fix: 'İki doğru dönük çizilse de aralarındaki açı 90° ise birbirine diktir. Köşedeki küçük kare işareti bunu gösterir.' },
    paralel_kesisen: { t: 'Paralel ile kesişeni karıştırma', fix: 'Paralel doğrular ne kadar uzatılırsa uzatılsın hiç kesişmez, aralarındaki uzaklık hep aynıdır.' },
    aci_tur: { t: 'Açı türlerini karıştırma', fix: '90°\'den küçükse dar, tam 90° ise dik, 90° ile 180° arasındaysa geniş açıdır. 180° doğru açı, 360° tam açıdır.' },
    iletki_ters: { t: 'İletkide yanlış ölçeği okuma', fix: 'İletkide iki sıra sayı vardır. Açının kolu hangi taraftaki 0\'dan başlıyorsa o sıradaki sayıyı oku. Açı dar görünüyorsa ölçüsü 90\'dan küçük olmalı.' },
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
    // Ölçme
    cevre_yarim: { t: 'Çevreyi hesaplarken sadece iki kenarı toplama', fix: 'Çevre, şeklin etrafındaki TÜM kenarların toplamıdır. Dikdörtgenin 4 kenarı vardır: Çevre = 2 × (uzun kenar + kısa kenar).' },
    cevre_alan: { t: 'Çevre ile alanı karıştırma', fix: 'Çevre bir uzunluktur (etrafını dolaşmak, cm). Alan ise yüzeyin kapladığı yerdir (içini kaplamak, cm²).' },
    birim: { t: 'Alan birimini yanlış yazma', fix: 'Alan birim karelerle ölçülür: cm², m². Uzunluk birimi (cm, m) alan için kullanılmaz.' },
    ters_cevre: { t: 'Çevreden kenar bulurken yarıya bölmeyi unutma', fix: 'Çevre = 2 × (a + b) olduğu için önce çevreyi 2\'ye böl (a + b), sonra bilinen kenarı çıkar.' },
    cevre_alan_ayni: { t: '"Çevreleri eşitse alanları da eşittir" sanma', fix: 'Aynı çevreye sahip dikdörtgenlerin alanları farklı olabilir. Kenarlar birbirine yaklaştıkça alan büyür; en büyük alan kareye aittir.' },
    // Kesirler
    kesir_tur: { t: 'Kesir türlerini karıştırma', fix: 'Pay paydadan küçükse basit, pay 1 ise birim kesir, pay paydaya eşit ya da büyükse bileşik kesirdir.' },
    tamsayili: { t: 'Bileşik ↔ tam sayılı kesir dönüşüm hatası', fix: 'Payı paydaya böl: Bölüm tam kısım, kalan yeni pay olur, payda aynı kalır. Geri dönüş: (tam × payda) + pay.' },
    denk_toplama: { t: 'Denk kesir için pay ve paydaya aynı sayıyı ekleme', fix: 'Denk kesir için pay ve paydayı aynı sayıyla ÇARP veya BÖL. Toplamak kesrin değerini değiştirir.' },
    ondalik_basamak: { t: 'Ondalık gösterimde basamak sayısını karıştırma', fix: 'Paydası 10 ise virgülden sonra 1, paydası 100 ise 2 basamak olur: 3/100 = 0,03.' },
    ondalik_okunus: { t: 'Ondalık gösterimi yanlış okuma', fix: 'Virgülden sonra 1 basamak varsa "onda", 2 basamak varsa "yüzde" diye okunur: 4,25 → dört tam yüzde yirmi beş.' },
    yuzde_ondalik: { t: 'Yüzdeyi ondalığa yanlış çevirme', fix: '% işareti "yüzde", yani paydası 100 demektir: %5 = 5/100 = 0,05 (0,5 değil!).' },
    payda_buyuk: { t: '"Paydası büyük olan kesir büyüktür" sanma', fix: 'Payda bütünün kaç parçaya bölündüğünü gösterir. Parça sayısı arttıkça her parça KÜÇÜLÜR: 1/8 < 1/3.' },
    bos_kisim: { t: 'Boyalı yerine boş kısmı sayma', fix: 'Kesrin payı, istenen (boyalı) parça sayısıdır. Boş kalan parçaları değil, boyadığın parçaları say.' },
    pay_payda_ters: { t: 'Pay ile paydayı karıştırma', fix: 'Payda (alttaki sayı) bütünün kaç EŞ parçaya bölündüğünü, pay (üstteki sayı) bu parçalardan kaçının alındığını söyler.' },
    kesir_model: { t: 'Bütünü ve parçaları karıştırma', fix: 'Önce bütünü paydadaki sayı kadar EŞ parçaya böl, sonra paydaki sayı kadar parçayı al. Parça sayısı ile alınan sayıyı ayrı ayrı say.' },
    cizgi_sayma: { t: 'Sayı doğrusunda çizgileri sayma', fix: 'Sayı doğrusunda çizgileri değil, ARALIKLARI say. 0\'dan başla; her atlama bir parçadır. 0 noktası sayılmaz.' },
    pay_payda_ayri: { t: 'Kesirleri karşılaştırırken sadece paya bakma', fix: 'Paydalar farklıysa önce paydaları eşitle (genişlet), sonra payları karşılaştır.' },
    uzun_buyuk: { t: '"Basamağı çok olan ondalık sayı büyüktür" sanma', fix: 'Ondalık sayıları karşılaştırırken önce tam kısma, sonra onda birler basamağına bak: 0,7 > 0,58 çünkü 7 onda > 5 onda.' },
    sifir_fark: { t: 'Sondaki sıfırın değeri değiştirdiğini sanma', fix: 'Ondalık kısmın sonuna eklenen sıfır değeri değiştirmez: 0,7 = 0,70 (7 onda = 70 yüzde).' },
    // İstatistik
    soru_tek: { t: 'Araştırma sorusunu tek kişiye/tek cevaba yönlendirme', fix: 'İstatistiksel araştırma sorusu bir GRUBA sorulur ve birden çok farklı cevabı olabilir.' },
    adim_sira: { t: 'Araştırma adımlarının sırasını karıştırma', fix: 'Sıra: 1) Araştırma sorusunu belirle 2) Veri topla 3) Görselleştir 4) Özetle ve yorumla.' },
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
    oruntu_baslangic: { t: 'Örüntüde başlangıç değerini hesaba katmama', fix: 'n. adım = ilk terim + (n − 1) × artış. Sadece artış × n demek ilk terimi unutmak olur.' },
    oruntu_bir: { t: 'Örüntüde adım sayısını bir fazla sayma', fix: '1. adımda henüz hiç artış olmadı. n. adıma gelene kadar (n − 1) kez artış olur.' },
    algoritma_sira: { t: 'Algoritma adımlarını sırasız uygulama', fix: 'Algoritma adımları yazıldığı sırayla, tek tek uygulanır. Her adımdan sonra elindeki sayıyı not et.' },
    dongu_sayma: { t: 'Döngü tekrarlarını yanlış sayma', fix: 'Döngünün her turunda değeri yaz ve koşulu kontrol et. Kaç kez tekrar ettiğini tek tek işaretle.' },
    // Olasılık
    olay_tur: { t: 'Kesin, imkânsız ve mümkün olayları karıştırma', fix: 'Kesin olay mutlaka olur (olasılık 1), imkânsız olay asla olmaz (0). Arada kalanlar mümkün olaylardır.' },
    olasilik_buyuk: { t: 'Olasılığın 1\'den büyük olabileceğini sanma', fix: 'Olasılık her zaman 0 ile 1 arasındadır (%0 ile %100). İstenen durum sayısı tüm durumlardan fazla olamaz.' },
    olasilik_oran: { t: 'Olasılık kesrini yanlış kurma', fix: 'Olasılık = istenen durum sayısı / tüm durumların sayısı. Paydaya tüm dilimleri yaz.' },
    az_cok: { t: 'Az olası ile çok olasıyı karıştırma', fix: '1/2\'den küçük olasılıklar az olası, 1/2\'den büyükler çok olasıdır. Tam 1/2 ise eşit olasıdır.' },
    sifir_basta: { t: 'En küçük sayıyı 0 ile başlatma', fix: 'Bir sayının en soldaki basamağı 0 olamaz. En küçük sayıyı yazarken önce 0 dışındaki en küçük rakamı, hemen ardından 0\'ı yaz.' },
    fiyat_okuma: { t: 'Fiyatı lira-kuruş olarak yanlış okuma', fix: 'Virgülün solu lira, sağı kuruştur. 1 lira 100 kuruş olduğu için virgülden sonra hep 2 basamak yazılır: 14,50 TL → on dört lira elli kuruş.' },
    hata_yeri: { t: 'Doğru bir adımı hatalı sanma', fix: 'Her adımı kendin yeniden hesapla. Hatalı adım, sonucun bozulmaya başladığı ilk adımdır; sonraki adımlar o hatayı taşır.' },
    genel: { t: 'İşlem hatası', fix: 'Çözümü adım adım tekrar kontrol et.' },
  };

  /* ------------ yardımcılar ------------ */
  // Doğru + yanlışlardan şık seti; aynı metinleri ayıklar
  function mc(correct, wrongs, fillers) {
    const seen = new Set([String(correct)]), opts = [{ t: String(correct), ok: true }];
    for (const [t, mis] of wrongs) { const k = String(t); if (!seen.has(k) && opts.length < 4) { seen.add(k); opts.push({ t: k, ok: false, mis }); } }
    if (fillers) for (const [t, mis] of fillers) { const k = String(t); if (!seen.has(k) && opts.length < 4) { seen.add(k); opts.push({ t: k, ok: false, mis: mis || 'genel' }); } }
    return shuffle(opts);
  }
  // Sayısal yakın yanlışlar (dolgu için)
  const near = (v, f = (x) => fmtN(x)) => [[f(v + ri(1, 3) * (v > 50 ? 10 : 1)), 'genel'], [f(Math.max(0, v - ri(1, 3) * (v > 50 ? 10 : 1))), 'genel'], [f(v + 1), 'genel'], [f(Math.max(0, v - 1)), 'genel']];
  const Q = (o) => Object.assign({ type: 'mc', hint: '', steps: [] }, o);
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
      const wr = { dp: [['Doğru', 'dp_dogru'], ['Işın', 'isin_dogru']], isin: [['Doğru', 'isin_dogru'], ['Doğru parçası', 'dp_dogru']], dogru: [['Işın', 'isin_dogru'], ['Doğru parçası', 'dp_dogru']] }[k];
      return Q({ prompt: 'Şekildeki geometrik çizimin adı nedir?', visual: V.lineKind(k), options: mc(name[k], wr, [['Nokta', 'genel']]), steps: ['Uçlarına bak: iki uç noktası varsa doğru parçası,', 'bir başlangıç noktası ve tek ok varsa ışın,', 'iki yönde ok varsa doğrudur.'], hint: 'Okların sayısına bak!' });
    }
    if (lv === 2) {
      const it = pick([
        ['[AB] gösterimi neyi ifade eder?', 'AB doğru parçasını', [['AB ışınını', 'isin_dogru'], ['AB doğrusunu', 'dp_dogru'], ['AB uzunluğunu', 'dp_dogru']]],
        ['[AB gösterimi neyi ifade eder?', 'A noktasından başlayan AB ışınını', [['AB doğru parçasını', 'isin_dogru'], ['AB doğrusunu', 'isin_dogru'], ['B noktasından başlayan ışını', 'isin_dogru']]],
        ['|AB| gösterimi neyi ifade eder?', 'AB doğru parçasının uzunluğunu', [['AB doğrusunu', 'dp_dogru'], ['AB ışınını', 'isin_dogru'], ['A ile B noktalarını', 'genel']]],
        ['Hangisi iki yönde de sınırsız uzar?', 'Doğru', [['Işın', 'isin_dogru'], ['Doğru parçası', 'dp_dogru'], ['Nokta', 'genel']]],
        ['Hangisinin uzunluğu ölçülebilir?', 'Doğru parçası', [['Doğru', 'dp_dogru'], ['Işın', 'isin_dogru'], ['Hiçbiri', 'dp_dogru']]],
      ]);
      return Q({ prompt: it[0], options: mc(it[1], it[2]), steps: ['[AB]: iki uç noktalı doğru parçası.', '[AB: A\'dan başlayıp B yönünde sonsuza giden ışın.', '|AB|: doğru parçasının uzunluğu.'] });
    }
    const n = pick([3, 4]), ans = n * (n - 1) / 2, labels = ['A', 'B', 'C', 'D'].slice(0, n).join(', ');
    return Q({ type: 'input', prompt: `Bir doğru üzerinde sırasıyla ${labels} noktaları var. Bu noktalarla kaç farklı doğru parçası oluşur?`, answer: String(ans), inputMis: [{ v: n - 1, mis: 'nokta_sayma' }], steps: n === 3 ? ['Yan yana olanlar: [AB], [BC] → 2 tane', 'Atlayan: [AC] → 1 tane', 'Toplam 3 doğru parçası.'] : ['Yan yana: [AB], [BC], [CD] → 3', 'Bir atlayan: [AC], [BD] → 2', 'İki atlayan: [AD] → 1', 'Toplam 6.'], hint: 'Sadece yan yana olanları sayma!' });
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
        ['Çemberin merkezinden geçen ve iki ucu çember üzerinde olan doğru parçasına ne denir?', 'Çap', [['Yarıçap', 'cap_yaricap'], ['Merkez', 'genel'], ['Daire', 'genel']]],
        ['Merkezi çember üzerindeki bir noktaya birleştiren doğru parçasına ne denir?', 'Yarıçap', [['Çap', 'cap_yaricap'], ['Çember', 'genel'], ['Kiriş', 'genel']]],
        ['Çember ile iç bölgesinin birleşimine ne denir?', 'Daire', [['Çember', 'genel'], ['Çap', 'cap_yaricap'], ['Merkez', 'genel']]],
      ]);
      return Q({ prompt: it[0], options: mc(it[1], it[2]), steps: ['Çember: sadece kenar çizgisi. Daire: çember + içi.', 'Yarıçap: merkez → çember. Çap: çemberden çembere, merkezden geçerek.'] });
    }
    const d = 2 * ri(4, 12) * 2, r2 = d / 4;
    return Q({ type: 'input', prompt: `Çapı ${d} cm olan bir çemberle aynı merkezli ikinci bir çemberin yarıçapı, birinci çemberin yarıçapının yarısı kadardır. İkinci çemberin ÇAPI kaç cm'dir?`, answer: String(2 * r2), unit: 'cm', inputMis: [{ v: r2, mis: 'cap_yaricap' }, { v: d, mis: 'cap_yaricap' }], steps: [`1. çemberin yarıçapı: ${d} ÷ 2 = ${d / 2} cm`, `2. çemberin yarıçapı: ${d / 2} ÷ 2 = ${r2} cm`, `2. çemberin çapı: 2 × ${r2} = ${2 * r2} cm`] });
  };
  GEN.g_dikme_paralel = (lv) => {
    const names = { dik: 'd ⊥ k (birbirine diktir)', paralel: 'd // k (paraleldir)', kesisen: 'Kesişir ama dik değildir' };
    if (lv === 1 || lv === 2) {
      const rel = pick(['dik', 'paralel', 'kesisen']), rot = lv === 2 ? pick([20, 30, -25, 35]) : 0;
      const wr = Object.keys(names).filter(k => k !== rel).map(k => [names[k], rel === 'dik' || k === 'dik' ? 'dik_yatay' : 'paralel_kesisen']);
      return Q({ prompt: 'Şekildeki d ve k doğrularının durumu nedir?', visual: V.twoLines(rel, rot), options: mc(names[rel], wr, [['Çakışıktır', 'paralel_kesisen']]), steps: ['Köşede küçük kare (dik açı işareti) varsa doğrular diktir: ⊥', 'Hiç kesişmiyor ve arası hep aynıysa paraleldir: //', 'Kesişiyor ama dik açı yoksa sadece kesişen doğrulardır.'], hint: lv === 2 ? 'Şekil döndürülmüş olabilir; dik açı işaretini ara.' : '' });
    }
    const it = pick([
      ['Aynı düzlemde d ⊥ k ve k ⊥ m ise d ile m doğruları için ne söylenebilir?', 'd // m (paraleldir)', [['d ⊥ m (diktir)', 'paralel_kesisen'], ['Kesişir', 'paralel_kesisen'], ['Bir şey söylenemez', 'paralel_kesisen']]],
      ['"//" sembolü ne anlama gelir?', 'Paraleldir', [['Diktir', 'paralel_kesisen'], ['Kesişir', 'paralel_kesisen'], ['Eşittir', 'genel']]],
      ['"⊥" sembolü ne anlama gelir?', 'Diktir', [['Paraleldir', 'paralel_kesisen'], ['Çakışıktır', 'genel'], ['Eşittir', 'genel']]],
    ]);
    return Q({ prompt: it[0], options: mc(it[1], it[2]), steps: ['Aynı doğruya dik olan iki doğru birbirine paraleldir.', '⊥ diklik, // paralellik sembolüdür.'] });
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
      return Q({ prompt: 'Şekildeki açının ölçüsü aşağıdakilerden hangisi olabilir? (Gözünle tahmin et: dar mı, geniş mi?)', visual: V.angle(d), options: mc(d + '°', [[(180 - d) + '°', 'iletki_ters'], [(d < 90 ? 90 + d : d - 60) + '°', 'aci_tur']], [[(d + 180) + '°', 'aci_tur']]), steps: [d < 90 ? 'Açı dik açıdan (köşe gibi) daha kapalı → dar açı, ölçüsü 90°\'den küçük.' : 'Açı dik açıdan daha açık → geniş açı, ölçüsü 90°\'den büyük.', `İletkinin doğru ölçeği ${d}° gösterir; ${180 - d}° diğer ölçektir.`] });
    }
    const it = pick([
      () => { const k = ri(2, 3); return Q({ type: 'input', prompt: `${k} tane dik açının ölçüleri toplamı kaç derecedir?`, answer: String(90 * k), unit: '°', inputMis: [{ v: 180 * k, mis: 'aci_tur' }], steps: ['Bir dik açı 90°', `${k} × 90 = ${90 * k}°`] }); },
      () => Q({ type: 'input', prompt: 'Bir tam açı kaç tane dik açıdan oluşur?', answer: '4', inputMis: [{ v: 2, mis: 'aci_tur' }], steps: ['Tam açı 360°, dik açı 90°', '360 ÷ 90 = 4'] }),
      () => Q({ type: 'input', prompt: 'Bir doğru açı kaç tane dik açıdan oluşur?', answer: '2', inputMis: [{ v: 4, mis: 'aci_tur' }], steps: ['Doğru açı 180°', '180 ÷ 90 = 2'] }),
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
  const CG = { 3: 'Üçgen', 4: 'Dörtgen', 5: 'Beşgen', 6: 'Altıgen', 7: 'Yedigen', 8: 'Sekizgen', 9: 'Dokuzgen', 10: 'Ongen' };
  GEN.g_cokgen = (lv) => {
    if (lv === 1) {
      const n = ri(5, 8), what = pick(['kenar', 'köşe', 'iç açı']);
      return Q({ type: 'input', prompt: `Bir ${CG[n].toLocaleLowerCase('tr-TR')}in kaç ${{ 'kenar': 'kenarı', 'köşe': 'köşesi', 'iç açı': 'iç açısı' }[what]} vardır?`, visual: V.polygon(n), answer: String(n), inputMis: [{ v: n - 1, mis: 'cokgen_sayi' }, { v: n + 1, mis: 'cokgen_sayi' }], steps: ['Çokgenlerde kenar = köşe = iç açı sayısı.', `${CG[n]}: ${n}`] });
    }
    if (lv === 2) {
      return Q({ prompt: 'Hangisi düzgün çokgenin tanımıdır?', options: mc('Bütün kenarları ve bütün iç açıları eşit olan çokgen', [['Sadece bütün kenarları eşit olan çokgen', 'duzgun_eksik'], ['Sadece bütün açıları eşit olan çokgen', 'duzgun_eksik'], ['Köşegeni olmayan çokgen', 'kosegen_kenar']]), steps: ['Düzgün = kenarlar eşit + açılar eşit (ikisi birden).', 'Örnek: Eşkenar dörtgenin kenarları eşittir ama açıları eşit olmayabilir; bu yüzden her zaman düzgün değildir. Kare düzgündür.'] });
    }
    const n = ri(5, 8);
    return Q({ type: 'input', prompt: `Bir ${CG[n].toLocaleLowerCase('tr-TR')}in BİR köşesinden kaç köşegen çizilebilir?`, visual: V.polygon(n, true), answer: String(n - 3), inputMis: [{ v: n - 1, mis: 'kosegen_kenar' }, { v: n, mis: 'kosegen_kenar' }], steps: [`${n} köşe var.`, 'Köşenin kendisine ve iki komşusuna köşegen çizilmez → 3 köşe çıkar.', `${n} − 3 = ${n - 3}`] });
  };
  GEN.g_ucgen = (lv) => {
    if (lv === 1) {
      let a = ri(3, 10) * 10, b = ri(2, 8) * 10; if (a + b >= 170) b = 170 - a - 10 > 10 ? 170 - a - 10 : 20; if (a + b >= 180) { a = 60; b = 50; }
      return Q({ type: 'input', prompt: `Bir üçgenin iki iç açısının ölçüsü ${a}° ve ${b}°'dir. Üçüncü açının ölçüsü kaç derecedir?`, answer: String(180 - a - b), unit: '°', inputMis: [{ v: 360 - a - b, mis: 'ucgen_360' }, { v: a + b, mis: 'genel' }], steps: ['Üçgenin iç açıları toplamı 180°', `${a} + ${b} = ${a + b}`, `180 − ${a + b} = ${180 - a - b}°`] });
    }
    if (lv === 2) {
      const t = pick(['dar', 'dik', 'genis']); let A;
      if (t === 'dar') { const x = ri(5, 8) * 10, y = ri(5, 8) * 10; A = [x, y, 180 - x - y]; if (A[2] >= 90 || A[2] <= 0) A = [60, 70, 50]; }
      if (t === 'dik') { const x = ri(2, 7) * 10; A = [90, x, 90 - x]; }
      if (t === 'genis') { const x = ri(10, 14) * 10, y = ri(1, (170 - x) / 10) * 10; A = [x, y, 180 - x - y]; if (A[2] <= 0) A = [120, 30, 30]; }
      A = shuffle(A);
      const name = { dar: 'Dar açılı üçgen', dik: 'Dik üçgen', genis: 'Geniş açılı üçgen' };
      return Q({ prompt: `İç açıları ${A[0]}°, ${A[1]}° ve ${A[2]}° olan üçgen hangisidir?`, options: mc(name[t], Object.keys(name).filter(k => k !== t).map(k => [name[k], 'ucgen_sinif']), [['Eşkenar üçgen', 'ucgen_sinif']]), steps: [`En büyük açı: ${Math.max(...A)}°`, Math.max(...A) > 90 ? '90°\'den büyük → geniş açılı' : Math.max(...A) === 90 ? 'Tam 90° → dik üçgen' : 'Hepsi 90°\'den küçük → dar açılı'] });
    }
    if (Math.random() < .35) return Q({ type: 'input', prompt: 'Eşkenar üçgenin bir iç açısı kaç derecedir?', answer: '60', unit: '°', inputMis: [{ v: 180, mis: 'ucgen_360' }, { v: 120, mis: 'ucgen_360' }], steps: ['Eşkenar üçgenin üç açısı eşit.', '180 ÷ 3 = 60°'] });
    const x = pick([20, 40, 50, 60, 70, 80, 100, 120, 30]);
    return Q({ type: 'input', prompt: `İkizkenar bir üçgende eşit kenarların arasındaki (tepe) açı ${x}°'dir. Taban açılarından biri kaç derecedir?`, answer: String((180 - x) / 2), unit: '°', inputMis: [{ v: 180 - x, mis: 'genel' }, { v: (360 - x) / 2, mis: 'ucgen_360' }], steps: ['İkizkenar üçgende taban açıları eşittir.', `180 − ${x} = ${180 - x}`, `${180 - x} ÷ 2 = ${(180 - x) / 2}°`] });
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
    return Q({ prompt: `${fmtN(n)} sayısının okunuşu hangisidir?`, options: mc(U.cap(U.words(n)), wrongW, [[U.cap(U.words(n + 1000)), 'genel']]), steps: ['Sayıyı sağdan üçerli bölüklere ayır.', 'Her bölüğü okuyup bölük adını ekle (milyar, milyon, bin).', '000 olan bölüğün adı okunmaz.'] });
  };
  const BAS = ['birler', 'onlar', 'yüzler', 'binler', 'on binler', 'yüz binler', 'milyonlar', 'on milyonlar', 'yüz milyonlar', 'milyarlar'];
  GEN.n_basamak = (lv) => {
    if (lv === 1 || lv === 2) {
      const len = lv === 1 ? ri(6, 7) : ri(8, 10); let digits = [];
      for (let i = 0; i < len; i++) digits.push(i === 0 ? ri(1, 9) : ri(0, 9));
      let pos = ri(1, len - 1); // sağdan indeks
      let idx = len - 1 - pos; if (digits[idx] === 0) digits[idx] = ri(2, 9);
      const n = +digits.join(''), d = digits[idx], val = d * Math.pow(10, pos);
      if (lv === 1) {
        return Q({ prompt: `${fmtN(n)} sayısında altı çizili <u>${d}</u> rakamının basamak değeri kaçtır? (${BAS[pos]} basamağında)`, options: mc(fmtN(val), [[String(d), 'basamak_deger'], [fmtN(val * 10), 'basamak_kayma'], [fmtN(val / 10), 'basamak_kayma']]), steps: [`${d} rakamı ${BAS[pos]} basamağında.`, `Basamak değeri = ${d} × ${fmtN(Math.pow(10, pos))} = ${fmtN(val)}`] });
      }
      return Q({ prompt: `${fmtN(n)} sayısında soldan ${idx + 1}. rakam olan ${d}, hangi basamaktadır?`, options: mc(U.cap(BAS[pos]) + ' basamağı', [[U.cap(BAS[pos + 1] || BAS[pos - 2]) + ' basamağı', 'basamak_kayma'], [U.cap(BAS[pos - 1]) + ' basamağı', 'basamak_kayma'], [U.cap(BAS[idx] || 'birler') + ' basamağı', 'basamak_kayma']]), steps: ['Basamakları SAĞDAN saymaya başla: birler, onlar, yüzler...', `${d} sağdan ${pos + 1}. sırada → ${BAS[pos]} basamağı`] });
    }
    // çözümleme
    const parts = []; const used = shuffle([0, 1, 2, 3, 4, 5, 6, 7]).slice(0, 4).sort((a, b) => b - a);
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
    const misMap = { '<': la !== lb ? 'ilk_rakam' : 'genel', '>': la !== lb ? 'ilk_rakam' : 'genel', '=': 'genel' };
    return cmpQ({ prompt: 'Boş yere hangi sembol gelmelidir?', cmp: [fmtN(a), fmtN(b)], steps: [`${fmtN(a)} → ${la} basamaklı, ${fmtN(b)} → ${lb} basamaklı.`, la !== lb ? 'Basamak sayısı fazla olan daha büyüktür.' : 'Basamak sayıları eşit; soldan başlayıp ilk farklı rakamı karşılaştır.', `${fmtN(a)} ${rel} ${fmtN(b)}`] }, rel, misMap);
  };
  GEN.n_toplacikar = (lv) => {
    if (lv === 1) {
      const a = ri(10000, 89999), b = ri(1000, 9999), op = pick(['+', '−']);
      const ans = op === '+' ? a + b : a - b;
      // elde unutma yanlışı
      const noCarry = op === '+' ? +String(a).split('').reverse().map((d, i) => (+d + +(String(b).split('').reverse()[i] || 0)) % 10).reverse().join('') : +String(a).split('').reverse().map((d, i) => Math.abs(+d - +(String(b).split('').reverse()[i] || 0))).reverse().join('');
      return Q({ type: 'input', prompt: `${fmtN(a)} ${op} ${fmtN(b)} = ?`, answer: String(ans), inputMis: noCarry !== ans ? [{ v: noCarry, mis: 'elde_unutma' }] : [], steps: ['Sayıları basamaklarını hizalayarak alt alta yaz.', op === '+' ? 'Birlerden başla; 10 ve üzerini eldeye aktar.' : 'Birlerden başla; üstteki rakam küçükse soldan onluk boz.', `Sonuç: ${fmtN(ans)}`] });
    }
    if (lv === 2) {
      const b = ri(10000, 40000), c = ri(20000, 60000);
      if (Math.random() < .5) return Q({ type: 'input', prompt: `....... + ${fmtN(b)} = ${fmtN(b + c)}  → Boş yere hangi sayı gelmelidir?`, answer: String(c), inputMis: [{ v: 2 * b + c, mis: 'ters_islem' }], steps: ['Toplamda bilinmeyen terim = toplam − bilinen terim', `${fmtN(b + c)} − ${fmtN(b)} = ${fmtN(c)}`] });
      return Q({ type: 'input', prompt: `....... − ${fmtN(b)} = ${fmtN(c)}  → Eksilen kaçtır?`, answer: String(b + c), inputMis: [{ v: Math.abs(c - b), mis: 'ters_islem' }], steps: ['Eksilen = çıkan + fark', `${fmtN(b)} + ${fmtN(c)} = ${fmtN(b + c)}`] });
    }
    const nm = pick(NAMES), have = ri(30, 90) * 100, p1 = ri(5, 25) * 100 + pick([0, 50]), p2 = ri(5, 25) * 100 - pick([0, 1]) * 1, left = have - p1 - p2;
    return Q({ type: 'input', prompt: `${wk(nm, 'in')} ${fmtN(have)} TL'si vardı. ${fmtN(p1)} TL'ye bir bisiklet kaskı ve ${fmtN(p2)} TL'ye bir spor ayakkabı aldı. Geriye kaç TL'si kaldı?`, answer: String(left), unit: 'TL', inputMis: [{ v: have - p1, mis: 'problem_adim' }, { v: p1 + p2, mis: 'problem_adim' }, { v: have + p1 + p2, mis: 'ters_islem' }], steps: [`Harcanan: ${fmtN(p1)} + ${fmtN(p2)} = ${fmtN(p1 + p2)} TL`, `Kalan: ${fmtN(have)} − ${fmtN(p1 + p2)} = ${fmtN(left)} TL`] });
  };
  GEN.n_carpbol = (lv) => {
    if (lv === 1) {
      const a = pick([12, 15, 25, 32, 45, 64, 75, 80]), z = pick([10, 100, 1000]), m = pick([2, 3, 4, 5]) * z, ans = a * m;
      const zeros = String(m).length - 1;
      return Q({ prompt: `${a} × ${fmtN(m)} işleminin sonucu kaçtır?`, options: mc(fmtN(ans), [[fmtN(ans / 10), 'sifir_sayisi'], [fmtN(ans * 10), 'sifir_sayisi'], [fmtN(a * (m / z) + z), 'genel']]), steps: [`Sıfırları ayır: ${a} × ${m / z} ve ${zeros} sıfır`, `${a} × ${m / z} = ${a * m / z}`, `Sona ${zeros} sıfır ekle → ${fmtN(ans)}`] });
    }
    if (lv === 2) {
      const it = pick(['bol', 'carpan']);
      if (it === 'bol') { const q = pick([20, 30, 40, 50, 300, 400]), d = pick([20, 30, 200, 300, 1500]), n = q * d; return Q({ prompt: `${fmtN(n)} ÷ ${fmtN(d)} işleminin sonucu kaçtır?`, options: mc(fmtN(q), [[fmtN(q * 10), 'sifir_sayisi'], [fmtN(q / 10), 'sifir_sayisi'], [fmtN(q * 100), 'sifir_sayisi']]), steps: ['Bölünen ve bölendeki ORTAK sıfırları sil.', `Sonra kalan sayıları böl: ${fmtN(n)} ÷ ${fmtN(d)} = ${fmtN(q)}`, `Kontrol: ${fmtN(q)} × ${fmtN(d)} = ${fmtN(n)}`] }); }
      const a = pick([75, 150, 14, 36, 25, 12]), z = pick([10, 100, 1000]);
      return Q({ type: 'input', prompt: `${a} × ....... = ${fmtN(a * z)}`, answer: String(z), inputMis: [{ v: z / 10, mis: 'sifir_sayisi' }, { v: z * 10, mis: 'sifir_sayisi' }], steps: [`${fmtN(a * z)}, ${a} sayısının sonuna ${String(z).length - 1} sıfır eklenmiş hâli.`, `O hâlde çarpan ${fmtN(z)}`] });
    }
    const a = ri(21, 89), b = ri(11, 39), ans = a * b, wrong = a * (b % 10) + a * Math.floor(b / 10);
    return Q({ type: 'input', prompt: `${a} × ${b} = ?`, answer: String(ans), inputMis: [{ v: wrong, mis: 'kismi_carpim' }], steps: [`${a} × ${b % 10} = ${a * (b % 10)}`, `${a} × ${Math.floor(b / 10) * 10} = ${a * Math.floor(b / 10) * 10}  (bir basamak sola kaydır)`, `Topla: ${a * (b % 10)} + ${a * Math.floor(b / 10) * 10} = ${fmtN(ans)}`] });
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
      return Q({ type: 'input', prompt: `Bir tiyatro oyunu saat ${U.tk(Math.floor(s / 60), s % 60, 'de')} başlayıp ${U.tk(Math.floor(e / 60), e % 60, 'de')} bitti. Oyun kaç dakika sürdü?`, answer: String(dur), unit: 'dk', inputMis: [{ v: wrongDec, mis: 'saat_ondalik' }], steps: [`${hm(s)} → ${hm(Math.ceil(s / 60) * 60)}: ${Math.ceil(s / 60) * 60 - s} dakika`, `${hm(Math.ceil(s / 60) * 60)} → ${hm(e)}: ${e - Math.ceil(s / 60) * 60} dakika`, `Toplam: ${dur} dakika`], hint: '1 saat = 60 dakika' });
    }
    const n = ri(3, 6), price = ri(15, 45) * 10, budget = Math.ceil((n * price + ri(1, 9) * 100) / 100) * 100, left = budget - n * price;
    const item = pick(['fidan', 'kitap', 'top', 'boya seti']);
    return Q({ type: 'input', prompt: `Bir okul ${fmtN(budget)} TL bütçeyle tanesi ${price} TL olan ${n} ${item} aldı. Kalan parayla tanesi 50 TL olan defterlerden en fazla kaç tane alınabilir?`, answer: String(Math.floor(left / 50)), unit: 'tane', inputMis: [{ v: Math.floor(budget / 50), mis: 'problem_adim' }, { v: left, mis: 'problem_adim' }], steps: [`Harcanan: ${n} × ${price} = ${fmtN(n * price)} TL`, `Kalan: ${fmtN(budget)} − ${fmtN(n * price)} = ${fmtN(left)} TL`, `${fmtN(left)} ÷ 50 = ${Math.floor(left / 50)}${left % 50 ? ' (kalan ' + (left % 50) + ' TL yetmez)' : ''}`] });
  };
  GEN.n_tahmin = (lv) => {
    const to = lv === 1 ? 10 : lv === 2 ? 100 : 1000;
    if (lv < 3) {
      let n = ri(1000, 99999); if (Math.random() < .6) { const r = n % to; const up = to / 2 + ri(0, to / 2 - 1); n = n - r + up; }
      const rnd = Math.round(n / to) * to, trunc = Math.floor(n / to) * to;
      return Q({ prompt: `${fmtN(n)} sayısını en yakın ${to === 10 ? 'onluğa' : 'yüzlüğe'} yuvarlayınca hangi sayı elde edilir?`, options: mc(fmtN(rnd), [[fmtN(trunc), 'yuvarlama_kesme'], [fmtN(rnd + to), 'yuvarlama_kesme'], [fmtN(Math.round(n / (to * 10)) * to * 10), 'basamak_kayma']], [[fmtN(rnd - to), 'yuvarlama_kesme'], [fmtN(rnd + 2 * to), 'genel']]), steps: [`${to === 10 ? 'Birler' : 'Onlar'} basamağına bak: ${String(n).slice(-(String(to).length - 1))[0]}`, `${+String(n).slice(-(String(to).length - 1))[0] >= 5 ? '5 veya büyük → yukarı yuvarla' : '5\'ten küçük → aynı bırak'}`, `Sonuç: ${fmtN(rnd)}`] });
    }
    const a = ri(12, 48) * 100 + ri(1, 99), b = ri(12, 48) * 100 + ri(1, 99);
    const ra = Math.round(a / 1000) * 1000, rb = Math.round(b / 1000) * 1000;
    return Q({ prompt: `${fmtN(a)} + ${fmtN(b)} toplamını sayıları en yakın binliğe yuvarlayarak TAHMİN edin.`, options: mc(fmtN(ra + rb), [[fmtN(Math.floor(a / 1000) * 1000 + Math.floor(b / 1000) * 1000), 'yuvarlama_kesme'], [fmtN(ra + rb + 1000), 'yuvarlama_kesme'], [fmtN(a + b), 'genel']]), steps: [`${fmtN(a)} ≈ ${fmtN(ra)}`, `${fmtN(b)} ≈ ${fmtN(rb)}`, `Tahmin: ${fmtN(ra + rb)}`] });
  };

  /* =========================================================
     TEMA 3 — GEOMETRİK NİCELİKLER
     ========================================================= */
  GEN.a_cevre = (lv) => {
    if (lv < 3) {
      const sq = lv === 2 && Math.random() < .5, a = ri(4, 18), b = sq ? a : ri(2, a - 1 || 2);
      return Q({ type: 'input', prompt: sq ? `Bir kenarı ${a} cm olan karenin çevre uzunluğu kaç cm'dir?` : `Kenar uzunlukları ${a} cm ve ${b} cm olan dikdörtgenin çevre uzunluğu kaç cm'dir?`, visual: V.rect(a, b, 'cm'), answer: String(2 * (a + b)), unit: 'cm', inputMis: [{ v: a + b, mis: 'cevre_yarim' }, { v: a * b, mis: 'cevre_alan' }], steps: sq ? ['Karenin 4 kenarı eşittir.', `Ç = 4 × ${a} = ${4 * a} cm`] : ['Ç = 2 × (uzun kenar + kısa kenar)', `Ç = 2 × (${a} + ${b}) = 2 × ${a + b} = ${2 * (a + b)} cm`] });
    }
    const a = ri(6, 20), b = ri(3, a - 1), P = 2 * (a + b);
    return Q({ type: 'input', prompt: `Çevre uzunluğu ${P} cm olan bir dikdörtgenin uzun kenarı ${a} cm'dir. Kısa kenarı kaç cm'dir?`, answer: String(b), unit: 'cm', inputMis: [{ v: P - a, mis: 'ters_cevre' }, { v: P - 2 * a, mis: 'ters_cevre' }], steps: [`Ç ÷ 2 = ${P} ÷ 2 = ${a + b} (bir uzun + bir kısa kenar)`, `Kısa kenar = ${a + b} − ${a} = ${b} cm`] });
  };
  GEN.a_alan = (lv) => {
    if (lv === 1) {
      const a = ri(3, 9), b = ri(2, 6);
      return Q({ type: 'input', prompt: 'Şekildeki dikdörtgenin alanı kaç birimkaredir?', visual: V.rect(a, b, '', true), answer: String(a * b), unit: 'birimkare', inputMis: [{ v: 2 * (a + b), mis: 'cevre_alan' }, { v: a + b, mis: 'cevre_alan' }], steps: [`Bir sırada ${a} kare, ${b} sıra var.`, `${a} × ${b} = ${a * b} birimkare`] });
    }
    if (lv === 2) {
      const a = ri(5, 20), b = ri(3, 12), u = pick(['cm', 'm']);
      return Q({ prompt: `Kenar uzunlukları ${a} ${u} ve ${b} ${u} olan dikdörtgenin alanı nedir?`, visual: V.rect(a, b, u), options: mc(`${a * b} ${u}²`, [[`${a * b} ${u}`, 'birim'], [`${2 * (a + b)} ${u}²`, 'cevre_alan'], [`${2 * (a + b)} ${u}`, 'cevre_alan']], [[`${a + b} ${u}²`, 'cevre_alan'], [`${a * b + a} ${u}²`, 'genel']]), steps: ['Alan = uzun kenar × kısa kenar', `A = ${a} × ${b} = ${a * b} ${u}²`, 'Alan birimi kare birimdir (²).'] });
    }
    const a = ri(4, 15), b = ri(3, 12);
    return Q({ type: 'input', prompt: `Alanı ${a * b} m² olan dikdörtgen biçimindeki bir bahçenin bir kenarı ${a} m'dir. Diğer kenarı kaç m'dir?`, answer: String(b), unit: 'm', inputMis: [{ v: a * b - a, mis: 'cevre_alan' }, { v: a * b / 2 - a, mis: 'cevre_alan' }], steps: ['Alan = a × b  →  b = Alan ÷ a', `${a * b} ÷ ${a} = ${b} m`] });
  };
  GEN.a_cevre_alan = (lv) => {
    if (lv === 1) {
      const a = ri(4, 12), b = ri(2, 8), ask = pick(['çevre', 'alan']);
      const ok = ask === 'çevre' ? `${2 * (a + b)} cm` : `${a * b} cm²`, other = ask === 'çevre' ? `${a * b} cm` : `${2 * (a + b)} cm²`;
      return Q({ prompt: `${a} cm ve ${b} cm kenarlı bir dikdörtgen kartonun etrafına şerit yapıştırılacak${ask === 'alan' ? ' değil, ÜSTÜ tamamen kaplanacak' : ''}. Hangi ölçü gerekir?`, options: mc(ok, [[other, 'cevre_alan'], [ask === 'çevre' ? `${a + b} cm` : `${a + b} cm²`, ask === 'çevre' ? 'cevre_yarim' : 'cevre_alan']], [[ask === 'çevre' ? `${2 * (a + b)} cm²` : `${a * b} cm`, 'birim']]), steps: [ask === 'çevre' ? 'Etrafına şerit → çevre (uzunluk, cm)' : 'Üstünü kaplamak → alan (cm²)', ask === 'çevre' ? `2 × (${a} + ${b}) = ${2 * (a + b)} cm` : `${a} × ${b} = ${a * b} cm²`] });
    }
    if (lv === 2) return tfQ({ prompt: 'Çevre uzunlukları eşit olan iki dikdörtgenin alanları da her zaman eşittir.', steps: ['Örnek: 5×1 ve 3×3 dikdörtgenlerinin çevresi 12 cm.', 'Alanları: 5 cm² ve 9 cm² → farklı!', 'Yani ifade YANLIŞ.'] }, false, 'cevre_alan_ayni');
    const P = pick([16, 20, 24, 28, 32, 36]), s = P / 4, h = P / 2;
    const alt = [[(h - 1) * 1, 'cevre_alan_ayni'], [(h - 2) * 2, 'cevre_alan_ayni'], [(h - 3) * 3, 'cevre_alan_ayni']];
    return Q({ prompt: `Kenar uzunlukları doğal sayı ve çevre uzunluğu ${P} cm olan dikdörtgenler arasında alanı EN BÜYÜK olanın alanı kaç cm²'dir?`, options: mc(`${s * s} cm²`, alt.map(([v, m]) => [`${v} cm²`, m]), [[`${P} cm²`, 'cevre_alan']]), steps: [`Uzun + kısa kenar = ${P} ÷ 2 = ${h}`, `Denemeler: ${h - 1}×1=${h - 1}, ${h - 2}×2=${(h - 2) * 2}, ..., ${s}×${s}=${s * s}`, `Kenarlar eşit olunca (kare) alan en büyük: ${s * s} cm²`] });
  };

  /* =========================================================
     TEMA 4 — KESİRLER
     ========================================================= */
  GEN.f_tur = (lv) => {
    if (lv === 1) {
      if (Math.random() < .5) { const n = pick([4, 5, 6, 8]), k = ri(1, n - 1); return Q({ prompt: 'Şeklin boyalı kısmı bütünün kaçta kaçıdır?', visual: V.bar(k, n), options: mc(fr(k, n), [[fr(n - k, n), 'kesir_tur'], [fr(k, n - k), 'kesir_tur'], [fr(n, k), 'kesir_tur']]), steps: [`Bütün ${n} eş parçaya bölünmüş → payda ${n}`, `${k} parça boyalı → pay ${k}`] }); }
      const t = pick(['birim', 'basit', 'bilesik']); let n, d;
      if (t === 'birim') { n = 1; d = ri(2, 12); } if (t === 'basit') { d = ri(4, 12); n = ri(2, d - 1); } if (t === 'bilesik') { d = ri(2, 9); n = d + ri(0, 9); }
      // Birim kesir aynı zamanda basit kesirdir; birim sorusunda "Basit kesir" şık olarak verilmez (iki doğru olmasın)
      const name = { birim: 'Birim kesir', basit: 'Basit kesir', bilesik: 'Bileşik kesir' };
      const yanlis = Object.keys(name).filter(k => k !== t && !(t === 'birim' && k === 'basit')).map(k => [name[k], 'kesir_tur']);
      return Q({ prompt: `${fr(n, d)} kesri hangi türdendir?`, options: mc(name[t], yanlis, [['Tam sayılı kesir', 'kesir_tur']]), steps: ['Pay 1 → birim kesir', 'Pay < payda → basit kesir', 'Pay ≥ payda → bileşik kesir'] });
    }
    if (lv === 2) {
      const d = ri(3, 9), w = ri(1, 4), r = ri(1, d - 1), n = w * d + r;
      return Q({ prompt: `${fr(n, d)} bileşik kesrinin tam sayılı kesir olarak gösterimi hangisidir?`, options: mc(mixed(w, r, d), [[mixed(r, w, d), 'tamsayili'], [mixed(w, r, n), 'tamsayili'], [mixed(w + 1, r, d), 'tamsayili']]), steps: [`${n} ÷ ${d} = ${w}, kalan ${r}`, `Tam kısım ${w}, pay ${r}, payda ${d}`] });
    }
    const d = ri(3, 9), w = ri(1, 5), r = ri(1, d - 1), n = w * d + r;
    return Q({ prompt: `${mixed(w, r, d)} tam sayılı kesrinin bileşik kesir gösterimi hangisidir?`, options: mc(fr(n, d), [[fr(w + r, d), 'tamsayili'], [fr(w * r + d, d), 'tamsayili'], [fr(w * d, r), 'tamsayili']]), steps: [`(Tam × payda) + pay = ${w} × ${d} + ${r} = ${n}`, `Payda aynı kalır → ${n}/${d}`] });
  };
  GEN.f_denk = (lv) => {
    const n = ri(1, 5), d = n + ri(1, 6), k = ri(2, 5);
    if (lv === 1) return Q({ type: 'input', prompt: `${fr(n, d)} = ${fr('?', d * k)}   Soru işareti yerine hangi sayı gelmelidir?`, answer: String(n * k), inputMis: [{ v: n + (d * k - d), mis: 'denk_toplama' }], steps: [`Payda ${d} iken ${d * k} olmuş: ${k} ile çarpılmış.`, `Pay da ${k} ile çarpılır: ${n} × ${k} = ${n * k}`] });
    if (lv === 2) {
      const g = gcd(n, d), nn = n / g, dd = d / g, N = nn * k, D = dd * k;
      return Q({ prompt: `${fr(N, D)} kesrinin en sade hâli hangisidir?`, options: mc(fr(nn, dd), [[fr(N - 1, D - 1), 'denk_toplama'], [fr(nn, D), 'denk_toplama'], [fr(N, dd), 'denk_toplama']], [[fr(nn + 1, dd + 1), 'denk_toplama']]), steps: [`Pay ve paydayı ortak bölen ${k} ile böl.`, `${N} ÷ ${k} = ${nn}, ${D} ÷ ${k} = ${dd}`] });
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
      return Q({ prompt: `${fr(p, 100)} kesrinin yüzde ile gösterimi hangisidir?`, options: mc('%' + p, [['%' + (p * 10), 'yuzde_ondalik'], ['%' + fmtD(p / 100, 2), 'yuzde_ondalik'], ['%' + (100 - p), 'genel']]), steps: ['Paydası 100 olan kesir doğrudan yüzde olarak okunur.', `${p}/100 = %${p}`] });
    }
    if (lv === 2) { const k = ri(5, 95); return Q({ type: 'input', prompt: 'Yüzlük tablonun yüzde kaçı boyalıdır? (Sadece sayıyı yaz)', visual: V.grid100(k), answer: String(k), unit: '%', inputMis: [{ v: 100 - k, mis: 'genel' }, { v: k / 10, mis: 'yuzde_ondalik' }], steps: ['Tabloda 100 kare var.', `${k} kare boyalı → ${k}/100 = %${k}`], hint: 'Her satırda 10 kare var.' }); }
    const [n, d] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [7, 10], [3, 20], [9, 25], [1, 20]]);
    const p = n * 100 / d;
    return Q({ type: 'input', prompt: `${fr(n, d)} kesri yüzde kaça eşittir? (Sadece sayıyı yaz)`, answer: String(p), unit: '%', inputMis: [{ v: n * 10 + d, mis: 'yuzde_ondalik' }, { v: n / d, mis: 'yuzde_ondalik' }], steps: [`Paydayı 100 yap: ${100 / d} ile genişlet.`, `${fr(n, d)} = ${fr(n * 100 / d, 100)} = %${p}`] });
  };
  GEN.f_karsilastir = (lv) => {
    let a, b, c, d, misMap;
    if (lv === 1) { b = d = ri(5, 12); a = ri(1, b - 1); do { c = ri(1, b - 1); } while (c === a); misMap = { '<': 'pay_payda_ayri', '>': 'pay_payda_ayri', '=': 'pay_payda_ayri' }; }
    else if (lv === 2) { a = c = ri(1, 4); b = ri(a + 1, 9); do { d = ri(a + 1, 12); } while (d === b); misMap = { '<': 'payda_buyuk', '>': 'payda_buyuk', '=': 'payda_buyuk' }; }
    else { b = pick([2, 3, 4, 5]); const k = pick([2, 3]); d = b * k; a = ri(1, b - 1); c = ri(1, d - 1); if (c === a * k) c = c > 1 ? c - 1 : c + 1; if (Math.random() < .5) [a, b, c, d] = [c, d, a, b]; misMap = { '<': 'pay_payda_ayri', '>': 'pay_payda_ayri', '=': 'pay_payda_ayri' }; }
    const L = a / b, R = c / d, rel = Math.abs(L - R) < 1e-9 ? '=' : L > R ? '>' : '<';
    return cmpQ({ prompt: 'Boş yere hangi sembol gelmelidir?', cmp: [fr(a, b), fr(c, d)], visual: lv === 1 ? V.bar(a, b) + V.bar(c, d) : undefined, steps: lv === 1 ? ['Paydalar eşit → payı büyük olan büyüktür.'] : lv === 2 ? ['Paylar eşit → paydası KÜÇÜK olan büyüktür (parçalar daha büyük).'] : [`Paydaları eşitle: ortak payda ${Math.max(b, d)} olsun.`, `${a}/${b} = ${a * Math.max(b, d) / b}/${Math.max(b, d)}, ${c}/${d} = ${c * Math.max(b, d) / d}/${Math.max(b, d)}`, `Sonuç: ${a}/${b} ${rel} ${c}/${d}`] }, rel, misMap);
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
    if (lv === 1) return Q({ prompt: 'Hangisi istatistiksel bir araştırma sorusu olmaya UYGUNDUR?', options: mc(pick(['5/A sınıfındaki öğrencilerin en sevdiği meyve hangisidir?', 'Okulumuzdaki öğrenciler okula hangi ulaşım aracıyla geliyor?', 'Mahallemizdeki ailelerin en çok tercih ettiği tatil yeri neresidir?']), [[pick(['Ayşe\'nin en sevdiği renk nedir?', 'Öğretmenimizin doğum günü ne zaman?']), 'soru_tek'], ['Bugün hangi gün?', 'soru_tek'], ['Türkiye\'nin başkenti neresidir?', 'soru_tek']]), steps: ['Araştırma sorusu bir GRUBA yöneltilir.', 'Birden çok farklı cevabı olabilir (değişkenlik vardır).'] });
    if (lv === 2) {
      const it = pick([
        ['İstatistiksel araştırma sürecinin İLK adımı hangisidir?', 'Araştırma sorusunu belirleme'],
        ['İstatistiksel araştırma sürecinin SON adımı hangisidir?', 'Özetleme ve yorumlama'],
        ['"Veri toplama ve analize hazırlama" adımından hemen sonra hangi adım gelir?', 'Veri görselleştirme'],
      ]);
      const all = ['Araştırma sorusunu belirleme', 'Veri toplama ve analize hazırlama', 'Veri görselleştirme', 'Özetleme ve yorumlama'];
      return Q({ prompt: it[0], options: mc(it[1], all.filter(x => x !== it[1]).map(x => [x, 'adim_sira'])), steps: ['1) Araştırma sorusunu belirleme', '2) Veri toplama ve analize hazırlama', '3) Veri görselleştirme', '4) Özetleme ve yorumlama'] });
    }
    const it = pick([
      ['Aşağıdakilerden hangisi HAZIR veri kaynağıdır?', 'TÜİK\'in yayımladığı istatistikler', [['Sınıfta yaptığımız anket', 'soru_tek'], ['Arkadaşlarımızla yaptığımız görüşme', 'soru_tek'], ['Okul bahçesinde yaptığımız gözlem', 'soru_tek']]],
      ['Anket hazırlarken hangisine DİKKAT EDİLMELİDİR?', 'Kişisel bilgilerin gizliliği korunmalıdır', [['Katılanların adres bilgisi mutlaka alınmalıdır', 'soru_tek'], ['Sorular tek bir kişiye göre hazırlanmalıdır', 'soru_tek'], ['Tanımadığımız kişilerin anketlerine hemen cevap vermeliyiz', 'soru_tek']]],
    ]);
    return Q({ prompt: it[0], options: mc(it[1], it[2]), steps: ['Hazır veri: başkalarının topladığı ve yayımladığı veri (TÜİK, gazete, yıllık).', 'Kişisel bilgiler gizli tutulmalıdır.'] });
  };
  GEN.s_tablo_sutun = (lv) => {
    const u = lv === 3 ? 10 : 2, cats = pick(CATS).slice(0, 4), vals = cats.map(() => ri(1, 6) * u); while (new Set(vals).size < 4) vals[ri(0, 3)] = ri(1, 7) * u;
    const mx = Math.max(...vals), mn = Math.min(...vals), iMx = vals.indexOf(mx), iMn = vals.indexOf(mn);
    const chart = V.barChart(cats, vals, { max: Math.ceil(mx / u) * u, step: u, aria: 'sütun grafiği' });
    if (lv === 1) return Q({ prompt: 'Grafiğe göre en çok tercih edilen hangisidir?', visual: chart, options: mc(cats[iMx], cats.filter((_, i) => i !== iMx).map(c => [c, c === cats[iMn] ? 'grafik_okuma' : 'grafik_okuma'])), steps: ['En uzun sütunu bul.', `En uzun: ${cats[iMx]} (${mx})`] });
    if (lv === 2) { const i = ri(0, 3); return Q({ type: 'input', prompt: `Grafiğe göre "${cats[i]}" seçeneğini kaç kişi tercih etmiştir?`, visual: chart, answer: String(vals[i]), inputMis: vals.filter((v, j) => j !== i && v !== vals[i]).map(v => ({ v, mis: 'grafik_okuma' })), steps: [`${cats[i]} sütununun tepesinden eksene bak.`, `Değer: ${vals[i]}`] }); }
    return Q({ type: 'input', prompt: `En çok tercih edilen seçenek, en az tercih edilenden kaç kişi FAZLADIR?`, visual: chart, answer: String(mx - mn), inputMis: [{ v: mx + mn, mis: 'fark_toplam' }], steps: [`En çok: ${cats[iMx]} = ${mx}`, `En az: ${cats[iMn]} = ${mn}`, `Fark: ${mx} − ${mn} = ${mx - mn}`] });
  };
  GEN.s_daire = (lv) => {
    const sets = [[[1, 2], [1, 4], [1, 4]], [[1, 2], [1, 4], [1, 8], [1, 8]], [[3, 8], [3, 8], [1, 4]], [[1, 4], [1, 4], [1, 4], [1, 4]], [[1, 2], [1, 2]]];
    const parts = pick(sets), cats = shuffle(pick(CATS)).slice(0, parts.length), vals = parts.map(([n, d]) => n / d);
    const total = pick([24, 32, 40, 48, 80, 120]), i = ri(0, parts.length - 1), [n, d] = parts[i];
    const chart = V.pieChart(cats, vals);
    if (lv === 1) return Q({ prompt: `Daire grafiğine göre "${cats[i]}" dilimi bütünün kaçta kaçıdır?`, visual: chart, options: mc(fr(n, d), [[fr(n, d * 2), 'dilim_oran'], [fr(1, parts.length), 'dilim_oran'], [fr(n * 2 > d ? 1 : n * 2, n * 2 > d ? 3 : d), 'dilim_oran']], [[fr(1, 3), 'dilim_oran']]), steps: ['Bütün daire = 1', n * 2 === d ? 'Yarım daire = 1/2' : n * 4 === d ? 'Çeyrek daire = 1/4' : `Dilim ${d} eş parçadan ${n} tanesi kadar.`, `Cevap: ${n}/${d}`] });
    return Q({ type: 'input', prompt: `${total} öğrenciyle yapılan anketin sonucu daire grafiğinde verilmiştir. "${cats[i]}" seçeneğini kaç öğrenci tercih etmiştir?`, visual: chart, answer: String(total * n / d), unit: 'öğrenci', inputMis: [{ v: total / parts.length, mis: 'dilim_oran' }, { v: total * n / d / 2, mis: 'dilim_oran' }], steps: [`"${cats[i]}" dilimi bütünün ${n}/${d} kadarı.`, `${total} ÷ ${d} = ${total / d}`, `${total / d} × ${n} = ${total * n / d} öğrenci`] });
  };
  GEN.s_okuryazar = (lv) => {
    if (lv === 1) {
      const cats = pick(CATS).slice(0, 4), vals = cats.map(() => ri(1, 6)); while (new Set(vals).size < 3) vals[ri(0, 3)] = ri(1, 6);
      const tot = vals.reduce((a, b) => a + b, 0);
      return Q({ type: 'input', prompt: 'Nokta grafiğinde her nokta bir öğrenciyi gösteriyor. Ankete toplam kaç öğrenci katılmıştır?', visual: V.dotPlot(cats, vals), answer: String(tot), inputMis: [{ v: cats.length, mis: 'grafik_okuma' }, { v: Math.max(...vals), mis: 'grafik_okuma' }], steps: ['Bütün noktaları say.', `${vals.join(' + ')} = ${tot}`] });
    }
    if (lv === 2) {
      const cats = ['A', 'B'], a = ri(40, 46), b = a + ri(3, 6);
      return Q({ prompt: `Grafikte dikey eksen 38'den başlıyor. A ürünü ${a}, B ürünü ${b} adet satılmış. Grafikteki B sütunu A sütunundan çok daha uzun görünüyor. Hangisi DOĞRUDUR?`, visual: V.barChart(cats, [a, b], { min: 38, max: 50, step: 2, aria: 'kesik eksenli sütun grafiği' }), options: mc(`B, A'dan sadece ${b - a} adet fazla satılmıştır`, [['B, A\'nın birkaç katı satılmıştır', 'eksen_yanilsama'], ['A neredeyse hiç satılmamıştır', 'eksen_yanilsama'], ['Grafikten bir şey anlaşılmaz', 'eksen_yanilsama']]), steps: ['Eksen 0\'dan değil 38\'den başlıyor → sütun boyları farkı abartıyor.', `Gerçek sayılar: ${a} ve ${b}`, `Fark: ${b - a}`] });
    }
    const cats = ['Elma', 'Muz', 'Çilek'], vals = [ri(6, 9), ri(2, 4), ri(3, 5)];
    return Q({ prompt: `Bir sınıfta yapılan ankete göre Elma ${vals[0]}, Muz ${vals[1]}, Çilek ${vals[2]} öğrenci tarafından seçilmiştir. Bu veriye göre hangisi KESİNLİKLE söylenebilir?`, visual: V.barChart(cats, vals, { max: 10, aria: 'sütun grafiği' }), options: mc('Bu sınıfta en çok tercih edilen meyve elmadır', [['Türkiye\'deki tüm çocuklar en çok elmayı sever', 'asiri_genelleme'], ['Bu sınıftaki hiç kimse muz sevmez', 'asiri_genelleme'], ['Gelecek yıl da en çok elma seçilecektir', 'asiri_genelleme']]), steps: ['Veri sadece BU sınıftan toplandı.', 'Başka gruplara veya geleceğe genelleme yapılamaz.', '"Muz seçen var" → "hiç kimse sevmez" yanlış.'] });
  };

  /* =========================================================
     TEMA 6 — İŞLEMLERLE CEBİRSEL DÜŞÜNME
     ========================================================= */
  GEN.e_esitlik = (lv) => {
    if (lv === 1) {
      const a = ri(3, 12), b = ri(2, 12); let c = ri(1, a + b - 1); while (c === a || c === b) c = ri(1, a + b - 1);
      return Q({ type: 'input', prompt: `${a} + ${b} = ....... + ${c}   Boş yere hangi sayı gelmelidir?`, answer: String(a + b - c), inputMis: [{ v: a + b, mis: 'esittir_sonuc' }, { v: a + b + c, mis: 'esittir_sonuc' }], steps: [`Sol taraf: ${a} + ${b} = ${a + b}`, `Sağ taraf da ${a + b} olmalı: ....... + ${c} = ${a + b}`, `${a + b} − ${c} = ${a + b - c}`], hint: '"=" iki tarafın eşit olduğunu söyler.' });
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
    const it = pick([[`9 − 4 = 4 − 9`, false, 'cikarma_degisme'], [`20 ÷ 5 = 5 ÷ 20`, false, 'cikarma_degisme'], [`7 × 6 = 6 × 7`, true, 'ozellik_karis'], [`5 × (3 + 2) = 5 × 3 + 2`, false, 'dagilma_eksik'], [`4 × (10 + 3) = 4 × 10 + 4 × 3`, true, 'dagilma_eksik']]);
    return tfQ({ prompt: `"${it[0]}" eşitliği doğru mudur?`, steps: [it[1] ? 'Evet, iki taraf da aynı sonucu verir.' : 'Hayır! İki tarafı ayrı ayrı hesapla, sonuçlar farklı çıkar.', 'Değişme özelliği sadece toplama ve çarpmada vardır; dağılmada her terim çarpılır.'] }, it[1], it[2]);
  };
  GEN.e_us = (lv) => {
    if (lv === 1) { const a = ri(2, 12); return Q({ type: 'input', prompt: `${a}² (${nk(a, 'in')} karesi) kaçtır?`, answer: String(a * a), inputMis: [{ v: 2 * a, mis: 'us_carpim' }, { v: a + 2, mis: 'us_carpim' }], steps: [`${a}² = ${a} × ${a}`, `= ${a * a}`] }); }
    if (lv === 2) { const a = ri(2, 6); return Q({ type: 'input', prompt: `${a}³ (${nk(a, 'in')} küpü) kaçtır?`, answer: String(a ** 3), inputMis: [{ v: 3 * a, mis: 'us_carpim' }, { v: a * a, mis: 'us_carpim' }], steps: [`${a}³ = ${a} × ${a} × ${a}`, `= ${a * a} × ${a} = ${a ** 3}`] }); }
    const a = ri(2, 4), b = ri(2, 6);
    return Q({ type: 'input', prompt: `${a}³ + ${b}² işleminin sonucu kaçtır?`, answer: String(a ** 3 + b * b), inputMis: [{ v: 3 * a + 2 * b, mis: 'us_carpim' }], steps: [`${a}³ = ${a ** 3}`, `${b}² = ${b * b}`, `${a ** 3} + ${b * b} = ${a ** 3 + b * b}`] });
  };
  GEN.e_oncelik = (lv) => {
    if (lv === 1) { const a = ri(2, 20), b = ri(2, 9), c = ri(2, 9); return Q({ type: 'input', prompt: `${a} + ${b} × ${c} = ?`, answer: String(a + b * c), inputMis: [{ v: (a + b) * c, mis: 'oncelik_soldan' }], steps: ['Önce çarpma!', `${b} × ${c} = ${b * c}`, `${a} + ${b * c} = ${a + b * c}`] }); }
    if (lv === 2) {
      const a = ri(2, 9), b = ri(2, 9), c = ri(2, 6), d = ri(1, 9);
      return Q({ type: 'input', prompt: `(${a} + ${b}) × ${c} − ${d} = ?`, answer: String((a + b) * c - d), inputMis: [{ v: (a + b) * (c - d), mis: 'oncelik_soldan' }, { v: a + b * c - d, mis: 'oncelik_soldan' }], steps: [`Önce parantez: ${a} + ${b} = ${a + b}`, `Sonra çarpma: ${a + b} × ${c} = ${(a + b) * c}`, `En son çıkarma: ${(a + b) * c} − ${d} = ${(a + b) * c - d}`] });
    }
    const a = ri(2, 9), b = ri(2, 5), c = ri(2, 4);
    return Q({ type: 'input', prompt: `${a} + ${b}² × ${c} = ?`, answer: String(a + b * b * c), inputMis: [{ v: (a + b) ** 2 * c, mis: 'oncelik_soldan' }, { v: (a + b * b) * c, mis: 'oncelik_soldan' }, { v: a + 2 * b * c, mis: 'us_carpim' }], steps: [`Önce üs: ${b}² = ${b * b}`, `Sonra çarpma: ${b * b} × ${c} = ${b * b * c}`, `En son toplama: ${a} + ${b * b * c} = ${a + b * b * c}`] });
  };
  GEN.e_oruntu = (lv) => {
    const a = ri(1, 9), d = ri(2, 7);
    if (lv === 1) { const seq = [0, 1, 2, 3].map(i => a + i * d); return Q({ type: 'input', prompt: `${seq.join(', ')}, ....  Örüntünün bir sonraki terimi kaçtır?`, answer: String(a + 4 * d), inputMis: [{ v: a + 3 * d + 1, mis: 'oruntu_baslangic' }], steps: [`Terimler ${nk(d, 'er')} artıyor.`, `${seq[3]} + ${d} = ${a + 4 * d}`] }); }
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
    ['Bir zar atıldığında 7 gelmesi', 'İmkânsız'], ['Bir zar atıldığında 1 ile 6 arasında bir sayı gelmesi', 'Kesin'], ['Madenî para atıldığında yazı gelmesi', 'Mümkün'],
    ['Yarın güneşin doğudan doğması', 'Kesin'], ['Bir haftanın 8 gün olması', 'İmkânsız'], ['İçinde sadece kırmızı top olan torbadan mavi top çekilmesi', 'İmkânsız'],
    ['İçinde sadece kırmızı top olan torbadan kırmızı top çekilmesi', 'Kesin'], ['Bir zar atıldığında çift sayı gelmesi', 'Mümkün'], ['Şubat ayının 30 çekmesi', 'İmkânsız'],
    ['Pikniğe gideceğimiz gün yağmur yağması', 'Mümkün'], ['Bir basketbolcunun üç sayılık atışını isabet ettirmesi', 'Mümkün'], ['Bir torbadan çekilen bilyenin, torbada olmayan renkte olması', 'İmkânsız'],
  ];
  GEN.p_olay = (lv) => {
    if (lv < 3) {
      const [e, t] = pick(OLAY), all = ['Kesin', 'İmkânsız', 'Mümkün'];
      return Q({ prompt: `"${e}" olayı hangisidir?`, options: mc(t, all.filter(x => x !== t).map(x => [x, 'olay_tur'])), steps: ['Mutlaka olacaksa → kesin (olasılık 1)', 'Asla olamazsa → imkânsız (olasılık 0)', 'Olabilir de olmayabilir de → mümkün'] });
    }
    return Q({ prompt: 'Kesin bir olayın olasılık değeri kaçtır?', options: mc('1', [['0', 'olay_tur'], [fr(1, 2), 'olay_tur'], ['100', 'olasilik_buyuk']]), steps: ['Kesin olay → olasılık 1 (%100)', 'İmkânsız olay → 0 (%0)'] });
  };
  GEN.p_spektrum = (lv) => {
    const n = pick([4, 6, 8]), k = ri(0, n), cols = shuffle(Array.from({ length: n }, (_, i) => i < k ? 'sb' : 'c0b'));
    if (lv === 1) {
      const t = k === 0 ? 'İmkânsız' : k === n ? 'Kesin' : k * 2 === n ? 'Eşit olası' : k * 2 < n ? 'Az olası' : 'Çok olası';
      return Q({ prompt: 'Çark çevrildiğinde okun MAVİ dilimde durması nasıl bir olaydır?', visual: V.spinner(cols), options: mc(t, ['İmkânsız', 'Az olası', 'Eşit olası', 'Çok olası', 'Kesin'].filter(x => x !== t).map(x => [x, x === 'Az olası' || x === 'Çok olası' ? 'az_cok' : 'olay_tur'])), steps: [`${n} dilimden ${k} tanesi mavi.`, k * 2 < n ? 'Yarısından az → az olası' : k * 2 > n ? 'Yarısından fazla → çok olası' : k * 2 === n ? 'Tam yarısı → eşit olası' : ''] });
    }
    if (lv === 2) {
      const kk = Math.max(1, Math.min(n - 1, k)), cc = shuffle(Array.from({ length: n }, (_, i) => i < kk ? 'sb' : 'c0b'));
      return Q({ prompt: 'Çark çevrildiğinde okun MAVİ dilimde durma olasılığı kaçtır?', visual: V.spinner(cc), options: mc(fr(kk, n), [[fr(n - kk, n), 'olasilik_oran'], [fr(kk, n - kk === kk ? n + 1 : n - kk), 'olasilik_oran'], [fr(n, kk), 'olasilik_buyuk']]), steps: ['Olasılık = mavi dilim sayısı / tüm dilimler', `${kk}/${n}`] });
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
    return Q({ type: 'input', prompt: `On iki basamaklı "${shown}" sayısının okunuşu "${U.cap(U.words(n))}"dir. ▢ yerine hangi sayı yazılmalıdır?`, answer: String(g[hide]), inputMis: [], steps: [`Okunuşta "${hide ? 'milyon' : 'milyar'}" kelimesinden önceki kısım: ${U.words(g[hide])}`, `▢ = ${g[hide]}${hide && g[hide] < 100 ? ' (bölükte ' + String(g[hide]).padStart(3, '0') + ' olarak yazılır)' : ''}`], ref: '1. kitap s. 109' });
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
    const wr = [['A market', eq ? 'sifir_fark' : 'uzun_buyuk'], ['B market', eq ? 'sifir_fark' : 'uzun_buyuk'], ['İki markette fiyat aynı', 'sifir_fark']].filter(x => x[0] !== ok);
    return Q({ prompt: `${item}: A markette ${as} TL, B markette ${bs} TL. Hangi markette daha UCUZ?`, options: mc(ok, wr), steps: ['Önce lira (tam) kısmını karşılaştır.', 'Eşitse kuruş kısmına bak; basamak sayısını eşitle (0,5 = 0,50).', eq ? 'Fiyatlar aynı.' : `${fmtD(Math.min(a, b), 2)} TL daha ucuz.`], ref: '2. kitap s. 42' });
  }];
  VAR.f_yuzde = [(lv) => {
    const p = pick([10, 20, 25, 30, 40, 50, 15, 35]);
    return Q({ prompt: `Bir mağazada "%${p} İNDİRİM" tabelası var. %${p} hangi kesre eşittir?`, options: mc(fr(p, 100), [[fr(1, p), 'yuzde_ondalik'], [fr(p, 10), 'yuzde_ondalik'], [fr(p, 1000), 'yuzde_ondalik']]), steps: ['% işareti "yüzde", yani "100\'de" demektir.', `%${p} = ${p}/100`], ref: '2. kitap s. 17, 43' });
  }];
  VAR.a_alan = [(lv) => {
    const a = ri(3, 6), b = ri(2, 5), pr = pick([150, 200, 250, 300, 350, 400]);
    return Q({ type: 'input', prompt: `${a} m'ye ${b} m olan dikdörtgen biçimindeki odaya parke döşenecek. Parkenin metrekaresi ${pr} TL'dir. Parke kaç TL tutar?`, answer: String(a * b * pr), unit: 'TL', inputMis: [{ v: 2 * (a + b) * pr, mis: 'cevre_alan' }, { v: a * b, mis: 'problem_adim' }], steps: [`Odanın alanı: ${a} × ${b} = ${a * b} m²`, `Fiyat: ${a * b} × ${pr} = ${fmtN(a * b * pr)} TL`], ref: '1. kitap s. 158' });
  }];
  VAR.a_cevre = [(lv) => {
    const a = ri(8, 25), b = ri(4, a - 1), k = pick([2, 3, 4]);
    return Q({ type: 'input', prompt: `Kenarları ${a} m ve ${b} m olan dikdörtgen bir bahçenin etrafı ${k} sıra tel ile çevrilecek. Kaç metre tel gerekir?`, answer: String(k * 2 * (a + b)), unit: 'm', inputMis: [{ v: 2 * (a + b), mis: 'problem_adim' }, { v: k * (a + b), mis: 'cevre_yarim' }, { v: k * a * b, mis: 'cevre_alan' }], steps: [`Bahçenin çevresi: 2 × (${a} + ${b}) = ${2 * (a + b)} m`, `${k} sıra: ${k} × ${2 * (a + b)} = ${k * 2 * (a + b)} m`], ref: '1. kitap s. 142–144' });
  }];
  VAR.g_ucgen = [(lv) => {
    const a = ri(2, 8) * 10 + pick([0, 5]);
    return Q({ type: 'input', prompt: `Bir dik üçgende dar açılardan biri ${a}°'dir. Diğer dar açı kaç derecedir?`, answer: String(90 - a), unit: '°', inputMis: [{ v: 180 - a, mis: 'ucgen_360' }, { v: 270 - a, mis: 'ucgen_360' }], steps: ['Dik üçgende bir açı 90°.', `Kalan iki açının toplamı: 180 − 90 = 90°`, `90 − ${a} = ${90 - a}°`], ref: '1. kitap s. 73' });
  }];
  VAR.e_oruntu = [(lv) => {
    const a = pick([0, 10, 20, 25, 50]), d = pick([5, 10, 15, 20]), n = pick([6, 8, 10, 12]);
    if (a === 0) return Q({ type: 'input', prompt: `Boş bir kumbaraya her gün ${d} TL atılıyor. ${n}. günün sonunda kumbarada kaç TL olur?`, answer: String(d * n), unit: 'TL', inputMis: [{ v: d * (n - 1), mis: 'oruntu_bir' }, { v: d + n, mis: 'oruntu_baslangic' }], steps: [`Her gün ${d} TL: ${d}, ${2 * d}, ${3 * d}, ...`, `${n}. gün: ${n} × ${d} = ${d * n} TL`], ref: '2. kitap s. 139' });
    return Q({ type: 'input', prompt: `Kumbarada başta ${a} TL vardı. Her gün ${d} TL ekleniyor. ${n}. günün sonunda kumbarada kaç TL olur?`, answer: String(a + d * n), unit: 'TL', inputMis: [{ v: d * n, mis: 'oruntu_baslangic' }, { v: a + d * (n - 1), mis: 'oruntu_bir' }], steps: [`${n} günde eklenen: ${n} × ${d} = ${d * n} TL`, `Başlangıçtaki parayı unutma: ${a} + ${d * n} = ${a + d * n} TL`], ref: '2. kitap s. 139' });
  }];
  VAR.e_algoritma = [(lv) => {
    const it = pick([
      ['Ayran yapma akış şemasındaki "Tuz yeterli mi?" kutusu hangi tür adımdır?', 'Karar adımı (Evet/Hayır)', [['İşlem adımı', 'algoritma_sira'], ['Başlangıç adımı', 'algoritma_sira'], ['Bitiş adımı', 'algoritma_sira']]],
      ['Bir algoritmanın akış şeması hangi adımla başlar?', 'Başla', [['Bitir', 'algoritma_sira'], ['Karar', 'algoritma_sira'], ['Sonucu yaz', 'algoritma_sira']]],
      ['Akış şemasında "Tuz yeterli mi?" sorusunun cevabı "Hayır" ise ne yapılır?', 'Tuz ekleme adımına geri dönülür', [['Algoritma biter', 'dongu_sayma'], ['Baştan yoğurt eklenir', 'dongu_sayma'], ['Bardağa doldurulur', 'dongu_sayma']]],
    ]);
    return Q({ prompt: it[0], options: mc(it[1], it[2]), steps: ['Akış şeması: Başla → işlem adımları → karar kutuları → Bitir.', 'Karar kutusunda "Hayır" cevabı genellikle bir önceki adıma geri döndürür (döngü).'], ref: '2. kitap s. 150–152' });
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
  MATCH.f_tur = [() => { const ds = shuffle([3, 4, 5, 6, 8]).slice(0, 3); const ps = ds.map(d => [ri(1, d - 1), d]); return MQ('Kesirleri modelleriyle eşleştir.', ps.map(([n, d]) => ({ a: fr(n, d), b: V.pie(n, d) })), 'kesir_tur', ['Payda: bütün kaç eş parçaya bölünmüş.', 'Pay: kaç parça boyalı.']); }];
  MATCH.f_denk = [() => { const bs = shuffle([[1, 2], [1, 3], [2, 3], [3, 4], [2, 5], [1, 4]]).slice(0, 3); return MQ('Denk kesirleri eşleştir.', bs.map(([n, d]) => { const k = ri(2, 4); return { a: fr(n, d), b: fr(n * k, d * k) }; }), 'denk_toplama', ['Denk kesirde pay ve payda AYNI sayıyla çarpılır.']); }];
  MATCH.g_aci = [() => { const ts = shuffle([[pick([30, 45, 60, 75]), 'Dar açı'], [90, 'Dik açı'], [pick([110, 130, 150]), 'Geniş açı'], [180, 'Doğru açı']]).slice(0, 3); return MQ('Açı ölçülerini türleriyle eşleştir.', ts.map(([d, t]) => ({ a: d + '°', b: t })), 'aci_tur', ['< 90° dar, = 90° dik, 90°–180° arası geniş, 180° doğru açı.']); }];
  MATCH.g_cokgen = [() => { const ns = shuffle([3, 4, 5, 6, 8]).slice(0, 3); return MQ('Çokgenleri adlarıyla eşleştir.', ns.map(n => ({ a: V.polygon(n), b: CG[n] })), 'cokgen_sayi', ['Kenarları say: 5 kenar → beşgen.']); }];
  MATCH.n_okuma = [() => { const a = ri(1, 9), b = ri(1, 9); const ns = [a * 1e6 + b * 1e4, a * 1e6 + b * 1e5, a * 1e5 + b * 1e4]; return MQ('Sayıları okunuşlarıyla eşleştir.', ns.map(n => ({ a: fmtN(n), b: U.cap(U.words(n)) })), 'sifir_atlama', ['Sayıyı üçerli bölüklere ayır ve her bölüğü oku.']); }];
  MATCH.e_us = [() => { const xs = shuffle([[2, 2], [3, 2], [4, 2], [5, 2], [2, 3], [3, 3]]).filter((v, i, arr) => arr.findIndex(w => w[0] ** w[1] === v[0] ** v[1]) === i).slice(0, 3); return MQ('Üslü ifadeleri değerleriyle eşleştir.', xs.map(([b, e]) => ({ a: `${b}${e === 2 ? '²' : '³'}`, b: String(b ** e) })), 'us_carpim', ['a² = a × a, a³ = a × a × a']); }];
  MATCH.p_spektrum = [() => { const it = shuffle([[fr(0, 4), 'İmkânsız'], [fr(1, 4), 'Az olası'], [fr(2, 4), 'Eşit olası'], [fr(3, 4), 'Çok olası'], [fr(4, 4), 'Kesin']]).slice(0, 3); return MQ('Olasılıkları spektrumdaki yerleriyle eşleştir.', it.map(([a, b]) => ({ a, b })), 'az_cok', ['0 imkânsız, 1/2 eşit olası, 1 kesin; arası az ya da çok olası.']); }];
  const GQ = (prompt, rows, ok, wrongs, steps, mis) => Q({ type: 'mc', grid: rows, prompt, options: mc(ok, wrongs.map(w => [w, mis])), steps, cards: true });
  const GRID = {};
  GRID.e_oruntu = [(lv) => { const m = ri(2, 5), c = ri(0, 6), f = (x) => m * x + c, xs = [1, 2, 3], q = pick([5, 6, 10]); return GQ('Örüntüyü takip et: Kurala göre eksik sayı hangisi?', [...xs.map(x => [`${x}. adım`, String(f(x))]), [`${q}. adım`, '?']], String(f(q)), [String(f(q) + m), String(m * q), String(f(q - 1))], [`Her adımda ${m} artıyor; kural: adım × ${m}${c ? ' + ' + c : ''}`, `${q} × ${m}${c ? ' + ' + c : ''} = ${f(q)}`], 'oruntu_baslangic'); }];
  GRID.f_denk = [(lv) => { const k = ri(2, 4), bs = [[1, 2], [1, 3], [1, 4]], d = pick([5, 6, 8]); return GQ('Örüntüyü takip et: Eksik kesir hangisi?', [...bs.map(([n, dd]) => [fr(n, dd), fr(n * k, dd * k)]), [fr(1, d), '?']], fr(k, d * k), [fr(1 + k, d + k), fr(k, d)], [`Her satırda pay ve payda ${k} ile çarpılmış.`, `1/${d} → ${k}/${d * k}`], 'denk_toplama'); }];
  GRID.e_us = [(lv) => { const e = pick([2, 3]), bs = e === 2 ? [2, 3, 4] : [1, 2, 3], q = e === 2 ? pick([5, 6, 7]) : 4; return GQ('Örüntüyü takip et: Eksik değer hangisi?', [...bs.map(b => [`${b}${e === 2 ? '²' : '³'}`, String(b ** e)]), [`${q}${e === 2 ? '²' : '³'}`, '?']], String(q ** e), [String(q * e), String(q ** e + q)], [`${q}${e === 2 ? '²' : '³'} = ${Array(e).fill(q).join(' × ')} = ${q ** e}`], 'us_carpim'); }];
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
  for (const [id, list] of Object.entries(KES)) { const base = GEN[id]; GEN[id] = (lv) => (Math.random() < 0.25 ? pick(list)(lv) : base(lv)); }
  for (const [id, list] of Object.entries(MATCH)) { const base = GEN[id]; GEN[id] = (lv) => (Math.random() < 0.22 ? pick(list)(lv) : base(lv)); }
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
    let a, b; do { a = ri(4, lv === 3 ? 20 : 12); b = ri(2, a - 1); } while (a * b === 2 * (a + b));
    const l0 = 'Alan = uzun kenar × kısa kenar', l1 = `Alan = ${a} × ${b}`;
    return S(`Kenarları ${a} metre ve ${b} metre olan dikdörtgen bir odanın alanı kaç metrekaredir?`, [l0, l1, `Alan = ${a * b} m²`], `${a * b} m²`,
      [H('cevre_alan', 0, ['Alan = kenarların toplamı', `Alan = ${a} + ${b} + ${a} + ${b}`, `Alan = ${2 * (a + b)} m²`], `${2 * (a + b)} m²`), H('birim', 2, [l0, l1, `Alan = ${a * b} m`], `${a * b} m`)], ['cevre_yarim', 'ters_cevre']);
  };
  SEN.a_cevre_alan = (lv) => {
    if (Math.random() < 0.5) {
      const k = ri(3, 15), P = 4 * k, l0 = 'Karenin 4 kenarı eşittir';
      return S(`Çevresi ${P} cm olan karenin bir kenarı kaç cm?`, [l0, `Kenar = ${P} ÷ 4`, `Kenar = ${k} cm`], `${k} cm`, [H('ters_cevre', 1, [l0, `Kenar = ${P} ÷ 2`, `Kenar = ${2 * k} cm`], `${2 * k} cm`)], ['cevre_alan', 'cevre_yarim']);
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
    return S(`Sütun grafiğine göre ${a} kişi ${X.toLocaleLowerCase('tr-TR')}, ${b} kişi ${Y.toLocaleLowerCase('tr-TR')} seçmiş. ${X} seçenler, ${Y} seçenlerden kaç kişi fazladır?`, ['"Kaç kişi fazla" farkı sorar', `Fark = ${a} − ${b}`, `Sonuç: ${a - b} kişi`], `${a - b} kişi`,
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
    const r = ri(2, 6), m = ri(r + 1, 9), l1 = `İstenen: ${r} kırmızı top`;
    return S(`Torbada ${r} kırmızı, ${m} mavi top var. Torbadan rastgele çekilen topun kırmızı olma olasılığı kaçtır?`, [`Payda: tüm toplar, ${r} + ${m} = ${r + m}`, l1, `Olasılık = ${fr(r, r + m)}`], fr(r, r + m),
      [H('olasilik_oran', 0, [`Payda: kırmızı olmayan toplar, ${m}`, l1, `Olasılık = ${fr(r, m)}`], fr(r, m))], ['olasilik_buyuk', 'az_cok']);
  };

  const ADIM = (i, s) => `<span class="adno">${i + 1}</span><span class="adtx">${s}</span>`;
  const HATA_YOK = '✅ Hata yok, hepsi doğru';
  const HSORU = (sc) => `<span class="hsoru">${sc.soru}</span><br>`;
  const hataBul = (sc, ad) => {
    const temiz = Math.random() < 0.2, h = pick(sc.hatalar), sat = temiz ? sc.dogru : h.satirlar;
    const options = sat.map((s, i) => (!temiz && i === h.at) ? { t: ADIM(i, s), ok: true } : { t: ADIM(i, s), ok: false, mis: 'hata_yeri' });
    options.push(temiz ? { t: HATA_YOK, ok: true } : { t: HATA_YOK, ok: false, mis: h.mis });
    return Q({ hata: 'bul', ad, fixed: true, prompt: `${HSORU(sc)}<b>${ad}</b> böyle çözdü. Çözümde hatalı bir adım var mı?`, options,
      hataAt: temiz ? null : h.at, duzeltme: temiz ? null : sc.dogru[h.at],
      hint: 'Her adımı kendin yeniden hesapla. Sonucu bozan ilk adımı ara.',
      steps: temiz ? ['Bu çözümde hata yok, her adım doğru.', `Doğru sonuç: ${sc.sonuc}`] : [`Hata ${h.at + 1}. adımda: ${h.satirlar[h.at]}`, `Doğrusu: ${sc.dogru[h.at]}`, `Doğru sonuç: ${sc.sonuc}`] });
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

  G.MY_GEN = GEN; G.MY_MIS = MIS; G.MY_KES = KES_CHECK; G.MY_HATA = HATA;
  if (typeof module !== 'undefined') module.exports = { GEN, MIS, KES_CHECK, HATA };
})(typeof window !== 'undefined' ? window : globalThis);
