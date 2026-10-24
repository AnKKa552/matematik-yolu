// Kişisel plan testleri (24.10.2026): okul takvimi, ön bilgi yoklaması, haftalık plan, veli raporu. Çalıştır: node test/test_plan.js
const E = require('../src/engine.js');
const ok = (c, m) => { if (!c) { console.log('HATA:', m); process.exitCode = 1; } else console.log('✓', m); };
const T = (s) => new Date(s + 'T12:00:00').getTime();
// Okul takvimi
ok(E.okulHafta(T('2026-10-24')).sk[0] === 'g_cokgen', '24 Ekim → Çokgenler');
ok(E.okulHafta(T('2026-11-18')).tatil === 'Ara tatil' && E.okulHafta(T('2026-11-18')).sk[0] === 'n_okuma', 'Ara tatilde son konu sürer');
ok(E.okulHafta(T('2027-03-16')).sk[0] === 'f_karsilastir', 'Mart ortası → kesir karşılaştırma');
ok(E.okulHafta(T('2026-09-01')) === null && E.okulHafta(T('2027-08-01')) === null, 'Okul dışı → yok');
let st = E.fresh(); st.profile = { name: 'Deniz' };
ok(E.okulKonusu(st, T('2026-10-24')).kaynak === 'takvim', 'Varsayılan takvim');
st.okul = { mod: 'elle', sk: 'n_carpbol' }; ok(E.okulKonusu(st).sk[0] === 'n_carpbol', 'Elle seçim');
ok(E.okulGeride(st).includes('n_okuma') && !E.okulGeride(st).includes('n_carpbol'), 'Elle seçimde öncekiler geride');
st.okul = { mod: 'kapali' }; ok(E.okulKonusu(st) === null, 'Kapalı');
st.okul = { mod: 'takvim' };
// Temel yoklaması: çarpması zayıf çocuk, denk kesirde zorlanıyor
st.skills.f_tur.pL = 0.9; st.skills.f_tur.n = 10; st.skills.f_tur.recent = [1,1,1,1,1,1,1,1,1,1];
ok(E.temelAday(st, 'f_denk') === 'n_carpbol', 'Aday: hiç ölçülmemiş çarpma (kesir türleri sağlam)');
const ses = E.newSession(st, 'lesson', 'f_denk');
const yanlis = (q) => E.record(st, ses, q, { ok: false, mis: 'genel' }, 9000, false, 'cozum');
let q = E.nextQ(st, ses); yanlis(q);                       // 1. çözüm
q = E.nextQ(st, ses); ok(q.rescue, 'Telafi geliyor'); E.record(st, ses, q, { ok: true }, 5000, false, 'ilk');
q = E.nextQ(st, ses); ok(!q.temel, 'Tek hatada yoklama yok'); yanlis(q); // 2. çözüm → tetik
ok(ses.temelKontrol && ses.temelKontrol.pre === 'n_carpbol', 'İkinci hatada yoklama tetiklendi');
q = E.nextQ(st, ses); ok(q.rescue, 'Önce telafi'); E.record(st, ses, q, { ok: true }, 5000, false, 'ilk');
const i0 = ses.i;
q = E.nextQ(st, ses); ok(q.temel && q.skill === 'n_carpbol' && q.level === 1, 'Yoklama sorusu 1: çarpma, seviye 1');
E.record(st, ses, q, { ok: false, mis: 'genel' }, 9000, false, 'cozum'); ok(!ses.lastWrong, 'Yoklamada yanlış telafi doğurmaz');
q = E.nextQ(st, ses); ok(q.temel && q.temel.sira === 2, 'Yoklama sorusu 2'); E.record(st, ses, q, { ok: true }, 5000, false, 'ilk');
ok(ses.i === i0, 'Yoklama ders sayacını ilerletmez');
ok(ses.temelKontrol.sonuc === 'eksik' && st.temel.f_denk.n_carpbol.sonuc === 'eksik', 'Sonuç: temel eksik');
q = E.nextQ(st, ses); ok(!q.temel, 'Yoklama bir kez'); 
ok(E.temelEksikler(st)[0].pre === 'n_carpbol', 'Eksikler listesinde');
// Plan
st.plan = null; const P = E.haftalikPlan(st, T('2026-10-24'));
console.log(P.liste.map(h => h.tip + ':' + (h.sk || h.hedef)).join(' | '));
ok(P.liste.some(h => h.tip === 'temel' && h.sk === 'n_carpbol'), 'Planda temel hedefi');
ok(P.liste[P.liste.length - 1].tip === 'gun', 'Planda gün hedefi');
const R = E.parentReport(st); ok(/Ön bilgi kontrolü/.test(R.text) && /Bu haftanın planı/.test(R.text), 'Veli raporunda');
console.log(R.text.split('\n').filter(l => /🏫|🧱|📋|📌|Öneri/.test(l)).join('\n'));
// Sağlam temel: 14 gün yeniden yoklanmaz
st.temel.f_denk.n_carpbol = { sonuc: 'saglam', at: Date.now() }; ok(E.temelAday(st, 'f_denk') === null || E.temelAday(st, 'f_denk') !== 'n_carpbol', 'Sağlam temel 14 gün yoklanmaz');
