// Seslendirilecek tüm metinleri tek listede toplar → data/seslendirme.json
// Kullanım: node tools/ses_listesi.js
const { U } = require('../src/core.js');
const PI = require('../src/voice.js');
const { SKILLS } = require('../src/curriculum.js');
const { MIS } = require('../src/generators.js');
const items = [];
for (const [g, arr] of Object.entries(PI)) arr.forEach((t, i) => items.push({ key: `pi_${g}_${i + 1}`, grup: 'pi', text: t }));
for (const s of SKILLS) {
  const c = s.cards;
  items.push({ key: `kart_${s.id}_gorsel`, grup: 'kart', text: U.toSpeech(c.gorsel.text) });
  items.push({ key: `kart_${s.id}_hikaye`, grup: 'kart', text: U.toSpeech(c.hikaye) });
  items.push({ key: `kart_${s.id}_adim`, grup: 'kart', text: U.toSpeech(c.adim.join('. ')) });
  items.push({ key: `kart_${s.id}_kural`, grup: 'kart', text: U.toSpeech(c.kural) });
}
for (const [k, v] of Object.entries(MIS)) if (k !== 'genel') items.push({ key: `mis_${k}`, grup: 'yanilgi', text: U.toSpeech(v.t + '. ' + v.fix) });
// Sunucu deposu yalnızca Latin harfli dosya adı kabul eder; Türkçe harfli anahtar kredi yakar ama kaydedilemez.
const bozuk = items.filter(x => !/^[a-z0-9_]+$/.test(x.key)); if (bozuk.length) { console.error('Latin dışı ses anahtarı:', bozuk.map(x => x.key).join(', ')); process.exit(1); }
const chars = items.reduce((a, x) => a + x.text.length, 0);
require('fs').writeFileSync(__dirname + '/../data/seslendirme.json', JSON.stringify({ ses: { ad: 'Pi', voice_id: 'Hr3W7yWIljG9YBJn39oK', ses_adi: 'Gamze - Cartoon Character (ElevenLabs kütüphanesi)' }, toplam_karakter: chars, kayitlar: items }, null, 1));
console.log(`${items.length} kayıt, ${chars} karakter → data/seslendirme.json`);
