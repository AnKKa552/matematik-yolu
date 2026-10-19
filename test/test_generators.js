const { U } = require('../src/core.js');
const { GEN, MIS, KES_CHECK } = require('../src/generators.js');
let kesN = 0;
let errors = 0, total = 0; const samples = {};
const strip = (s) => String(s).replace(/<[^>]+>/g, ' ');
// bağımsız sözcük→sayı çözücü (U.words doğrulaması)
const W = { 'sıfır':0,'bir':1,'iki':2,'üç':3,'dört':4,'beş':5,'altı':6,'yedi':7,'sekiz':8,'dokuz':9,'on':10,'yirmi':20,'otuz':30,'kırk':40,'elli':50,'altmış':60,'yetmiş':70,'seksen':80,'doksan':90 };
function parse(s){ let total=0, cur=0; for(const w of s.toLowerCase().split(/\s+/)){ if(w in W) cur+=W[w]; else if(w==='yüz') cur=(cur||1)*100; else if(w==='bin'){ total+=(cur||1)*1000; cur=0;} else if(w==='milyon'){ total+=cur*1e6; cur=0;} else if(w==='milyar'){ total+=cur*1e9; cur=0;} else throw new Error('bilinmeyen '+w);} return total+cur; }
for (let i=0;i<20000;i++){ const n=Math.floor(Math.random()*1e12); if(parse(U.words(n))!==n){ console.log('WORDS FAIL',n,U.words(n)); errors++; break; } }
for (const k of [0,1,10,100,1000,1001,1000000,1000000000,908083653928]) if (parse(U.words(k))!==k) { console.log('WORDS FAIL',k); errors++; }
console.log('örnek:', U.words(908083653928));
for (const [name, g] of Object.entries(GEN)) {
  for (const lv of [1,2,3]) for (let r=0;r<600;r++) {
    total++; let q;
    try { q = g(lv); } catch (e) { console.log('EXC', name, lv, e.message); errors++; break; }
    const txt = JSON.stringify(q);
    if (/undefined|NaN|Infinity|null/.test(strip(q.prompt)+JSON.stringify(q.options||[])+(q.answer||'')+JSON.stringify(q.steps))) { console.log('BAD TEXT', name, lv, strip(q.prompt), JSON.stringify(q.options), q.answer, q.steps); errors++; break; }
    if (q.type === 'match') {
      const A = q.pairs.map(p => p.a), B = q.pairs.map(p => p.b);
      if (q.pairs.length < 3 || new Set(A).size !== A.length || new Set(B).size !== B.length || !MIS[q.mis]) { console.log('BAD MATCH', name, lv, A, B); errors++; break; }
      continue;
    }
    if (q.type === 'kes') {
      kesN++; const [n, d] = q.hedef || [];
      const bad = (m) => { console.log('BAD KES', name, lv, m, JSON.stringify(q)); errors++; };
      if (!['pie', 'bar', 'line'].includes(q.model) || !(n >= 1 && d >= 2) || !q.cevap) { bad('alan'); break; }
      if (q.model === 'line') {
        if (n > d * q.ust || q.parca !== d) { bad('doğru'); break; }
        if (!KES_CHECK(q, { konum: n }).ok) { bad('doğru cevap kabul edilmedi'); break; }
        for (let k = 0; k <= d * q.ust; k++) { const r = KES_CHECK(q, { konum: k }); if (k !== n && (r.ok || !MIS[r.mis])) { bad('yanlış konum ' + k); break; } }
      } else {
        const P = q.parca || d; if (P < 2 || P > 12 || n >= d) { bad('parça'); break; }
        const nb = n * P / d; if (!Number.isInteger(nb) || !KES_CHECK(q, { parca: P, boyali: nb }).ok) { bad('doğru cevap kabul edilmedi'); break; }
        for (let pp = q.parca ? P : 1; pp <= (q.parca ? P : 12); pp++) for (let b = 0; b <= pp; b++) { const r = KES_CHECK(q, { parca: pp, boyali: b }); const want = q.denk ? b * d === n * pp : (pp === d && b === n); if (r.ok !== want || (!r.ok && !MIS[r.mis])) { bad(`değerlendirme ${pp}/${b}`); break; } }
      }
      if (r === 0) samples[name + '_kes_' + lv] = { p: strip(q.prompt).replace(/\s+/g, ' '), a: strip(q.cevap) };
      continue;
    }
    if (q.type === 'input') {
      if (q.answer === undefined || isNaN(parseFloat(String(q.answer).replace(',','.')))) { console.log('BAD ANSWER', name, lv, q.answer); errors++; break; }
      for (const m of q.inputMis||[]) { if (q.answer !== undefined && Number(String(m.v).replace(',', '.')) === Number(String(q.answer).replace(',', '.'))) { console.log('YANILGI = DOĞRU CEVAP', name, lv, strip(q.prompt), m.v); errors++; } if (!MIS[m.mis]) { console.log('UNKNOWN MIS', name, m.mis); errors++; } if (m.mis === 'genel') { console.log('GENEL ETİKET (§1-3: her yanlış bir yanılgıya bağlı olmalı)', name, lv, m.v); errors++; break; } }
    } else {
      const ok = q.options.filter(o=>o.ok).length, texts = q.options.map(o=>o.t);
      if (ok!==1 || q.options.length<2 || new Set(texts).size!==texts.length) { console.log('BAD OPTS', name, lv, strip(q.prompt), texts, ok); errors++; break; }
      for (const o of q.options) if (!o.ok && (!MIS[o.mis] || o.mis === 'genel')) { console.log(o.mis === 'genel' ? 'GENEL ETİKET (§1-3: her yanlış bir yanılgıya bağlı olmalı)' : 'UNKNOWN MIS', name, lv, strip(o.t)); errors++; break; }
      if (q.type === 'mc' && q.options.length < 3) samples['iki_sikli_' + name + lv] = texts;
      if (q.options.length < 3 && q.type==='mc') { samples['few_'+name+lv]=texts; }
    }
    if (r===0) samples[name+'_'+lv] = { p: strip(q.prompt).replace(/\s+/g,' ').slice(0,170), a: q.type==='input'? q.answer : strip(q.options.find(o=>o.ok).t).trim(), o: q.options? q.options.map(o=>strip(o.t).replace(/\s+/g,' ').trim()).join(' | '):'' };
  }
}

