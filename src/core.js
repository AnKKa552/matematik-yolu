/* ============================================================
   Matematik Yolu — çekirdek yardımcılar + SVG görselleri
   Not: Tüm sayısal cevaplar KODLA hesaplanır (LLM yok) → hatasız.
   ============================================================ */
(function (G) {
  'use strict';
  const U = {};
  U.ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));       // [a,b] tam sayı
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  U.gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
  U.NB = ' ';
  // 15702436 -> "15 702 436" (kitaptaki gibi boşluklu)
  U.fmtN = (n) => { const s = String(Math.round(n)); return s.replace(/\B(?=(\d{3})+(?!\d))/g, U.NB); };
  // ondalık virgül: 0.25 -> "0,25"
  U.fmtD = (x, dp) => { let s = (dp === undefined) ? String(+x.toFixed(6)) : x.toFixed(dp); return s.replace('.', ','); };
  U.fr = (n, d) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
  U.mixed = (w, n, d) => `<span class="mx">${w}${U.fr(n, d)}</span>`;
  U.norm = (s) => String(s).trim().toLowerCase().replace(/[\s  ]/g, '').replace(/\./g, '').replace('%', '%');
  // Sayısal giriş karşılaştırma: "0,5" "0.5" " 0,50 " hepsi eşit
  U.numEq = (input, target) => {
    const clean = (v) => String(v).replace(/[\s  ]/g, '').replace('%', '').replace(',', '.');
    const a = parseFloat(clean(input)), b = parseFloat(clean(target));
    if (isNaN(a) || isNaN(b)) return U.norm(input) === U.norm(target);
    return Math.abs(a - b) < 1e-9;
  };

  /* -------- Türkçe sayı okunuşu (milyara kadar) -------- */
  const ONES = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
  const TENS = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
  function three(n) {
    const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), o = n % 10, p = [];
    if (h) p.push(h === 1 ? 'yüz' : ONES[h] + ' yüz');
    if (t) p.push(TENS[t]);
    if (o) p.push(ONES[o]);
    return p.join(' ');
  }
  U.words = function (n) {
    if (n === 0) return 'sıfır';
    const names = ['', 'bin', 'milyon', 'milyar'], parts = [];
    let g = 0;
    while (n > 0) {
      const chunk = n % 1000;
      if (chunk) {
        let w = (g === 1 && chunk === 1) ? '' : three(chunk);
        parts.unshift((w + ' ' + names[g]).trim());
      }
      n = Math.floor(n / 1000); g++;
    }
    return parts.join(' ').replace(/\s+/g, ' ');
  };
  /* -------- Türkçe ek uyumu: 12'nin, 40'ın, 3'er, 11.40'ta, Yusuf'un -------- */
  U.ek = function (word, kind) {
    const w = String(word).toLocaleLowerCase('tr-TR').trim(), V = 'aeıioöuü';
    let lv = 'e'; for (let i = w.length - 1; i >= 0; i--) if (V.includes(w[i])) { lv = w[i]; break; }
    const back = 'aıou'.includes(lv), round = 'ouöü'.includes(lv), endV = V.includes(w[w.length - 1]), hard = 'fstkçşhp'.includes(w[w.length - 1]);
    const i4 = back ? (round ? 'u' : 'ı') : (round ? 'ü' : 'i'), a2 = back ? 'a' : 'e';
    switch (kind) {
      case 'in': return (endV ? 'n' : '') + i4 + 'n';          // ilgi: 'nin
      case 'e': return (endV ? 'y' : '') + a2;             // yönelme: 'ye
      case 'de': return (hard ? 't' : 'd') + a2;           // bulunma: 'de
      case 'den': return (hard ? 't' : 'd') + a2 + 'n';    // ayrılma: 'den
      case 'i': return (endV ? 'y' : '') + i4;             // belirtme: 'yi
      case 'er': return (endV ? 'ş' : '') + a2 + 'r';      // üleştirme: 'şer
    }
    return '';
  };
  U.lastWord = (n) => { const ws = U.words(n).split(' '); return ws[ws.length - 1]; };
  U.nk = (n, kind) => `${n}'${U.ek(U.lastWord(n), kind)}`;             // sayı + ek
  U.wk = (word, kind) => `${word}'${U.ek(word, kind)}`;                 // özel ad + ek
  U.tk = (h, m, kind) => `${String(h).padStart(2, '0')}.${String(m).padStart(2, '0')}'${U.ek(U.lastWord(m || h), kind)}`; // saat + ek
  U.toSpeech = (html) => {
    let s = String(html).replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, (m, n, d) => { const dn = +d, nn = +n; return (isNaN(dn) || isNaN(nn)) ? ` ${n} bölü ${d} ` : ` ${U.words(dn)}${U.ek(U.lastWord(dn), 'de')} ${U.words(nn)} `; });
    s = s.replace(/<[^>]+>/g, ' ').replace(/(\d)[  ](?=\d{3})/g, '$1').replace(/×/g, ' çarpı ').replace(/÷/g, ' bölü ').replace(/−/g, ' eksi ').replace(/\+/g, ' artı ').replace(/=/g, ' eşittir ')
      .replace(/%(\d+)/g, 'yüzde $1').replace(/²/g, ' kare').replace(/³/g, ' küp').replace(/°/g, ' derece').replace(/\.{3,}/g, ' boşluk ').replace(/⊥/g, ' diktir ').replace(/\/\//g, ' paraleldir ').replace(/[▲]/g, ' üçgen ').replace(/\s+/g, ' ');
    return s.trim();
  };
  U.cap = (s) => s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);

  /* =================== SVG GÖRSELLER =================== */
  const V = {};
  const svg = (w, h, inner, label) => `<svg class="vis" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label || 'şekil'}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  const rad = (d) => d * Math.PI / 180;

  // Kesir şeridi: n parça, k boyalı
  V.bar = (k, n, label) => {
    const W = 300, H = 56, w = (W - 8) / n; let s = '';
    for (let i = 0; i < n; i++) s += `<rect x="${4 + i * w}" y="8" width="${w}" height="40" rx="3" class="${i < k ? 'f1' : 'f0'}"/>`;
    return svg(W, H, s, label || `${n} eş parçadan ${k} tanesi boyalı`);
  };
  // Pasta modeli
  V.pie = (k, n, label) => {
    const R = 52, cx = 60, cy = 60; let s = '';
    if (n === 1) return svg(120, 120, `<circle cx="${cx}" cy="${cy}" r="${R}" class="${k ? 'f1' : 'f0'}"/>`, label);
    for (let i = 0; i < n; i++) {
      const a0 = rad(-90 + 360 * i / n), a1 = rad(-90 + 360 * (i + 1) / n);
      const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0), x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
      s += `<path d="M${cx},${cy} L${x0.toFixed(2)},${y0.toFixed(2)} A${R},${R} 0 0 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z" class="${i < k ? 'f1' : 'f0'}"/>`;
    }
    return svg(120, 120, s, label || `${n} dilimden ${k} tanesi boyalı daire`);
  };
  // Yüzlük tablo
  V.grid100 = (k) => {
    let s = '';
    for (let i = 0; i < 100; i++) { const r = Math.floor(i / 10), c = i % 10; s += `<rect x="${4 + c * 16}" y="${4 + r * 16}" width="15" height="15" rx="2" class="${i < k ? 'f1' : 'f0'}"/>`; }
    return svg(168, 168, s, `100 kareden ${k} tanesi boyalı`);
  };
  // Açı (derece) — kol uzunlukları ayrı
  V.angle = (deg, opts = {}) => {
    const L1 = opts.l1 || 110, L2 = opts.l2 || 110, rot = opts.rot || 0, W = 260, H = 170;
    const cx = opts.cx || 130, cy = opts.cy || 140;
    const a0 = rad(-rot), a1 = rad(-(rot + deg));
    const x0 = cx + L1 * Math.cos(a0), y0 = cy + L1 * Math.sin(a0), x1 = cx + L2 * Math.cos(a1), y1 = cy + L2 * Math.sin(a1);
    let arc = '';
    if (deg === 90) {
      const r = 18, p1x = cx + r * Math.cos(a0), p1y = cy + r * Math.sin(a0), p2x = cx + r * Math.cos(a1), p2y = cy + r * Math.sin(a1);
      const qx = cx + r * Math.SQRT2 * Math.cos(rad(-(rot + 45))), qy = cy + r * Math.SQRT2 * Math.sin(rad(-(rot + 45)));
      arc = `<path d="M${p1x},${p1y} L${qx},${qy} L${p2x},${p2y}" class="ln thin" fill="none"/>`;
    } else {
      const r = 28, ax0 = cx + r * Math.cos(a0), ay0 = cy + r * Math.sin(a0), ax1 = cx + r * Math.cos(a1), ay1 = cy + r * Math.sin(a1);
      arc = `<path d="M${ax0},${ay0} A${r},${r} 0 ${deg > 180 ? 1 : 0} 0 ${ax1},${ay1}" class="arc" fill="none"/>`;
    }
    const lab = opts.label ? `<text x="${cx + 44 * Math.cos(rad(-(rot + deg / 2)))}" y="${cy + 44 * Math.sin(rad(-(rot + deg / 2))) + 5}" class="tx" text-anchor="middle">${opts.label}</text>` : '';
    return svg(W, H, `<line x1="${cx}" y1="${cy}" x2="${x0}" y2="${y0}" class="ln"/><line x1="${cx}" y1="${cy}" x2="${x1}" y2="${y1}" class="ln"/>${arc}<circle cx="${cx}" cy="${cy}" r="4" class="dot"/>${lab}`, opts.aria || 'açı');
  };
  // Aynı ölçülü, farklı kol uzunluklu iki açı
  V.twoAngles = (deg) => {
    const one = (cx, L) => { const x1 = cx + L * Math.cos(rad(-deg)), y1 = 130 + L * Math.sin(rad(-deg)), r = 22;
      return `<line x1="${cx}" y1="130" x2="${cx + L}" y2="130" class="ln"/><line x1="${cx}" y1="130" x2="${x1}" y2="${y1}" class="ln"/><path d="M${cx + r},130 A${r},${r} 0 0 0 ${cx + r * Math.cos(rad(-deg))},${130 + r * Math.sin(rad(-deg))}" class="arc" fill="none"/><circle cx="${cx}" cy="130" r="4" class="dot"/>`; };
    return svg(300, 150, one(20, 60) + `<text x="50" y="148" class="tx sm" text-anchor="middle">1. açı</text>` + one(130, 150) + `<text x="200" y="148" class="tx sm" text-anchor="middle">2. açı</text>`, 'kol uzunlukları farklı iki açı');
  };
  // Doğru / ışın / doğru parçası
  V.lineKind = (kind) => {
    const y = 45; let s = '';
    const arrow = (x, dir) => `<path d="M${x},${y} l${-12 * dir},-7 l0,14 Z" class="dot"/>`;
    if (kind === 'dp') s = `<line x1="50" y1="${y}" x2="230" y2="${y}" class="ln"/><circle cx="50" cy="${y}" r="5" class="dot"/><circle cx="230" cy="${y}" r="5" class="dot"/><text x="50" y="${y + 28}" class="tx" text-anchor="middle">A</text><text x="230" y="${y + 28}" class="tx" text-anchor="middle">B</text>`;
    if (kind === 'isin') s = `<line x1="50" y1="${y}" x2="262" y2="${y}" class="ln"/>${arrow(270, 1)}<circle cx="50" cy="${y}" r="5" class="dot"/><circle cx="170" cy="${y}" r="5" class="dot"/><text x="50" y="${y + 28}" class="tx" text-anchor="middle">A</text><text x="170" y="${y + 28}" class="tx" text-anchor="middle">B</text>`;
    if (kind === 'dogru') s = `<line x1="18" y1="${y}" x2="262" y2="${y}" class="ln"/>${arrow(10, -1)}${arrow(270, 1)}<circle cx="90" cy="${y}" r="5" class="dot"/><circle cx="190" cy="${y}" r="5" class="dot"/><text x="90" y="${y + 28}" class="tx" text-anchor="middle">A</text><text x="190" y="${y + 28}" class="tx" text-anchor="middle">B</text>`;
    if (kind === 'nokta') s = `<circle cx="140" cy="${y}" r="6" class="dot"/><text x="140" y="${y + 30}" class="tx" text-anchor="middle">A</text>`;
    return svg(280, 90, s, 'geometrik çizim');
  };
  // İki doğru: 'dik' | 'paralel' | 'kesisen'
  V.twoLines = (rel, rot) => {
    rot = rot || 0; const cx = 140, cy = 85, L = 120;
    const seg = (ang, ox = 0, oy = 0) => { const a = rad(ang); return `<line x1="${cx + ox - L * Math.cos(a)}" y1="${cy + oy - L * Math.sin(a)}" x2="${cx + ox + L * Math.cos(a)}" y2="${cy + oy + L * Math.sin(a)}" class="ln"/>`; };
    let s = '';
    if (rel === 'paralel') { const a = rad(rot + 90); s = seg(rot, 32 * Math.cos(a), 32 * Math.sin(a)) + seg(rot, -32 * Math.cos(a), -32 * Math.sin(a)); }
    if (rel === 'dik') {
      s = seg(rot) + seg(rot + 90);
      const r = 16, a0 = rad(rot), a1 = rad(rot + 90), aq = rad(rot + 45);
      s += `<path d="M${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} L${cx + r * Math.SQRT2 * Math.cos(aq)},${cy + r * Math.SQRT2 * Math.sin(aq)} L${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)}" class="ln thin" fill="none"/>`;
    }
    if (rel === 'kesisen') s = seg(rot) + seg(rot + 55);
    s += `<text x="16" y="20" class="tx">d</text><text x="250" y="20" class="tx">k</text>`;
    return svg(280, 170, s, 'iki doğru');
  };
  // Düzgün çokgen
  V.polygon = (n, diag) => {
    const cx = 90, cy = 88, R = 70, pts = [];
    for (let i = 0; i < n; i++) { const a = rad(-90 + 360 * i / n); pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); }
    let s = `<polygon points="${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" class="f2 ln"/>`;
    if (diag) for (let j = 2; j < n - 1; j++) s += `<line x1="${pts[0][0]}" y1="${pts[0][1]}" x2="${pts[j][0]}" y2="${pts[j][1]}" class="ln thin dash"/>`;
    pts.forEach(p => { s += `<circle cx="${p[0]}" cy="${p[1]}" r="4" class="dot"/>`; });
    return svg(180, 176, s, `${n} kenarlı düzgün çokgen`);
  };
  // Çember (merkez, yarıçap veya çap)
  V.circle = (show, val) => {
    const cx = 90, cy = 85, R = 66;
    let s = `<circle cx="${cx}" cy="${cy}" r="${R}" class="f2 ln"/><circle cx="${cx}" cy="${cy}" r="4" class="dot"/><text x="${cx - 6}" y="${cy + 20}" class="tx">O</text>`;
    if (show === 'r') s += `<line x1="${cx}" y1="${cy}" x2="${cx + R}" y2="${cy}" class="ln"/><text x="${cx + R / 2}" y="${cy - 8}" class="tx" text-anchor="middle">${val}</text>`;
    if (show === 'd') s += `<line x1="${cx - R}" y1="${cy}" x2="${cx + R}" y2="${cy}" class="ln"/><text x="${cx + R / 2}" y="${cy - 8}" class="tx" text-anchor="middle">${val}</text>`;
    return svg(180, 172, s, 'çember');
  };
  // Dikdörtgen (a x b), opsiyonel kareli
  V.rect = (a, b, unit, grid) => {
    // Sağdaki kenar etiketi (örn. "14 cm") kesilmesin: şekil biraz sola, çizim alanı 280 birim
    const sc = Math.min(180 / a, 110 / b), w = a * sc, h = b * sc, x = (280 - w) / 2 - 16, y = 24;
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="f2 ln"/>`;
    if (grid) { for (let i = 1; i < a; i++) s += `<line x1="${x + i * sc}" y1="${y}" x2="${x + i * sc}" y2="${y + h}" class="ln thin"/>`; for (let j = 1; j < b; j++) s += `<line x1="${x}" y1="${y + j * sc}" x2="${x + w}" y2="${y + j * sc}" class="ln thin"/>`; }
    if (unit) s += `<text x="${x + w / 2}" y="${y - 7}" class="tx" text-anchor="middle">${a} ${unit}</text><text x="${x + w + 8}" y="${y + h / 2 + 5}" class="tx">${b} ${unit}</text>`;
    return svg(280, y + h + 14, s, `dikdörtgen ${a} ${unit || 'birim'} ve ${b} ${unit || 'birim'}`);
  };
  // Sütun grafiği
  V.barChart = (cats, vals, opts = {}) => {
    const W = 300, H = 200, x0 = 34, y0 = 166, top = 16, max = opts.max || Math.max(...vals), min = opts.min || 0;
    const bw = (W - x0 - 10) / cats.length; let s = '';
    const steps = opts.step ? Math.round((max - min) / opts.step) : 4;
    for (let i = 0; i <= steps; i++) { const v = min + (max - min) * i / steps, y = y0 - (y0 - top) * i / steps; s += `<line x1="${x0}" y1="${y}" x2="${W - 6}" y2="${y}" class="ln grid"/><text x="${x0 - 5}" y="${y + 4}" class="tx sm" text-anchor="end">${String(+v.toFixed(1)).replace('.', ',')}</text>`; }
    cats.forEach((c, i) => { const h = (vals[i] - min) / (max - min) * (y0 - top); s += `<rect x="${x0 + i * bw + bw * 0.18}" y="${y0 - h}" width="${bw * 0.64}" height="${h}" rx="3" class="c${i % 6}"/><text x="${x0 + i * bw + bw / 2}" y="${y0 + 16}" class="tx sm" text-anchor="middle">${c}</text>`; });
    s += `<line x1="${x0}" y1="${y0}" x2="${W - 6}" y2="${y0}" class="ln"/><line x1="${x0}" y1="${top - 6}" x2="${x0}" y2="${y0}" class="ln"/>`;
    return svg(W, H, s, opts.aria || 'sütun grafiği');
  };
  // Daire grafiği (oranlar toplamı 1)
  V.pieChart = (cats, parts) => {
    const cx = 80, cy = 80, R = 70; let s = '', a = -90;
    parts.forEach((p, i) => {
      const a1 = a + 360 * p, la = (a1 - a) > 180 ? 1 : 0;
      const x0 = cx + R * Math.cos(rad(a)), y0 = cy + R * Math.sin(rad(a)), x1 = cx + R * Math.cos(rad(a1)), y1 = cy + R * Math.sin(rad(a1));
      s += p >= 0.999 ? `<circle cx="${cx}" cy="${cy}" r="${R}" class="c${i}"/>` : `<path d="M${cx},${cy} L${x0},${y0} A${R},${R} 0 ${la} 1 ${x1},${y1} Z" class="c${i} sep"/>`;
      a = a1;
    });
    cats.forEach((c, i) => { s += `<rect x="172" y="${18 + i * 24}" width="14" height="14" rx="3" class="c${i}"/><text x="192" y="${30 + i * 24}" class="tx sm">${c}</text>`; });
    return svg(300, 164, s, 'daire grafiği');
  };
  // Nokta grafiği
  V.dotPlot = (cats, vals) => {
    const W = 300, x0 = 10, bw = (W - 20) / cats.length, maxv = Math.max(...vals), H = 40 + maxv * 18; let s = '';
    cats.forEach((c, i) => { for (let k = 0; k < vals[i]; k++) s += `<circle cx="${x0 + i * bw + bw / 2}" cy="${H - 32 - k * 18}" r="7" class="c${i % 6}"/>`; s += `<text x="${x0 + i * bw + bw / 2}" y="${H - 6}" class="tx sm" text-anchor="middle">${c}</text>`; });
    s += `<line x1="6" y1="${H - 22}" x2="${W - 6}" y2="${H - 22}" class="ln"/>`;
    return svg(W, H, s, 'nokta grafiği');
  };
  // Terazi: sol ve sağ kefe etiketleri
  V.balance = (left, right) => {
    const box = (items, cx) => items.map((t, i) => `<g><rect x="${cx - items.length * 22 + i * 44 + 2}" y="62" width="40" height="30" rx="6" class="${t === '?' ? 'c3' : 'c1'}"/><text x="${cx - items.length * 22 + i * 44 + 22}" y="82" class="tx w" text-anchor="middle">${t}</text></g>`).join('');
    const s = `<polygon points="150,150 136,176 164,176" class="f2 ln"/><line x1="150" y1="98" x2="150" y2="150" class="ln"/><line x1="30" y1="98" x2="270" y2="98" class="ln thick"/>${box(left, 75)}${box(right, 225)}`;
    return svg(300, 182, s, 'dengedeki terazi');
  };
  // Çark (olasılık): renk dizisi
  V.spinner = (colors) => {
    const n = colors.length, cx = 90, cy = 88, R = 74; let s = '';
    colors.forEach((c, i) => {
      const a0 = rad(-90 + 360 * i / n), a1 = rad(-90 + 360 * (i + 1) / n);
      s += n === 1 ? `<circle cx="${cx}" cy="${cy}" r="${R}" class="${c}"/>` : `<path d="M${cx},${cy} L${cx + R * Math.cos(a0)},${cy + R * Math.sin(a0)} A${R},${R} 0 0 1 ${cx + R * Math.cos(a1)},${cy + R * Math.sin(a1)} Z" class="${c} sep"/>`;
    });
    s += `<circle cx="${cx}" cy="${cy}" r="8" class="dot"/><path d="M${cx},${cy - 4} L${cx + 6},${cy - 52} L${cx - 6},${cy - 52} Z" class="dot" transform="rotate(25 ${cx} ${cy})"/>`;
    return svg(180, 176, s, 'çark');
  };
  // Şekil örüntüsü: adım k → f(k) nokta, üçgen dizilim
  V.dotPattern = (fn, steps) => {
    let s = '', x = 10;
    for (let k = 1; k <= steps; k++) {
      const n = fn(k), cols = Math.ceil(Math.sqrt(n)), w = cols * 13;
      for (let i = 0; i < n; i++) s += `<circle cx="${x + (i % cols) * 13 + 6}" cy="${110 - Math.floor(i / cols) * 13}" r="5" class="c${k % 6}"/>`;
      s += `<text x="${x + w / 2}" y="134" class="tx sm" text-anchor="middle">${k}. adım</text>`;
      x += Math.max(w, 56) + 18;
    }
    return svg(Math.max(x, 200), 142, s, 'şekil örüntüsü');
  };
  // Sayı doğrusu
  V.numberLine = (a, b, marks, pt) => {
    const x0 = 20, x1 = 280, sc = (x1 - x0) / (b - a); let s = `<line x1="${x0}" y1="40" x2="${x1}" y2="40" class="ln"/>`;
    marks.forEach(m => { const x = x0 + (m.v - a) * sc; s += `<line x1="${x}" y1="32" x2="${x}" y2="48" class="ln"/><text x="${x}" y="68" class="tx sm" text-anchor="middle">${m.t}</text>`; });
    if (pt !== undefined) s += `<circle cx="${x0 + (pt - a) * sc}" cy="40" r="7" class="c3"/>`;
    return svg(300, 80, s, 'sayı doğrusu');
  };
  // İki kesişen doğru: bir açı etiketli (ters/komşu)
  V.crossAngles = (a, labels) => {
    const cx = 140, cy = 80, L = 115, r1 = rad(-a / 2), r2 = rad(180 - a / 2);
    const l1 = rad(a / 2), l2 = rad(180 + a / 2);
    let s = `<line x1="${cx + L * Math.cos(l2)}" y1="${cy + L * Math.sin(l2)}" x2="${cx + L * Math.cos(l1)}" y2="${cy + L * Math.sin(l1)}" class="ln"/>` +
      `<line x1="${cx + L * Math.cos(r2)}" y1="${cy + L * Math.sin(r2)}" x2="${cx + L * Math.cos(r1)}" y2="${cy + L * Math.sin(r1)}" class="ln"/>`;
    const put = (ang, t) => `<text x="${cx + 40 * Math.cos(rad(ang))}" y="${cy + 40 * Math.sin(rad(ang)) + 5}" class="tx" text-anchor="middle">${t}</text>`;
    s += put(0, labels[0]) + put(90, labels[1]) + put(180, labels[2]) + put(270, labels[3]);
    return svg(280, 160, s, 'kesişen iki doğru');
  };
  G.MY_U = U; G.MY_V = V;
  if (typeof module !== 'undefined') module.exports = { U, V };
})(typeof window !== 'undefined' ? window : globalThis);
