/* ============================================================
   Pi'nin replikleri — tek kaynak.
   Hem uygulama (yazı + ses anahtarı) hem ses üretim betiği bunu kullanır.
   Ses dosyası adı: pi_<grup>_<sıra>.mp3  (ör. pi_dogru_3.mp3)
   ============================================================ */
(function (G) {
  const L = {
    dogru: ['Harika!', 'Süpersin!', 'Mükemmel!', 'Tam isabet!', 'Bravo!', 'Çok iyi!', 'İşte bu!', 'Matematik dehası!', 'Şahane!', 'Kafana sağlık!'],
    telafi: ['Hatandan öğrendin!', 'İşte gerçek öğrenme bu!', 'Geri döndün, harika!', 'Gördün mü, yapabiliyorsun!'],
    yanlis: ['Sorun değil, birlikte bakalım.', 'Hata yapmak öğrenmenin parçası.', 'Neredeyse! Şimdi nedenine bakalım.', 'Hiç dert etme, bir daha deneyeceğiz.', 'Bu soru biraz zordu, ama sen pes etmezsin.', 'Güzel denemeydi! Gel, birlikte çözelim.'],
    aciklama: ['Gel, nerede karıştığına birlikte bakalım.', 'Şuraya bir bak, bence burada küçük bir karışıklık oldu.'],
    telafi_soru: ['Şimdi benzer ama biraz daha kolay bir soru geliyor. Sen yaparsın!', 'Hadi bir daha deneyelim, bu sefer olacak!'],
    yonlendir: ['Takıldın mı? Ampule dokunursan sana ipucu veririm.', 'Acele etme, düşünmek de öğrenmektir.', 'Soruyu bir daha oku, bazen cevap orada saklıdır.'],
    ipucu: ['Bak, sana küçük bir ipucu.', 'İşte bir ipucu, gerisi sende!'],
    ders_basla: ['Hadi başlayalım!', 'Bugün beynini çalıştırma zamanı!', 'Hazır mısın? Başlıyoruz!'],
    yari: ['Yarıyı geçtin, harika gidiyorsun!', 'Yarı yoldayız, devam!'],
    hosgeldin_geri: ['Tekrar hoş geldin! Kaldığımız yerden devam edelim mi?', 'Seni özledim! Hadi biraz matematik yapalım.', 'Yine geldin, süpersin! Bugün ne öğreniyoruz?'],
    sinav: ['Tema sınavı başlıyor. Sakin ol, sen buna hazırsın!'],
    kupa: ['Kupa senin! Bu temanın ustası oldun!'],
    gorev: ['Bir görevi daha tamamladın, ödülünü al!'],
    seri3: ['Üç doğru üst üste! Seri ateşi yandı!', 'Seri başladı, devam!'],
    seri5: ['Durdurulamazsın!', 'Beş doğru üst üste! İnanılmaz!'],
    seri8: ['Efsane! Gerçek bir matematik ustasısın!', 'Bu seri efsanelere yakışır!'],
    bitti: ['Ders bitti, harika çalıştın!', 'Bugün beynin biraz daha güçlendi!', 'Bir adım daha ileridesin, aferin!'],
    rekor: ['Süre doldu! Bakalım rekoru kırdın mı?', 'Şimşek gibiydin!'],
    hosgeldin: ['Merhaba, ben Pi! Beşinci sınıf matematiğini seninle oyun gibi öğreneceğiz. Her öğrenci başka bir çiçektir; ben de sana en uygun yolu bulacağım.'],
    kart: ['Önce sana bu konuyu anlatayım. Olmazsa başka türlü anlatırım!'],
  };
  G.MY_PI_LINES = L;
  if (typeof module !== 'undefined') module.exports = L;
})(typeof window !== 'undefined' ? window : globalThis);
