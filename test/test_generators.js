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
      for (const m of q.inputMis||[]) { if (!MIS[m.mis]) { console.log('UNKNOWN MIS', name, m.mis); errors++; } }
    } else {
      const ok = q.options.filter(o=>o.ok).length, texts = q.options.map(o=>o.t);
      if (ok!==1 || q.options.length<2 || new Set(texts).size!==texts.length) { console.log('BAD OPTS', name, lv, strip(q.prompt), texts, ok); errors++; break; }
      for (const o of q.options) if (!o.ok && !MIS[o.mis]) { console.log('UNKNOWN MIS', name, o.mis); errors++; break; }
      if (q.options.length < 3 && q.type==='mc') { samples['few_'+name+lv]=texts; }
    }
    if (r===0) samples[name+'_'+lv] = { p: strip(q.prompt).replace(/\s+/g,' ').slice(0,170), a: q.type==='input'? q.answer : strip(q.options.find(o=>o.ok).t).trim(), o: q.options? q.options.map(o=>strip(o.t).replace(/\s+/g,' ').trim()).join(' | '):'' };
  }
}
// Pi'nin soru okuması: her soru metni sunucunun izinli sözlüğünde olmalı (yoksa o soru robot sesle okunur)
{ const SZ = new Set(JSON.parse(require('fs').readFileSync(__dirname + '/../sunucu/supabase/functions/soru-sesi/sozluk.ts', 'utf8').match(/new Set\((\[.*\])\)/)[1]));
  const eksik = new Set(); let uzun = 0;
  for (const g of Object.values(GEN)) for (const lv of [1, 2, 3]) for (let r = 0; r < 200; r++) { const m = U.soruSesi(g(lv).prompt); if (m.length > 260 || !/^[ !"'(),.0-9:?A-Za-zÇÖÜçöüĞğİıŞşâîû-]+$/.test(m)) uzun++; (m.toLocaleLowerCase('tr-TR').match(/[a-zçğıöşüâîû]+/g) || []).forEach(w => { if (!SZ.has(w)) eksik.add(w); }); }
  if (eksik.size > 3 || uzun) { console.log('SORU SESİ SÖZLÜĞÜ ESKİ: node tools/soru_sozluk.js çalıştır ve soru-sesi fonksiyonunu yeniden yükle.', [...eksik].slice(0, 10), 'uygunsuz metin:', uzun); errors++; }
  else if (eksik.size) console.log('Uyarı: sözlükte olmayan nadir kelime(ler):', [...eksik]); }
console.log(`\nToplam ${total} soru üretildi, hata: ${errors}`);
console.log('Beceri sayısı:', Object.keys(GEN).length, '· parmakla kesir sorusu:', kesN);
for (const [k,v] of Object.entries(samples)) console.log(k, JSON.stringify(v));
process.exit(errors?1:0);
