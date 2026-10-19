/* ============================================================
   Matematik Yolu — Müfredat haritası (Maarif Modeli, 5. sınıf)
   Kaynak: MEB 5. Sınıf Matematik Ders Kitabı 1. ve 2. kitap (2024)
   Sayfa numaraları öğrenciyi KENDİ kitabına yönlendirmek içindir;
   kitap metni/sorusu uygulamaya kopyalanmaz (telif).
   Her beceri 4 anlatım biçimine sahiptir: gorsel / hikaye / adim / kural
   ============================================================ */
(function (G) {
  'use strict';
  const { U, V } = (typeof module !== 'undefined') ? require('./core.js') : { U: G.MY_U, V: G.MY_V };
  const fr = U.fr;

  const THEMES = [
    { id: 't1', no: 1, title: 'Geometrik Şekiller', book: 1, pages: '12–91', color: 'teal', icon: '📐', goal: 'Temel geometrik çizimleri yapmak, açıları ölçmek, çokgen ve üçgenleri tanımak.' },
    { id: 't2', no: 2, title: 'Doğal Sayılar ve İşlemler', book: 1, pages: '92–137', color: 'blue', icon: '🔢', goal: 'Çok basamaklı sayıları okumak, yazmak ve gerçek yaşam problemlerini dört işlemle çözmek.' },
    { id: 't3', no: 3, title: 'Geometrik Nicelikler', book: 1, pages: '138–166', color: 'orange', icon: '📏', goal: 'Dikdörtgenin çevre uzunluğunu ve alanını yorumlamak, problemler çözmek.' },
    { id: 't4', no: 4, title: 'Kesirler', book: 2, pages: '12–55', color: 'pink', icon: '🍕', goal: 'Kesirleri farklı gösterimlerle (kesir, ondalık, yüzde) ifade edip karşılaştırmak.' },
    { id: 't5', no: 5, title: 'İstatistiksel Araştırma', book: 2, pages: '56–113', color: 'purple', icon: '📊', goal: 'Kategorik veriyle çalışmak, grafikleri okumak ve veriye dayalı karar vermek.' },
    { id: 't6', no: 6, title: 'Cebirsel Düşünme', book: 2, pages: '114–163', color: 'green', icon: '⚖️', goal: 'Eşitlik, işlem özellikleri, işlem önceliği, örüntüler ve algoritmalarla düşünmek.' },
    { id: 't7', no: 7, title: 'Veriden Olasılığa', book: 2, pages: '164–182', color: 'yellow', icon: '🎲', goal: 'Olayların olasılığını 0 ile 1 arasında yorumlamak, az/çok olası olarak sınıflamak.' },
  ];

  const S = (id, theme, title, pages, cards, extra) => Object.assign({ id, theme, title, pages, cards }, extra || {});
  const SKILLS = [
    /* ---------------- TEMA 1 ---------------- */
    S('g_temel', 't1', 'Nokta, Doğru, Işın', '17–25', {
      gorsel: { text: 'Uçlarına bak! İki uç noktası olan <b>doğru parçası</b>, bir başlangıcı ve tek oku olan <b>ışın</b>, iki yönde oku olan <b>doğru</b>dur.', vis: () => V.lineKind('dp') + V.lineKind('isin') + V.lineKind('dogru') },
      hikaye: 'Ela evden okula yürüdü: evi ve okulu belli, yani yolu bir <b>doğru parçası</b>. Bir el feneri yaktı: ışık fenerden başlayıp tek yönde sonsuza gidiyor, bu bir <b>ışın</b>. Uzayda iki yönde de bitmeyen bir yol düşün: bu da bir <b>doğru</b>!',
      adim: ['Çizimin uçlarına bak.', 'İki uç noktası varsa → doğru parçası: [AB]', 'Bir uç noktası ve tek ok varsa → ışın: [AB', 'İki ok varsa → doğru: AB doğrusu', 'Doğru parçasının uzunluğu |AB| ile gösterilir.'],
      kural: 'Doğru parçasının 2 ucu var, uzunluğu ölçülür. • Işının 1 ucu var, tek yöne sonsuz gider. • Doğrunun hiç ucu yok, iki yöne sonsuz gider.',
    }),
    S('g_cember', 't1', 'Çember ve Daire', '26–28', {
      gorsel: { text: 'Merkezden çembere giden çizgi <b>yarıçap</b>tır. Merkezden geçip iki ucu çemberde olan çizgi <b>çap</b>tır. Çap = 2 × yarıçap.', vis: () => V.circle('r', 'r') + V.circle('d', 'çap') },
      hikaye: 'Kerem bahçeye bir kazık çaktı, ipin ucunu bağladı ve gerilmiş iple etrafında döndü. İzi <b>çember</b>, kazık <b>merkez</b>, ip ise <b>yarıçap</b>! Kerem bir uçtan merkezden geçerek diğer uca yürüdüğünde ipin 2 katını yürüdü: bu da <b>çap</b>.',
      adim: ['Merkezi bul (O noktası).', 'Merkezden çembere olan uzaklık yarıçaptır (r).', 'Çap merkezden geçer ve 2 yarıçap uzunluğundadır.', 'Çap verilirse yarıçap = çap ÷ 2.'],
      kural: 'Çap = 2 × yarıçap. Çember sadece kenar çizgisi, daire ise çember + iç bölgedir.',
    }),
    S('g_dikme_paralel', 't1', 'Dikme ve Paralellik', '29–38', {
      gorsel: { text: 'Köşede küçük bir kare varsa doğrular <b>dik</b>tir (⊥). Hiç kesişmeyen, arası hep aynı olan doğrular <b>paralel</b>dir (//).', vis: () => V.twoLines('dik', 25) + V.twoLines('paralel') },
      hikaye: 'Tren rayları hiç birleşmez, aralarındaki mesafe hep aynıdır: <b>paralel</b>! Bir defterin kenarları köşede dik açı yapar: <b>dik</b>! Defteri çevirsen bile köşe hâlâ diktir.',
      adim: ['İki doğru kesişiyor mu? Bak.', 'Kesişmiyorsa ve aralarındaki uzaklık hep aynıysa → paralel (//).', 'Kesişiyorsa köşedeki açıya bak.', 'Açı 90° (küçük kare işareti) ise → dik (⊥).', 'Şekil dönük olsa da kural değişmez.'],
      kural: '⊥ : 90° ile kesişir. // : hiç kesişmez. Aynı doğruya dik iki doğru birbirine paraleldir.',
    }),
    S('g_aci', 't1', 'Açılar ve Açı Ölçme', '39–44', {
      gorsel: { text: 'Açının büyüklüğü kolların ne kadar <b>açıldığına</b> bağlıdır, uzunluğuna değil. 90° (dik açı) referans noktandır.', vis: () => V.angle(45, { label: 'dar' }) + V.angle(90, { label: 'dik' }) + V.angle(135, { label: 'geniş' }) },
      hikaye: 'Saat tam 3\'te akrep ve yelkovan <b>dik açı</b> yapar (90°). Saat 1\'de aralarındaki açı daha kapalı: <b>dar açı</b>. Saat 5\'te iyice açılır: <b>geniş açı</b>. Saat 6\'da düz bir çizgi: <b>doğru açı</b> (180°)!',
      adim: ['Açıyı bir dik açıyla (defter köşesi) karşılaştır.', 'Daha kapalıysa dar açı (90°\'den küçük).', 'Tam köşe gibiyse dik açı (90°).', 'Daha açıksa geniş açı (90°–180°).', 'Açıölçerle ölçerken köşeyi merkeze, bir kolu 0\'a koy; diğer kolun gösterdiği sayıyı oku.'],
      kural: 'Dar < 90° = Dik < Geniş < 180° = Doğru açı. Tam açı 360°.',
    }),
    S('g_aci_iliski', 't1', 'Tümler, Bütünler, Ters Açılar', '45–56', {
      gorsel: { text: 'Kesişen iki doğruda karşı karşıya duran açılar (<b>ters açılar</b>) eşittir. Yan yana olan açılar toplamı 180°\'dir.', vis: () => V.crossAngles(60, ['60°', '120°', '60°', '120°']) },
      hikaye: 'Makas açtığında iki bıçak bir X oluşturur. Üstteki açı ne kadarsa alttaki de o kadardır: <b>ters açılar</b> hep ikizdir! Bir pizza dilimini dik köşeden kesersen iki parçanın açıları toplamı 90° olur: <b>tümler</b>.',
      adim: ['Tümler mi bütünler mi soruluyor? Bak.', 'Tümler: toplam 90° → 90 − verilen.', 'Bütünler: toplam 180° → 180 − verilen.', 'Ters açı: karşıdaki açı → aynı ölçü.'],
      kural: 'Tümler = 90°, Bütünler = 180°, Ters açılar eşittir.',
    }),
    S('g_cokgen', 't1', 'Çokgenler', '57–69', {
      gorsel: { text: 'Çokgende <b>kenar = köşe = iç açı</b> sayısı. Köşegen, yan yana olmayan iki köşeyi birleştirir.', vis: () => V.polygon(6, true) },
      hikaye: 'Arılar peteklerini <b>düzgün altıgen</b> yapar: 6 kenar, 6 köşe, 6 iç açı, hepsi eşit! Bir kenarı 1 cm olan petek gözünün bütün kenarlarının uzunlukları toplamı 6 × 1 = 6 cm olur.',
      adim: ['Kenarları say → çokgenin adı (5 → beşgen).', 'Köşe ve iç açı sayısı kenar sayısına eşittir.', 'Köşegen, yan yana olmayan iki köşeyi birleştirir; kenar ise yan yana iki köşeyi.', 'Düzgün çokgen: kenarlar eşit + açılar eşit.'],
      kural: 'n kenarlı çokgen: n köşe, n iç açı. Düzgün çokgende bütün kenarlar ve bütün açılar eşittir.',
    }),
    S('g_ucgen', 't1', 'Üçgenler', '70–85', {
      gorsel: { text: 'Üçgenin üç iç açısını yan yana koyarsan bir <b>doğru açı</b> (180°) oluşur.', vis: () => V.angle(180, { label: '60°+50°+70°' }) },
      hikaye: 'Defne kâğıttan bir üçgen kesti, üç köşesini yırtıp yan yana dizdi. Şaşırdı: köşeler tam bir düz çizgi oluşturdu! Her üçgende iç açılar toplamı <b>180°</b>.',
      adim: ['İki açı verildiyse topla.', '180\'den çıkar → üçüncü açı.', 'Türünü bulmak için EN BÜYÜK açıya bak.', '90°\'den büyükse geniş, tam 90° ise dik, hepsi küçükse dar açılı.'],
      kural: 'İç açılar toplamı 180°. Eşkenar üçgende her açı 60°. İkizkenarda taban açıları eşit.',
    }),
    /* ---------------- TEMA 2 ---------------- */
    S('n_okuma', 't2', 'Büyük Sayıları Okuma-Yazma', '97–103', {
      gorsel: { text: 'Sayıyı sağdan <b>üçerli bölüklere</b> ayır: <b>milyar | milyon | bin | birler</b>. Her bölüğü oku, adını ekle.', vis: () => '<div class="blk"><span>12</span><span>045</span><span>799</span><span>150</span></div><div class="blk lbl"><span>milyar</span><span>milyon</span><span>bin</span><span>birler</span></div>' },
      hikaye: 'Emre, Neptün\'ün Güneş\'e uzaklığını okumak istedi ama sayı çok uzundu! Sağdan üçer üçer ayırdı, her gruba bir isim verdi: birler, binler, milyonlar... Birden sayı kolayca okunur hâle geldi.',
      adim: ['Sayıyı sağdan üçerli ayır.', 'Bölük adlarını yaz: birler, bin, milyon, milyar.', 'Soldan başlayarak her bölüğü oku ve adını söyle.', '000 olan bölüğün adı okunmaz.', 'Yazarken okunmayan basamaklara 0 koy.'],
      kural: 'Her bölük 3 basamak. "Bin" önünde "bir" söylenmez; "bir milyon" söylenir.',
    }),
    S('n_basamak', 't2', 'Basamak Değeri ve Çözümleme', '103–106', {
      gorsel: { text: 'Rakamın değeri <b>bulunduğu yere</b> göre değişir: 5, yüzler basamağında 500, binler basamağında 5 000 değerindedir.', vis: () => '<div class="blk"><span>5</span><span>0</span><span>0</span></div><div class="blk lbl"><span>yüzler</span><span>onlar</span><span>birler</span></div>' },
      hikaye: 'Bir sinemada aynı koltuk numarası farklı sıralarda farklı yerdir. Rakamlar da öyle: aynı 7, birler sırasında 7, on binler sırasında 70 000 eder!',
      adim: ['Rakamın hangi basamakta olduğunu sağdan sayarak bul.', 'O basamağın değerini yaz (1, 10, 100, 1 000...).', 'Rakam × basamak değeri = basamak değeri.', 'Çözümleme: sayıyı basamak değerlerinin toplamı olarak yaz.'],
      kural: 'Basamak değeri = rakam × basamağın değeri. 4 725 = 4 000 + 700 + 20 + 5.',
    }),
    S('n_karsilastir', 't2', 'Sayıları Karşılaştırma', '107', {
      gorsel: { text: 'Önce <b>basamak sayısına</b> bak; basamağı fazla olan büyüktür. Eşitse soldan rakam rakam karşılaştır.', vis: () => '<div class="blk"><span>9 999</span><span>&lt;</span><span>10 000</span></div>' },
      hikaye: 'İki kardeş kumbaralarını saydı. Ali\'nin parası 9 999 TL, Ece\'ninki 10 000 TL. Ali "benimki 9 ile başlıyor, daha büyük!" dedi. Ece güldü: "Benim sayım 5 basamaklı, seninki 4!"',
      adim: ['Basamak sayılarını karşılaştır.', 'Fazla olan büyüktür.', 'Eşitse en soldaki rakamlardan başla.', 'İlk farklı rakamı büyük olan sayı büyüktür.'],
      kural: 'Önce uzunluk, sonra soldan ilk farklı rakam.',
    }),
    S('n_toplacikar', 't2', 'Toplama ve Çıkarma', '111–121', {
      gorsel: { text: 'Toplama ve çıkarma birbirinin <b>tersidir</b>: 25 + 15 = 40 ise 40 − 15 = 25.', vis: () => V.barChart(['25', '15', '40'], [25, 15, 40], { max: 40, aria: 'parça-bütün' }) },
      hikaye: 'Suzan bir çıkarma işleminde eksileni sildi. Kardeşi Nazlı düşündü: "Bir şeyden 15 çıkınca 25 kaldıysa, başta 25 + 15 = 40 vardı!" Ters işlem, kayıp sayıyı buldu.',
      adim: ['Basamakları hizalayarak alt alta yaz.', 'Birlerden başla.', 'Toplamada 10\'u geçerse eldeyi taşı.', 'Çıkarmada üstteki küçükse onluk boz.', 'Bilinmeyen terim için ters işlemi kullan.'],
      kural: 'Bilinmeyen terim = toplam − diğer terim. Eksilen = çıkan + fark.',
    }),
    S('n_carpbol', 't2', 'Çarpma ve Bölme', '123–131', {
      gorsel: { text: 'Sıfırları ayır, kalanları çarp, sıfırları geri ekle: 32 × 300 → 32 × 3 = 96 → <b>9 600</b>.', vis: () => '<div class="blk"><span>32</span><span>×</span><span>3<u>00</u></span><span>=</span><span>96<u>00</u></span></div>' },
      hikaye: 'Tahir hesap makinesiz bir hile keşfetti: 6 000 ÷ 20 için iki sayıdan da birer sıfır sildi, 600 ÷ 2 = 300 buldu. Sıfırlar hem bölünende hem bölende olduğu için silmek sonucu değiştirmedi!',
      adim: ['Sondaki sıfırları say.', 'Çarpmada: sıfırsız kısımları çarp, tüm sıfırları sona ekle.', 'Bölmede: ortak sıfırları sil, sonra böl.', 'İki basamaklı çarpmada ikinci satırı bir basamak sola kaydır.'],
      kural: 'Çarpmada sıfırlar toplanır, bölmede ortak sıfırlar sadeleşir.',
    }),
    S('n_problem', 't2', 'Gerçek Yaşam Problemleri', '111–134', {
      gorsel: { text: 'Problemi bir <b>şema</b>ya dök: Elimde ne var? Ne harcadım? Ne kaldı?', vis: () => V.barChart(['Bütçe', 'Harcama', 'Kalan'], [60, 35, 25], { max: 60, aria: 'bütçe şeması' }) },
      hikaye: 'Okul, atık kâğıt kampanyasından kazandığı parayla fidan alacak. Önce bütçe, sonra harcama, sonra kalan para... Her adımı tek tek çözünce problem bir bulmaca gibi açıldı.',
      adim: ['1. Verilenleri ve isteneni yaz.', '2. Hangi işlemler gerekiyor, belirle.', '3. Ara sonucu bul.', '4. Asıl soruyu çöz.', '5. Cevabın mantıklı olup olmadığını kontrol et.'],
      kural: 'Saat hesabında 1 saat = 60 dakika, 100 değil!',
    }),
    S('n_tahmin', 't2', 'Yuvarlama ve Tahmin', '121', {
      gorsel: { text: 'Sayı doğrusunda hangi onluğa daha <b>yakın</b>sa oraya yuvarla. Tam ortadaysa (5) yukarı.', vis: () => V.numberLine(40, 50, [{ v: 40, t: '40' }, { v: 45, t: '45' }, { v: 50, t: '50' }], 47) },
      hikaye: 'Mert markette 47 TL\'lik ürün aldı. "Yaklaşık 50 TL" dedi çünkü 47, 40\'tan çok 50\'ye yakın. Hızlı tahmin, cebindeki paranın yetip yetmeyeceğini hemen gösterdi!',
      adim: ['Hangi basamağa yuvarlanacağını bul.', 'Onun sağındaki rakama bak.', '5 veya büyükse bir artır, küçükse aynı bırak.', 'Sağdaki tüm rakamları 0 yap.'],
      kural: 'Sağdaki rakam ≥ 5 → yukarı; < 5 → aşağı.',
    }),
    /* ---------------- TEMA 3 ---------------- */
    S('a_cevre', 't3', 'Dikdörtgenin Çevresi', '142–144', {
      gorsel: { text: 'Çevre, şeklin etrafında bir tam tur atınca yürüdüğün yoldur: <b>4 kenarın toplamı</b>.', vis: () => V.rect(8, 4, 'cm') },
      hikaye: 'Nehir, bahçesinin etrafına çit çekecek. Bahçe 8 m\'ye 4 m. Etrafında yürüyerek saydı: 8 + 4 + 8 + 4 = 24 m çit gerekiyor!',
      adim: ['Uzun ve kısa kenarı bul.', 'Topla: uzun + kısa.', '2 ile çarp (her kenardan iki tane var).', 'Birimi yaz: cm, m.'],
      kural: 'Ç = 2 × (a + b). Karede Ç = 4 × a.',
    }),
    S('a_alan', 't3', 'Dikdörtgenin Alanı', '145–149', {
      gorsel: { text: 'Alan, şeklin içini dolduran <b>birim karelerin</b> sayısıdır: sıra sayısı × bir sıradaki kare.', vis: () => V.rect(6, 3, '', true) },
      hikaye: 'Odanın zeminini kare parkelerle döşeyen usta, bir sıraya 6 parke dizdi, toplam 3 sıra yaptı. "6 × 3 = 18 parke" dedi. İşte alan buydu!',
      adim: ['Uzun kenarı bul.', 'Kısa kenarı bul.', 'Çarp: a × b.', 'Birimi kare olarak yaz: cm², m².'],
      kural: 'A = a × b. Birim: cm², m² (kare birim).',
    }),
    S('a_cevre_alan', 't3', 'Çevre mi Alan mı?', '150–163', {
      gorsel: { text: 'Aynı çevreyle farklı alanlar olabilir! Kenarlar birbirine yaklaştıkça alan büyür.', vis: () => V.rect(5, 1, 'cm') + V.rect(3, 3, 'cm') },
      hikaye: 'Aras ile Duru\'nun ikisinde de 12 m ip var. Aras 5 m ve 1 m\'lik dikdörtgen yaptı: alanı 5 m². Duru 3 m\'ye 3 m kare yaptı: alanı 9 m²! Aynı ip, farklı alan.',
      adim: ['Soru etrafını mı içini mi soruyor?', 'Etrafı (çit, şerit, çerçeve) → çevre.', 'İçi (boya, halı, parke) → alan.', 'Doğru formülü uygula.'],
      kural: 'Etraf → çevre (cm). İç → alan (cm²). Aynı çevrede en büyük alan karededir.',
    }),
    /* ---------------- TEMA 4 ---------------- */
    S('f_tur', 't4', 'Kesir Türleri', '17–19', {
      gorsel: { text: 'Payda bütünün kaç parçaya bölündüğünü, pay kaç parça alındığını gösterir.', vis: () => V.bar(3, 5) + V.pie(1, 4) },
      hikaye: 'Bir pizza 4 dilime bölündü. Asel 1 dilim yedi: 1/4, bu bir <b>birim kesir</b>. Kardeşlerle 5 dilim yemek istediler ama bir pizzada 4 dilim var; ikinci pizza açıldı: 5/4 = 1 tam 1/4, bu <b>bileşik kesir</b>!',
      adim: ['Pay ile paydayı karşılaştır.', 'Pay 1 → birim kesir.', 'Pay < payda → kesir bir bütünden küçüktür.', 'Pay ≥ payda → bileşik kesir.', 'Bileşiği tam sayılıya çevir: payı paydaya böl.'],
      kural: `${fr(11, 4)} = 2 ${fr(3, 4)} (11 ÷ 4 = 2 kalan 3). Geri: 2 × 4 + 3 = 11.`,
    }),
    S('f_denk', 't4', 'Denk Kesirler', '17–18', {
      gorsel: { text: 'Aynı miktarı farklı parçalarla gösterebilirsin: 1/2 ile 2/4 aynı uzunluktadır.', vis: () => V.bar(1, 2) + V.bar(2, 4) + V.bar(4, 8) },
      hikaye: 'Ada çikolatayı 2 parçaya bölüp 1 parçasını yedi. Emir aynı çikolatayı 4 parçaya bölüp 2 parçasını yedi. Kim daha çok yedi? İkisi de aynı! 1/2 = 2/4.',
      adim: ['Pay ve paydayı AYNI sayıyla çarp → genişletme.', 'Pay ve paydayı AYNI sayıya böl → sadeleştirme.', 'Asla pay ve paydaya sayı EKLEME.'],
      kural: `${fr('a', 'b')} = ${fr('a × k', 'b × k')} (k ≠ 0)`,
    }),
    S('f_ondalik', 't4', 'Ondalık Gösterim', '20–27', {
      gorsel: { text: 'Paydası 10 → virgülden sonra <b>1</b> basamak (onda). Paydası 100 → <b>2</b> basamak (yüzde).', vis: () => V.grid100(25) },
      hikaye: 'Market fişinde "14,25 TL" yazıyordu. Defne sordu: "Virgül ne?" Annesi: "14 tam lira ve 25 kuruş; 1 lira 100 kuruş olduğu için 25/100 lira!" İşte ondalık gösterim!',
      adim: ['Paydayı 10 veya 100 yap (genişlet).', 'Payda 10 → virgülden sonra 1 basamak.', 'Payda 100 → virgülden sonra 2 basamak.', 'Okurken: "… tam onda …" veya "… tam yüzde …".'],
      kural: `${fr(3, 10)} = 0,3 • ${fr(3, 100)} = 0,03 • ${fr(1, 4)} = ${fr(25, 100)} = 0,25`,
    }),
    S('f_yuzde', 't4', 'Yüzde Gösterimi', '28–31', {
      gorsel: { text: '% işareti "<b>yüzde</b>" demektir: 100 eş parçadan kaç tanesi.', vis: () => V.grid100(40) },
      hikaye: 'Mağazada "%40 indirim" tabelası vardı. Kerem yüzlük tabloyu düşündü: 100 karenin 40\'ı boyalı. Yani fiyatın 100\'de 40\'ı düşülüyordu!',
      adim: ['Kesrin paydasını 100 yap.', 'Pay, yüzde değeridir.', 'Ondalığa çevirmek için: % sayısını 100\'e böl.'],
      kural: `%13 = ${fr(13, 100)} = 0,13 • %5 = 0,05 (0,5 değil!)`,
    }),
    S('f_karsilastir', 't4', 'Kesirleri Karşılaştırma', '35–39', {
      gorsel: { text: 'Paydalar eşitse payı büyük olan büyüktür. Paylar eşitse <b>paydası küçük</b> olan büyüktür (parçalar daha büyük).', vis: () => V.bar(1, 3) + V.bar(1, 8) },
      hikaye: 'Saba iki eş pasta yaptı: birini 8, birini 10 dilime böldü. Neva 10\'luktan 3 dilim, Revna 8\'likten 3 dilim yedi. Kim daha çok yedi? Revna! Çünkü 8\'e bölünen pastanın dilimleri daha büyük.',
      adim: ['Paydalar eşit mi? → payları karşılaştır.', 'Paylar eşit mi? → paydası küçük olan büyük.', 'İkisi de farklıysa paydaları eşitle (genişlet).', 'Sonra payları karşılaştır.'],
      kural: `${fr(3, 7)} < ${fr(5, 7)} • ${fr(1, 3)} > ${fr(1, 8)}`,
    }),
    S('f_ondalik_karsilastir', 't4', 'Ondalık ve Yüzde Karşılaştırma', '40–48', {
      gorsel: { text: 'Sayı doğrusunda sağdaki sayı daha büyüktür. 0,7 = 0,70 > 0,58.', vis: () => V.numberLine(0, 1, [{ v: 0, t: '0' }, { v: 0.5, t: '0,5' }, { v: 0.58, t: '' }, { v: 0.7, t: '0,7' }, { v: 1, t: '1' }], 0.58) },
      hikaye: 'Selin süt fiyatlarına baktı: A markette 22,10 TL, B markette 21,99 TL. "99 daha büyük!" dedi ama önce tam kısma bakması gerekiyordu: 21 < 22, yani B daha ucuz!',
      adim: ['Önce tam kısımları karşılaştır.', 'Eşitse onda birler basamağına bak.', 'O da eşitse yüzde birlere bak.', 'Basamak sayısı eşit değilse sona 0 ekleyerek eşitle.', 'Yüzde varsa hepsini aynı gösterime çevir.'],
      kural: '0,7 = 0,70 • 0,7 > 0,58 • %41 > 0,4',
    }),
    /* ---------------- TEMA 5 ---------------- */
    S('s_arastirma', 't5', 'İstatistiksel Araştırma Süreci', '60–69', {
      gorsel: { text: 'Araştırma 4 adımdır: <b>Soru → Veri → Grafik → Yorum</b>.', vis: () => '<div class="steps4"><span>❓ Soru</span><span>📋 Veri</span><span>📊 Grafik</span><span>💬 Yorum</span></div>' },
      hikaye: 'Sınıf temsilcisi Nehir, "Sınıfımız en çok hangi sporu seviyor?" diye merak etti. Herkese sordu, sonuçları tabloya yazdı, sütun grafiği çizdi ve yorumladı: "Voleybol kazandı!" Tam bir istatistikçi!',
      adim: ['Bir gruba sorulabilecek, birçok cevabı olan bir soru belirle.', 'Anket/gözlem ile veri topla veya hazır veri bul.', 'Veriyi tablo ve grafikle göster.', 'Sonuçları özetle ve yorumla.'],
      kural: 'Araştırma sorusu: bir gruba yönelik ve birden çok cevaplı olmalı. Kişisel bilgiler gizli tutulur.',
    }),
    S('s_tablo_sutun', 't5', 'Sıklık Tablosu ve Sütun Grafiği', '70–71', {
      gorsel: { text: 'Her sütunun <b>yüksekliği</b> o kategorinin sıklığını gösterir. Tepeden eksene doğru bak.', vis: () => V.barChart(['Elma', 'Muz', 'Çilek'], [6, 3, 8], { max: 8, step: 2 }) },
      hikaye: 'Atatürk Ortaokulu Cumhuriyet Bayramı için tişört aldı. Hangi bedenden kaç tane alındığı bir tabloya yazıldı, sonra sütun grafiğine dönüştü. En uzun sütun en çok alınan bedendi!',
      adim: ['Grafiğin başlığını ve eksenlerini oku.', 'İstenen kategorinin sütununu bul.', 'Sütunun tepesinden eksene yatay bak.', 'Fark için çıkar, toplam için topla.'],
      kural: 'Uzun sütun = çok tercih. "Kaç fazla" → çıkarma.',
    }),
    S('s_daire', 't5', 'Daire Grafiği', '72–77', {
      gorsel: { text: 'Bütün daire = tüm veri. Yarım daire <b>1/2</b>, çeyrek daire <b>1/4</b>.', vis: () => V.pieChart(['Futbol', 'Voleybol', 'Yüzme'], [0.5, 0.25, 0.25]) },
      hikaye: '40 öğrenciye en sevdiği spor soruldu. Daire grafiğinde futbol dairenin yarısını kaplıyordu. Zeynep hemen hesapladı: 40\'ın yarısı 20 öğrenci futbolu seçmiş!',
      adim: ['Dilimin bütünün kaçta kaçı olduğunu bul.', 'Toplam kişi sayısını paydaya böl.', 'Payla çarp.', 'Tüm dilimler toplamının bütünü verdiğini kontrol et.'],
      kural: 'Kişi sayısı = toplam × dilimin oranı.',
    }),
    S('s_okuryazar', 't5', 'Nokta Grafiği ve İstatistik Okuryazarlığı', '76–107', {
      gorsel: { text: 'Nokta grafiğinde her nokta bir kişidir. Bir grafiğe hemen inanma: eksenler 0\'dan mı başlıyor? Kontrol et!', vis: () => V.dotPlot(['Kedi', 'Köpek', 'Kuş'], [3, 5, 2]) },
      hikaye: 'Bir reklam "B markası A\'dan kat kat fazla satıyor!" diyordu. Ömer grafiğin eksenine baktı: 38\'den başlıyordu! Gerçek fark sadece 4 taneydi. Ömer bir istatistik dedektifi oldu.',
      adim: ['Grafiğin neyi gösterdiğini oku.', 'Eksenin nereden başladığını kontrol et.', 'Sadece verinin söylediğini söyle.', '"Herkes, hiç kimse, her zaman" gibi aşırı genellemelere dikkat et.'],
      kural: 'Veri sadece toplandığı grubu anlatır. Kesik eksen farkları abartabilir.',
    }),
    /* ---------------- TEMA 6 ---------------- */
    S('e_esitlik', 't6', 'Eşitlik ve Denge', '118–123', {
      gorsel: { text: '"=" bir <b>terazi</b> gibidir: iki taraf her zaman dengede.', vis: () => V.balance(['5', '7'], ['9', '3']) },
      hikaye: 'Aylin teraziye 5 kg ve 7 kg koydu. Diğer kefeye 9 kg koyunca terazi hâlâ eğikti. "3 kg eksik!" dedi ve ekledi; terazi dengeye geldi: 5 + 7 = 9 + 3.',
      adim: ['Bilinen tarafı hesapla.', 'Diğer taraf da o kadar olmalı.', 'Eksik sayıyı ters işlemle bul.', 'Bir tarafa ne yaparsan diğerine de aynısını yap.'],
      kural: '3 + 5 = 6 + 2 ✓ ("=" sonuç değil, denge işaretidir).',
    }),
    S('e_ozellik', 't6', 'İşlem Özellikleri', '124–130', {
      gorsel: { text: '6 × 12 = 6 × 10 + 6 × 2: dikdörtgeni ikiye böl, alanları topla. Bu <b>dağılma</b>dır!', vis: () => V.rect(12, 6, '', true) },
      hikaye: 'Sevil Öğretmen tahtaya 49 × 12 yazdı. Bir öğrenci 49 × 10 = 490 ve 49 × 2 = 98 bulup topladı: 588! Dağılma özelliği zor bir çarpmayı iki kolay çarpmaya çevirdi.',
      adim: ['Yerleri değişmiş mi? → değişme.', 'Parantezler kaymış mı? → birleşme.', 'Çarpan parantezin içine dağılmış mı? → dağılma.', 'Çıkarma ve bölmede değişme özelliği YOKTUR.'],
      kural: 'a×b = b×a • (a+b)+c = a+(b+c) • a×(b+c) = a×b + a×c',
    }),
    S('e_us', 't6', 'Kare ve Küp', '131–132', {
      gorsel: { text: '4² = 4 × 4: 4 sıra 4 kare. 3³ = 3 × 3 × 3: küp şeklinde 27 top.', vis: () => V.rect(4, 4, '', true) },
      hikaye: 'Sezen not kâğıtlarını panoya 5 sıra 5 sütun yapıştırdı: 5 × 5 = 25 kâğıt. Buna "5\'in karesi" denir ve 5² yazılır. Umay topları 3 × 3 × 3 dizip küp yaptı: 27 top, "3\'ün küpü"!',
      adim: ['Kare: sayıyı kendisiyle 1 kez çarp.', 'Küp: sayıyı kendisiyle 3 kez yan yana yazıp çarp.', 'Asla üs ile çarpma! (5² ≠ 10)'],
      kural: 'a² = a × a • a³ = a × a × a',
    }),
    S('e_oncelik', 't6', 'İşlem Önceliği', '133–136', {
      gorsel: { text: 'Sıra: <b>Parantez → Üs → Çarpma/Bölme → Toplama/Çıkarma</b>', vis: () => '<div class="steps4"><span>( )</span><span>x²</span><span>× ÷</span><span>+ −</span></div>' },
      hikaye: 'Mert 2 tane tek kalem ve 3 paket kalem (her pakette 4 tane) aldı. "2 + 3 × 4" yazdı. Soldan sağa yapsa 5 × 4 = 20 bulurdu ama gerçekte 2 + 12 = 14 kalemi vardı. Öncelik gerçek hayatı anlatır!',
      adim: ['Önce parantez içini yap.', 'Sonra üslü ifadeleri (kare, küp) hesapla.', 'Sonra çarpma ve bölmeyi soldan sağa yap.', 'En son toplama ve çıkarmayı soldan sağa yap.'],
      kural: '2 + 3 × 4 = 14 (20 değil!)',
    }),
    S('e_oruntu', 't6', 'Sayı ve Şekil Örüntüleri', '139–148', {
      gorsel: { text: 'Örüntüde her adımda aynı miktar artar. Kural: <b>ilk terim + (adım − 1) × artış</b>.', vis: () => V.dotPattern((k) => 2 * k + 1, 3) },
      hikaye: 'Ertuğrul kumbarasına her gün 15 TL attı: 15, 30, 45, 60... 10. gün ne kadar olur? Her gün 15 eklendiği için 10 × 15 = 150 TL! Ama kumbarada başta 20 TL olsaydı 20 + 150 = 170 TL olurdu.',
      adim: ['Ardışık terimlerin farkını bul (artış).', 'İlk terimi belirle.', 'n. terim = ilk terim + (n − 1) × artış.', 'Kuralı ilk terimlerle kontrol et.'],
      kural: '3, 7, 11, 15… → kural: 4 × adım − 1',
    }),
    S('e_algoritma', 't6', 'Algoritma ve Akış Şeması', '149–159', {
      gorsel: { text: 'Algoritma = sıralı adımlar. Akış şemasında oklar sırayı, karar kutuları "evet/hayır" yollarını gösterir.', vis: () => '<div class="steps4 col"><span>▶ Başla</span><span>Sayı × 2</span><span>+ 10</span><span>◀ Bitir</span></div>' },
      hikaye: 'Ayşe annesinden ayran tarifini aldı: yoğurt koy, su koy, çırp, tuz ekle, tadına bak, tuz yeterli değilse tekrar ekle... Bu bir algoritma! Sırayı karıştırsa ayran olmazdı.',
      adim: ['Adımları yazıldığı sırayla uygula.', 'Her adımdan sonra elindeki değeri not et.', 'Karar adımında koşulu kontrol et.', 'Döngüde kaç kez döndüğünü işaretle.'],
      kural: 'Algoritma: Başla → adımlar (sırayla) → Bitir.',
    }),
    /* ---------------- TEMA 7 ---------------- */
    S('p_olay', 't7', 'Olaylar: Kesin, İmkânsız, Mümkün', '167–169', {
      gorsel: { text: 'Olasılık 0 ile 1 arasındadır: 0 = <b>imkânsız</b>, 1 = <b>kesin</b>, arası = <b>mümkün</b>.', vis: () => V.numberLine(0, 1, [{ v: 0, t: 'İmkânsız' }, { v: 0.5, t: 'Eşit' }, { v: 1, t: 'Kesin' }]) },
      hikaye: 'Piknik günü yağmur yağar mı? Belki: <b>mümkün</b>. Zarla 7 atabilir miyiz? Asla: <b>imkânsız</b>. Yarın güneş doğacak mı? Kesinlikle: <b>kesin</b>!',
      adim: ['Olay mutlaka oluyor mu? → kesin (1).', 'Asla olamıyor mu? → imkânsız (0).', 'Olabilir de olmayabilir de mi? → mümkün.'],
      kural: 'İmkânsız = 0 • Kesin = 1 • Mümkün: 0 ile 1 arası.',
    }),
    S('p_spektrum', 't7', 'Olasılık Spektrumu', '170–178', {
      gorsel: { text: 'Mavi dilimler bütün dilimlerin kaçta kaçı? Bu kesir olasılığı gösterir. Yarıdan azsa <b>az olası</b>, yarısıysa <b>eşit olası</b>, fazlaysa <b>çok olası</b>.', vis: () => V.spinner(['sb', 'c0b', 'sb', 'sb']) },
      hikaye: 'Doğum günü çarkında 4 dilimin 3\'ü mavi. Duru "Mavi gelme ihtimali yüksek!" dedi. Haklıydı: 3/4, yarıdan fazla, yani <b>çok olası</b>.',
      adim: ['Kaç dilim mavi, say (parça).', 'Bütün dilimleri say (bütün).', 'Mavi dilimler bütünün kaçta kaçı? Bu kesir olasılığı gösterir.', '1/2 ile karşılaştır: az mı, eşit mi, çok mu?'],
      kural: 'Olasılık 0 ile 1 arasındadır; asla 1\'den büyük olamaz.',
    }),
  ];

  /* -------- KİTAPLARIM: iki kitabın tam içindekiler haritası --------
     tür: konu | hazir (ön bilgi kontrolü) | izleme/olcme (tema sınavı) | performans (gerçek hayat görevi) | bilgi
     Başlık ve sayfa numaraları kitabın içindekiler bölümünden alınmıştır; içerik metni kopyalanmaz. */
  const K = (s, b, tur, sk) => ({ s, b, tur, sk: sk || [] });
  const KITAP = {
    1: { ad: '1. Kitap', temalar: [
      { tema: 't1', eba: ['https://ders.eba.gov.tr/ders//redirectContent.jsp?resourceId=baacf6aaa02a30978fa2b7e48bc2ad03&resourceType=1&resourceLocation=2', 'https://www.eba.gov.tr/c?q=U19923_3f07767d'], ic: [
        K(14, 'Hazır mıyız?', 'hazir'), K(15, 'Başlayalım', 'bilgi'), K(17, 'Temel Geometrik Şekiller ve Özellikleri', 'konu', ['g_temel']), K(17, 'Nokta', 'konu', ['g_temel']),
        K(26, 'Çember', 'konu', ['g_cember']), K(29, 'Dikme', 'konu', ['g_dikme_paralel']), K(32, 'Temel Geometrik Çizimlerin Özellikleri', 'konu', ['g_dikme_paralel', 'g_cember']),
        K(37, 'Performans Görevi', 'performans'), K(39, 'Açıları Ölçme', 'konu', ['g_aci']), K(41, 'Açı Nasıl Ölçülür?', 'konu', ['g_aci']),
        K(45, 'Doğruların Yolculuğu', 'konu', ['g_aci_iliski']), K(46, 'İki Doğrunun Kesişimi', 'konu', ['g_aci_iliski']), K(48, 'Düzlemde Açı Oluşturmayan Doğrular', 'konu', ['g_dikme_paralel']),
        K(48, 'İki Doğrunun Çakışması', 'konu', ['g_dikme_paralel']), K(51, 'Üç Doğrunun Paralelliği', 'konu', ['g_dikme_paralel']), K(52, 'Üç Doğrunun Bir Noktada Kesişimi', 'konu', ['g_aci_iliski']),
        K(54, 'Zihin Haritası Oluşturma', 'bilgi'), K(55, 'Üç Doğrunun İkişer İkişer Kesişimi', 'konu', ['g_aci_iliski']), K(55, 'İki Paralel Doğru ve Bir Kesen', 'konu', ['g_aci_iliski']),
        K(57, 'Doğrulardan Çokgenlere', 'konu', ['g_cokgen']), K(62, 'Çokgenlerin Temel Elemanları', 'konu', ['g_cokgen']), K(70, 'Üçgen', 'konu', ['g_ucgen']),
        K(77, 'Üçgen İnşası', 'konu', ['g_ucgen', 'g_cember']), K(86, 'Ölçme ve Değerlendirme Soruları', 'olcme')] },
      { tema: 't2', eba: ['https://ders.eba.gov.tr/ders//redirectContent.jsp?resourceId=60878ceabe5bb7da99700e8e273fabe8&resourceType=1&resourceLocation=2', 'https://www.eba.gov.tr/c?q=U19934_3a4c6c3c'], ic: [
        K(94, 'Hazır mıyız?', 'hazir'), K(95, 'Başlayalım', 'bilgi'), K(97, 'Doğal Sayılar ve İşlemler', 'konu', ['n_okuma']), K(97, 'Çok Basamaklı Doğal Sayıları Okuma ve Yazma', 'konu', ['n_okuma', 'n_basamak', 'n_karsilastir']),
        K(108, 'İzleme Testi', 'izleme'), K(110, 'Hazır mıyız?', 'hazir'), K(111, 'Gerçek Yaşam Problemlerini Çözebilme', 'konu', ['n_toplacikar', 'n_carpbol', 'n_tahmin', 'n_problem']),
        K(124, 'Performans Görevi', 'performans'), K(135, 'Ölçme ve Değerlendirme Soruları', 'olcme')] },
      { tema: 't3', eba: ['https://ders.eba.gov.tr/ders//redirectContent.jsp?resourceId=3ca2b0fb3517aa1d2b3e93d213fa4e43&resourceType=1&resourceLocation=2', 'https://www.eba.gov.tr/c?q=U19920_88b44dab'], ic: [
        K(140, 'Hazır mıyız?', 'hazir'), K(141, 'Başlayalım', 'bilgi'), K(142, 'Dikdörtgenin Çevre Uzunluğu', 'konu', ['a_cevre']), K(145, 'Dikdörtgenin Alanı', 'konu', ['a_alan']),
        K(150, 'Dikdörtgende Çevre Uzunluğu ve Alan', 'konu', ['a_cevre_alan']), K(155, 'Performans Görevi', 'performans'), K(164, 'Ölçme ve Değerlendirme Soruları', 'olcme')] },
    ] },
    2: { ad: '2. Kitap', temalar: [
      { tema: 't4', eba: ['https://ders.eba.gov.tr/ders//redirectContent.jsp?resourceId=d3eeed74ea9827966d36b38f853f7654&resourceType=1&resourceLocation=2', 'https://www.eba.gov.tr/c?q=U19930_ac2bd0e5'], ic: [
        K(14, 'Hazır mıyız?', 'hazir'), K(15, 'Başlayalım', 'bilgi'), K(17, 'Kesirler', 'konu', ['f_tur']), K(17, 'Kesirleri Farklı Biçimlerde Temsil Etme', 'konu', ['f_tur', 'f_denk', 'f_ondalik', 'f_yuzde']),
        K(32, 'İzleme Testi', 'izleme'), K(34, 'Başlayalım', 'bilgi'), K(35, 'Kesirleri Karşılaştırma', 'konu', ['f_karsilastir', 'f_ondalik_karsilastir']), K(49, 'İzleme Testi', 'izleme'),
        K(51, 'Performans Görevi', 'performans'), K(52, 'Ölçme ve Değerlendirme Soruları', 'olcme')] },
      { tema: 't5', eba: ['https://ders.eba.gov.tr/ders//redirectContent.jsp?resourceId=92839aa69222777518efcb319f435dbd&resourceType=1&resourceLocation=2', 'https://www.eba.gov.tr/c?q=U19917_5b9efd44'], ic: [
        K(58, 'Hazır mıyız?', 'hazir'), K(59, 'Başlayalım', 'bilgi'), K(60, 'İstatistiksel Araştırma Süreci', 'konu', ['s_arastirma']), K(61, 'İstatistik Nedir?', 'konu', ['s_arastirma']),
        K(62, 'İstatistiksel Araştırma Adımları', 'konu', ['s_arastirma']), K(66, 'Araştırma Sorusuna Uygun Anket Sorusu Yazma', 'konu', ['s_arastirma']), K(70, 'Veri Görselleştirme Araçları', 'konu', ['s_tablo_sutun']),
        K(70, 'Sütun Grafiği', 'konu', ['s_tablo_sutun']), K(72, 'Daire Grafiği', 'konu', ['s_daire']), K(78, 'Performans Görevi', 'performans'), K(82, 'Performans Görevi', 'performans'),
        K(94, 'İstatistik Okuryazarlığı', 'konu', ['s_okuryazar']), K(96, 'Verilerin Değişebilirliği', 'konu', ['s_okuryazar']), K(99, 'Performans Görevi', 'performans'), K(108, 'Ölçme ve Değerlendirme Soruları', 'olcme')] },
      { tema: 't6', eba: ['https://ders.eba.gov.tr/ders//redirectContent.jsp?resourceId=dd15b9c10607960eee40fad002f9d08a&resourceType=1&resourceLocation=2', 'https://www.eba.gov.tr/c?q=U19926_f231cc63'], ic: [
        K(116, 'Hazır mıyız?', 'hazir'), K(117, 'Başlayalım', 'bilgi'), K(118, 'Eşitliğin Korunumu ve İşlem Özellikleri', 'konu', ['e_esitlik', 'e_ozellik']), K(131, 'İşlem Önceliği', 'konu', ['e_us', 'e_oncelik']),
        K(137, 'Performans Görevi', 'performans'), K(138, 'Hazır mıyız?', 'hazir'), K(139, 'Sayı ve Şekil Örüntüleri', 'konu', ['e_oruntu']), K(147, 'İzleme Testi', 'izleme'),
        K(149, 'Hazır mıyız?', 'hazir'), K(149, 'Temel Aritmetik İşlemler ve Algoritma', 'konu', ['e_algoritma']), K(160, 'Ölçme ve Değerlendirme Soruları', 'olcme')] },
      { tema: 't7', eba: ['https://ders.eba.gov.tr/ders//redirectContent.jsp?resourceId=6153e8d72f2588aa6ee0127f96dba757&resourceType=1&resourceLocation=2', 'https://www.eba.gov.tr/c?q=U19912_0a9919f2'], ic: [
        K(166, 'Hazır mıyız?', 'hazir'), K(166, 'Başlayalım', 'bilgi'), K(167, 'Olayların Olasılığı', 'konu', ['p_olay']), K(170, 'Olasılık Spektrumu', 'konu', ['p_spektrum']),
        K(172, 'İzleme Testi', 'izleme'), K(176, 'Performans Görevi', 'performans'), K(179, 'Ölçme ve Değerlendirme Soruları', 'olcme')] },
    ] },
  };
  // Özgün gerçek hayat görevleri (kitabın performans görevlerinin yerine; metinler bize ait)
  const GOREV = {
    t1: { ad: 'Evdeki Geometri Avı', is: 'Evinde 3 dik açı, 2 paralel çizgi ve 1 çember bul. Her birinin fotoğrafını çek ya da çiz, altına adını yaz (ör. "kapı kenarları paraleldir").', kanit: 'Bulduklarını bir yetişkine göster.' },
    t2: { ad: 'Market Bütçesi', is: 'Ailenle bir market alışverişi listesi hazırla. Ürünlerin fiyatlarını yaz, toplamı hesapla, sonra fişle karşılaştır. Fark varsa nedenini bul.', kanit: 'Hesabını ve fişi birlikte kontrol edin.' },
    t3: { ad: 'Odamın Ölçüleri', is: 'Odanın (ya da masanın) iki kenarını metreyle ölç. Çevresini ve alanını hesapla. Odaya halı alınsaydı kaç m² gerekirdi?', kanit: 'Ölçümlerini bir kâğıda çizim olarak yap.' },
    t4: { ad: 'İndirim Dedektifi', is: 'Bir broşür ya da etiketlerde 3 farklı indirim (%) ve 3 virgüllü fiyat bul. Her birini kesir olarak yaz ve büyükten küçüğe sırala.', kanit: 'Sıralamanı bir yetişkinle kontrol et.' },
    t5: { ad: 'Mini Anket', is: 'En az 10 kişiye bir araştırma sorusu sor (ör. "En sevdiğin meyve?"). Sonuçları sıklık tablosuna yaz, sütun grafiği çiz ve 2 cümleyle yorumla.', kanit: 'Grafiğini ailene sun.' },
    t6: { ad: 'Örüntü Tasarımcısı', is: 'Düğme, fasulye ya da kalemlerle kendi şekil örüntünü oluştur. İlk 4 adımını diz, kuralını yaz ve 10. adımda kaç nesne olacağını hesapla.', kanit: 'Bir arkadaşından kuralı bulmasını iste.' },
    t7: { ad: 'Şans Çarkı', is: 'Kartondan 8 dilimli bir çark yap, dilimleri farklı renklere boya. Her rengin gelme olasılığını kesirle yaz. Çarkı 20 kez çevirip sonuçları kaydet.', kanit: 'Tahminlerinle sonuçları karşılaştır.' },
  };
  // Önkoşul: aynı temadaki bir önceki beceri
  SKILLS.forEach((s, i) => { s.prereq = (i > 0 && SKILLS[i - 1].theme === s.theme) ? [SKILLS[i - 1].id] : []; });
  const SKILL = Object.fromEntries(SKILLS.map(s => [s.id, s]));
  const FORMATS = { gorsel: { name: 'Görsel model', icon: '🖼️' }, hikaye: { name: 'Hikâye ile', icon: '📖' }, adim: { name: 'Adım adım', icon: '🪜' }, kural: { name: 'Kısa ve net', icon: '⚡' } };

  G.MY_CUR = { THEMES, SKILLS, SKILL, FORMATS, KITAP, GOREV };
  if (typeof module !== 'undefined') module.exports = { THEMES, SKILLS, SKILL, FORMATS, KITAP, GOREV };
})(typeof window !== 'undefined' ? window : globalThis);
