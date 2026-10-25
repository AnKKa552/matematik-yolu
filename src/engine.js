/* ============================================================
   Matematik Yolu — Öğrenen Modeli (uyarlanabilir motor)
   1) BKT  : her beceri için ustalık olasılığı pL
   2) HLR  : yarı ömürlü aralıklı tekrar (unutma eğrisi)
   3) Bandit: hangi anlatım biçimi BU öğrenciye işliyor (Thompson)
   4) Yanılgı defteri: hangi kavram yanılgısı aktif, çözüldü mü
   5) Davranış profili: hız, ipucu bağımlılığı, hatadan dönüş gücü
   ============================================================ */
(function (G) {
  'use strict';
  const isNode = typeof module !== 'undefined';
  const { GEN, MIS, KES_CHECK, OLC_CHECK, GRAF_CHECK, HATA, ATOLYE } = isNode ? require('./generators.js') : { GEN: G.MY_GEN, MIS: G.MY_MIS, KES_CHECK: G.MY_KES, OLC_CHECK: G.MY_OLC, GRAF_CHECK: G.MY_GRAF, HATA: G.MY_HATA, ATOLYE: G.MY_ATOLYE };
  const { SKILLS, SKILL, THEMES, FORMATS, OKUL_TAKVIM, OKUL_YIL } = isNode ? require('./curriculum.js') : G.MY_CUR;
  const U = isNode ? require('./core.js').U : G.MY_U;

  const KEY = 'matematik_yolu_v1';
  const HOUR = 3600e3, DAY = 24 * HOUR;
  const today = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const weekStart = (t = Date.now()) => { const d = new Date(t); const wd = (d.getDay() + 6) % 7; d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - wd); return d.getTime(); };

  function fresh() {
    const skills = {}; SKILLS.forEach(s => { skills[s.id] = { pL: 0.1, n: 0, ok: 0, last: 0, half: 24, lessons: 0, recent: [] }; });
    const formats = {}; Object.keys(FORMATS).forEach(f => { formats[f] = { a: 1, b: 1, shown: 0 }; });
    return {
      v: 1, profile: null, skills, formats, mis: {}, mistakes: [], times: [], hints: { used: 0, q: 0 }, rescue: { tries: 0, ok: 0 },
      xp: 0, gems: 20, streak: 0, lastDay: null, freezes: 1, dailyGoal: 50, days: {}, week: { start: weekStart(), xp: 0 }, league: { tier: 0 },
      badges: [], sessions: [], speedBest: 0, themesTried: [], settings: { sound: true, voice: true }, placementDone: false,
      quests: { day: null, prog: {}, claimed: [] }, atolye: { anla: { n: 0, ok: 0 }, plan: { n: 0, ok: 0 }, tahmin: { n: 0, ok: 0 }, coz: { n: 0, ok: 0 }, kontrol: { n: 0, ok: 0 }, derin: { n: 0, ok: 0 }, bagimsiz: { n: 0, ok: 0 }, problem: 0 }, kanit: { ilk: 0, ipucu: 0, cozum: 0 }, month: { key: null, done: 0, claimed: false }, trophies: {}, tasks: {}, top3: 0,
    };
  }
  const E = {};
  E.load = () => { try { const raw = localStorage.getItem(KEY); if (raw) { const s = JSON.parse(raw); const f = fresh(); for (const k in f) if (!(k in s)) s[k] = f[k]; SKILLS.forEach(sk => { if (!s.skills[sk.id]) s.skills[sk.id] = f.skills[sk.id]; }); return s; } } catch (e) { } return fresh(); };
  E.save = (st) => { st.savedAt = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } };
  E.reset = () => { try { localStorage.removeItem(KEY); } catch (e) { } return fresh(); };
  E.fresh = fresh;

  /* ---------------- 1) BKT ---------------- */
  const P = { T: 0.07, S: 0.10 };
  const guessOf = (q) => ['match', 'kes', 'tablo', 'kur', 'olc', 'graf'].includes(q.type) ? 0.1 : q.type === 'input' ? 0.15 : q.type === 'tf' ? 0.5 : (1 / Math.max(2, (q.options || []).length));
  E.bkt = (pL, correct, guess, hinted) => {
    const S = P.S, Gs = guess;
    let post = correct ? pL * (1 - S) / (pL * (1 - S) + (1 - pL) * Gs) : pL * S / (pL * S + (1 - pL) * (1 - Gs));
    if (correct && hinted) post = pL + (post - pL) * 0.4; // ipucuyla doğru: zayıf kanıt
    const T = hinted ? P.T * 0.5 : P.T;
    return Math.min(0.995, Math.max(0.01, post + (1 - post) * T));
  };
  E.crowns = (pL) => pL >= .95 ? 5 : pL >= .85 ? 4 : pL >= .7 ? 3 : pL >= .5 ? 2 : pL >= .3 ? 1 : 0;
  // Etkin ustalık: BKT tahmini, son 10 cevabın gerçek doğruluğuyla sınırlanır (aşırı iyimserliği önler)
  E.eff = (sk) => { const r = sk.recent || []; if (r.length < 5) return sk.pL; const acc = r.reduce((a, b) => a + b, 0) / r.length; return Math.min(sk.pL, acc + 0.2); };
  E.mastery = (st, id) => E.eff(st.skills[id]);

  /* ---------------- 2) Aralıklı tekrar (yarı ömür) ---------------- */
  E.recall = (sk, now = Date.now()) => sk.last ? Math.pow(2, -((now - sk.last) / HOUR) / sk.half) : 0;
  E.dueSkills = (st, now = Date.now()) => SKILLS.filter(s => st.skills[s.id].n > 0).map(s => ({ id: s.id, r: E.recall(st.skills[s.id], now) })).filter(x => x.r < 0.7).sort((a, b) => a.r - b.r);

  /* ---------------- 3) Anlatım biçimi bandit ---------------- */
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  E.pickFormat = (st, exclude) => {
    let best = null, bv = -1;
    for (const [f, b] of Object.entries(st.formats)) {
      if (exclude && exclude.includes(f)) continue;
      const m = b.a / (b.a + b.b), sd = Math.sqrt(b.a * b.b / ((b.a + b.b) ** 2 * (b.a + b.b + 1)));
      const sample = m + gauss() * sd; if (sample > bv) { bv = sample; best = f; }
    }
    return best || 'gorsel';
  };
  E.rewardFormat = (st, f, r) => { const b = st.formats[f]; if (!b) return; b.a += r; b.b += (1 - r); };
  E.formatRank = (st) => Object.entries(st.formats).map(([f, b]) => ({ f, m: b.a / (b.a + b.b), n: b.a + b.b - 2 })).sort((x, y) => y.m - x.m);

  /* ---------------- Soru seçimi ---------------- */
  E.levelFor = (st, id, ctx = {}) => {
    const pL = E.eff(st.skills[id]); let lv = pL < 0.35 ? 1 : pL < 0.7 ? 2 : 3;
    if (ctx.lastWrong) lv = Math.max(1, lv - 1);
    else if (ctx.streak >= 3 && lv < 3 && Math.random() < 0.35) lv++;  // esnetme (yakın gelişim alanı)
    return lv;
  };
  // sade: true → hız yarışı (parmakla kesir ve Hata Avcısı gelmez); 'telafi' → Hata Avcısı gelmez (telafi sorusu sade olmalı)
  E.makeQ = (id, lv, sade) => { const uygun = (q) => !(sade && q.hata) && !(sade === true && ['kes', 'olc', 'graf'].includes(q.type)); let q = GEN[id](lv); for (let t = 0; !uygun(q) && t < 30; t++) q = GEN[id](lv); q.skill = id; q.level = lv; q.uid = Math.random().toString(36).slice(2); return q; };

  // Hata Avcısı modu: çalıştığı becerilerden (yoksa ilk temalardan) muhakeme soruları; biçimler sırayla döner
  E.hataBecerileri = (st) => { const cal = HATA.ids.filter(id => st.skills[id] && st.skills[id].n > 0); return cal.length >= 2 ? cal : HATA.ids.filter(id => ['a_cevre', 'g_ucgen', 'n_toplacikar', 'e_oncelik', 'f_karsilastir', 'g_cember'].includes(id)); };
  E.hataSorusu = (st, ses) => {
    const pool = E.hataBecerileri(st), id = pool[Math.floor(Math.random() * pool.length)];
    const lv = Math.max(2, E.levelFor(st, id, { lastWrong: ses.lastWrong, streak: ses.streak })), tur = ['bul', 'kim', 'bul', 'neden', 'bul', 'kim'][ses.i % 6];
    const q = HATA.q(id, tur === 'neden' ? 3 : lv, tur); q.skill = id; q.level = lv; q.uid = Math.random().toString(36).slice(2); return q;
  };

  // Problem Atölyesi: 2 problem (farklı şablon); çalıştığı temalardan, yoksa temel şablonlardan
  E.atolyeBecerileri = (st) => { const cal = ATOLYE.ids.filter(id => st.skills[ATOLYE.skillOf(id)] && st.skills[ATOLYE.skillOf(id)].n > 0); return cal.length >= 2 ? cal : ['market', 'bahce', 'kumbara', 'terazi']; };
  E.atolyePlan = (st, adet = 2) => { const pool = E.atolyeBecerileri(st).slice().sort(() => Math.random() - 0.5).slice(0, adet); return pool.flatMap((id, i) => ATOLYE.sorular(id, { tablo: i === 0, kur: i === 1, gerekce: i === 1, no: i + 1 })); }; // 2. problemin kontrolü gerekçe sorusu
  E.ATOLYE = ATOLYE;

  // Ders oturumu planı
  E.newSession = (st, mode, skillId, theme) => {
    const med = E.medianTime(st);
    let len = 8; if (med > 35000) len = 6; if (st.skills[skillId] && E.eff(st.skills[skillId]) > 0.7) len = 10;
    if (mode === 'speed') len = 999;
    if (mode === 'mistakes') len = Math.min(8, Math.max(3, st.mistakes.length));
    if (mode === 'review') len = 8;
    if (mode === 'learn') len = 5;
    if (mode === 'exam') len = 10;
    if (mode === 'hazir') len = 5;
    if (mode === 'hata') len = 6;
    let aq = null; if (mode === 'atolye') { aq = E.atolyePlan(st); len = aq.length; }
    const card = (mode === 'lesson' && st.skills[skillId].lessons === 0) || mode === 'learn';
    return { aq, mode, skill: skillId, len, i: 0, correct: 0, wrong: 0, streak: 0, best: 0, xp: 0, start: Date.now(), lastWrong: false, lastMis: null, queue: [], answered: [], format: card ? E.pickFormat(st) : null, formatTried: [], postCard: [], rescueOk: 0, rescueTry: 0, hintsUsed: 0, done: false, theme: theme || (skillId && SKILL[skillId] ? SKILL[skillId].theme : null), matches: 0 };
  };
  /* Tekrar engeli (17.10.2026, proje sahibinin videosu: aynı soru üst üste 3 kez geldi):
     - Bir derste AYNI soru (metin + şıklar/cevap + görsel) ikinci kez gelmez.
     - Art arda iki soru aynı KALIPTA olmaz (yalnız sayı ya da harf değişmiş "4 nokta / 3 nokta" gibi), alternatif bulunabiliyorsa.
     Üretici yeniden çağrılır; havuz gerçekten tükenmişse (çok dar seviyeler) en son çare olarak tekrar kabul edilir. */
  const ozet = (t) => { let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return h.toString(36); };
  const soruAnahtari = (q) => String(q.prompt).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() + '|' + (q.visual ? ozet(String(q.visual)) : '') + '|' + (q.options ? q.options.map(o => o.t).sort().join('/') : (q.answer || '') + (q.hedef || '')) + '|' + JSON.stringify(q.cmp || q.grid || (q.pairs && q.pairs.map(x => x.a)) || q.defter || '');
  const kalipAnahtari = (q) => String(q.prompt).replace(/<[^>]+>/g, ' ').replace(/\d+([.,]\d+)?/g, '#').replace(/\b[A-ZÇĞİÖŞÜ]\b/g, '@').replace(/[\s#@,]+/g, ' ').trim() + '|' + (q.type || '');
  E.soruAnahtari = soruAnahtari; E.kalipAnahtari = kalipAnahtari;
  E.nextQ = (st, ses) => {
    if (ses.mode === 'atolye' || ses.mode === 'placement') return E.nextQ0(st, ses);
    const gorulen = ses.gorulen || (ses.gorulen = []);
    let q = null, yedek = null;
    for (let t = 0; t < 40; t++) {
      const aday = E.nextQ0(st, ses), ak = soruAnahtari(aday);
      if (gorulen.includes(ak)) continue;              // aynı soru: asla (havuz tükenmedikçe)
      if (!yedek) yedek = aday;
      if (t < 20 && ses.sonKalip && kalipAnahtari(aday) === ses.sonKalip) continue; // art arda aynı kalıp: önce başka kalıp ara
      q = aday; break;
    }
    q = q || yedek || E.nextQ0(st, ses);
    gorulen.push(soruAnahtari(q)); ses.sonKalip = kalipAnahtari(q);
    return q;
  };
  E.nextQ0 = (st, ses) => {
    // telafi: yanlıştan sonra aynı beceride bir alt seviye
    if (ses.lastWrong && ses.lastSkill) { const q = E.makeQ(ses.lastSkill, Math.max(1, ses.lastLevel - 1), 'telafi'); q.rescue = true; q.rescueOf = ses.lastMis; return q; }
    // Ön bilgi yoklaması: çocuk bu konuda zorlanınca altındaki temel konudan 2 kısa soru (ders sayacını ilerletmez)
    const tk = ses.temelKontrol; if (tk && tk.n < E.TEMEL_SORU) { const q = E.makeQ(tk.pre, 1, 'telafi'); q.temel = { pre: tk.pre, sk: tk.sk, sira: tk.n + 1 }; return q; }
    let id = ses.skill;
    if (ses.mode === 'mistakes' && st.mistakes.length) { const m = st.mistakes[ses.i % st.mistakes.length]; const q = E.makeQ(m.skill, m.lv); q.replay = true; return q; }
    if (ses.mode === 'review' || ses.mode === 'mix') { const due = E.dueSkills(st); const pool = due.length ? due.map(d => d.id) : SKILLS.filter(s => st.skills[s.id].n > 0).map(s => s.id); id = pool.length ? pool[ses.i % pool.length] : SKILLS[0].id; }
    if (ses.mode === 'speed') { const pool = SKILLS.filter(s => E.eff(st.skills[s.id]) >= 0.3).map(s => s.id); id = pool.length ? pool[Math.floor(Math.random() * pool.length)] : ['n_karsilastir', 'e_oncelik', 'f_karsilastir', 'a_cevre'][Math.floor(Math.random() * 4)]; const q = E.makeQ(id, 1, true); return q; }
    if (ses.mode === 'lesson' && Math.random() < 0.12) { const due = E.dueSkills(st).filter(d => d.id !== ses.skill); if (due.length) { const q = E.makeQ(due[0].id, E.levelFor(st, due[0].id)); q.review = true; return q; } }
    if (ses.mode === 'hata') return E.hataSorusu(st, ses);
    if (ses.mode === 'atolye') {
      // Derinleştir yalnızca bu problemin çözüm adımlarını ilk denemede yapan çocuğa gelir (zorlanan çocuğu yormaz)
      let q = ses.aq[Math.min(ses.i, ses.aq.length - 1)];
      while (q.atolye.asama === 'derin' && !(ses.atolyeCoz && (ses.atolyeCoz[q.atolye.pid] || []).length && ses.atolyeCoz[q.atolye.pid].every(k => k === 'ilk'))) { ses.aq.splice(ses.i, 1); ses.len = ses.aq.length; q = ses.aq[Math.min(ses.i, ses.aq.length - 1)]; }
      q.level = 2; q.uid = Math.random().toString(36).slice(2); return q;
    }
    if (ses.mode === 'placement') { id = ses.plan[ses.i]; return E.makeQ(id, 1); }
    if (ses.mode === 'exam') { const ids = SKILLS.filter(s => s.theme === ses.theme).map(s => s.id); id = ids[ses.i % ids.length]; const q = E.makeQ(id, ses.i < 5 ? 2 : 3); q.exam = true; return q; }
    if (ses.mode === 'hazir') { const ids = SKILLS.filter(s => s.theme === ses.theme).map(s => s.id).slice(0, 3); id = ids[ses.i % ids.length]; return E.makeQ(id, 1); }
    return E.makeQ(id, E.levelFor(st, id, { lastWrong: ses.lastWrong, streak: ses.streak }));
  };

  /* ---------------- Cevap değerlendirme ---------------- */
  E.check = (q, ans) => {
    if (q.type === 'kes') return KES_CHECK(q, ans);
    if (q.type === 'olc') return OLC_CHECK(q, ans);
    if (q.type === 'graf') return GRAF_CHECK(q, ans);
    if (q.type === 'tablo') return ATOLYE.tabloKontrol(q, ans);
    if (q.type === 'kur') return ATOLYE.kurKontrol(q, ans);
    if (q.type === 'input') {
      const ok = U.numEq(ans, q.answer);
      let mis = null, hit = null; if (!ok) { hit = (q.inputMis || []).find(m => U.numEq(ans, m.v)); mis = hit ? hit.mis : 'genel'; }
      return { ok, mis, ac: hit && hit.ac, ip: hit && hit.ip };
    }
    const o = q.options[ans]; return { ok: !!(o && o.ok), mis: o && !o.ok ? (o.mis || 'genel') : null, ac: o && !o.ok ? o.ac : undefined, ip: o && !o.ok ? o.ip : undefined };
  };
  /* İkinci şans: yanlıştan sonra cevabı vermeyen ipucu + bir yeniden deneme.
     Yok: hız yarışı, seviye belirleme, sınav, hazır mıyız (ölçme anları); eşleştirme; iki şıklı sorular (ikinci denemede cevap belli olur). */
  E.ikinciSansUygun = (ses, q) => !['speed', 'placement', 'exam', 'hazir'].includes(ses.mode) && q.type !== 'match' && q.type !== 'tf' && !(q.options && q.type !== 'input' && !['kes', 'olc', 'graf'].includes(q.type) && q.options.length < 3);
  // İlk denemedeki yanılgı da veridir: deftere yazılır (ustalık hesabı son denemede yapılır)
  E.yanilgiNotu = (st, q, mis) => {
    if (!mis) return; const now = Date.now();
    const m = st.mis[mis] || (st.mis[mis] = { n: 0, fixed: 0, skill: q.skill, last: 0 }); m.n++; m.last = now; m.skill = q.skill;
    m.q = (m.q || []).filter(u => u !== q.uid).concat(q.uid || String(now)).slice(-10); // farklı sorular: tek gözlem 'olası güçlük', 2+ farklı soruda 'yanılgı'
    st.mistakes = st.mistakes.filter(x => !(x.skill === q.skill && x.mis === mis)); st.mistakes.unshift({ skill: q.skill, lv: q.level, mis, at: now }); st.mistakes = st.mistakes.slice(0, 30);
  };
  // kanit: 'ilk' (ilk denemede, ipucusuz doğru) · 'ipucu' (ipucuyla ya da ikinci denemede doğru) · 'cozum' (çözüm gösterildi)
  E.record = (st, ses, q, res, ms, hinted, kanit) => {
    kanit = kanit || (res.ok ? (hinted ? 'ipucu' : 'ilk') : 'cozum');
    const sk = st.skills[q.skill], now = Date.now(), tahmin = !!(q.atolye && q.atolye.asama === 'tahmin');
    // Tahmin bir kestirimdir, cevap değil: ustalığa, yanılgı defterine, seriye ve ders doğruluğuna girmez.
    // Sadece atölye ölçümüne yazılır; çocuk problemi çözünce tahminiyle karşılaştırılır.
    if (tahmin) {
      if (st.atolye) { const a = st.atolye.tahmin || (st.atolye.tahmin = { n: 0, ok: 0 }); a.n++; if (res.ok) a.ok++; }
      (ses.tahmin || (ses.tahmin = {}))[q.atolye.pid] = { t: res.secilen, ok: res.ok, dogru: (q.options.find(o => o.ok) || {}).t };
      ses.xp += 2; ses.i++; return 2;
    }
    if (res.partial || kanit === 'ipucu') hinted = true;
    // Tahmin bir kestirimdir: beceri ustalığına ve yanılgı defterine yazılmaz, sadece atölye ölçümüne girer
    if (!tahmin) { sk.pL = E.bkt(sk.pL, res.ok, guessOf(q), hinted); sk.n++; if (res.ok) sk.ok++; }
    if (q.type === 'match') ses.matches++;
    sk.kanit = sk.kanit || { ilk: 0, ipucu: 0, cozum: 0 }; sk.kanit[kanit]++;
    st.kanit = st.kanit || { ilk: 0, ipucu: 0, cozum: 0 }; st.kanit[kanit]++;
    if (q.atolye && st.atolye) { const a = st.atolye[q.atolye.asama] || (st.atolye[q.atolye.asama] = { n: 0, ok: 0 }); a.n++; if (kanit === 'ilk') a.ok++; if (kanit === 'ipucu') a.ip = (a.ip || 0) + 1; if (q.atolye.sira === q.atolye.toplam - 1) st.atolye.problem++;
      if (q.atolye.asama === 'coz') { const c = ses.atolyeCoz || (ses.atolyeCoz = {}); (c[q.atolye.pid] || (c[q.atolye.pid] = [])).push(kanit); } }
    // yarı ömür: aralıklı başarı → uzar
    const gap = sk.last ? (now - sk.last) / HOUR : 0;
    if (res.ok) sk.half = Math.min(24 * 60, sk.half * (gap > sk.half * 0.5 ? 2 : 1.15)); else sk.half = Math.max(6, sk.half / 2);
    sk.last = now; sk.recent = (sk.recent || []).concat(res.ok ? 1 : 0).slice(-10);
    if (ses.mode !== 'placement' && ses.mode !== 'speed') st.times = st.times.concat(ms).slice(-60);
    st.hints.q++; if (hinted) { st.hints.used++; ses.hintsUsed++; }
    // yanılgı defteri
    if (!res.ok && !tahmin) E.yanilgiNotu(st, q, res.mis);
    if (q.rescue) { st.rescue.tries++; ses.rescueTry++; if (res.ok) { st.rescue.ok++; ses.rescueOk++; if (q.rescueOf && st.mis[q.rescueOf]) st.mis[q.rescueOf].fixed++; } }
    if (q.replay && res.ok) { const i = st.mistakes.findIndex(m => m.skill === q.skill); if (i >= 0) { const m = st.mistakes[i]; if (st.mis[m.mis]) st.mis[m.mis].fixed++; st.mistakes.splice(i, 1); } }
    // anlatım biçimi ödülü: kart sonrası ilk 3 soru
    if (ses.format && ses.postCard.length < 3 && !q.rescue) { ses.postCard.push(res.ok ? 1 : 0); if (ses.postCard.length === 3) E.rewardFormat(st, ses.format, ses.postCard.reduce((a, b) => a + b, 0) >= 2 ? 1 : 0); }
    // oturum
    ses.answered.push({ kanit, skill: q.skill, ok: res.ok, mis: res.mis, ms, rescue: !!q.rescue, level: q.level, type: q.type, hint: !!hinted, partial: !!res.partial });
    let gain = 0;
    if (res.ok && res.partial) { ses.correct++; gain = 5; }
    else if (res.ok && kanit === 'ipucu' && !q.rescue) { ses.correct++; gain = 5; }
    else if (res.ok) { ses.correct++; ses.streak++; ses.best = Math.max(ses.best, ses.streak); gain = q.rescue ? 15 : 10; if (ses.streak >= 5) gain += 5; }
    else { ses.wrong++; ses.streak = 0; }
    ses.xp += gain; ses.lastWrong = !res.ok && !q.rescue && !q.temel && !['placement', 'speed', 'exam', 'hazir', 'atolye'].includes(ses.mode); ses.lastSkill = q.skill; ses.lastLevel = q.level; ses.lastMis = res.mis;
    if (q.temel) E.temelKaydet(st, ses, kanit === 'ilk');
    else { if (!q.rescue) ses.i++; E.temelTetikle(st, ses, q, kanit); }
    return gain;
  };
  E.medianTime = (st) => { if (!st.times.length) return 15000; const a = st.times.slice().sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };

  /* ---------------- Seri koruyucu (20.10.2026) ----------------
     Uygulama açılınca (ve ders sonunda) çağrılır. Çocuğun gelmediği her gün için bir seri koruyucu kendiliğinden kullanılır.
     Koruyucular bütün boş günlere yetmiyorsa HİÇ harcanmaz (boşuna elmas yakılmaz) ve seri sıfırlanır; ilk ders 1. gün olur.
     Konular, yıldızlar, XP ve elmas hiç etkilenmez: seri yalnız bir alışkanlık sayacıdır. */
  E.KORUYUCU_EN_FAZLA = 2;
  E.seriKontrol = (st) => {
    const y = today(Date.now() - DAY);
    if (!st.lastDay || st.lastDay >= y || !st.streak) return null;
    const bos = []; for (let t = new Date(st.lastDay + 'T12:00:00').getTime() + DAY; today(t) <= y; t += DAY) bos.push(today(t));
    if (!bos.length) return null;
    if (st.freezes >= bos.length) {
      st.freezes -= bos.length; st.donmus = st.donmus || {}; for (const g of bos) st.donmus[g] = 1;
      st.lastDay = y; return { tip: 'korundu', gun: bos.length, kalan: st.freezes };
    }
    const eski = st.streak; st.streak = 0; return { tip: 'sifir', gun: bos.length, eski };
  };

  /* ---------------- Oturum sonu, seri, rozet ---------------- */
  /* ---------------- Ön bilgi yoklaması (24.10.2026) ----------------
     Çocuk bir derste aynı konuda 2 kez çözümü görmek zorunda kalırsa (iki deneme de yanlış), sorun konunun altındaki temel bilgide
     olabilir. Ön bilgi haritasındaki (ONKOSUL) zayıf ya da hiç ölçülmemiş temelden 2 kolay soru sorulur. İkisi de ilk denemede
     doğruysa temel sağlam: zorluk bu konunun kendisinde. Değilse temel eksik: haftalık plana ve veli raporuna "önce temel" girer.
     Etiket yok, tek oturumda tek yoklama; 14 gün içinde sağlam çıkan temel yeniden yoklanmaz. */
  E.TEMEL_SORU = 2; E.TEMEL_TAZE = 14 * DAY;
  E.temelAday = (st, id, now = Date.now()) => {
    const kayit = (st.temel || {})[id] || {};
    const aday = ((SKILL[id] || {}).temel || []).filter(pre => st.skills[pre]).map(pre => {
      const sk = st.skills[pre], k = kayit[pre];
      if (k && k.sonuc === 'saglam' && now - k.at < E.TEMEL_TAZE) return null;
      const m = sk.n >= 3 ? E.eff(sk) : 0.4;            // hiç ölçülmemiş temel: belirsiz say
      return m < 0.7 ? { pre, m } : null;
    }).filter(Boolean);
    return aday.length ? aday.sort((a, b) => a.m - b.m)[0].pre : null;
  };
  E.temelTetikle = (st, ses, q, kanit) => {
    if (!['lesson', 'learn'].includes(ses.mode) || ses.temelKontrol || q.skill !== ses.skill || q.rescue || kanit !== 'cozum') return;
    const cozum = ses.answered.filter(a => a.skill === ses.skill && !a.rescue && a.kanit === 'cozum').length;
    if (cozum < 2) return;
    const pre = E.temelAday(st, ses.skill); if (!pre) return;
    ses.temelKontrol = { sk: ses.skill, pre, n: 0, ok: 0, yeni: true };
  };
  E.temelKaydet = (st, ses, ilk) => {
    const tk = ses.temelKontrol; if (!tk) return; tk.n++; if (ilk) tk.ok++;
    if (tk.n < E.TEMEL_SORU) return;
    tk.sonuc = tk.ok >= E.TEMEL_SORU ? 'saglam' : 'eksik';
    const T = st.temel || (st.temel = {}); (T[tk.sk] || (T[tk.sk] = {}))[tk.pre] = { sonuc: tk.sonuc, at: Date.now(), ok: tk.ok, n: tk.n };
  };
  // Son 30 günde bulunan, hâlâ zayıf olan temel eksikleri (plan, öneri ve veli raporu için)
  E.temelEksikler = (st, now = Date.now()) => {
    const L = []; for (const [sk, o] of Object.entries(st.temel || {})) for (const [pre, k] of Object.entries(o))
      if (k.sonuc === 'eksik' && now - k.at < 30 * DAY && E.eff(st.skills[pre]) < 0.5) L.push({ sk, pre, at: k.at });
    return L.sort((a, b) => b.at - a.at);
  };

  /* ---------------- Okul takvimi (24.10.2026) ----------------
     Varsayılan: MEB taslak yıllık planındaki o haftanın konusu. Çocuk/veli "Okulda şu an bu konudayız" diye elle de seçebilir
     (öğretmenler sırayı değiştirebilir) ya da kapatabilir. st.okul = { mod: 'takvim' | 'elle' | 'kapali', sk, at }. */
  E.OKUL_YIL = OKUL_YIL;
  const gunAnahtar = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  E.okulHafta = (now = Date.now()) => {
    const g = gunAnahtar(now), T = OKUL_TAKVIM || []; if (!T.length || g < T[0].bas) return null;
    let i = -1; for (let k = 0; k < T.length; k++) if (T[k].bas <= g) i = k;
    const son = new Date(T[T.length - 1].bas + 'T12:00:00').getTime() + 7 * DAY; if (now > son) return null;
    let j = i; while (j >= 0 && !T[j].sk) j--;               // tatilde: son işlenen konu sürer
    return j < 0 ? null : { sk: T[j].sk, tatil: T[i].tatil, hafta: i + 1, bas: T[i].bas };
  };
  E.okulKonusu = (st, now = Date.now()) => {
    const o = st.okul || { mod: 'takvim' };
    if (o.mod === 'kapali') return null;
    if (o.mod === 'elle' && o.sk && SKILL[o.sk]) return { sk: [o.sk], kaynak: 'elle' };
    const h = E.okulHafta(now); return h ? { sk: h.sk, kaynak: 'takvim', tatil: h.tatil } : null;
  };
  // Okulda işlenmiş (bu haftadan önceki) ama hiç çalışılmamış konular: geride kalmasın
  E.okulGeride = (st, now = Date.now()) => {
    const ok = E.okulKonusu(st, now); if (!ok) return [];
    let once;
    if (ok.kaynak === 'elle') { const i = SKILLS.findIndex(s => s.id === ok.sk[0]); once = SKILLS.slice(0, Math.max(0, i)).map(s => s.id); }
    else { const g = gunAnahtar(now); once = []; for (const w of OKUL_TAKVIM) { if (w.bas > g) break; (w.sk || []).forEach(x => { if (!ok.sk.includes(x) && !once.includes(x)) once.push(x); }); } }
    return once.filter(id => st.skills[id] && st.skills[id].n === 0); // hiç soru çözülmemiş (seviye belirlemenin tahmini sayılmaz)
  };

  /* ---------------- Haftalık plan (24.10.2026) ----------------
     Her pazartesi çocuğun kendi verisinden 3 hedef çıkar ve hafta boyu sabit kalır (ilerleme canlı hesaplanır):
     1) okul konusu (ya da yoldaki sıradaki konu) → en az 2 yıldız; 2) bulunan temel eksiği ya da en zayıf çalışılmış konu ya da
     okulda geride kalan konu ya da tekrar; 3) alışkanlık: haftada N gün (geçen haftaya göre 3–5). Üçü bitince bir kez +25 elmas. */
  E.PLAN_ODUL = 25;
  E.haftalikPlan = (st, now = Date.now()) => {
    const hafta = weekStart(now);
    if (!st.plan || st.plan.hafta !== hafta) {
      const H = [], var_ = new Set(), ekle = (h) => { if (h && !var_.has(h.sk || h.tip)) { var_.add(h.sk || h.tip); H.push(h); } };
      const ok = E.okulKonusu(st, now), okSk = ok && ok.sk.find(id => E.eff(st.skills[id]) < 0.7);
      if (okSk) ekle({ tip: 'okul', sk: okSk, hedef: 2 });
      else { const s2 = SKILLS.find(s => st.skills[s.id].n > 0 && E.eff(st.skills[s.id]) < 0.5) || SKILLS.find(s => E.eff(st.skills[s.id]) < 0.7); if (s2) ekle({ tip: 'yol', sk: s2.id, hedef: 2 }); }
      const te = E.temelEksikler(st, now)[0];
      if (te) ekle({ tip: 'temel', sk: te.pre, icin: te.sk, hedef: 1 });
      if (H.length < 2) { const zayif = SKILLS.filter(s => st.skills[s.id].n >= 4 && E.eff(st.skills[s.id]) < 0.5).sort((a, b) => E.eff(st.skills[a.id]) - E.eff(st.skills[b.id]))[0]; if (zayif) ekle({ tip: 'guclen', sk: zayif.id, hedef: 2 }); }
      if (H.length < 2) { const g = E.okulGeride(st, now)[0]; if (g) ekle({ tip: 'geride', sk: g, hedef: 1 }); }
      if (H.length < 2 && SKILLS.some(s => st.skills[s.id].n > 0)) ekle({ tip: 'tekrar', hedef: 2 });
      if (H.length < 2) { const s3 = SKILLS.find(s => !var_.has(s.id) && E.eff(st.skills[s.id]) < 0.7); if (s3) ekle({ tip: 'yol', sk: s3.id, hedef: 1 }); }
      const gecen = new Set(Object.keys(st.days || {}).filter(d => { const t = new Date(d + 'T12:00:00').getTime(); return t >= hafta - 7 * DAY && t < hafta; })).size;
      H.push({ tip: 'gun', hedef: Math.min(5, Math.max(3, gecen + 1)) });
      st.plan = { hafta, hedefler: H, bas: { tekrar: (st.sessions || []).filter(x => x.at >= hafta && ['review', 'mistakes'].includes(x.mode)).length }, odul: false };
    }
    const P = st.plan, gunler = new Set(Object.keys(st.days || {}).filter(d => { const t = new Date(d + 'T12:00:00').getTime(); return t >= P.hafta && t < P.hafta + 7 * DAY && st.days[d] > 0; })).size;
    const liste = P.hedefler.map(h => {
      let v = 0;
      if (h.tip === 'gun') v = gunler;
      else if (h.tip === 'tekrar') v = (st.sessions || []).filter(x => x.at >= P.hafta && ['review', 'mistakes'].includes(x.mode)).length;
      else if (h.tip === 'geride') v = st.skills[h.sk].n >= 3 ? 1 : 0;   // "bir ders yap": gerçekten çalışılınca tamam
      else v = E.crowns(E.eff(st.skills[h.sk]));
      return Object.assign({}, h, { v: Math.min(v, h.hedef), tamam: v >= h.hedef });
    });
    return { hafta: P.hafta, liste, tamam: liste.every(h => h.tamam), odul: P.odul };
  };
  E.planOdul = (st) => { const p = E.haftalikPlan(st); if (!p.tamam || st.plan.odul) return 0; st.plan.odul = Date.now(); st.gems += E.PLAN_ODUL; return E.PLAN_ODUL; };

  // Sandık nadirliği öğrenmeyi ödüllendirir: doğruluk yükseldikçe daha iyi sandık; küçük bir sürpriz payı her zaman var.
  // Elmas aralıkları: ahşap 5–10, nadir 10–20, efsane 20–35. Sandık ve elmas ASLA parayla satılmaz (§1-7).
  E.SANDIK_ELMAS = { ahsap: [5, 10], nadir: [10, 20], efsane: [20, 35] };
  E.sandikNadirlik = (acc, r = Math.random()) => acc >= 0.9 ? (r < 0.75 ? 'efsane' : 'nadir') : acc >= 0.7 ? (r < 0.1 ? 'efsane' : 'nadir') : (r < 0.15 ? 'nadir' : 'ahsap');
  E.sandikElmas = (n, r = Math.random()) => { const [a, b] = E.SANDIK_ELMAS[n] || E.SANDIK_ELMAS.ahsap; return a + Math.floor(r * (b - a + 1)); };
  E.ROKET_DERS = 2;
  E.finish = (st, ses) => {
    const acc = ses.answered.length ? ses.answered.reduce((t, a) => t + (a.ok ? (a.kanit === 'ipucu' ? 0.5 : 1) : 0), 0) / ses.answered.length : 0;
    if (ses.mode !== 'placement') { ses.xp += 15; if (ses.wrong === 0 && ses.answered.length >= 5) ses.xp += 10; }
    // Roket Gücü (sandıktan çıkar): sonraki N derste 2 kat XP. Saate değil ders sayısına bağlı: çocuğa süre baskısı yok.
    let roket = 0;
    if (st.roket && st.roket.kalan > 0 && !['placement', 'hazir'].includes(ses.mode)) { roket = ses.xp; ses.xp *= 2; st.roket.kalan--; }
    const d = today();
    E.seriKontrol(st);
    if (st.lastDay !== d) {
      st.streak = st.lastDay === today(Date.now() - DAY) ? st.streak + 1 : 1;
      st.lastDay = d;
    }
    st.xp += ses.xp; st.days[d] = (st.days[d] || 0) + ses.xp;
    E.rollWeek(st);
    st.week.xp += ses.xp;
    if (ses.skill && st.skills[ses.skill] && (ses.mode === 'lesson' || ses.mode === 'learn')) st.skills[ses.skill].lessons++;
    if (ses.skill && SKILL[ses.skill]) { const t = SKILL[ses.skill].theme; if (!st.themesTried.includes(t)) st.themesTried.push(t); }
    const sandik = ses.mode === 'placement' ? null : E.sandikNadirlik(acc);
    const gemsWon = sandik ? E.sandikElmas(sandik) : 0; st.gems += gemsWon;
    st.sessions.unshift({ at: Date.now(), mode: ses.mode, skill: ses.skill, n: ses.answered.length, acc, ms: Date.now() - ses.start, xp: ses.xp, hints: ses.hintsUsed, rescue: [ses.rescueOk, ses.rescueTry] });
    st.sessions = st.sessions.slice(0, 150);
    let trophy = null;
    if (ses.mode === 'exam' && ses.theme) { const pass = acc >= 0.7; if (pass && !st.trophies[ses.theme]) { st.trophies[ses.theme] = { at: Date.now(), acc }; st.gems += 50; } trophy = { pass, acc }; }
    const quests = E.questTick(st, ses, acc);
    const newBadges = E.checkBadges(st, ses, acc);
    const planOdul = E.planOdul(st);
    return { acc, gemsWon, sandik, roket, newBadges, trophy, quests, planOdul, temel: ses.temelKontrol && ses.temelKontrol.sonuc ? ses.temelKontrol : null };
  };
  const BADGES = [
    { id: 'ilk', icon: '🌱', name: 'İlk Adım', desc: 'İlk dersini bitirdin.', test: (st) => st.sessions.some(s => s.mode === 'lesson') },
    { id: 'seri3', icon: '🔥', name: '3 Günlük Seri', desc: '3 gün üst üste çalıştın.', test: (st) => st.streak >= 3 },
    { id: 'seri7', icon: '🌋', name: 'Bir Hafta Ateş', desc: '7 gün üst üste çalıştın.', test: (st) => st.streak >= 7 },
    { id: 'kusursuz', icon: '💎', name: 'Kusursuz', desc: 'Bir dersi hiç hata yapmadan bitirdin.', test: (st, ses) => ses && ses.wrong === 0 && ses.answered.length >= 5 },
    { id: 'hata10', icon: '🕵️', name: 'Hata Avcısı', desc: 'Hatandan sonra 10 kez doğruya döndün.', test: (st) => st.rescue.ok >= 10 },
    { id: 'kasif', icon: '🧭', name: 'Kâşif', desc: '7 bölgenin hepsini denedin.', test: (st) => st.themesTried.length >= 7 },
    { id: 'hiz', icon: '⚡', name: 'Şimşek', desc: 'Hızlı Yarış\'ta 10 doğruya ulaştın.', test: (st) => st.speedBest >= 10 },
    { id: 'usta', icon: '👑', name: 'Tema Ustası', desc: 'Bir temanın tüm becerilerinde 3 taç.', test: (st) => THEMES.some(t => SKILLS.filter(s => s.theme === t.id).every(s => E.crowns(E.eff(st.skills[s.id])) >= 3)) },
    { id: 'kupa', icon: '🏆', name: 'Kupa Avcısı', desc: 'Bir bölge sınavını %70 ve üzeriyle geçtin.', test: (st) => Object.keys(st.trophies || {}).length >= 1 },
    { id: 'ay', icon: '📅', name: 'Ayın Şampiyonu', desc: 'Aylık görevi tamamladın.', test: (st) => st.month && st.month.claimed },
    { id: 'xp500', icon: '🚀', name: '500 XP', desc: 'Toplam 500 XP topladın.', test: (st) => st.xp >= 500 },
  ];
  E.BADGES = BADGES;
  E.checkBadges = (st, ses, acc) => { const got = []; for (const b of BADGES) if (!st.badges.includes(b.id) && b.test(st, ses, acc)) { st.badges.push(b.id); got.push(b); } return got; };

  /* ---------------- Yerleştirme (seviye belirleme) ---------------- */
  E.placementPlan = () => THEMES.map(t => SKILLS.find(s => s.theme === t.id && GEN[s.id]).id);
  E.applyPlacement = (st, ses) => {
    ses.answered.forEach(a => {
      const theme = SKILL[a.skill].theme, ids = SKILLS.filter(s => s.theme === theme).map(s => s.id);
      ids.slice(0, 2).forEach(id => { st.skills[id].pL = a.ok ? Math.max(st.skills[id].pL, 0.4) : Math.min(st.skills[id].pL, 0.12); });
    });
    st.placementDone = true;
  };

  /* ---------------- Öğrenme parmak izi ---------------- */
  E.fingerprint = (st) => {
    const med = E.medianTime(st);
    const pace = st.times.length < 5 ? 'Henüz ölçülüyor' : med < 9000 ? 'Hızlı karar veren' : med < 22000 ? 'Dengeli' : 'Derin düşünen';
    const fr = E.formatRank(st), best = fr[0];
    const hintRate = st.hints.q ? st.hints.used / st.hints.q : 0;
    const resil = st.rescue.tries ? st.rescue.ok / st.rescue.tries : null;
    const attempted = SKILLS.filter(s => st.skills[s.id].n > 0);
    // Güçlü/zayıf etiketi için en az 4 cevap gerekir (seviye belirlemedeki tek soruyla etiket konmaz; §4.7 dürüst gösterge)
    const olculen4 = attempted.filter(s => st.skills[s.id].n >= 4);
    const strong = olculen4.slice().sort((a, b) => E.eff(st.skills[b.id]) - E.eff(st.skills[a.id])).slice(0, 3).filter(s => E.eff(st.skills[s.id]) >= 0.5);
    const weak = olculen4.slice().sort((a, b) => E.eff(st.skills[a.id]) - E.eff(st.skills[b.id])).slice(0, 3).filter(s => E.eff(st.skills[s.id]) < 0.7 && !strong.includes(s));
    const misList = Object.entries(st.mis).filter(([k]) => k !== 'genel').map(([k, v]) => ({ id: k, ...v, t: MIS[k] ? MIS[k].t : k, active: v.n > v.fixed, kesin: (v.q ? v.q.length : v.n) >= 2 })).sort((a, b) => (b.n - b.fixed) - (a.n - a.fixed));
    const totalQ = attempted.reduce((a, s) => a + st.skills[s.id].n, 0), totalOk = attempted.reduce((a, s) => a + st.skills[s.id].ok, 0);
    const A_ = st.atolye || {}, asamalar = ['anla', 'plan', 'tahmin', 'coz', 'kontrol', 'derin'].map(k => ({ k, ad: ATOLYE.ASAMA[k], ek: k === 'tahmin' || k === 'derin', n: (A_[k] || {}).n || 0, ok: (A_[k] || {}).ok || 0, acc: (A_[k] || {}).n ? A_[k].ok / A_[k].n : null }));
    const olculen = asamalar.filter(a => a.n >= 3 && !a.ek), zayifAsama = olculen.length >= 3 ? olculen.slice().sort((a, b) => a.acc - b.acc)[0] : null;
    const problem = { asamalar, zayif: zayifAsama && zayifAsama.acc < 0.75 ? zayifAsama : null, sayi: A_.problem || 0 };
    const K = st.kanit || { ilk: 0, ipucu: 0, cozum: 0 }, kn = K.ilk + K.ipucu + K.cozum;
    const kanit = kn ? { n: kn, ilk: K.ilk / kn, ipucu: K.ipucu / kn, cozum: K.cozum / kn } : null;
    const ilkAcc = kn >= 5 ? K.ilk / kn : null, ilkSay = { ok: K.ilk, n: kn };
    const bagimsiz = (A_.bagimsiz && A_.bagimsiz.n) ? { n: A_.bagimsiz.n, ok: A_.bagimsiz.ok, acc: A_.bagimsiz.ok / A_.bagimsiz.n } : null;
    problem.bagimsiz = bagimsiz;
    return { kanit, ilkAcc, ilkSay, problem, pace, med, formats: fr, bestFormat: best && best.n >= 2 ? best.f : null, hintRate, resil, strong, weak, misList, totalQ, acc: totalQ ? totalOk / totalQ : 0 };
  };

  /* ---------------- Veli raporu metni ---------------- */
  E.parentReport = (st) => {
    const p = st.profile || {}, fp = E.fingerprint(st), wk = Date.now() - 7 * DAY;
    const ses = st.sessions.filter(s => s.at >= wk), msTop = ses.reduce((a, s) => a + s.ms, 0), mins = msTop > 0 && msTop < 60000 ? '<1' : Math.round(msTop / 60000), xp = ses.reduce((a, s) => a + s.xp, 0);
    const daysActive = new Set(ses.map(s => today(s.at))).size;
    const qn = ses.reduce((a, s) => a + s.n, 0), acc = qn ? Math.round(100 * ses.reduce((a, s) => a + s.acc * s.n, 0) / qn) : 0;
    const L = []; let probIcgoru = null;
    L.push(`📘 Matematik Yolu — Haftalık Gelişim Raporu`);
    L.push(`Öğrenci: ${p.name || '-'} (5. sınıf)`);
    L.push(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`);
    L.push('');
    L.push(`⏱ Son 7 gün: ${daysActive} gün çalıştı, toplam ${mins === '<1' ? '1 dakikadan az' : mins + ' dakika'}, ${ses.length} ders, ${qn} soru.`);
    L.push(`✅ Doğruluk: %${acc}   ⚡ Kazanılan XP: ${xp}   🔥 Seri: ${st.streak} gün`);
    if (fp.strong.length) L.push(`💪 Güçlü olduğu konular: ${fp.strong.map(s => s.title).join(', ')}`);
    if (fp.weak.length) L.push(`🎯 Destek gereken konular: ${fp.weak.map(s => s.title).join(', ')}`);
    const act = fp.misList.filter(m => m.active && m.kesin).slice(0, 3), olasi = fp.misList.filter(m => m.active && !m.kesin).slice(0, 3);
    if (act.length) L.push(`🧩 Üzerinde çalıştığımız kavram yanılgıları (farklı sorularda tekrarladı): ${act.map(m => m.t).join('; ')}`);
    if (olasi.length) L.push(`🔎 Olası güçlükler (şimdilik bir kez görüldü, izleniyor): ${olasi.map(m => m.t).join('; ')}`);
    const fixed = fp.misList.filter(m => !m.active && m.n > 0).slice(0, 3);
    if (fixed.length) L.push(`🌟 Düzelttiği yanılgılar: ${fixed.map(m => m.t).join('; ')}`);
    if (fp.kanit && fp.kanit.n >= 5) { const K = st.kanit; L.push(`🧾 Cevapların (${fp.kanit.n} cevap): ilk denemede doğru %${Math.round(fp.kanit.ilk * 100)} (${K.ilk}) · ipucuyla doğru %${Math.round(fp.kanit.ipucu * 100)} (${K.ipucu}) · çözüm gösterildi %${Math.round(fp.kanit.cozum * 100)} (${K.cozum})`); }
    if (fp.problem.sayi >= 2) {
      const azVeri = fp.problem.asamalar.some(a => a.n && a.n < 5);
      L.push(`🧩 Problem çözme (${fp.problem.sayi} problem, ilk denemede doğru${azVeri ? ', ön değerlendirme: veri az' : ''}): ${fp.problem.asamalar.filter(a => a.n).map(a => `${a.ad} %${Math.round(a.acc * 100)} (${a.ok}/${a.n})`).join(' · ')}`);
      const z = fp.problem.zayif, coz = fp.problem.asamalar.find(a => a.k === 'coz');
      if (z && (z.k === 'anla' || z.k === 'plan') && coz.acc !== null && coz.acc - z.acc >= 0.15) probIcgoru = `Hesaplamada değil, problemi ${z.k === 'anla' ? 'anlamada' : 'planlamada'} zorlanıyor. Problemleri birlikte sesli okuyup "Ne isteniyor?" diye sormak çok işe yarar.`;
      else if (z) probIcgoru = `En çok "${z.ad}" adımında desteğe ihtiyacı var.`;
      if (probIcgoru) L.push(`   → ${probIcgoru}`);
      if (fp.problem.bagimsiz) L.push(`   → Benzer yeni problemi tek başına çözme: ilk denemede %${Math.round(fp.problem.bagimsiz.acc * 100)} (${fp.problem.bagimsiz.ok}/${fp.problem.bagimsiz.n}${fp.problem.bagimsiz.n < 5 ? ', ön değerlendirme' : ''}). Öğrenmenin en güçlü kanıtı budur.`);
    }
    // Okul, ön bilgi ve haftalık plan (24.10.2026)
    const okul = E.okulKonusu(st), geride = E.okulGeride(st).slice(0, 4);
    if (okul) L.push(`🏫 Okulda ${okul.tatil ? 'son işlenen' : 'bu hafta'}: ${okul.sk.map(id => `${SKILL[id].title} (${E.crowns(E.eff(st.skills[id]))}/5 yıldız)`).join(', ')} · ${okul.kaynak === 'elle' ? 'sizin seçiminiz' : 'MEB taslak yıllık planına göre'}`);
    if (geride.length) L.push(`📌 Okulda işlenmiş ama uygulamada henüz çalışılmamış: ${geride.map(id => SKILL[id].title).join(', ')}`);
    const temelL = []; for (const [sk, o] of Object.entries(st.temel || {})) for (const [pre, k] of Object.entries(o)) if (Date.now() - k.at < 30 * DAY) temelL.push({ sk, pre, sonuc: k.sonuc, at: k.at, simdi: E.eff(st.skills[pre]) });
    temelL.sort((a, b) => b.at - a.at);
    temelL.slice(0, 3).forEach(t => L.push(t.sonuc === 'eksik'
      ? `🧱 Ön bilgi kontrolü: «${SKILL[t.sk].title}» konusunda zorlanınca temeli olan «${SKILL[t.pre].title}» 2 soruyla yoklandı; eksik görünüyor${t.simdi >= 0.5 ? ', ardından çalışılıp toparlandı ✓' : ', önce o konu çalışılıyor'}.`
      : `🧱 Ön bilgi kontrolü: «${SKILL[t.sk].title}» için temel olan «${SKILL[t.pre].title}» sağlam çıktı; zorluk konunun kendisinde, pratikle oturacak.`));
    const plan = E.haftalikPlan(st), PY = { okul: 'okul konusu', yol: 'sıradaki konu', temel: 'temel', guclen: 'güçlendirme', geride: 'okulda geçilen konu', tekrar: 'tekrar', gun: 'gün' };
    L.push(`📋 Bu haftanın planı (${plan.liste.filter(h => h.tamam).length}/${plan.liste.length} tamam): ${plan.liste.map(h => `${h.tamam ? '✅' : '◻️'} ${h.sk ? SKILL[h.sk].title : h.tip === 'gun' ? `haftada ${h.hedef} gün` : `${h.hedef} ${PY[h.tip]}`}`).join(' · ')}`);
    if (fp.bestFormat) L.push(`🧠 En iyi öğrendiği anlatım biçimi: ${FORMATS[fp.bestFormat].name}`);
    L.push(`🧭 Çalışma tarzı: ${fp.pace}${fp.resil !== null ? `, hatadan sonra doğruya dönme oranı %${Math.round(fp.resil * 100)}` : ''}`);
    L.push('ℹ️ Yüzdeler ilk denemedeki cevaplardan hesaplanır; ipucuyla ya da ikinci denemede bulunan cevaplar ayrı sayılır. XP çalışmayı, ustalık ise öğrenmeyi gösterir.');
    L.push('');
    const te0 = E.temelEksikler(st)[0];
    const tip = te0 ? `"${SKILL[te0.sk].title}" konusundaki zorluğun kaynağı "${SKILL[te0.pre].title}" olabilir. Bu hafta o temeli günlük hayattan örneklerle (market, saat, ölçme) birlikte konuşmanız çok işe yarar.` : fp.weak.length ? `Bu hafta evde "${fp.weak[0].title}" konusunu günlük hayattan bir örnekle konuşmanız (ör. market fişi, saat, ölçme) çok faydalı olur.` : 'Harika gidiyor! Günde 10-15 dakikalık düzenli çalışmayı sürdürmesini destekleyin.';
    L.push(`👨‍👩‍👧 Öneri: ${tip}`);
    // Görsel rapor için: son 7 günün günlük dakikası ve tema bazında ustalık (yalnız çalışılan beceriler)
    const gunluk = []; for (let i = 6; i >= 0; i--) { const t0 = new Date(); t0.setHours(0, 0, 0, 0); const bas = t0.getTime() - i * DAY, son = bas + DAY; gunluk.push({ at: bas, dk: Math.round(st.sessions.filter(s => s.at >= bas && s.at < son).reduce((a, s) => a + s.ms, 0) / 60000) }); }
    const temalar = (typeof THEMES !== 'undefined' ? THEMES : []).map(th => { const sk = SKILLS.filter(s => s.theme === th.id && st.skills[s.id].n > 0); return { id: th.id, no: th.no, ad: th.title, ikon: th.icon, renk: th.color, n: sk.length, top: SKILLS.filter(s => s.theme === th.id).length, m: sk.length ? sk.reduce((a, s) => a + E.eff(st.skills[s.id]), 0) / sk.length : null }; });
    return { text: L.join('\n'), mins, xp, acc, daysActive, lessons: ses.length, qn, fp, act, olasi, fixed, probIcgoru, tip, gunluk, temalar, okul, geride, temelL, plan };
  };


  /* ---------------- Görevler (günlük + aylık) ---------------- */
  const QPOOL = [
    { id: 'xp50', ad: '50 XP kazan', hedef: 50, m: 'xp', odul: 10, ikon: '⚡' },
    { id: 'ders3', ad: '3 ders tamamla', hedef: 3, m: 'ders', odul: 15, ikon: '📘' },
    { id: 'acc90', ad: '2 derste %90\'a ulaş', hedef: 2, m: 'acc90', odul: 15, ikon: '🎯' },
    { id: 'hatasiz', ad: '1 dersi hatasız bitir', hedef: 1, m: 'hatasiz', odul: 20, ikon: '💎' },
    { id: 'telafi3', ad: '3 hatanı telafi et', hedef: 3, m: 'telafi', odul: 15, ikon: '🌱' },
    { id: 'seri5', ad: '5\'li doğru serisi yap', hedef: 1, m: 'seri5', odul: 15, ikon: '🔥' },
    { id: 'eslestir2', ad: '2 eşleştirme sorusu çöz', hedef: 2, m: 'eslestir', odul: 10, ikon: '🧩' },
    { id: 'tekrar1', ad: '1 tekrar ya da hata dersi yap', hedef: 1, m: 'tekrar', odul: 10, ikon: '⏰' },
  ];
  const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const hash = (s) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  E.MONTH_TARGET = 30;
  E.quests = (st) => {
    const d = today();
    if (!st.quests || st.quests.day !== d) st.quests = { day: d, prog: {}, claimed: [] };
    const mk = d.slice(0, 7); if (!st.month || st.month.key !== mk) st.month = { key: mk, done: 0, claimed: false };
    const h = hash(d), ids = [], pool = QPOOL.slice(); while (ids.length < 3) { const i = (h + ids.length * 7919) % pool.length; ids.push(pool.splice(i, 1)[0]); }
    return { list: ids.map(q => ({ ...q, v: Math.min(q.hedef, st.quests.prog[q.m] || 0), ok: st.quests.claimed.includes(q.id) })), month: { ad: `${AYLAR[+mk.slice(5) - 1]} Görevi`, done: st.month.done, hedef: E.MONTH_TARGET, claimed: st.month.claimed } };
  };
  E.questTick = (st, ses, acc) => {
    E.quests(st); const P = st.quests.prog, add = (k, v) => { P[k] = (P[k] || 0) + v; };
    add('xp', ses.xp); if (['lesson', 'learn', 'review', 'mistakes', 'mix', 'exam', 'hazir', 'hata', 'atolye'].includes(ses.mode)) add('ders', 1);
    if (acc >= 0.9 && ses.answered.length >= 5) add('acc90', 1); if (ses.wrong === 0 && ses.answered.length >= 5) add('hatasiz', 1);
    add('telafi', ses.rescueOk || 0); if (ses.best >= 5) add('seri5', 1); add('eslestir', ses.matches || 0); if (ses.mode === 'review' || ses.mode === 'mistakes') add('tekrar', 1);
    const got = [];
    for (const q of E.quests(st).list) if (!q.ok && q.v >= q.hedef) { st.quests.claimed.push(q.id); st.gems += q.odul; st.month.done++; got.push(q); }
    let monthDone = false; if (!st.month.claimed && st.month.done >= E.MONTH_TARGET) { st.month.claimed = true; st.gems += 100; monthDone = true; }
    return { got, monthDone };
  };

  /* ---------------- Haftalık lig devri ---------------- */
  E.rollWeek = (st) => {
    const ws = weekStart();
    if (st.week.start === ws) return null;
    const L = E.league(st, st.week.start), rank = L.rows.findIndex(r => r.me) + 1, from = st.league.tier || 0;
    const ilkHafta = !st.league.last; // ilk haftasında çocuk ligden düşmez (yeni başlayanı kırmamak için)
    let to = from; if (st.week.xp > 0 && rank <= 3) to = Math.min(TIERS.length - 1, from + 1); else if (rank >= 8 && !ilkHafta) to = Math.max(0, from - 1);
    if (st.week.xp > 0 && rank <= 3) st.top3 = (st.top3 || 0) + 1;
    st.league = { tier: to, last: { rank, from, to, xp: st.week.xp } };
    st.week = { start: ws, xp: 0 };
    return st.league.last;
  };

  /* ---------------- Lig (demo rakipler) ---------------- */
  const TIERS = ['Bronz', 'Gümüş', 'Altın', 'Zümrüt', 'Elmas'];
  E.TIERS = TIERS;
  E.league = (st, wsArg) => {
    const ws = wsArg || st.week.start, seed = (s) => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };
    const names = ['Kuzey', 'Lina', 'Toprak', 'Masal', 'Atlas', 'İnci', 'Poyraz', 'Eylül', 'Bulut'];
    const elapsed = Math.min(1, (Date.now() - ws) / (7 * DAY));
    const rows = names.map((n, i) => ({ name: n, demo: true, xp: Math.round((80 + seed(ws / 1e7 + i) * 520) * (0.08 + elapsed * 0.92)) })); // hafta başında rakipler de sıfıra yakın başlar
    rows.push({ name: (st.profile && st.profile.name) || 'Sen', me: true, xp: st.week.xp });
    rows.sort((a, b) => b.xp - a.xp);
    return { tier: TIERS[st.league.tier || 0], ilkHafta: !st.league.last, rows, daysLeft: Math.max(0, Math.ceil((ws + 7 * DAY - Date.now()) / DAY)) };
  };

  G.MY_E = E;
  if (isNode) module.exports = E;
})(typeof window !== 'undefined' ? window : globalThis);
