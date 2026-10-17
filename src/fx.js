/* ============================================================
   Matematik Yolu — Kutlama efektleri (doğru cevap animasyonları)
   Kademeli: normal doğru → 5 farklı efektten biri (sıkılmasın diye dönüşümlü)
             3'lü seri → Seri Ateşi, 5'li → DURDURULAMAZ, 8+ → EFSANE
             telafi doğru → Filiz (hatadan öğrendin)
   Süre ~1,2 sn, ekrana dokununca geçilir, "hareketi azalt" açıksa sade.
   ============================================================ */
(function (G) {
  'use strict';
  const FX = {};
  const COLORS = ['#5B4BFF', '#FF9F1C', '#22CDBE', '#EC4899', '#1FBF62', '#FFC531', '#3B82F6'];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  let layer = null, cv = null, ctx = null, parts = [], raf = 0, endAt = 0, lastFx = -1;
  const reduced = () => G.matchMedia && G.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ensure() {
    if (layer && document.body.contains(layer)) return;
    layer = document.createElement('div'); layer.className = 'fx-layer'; layer.setAttribute('aria-hidden', 'true');
    cv = document.createElement('canvas'); cv.className = 'fx-canvas'; layer.appendChild(cv);
    document.body.appendChild(layer); ctx = cv.getContext('2d');
    layer.addEventListener('pointerdown', () => FX.stop());
  }
  function size() { const d = G.devicePixelRatio || 1; cv.width = innerWidth * d; cv.height = innerHeight * d; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px'; ctx.setTransform(d, 0, 0, d, 0, 0); }

  /* ---------- parçacık türleri ---------- */
  const P = {
    spark(x, y, vx, vy, c, life, sz) { return { k: 'spark', x, y, vx, vy, c, life, max: life, sz: sz || rnd(3, 6), g: 0.12, drag: 0.985 }; },
    star(x, y, vx, vy, c, life, sz) { return { k: 'star', x, y, vx, vy, c, life, max: life, sz: sz || rnd(7, 13), rot: rnd(0, 6), vr: rnd(-.2, .2), g: 0.06, drag: 0.97 }; },
    conf(x, y, vx, vy, c, life) { return { k: 'conf', x, y, vx, vy, c, life, max: life, w: rnd(6, 11), h: rnd(3, 6), rot: rnd(0, 6), vr: rnd(-.3, .3), g: 0.22, drag: 0.985 }; },
    emoji(x, y, vx, vy, e, life, sz) { return { k: 'emoji', x, y, vx, vy, e, life, max: life, sz: sz || rnd(22, 36), rot: rnd(-.4, .4), vr: rnd(-.05, .05), g: 0.15, drag: 0.99 }; },
    ring(x, y, c, life, r1) { return { k: 'ring', x, y, c, life, max: life, r: 4, r1: r1 || 120 }; },
    rocket(x, y, vy, c, life, onPop) { return { k: 'rocket', x, y, vx: rnd(-.6, .6), vy, c, life, max: life, onPop, g: 0.05, drag: 1 }; },
  };
  function starPath(c, r) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); }
  function loop() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const next = [];
    for (const p of parts) {
      p.life--;
      if (p.k === 'ring') { const t = 1 - p.life / p.max; p.r = 4 + (p.r1 - 4) * (1 - Math.pow(1 - t, 3)); ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.strokeStyle = p.c; ctx.lineWidth = 6 * (p.life / p.max) + 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke(); }
      else {
        p.vx *= p.drag; p.vy = p.vy * p.drag + p.g; p.x += p.vx; p.y += p.vy; if (p.vr) p.rot += p.vr;
        const a = Math.min(1, p.life / (p.max * 0.35)); ctx.globalAlpha = Math.max(0, a);
        if (p.k === 'spark') { ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * a + .5, 0, Math.PI * 2); ctx.fill(); }
        if (p.k === 'star') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; starPath(ctx, p.sz); ctx.fill(); ctx.restore(); }
        if (p.k === 'conf') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); }
        if (p.k === 'emoji') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.font = `${p.sz}px system-ui, "Apple Color Emoji", "Noto Color Emoji", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.e, 0, 0); ctx.restore(); }
        if (p.k === 'rocket') { ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); if (Math.random() < .9) next.push(P.spark(p.x + rnd(-2, 2), p.y + 4, rnd(-.5, .5), rnd(.5, 2), '#FFC531', 22, 2.2)); if ((p.vy >= -1 || p.life <= 0) && p.onPop) { p.onPop(p.x, p.y); p.onPop = null; p.life = 0; } }
      }
      if (p.life > 0) next.push(p);
    }
    ctx.globalAlpha = 1; parts = next.concat(pending); pending = [];
    if (parts.length || performance.now() < endAt) raf = requestAnimationFrame(loop); else FX.stop();
  }
  let pending = [];
  const add = (p) => pending.push(p);
  function burst(x, y, n, kind, colors, speed, life) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = rnd(speed * .35, speed); add(P[kind](x, y, Math.cos(a) * s, Math.sin(a) * s, pick(colors || COLORS), life || rnd(40, 70))); } }
  function firework(x, y, col) { const c = col || pick(COLORS); add(P.ring(x, y, c, 26, 70)); for (let i = 0; i < 46; i++) { const a = i / 46 * Math.PI * 2, s = rnd(3.2, 5.2); add(P.spark(x, y, Math.cos(a) * s, Math.sin(a) * s, i % 3 ? c : '#FFFFFF', rnd(45, 65), rnd(2.5, 4))); } }

  /* ---------- yazı + maskot katmanı ---------- */
  function banner(text, cls, sub) {
    const b = document.createElement('div'); b.className = 'fx-banner ' + (cls || '');
    b.innerHTML = `<span class="fx-word">${text}</span>${sub ? `<span class="fx-sub">${sub}</span>` : ''}`;
    layer.appendChild(b);
    // Yazı soru metninin üstünü kapatmasın: geri bildirim kartı çıkınca onun hemen üstüne yerleşir
    const yerlestir = () => { const k = document.querySelector('.sheet'); if (k) { const r = k.getBoundingClientRect(); b.style.top = Math.max(80, r.top - 34) + 'px'; b.classList.add('kartta'); } };
    requestAnimationFrame(() => requestAnimationFrame(yerlestir)); setTimeout(yerlestir, 120);
    return b;
  }
  function flyXP(n, from) {
    const e = document.createElement('div'); e.className = 'fx-xp'; e.textContent = `+${n} XP`;
    e.style.left = (from ? from.x : innerWidth / 2) + 'px'; e.style.top = (from ? from.y : innerHeight * .6) + 'px';
    layer.appendChild(e);
  }
  function heroPi(mode) {
    const m = document.createElement('div'); m.className = 'fx-pi ' + (mode || '');
    m.innerHTML = G.MY_MASCOT ? G.MY_MASCOT('happy', 120) : '';
    layer.appendChild(m);
    if (mode === 'rocket') { const r = document.createElement('div'); r.className = 'fx-flame'; m.appendChild(r); }
  }

  /* ---------- efekt kataloğu ---------- */
  const W = () => innerWidth, H = () => innerHeight;
  const EFFECTS = [
    // 0 Yıldız patlaması: kontrol butonundan yıldızlar fışkırır
    (o) => { const x = o.x, y = o.y; add(P.ring(x, y, '#FFC531', 30, 160)); burst(x, y, 34, 'star', ['#FFC531', '#FF9F1C', '#FFFFFF', '#5B4BFF'], 9, 60); burst(x, y, 30, 'spark', null, 7, 45); },
    // 1 Konfeti topu: iki yandan
    (o) => { for (let s = 0; s < 2; s++) { const x = s ? W() + 10 : -10, y = H() * .72; for (let i = 0; i < 70; i++) { const a = (s ? -Math.PI + .5 : -.5) - rnd(.25, 1.05) * (s ? -1 : 1); const sp = rnd(9, 17); add(P.conf(x, y, Math.cos(a) * sp * (s ? 1 : 1), Math.sin(a) * sp, pick(COLORS), rnd(70, 100))); } } },
    // 2 Havai fişek: üç roket
    (o) => { for (let i = 0; i < 3; i++) setTimeout(() => add(P.rocket(W() * (.25 + .25 * i), H() + 5, rnd(-13, -10.5), '#FFFFFF', 90, (x, y) => firework(x, y))), i * 140); },
    // 3 Pi roketi: maskot yukarı fırlar, iz bırakır
    (o) => { heroPi('rocket'); for (let i = 0; i < 26; i++) setTimeout(() => add(P.spark(W() / 2 + rnd(-14, 14), H() * .55 - i * 9, rnd(-1.2, 1.2), rnd(1, 3), pick(['#FFC531', '#FF9F1C', '#FF7A1A']), 34, rnd(3, 5))), i * 22); },
    // 4 Emoji yağmuru
    (o) => { const set = pick([['⭐', '🌟', '✨'], ['🎉', '🎊', '⭐'], ['💯', '⭐', '🔥'], ['🧠', '💡', '⭐'], ['🏅', '⭐', '✨']]); for (let i = 0; i < 26; i++) add(P.emoji(rnd(10, W() - 10), rnd(-140, -20), rnd(-.6, .6), rnd(2, 5), pick(set), rnd(80, 110))); },
  ];

  /* ---------- dışa açık API ---------- */
  // opts: { streak, rescue, xp, origin:{x,y}, word }
  FX.correct = (opts = {}) => {
    ensure(); FX.stop(true); ensure(); size();
    const o = Object.assign({ x: W() / 2, y: H() * .78 }, opts.origin || {});
    const st = opts.streak || 1;
    if (reduced()) { banner('✓', 'calm'); flyXP(opts.xp || 10, o); endAt = performance.now() + 900; setTimeout(() => FX.stop(), 900); return 'calm'; }
    let tier = 'normal';
    if (opts.rescue) tier = 'rescue'; else if (st >= 8) tier = 'legend'; else if (st >= 5) tier = 'unstop'; else if (st === 3 || st === 4) tier = 'fire';
    if (tier === 'normal') { let i; do { i = Math.floor(Math.random() * EFFECTS.length); } while (i === lastFx); lastFx = i; EFFECTS[i](o); banner(opts.word || 'Harika!', 'pop'); }
    if (tier === 'fire') { add(P.ring(W() / 2, H() * .42, '#FF7A1A', 34, 170)); for (let i = 0; i < 40; i++) add(P.emoji(W() / 2 + rnd(-60, 60), H() * .52, rnd(-4, 4), rnd(-9, -4), '🔥', rnd(50, 75), rnd(18, 30))); banner(`🔥 ${st} Seri!`, 'fire', 'Seri Ateşi yandı!'); }
    if (tier === 'unstop') { document.getElementById('app')?.classList.add('fx-shake'); firework(W() * .3, H() * .32, '#FFC531'); setTimeout(() => firework(W() * .7, H() * .28, '#EC4899'), 180); setTimeout(() => firework(W() * .5, H() * .2, '#22CDBE'), 360); banner('DURDURULAMAZ!', 'gold', `${st} doğru üst üste`); heroPi('jump'); }
    if (tier === 'legend') { document.getElementById('app')?.classList.add('fx-shake'); for (let i = 0; i < 5; i++) setTimeout(() => firework(rnd(W() * .15, W() * .85), rnd(H() * .15, H() * .45)), i * 150); EFFECTS[1](o); banner('EFSANE!', 'rainbow', `${st} doğru! Matematik ustası!`); heroPi('jump'); }
    if (tier === 'rescue') { const sp = document.createElement('div'); sp.className = 'fx-sprout'; sp.innerHTML = '<span>🌱</span><span>🌿</span><span>🌳</span>'; layer.appendChild(sp); burst(W() / 2, H() * .45, 30, 'spark', ['#1FBF62', '#22CDBE', '#FFC531'], 6, 55); banner('Hatandan öğrendin!', 'grow', 'Gerçek öğrenme budur 💪'); }
    flyXP(opts.xp || 10, o);
    endAt = performance.now() + (tier === 'normal' ? 1100 : 1500);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    setTimeout(() => document.getElementById('app')?.classList.remove('fx-shake'), 600);
    return tier;
  };
  FX.stop = (silent) => { cancelAnimationFrame(raf); parts = []; pending = []; if (layer) { layer.remove(); layer = null; } document.getElementById('app')?.classList.remove('fx-shake'); };
  FX.EFFECT_COUNT = EFFECTS.length;
  G.MY_FX = FX;
})(window);