// HATA AVCISI: senaryo bütünlüğü + adımlardaki her işlemin bağımsız hesabı + üç soru biçimi
const { HATA } = require('../src/generators.js');
const SKILLS_OK = (id) => id in GEN;
{ const NUM = '(?:\\d{1,3}(?: \\d{3})+|\\d+(?:,\\d+)?)';
  const RE = new RegExp(`(${NUM}(?:\\s*[+−×÷]\\s*${NUM})+)\\s*=\\s*(${NUM})(?![\\d,])`, 'g');
  const val = (t) => parseFloat(t.replace(/ /g, '').replace(',', '.'));
  // Parantezli ifade değerlendirici (yalnız sayı, + − × ÷ ve parantez)
  const ifade = (t) => { const x = strip(t).replace(/[\u00a0\u202f\u2009]/g, ' ').replace(/(\d) (?=\d{3}\b)/g, '$1').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-'); return /^[\d\s+\-*/().]+$/.test(x) ? Function('return ' + x)() : null; };
  const hesap = (line) => { const L = strip(line).replace(/[\u00a0\u202f\u2009]/g, ' '); let m, bad = null; RE.lastIndex = 0;
    while ((m = RE.exec(L))) { const ex = m[1].replace(new RegExp(NUM, 'g'), (x) => String(val(x))).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
      const r = Function('return ' + ex)(); if (Math.abs(r - val(m[2])) > 1e-9) bad = m[0]; } return bad; };
  let hn = 0;
  for (const id of HATA.ids) for (const lv of [1, 2, 3]) for (let r = 0; r < 400; r++) {
    const sc = HATA.SEN[id](lv); hn++;
    const bad = (m) => { console.log('BAD HATA', id, lv, m, JSON.stringify(sc).slice(0, 400)); errors++; };
    if (!sc.dogru.length || sc.dogru.length > 3 || !sc.hatalar.length || !sc.sonuc) { bad('yapı'); break; }
    let stop = false;
    for (const l of sc.dogru) { const b = hesap(l); if (b) { bad('doğru adımda işlem hatası: ' + b); stop = true; break; } }
    for (const h of sc.hatalar) {
      if (!MIS[h.mis] || h.satirlar.length !== sc.dogru.length || h.at < 0 || h.at >= sc.dogru.length) { bad('hatalı çözüm yapısı'); stop = true; break; }
      for (let i = 0; i < h.at; i++) if (h.satirlar[i] !== sc.dogru[i]) { bad('hatalı adımdan önceki satır farklı'); stop = true; }
      if (h.satirlar[h.at] === sc.dogru[h.at] || h.sonuc === sc.sonuc) { bad('hata görünmüyor / sonuç aynı'); stop = true; }
      for (const l of h.satirlar) { const b = hesap(l); if (b) { bad('hatalı çözümde aritmetik bozuk (yanılgı kavramsal olmalı): ' + b); stop = true; } }
    }
    for (const m of sc.yakin) if (!MIS[m]) { bad('bilinmeyen yakın yanılgı ' + m); stop = true; }
    if (/undefined|NaN|Infinity/.test(JSON.stringify(sc))) { bad('metin'); stop = true; }
    if (stop) break;
  }
  for (const id of HATA.ids) for (const lv of [2, 3]) for (const tur of ['bul', 'kim', 'neden']) for (let r = 0; r < 150; r++) {
    const q = HATA.q(id, lv, tur), ok = q.options.filter(o => o.ok).length, texts = q.options.map(o => o.t);
    if (ok !== 1 || q.options.length < 2 || new Set(texts).size !== texts.length || q.options.some(o => !o.ok && !MIS[o.mis]) || /undefined|NaN/.test(strip(q.prompt) + texts.join() + JSON.stringify(q.steps) + JSON.stringify(q.defter || ''))) { console.log('BAD HATA Q', id, lv, tur, texts); errors++; break; }
    const m = U.soruSesi(q.prompt); if (m.length > 260 || !/^[ !"'(),.0-9:?A-Za-zÇÖÜçöüĞğİıŞşâîû-]+$/.test(m)) { console.log('HATA Q SES METNİ', id, tur, m.length, m); errors++; break; }
    if (r === 0 && lv === 3) samples['hata_' + id + '_' + tur] = { p: strip(q.prompt).replace(/\s+/g, ' ').slice(0, 150), a: strip(q.options.find(o => o.ok).t).replace(/\s+/g, ' ').trim() };
  }
  console.log('Hata Avcısı senaryosu:', hn, '· beceri:', HATA.ids.length);

  // PROBLEM ATÖLYESİ: her şablon 400 kez; şık/sayı kuralları + adımlardaki her işlemin bağımsız hesabı + kontrol şıklarının doğruluğu
  { const { ATOLYE } = require('../src/generators.js'); let an = 0;
    for (const id of ATOLYE.ids) for (let r = 0; r < 400; r++) {
      const L = ATOLYE.sorular(id), bad = (m, q) => { console.log('BAD ATÖLYE', id, m, q ? strip(q.prompt) : ''); errors++; };
      const sonIki = L[L.length - 2].atolye.asama, kIdx = L.findIndex(q => q.atolye.asama === 'kontrol');
      if (L.length < 5 || L[0].atolye.asama !== 'anla' || !['kontrol', 'derin'].includes(sonIki) || kIdx < 0 || L[L.length - 1].atolye.asama !== 'bagimsiz' || !SKILLS_OK(L[0].skill) || L.filter(q => q.atolye.sonCoz).length !== 1) { bad('yapı'); break; }
      let stop = false;
      for (const q of L) { an++;
        if (/undefined|NaN|Infinity/.test(strip(q.prompt) + JSON.stringify(q.options || '') + (q.answer || '') + JSON.stringify(q.steps) + strip(q.atolye.baglam))) { bad('metin', q); stop = true; break; }
        if (!q.ip || /undefined|NaN/.test(q.ip)) { bad('ipucu yok', q); stop = true; break; }
        if (q.type === 'tablo') { // Anla tablosu: doğru yerleşim kabul edilir; tek satırın her yanlış yerleşimi bilinen yanılgı + açıklama verir
          const d = q.satirlar.map(r => r.d); if (d.filter(x => x === 's').length !== 1 || !d.includes('a') || !d.includes('v') || !ATOLYE.tabloKontrol(q, d).ok) { bad('tablo yapısı', q); stop = true; break; }
          for (let i = 0; i < d.length && !stop; i++) for (const w of ['v', 'a', 's']) if (w !== d[i]) { const a = d.slice(); a[i] = w; const r = ATOLYE.tabloKontrol(q, a); if (r.ok || !MIS[r.mis] || !r.ac || !(r.yanlisSatir || []).includes(i)) { bad('tablo yanlış yerleşim', q); stop = true; break; } }
          if (stop) break; continue;
        }
        if (q.type === 'kur') { // Kartlarla işlem: örnek işlem kartlarla kurulabilmeli ve kabul edilmeli; her iki kartlık işlem ya doğru ya da bilinen yanılgı
          const kul = new Set(), tok = ATOLYE.ifadeParcala(q.ornek).map(x => { if (!/\d/.test(x)) return x; const v = parseFloat(x.replace(',', '.')), j = q.kartlar.findIndex((c, k) => c === v && !kul.has(k)); kul.add(j); return j < 0 ? 'YOK' : 'n' + j; });
          if (tok.includes('YOK') || !ATOLYE.kurKontrol(q, tok).ok || Math.abs(ATOLYE.ifadeHesapla(ATOLYE.ifadeParcala(q.ornek)) - q.hedef) > 1e-9) { bad('kur örneği: ' + q.ornek, q); stop = true; break; }
          if (q.yanilgi.some(y => !MIS[y.mis] || !y.ac || Math.abs(y.v - q.hedef) < 1e-9)) { bad('kur yanılgı listesi', q); stop = true; break; }
          for (let i = 0; i < q.kartlar.length && !stop; i++) for (let j = 0; j < q.kartlar.length; j++) if (i !== j) for (const o of ['+', '−', '×', '÷']) { const r = ATOLYE.kurKontrol(q, ['n' + i, o, 'n' + j]); if (!r.ok && (!MIS[r.mis] || !r.ac || /undefined|NaN|Infinity/.test(r.ac))) { bad('kur değerlendirme', q); stop = true; break; } }
          if (ATOLYE.kurKontrol(q, ['n0']).ok || ATOLYE.kurKontrol(q, ['n0', '+', 'n0']).ok || ATOLYE.kurKontrol(q, ['(', 'n0', '+']).ok) { bad('kur geçersiz işlemi kabul etti', q); stop = true; }
          if (stop) break; continue;
        }
        const yanlislar = q.type === 'input' ? q.inputMis : q.options.filter(o => !o.ok);
        if (yanlislar.some(w => !w.ac || /undefined|NaN|Infinity/.test(w.ac))) { bad('yanlışın kendi açıklaması yok', q); stop = true; break; }
        if (q.type === 'input' && (q.ip.match(/\d+/g) || []).includes(q.answer) && !((strip(q.prompt) + ' ' + strip(q.atolye.baglam)).match(/\d+/g) || []).includes(q.answer)) { bad('ipucu cevabı söylüyor: ' + q.ip, q); stop = true; break; }
        for (const l of (q.steps || [])) { const b = hesap(l); if (b) { bad('adımda işlem hatası: ' + b, q); stop = true; } }
        if (q.type === 'input') {
          if (!(parseFloat(q.answer) >= 0)) { bad('cevap', q); stop = true; }
          for (const m of q.inputMis) if (!MIS[m.mis] || String(m.v) === q.answer) { bad('inputMis', q); stop = true; }
        } else {
          const ok = q.options.filter(o => o.ok).length, texts = q.options.map(o => o.t);
          if (ok !== 1 || q.options.length < 2 || new Set(texts).size !== texts.length || q.options.some(o => !o.ok && !MIS[o.mis])) { bad('şık', q); stop = true; }
          if (q.atolye.asama === 'kontrol' && !q.gerekce) { const b = hesap(q.options.find(o => o.ok).t); if (b) { bad('kontrol şıkkı yanlış hesap: ' + b, q); stop = true; } }
          if (q.atolye.asama === 'kontrol' && q.gerekce) { const b = hesap(strip(q.prompt)); if (b) { bad('gerekçedeki kontrol işlemi yanlış: ' + b, q); stop = true; } }
          // Derinleştir: doğru işlem cevabı vermeli, yanılgılı işlemler vermemeli (her ifade bağımsız hesaplanır)
          if (q.atolye.asama === 'derin') for (const o of q.options) { const v = ifade(o.t); if (v === null || (o.ok ? Math.abs(v - q.derinCevap) > 1e-9 : Math.abs(v - q.derinCevap) < 1e-9)) { bad('derinleştir ifadesi: ' + o.t + ' = ' + v, q); stop = true; } }
          // Tahmin: doğru aralık cevabı içermeli, yanlış aralıklar içermemeli; sınırlar sıralı
          if (q.atolye.asama === 'tahmin') { const v = q.tahminDeger; for (const o of q.options) { const t = o.t.replace(/\u00a0|\u202f/g, ' '), sayi = (t.match(/\d{1,3}(?: \d{3})*|\d+/g) || []).map(x => +x.replace(/ /g, ''));
              const icinde = /arası/.test(t) ? v > sayi[0] && v < sayi[1] : / az$/.test(t) ? v < sayi[0] : v > sayi[0];
              if (icinde !== !!o.ok || (/arası/.test(t) && !(sayi[0] < sayi[1]))) { bad('tahmin aralığı: ' + t + ' / cevap ' + v, q); stop = true; } } }
        }
        const m = U.soruSesi(q.okuma || q.prompt); if (m.length > 260 || !/^[ !"'(),.0-9:?A-Za-zÇÖÜçöüĞğİıŞşâîû-]+$/.test(m)) { bad('ses metni (' + m.length + '): ' + m, q); stop = true; }
        if (stop) break;
      }
      if (stop) break;
      if (r === 0) samples['atolye_' + id] = { b: strip(L[0].atolye.baglam).replace(/\s+/g, ' ').slice(0, 200), adim: L.map(q => strip(q.prompt).replace(/\s+/g, ' ') + ' → ' + (q.type === 'input' ? q.answer : q.type === 'kur' ? q.ornek : q.type === 'tablo' ? 'tablo' : strip(q.options.find(o => o.ok).t).trim())).join(' | ') };
    }
    console.log('Problem Atölyesi soru adımı:', an, '· şablon:', ATOLYE.ids.length);
  }
}
// Pi'nin soru okuması: her soru metni sunucunun izinli sözlüğünde olmalı (yoksa o soru robot sesle okunur)
{ const SZ = new Set(JSON.parse(require('fs').readFileSync(__dirname + '/../sunucu/supabase/functions/soru-sesi/sozluk.ts', 'utf8').match(/new Set\((\[.*\])\)/)[1]));
  const eksik = new Set(); let uzun = 0;
  for (const g of Object.values(GEN)) for (const lv of [1, 2, 3]) for (let r = 0; r < 200; r++) { const m = U.soruSesi(g(lv).prompt); if (m.length > 260 || !/^[ !"'(),.0-9:?A-Za-zÇÖÜçöüĞğİıŞşâîû-]+$/.test(m)) uzun++; (m.toLocaleLowerCase('tr-TR').match(/[a-zçğıöşüâîû]+/g) || []).forEach(w => { if (!SZ.has(w)) eksik.add(w); }); }
  { const { ATOLYE } = require('../src/generators.js'); for (const id of ATOLYE.ids) for (let r = 0; r < 100; r++) for (const q of ATOLYE.sorular(id)) (U.soruSesi(q.okuma || q.prompt).toLocaleLowerCase('tr-TR').match(/[a-zçğıöşüâîû]+/g) || []).forEach(w => { if (!SZ.has(w)) eksik.add(w); }); }
  if (eksik.size > 3 || uzun) { console.log('SORU SESİ SÖZLÜĞÜ ESKİ: node tools/soru_sozluk.js çalıştır ve soru-sesi fonksiyonunu yeniden yükle.', [...eksik].slice(0, 10), 'uygunsuz metin:', uzun); errors++; }
  else if (eksik.size) console.log('Uyarı: sözlükte olmayan nadir kelime(ler):', [...eksik]); }
console.log(`\nToplam ${total} soru üretildi, hata: ${errors}`);
console.log('Beceri sayısı:', Object.keys(GEN).length, '· parmakla kesir sorusu:', kesN);
for (const [k,v] of Object.entries(samples)) console.log(k, JSON.stringify(v));
process.exit(errors?1:0);
