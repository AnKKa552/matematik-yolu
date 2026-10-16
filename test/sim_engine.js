// Uyarlanabilir motor simülasyonu: farklı "çiçek" öğrenci tipleri
global.localStorage = { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; }, removeItem(k) { delete this._s[k]; } };
const E = require('../src/engine.js');
function student(name, pTrue, learnRate, favFormat) {
  const st = E.fresh(); let know = pTrue; const log = [];
  for (let lesson = 0; lesson < 6; lesson++) {
    const ses = E.newSession(st, 'lesson', 'f_karsilastir');
    if (ses.format) { // öğrenci sadece kendi biçiminde iyi anlıyor
      if (ses.format === favFormat) know = Math.min(0.95, know + 0.15);
    }
    let guard = 0;
    while ((ses.i < ses.len || ses.lastWrong) && guard++ < 40) {
      const q = E.nextQ(st, ses);
      const pCorrect = Math.min(0.97, know * (q.level === 3 ? 0.85 : q.level === 2 ? 0.95 : 1.05));
      const ok = Math.random() < pCorrect;
      E.record(st, ses, q, { ok, mis: ok ? null : 'payda_buyuk' }, 8000, false);
      know = Math.min(0.97, know + learnRate * (ok ? 0.3 : 1)); // hatadan daha çok öğrenir (telafi + açıklama)
    }
    E.finish(st, ses);
    log.push(`D${lesson + 1}: pL=${st.skills.f_karsilastir.pL.toFixed(2)} seviye~${E.levelFor(st, 'f_karsilastir')} acc=${(ses.correct / ses.answered.length * 100).toFixed(0)}%`);
  }
  const fr = E.formatRank(st).map(f => `${f.f}:${f.m.toFixed(2)}`).join(' ');
  console.log(`\n${name} (başlangıç ${pTrue}, hız ${learnRate}, sevdiği anlatım ${favFormat})\n  ${log.join('\n  ')}\n  bandit: ${fr}`);
}
student('Hızlı öğrenen Defne', 0.6, 0.02, 'kural');
student('Zorlanan Mert', 0.25, 0.015, 'gorsel');
student('Ortalama Zeynep', 0.45, 0.01, 'hikaye');
// Bandit tek başına: 40 deneme, gerçekte 'gorsel' en iyi
const st = E.fresh(); const truth = { gorsel: .8, hikaye: .5, adim: .55, kural: .4 }; const picks = {};
for (let i = 0; i < 60; i++) { const f = E.pickFormat(st); picks[f] = (picks[f] || 0) + 1; E.rewardFormat(st, f, Math.random() < truth[f] ? 1 : 0); }
console.log('\nBandit 60 deneme seçimleri (gerçek en iyi: görsel):', picks);
