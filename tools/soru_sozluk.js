// Pi'nin soru okuması için izinli kelime sözlüğü (güvenlik: sunucu yalnızca uygulamanın gerçekten üretebileceği
// kelimelerden oluşan metni seslendirir; böylece kimse Pi'nin sesine keyfî bir cümle söyletemez).
// Üreticiler değişince yeniden çalıştır:  node tools/soru_sozluk.js  → functions/soru-sesi/sozluk.ts
const fs = require('fs'), path = require('path');
const { GEN, HATA, ATOLYE } = require('../src/generators.js'); const { U } = require('../src/core.js');
const kel = new Set(); let n = 0;
const ekle = (s) => { for (const w of U.soruSesi(s).toLocaleLowerCase('tr-TR').match(/[a-zçğıöşüâîû]+/g) || []) kel.add(w); };
// Şıklar da ("Pi şıkları da okusun" ayarı): karşılaştırma işaretleri ve kim haklı dışındakiler
const sik = (q) => { if (q.options && !['cmp', 'tf'].includes(q.type)) for (const o of q.options) for (const w of U.sikSesi(o.t).toLocaleLowerCase('tr-TR').match(/[a-zçğıöşüâîû]+/g) || []) kel.add(w); };
for (const g of Object.values(GEN)) for (const lv of [1, 2, 3]) for (let i = 0; i < 1500; i++) { const q = g(lv); ekle(q.prompt); sik(q); n++; }
// Hata Avcısı ve Problem Atölyesi metinleri (normal derste seyrek geldikleri için ayrıca örneklenir)
for (const id of HATA.ids) for (const lv of [2, 3]) for (const tur of ['bul', 'kim', 'neden']) for (let i = 0; i < 300; i++) { const q = HATA.q(id, lv, tur); ekle(q.prompt); sik(q); n++; }
for (const id of ATOLYE.ids) for (let i = 0; i < 1500; i++) for (const q of ATOLYE.sorular(id)) { ekle(q.okuma || q.prompt); sik(q); n++; }
// Sayı okunuşları (her sayı ve kesir için gereken kelimeler)
for (const w of ['sıfır','bir','iki','üç','dört','beş','altı','yedi','sekiz','dokuz','on','yirmi','otuz','kırk','elli','altmış','yetmiş','seksen','doksan','yüz','bin','milyon','milyar','kaç']) kel.add(w);
for (let d = 1; d <= 1000; d++) ekle(U.words(d) + U.ek(U.lastWord(d), 'de'));
const liste = [...kel].sort();
const cikti = `// OTOMATİK ÜRETİLDİ: node tools/soru_sozluk.js (${new Date().toISOString().slice(0, 10)}, ${n} soru örneği)\nexport const SOZLUK = new Set(${JSON.stringify(liste)});\n`;
fs.writeFileSync(path.join(__dirname, '../sunucu/supabase/functions/soru-sesi/sozluk.ts'), cikti);
console.log('kelime:', liste.length, 'bayt:', cikti.length);
