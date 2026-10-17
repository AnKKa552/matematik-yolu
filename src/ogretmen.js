/* =========================================================
   ÖĞRETMEN SORU İNCELEME PANELİ (CLAUDE.md §5 adım 6, §11 A2)
   - Davet bağlantısıyla açılır: ogretmen.html?kod=…  (kod sunucuda denetlenir; kodsuz kayıt yapılamaz)
   - Sorular TOHUMLU rastgele sayılarla üretilir: aynı soru kimliği her açılışta aynı soruyu verir.
     Ayrıca değerlendirilen sorunun tam kopyası (metin, şıklar, cevap) sunucuya kaydedilir; üretici
     sonradan değişse bile öğretmenin neye baktığı kaybolmaz.
   - Her konudan 10 örnek (seviye 1·1·1·2·2·2·2·3·3·3) + Hata Avcısı (42) + Problem Atölyesi (20 problem).
   - Kararlar önce cihaza yazılır, sonra sunucuya gönderilir; internet yoksa sırada bekler.
   ========================================================= */
(function () {
  const G = window, U = G.MY_U, GEN = G.MY_GEN, MIS = G.MY_MIS, HATA = G.MY_HATA, ATOLYE = G.MY_ATOLYE, CUR = G.MY_CUR;
  const SURUM = '/*SURUM*/', CFG = G.MY_CONFIG || {}, KOD = (new URLSearchParams(location.search).get('kod') || '').trim();
  const KAYIT = 'ogr_inceleme_' + KOD, el = document.getElementById('panel');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- Tohumlu üretim ---------- */
  const hash = (s) => { let h = 1779033703 ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return h >>> 0; };
  const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const tohumla = (id, fn) => { const r = Math.random; Math.random = mulberry(hash(id)); try { return fn(); } finally { Math.random = r; } };
  const anahtar = (q) => String(q.prompt).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() + '|' + JSON.stringify(q.options ? q.options.map((o) => o.t) : [q.answer, q.hedef, q.pairs && q.pairs.map((p) => p.a)]);

  /* ---------- Örneklem ---------- */
  const SEV = [1, 1, 1, 2, 2, 2, 2, 3, 3, 3];
  const BOLUM = [];
  CUR.THEMES.forEach((t) => CUR.SKILLS.filter((s) => s.theme === t.id).forEach((s) => BOLUM.push({ id: s.id, ad: s.title, tema: t.title, tur: 'beceri' })));
  BOLUM.push({ id: 'hata', ad: 'Hata Avcısı (muhakeme)', tema: 'Özel etkinlikler', tur: 'hata' });
  BOLUM.push({ id: 'atolye', ad: 'Problem Atölyesi', tema: 'Özel etkinlikler', tur: 'atolye' });
  const onbellek = {};
  const sorular = (b) => {
    if (onbellek[b.id]) return onbellek[b.id];
    const L = [], gor = new Set();
    if (b.tur === 'beceri') SEV.forEach((lv, i) => { for (let k = 0; k < 30; k++) { const id = `${b.id}-${lv}-${i}${k ? '-' + k : ''}`, q = tohumla(id, () => GEN[b.id](lv)), a = anahtar(q); if (!gor.has(a) || k === 29) { gor.add(a); L.push({ id, seviye: lv, beceri: b.id, q }); break; } } });
    if (b.tur === 'hata') HATA.ids.forEach((sid, i) => ['bul', 'kim', 'neden'].filter((_, j) => j === i % 3 || j === (i + 1) % 3).forEach((tur) => { const id = `hata-${sid}-${tur}`; L.push({ id, seviye: 2, beceri: sid, q: tohumla(id, () => HATA.q(sid, 2, tur)) }); }));
    if (b.tur === 'atolye') ATOLYE.ids.forEach((pid) => ['a', 'b'].forEach((v) => { const id = `atolye-${pid}-${v}`; const sec = v === 'a' ? { tablo: false, kur: false, gerekce: false, no: 1 } : { tablo: true, kur: true, gerekce: true, no: 2 };
      L.push({ id, seviye: 2, beceri: ATOLYE.skillOf(pid), adimlar: tohumla(id, () => ATOLYE.sorular(pid, sec)) }); }));
    return (onbellek[b.id] = L);
  };
  const TOPLAM = BOLUM.reduce((a, b) => a + sorular(b).length, 0);

  /* ---------- Durum ---------- */
  let S = { ad: '', bolum: BOLUM[0].id, i: 0, k: {}, ozet: false };
  try { S = Object.assign(S, JSON.parse(localStorage.getItem(KAYIT) || '{}')); } catch (e) { }
  const sakla = () => { try { localStorage.setItem(KAYIT, JSON.stringify(S)); } catch (e) { } };
  let FORM = null, MESAJ = '';

  /* ---------- Sunucu ---------- */
  const rpc = (fn, body) => fetch(`${CFG.supabaseUrl}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: CFG.anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))));
  const kopya = (it) => JSON.parse(JSON.stringify(it.q || { adimlar: it.adimlar }));
  const gonder = (id) => { const k = S.k[id], it = bul(id); if (!k || !it) return Promise.resolve();
    return rpc('inceleme_kaydet', { p_kod: KOD, p_inceleyen: S.ad, p_soru_id: id, p_beceri: it.beceri, p_seviye: it.seviye, p_karar: k.karar, p_etiketler: k.etiketler || [], p_aciklama: k.aciklama || '', p_soru: kopya(it), p_surum: SURUM })
      .then((ok) => { if (ok === true) { k.gonderildi = true; sakla(); } else throw new Error('kod'); }); };
  const bekleyenleriGonder = () => { const ids = Object.keys(S.k).filter((id) => !S.k[id].gonderildi); return ids.reduce((p, id) => p.then(() => gonder(id)), Promise.resolve()).then(() => { MESAJ = ''; }).catch(() => { MESAJ = '⚠️ Bazı kararlar henüz gönderilemedi; internet gelince otomatik gönderilecek.'; }).then(ciz); };
  const bul = (id) => { for (const b of BOLUM) { const x = sorular(b).find((it) => it.id === id); if (x) return x; } return null; };

  /* ---------- Gösterim yardımcıları ---------- */
  const misAd = (m) => (m && MIS[m] ? MIS[m].t : m || '');
  const TUR = { mc: 'Çoktan seçmeli', tf: 'Doğru / yanlış', cmp: 'Karşılaştırma', input: 'Sayı yazma', kes: 'Parmakla kesir (çizerek)', match: 'Eşleştirme', tablo: 'Bilgileri yerleştirme', kur: 'Kartlarla işlem kurma' };
  const ASAMA = ATOLYE.ASAMA;
  const govde = (q) => `<div class="pq">${q.prompt}</div>${q.visual ? `<div class="visbox">${q.visual}</div>` : ''}${q.grid ? `<div class="pgrid">${q.grid.map((r) => `<div class="pcell">${r[0]}</div><div class="pcell ${r[1] === '?' ? 'miss' : ''}">${r[1]}</div>`).join('')}</div>` : ''}${q.cmp ? `<div class="cmpline"><span>${q.cmp[0]}</span><span class="cmpbox">?</span><span>${q.cmp[1]}</span></div>` : ''}${q.defter ? `<div class="defterler ${q.defter.length > 1 ? 'iki' : ''}">${q.defter.map((d) => `<div class="defter"><div class="dad">✏️ ${esc(U.wk(d.ad, 'in'))} defteri</div><ol>${d.satirlar.map((x, i) => `<li class="${d.isaret === i || d.hata === i ? 'isaret' : ''}">${x}${d.hata === i ? ' <small>(hatalı satır)</small>' : ''}</li>`).join('')}</ol></div>`).join('')}</div>` : ''}`;
  const yanlisSatir = (metin, mis, ac) => `<li class="ys"><div>${metin}</div><div class="ym">🧩 ${esc(misAd(mis))}${ac ? `<br><span>💬 Öğrenciye gösterilen açıklama: ${ac}</span>` : ''}</div></li>`;
  const cevap = (q) => {
    if (q.type === 'input') return `<div class="dc">✅ Doğru cevap: <b>${esc(q.answer).replace('.', ',')} ${esc(q.unit || '')}</b></div>${(q.inputMis || []).length ? `<div class="alt">Tanınan yanlış cevaplar (başka bir sayı girilirse "genel işlem hatası" sayılır):</div><ul class="yl">${q.inputMis.map((m) => yanlisSatir(`<b>${esc(String(m.v).replace('.', ','))}</b>`, m.mis, m.ac)).join('')}</ul>` : ''}`;
    if (q.type === 'kes') return `<div class="dc">✅ Hedef: <b>${q.cevap}</b> · Model: ${({ pie: 'daire (pasta)', bar: 'şerit', line: 'sayı doğrusu' })[q.model]}${q.parca ? `, ${q.parca} eş parça hazır` : ', öğrenci kaç parçaya böleceğini kendisi seçer'}${q.denk ? ' · denk kesir de kabul edilir' : ''}</div><ul class="yl">${yanlisSatir('Boş kısmı boyamak', 'bos_kisim')}${yanlisSatir('Pay ile paydayı ters kurmak', 'pay_payda_ters')}${q.model === 'line' ? yanlisSatir('Sayı doğrusunda bir çizgi eksik/fazla', 'cizgi_sayma') : ''}${yanlisSatir('Diğer bütün yanlış kurulumlar', 'kesir_model')}</ul>`;
    if (q.type === 'match') return `<div class="dc">✅ Doğru eşleşmeler:</div><ul class="eslesme">${q.pairs.map((p) => `<li><span>${p.a}</span><b>↔</b><span>${p.b}</span></li>`).join('')}</ul><div class="alt">Yanlış eşleştirme yanılgısı: ${esc(misAd(q.mis))}</div>`;
    if (q.type === 'tablo') return `<div class="dc">✅ Doğru yerleşim:</div><ul class="eslesme">${q.satirlar.map((r) => `<li><span>${r.t}</span><b>→</b><span>${ATOLYE.TABLO_AD[r.d]}</span></li>`).join('')}</ul><div class="alt">Ara sonuç ↔ sorulan karışırsa: ${esc(misAd('ara_sonuc'))}. Verilen bilgiyle karışırsa: ${esc(misAd('istenen_verilen'))}.</div>`;
    if (q.type === 'kur') return `<div class="dc">✅ Sayı kartları: <b>${q.kartlar.map((k) => U.fmtN(k)).join(' · ')}</b> (her biri bir kez) + işlem kartları + − × ÷ ( )<br>Örnek doğru işlem: <b>${q.cevap}</b> — aynı değeri veren her işlem kabul edilir.</div>${q.yanilgi.length ? `<div class="alt">Tanınan yanlış sonuçlar:</div><ul class="yl">${q.yanilgi.map((y) => yanlisSatir(`Sonuç <b>${ATOLYE.sayiYaz(y.v)}</b>`, y.mis, y.ac)).join('')}</ul>` : ''}`;
    const ok = q.options.filter((o) => o.ok), yan = q.options.filter((o) => !o.ok);
    return `${q.atolye && q.atolye.asama === 'tahmin' ? '<div class="alt">Tahmin puanlanmaz; öğrenciye doğru/yanlış denmez, çözünce karşılaştırılır.</div>' : ''}${ok.map((o) => `<div class="dc">✅ Doğru: <b>${o.t}</b></div>`).join('')}<ul class="yl">${yan.map((o) => yanlisSatir(o.t, o.mis, o.ac)).join('')}</ul>`;
  };
  const ekBilgi = (q) => `${q.hint || q.ip ? `<div class="ek"><b>💡 İpucu (öğrenci isterse / ilk yanlıştan sonra):</b> ${q.ip || q.hint}</div>` : ''}${(q.steps || []).length ? `<details class="ek"><summary>🪜 Çözüm adımları (ikinci yanlıştan sonra gösterilir)</summary><ol>${q.steps.map((s) => `<li>${s}</li>`).join('')}</ol></details>` : ''}`;
  const soruKart = (it) => {
    if (it.adimlar) { const b = it.adimlar[0].atolye;
      return `<div class="baglam"><div class="bt">🧩 ${esc(b.baslik)}</div><div>${b.baglam}</div></div>${it.adimlar.map((q, n) => `<div class="adim"><div class="an">${n + 1}. ${esc(ASAMA[q.atolye.asama] || q.atolye.asama)}${q.gerekce ? ' (gerekçe)' : ''} <small>${esc(TUR[q.type] || '')}</small>${q.atolye.asama === 'derin' ? ' <small>· yalnız çözüm adımlarını ilk denemede yapan öğrenciye gelir</small>' : ''}</div>${q.atolye.asama === 'bagimsiz' ? `<div class="baglam kucuk">${q.atolye.baglam}</div>` : ''}${govde(q)}${cevap(q)}${ekBilgi(q)}</div>`).join('')}`; }
    const q = it.q;
    return `<div class="tur">${esc(TUR[q.type] || q.type)}${q.hata ? ' · Hata Avcısı: ' + ({ bul: 'hatayı bul', kim: 'kim haklı', neden: 'hatanın nedeni' })[q.hata] : ''}${q.ref ? ' · kitaptaki soru tipinden esinlenildi' : ''}</div>${govde(q)}${cevap(q)}${ekBilgi(q)}`;
  };

  /* ---------- Ekranlar ---------- */
  const ETIKET = [['dil', 'Dil / anlatım'], ['seviye', '5. sınıf seviyesine uygun değil'], ['matematik', 'Matematik hatası'], ['mufredat', 'Müfredat dışı'], ['celdirici', 'Yanlış şık / yanılgı uygun değil'], ['aciklama', 'Açıklama / ipucu'], ['gorsel', 'Görsel / şekil'], ['yontem', 'Okulda öğretilen yönteme aykırı']];
  const sayac = () => { const k = Object.values(S.k); return { n: k.length, uygun: k.filter((x) => x.karar === 'uygun').length, duzelt: k.filter((x) => x.karar === 'duzelt').length, red: k.filter((x) => x.karar === 'uygun_degil').length }; };
  const bolumSay = (b) => sorular(b).filter((it) => S.k[it.id]).length;
  function giris() {
    return `<div class="og-kutu giris"><img src="img/pi_konus.webp" alt="" class="gpi"><h1>Soru İnceleme Paneli</h1><p class="sub">Matematik Yolu · 5. sınıf Maarif matematiği</p>
      <p>Merhaba! Bu uygulamadaki sorular bilgisayarla, her seferinde yeni sayılarla üretiliyor. Cevapları kod hesaplıyor; ama <b>sorunun sınıfta işe yarayıp yaramadığını</b> ancak bir öğretmen söyleyebilir. Her konudan örnek sorulara bakıp kısa bir karar vermenizi rica ediyoruz.</p>
      <h3>Neye bakmanızı istiyoruz?</h3><ul><li>Soru doğru ve tek cevaplı mı?</li><li>Dil 10–11 yaşındaki bir öğrenci için anlaşılır mı?</li><li>Zorluk 5. sınıf Maarif programına uygun mu?</li><li>Yanlış şıklar gerçekten öğrencilerin yaptığı hataları yansıtıyor mu? (Her yanlış şıkkın altında bağlı olduğu yanılgı yazıyor.)</li><li>Terimler ve yöntem okulda öğretilenle uyumlu mu?</li></ul>
      <p class="not">Bir soruyu "düzeltilmeli" diye işaretlemeniz, o <b>soru tipinin tamamının</b> düzeltilmesini sağlar. ${TOPLAM} örneğin hepsine bakmanız gerekmez; istediğiniz konudan başlayabilir, istediğiniz zaman bırakıp kaldığınız yerden devam edebilirsiniz.</p>
      <label class="lbl">Adınız (yalnız incelemelerde görünür)<input id="ad" maxlength="60" placeholder="Örn. Ayşe Öğretmen" value="${esc(S.ad)}"></label>
      <button class="btn ok" data-a="basla">İncelemeye başla</button></div>`;
  }
  function ozet() {
    const c = sayac(), isaretli = Object.entries(S.k).filter(([, k]) => k.karar !== 'uygun');
    return `<div class="og-kutu"><div class="row ust"><h2>📋 Özet</h2><button class="btn ghost kucukb" data-a="ozet-kapat">← Sorulara dön</button></div>
      <div class="sayilar"><div><b>${c.n}</b><span>incelendi / ${TOPLAM}</span></div><div class="u"><b>${c.uygun}</b><span>✅ uygun</span></div><div class="d"><b>${c.duzelt}</b><span>✏️ düzeltilmeli</span></div><div class="r"><b>${c.red}</b><span>❌ uygun değil</span></div></div>
      <h3>Konulara göre</h3><div class="bliste">${BOLUM.map((b) => { const n = sorular(b).length, m = bolumSay(b); return `<button class="bsatir" data-a="git" data-v="${b.id}"><span>${esc(b.ad)}</span><span class="bar"><i style="width:${Math.round((100 * m) / n)}%"></i></span><small>${m}/${n}</small></button>`; }).join('')}</div>
      <h3>İşaretlediğiniz sorular (${isaretli.length})</h3>${isaretli.length ? `<ul class="isaretli">${isaretli.map(([id, k]) => { const it = bul(id); return `<li><button data-a="soruya" data-v="${id}">${k.karar === 'duzelt' ? '✏️' : '❌'} ${esc(it ? (CUR.SKILL[it.beceri] || {}).title || it.beceri : id)}</button> ${(k.etiketler || []).map((e) => `<span class="et">${esc((ETIKET.find((x) => x[0] === e) || [, e])[1])}</span>`).join(' ')}${k.aciklama ? `<div class="na">“${esc(k.aciklama)}”</div>` : ''}</li>`; }).join('')}</ul>` : '<p class="muted">Henüz işaretlenen soru yok.</p>'}
      ${MESAJ ? `<div class="uyari">${MESAJ}</div>` : ''}<p class="muted sm">Kararlarınız otomatik olarak geliştirici ekibe iletiliyor. Teşekkür ederiz! 🙏</p></div>`;
  }
  function ana() {
    const b = BOLUM.find((x) => x.id === S.bolum) || BOLUM[0], L = sorular(b); S.i = Math.max(0, Math.min(S.i, L.length - 1));
    const it = L[S.i], k = S.k[it.id], c = sayac(), f = FORM && FORM.id === it.id ? FORM : null;
    const temalar = [...new Set(BOLUM.map((x) => x.tema))];
    const secim = `<select id="bolum" aria-label="Konu seç">${temalar.map((t) => `<optgroup label="${esc(t)}">${BOLUM.filter((x) => x.tema === t).map((x) => `<option value="${x.id}" ${x.id === b.id ? 'selected' : ''}>${bolumSay(x) === sorular(x).length ? '✓ ' : ''}${esc(x.ad)} (${bolumSay(x)}/${sorular(x).length})</option>`).join('')}</optgroup>`).join('')}</select>`;
    const kararForm = f ? `<div class="kform"><div class="kbas">${f.karar === 'duzelt' ? '✏️ Düzeltilmeli' : '❌ Uygun değil'}: neyle ilgili?</div><div class="etler">${ETIKET.map(([e, ad]) => `<button class="et ${f.etiketler.includes(e) ? 'on' : ''}" data-a="etiket" data-v="${e}">${ad}</button>`).join('')}</div>
      <textarea id="acik" maxlength="2000" placeholder="Ne değişmeli? Kısa bir not yeterli. (Örn. &quot;'bütünler' yerine kitapta … deniyor&quot;)">${esc(f.aciklama)}</textarea>
      <div class="row"><button class="btn ghost" data-a="vazgec">Vazgeç</button><button class="btn" data-a="kaydet" ${f.etiketler.length || f.aciklama.trim() ? '' : 'disabled'}>Kaydet ve sonraki →</button></div></div>` : '';
    const mevcut = k && !f ? `<div class="mevcut ${k.karar}">${k.karar === 'uygun' ? '✅ Uygun dediniz' : k.karar === 'duzelt' ? '✏️ Düzeltilmeli dediniz' : '❌ Uygun değil dediniz'}${(k.etiketler || []).length ? ' · ' + k.etiketler.map((e) => (ETIKET.find((x) => x[0] === e) || [, e])[1]).join(', ') : ''}${k.aciklama ? `<div class="na">“${esc(k.aciklama)}”</div>` : ''}${k.gonderildi ? '' : ' <small>(gönderiliyor…)</small>'}</div>` : '';
    return `<header class="og-ust"><div><b>Soru İnceleme</b><small>${esc(S.ad)} · ${c.n}/${TOPLAM} incelendi</small></div><button class="btn ghost kucukb" data-a="ozet">📋 Özet</button></header>
      <div class="og-kutu">${secim}<div class="ilerle"><i style="width:${Math.round((100 * bolumSay(b)) / L.length)}%"></i></div>
      <div class="row ust"><div class="sno">${b.tur === 'atolye' ? 'Problem' : 'Soru'} ${S.i + 1}/${L.length}${it.q ? ` · seviye ${'●'.repeat(it.seviye)}${'○'.repeat(3 - it.seviye)}` : ''}${b.tur === 'hata' ? ` · ${esc((CUR.SKILL[it.beceri] || {}).title || '')}` : ''}</div><div class="row"><button class="btn ghost kucukb" data-a="geri" ${S.i ? '' : 'disabled'} aria-label="Önceki">←</button><button class="btn ghost kucukb" data-a="ileri" ${S.i < L.length - 1 ? '' : 'disabled'} aria-label="Sonraki">→</button></div></div>
      <div class="kart">${soruKart(it)}</div>${mevcut}${kararForm}
      ${f ? '' : `<div class="kararlar"><button class="btn ok" data-a="karar" data-v="uygun">✅ Uygun</button><button class="btn warn" data-a="karar" data-v="duzelt">✏️ Düzeltilsin</button><button class="btn bad" data-a="karar" data-v="uygun_degil">❌ Uygun değil</button></div>`}
      ${MESAJ ? `<div class="uyari">${MESAJ}</div>` : ''}<div class="muted sm kimlik">Soru kimliği: ${esc(it.id)} · sürüm ${esc(SURUM)}</div></div>`;
  }
  function ciz() {
    if (!KOD || !CFG.supabaseUrl) { el.innerHTML = `<div class="og-kutu giris"><h1>Soru İnceleme Paneli</h1><p>Bu sayfa davet bağlantısıyla açılır. Size gönderilen bağlantıyı kullanın.</p></div>`; return; }
    if (GECERLI === null) { el.innerHTML = `<div class="og-kutu giris"><p>Bağlantı kontrol ediliyor…</p></div>`; return; }
    if (GECERLI === false) { el.innerHTML = `<div class="og-kutu giris"><h1>Soru İnceleme Paneli</h1><p>Bu davet bağlantısı geçerli değil ya da süresi dolmuş. Lütfen sizi davet eden kişiyle iletişime geçin.</p></div>`; return; }
    el.innerHTML = !S.ad ? giris() : S.ozet ? ozet() : ana();
  }
  const ilerle = () => { const b = BOLUM.find((x) => x.id === S.bolum), L = sorular(b); if (S.i < L.length - 1) S.i++; else { const j = BOLUM.indexOf(b); if (j < BOLUM.length - 1) { S.bolum = BOLUM[j + 1].id; S.i = 0; } } };
  const kararVer = (id, karar, etiketler, aciklama) => { S.k[id] = { karar, etiketler, aciklama, zaman: Date.now(), gonderildi: false }; FORM = null; ilerle(); sakla(); ciz(); window.scrollTo(0, 0); bekleyenleriGonder(); };

  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a, v = b.dataset.v;
    const L = () => sorular(BOLUM.find((x) => x.id === S.bolum)), cur = () => L()[S.i];
    if (a === 'basla') { const ad = (document.getElementById('ad').value || '').trim(); if (!ad) { document.getElementById('ad').focus(); return; } S.ad = ad; sakla(); ciz(); }
    else if (a === 'karar') { if (v === 'uygun') kararVer(cur().id, 'uygun', [], ''); else { const k = S.k[cur().id]; FORM = { id: cur().id, karar: v, etiketler: k && k.karar === v ? (k.etiketler || []).slice() : [], aciklama: k && k.karar === v ? k.aciklama || '' : '' }; ciz(); const t = document.querySelector('.kform'); if (t) t.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }
    else if (a === 'etiket') { const i = FORM.etiketler.indexOf(v); if (i >= 0) FORM.etiketler.splice(i, 1); else FORM.etiketler.push(v); FORM.aciklama = document.getElementById('acik').value; ciz(); }
    else if (a === 'vazgec') { FORM = null; ciz(); }
    else if (a === 'kaydet') { FORM.aciklama = document.getElementById('acik').value.trim(); kararVer(FORM.id, FORM.karar, FORM.etiketler, FORM.aciklama); }
    else if (a === 'geri') { S.i--; FORM = null; sakla(); ciz(); window.scrollTo(0, 0); }
    else if (a === 'ileri') { S.i++; FORM = null; sakla(); ciz(); window.scrollTo(0, 0); }
    else if (a === 'ozet') { S.ozet = true; sakla(); ciz(); window.scrollTo(0, 0); }
    else if (a === 'ozet-kapat') { S.ozet = false; sakla(); ciz(); }
    else if (a === 'git') { S.bolum = v; S.i = 0; S.ozet = false; sakla(); ciz(); window.scrollTo(0, 0); }
    else if (a === 'soruya') { for (const x of BOLUM) { const j = sorular(x).findIndex((it) => it.id === v); if (j >= 0) { S.bolum = x.id; S.i = j; } } S.ozet = false; sakla(); ciz(); window.scrollTo(0, 0); }
  });
  el.addEventListener('change', (ev) => { if (ev.target.id === 'bolum') { S.bolum = ev.target.value; S.i = 0; FORM = null; sakla(); ciz(); } });
  el.addEventListener('input', (ev) => { if (ev.target.id === 'acik' && FORM) { FORM.aciklama = ev.target.value; const k = el.querySelector('[data-a=kaydet]'); if (k) k.disabled = !(FORM.etiketler.length || FORM.aciklama.trim()); } });
  addEventListener('online', bekleyenleriGonder);

  let GECERLI = null; ciz();
  if (KOD && CFG.supabaseUrl) rpc('inceleme_kod_gecerli', { p_kod: KOD }).then((ok) => { GECERLI = ok === true; ciz();
    if (GECERLI) rpc('inceleme_listesi', { p_kod: KOD }).then((rows) => { (rows || []).forEach((r) => { if (!S.k[r.soru_id]) S.k[r.soru_id] = { karar: r.karar, etiketler: r.etiketler || [], aciklama: r.aciklama || '', zaman: Date.parse(r.zaman), gonderildi: true }; }); sakla(); ciz(); bekleyenleriGonder(); }).catch(() => { }); })
    .catch(() => { GECERLI = true; MESAJ = '⚠️ Sunucuya ulaşılamadı. Kararlarınız cihazınızda saklanıyor; internet gelince gönderilecek.'; ciz(); });
  G.MY_OGRETMEN = { BOLUM, sorular, TOPLAM, durum: () => S };
})();
