/* ============================================================
   Matematik Yolu — Arayüz (tek sayfa, telefona göre)
   ============================================================ */
(function () {
  'use strict';
  const U = window.MY_U, V = window.MY_V, E = window.MY_E, MIS = window.MY_MIS;
  const { THEMES, SKILLS, SKILL, FORMATS, KITAP, GOREV } = window.MY_CUR;
  const $app = document.getElementById('app');
  const A = { st: E.load(), view: 'home', tab: 'yol', theme: 't1', ses: null, q: null, sel: null, input: '', hinted: false, showHint: false, fb: null, modal: null, onb: { step: 0, data: {} }, t0: 0, timer: null, mstate: '' };
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CL = window.MY_CLOUD;
  const save = () => { E.save(A.st); if (CL) CL.kaydet(A.st); };
  const todayXP = () => A.st.days[(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })()] || 0;

  /* ---------------- Ses efektleri (WebAudio, dosyasız) ---------------- */
  let ac = null;
  const tone = (f, d, type = 'sine', when = 0, vol = 0.14) => { if (!A.st.settings.sound) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, ac.currentTime + when); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + when + d); o.connect(g); g.connect(ac.destination); o.start(ac.currentTime + when); o.stop(ac.currentTime + when + d + 0.02); } catch (e) { } };
  // Ses tasarımı (dosyasız, WebAudio): zil + parıltı + whoosh + yumuşak "bonk" (incitmeyen hata sesi)
  const AC = () => { if (!A.st.settings.sound) return null; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac; } catch (e) { return null; } };
  const bell = (f, when = 0, vol = .12, len = .5) => { const c = AC(); if (!c) return; const t = c.currentTime + when; [1, 2.01, 3.02].forEach((m, i) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f * m; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol / (i * 1.8 + 1), t + .008); g.gain.exponentialRampToValueAtTime(0.0001, t + len / (i + 1)); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + len); }); };
  const whoosh = (when = 0, up = true, vol = .08, len = .35) => { const c = AC(); if (!c) return; const t = c.currentTime + when, n = c.sampleRate * len, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); src.buffer = b; f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(up ? 400 : 2400, t); f.frequency.exponentialRampToValueAtTime(up ? 3200 : 300, t + len); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len); src.connect(f); f.connect(g); g.connect(c.destination); src.start(t); };
  const pop = (f = 700, when = 0, vol = .1) => { const c = AC(); if (!c) return; const t = c.currentTime + when, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 2.2, t + .07); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + .12); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + .14); };
  const sfx = {
    ok: () => { bell(1046.5, 0, .11); bell(1568, .09, .1); whoosh(.02, true, .03, .25); },
    bad: () => { tone(196, .18, 'sine', 0, .1); tone(174.6, .22, 'sine', .1, .08); },           // yumuşak, cezalandırmayan
    tap: () => pop(900, 0, .035),
    pair: (k = 0) => { pop(660 + k * 140, 0, .09); bell(1318 + k * 180, .05, .06, .35); },
    win: () => { [523.3, 659.3, 784, 1046.5].forEach((f, i) => bell(f, i * .11, .1, .6)); whoosh(0, true, .05, .6); },
    badge: () => [784, 988, 1175, 1568].forEach((f, i) => bell(f, i * .09, .09, .5)),
    fire: () => { whoosh(0, true, .09, .4); [659.3, 880, 1108.7, 1318.5].forEach((f, i) => bell(f, .05 + i * .06, .08, .35)); },
    unstop: () => { whoosh(0, true, .1, .5); [523.3, 659.3, 784, 1046.5, 1318.5].forEach((f, i) => bell(f, i * .07, .1, .5)); bell(2093, .4, .07, .9); },
    legend: () => { whoosh(0, true, .12, .7); [392, 523.3, 659.3, 784, 1046.5, 1318.5, 1568].forEach((f, i) => bell(f, i * .065, .1, .6)); [1046.5, 1318.5, 1568].forEach(f => bell(f, .55, .07, 1.2)); },
    grow: () => { [440, 554.4, 659.3, 880].forEach((f, i) => bell(f, i * .1, .09, .6)); },
    swoosh: () => whoosh(0, false, .05, .3),
  };

  /* ---------------- Sesli anlatım (cihaz TTS; üretimde ElevenLabs) ---------------- */
  const toSpeech = U.toSpeech;
  /* ---------- Konuşan Pi: ağız, sesin GERÇEK şiddetine göre açılıp kapanır (Web Audio analizi) ----------
     Pi'nin kayıtlı sesleri (Damla) çalarken AnalyserNode ile ses yüksekliği ölçülür → 0 kapalı, 1 yarım, 2 açık.
     Cihaz sesi (robot TTS) analiz edilemez; o konuşurken ağız doğal bir ritimle oynar. Hareketi azalt açıksa ağız oynamaz. */
  const DUDAK = { ac: null, an: null, buf: null, raf: 0, sahte: 0, seviye: 0 };
  const agizYaz = (v) => { if (v === DUDAK.seviye) return; DUDAK.seviye = v; document.querySelectorAll('.pikonus').forEach(e => { e.dataset.agiz = v; e.classList.toggle('konusuyor', v > 0 || !!DUDAK.aktif); }); };
  const dudakDur = () => { cancelAnimationFrame(DUDAK.raf); clearInterval(DUDAK.sahte); DUDAK.sahte = 0; DUDAK.aktif = false; DUDAK.seviye = -1; agizYaz(0); };
  const dudakBagla = (audio) => {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Ses bağlamı yalnız bir dokunuşla açılabilir; açık değilse sesi analize bağlamayız (yoksa ses kısılırdı), ritimli ağız oynar
    if (!DUDAK.ac || DUDAK.ac.state !== 'running') return dudakSahte(audio);
    try {
      DUDAK.ac.createMediaElementSource(audio).connect(DUDAK.an);
    } catch (e) { return dudakSahte(audio); }
    dudakDur(); DUDAK.aktif = true;
    const dongu = () => {
      DUDAK.an.getByteTimeDomainData(DUDAK.buf); let t = 0; for (let i = 0; i < DUDAK.buf.length; i++) { const x = (DUDAK.buf[i] - 128) / 128; t += x * x; }
      const rms = Math.sqrt(t / DUDAK.buf.length); agizYaz(rms > 0.11 ? 2 : rms > 0.035 ? 1 : 0);
      if (!audio.paused && !audio.ended) DUDAK.raf = requestAnimationFrame(dongu); else dudakDur();
    };
    audio.addEventListener('playing', () => { cancelAnimationFrame(DUDAK.raf); DUDAK.raf = requestAnimationFrame(dongu); }, { once: true });
    audio.addEventListener('ended', dudakDur, { once: true }); audio.addEventListener('pause', dudakDur, { once: true });
  };
  document.addEventListener('pointerdown', () => { try { if (!DUDAK.ac) { DUDAK.ac = new (window.AudioContext || window.webkitAudioContext)(); DUDAK.an = DUDAK.ac.createAnalyser(); DUDAK.an.fftSize = 512; DUDAK.an.smoothingTimeConstant = 0.55; DUDAK.an.connect(DUDAK.ac.destination); DUDAK.buf = new Uint8Array(DUDAK.an.fftSize); } if (DUDAK.ac.state === 'suspended') DUDAK.ac.resume(); } catch (e) { } }, { passive: true });
  // Analiz yapılamayan durumda (robot ses ya da eski tarayıcı) doğal ritimli ağız hareketi
  const dudakSahte = (audio) => {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    dudakDur(); DUDAK.aktif = true; let i = 0; const desen = [1, 2, 1, 0, 2, 1, 2, 0, 1, 2, 2, 1, 0];
    DUDAK.sahte = setInterval(() => agizYaz(desen[i++ % desen.length]), 110);
    if (audio) { audio.addEventListener('ended', dudakDur, { once: true }); audio.addEventListener('pause', dudakDur, { once: true }); }
  };
  const ttsSpeak = (text) => { if (!('speechSynthesis' in window)) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.onstart = () => dudakSahte(); u.onend = u.onerror = () => dudakDur(); u.lang = 'tr-TR'; u.rate = 0.95; u.pitch = 1.1; const v = speechSynthesis.getVoices().find(v => /^tr/i.test(v.lang)); if (v) u.voice = v; speechSynthesis.speak(u); } catch (e) { } };
  // Pi'nin ElevenLabs sesleri: sunucudaki manifest + mp3'ler. Dosyalar fetch ile alınır, telefonda saklanır (Cache API)
  // ve blob olarak çalınır. Böylece çevrimdışı katman ve "range" istekleri sesi bozamaz; ikinci açılışta internetsiz çalar.
  const AUDIO = { keys: null, cur: null, tok: 0, blob: {}, durum: 'yukleniyor', base: (CL && CL.sesAdresi) || 'audio/' };
  const SES_DEPO = 'pi-sesleri-damla-v1';
  try { caches.delete('pi-sesleri-v1'); } catch (e) { } // eski (Gamze) ses önbelleğini temizle
  AUDIO.hazir = fetch(AUDIO.base + 'manifest.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null)
    .then(m => { if (m && m.keys) { AUDIO.keys = new Set(m.keys); AUDIO.durum = 'hazir'; } else AUDIO.durum = 'yok'; })
    .catch(() => { AUDIO.durum = 'hata'; });
  const sesAl = async (key) => {
    if (AUDIO.blob[key]) return AUDIO.blob[key];
    const url = AUDIO.base + key + '.mp3'; let res = null, depo = null;
    try { depo = await caches.open(SES_DEPO); res = await depo.match(url); } catch (e) { }
    if (!res) { res = await fetch(url, { mode: 'cors' }); if (res.ok && depo) depo.put(url, res.clone()).catch(() => { }); }
    if (!res || !res.ok) throw new Error('ses yok');
    return (AUDIO.blob[key] = URL.createObjectURL(await res.blob()));
  };
  // Sık çalan kısa replikleri ve efektleri arka planda önceden indir (ilk dokunuştan sonra, ~1 MB)
  const onYukle = () => AUDIO.hazir.then(() => { if (!AUDIO.keys) return; const l = [...AUDIO.keys].filter(k => k.startsWith('pi_') || k.startsWith('sfx_')); let n = 0; const tek = () => { if (n >= l.length) return; sesAl(l[n++]).catch(() => { }).finally(() => setTimeout(tek, 120)); }; tek(); tek(); });
  AUDIO.hazir.then(() => setTimeout(() => { try { if (A.view !== 'lesson' && A.tab === 'profil') render(); } catch (e) { } }, 0));
  document.addEventListener('pointerdown', function ilk() { document.removeEventListener('pointerdown', ilk); onYukle(); }, { once: true });
  const sesCal = (key, tok) => sesAl(key).then(u => { if (tok !== AUDIO.tok) return; const a = new Audio(u); AUDIO.cur = a; dudakBagla(a); return a.play(); });
  ['ok', 'bad', 'win', 'fire', 'unstop', 'legend', 'grow', 'badge', 'swoosh'].forEach(k => { const synth = sfx[k]; sfx[k] = (...a) => { const key = 'sfx_' + k; if (A.st.settings.sound && AUDIO.keys && AUDIO.keys.has(key) && AUDIO.blob[key]) { try { const au = new Audio(AUDIO.blob[key]); au.volume = .7; au.play().catch(() => synth(...a)); return; } catch (e) { } } synth(...a); }; });
  const stopVoice = () => { AUDIO.tok++; dudakDur(); try { if (AUDIO.cur) { AUDIO.cur.pause(); AUDIO.cur = null; } if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { } };
  // robot=false: Pi'nin sabit replikleri. Pi sesi çalamazsa robot ses yerine sessiz kalınır (karakter bozulmasın).
  const say = (key, html, robot = true) => {
    if (!A.st.settings.voice) return; stopVoice(); const tok = AUDIO.tok;
    const calis = () => {
      if (tok !== AUDIO.tok) return;
      if (key && AUDIO.keys && AUDIO.keys.has(key)) { sesCal(key, tok).catch(() => { if (robot && tok === AUDIO.tok) ttsSpeak(toSpeech(html)); }); return; }
      if (robot) ttsSpeak(toSpeech(html));
    };
    if (key && AUDIO.durum === 'yukleniyor') AUDIO.hazir.then(calis); else calis();
  };
  const speak = (html) => say(null, html);
  /* ---------- Pi soruyu kendi sesiyle okur (Damla) ----------
     Metin U.soruSesi ile hazırlanır, SHA-256 özetiyle depoda aranır (telefonda da saklanır). Yoksa soru-sesi fonksiyonu
     bir kez üretir. Sunucu reddederse (sözlük/kota) ya da 8 sn içinde gelmezse robot sese düşülür; çocuk sessiz kalmaz. */
  const SORU_DEPO = 'pi-soru-sesleri-v1';
  const ozet32 = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  const zamanli = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('zaman aşımı')), ms))]);
  const soruSesiAl = async (metin) => {
    const url = CL.soruDepo + (await ozet32(metin)) + '.mp3';
    if (AUDIO.blob[url]) return AUDIO.blob[url];
    let depo = null, res = null; try { depo = await caches.open(SORU_DEPO); res = await depo.match(url); } catch (e) { }
    if (!res) {
      res = await fetch(url, { mode: 'cors' });
      if (!res.ok) {
        const r = await fetch(CL.soruSesiAdresi, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ metin }) });
        if (!r.ok) throw new Error('soru sesi: ' + r.status);
        res = await fetch(url, { mode: 'cors' }); if (!res.ok) throw new Error('soru sesi yok');
      }
      if (depo) depo.put(url, res.clone()).catch(() => { });
    }
    return (AUDIO.blob[url] = URL.createObjectURL(await res.blob()));
  };
  const soruOku = () => {
    const q = A.q; if (!q || !A.st.settings.voice) return;
    const metin = q.okuma || q.prompt, yedek = metin + '. ' + (['input', 'kes', 'match', 'tablo', 'kur'].includes(q.type) ? '' : q.type === 'cmp' ? `${q.cmp[0]} ile ${q.cmp[1]}` : (q.options || []).map(o => o.t).join('. '));
    if (!CL || !CL.soruDepo || !window.crypto || !crypto.subtle) return speak(yedek);
    stopVoice(); const tok = AUDIO.tok, pk = () => document.querySelectorAll('.pikonus');
    pk().forEach(e => e.classList.add('dusunuyor'));
    zamanli(soruSesiAl(U.soruSesi(metin)), 8000)
      .then(u => { if (tok !== AUDIO.tok) return; const a = new Audio(u); AUDIO.cur = a; dudakBagla(a); return a.play(); })
      .catch(() => { if (tok === AUDIO.tok) say(null, yedek); })
      .finally(() => pk().forEach(e => e.classList.remove('dusunuyor')));
  };
  /* ---------- Mini ders: Pi anlatır, anlattığı cümle/adım o anda parlar (karaoke) ----------
     Kayıtlı kart sesi çalarken her parçanın başlama anı, metindeki payına göre sesin süresinden hesaplanır
     (ek ses üretimi gerekmez). Ses yoksa ya da kapalıysa parçalar okuma hızında sırayla açılır. Şekiller çizilerek gelir. */
  /* Adım adım canlanan sahneler: "Adım adım" kartında Pi hangi adımı anlatıyorsa şekil o adıma geçer.
     Sayılar burada sabit örnektir ve elle doğrulanmıştır (8+4=12, 12×2=24; 5×3=15; (3+5)×2²−4=28; 15 702 436 018). */
  const DS = (w, h, ic) => `<svg class="vis ds" viewBox="0 0 ${w} ${h}" role="img" aria-label="adım adım şekil">${ic}</svg>`;
  const dsYazi = (x, y, t, k = '') => `<text x="${x}" y="${y}" text-anchor="middle" class="tx ds-tx ${k}">${t}</text>`;
  const DERS_SAHNE = {
    a_cevre: (i) => {
      const R = 'M60,40 H240 V130 H60 Z', ust = i >= 1 ? 'ds-vurgu' : '', hepsi = i >= 2 ? 'ds-vurgu' : '';
      return DS(300, 190, `<rect x="60" y="40" width="180" height="90" class="f2"/>
        <path d="M60,40 H240" class="ln ${ust}"/><path d="M240,40 V130" class="ln ${ust}"/><path d="M240,130 H60" class="ln ${hepsi}"/><path d="M60,130 V40" class="ln ${hepsi}"/>
        ${dsYazi(150, 30, '8 cm', i === 0 ? 'ds-parla' : '')}<text x="250" y="90" class="tx ds-tx ${i === 0 ? 'ds-parla' : ''}">4 cm</text>
        ${i === 2 ? `<circle r="9" class="ds-pi"><animateMotion dur="2.4s" repeatCount="indefinite" path="${R}"/></circle>` : ''}
        ${i === 1 ? dsYazi(150, 170, '8 + 4 = 12', 'ds-buyuk ds-gel') : i === 2 ? dsYazi(150, 170, '12 × 2 = 24', 'ds-buyuk ds-gel') : i >= 3 ? dsYazi(150, 170, 'Çevre = 24 cm', 'ds-buyuk ds-gel ds-yesil') : ''}`);
    },
    a_alan: (i) => {
      let k = ''; for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) k += `<rect x="${60 + c * 36}" y="${30 + r * 36}" width="36" height="36" class="${i >= 2 ? 'ds-kare' : 'ds-bos'}" style="animation-delay:${(r * 5 + c) * 0.08}s"/>`;
      return DS(300, 190, `${k}<rect x="60" y="30" width="180" height="108" class="ln"/>
        <path d="M60,30 H240" class="ln ${i === 0 ? 'ds-vurgu' : ''}"/><path d="M60,30 V138" class="ln ${i === 1 ? 'ds-vurgu' : ''}"/>
        ${dsYazi(150, 22, '5 cm', i === 0 ? 'ds-parla' : '')}<text x="10" y="90" class="tx ds-tx ${i === 1 ? 'ds-parla' : ''}">3 cm</text>
        ${i === 2 ? dsYazi(150, 172, '5 × 3 = 15 kare', 'ds-buyuk ds-gel') : i >= 3 ? dsYazi(150, 172, 'Alan = 15 cm²', 'ds-buyuk ds-gel ds-yesil') : ''}`);
    },
    f_denk: (i) => {
      const serit = (y, n, b, et) => { let r = ''; const w = 200 / n; for (let j = 0; j < n; j++) r += `<rect x="${50 + j * w}" y="${y}" width="${w}" height="34" class="${j < b ? 'f1' : 'f0'} ds-gel"/>`; return r + `<text x="262" y="${y + 23}" class="tx ds-tx">${et}</text>`; };
      if (i === 0) return DS(320, 150, serit(20, 2, 1, '1/2') + dsYazi(150, 85, '× 2 ↓', 'ds-parla') + serit(98, 4, 2, '2/4'));
      if (i === 1) return DS(320, 150, serit(20, 8, 4, '4/8') + dsYazi(150, 85, '÷ 2 ↓', 'ds-parla') + serit(98, 4, 2, '2/4'));
      return DS(320, 170, serit(20, 2, 1, '1/2') + dsYazi(150, 85, '+1 eklersen…', 'ds-kirmizi') + serit(98, 3, 2, '2/3') + dsYazi(150, 160, 'Aynı değil! ✗', 'ds-buyuk ds-kirmizi ds-gel'));
    },
    e_oncelik: (i) => {
      const satir = [['(3 + 5)', ' × 2² − 4'], ['8 × ', '2²', ' − 4'], ['', '8 × 4', ' − 4'], ['', '32 − 4']][Math.min(i, 3)];
      const ifade = satir.length === 2 ? `<tspan class="ds-kutu">${satir[0]}</tspan>${satir[1]}` : `${satir[0]}<tspan class="ds-kutu">${satir[1]}</tspan>${satir[2]}`;
      const etiket = ['1) Parantez', '2) Üslü ifade', '3) Çarpma, bölme', '4) Toplama, çıkarma'][Math.min(i, 3)];
      return DS(300, 150, `${dsYazi(150, 30, etiket, 'ds-parla')}<text x="150" y="85" text-anchor="middle" class="tx ds-tx ds-ifade ds-gel">${ifade}</text>${i >= 3 ? dsYazi(150, 130, '= 28', 'ds-buyuk ds-yesil ds-gel') : ''}`);
    },
    n_okuma: (i) => {
      const bol = ['15', '702', '436', '018'], ad = ['milyar', 'milyon', 'bin', '(birler)'], x = [52, 118, 184, 250];
      if (i <= 2) return DS(300, 170, bol.map((b, k) => `<rect x="${x[k] - 30}" y="20" width="60" height="44" rx="10" class="ds-bolum c${k}" style="opacity:.25"/>${dsYazi(x[k], 50, b, 'ds-buyuk')}`).join('')
        + (i >= 1 ? ad.map((a, k) => dsYazi(x[k], 88, a, 'ds-gel')).join('') : '')
        + (i >= 2 ? `<text x="150" y="128" text-anchor="middle" class="tx ds-tx sm ds-gel">on beş milyar yedi yüz iki milyon</text><text x="150" y="150" text-anchor="middle" class="tx ds-tx sm ds-gel">dört yüz otuz altı bin on sekiz</text>` : ''));
      if (i === 3) return DS(300, 150, dsYazi(150, 50, '5 <tspan class="ds-cizik">000</tspan> 120', 'ds-buyuk') + dsYazi(150, 85, 'bin bölüğü 000 → okunmaz', 'ds-parla') + dsYazi(150, 125, 'beş milyon yüz yirmi', 'ds-gel'));
      return DS(300, 150, dsYazi(150, 45, 'yedi milyon altı', 'ds-gel') + dsYazi(150, 85, '↓', 'ds-parla') + dsYazi(150, 125, '7 <tspan class="ds-kutu">000 00</tspan>6', 'ds-buyuk ds-gel'));
    },
  };
  const parcala = (html) => String(html).replace(/([.!?])\s+(?=[A-ZÇĞİÖŞÜ0-9<"(])/g, '$1\u0001').split('\u0001').map(x => `<span class="dp">${x}</span>`).join(' ');
  const cizimHazirla = (kok) => (kok || document).querySelectorAll('.visbox.cizim svg').forEach(sv => {
    let i = 0; sv.querySelectorAll('path,line,polyline,polygon,rect,circle,ellipse').forEach(el => { if (!el.classList.contains('dash')) el.setAttribute('pathLength', '1'); el.style.setProperty('--g', (0.15 + 0.12 * i++).toFixed(2) + 's'); });
    sv.querySelectorAll('text').forEach((el, k) => el.style.setProperty('--g', (0.5 + 0.1 * k).toFixed(2) + 's')); sv.classList.add('ciz');
  });
  // Metni değişen anlatım kartının sesi yeni sürüm adıyla üretilir (telefonda saklanan eski ses çalınmasın)
  const KART_SES_SURUM = { g_cokgen_hikaye: 2, g_cokgen_adim: 2, g_cokgen_kural: 2, p_spektrum_adim: 2, e_oncelik_hikaye: 2 };
  const kartSes = (id, f) => `kart_${id}_${f}${KART_SES_SURUM[id + '_' + f] ? '_' + KART_SES_SURUM[id + '_' + f] : ''}`;
  const sayCard = (id, f) => {
    const kart = document.querySelector('.modal .lcard') || document.querySelector('.lcard');
    const parts = kart ? [...kart.querySelectorAll('.dp')] : [];
    if (!parts.length) return say(kartSes(id, f), cardText(id, f));
    cizimHazirla(kart);
    const agirlik = parts.map(p => Math.max(6, toSpeech(p.innerHTML).length)), top = agirlik.reduce((a, b) => a + b, 0);
    const bas = agirlik.map((_, i) => agirlik.slice(0, i).reduce((a, b) => a + b, 0) / top);
    const sahneKutu = kart.querySelector('.ders-sahne'), sahneFn = sahneKutu && DERS_SAHNE[sahneKutu.dataset.sahne];
    let son = -2; const isaret = (i) => { if (i === son) return; son = i; if (sahneFn && i >= 0) sahneKutu.innerHTML = sahneFn(Math.min(i, parts.length - 1)); parts.forEach((p, k) => { p.classList.toggle('simdi', k === i); p.classList.toggle('gecti', k < i); p.classList.toggle('gelecek', k > i); }); const sp = parts[i]; if (sp && sp.scrollIntoView && i > 0) try { sp.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { } };
    stopVoice(); const tok = AUDIO.tok; isaret(-1); kart.classList.add('oynuyor');
    const bitir = () => { if (tok === AUDIO.tok) { isaret(parts.length); kart.classList.remove('oynuyor'); } };
    // Sessiz yol: okuma hızı (~14 harf/sn), ağız ritimle oynar
    const zamanla = () => { if (tok !== AUDIO.tok) return; let i = 0; const ilerle = () => { if (tok !== AUDIO.tok) return; if (i >= parts.length) return bitir(); isaret(i); const sure = Math.max(1400, agirlik[i] / 14 * 1000); i++; setTimeout(ilerle, sure); }; ilerle(); };
    const key = kartSes(id, f);
    const sesli = () => sesAl(key).then(u => {
      if (tok !== AUDIO.tok) return; const a = new Audio(u); AUDIO.cur = a; dudakBagla(a);
      a.addEventListener('timeupdate', () => { if (tok !== AUDIO.tok || !a.duration) return; const t = a.currentTime / a.duration; let i = 0; while (i + 1 < bas.length && bas[i + 1] <= t) i++; isaret(i); });
      a.addEventListener('ended', bitir, { once: true }); return a.play();
    }).catch(zamanla);
    if (!A.st.settings.voice) return zamanla();
    if (AUDIO.durum === 'yukleniyor') AUDIO.hazir.then(() => (AUDIO.keys && AUDIO.keys.has(key) ? sesli() : zamanla()));
    else if (AUDIO.keys && AUDIO.keys.has(key)) sesli(); else zamanla();
  };
  const PI = window.MY_PI_LINES;
  const piSay = (group) => { const arr = PI[group]; if (!arr) return null; const i = Math.floor(Math.random() * arr.length); say(`pi_${group}_${i + 1}`, arr[i], false); return arr[i]; };

  /* ---------------- Maskot: Pi ---------------- */
  const mascotSvg = (state = '', w = 110) => `<div class="mascot ${state}" style="width:${w}px" aria-hidden="true"><svg viewBox="0 0 120 124"><g class="m-body">
    <path d="M44 20 H78" stroke="#5B4BFF" stroke-width="7" stroke-linecap="round"/><path d="M52 21 V36" stroke="#5B4BFF" stroke-width="6" stroke-linecap="round"/><path d="M70 21 C70 30 71 35 77 36" stroke="#5B4BFF" stroke-width="6" stroke-linecap="round" fill="none"/>
    <ellipse cx="60" cy="74" rx="46" ry="44" fill="#22CDBE"/><ellipse cx="60" cy="86" rx="28" ry="24" fill="#BFF5EE"/>
    <ellipse cx="24" cy="80" rx="9" ry="14" fill="#1BAE9F" transform="rotate(20 24 80)"/><ellipse cx="96" cy="80" rx="9" ry="14" fill="#1BAE9F" transform="rotate(-20 96 80)"/>
    <g class="eye"><ellipse cx="44" cy="62" rx="11" ry="13" fill="#fff"/><circle cx="46" cy="64" r="6" fill="#1E1B4B"/><circle cx="48" cy="61" r="2" fill="#fff"/></g>
    <g class="eye"><ellipse cx="76" cy="62" rx="11" ry="13" fill="#fff"/><circle cx="78" cy="64" r="6" fill="#1E1B4B"/><circle cx="80" cy="61" r="2" fill="#fff"/></g>
    <circle cx="33" cy="80" r="5" fill="#FF8FB1" opacity=".7"/><circle cx="87" cy="80" r="5" fill="#FF8FB1" opacity=".7"/>
    <path class="mouth m-smile" d="M50 82 Q60 91 70 82" stroke="#1E1B4B" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path class="mouth m-grin" d="M47 79 Q60 98 73 79 Z" fill="#1E1B4B"/>
    <path class="mouth m-oh" d="M52 88 Q60 82 68 88" stroke="#1E1B4B" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path class="mouth m-hmm" d="M52 85 L68 83" stroke="#1E1B4B" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="44" cy="117" rx="12" ry="5" fill="#1BAE9F"/><ellipse cx="76" cy="117" rx="12" ry="5" fill="#1BAE9F"/></g></svg></div>`;
  // Pi'nin çizim seti: her duygu için ayrı görsel (aynı karakter). Görsel yüklenemezse eski SVG Pi'ye döner.
  const PI_DURUM = { '': 'pi_bekle', happy: 'pi_sevin', think: 'pi_dusun', sad: 'pi_uzgun', talk: 'pi_konus', rocket: 'pi_roket' };
  // Görseller uygulamanın kendi 'img/' klasöründe (aynı adres: hızlı açılır, internetsiz de çalışır)
  const PI_GORSEL = 'img/';
  window.MY_MASCOT_SVG = mascotSvg;
  // Konuşan Pi (büst): 3 ağız karesi üst üste; hangisinin görüneceğini data-agiz belirler
  const piKonus = (w = 76, act = '') => `<button class="pikonus" data-agiz="0" style="width:${w}px;height:${w}px" ${act ? `data-act="${act}"` : 'tabindex="-1"'} aria-label="Pi">${[0, 1, 2].map(i => `<img class="a${i}" src="img/pi_agiz${i}.webp" alt="" draggable="false" decoding="async" onerror="this.closest('.pikonus').classList.add('yedek')">`).join('')}</button>`;
  const mascot = (state = '', w = 110) => PI_GORSEL
    ? `<div class="mascot pim ${state}" style="width:${w}px" aria-hidden="true"><img src="${PI_GORSEL}${PI_DURUM[state] || 'pi_bekle'}.webp" alt="" draggable="false" decoding="async" onerror="this.parentNode.outerHTML=window.MY_MASCOT_SVG('${state}',${w})"></div>`
    : mascotSvg(state, w);
  // Görselleri önceden ısıt (ilk soru/geri bildirimde gecikme olmasın)
  if (PI_GORSEL) setTimeout(() => Object.values(PI_DURUM).forEach(k => { const im = new Image(); im.src = PI_GORSEL + k + '.webp'; }), 1500);

  const PRAISE = window.MY_PI_LINES.dogru;
  const PRAISE_RESCUE = window.MY_PI_LINES.telafi;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const toast = (msg) => { const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); };

  /* ---------------- Konfeti ---------------- */
  function confetti() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.createElement('canvas'); c.id = 'confetti'; document.body.appendChild(c); const x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
    const cols = ['#5B4BFF', '#FF9F1C', '#22CDBE', '#EC4899', '#1FBF62', '#FFC531'], P = Array.from({ length: 140 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * .5, vx: (Math.random() - .5) * 4, vy: 2 + Math.random() * 4, r: 4 + Math.random() * 6, a: Math.random() * 6, c: pick(cols) }));
    let f = 0; (function loop() { x.clearRect(0, 0, c.width, c.height); P.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .05; p.a += .1; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); }); if (++f < 200) requestAnimationFrame(loop); else c.remove(); })();
  }

  /* =================== GÖRÜNÜMLER =================== */
  const unlocked = (sk) => { if (!sk.prereq.length) return true; const p = A.st.skills[sk.prereq[0]]; return p.lessons > 0 || E.eff(p) >= 0.5 || A.st.skills[sk.id].n > 0 || E.eff(A.st.skills[sk.id]) >= 0.3; };
  const goalRing = () => { const v = Math.min(1, todayXP() / A.st.dailyGoal), r = 15, c = 2 * Math.PI * r; return `<svg class="ring" viewBox="0 0 38 38" aria-label="Günlük hedef ${todayXP()}/${A.st.dailyGoal} XP"><circle cx="19" cy="19" r="${r}" fill="none" stroke="var(--line)" stroke-width="5"/><circle cx="19" cy="19" r="${r}" fill="none" stroke="var(--accent)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - v)}" transform="rotate(-90 19 19)"/><text x="19" y="23" text-anchor="middle" font-size="11" font-weight="900" fill="var(--ink)">⚡</text></svg>`; };
  // Üst çubuk: her simgeye dokununca ne olduğunu kısa bir cümleyle söyler (çocuk 🧊'nin ne olduğunu bilemez)
  const topbar = () => `<div class="topbar"><button class="stat fire" data-act="ust" data-v="seri" aria-label="Seri"><span class="ic">🔥</span>${A.st.streak}</button><button class="stat gem" data-act="ust" data-v="elmas" aria-label="Elmas"><span class="ic">💎</span>${A.st.gems}</button><button class="stat" data-act="ust" data-v="hedef" aria-label="Günlük hedef">${goalRing()}<span class="sm">${todayXP()}/${A.st.dailyGoal}</span></button><button class="stat" data-act="ust" data-v="koruyucu" aria-label="Seri koruyucu"><span class="ic">🧊</span>${A.st.freezes}</button></div>`;
  const UST = { seri: () => `🔥 Serin <b>${A.st.streak} gün</b>. Her gün en az bir ders yaparsan büyür.`, elmas: () => `💎 <b>${A.st.gems} elmasın</b> var. Ders sonundaki sandıklardan kazanırsın, seri koruyucu alırsın.`,
    hedef: () => `⚡ Bugünkü hedefin: <b>${todayXP()}/${A.st.dailyGoal} XP</b>. Doğru cevaplarla dolar.`, koruyucu: () => `🧊 <b>${A.st.freezes} seri koruyucun</b> var. Bir gün ders yapamazsan serin bozulmaz.` };
  const nav = () => `<nav class="nav">${[['yol', '🏠', 'Yol'], ['kitap', '📚', 'Kitap'], ['pratik', '🎯', 'Görev'], ['lig', '🏆', 'Lig'], ['profil', '🧠', 'Ben'], ['veli', '👨‍👩‍👧', 'Veli']].map(([k, i, t]) => `<button data-act="tab" data-v="${k}" class="${A.tab === k ? 'on' : ''}"><span class="ic">${i}</span>${t}</button>`).join('')}</nav>`;

  /* Harita mahallesi: her temanın kendine has komşusu (özgün karakterler, ses yok: konuşan tek ses Pi) */
  const KOMSU = {
    t1: { ad: 'Pergo', tur: 'pergelli robot', h: 'sal', soz: ['Merhaba, ben Pergo! Açıları ben ölçerim 📐', 'Dik açı tam 90 derecedir. Köşesi bir kare köşesi gibi!', 'Bir üçgenin iç açılarını topla: hep 180 derece!'] },
    t2: { ad: 'Bilge', tur: 'sayı baykuşu', h: 'egil', soz: ['Ben Bilge! Büyük sayıları bölük bölük okurum 🦉', 'Sayıyı sağdan üçerli ayır, okuması kolaylaşır.', 'Önce tahmin et, sonra hesapla, sonra kontrol et!'] },
    t3: { ad: 'Metre Usta', tur: 'ölçü ustası kunduz', h: 'zipla', soz: ['Ben Metre Usta! Her şeyi ölçerim 📏', 'Çevre için kenarların hepsini topla.', 'Alan, içini kaplayan birim karelerin sayısıdır.'] },
    t4: { ad: 'Aşçı Dilim', tur: 'pizzacı kedi', h: 'sal', soz: ['Ben Aşçı Dilim! Pizzayı hep eşit dilimlerim 🍕', 'Payda: bütün kaç eşit parçaya bölündü?', 'Pay: o parçalardan kaç tane aldın?'] },
    t5: { ad: 'Grafi', tur: 'muhabir tavşan', h: 'zipla', soz: ['Ben Grafi! Herkese soru sorarım 📋', 'Önce veriyi topla, sonra tabloya yaz.', 'Sütun grafiğinde en uzun sütun en çok seçileni gösterir.'] },
    t6: { ad: 'Denge', tur: 'terazici fil', h: 'egil', soz: ['Ben Denge! Teraziyi hiç düşürmem ⚖️', 'Eşittir işareti iki tarafın denk olduğunu söyler.', 'Önce parantez, sonra kare ve küp, sonra çarpma ve bölme, en son toplama ve çıkarma!'] },
    t7: { ad: 'Şans', tur: 'zarcı ejder', h: 'uc', soz: ['Ben Şans! Zarımla ve paramla oynarım 🎲', 'Kesin olan bir olayın olasılığı 1’dir.', 'İmkânsız bir olayın olasılığı 0’dır.'] },
  };
  const komsuHtml = (thId) => { const k = KOMSU[thId]; if (!k) return '';
    return `<button class="komsu k-${k.h}" data-act="komsu" data-v="${thId}" aria-label="${esc(k.ad)}, ${esc(k.tur)}: dokun, konuşsun"><span class="kbal">${esc(k.soz[0])}</span><img src="img/komsu_${thId}.webp" alt="" draggable="false" decoding="async" onerror="this.closest('.komsu').remove()"><span class="kad">${esc(k.ad)}</span></button>`; };
  const komsuSay = {};

  function viewHome() {
    const th = THEMES.find(t => t.id === A.theme), sks = SKILLS.filter(s => s.theme === th.id);
    const done = sks.filter(s => E.crowns(E.eff(A.st.skills[s.id])) >= 1).length;
    const offs = [0, 62, 88, 62, 0, -62, -88, -62];
    let curFound = false;
    const nodes = sks.map((s, i) => {
      const sk = A.st.skills[s.id], cr = E.crowns(E.eff(sk)), un = unlocked(s);
      const isCur = un && !curFound && cr < 3; if (isCur) curFound = true;
      const col = th.color;
      const style = un ? `background:var(--${col});box-shadow:0 7px 0 var(--${col}-d);color:#fff` : '';
      return `<div class="node-wrap" style="transform:translateX(${offs[i % offs.length]}px)">${i === 1 ? komsuHtml(th.id) : ''}${isCur ? `<div class="bubble">${sk.n ? 'DEVAM' : 'BAŞLA'}</div>` : ''}<button class="node ${un ? '' : 'locked'} ${isCur ? 'cur' : ''}" style="${style}" data-act="node" data-v="${s.id}" aria-label="${esc(s.title)}">${un ? (cr >= 5 ? '👑' : cr >= 1 ? '⭐' : th.icon) : '🔒'}${cr ? `<span class="crowns">${cr}</span>` : ''}</button><div class="node-label">${esc(s.title)}</div></div>`;
    }).join('');
    const greet = A.st.profile ? `Merhaba ${esc(A.st.profile.name.split(' ')[0])}!` : 'Merhaba!';
    const due = E.dueSkills(A.st).length;
    return `${topbar()}<div class="scroll">
      <div class="row" style="margin:4px 0 10px">${mascot('', 64)}<div class="speech grow">${greet} ${due ? `<b>${due}</b> konu tekrar bekliyor ⏰` : A.st.streak ? `Serin ${A.st.streak} gün, devam! 🔥` : 'Bugün bir ders yapalım mı? 🚀'}</div></div>
      <div class="themes">${THEMES.map(t => `<button class="chip ${t.id === A.theme ? 'on' : ''}" data-act="theme" data-v="${t.id}">${t.icon} ${t.no}. Tema</button>`).join('')}</div>
      <div class="banner bg-${th.color}"><div class="sub">${th.no}. TEMA · ${done}/${sks.length} beceri</div><h2>${th.title}</h2><div class="sub" style="margin-top:4px">${th.goal}</div><span class="bk">📗 ${th.book}. Kitap · ${th.no}. Tema</span><div class="big">${th.icon}</div></div>
      <div class="path harita" style="--fon:url(img/fon_${th.id}.webp)">${nodes}<div class="node-wrap"><button class="node ${done === sks.length || A.st.trophies[th.id] ? '' : 'locked'}" style="${A.st.trophies[th.id] ? 'background:var(--gold);box-shadow:0 7px 0 #C79400' : done === sks.length ? 'background:var(--brand);box-shadow:0 7px 0 var(--brand-d)' : ''}" data-act="trophy" data-v="${th.id}" aria-label="Tema sınavı">${A.st.trophies[th.id] ? '🏆' : '🎓'}</button><div class="node-label">${A.st.trophies[th.id] ? 'Kupa kazanıldı!' : 'Tema Sınavı'}</div></div></div>
    </div>${nav()}`;
  }

  // "Bugün bunu yap": tek, net öneri (Duolingo'nun "sonraki adım" fikri). Öncelik: unutulmaya yüz tutmuş konu →
  // birikmiş hatalar → yoldaki sıradaki konu. Gerekçesi çocuğa tek cümleyle söylenir.
  function bugunOneri() {
    const st = A.st, calisilan = SKILLS.filter(s => st.skills[s.id].n > 0), due = E.dueSkills(st), ms = st.mistakes.length;
    const siradaki = SKILLS.find(s => unlocked(s) && E.eff(st.skills[s.id]) < 0.7) || SKILLS.find(s => E.eff(st.skills[s.id]) < 0.85);
    const hedefTamam = todayXP() >= st.dailyGoal;
    if (!calisilan.length) return siradaki ? { act: 'learn', v: siradaki.id, ic: '🌱', t: siradaki.title, n: 'İlk konunla başla. Pi önce anlatacak, sonra 5 soru.' } : null;
    if (due.length && due[0].r < 0.5) return { act: 'p-review', ic: '⏰', t: `Tekrar: ${SKILL[due[0].id].title}`, n: due.length > 1 ? `${due.length} konu unutulmaya başladı. Kısa bir tekrarla tazele.` : 'Bu konu unutulmaya başladı. Kısa bir tekrarla tazele.' };
    if (ms >= 3) return { act: 'p-mistakes', ic: '🕵️', t: `Hatalarımı Çalış (${ms})`, n: 'Birkaç tuzak birikti. Onları birlikte aşalım.' };
    if (hedefTamam && due.length) return { act: 'p-review', ic: '⏰', t: `Tekrar: ${SKILL[due[0].id].title}`, n: 'Bugünkü hedefin tamam! İstersen bir konuyu tazele.' };
    if (siradaki) { const yeni = st.skills[siradaki.id].n === 0; return { act: yeni ? 'learn' : 'start', v: siradaki.id, ic: yeni ? '✨' : '📘', t: siradaki.title, n: hedefTamam ? 'Bugünkü hedefin tamam! Devam etmek istersen sıradaki konu bu.' : yeni ? 'Yolundaki sıradaki yeni konu. Pi önce anlatacak.' : 'Yolundaki sıradaki konu. Biraz daha çalışınca yıldızı dolacak.' }; }
    return { act: 'p-mix', ic: '🎲', t: 'Karışık Pratik', n: 'Bütün konularda çok iyisin! Karışık sorularla formunu koru.' };
  }
  function viewPractice() {
    const due = E.dueSkills(A.st), ms = A.st.mistakes.length, any = SKILLS.some(s => A.st.skills[s.id].n > 0);
    const item = (act, ic, bg, title, sub, dis) => `<button class="card prac" data-act="${act}" ${dis ? 'disabled style="opacity:.5"' : ''}><div class="ic" style="background:${bg}">${ic}</div><div class="grow"><h3>${title}</h3><div class="muted sm">${sub}</div></div><div style="font-size:22px">›</div></button>`;
    const Q = E.quests(A.st), qrow = (q) => `<div class="quest ${q.ok ? 'done' : ''}"><div class="qi">${q.ikon}</div><div class="grow"><b>${q.ad}</b><div class="qbar"><i style="width:${Math.round(100 * q.v / q.hedef)}%"></i><span>${q.v} / ${q.hedef}</span></div></div><div class="qr">${q.ok ? '✅' : '🎁'}<small>${q.odul}💎</small></div></div>`;
    const mo = Q.month, now = new Date(), left = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
    const O = bugunOneri();
    return `${topbar()}<div class="scroll">
      ${O ? `<button class="card bugun" data-act="${O.act}" ${O.v ? `data-v="${O.v}"` : ''}><div class="sm bugun-ust">BUGÜN BUNU YAP</div><div class="row"><div class="bugun-ic">${O.ic}</div><div class="grow"><h3>${esc(O.t)}</h3><div class="muted sm">${O.n}</div></div><div class="bugun-git">Başla ›</div></div></button>` : ''}
      <div class="mbanner"><div class="grow"><div class="sm" style="font-weight:900;opacity:.9">${left} GÜN KALDI</div><h2>${mo.ad}</h2><div class="sm" style="font-weight:800">Günlük görevleri tamamla, ${mo.hedef} göreve ulaş!</div><div class="qbar light"><i style="width:${Math.min(100, Math.round(100 * mo.done / mo.hedef))}%"></i><span>${mo.done} / ${mo.hedef}</span></div></div>${mascot(mo.claimed ? 'happy' : '', 70)}</div>
      <h2 class="sect">Günlük Görevler <span class="muted sm">· gece yarısı yenilenir</span></h2><div class="card list" style="gap:4px">${Q.list.map(qrow).join('')}</div>
      <h2 class="sect">Pratik Merkezi</h2><div class="list">
      ${item('p-mistakes', '🕵️', '#FFE5E8', `Hatalarımı Çalış (${ms})`, ms ? 'Yanlış yaptığın soru tiplerini yeniden dene, yanılgıları kapat.' : 'Henüz hata yok. Harika!', !ms)}
      ${item('p-review', '⏰', '#E0F8EA', `Tekrar Zamanı (${due.length})`, due.length ? 'Unutma eğrine göre tazelenmesi gereken konular.' : 'Şimdilik her şey taze.', !any)}
      ${item('p-atolye', '🧩', '#E0F2FE', 'Problem Atölyesi', 'Gerçek hayat problemlerini adım adım çöz: anla, planla, çöz, kontrol et.', false)}
      ${item('p-hata', '🔍', '#FFF4D6', 'Hata Avcısı', 'Arkadaşlarının çözümündeki hatayı bul, kim haklı sen karar ver.', false)}
      ${item('p-speed', '⚡', '#FFF0DB', 'Hızlı Yarış · 60 sn', `En iyi skorun: ${A.st.speedBest} doğru. Rekorunu kır!`, false)}
      ${item('p-mix', '🎲', '#E8E5FF', 'Karışık Pratik', 'Çalıştığın tüm konulardan karışık sorular.', !any)}
      ${item('p-place', '🧭', '#E3F1FF', 'Seviye Belirleme', '7 soruda her temadaki seviyeni yeniden ölç.', false)}
    </div></div>${nav()}`;
  }

  function viewBooks() {
    const b = A.book || 1, K = KITAP[b];
    const tag = { hazir: ['🧭', 'Hazır mıyız?', 'Ön bilgini 5 soruda kontrol et'], izleme: ['📝', 'İzleme testi', 'Tema sınavıyla kendini dene'], olcme: ['🎓', 'Ölçme', 'Tema sınavı (10 soru)'], performans: ['🛠️', 'Performans görevi', 'Gerçek hayat görevi'], bilgi: ['📖', '', 'Konuya giriş'] };
    const themeBlock = (T) => { const th = THEMES.find(t => t.id === T.tema), sks = SKILLS.filter(s => s.theme === th.id), avg = sks.reduce((a, s) => a + E.eff(A.st.skills[s.id]), 0) / sks.length;
      return `<div class="bk-theme"><div class="banner bg-${th.color}" style="padding:14px"><div class="sub">${th.no}. TEMA</div><h2 style="font-size:19px">${th.title}</h2><div class="bar" style="margin-top:8px;background:rgba(255,255,255,.3)"><i style="width:${Math.round(avg * 100)}%;background:#fff"></i></div><div class="sub" style="margin-top:4px">Ustalık %${Math.round(avg * 100)}${A.st.trophies[th.id] ? ' · 🏆 kupa' : ''}</div><div class="big">${th.icon}</div></div>
        <div class="toc">${T.ic.map(it => { const t = tag[it.tur]; const act = it.tur === 'konu' ? `data-act="node" data-v="${it.sk[0]}"` : it.tur === 'hazir' ? `data-act="hazir" data-v="${th.id}"` : (it.tur === 'izleme' || it.tur === 'olcme') ? `data-act="exam" data-v="${th.id}"` : it.tur === 'performans' ? `data-act="task" data-v="${th.id}"` : '';
          const chips = it.sk.map(id => { const c = E.crowns(E.eff(A.st.skills[id])); return `<span class="skc ${c ? 'on' : ''}">${'⭐'.repeat(Math.min(c, 3)) || '○'} ${esc(SKILL[id].title)}</span>`; }).join('');
          return `<button class="tocrow ${it.tur}" ${act} ${act ? '' : 'disabled'}><span class="grow"><b>${t && t[1] && it.tur !== 'konu' ? t[0] + ' ' : ''}${esc(it.b)}</b>${it.tur === 'konu' ? `<span class="skcs">${chips}</span>` : t ? `<span class="muted sm">${t[2]}</span>` : ''}</span>${act ? '<span class="chev">›</span>' : ''}</button>`; }).join('')}</div>
        <div class="row" style="flex-wrap:wrap;gap:8px;margin:10px 0 4px"><a class="chip" href="${T.eba[0]}" target="_blank" rel="noopener">📺 EBA içeriği 1</a><a class="chip" href="${T.eba[1]}" target="_blank" rel="noopener">📺 EBA içeriği 2</a></div></div>`; };
    return `${topbar()}<div class="scroll"><h2 class="sect">Kitaplarım <span class="muted sm">· Maarif Modeli 5. sınıf</span></h2>
      <div class="seg">${[1, 2].map(n => `<button class="${n === b ? 'on' : ''}" data-act="book" data-v="${n}">📗 ${KITAP[n].ad}</button>`).join('')}</div>
      <p class="muted sm" style="margin:8px 0 12px">Maarif Modeli müfredatındaki her başlık burada, kendi anlatımımızla. Bir başlığa dokun, o konunun dersine git.</p>
      ${K.temalar.map(themeBlock).join('')}</div>${nav()}`;
  }
  function taskModal(tid) {
    const g = GOREV[tid], th = THEMES.find(t => t.id === tid), done = A.st.tasks[tid];
    return `<div class="scrim" data-act="close-modal"></div><div class="modal"><span class="tag">🛠️ ${th.no}. Tema · Gerçek Hayat Görevi</span><h2 style="margin:8px 0">${g.ad}</h2><p style="font-weight:700;font-size:17px">${g.is}</p><div class="speech">✅ ${g.kanit}</div>
      <div class="list" style="margin-top:14px">${done ? '<div class="tag ok" style="text-align:center;padding:10px">Bu görevi tamamladın 🎉</div>' : `<button class="btn ok" data-act="task-done" data-v="${tid}">Tamamladım · +30 XP</button>`}<button class="btn ghost" data-act="close-modal">Kapat</button></div></div>`;
  }

  function viewLeague() {
    const L0 = E.league(A.st), srv = CL && CL.lig, L = srv ? { tier: E.TIERS[srv[0].kademe || 0], daysLeft: L0.daysLeft, rows: srv.map(r => ({ name: r.ben ? ((A.st.profile && A.st.profile.name.split(' ')[0]) || 'Sen') : r.takma_ad, xp: r.xp, me: r.ben })) } : L0, colors = ['#5B4BFF', '#FF9F1C', '#14B8A6', '#EC4899', '#3B82F6', '#22C55E', '#8B5CF6', '#F97316', '#EAB308', '#0EA5E9'];
    const ti = A.st.league.tier || 0, last = A.st.league.last, gems = ['🥉', '🥈', '🥇', '💚', '💎'];
    return `${topbar()}<div class="scroll"><div class="tiers">${E.TIERS.map((t, i) => `<div class="tier ${i === ti ? 'on' : i < ti ? 'past' : ''}"><span>${gems[i]}</span><small>${t}</small></div>`).join('')}</div>
      <div class="center" style="margin:6px 0 10px"><h2>${L.tier} Ligi</h2><div class="muted sm">Hafta bitimine ${L.daysLeft} gün · İlk 3 yükselir${L.ilkHafta ? '' : ', son 3 düşer'}</div></div>
      ${last ? `<div class="speech" style="margin-bottom:10px">Geçen hafta <b>${last.rank}.</b> oldun${last.to > last.from ? ' ve <b>' + E.TIERS[last.to] + ' Ligi</b>\'ne yükseldin! 🎉' : last.to < last.from ? '; bu hafta geri dönme zamanı! 💪' : '.'}</div>` : ''}
      <div class="card" style="padding:8px">${L.rows.map((r, i) => `${i === 3 ? '<div class="zone up">▲ YÜKSELME BÖLGESİ ▲</div>' : ''}${i === 7 && !L.ilkHafta ? '<div class="zone down">▼ DÜŞME BÖLGESİ ▼</div>' : ''}<div class="lrow ${r.me ? 'me' : ''}"><div class="rk">${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</div><div class="av" style="background:${colors[i % 10]}">${esc(r.name[0])}</div><div class="grow"><b>${esc(r.name)}</b>${r.demo ? ' <span class="muted sm">(demo)</span>' : ''}</div><b>${r.xp} XP</b></div>`).join('')}</div>
      ${L.ilkHafta ? '<p class="center sm" style="font-weight:800">🌱 İlk haftan: bu hafta ligden düşmezsin. İlk 3\'e girersen yükselirsin!</p>' : ''}<p class="muted sm center">${srv ? 'Rakiplerin aynı ligdeki gerçek öğrenciler; sadece takma adları görünür.' : 'Rakipler örnek (demo) öğrencilerdir. Bulut hesabı bağlanınca gerçek öğrencilerle eşleşirsin.'}</p></div>${nav()}`;
  }

  function viewProfile() {
    const fp = E.fingerprint(A.st), p = A.st.profile || {};
    // Ölçülmemiş göstergeyi sayı gibi göstermiyoruz: anlatım biçimi en az 2 karttan sonra görünür
    const fbars = fp.formats.map(f => `<div class="row" style="margin:6px 0"><div style="width:120px" class="sm"><b>${FORMATS[f.f].icon} ${FORMATS[f.f].name}</b></div>${f.n >= 2 ? `<div class="bar grow"><i style="width:${Math.round(f.m * 100)}%"></i></div><div class="sm" style="width:38px;text-align:right">%${Math.round(f.m * 100)}</div>` : '<div class="grow muted sm">henüz ölçülmedi</div>'}</div>`).join('');
    const K = fp.kanit, kbar = K && K.n >= 5 ? `<div class="kanitbar"><i class="k1" style="width:${K.ilk * 100}%"></i><i class="k2" style="width:${K.ipucu * 100}%"></i><i class="k3" style="width:${K.cozum * 100}%"></i></div><div class="kanitlej sm"><span><b class="k1"></b>İlk denemede doğru %${Math.round(K.ilk * 100)}</span><span><b class="k2"></b>İpucuyla doğru %${Math.round(K.ipucu * 100)}</span><span><b class="k3"></b>Çözüm gösterildi %${Math.round(K.cozum * 100)}</span><span>(${K.n} cevaba göre)</span></div>` : '<div class="muted sm">En az 5 cevaptan sonra görünür.</div>';
    const nasil = `<details class="nasil"><summary>ℹ️ Bu sayılar nasıl hesaplanıyor?</summary><ul>
      <li><b>Çalışma tarzı:</b> son 60 cevabın süresinin ortancası. 9 saniyeden kısaysa "hızlı karar veren", 22 saniyeye kadar "dengeli", daha uzunsa "derin düşünen". En az 5 cevap gerekir.</li>
      <li><b>İlk denemede doğru:</b> ipucu almadan, ilk denemede doğru verilen cevapların oranı. İpucuyla ya da ikinci denemede bulunanlar ayrı sayılır.</li>
      <li><b>Hatadan dönüş gücü:</b> yanlıştan sonra gelen benzer (telafi) sorularda doğru oranı.</li>
      <li><b>İpucu kullanımı:</b> 💡 ipucuna bakılan soruların oranı.</li>
      <li><b>Anlatım:</b> bir anlatım kartından sonraki ilk 3 sorudan en az 2'sinin doğru olma oranı. En az 2 kart gösterilince ölçülmüş sayılır.</li>
      <li><b>Problem adımları:</b> atölyede her adımın ilk denemede doğru oranı. "Kendin dene", benzer yeni problemi tek başına çözmektir.</li>
      <li>XP çalışmayı ödüllendirir; öğrenmeyi gösteren ustalık ve ilk deneme oranıdır.</li></ul></details>`;
    const mis = fp.misList.slice(0, 6).map(m => `<div class="misrow"><span>${esc(m.t)}</span><span class="tag ${!m.active ? 'ok' : m.kesin ? 'warm' : ''}">${!m.active ? 'aştın ✓' : m.kesin ? 'çalışıyoruz' : 'göz kulak'}</span></div>`).join('') || '<div class="muted sm">Henüz bir tuzak görmedik. 🙌</div>';
    return `${topbar()}<div class="scroll"><div class="row" style="margin:6px 0 14px">${mascot('happy', 70)}<div><h2>${esc(p.name || 'Öğrenci')}</h2><div class="muted sm">5. sınıf · ${A.st.xp} XP toplam</div></div></div>
      <div class="stats4"><div><span>🔥</span><b>${A.st.streak} gün</b><small>Seri</small></div><div><span>⚡</span><b>${A.st.xp}</b><small>Toplam XP</small></div><div><span>🏆</span><b>${E.TIERS[A.st.league.tier || 0]}</b><small>Lig</small></div><div><span>🥇</span><b>${A.st.top3 || 0} kez</b><small>İlk 3</small></div><div><span>🎓</span><b>${Object.keys(A.st.trophies).length}/7</b><small>Tema kupası</small></div><div><span>🛠️</span><b>${Object.keys(A.st.tasks).length}/7</b><small>Gerçek görev</small></div></div>
      <div class="card"><h3>🧬 Öğrenme Parmak İzim</h3><p class="muted sm" style="margin:4px 0 10px">Sistem cevaplarından seni tanıyor ve anlatımı sana göre seçiyor.</p>
        <div class="kv"><div class="card"><span class="muted sm">Çalışma tarzı</span><b style="font-size:17px">${fp.pace}</b></div><div class="card"><span class="muted sm">İlk denemede doğru</span><b>${fp.ilkAcc === null ? '–' : '%' + Math.round(fp.ilkAcc * 100)}</b><small class="muted">${fp.ilkAcc === null ? 'en az 5 cevap' : fp.ilkSay.ok + '/' + fp.ilkSay.n + ' cevap'}</small></div>
        <div class="card"><span class="muted sm">Hatadan dönüş gücü</span><b>${fp.resil === null ? '–' : '%' + Math.round(fp.resil * 100)}</b></div><div class="card"><span class="muted sm">İpucu kullanımı</span><b>%${Math.round(fp.hintRate * 100)}</b></div></div>
        <h3 style="font-size:15px;margin:14px 0 4px">Cevaplarım nasıl geldi?</h3>${kbar}
        <h3 style="font-size:15px;margin:14px 0 4px">Bana en iyi gelen anlatım</h3>${fbars}
        ${fp.problem.sayi ? `<h3 style="font-size:15px;margin:14px 0 4px">Problem çözme adımlarım <span class="muted sm">(ilk denemede)</span></h3>${fp.problem.asamalar.some(a => a.n && a.n < 5) ? '<div class="muted sm">Ön değerlendirme: henüz az veri var, sayılar çözdükçe netleşir.</div>' : ''}${fp.problem.asamalar.filter(a => !a.ek || a.n).concat(fp.problem.bagimsiz ? [{ ad: '🎯 Kendin dene', acc: fp.problem.bagimsiz.acc, ok: fp.problem.bagimsiz.ok, n: fp.problem.bagimsiz.n }] : []).map(a => `<div class="row" style="margin:6px 0"><div style="width:120px" class="sm"><b>${a.ad}</b></div><div class="bar grow"><i style="width:${a.acc === null ? 0 : Math.round(a.acc * 100)}%"></i></div><div class="sm" style="width:74px;text-align:right">${a.acc === null ? '–' : '%' + Math.round(a.acc * 100) + ` <small class="muted">${a.ok}/${a.n}</small>`}</div></div>`).join('')}` : ''}
        <h3 style="font-size:15px;margin:14px 0 4px">🪤 Pi ile üzerinde çalıştığımız tuzaklar</h3><p class="muted sm" style="margin:0 0 6px">Tuzak, herkesin düşebileceği yaygın bir hatadır. Benzer soruları doğru yapınca "aştın ✓" olur.</p>${mis}${nasil}</div>
      <h2 class="sect">Rozetler</h2><div class="badges">${E.BADGES.map(b => `<div class="badge ${A.st.badges.includes(b.id) ? '' : 'off'}" title="${esc(b.desc)}"><div class="i">${b.icon}</div><div class="n">${b.name}</div></div>`).join('')}</div>
      <h2 class="sect">Ayarlar</h2><div class="card list">
        <label class="check"><input type="checkbox" data-act="set-sound" ${A.st.settings.sound ? 'checked' : ''}> Ses efektleri</label>
        <label class="check"><input type="checkbox" data-act="set-voice" ${A.st.settings.voice ? 'checked' : ''}> Sesli anlatım (Pi soruları okusun)</label>
        ${(() => { const d = AUDIO.durum, n = AUDIO.keys ? AUDIO.keys.size : 0; const [c, t] = d === 'hazir' ? ['ok', `Pi'nin sesi hazır (${n} kayıt)`] : d === 'yukleniyor' ? ['', 'Pi\'nin sesi yükleniyor…'] : ['bad', 'Pi\'nin sesi yüklenemedi; internet bağlantını kontrol et']; return `<div class="vstat ${c}"><span class="dot"></span>${t}<button class="say" style="margin-left:auto" data-act="pi-hello" aria-label="Pi'yi dinle">🔊</button></div>`; })()}
        <div><b class="sm">Günlük hedef</b><div class="row" style="margin-top:6px;flex-wrap:wrap">${[20, 50, 80, 120].map(g => `<button class="chip ${A.st.dailyGoal === g ? 'on' : ''}" data-act="goal" data-v="${g}">${g} XP</button>`).join('')}</div></div>
        <button class="btn ghost small" data-act="buy-freeze">🧊 Seri koruyucu al (50 💎)</button>
      </div></div>${nav()}`;
  }

  function cloudCard() {
    if (!CL || !CL.ayarli) return `<div class="card" style="margin-top:14px"><b>☁️ Bulut hesabı</b><p class="muted sm" style="margin:6px 0 0">Sunucu henüz bağlanmadı. Bağlanınca ilerleme buluta kaydedilir, telefon değişse de kaybolmaz; lig gerçek öğrencilerle oynanır ve rapor her pazar kendiliğinden gider.</p></div>`;
    if (CL.durum === 'hata') return `<div class="card" style="margin-top:14px"><b>☁️ Bulut hesabı</b><p class="muted sm">Sunucuya şu an ulaşılamıyor. Uygulama çevrimdışı çalışmaya devam ediyor.</p></div>`;
    if (!CL.oturum) return `<div class="card" style="margin-top:14px"><b>☁️ Bulut hesabı (veli)</b><p class="muted sm" style="margin:6px 0 10px">E-posta adresinize bir giriş bağlantısı gönderelim. Şifre gerekmez.</p><div class="field"><input id="f-cloudmail" type="email" placeholder="veli@ornek.com" value="${esc((A.st.profile || {}).parentEmail || '')}"></div><button class="btn small" style="margin-top:8px" data-act="cloud-login">Giriş bağlantısı gönder</button></div>`;
    return `<div class="card" style="margin-top:14px"><b>☁️ Bulut hesabı bağlı</b><p class="muted sm" style="margin:6px 0 10px">${esc(CL.oturum.user.email)} · ${CL.sonKayit ? 'son kayıt ' + new Date(CL.sonKayit).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'kaydediliyor'}</p><button class="btn ghost small" data-act="cloud-logout">Çıkış yap</button></div>`;
  }
  // Veli alanı şifreli: çocuk kendi hakkındaki veli raporunu (zayıf konular, yanılgılar) görmesin diye.
  // Bu bir "çocuk kapısı"dır, kriptografik güvenlik değildir (veri zaten bu cihazda).
  const pinOzet = (tuz, pin) => { let h = 2166136261 >>> 0; const m = 'my-veli|' + tuz + '|' + pin; for (let k = 0; k < 2000; k++) for (let i = 0; i < m.length; i++) { h ^= m.charCodeAt(i) + k; h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); };
  function veliKapisi() {
    const V = A.st.veli, ad = esc((A.st.profile || {}).name || 'Çocuğunuz');
    const ust = `<div class="center" style="margin:10px 0 6px;font-size:44px">🔒</div><h2 class="center">Veli alanı</h2>
      <div class="card veli-cocuk"><b>Merhaba ${ad}! 🙂</b> Burası anne-baban için. Kendi gelişimini görmek istersen <b>Ben</b> sekmesine bak.<button class="btn small" style="margin-top:10px" data-act="tab" data-v="profil">🧠 Ben sekmesine git</button></div>`;
    if (!V || !V.pin) return `${topbar()}<div class="scroll">${ust}
      <div class="card"><b>Velisi misiniz? Önce bir şifre belirleyin.</b><p class="muted sm" style="margin:6px 0 10px">Haftalık gelişim raporu, veli bilgileri ve onaylar bu şifrenin arkasında durur. 4 rakam; çocuğunuzun bilmediği bir şifre seçin.</p>
        <div class="field"><label>Şifre (4 rakam)</label><input id="f-pin1" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="new-password"></div>
        <div class="field"><label>Şifre tekrar</label><input id="f-pin2" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="new-password"></div>
        <button class="btn" style="margin-top:8px" data-act="veli-pin-kur">Şifreyi belirle ve gir</button></div></div>${nav()}`;
    return `${topbar()}<div class="scroll">${ust}
      <div class="card"><b>Veli şifresi</b>
        <div class="field"><input id="f-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" aria-label="Veli şifresi" placeholder="• • • •"></div>
        <button class="btn" style="margin-top:8px" data-act="veli-pin-gir">Gir</button>
        <button class="btn ghost small" style="margin-top:8px" data-act="veli-unuttum">Şifremi unuttum</button></div></div>${nav()}`;
  }
  function veliBilgiFormu(p) {
    return `<div class="card" style="margin-top:14px"><b>Bilgileri düzenle</b>
      <div class="field"><label>Çocuğun adı (uygulamada görünen)</label><input id="f-cname" value="${esc(p.name || '')}" maxlength="30"></div>
      <div class="field"><label>Velinin adı soyadı</label><input id="f-pname" value="${esc(p.parentName || '')}"></div>
      <div class="field"><label>Velinin telefonu (WhatsApp)</label><input id="f-pphone" type="tel" inputmode="tel" value="${esc(p.parentPhone || '')}" placeholder="05xx xxx xx xx"></div>
      <div class="field"><label>Velinin e-postası (isteğe bağlı)</label><input id="f-pmail" type="email" value="${esc(p.parentEmail || '')}"></div>
      <label class="check"><input type="checkbox" id="f-kvkk" ${p.kvkk ? 'checked' : ''}> Velisi olarak, bu bilgilerin yalnızca gelişim raporu göndermek amacıyla kullanılmasına onay veriyorum. (Prototipte veriler sadece bu cihazda saklanır.)</label>
      <div class="row" style="margin-top:10px"><button class="btn small" data-act="veli-kaydet">Kaydet</button><button class="btn ghost small" data-act="veli-vazgec">Vazgeç</button></div></div>`;
  }
  // Veli raporunun görsel hali: kartlar ve çubuklar. Metin hali (paylaşılan) değişmedi, altta açılır kutuda.
  function veliGorsel(R) {
    const fp = R.fp, yz = x => Math.round(x * 100), GUN = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const enCok = Math.max(10, ...R.gunluk.map(g => g.dk));
    const gunler = `<div class="rgun">${R.gunluk.map(g => `<div><div class="rgun-c"><i style="height:${g.dk ? Math.max(6, Math.round(100 * g.dk / enCok)) : 0}%"></i></div><b>${g.dk || ''}</b><small>${GUN[new Date(g.at).getDay()]}</small></div>`).join('')}</div><div class="muted sm">Günlük çalışma (dakika). Günde 10–15 dakika yeterli.</div>`;
    const tema = R.temalar.filter(t => t.n).map(t => `<div class="row rbar"><div class="rbar-ad sm"><b>${t.ikon} ${esc(t.ad)}</b><small class="muted">${t.n}/${t.top} konu</small></div><div class="bar grow"><i style="width:${yz(t.m)}%;background:var(--${t.renk})"></i></div><div class="sm rbar-y">%${yz(t.m)}</div></div>`).join('') || '<div class="muted sm">Henüz çalışılan tema yok.</div>';
    const chip = (arr, cls) => arr.map(x => `<span class="tag ${cls}">${esc(x.title || x.t)}</span>`).join(' ');
    const konular = (fp.strong.length || fp.weak.length) ? `${fp.strong.length ? `<div class="rsat"><span class="sm"><b>💪 Güçlü</b></span> ${chip(fp.strong, 'ok')}</div>` : ''}${fp.weak.length ? `<div class="rsat"><span class="sm"><b>🎯 Destek gereken</b></span> ${chip(fp.weak, 'warm')}</div>` : ''}` : '<div class="muted sm">Güçlü/zayıf konu için bir konuda en az 4 cevap gerekir.</div>';
    const K = fp.kanit, kanit = K && K.n >= 5 ? `<div class="kanitbar"><i class="k1" style="width:${K.ilk * 100}%"></i><i class="k2" style="width:${K.ipucu * 100}%"></i><i class="k3" style="width:${K.cozum * 100}%"></i></div><div class="kanitlej sm"><span><b class="k1"></b>İlk denemede %${yz(K.ilk)}</span><span><b class="k2"></b>İpucuyla %${yz(K.ipucu)}</span><span><b class="k3"></b>Çözüm gösterildi %${yz(K.cozum)}</span><span>(${K.n} cevap)</span></div>` : '<div class="muted sm">En az 5 cevaptan sonra görünür.</div>';
    const pr = fp.problem, prob = pr.sayi >= 2 ? `<div class="card rkart"><h3>🧩 Problem çözme <span class="muted sm">(${pr.sayi} problem)</span></h3>${pr.asamalar.filter(a => a.n).map(a => `<div class="row rbar"><div class="rbar-ad sm"><b>${a.ad}</b></div><div class="bar grow"><i style="width:${yz(a.acc)}%"></i></div><div class="sm rbar-y">%${yz(a.acc)} <small class="muted">${a.ok}/${a.n}</small></div></div>`).join('')}${pr.bagimsiz ? `<div class="row rbar"><div class="rbar-ad sm"><b>🎯 Tek başına</b></div><div class="bar grow"><i style="width:${yz(pr.bagimsiz.acc)}%;background:var(--ok)"></i></div><div class="sm rbar-y">%${yz(pr.bagimsiz.acc)} <small class="muted">${pr.bagimsiz.ok}/${pr.bagimsiz.n}</small></div></div>` : ''}${R.probIcgoru ? `<div class="ricgoru">💡 ${esc(R.probIcgoru)}</div>` : ''}</div>` : '';
    const misSat = (arr, ic, bas) => arr.length ? `<div class="rsat"><span class="sm"><b>${ic} ${bas}</b></span><ul class="rmis">${arr.map(m => `<li>${esc(m.t)}</li>`).join('')}</ul></div>` : '';
    const mis = misSat(R.act, '🧩', 'Üzerinde çalışılıyor (farklı sorularda tekrarladı)') + misSat(R.olasi, '🔎', 'Olası güçlük (bir kez görüldü, izleniyor)') + misSat(R.fixed, '🌟', 'Düzeltti');
    return `<div class="card rkart"><h3>📅 Bu hafta</h3>${gunler}</div>
      <div class="card rkart"><h3>📚 Konulara göre ustalık</h3>${tema}${konular}</div>
      <div class="card rkart"><h3>🧾 Cevaplar nasıl geldi?</h3>${kanit}</div>
      ${prob}
      ${mis ? `<div class="card rkart"><h3>🧠 Kavram yanılgıları</h3>${mis}</div>` : ''}
      <div class="card rkart roneri"><h3>👨‍👩‍👧 Bu hafta için öneri</h3><p style="margin:4px 0 0">${esc(R.tip)}</p>${fp.bestFormat ? `<p class="muted sm" style="margin:8px 0 0">En iyi öğrendiği anlatım: <b>${FORMATS[fp.bestFormat].name}</b> · Çalışma tarzı: <b>${fp.pace}</b></p>` : ''}</div>`;
  }
  function viewParent() {
    if (!A.veliAcik) return veliKapisi();
    const p = A.st.profile || {}, R = E.parentReport(A.st), txt = R.text;
    const phone = String(p.parentPhone || '').replace(/\D/g, ''), intl = phone.startsWith('90') ? phone : phone.startsWith('0') ? '9' + phone : phone.length === 10 ? '90' + phone : phone;
    const wa = `https://wa.me/${intl}?text=${encodeURIComponent(txt)}`, tg = `https://t.me/share/url?url=${encodeURIComponent('Matematik Yolu')}&text=${encodeURIComponent(txt)}`, mail = `mailto:${encodeURIComponent(p.parentEmail || '')}?subject=${encodeURIComponent('Matematik Yolu – Haftalık Rapor: ' + (p.name || ''))}&body=${encodeURIComponent(txt)}`;
    return `${topbar()}<div class="scroll"><div class="row" style="align-items:center"><h2 class="sect grow">Veli Raporu</h2><button class="btn ghost small" data-act="veli-kilitle" aria-label="Veli alanını kilitle">🔒 Kilitle</button></div>
      <div class="kv" style="margin-bottom:12px"><div class="card"><span class="muted sm">Bu hafta</span><b>${R.mins} dk</b></div><div class="card"><span class="muted sm">Doğruluk</span><b>%${R.acc}</b></div><div class="card"><span class="muted sm">Aktif gün</span><b>${R.daysActive}/7</b></div><div class="card"><span class="muted sm">Çözülen soru</span><b>${R.qn}</b></div></div>
      ${veliGorsel(R)}
      <details class="card rmetin"><summary><b>📝 Gönderilecek mesaj metni</b> <span class="muted sm">(WhatsApp/e-posta ile bu gider)</span></summary><pre class="report">${esc(txt)}</pre></details>
      <div class="share" style="margin-top:12px"><a class="btn wa" href="${wa}" target="_blank" rel="noopener">WhatsApp</a><a class="btn tg" href="${tg}" target="_blank" rel="noopener">Telegram</a><a class="btn ghost" href="${mail}">E-posta</a><button class="btn ghost" data-act="copy">Kopyala</button></div>
      ${cloudCard()}
      ${A.veliDuzenle ? veliBilgiFormu(p) : `<div class="card" style="margin-top:14px"><b>Veli: ${esc(p.parentName || '—')}</b><div class="muted sm">📞 ${esc(p.parentPhone || 'telefon eklenmedi')} · ✉️ ${esc(p.parentEmail || 'e-posta eklenmedi')}</div><button class="btn ghost small" style="margin-top:10px" data-act="edit-profile">Bilgileri düzenle</button>
      <p class="muted sm" style="margin:10px 0 0">Bu prototipte rapor tek dokunuşla gönderilir. Her hafta <b>otomatik</b> gönderim, sunucu sürümünde (WhatsApp Business API / e-posta servisi) veli onayıyla çalışır.</p></div>`}
      <div class="card" style="margin-top:14px"><b>Tehlikeli bölge</b><p class="muted sm" style="margin:6px 0 10px">Çocuğun bütün ilerlemesi, rozetleri, veli bilgileri ve veli şifresi bu cihazdan silinir. Geri alınamaz.</p><button class="btn ghost small" data-act="reset" style="color:var(--bad)">Tüm verileri sıfırla</button></div></div>${nav()}`;
  }

  /* ---------------- Beceri sayfası (modal) ---------------- */
  function skillModal(id) {
    const s = SKILL[id], sk = A.st.skills[id], th = THEMES.find(t => t.id === s.theme), m = E.eff(sk), cr = E.crowns(m), un = unlocked(s);
    return `<div class="scrim" data-act="close-modal"></div><div class="modal"><div class="row"><div class="grow"><span class="tag">${th.no}. Tema · ${esc(th.title)}</span><h2 style="margin-top:6px">${esc(s.title)}</h2></div><div style="font-size:40px">${th.icon}</div></div>
      <div class="row" style="margin:12px 0"><div class="grow"><div class="bar"><i style="width:${Math.round(m * 100)}%;background:var(--${th.color})"></i></div></div><b>${'⭐'.repeat(cr) || '☆'}</b></div>
      <p class="muted sm" style="margin:0 0 14px">Ustalık: %${Math.round(m * 100)} · ${sk.n} soru · 📗 ${th.book}. Kitap, ${th.no}. Tema</p>
      ${un ? `<div class="list"><button class="btn" data-act="start" data-v="${id}">${sk.n ? 'Derse devam' : 'Derse başla'} · +XP</button><button class="btn ghost" data-act="learn" data-v="${id}">📖 Önce konu anlatımı</button></div>` : `<div class="speech">🔒 Bu beceri, bir önceki beceriyi bitirince açılır. Okulda bu konuya geçtiysen "Atla" ile hemen başlayabilirsin.</div><div class="list" style="margin-top:12px"><button class="btn accent" data-act="start" data-v="${id}">Atla ve başla</button></div>`}
    </div>`;
  }

  /* ---------------- Konu anlatım kartı ---------------- */
  function cardHTML(id, fmt, act = 'fmt') {
    const s = SKILL[id], c = s.cards[fmt];
    let body = '';
    if (fmt === 'gorsel') body = `<p>${parcala(c.text)}</p><div class="visbox cizim">${c.vis()}</div>`;
    if (fmt === 'hikaye') body = `<div class="row" style="align-items:flex-start">${mascot('happy', 56)}<p class="grow">${parcala(c)}</p></div>`;
    if (fmt === 'adim') body = `${DERS_SAHNE[id] ? `<div class="visbox ders-sahne" data-sahne="${id}">${DERS_SAHNE[id](0)}</div>` : ''}<ol>${c.map(x => `<li class="dp">${x}</li>`).join('')}</ol>`;
    if (fmt === 'kural') body = `<div class="rule">${parcala(c)}</div>`;
    const rec = E.formatRank(A.st)[0];
    return `<div class="lcard"><div class="ftabs">${Object.entries(FORMATS).map(([k, f]) => `<button class="chip ${k === fmt ? 'on' : ''}" data-act="${act}" data-v="${k}">${f.icon} ${f.name}${rec.f === k && rec.n >= 2 ? ' ★' : ''}</button>`).join('')}</div>
      <div class="row" style="justify-content:space-between;margin-bottom:4px"><h3>${esc(s.title)}</h3><button class="chip" data-act="say-card" data-v="${fmt}" data-s="${id}">▶️ Pi anlatsın</button></div>${body}</div>`;
  }
  const explainModal = (id, f) => `<div class="scrim" data-act="close-modal"></div><div class="modal">${cardHTML(id, f, 'fmt-modal')}<button class="btn" data-act="close-modal">Tamam, anladım</button></div>`;
  const confirmModal = (title, body, yes, yesT, noT) => `<div class="scrim" data-act="close-modal"></div><div class="modal"><div class="row" style="align-items:flex-start">${mascot('think', 64)}<div class="grow"><h2 style="font-size:21px">${title}</h2><p class="muted" style="margin:6px 0 14px;font-weight:700">${body}</p></div></div><div class="list"><button class="btn" data-act="close-modal">${noT}</button><button class="btn ghost" style="color:var(--bad)" data-act="${yes}">${yesT}</button></div></div>`;
  const cardText = (id, fmt) => { const c = SKILL[id].cards[fmt]; return fmt === 'gorsel' ? c.text : fmt === 'adim' ? c.join('. ') : c; };

  /* ---------------- Ders ekranı ---------------- */
  function viewLesson() {
    const ses = A.ses, q = A.q;
    const pct = ses.mode === 'speed' ? 100 * (1 - Math.max(0, ses.left) / 60) : Math.min(100, 100 * ses.i / ses.len);
    const head = `<div class="lhead"><button class="x" data-act="quit" aria-label="Çık">✕</button><div class="prog"><i style="width:${pct}%;${ses.mode === 'speed' ? 'background:var(--accent)' : ''}"></i></div>${ses.mode === 'speed' ? `<div class="timer">${Math.max(0, Math.ceil(ses.left))} sn</div>` : ses.mode === 'exam' ? `<div class="combo" style="color:var(--brand)">🏆 ${Math.min(ses.i + 1, ses.len)}/${ses.len}</div>` : ''}</div>${ses.streak >= 2 && ses.mode !== 'speed' ? `<div class="kombo ${ses.streak >= 5 ? 'hot' : ''}">⚡ KOMBO x${ses.streak}</div>` : ''}`;
    if (ses.showCard) {
      return `<div class="lesson">${head}<div class="lbody"><div class="row" style="margin:0 0 6px">${piKonus(68)}<div class="speech grow">Önce sana bu konuyu <b>${FORMATS[ses.format].name.toLocaleLowerCase('tr-TR')}</b> anlatayım. Olmazsa başka türlü anlatırım!</div></div>${cardHTML(ses.skill, ses.format)}</div>
        <div class="lfoot"><button class="btn ghost" style="flex:1" data-act="other-fmt">🔄 Başka türlü</button><button class="btn" style="flex:1.3" data-act="card-ok">Anladım!</button></div></div>`;
    }
    const s = SKILL[q.skill];
    let ans = '';
    if (q.type === 'match') ans = matchBoard(q);
    else if (q.type === 'kes') ans = kesBoard(q);
    else if (q.type === 'tablo') ans = tabloBoard(q);
    else if (q.type === 'kur') ans = kurBoard(q);
    else if (q.type === 'input') ans = `<div class="inbox"><div class="val ${A.input ? '' : 'empty'}">${A.input ? esc(A.input) : '?'}</div>${q.unit ? `<div class="unit">${esc(q.unit)}</div>` : ''}</div><div class="pad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫'].map(k => `<button data-act="key" data-v="${k}" ${A.fb ? 'disabled' : ''}>${k}</button>`).join('')}</div>`;
    else {
      const cls = q.type === 'tf' || q.hata === 'kim' ? 'tf' : q.type === 'cmp' ? 'cmp' : q.hata === 'bul' ? 'defter-sec' : '';
      const cmp = q.type === 'cmp' ? `<div class="cmpline"><span>${q.cmp[0]}</span><span class="cmpbox">${A.sel !== null ? q.options[A.sel].t.replace('<', '&lt;').replace('>', '&gt;') : '?'}</span><span>${q.cmp[1]}</span></div>` : '';
      const grid = q.grid ? `<div class="pgrid">${q.grid.map(r => `<div class="pcell">${r[0]}</div><div class="pcell ${r[1] === '?' ? 'miss' : ''}">${r[1] === '?' ? (A.sel !== null ? q.options[A.sel].t : '?') : r[1]}</div>`).join('')}</div>` : '';
      ans = grid + cmp + (q.hata === 'bul' ? `<div class="dad">✏️ ${esc(U.wk(q.ad, 'in'))} defteri</div>` : '') + `<div class="opts ${cls} ${q.cards ? 'cards' : ''}">${q.options.map((o, i) => { let c = ''; if (A.fb && A.fb.tahmin) { if (i === A.sel) c = 'sel'; } else if (A.fb) { if (o.ok) c = 'right'; else if (i === A.sel) c = 'wrong'; } else if (i === A.sel) c = 'sel'; const t = q.type === 'cmp' ? o.t.replace('<', '&lt;').replace('>', '&gt;') : o.t; const el = (A.elenen || []).includes(i); if (el && !(A.fb && o.ok)) c = 'elendi'; return `<button class="opt ${c}" data-act="opt" data-v="${i}" ${A.fb || el ? 'disabled' : ''}>${q.type === 'mc' && !q.hata ? `<span class="k">${i + 1}</span>` : ''}<span>${t}</span></button>`; }).join('')}</div>`;
    }
    const ready = q.type === 'input' ? A.input.length > 0 : q.type === 'match' ? false : q.type === 'tablo' ? A.tb.every(Boolean) : q.type === 'kur' ? E.ATOLYE.kurGecerli(q, A.kur) : q.type === 'kes' ? (q.model === 'line' ? A.kes.konum !== null : A.kes.on.some(Boolean)) : A.sel !== null;
    const isNew = A.ses.mode === 'lesson' && A.st.skills[q.skill].lessons === 0 && A.ses.i < 3 && !q.rescue;
    const badge = isNew ? '<span class="tag new">✨ YENİ KONSEPT</span>' : q.exam ? '<span class="tag">🏆 Tema sınavı</span>' : q.rescue ? '<div class="rescue-note">💪 Hadi bir daha deneyelim! Bu soru aynı konudan, biraz daha kolay.</div>' : q.hata ? '<span class="tag hata">🔍 Hata Avcısı</span>' : q.atolye ? `<span class="tag atolye">🧩 Problem Atölyesi · ${q.atolye.no || 1}. problem</span>` : q.review ? '<span class="tag ok">⏰ Tekrar sorusu</span>' : q.replay ? '<span class="tag warm">🕵️ Eski hatan</span>' : q.ref ? '<span class="tag">📗 Kitaptaki soru tipinden</span>' : '';
    const hint = A.showHint ? `<div class="hintbox">💡 ${q.hint || (q.steps && q.steps[0]) || 'Soruyu dikkatlice tekrar oku.'}</div>` : '';
    return `<div class="lesson">${head}<div class="lbody" id="lbody">${badge}<div class="muted sm" style="font-weight:800;margin-top:6px">${esc(s.title).toLocaleUpperCase('tr-TR')} · ${'●'.repeat(q.level)}${'○'.repeat(3 - q.level)}</div>
      ${q.atolye ? atolyePanel(q) : ''}<div class="qrow">${piKonus(70, 'say-q')}<div class="qprompt balon">${q.prompt} <button class="say" data-act="say-q" aria-label="Soruyu oku">🔊</button></div></div>${hint}${q.visual ? `<div class="visbox">${q.visual}</div>` : ''}${q.defter ? defterHTML(q) : ''}${A.ikinci && !A.fb ? `<div class="ikinci"><b>🤔 Bir daha düşün!</b>${A.ikinci.once ? ` <span class="muted sm">(Önceki cevabın: ${esc(A.ikinci.once)})</span>` : ''}<div>💡 ${A.ikinci.ipucu}</div></div>` : ''}${ans}</div>
      ${A.fb || q.type === 'match' ? '' : `<div class="lfoot">${ses.mode !== 'speed' ? `<button class="btn ghost hintb" data-act="hint" aria-label="İpucu">💡</button>` : ''}<button class="btn ${ready ? 'ok' : ''}" data-act="check" ${ready ? '' : 'disabled'}>Kontrol et</button></div>`}
      ${A.fb ? feedbackSheet() : ''}</div>`;
  }

  /* ---------- Anla tablosu: her bilgi satırında Verilen / Önce bul / Sorulan düğmeleri (sürükle-bırak yok, tek dokunuş) ---------- */
  function tabloBoard(q) {
    const AD = E.ATOLYE.TABLO_AD, ic = { v: '📥', a: '🔧', s: '🎯' };
    return `<div class="tablo">${q.satirlar.map((r, i) => { const sec = A.tb[i], dur = A.fb ? (A.fb.ok || sec === r.d ? 'dogru' : 'yanlis') : '';
      return `<div class="tsatir ${dur}"><div class="tmetin">${r.t}${A.fb && sec !== r.d ? ` <small>→ ${AD[r.d]}</small>` : ''}</div><div class="tsec">${['v', 'a', 's'].map(d => `<button class="${sec === d ? 'on' : ''} t${d}" data-act="tb" data-v="${i}:${d}" ${A.fb ? 'disabled' : ''} aria-pressed="${sec === d}">${ic[d]} ${AD[d]}</button>`).join('')}</div></div>`; }).join('')}</div>`;
  }
  /* ---------- Kartlarla işlem kur: sayı kartı bir kez, işlem kartları sınırsız; değer kodla hesaplanır ---------- */
  const kurMetin = (q, t) => t.map(x => /^n\d+$/.test(x) ? U.fmtN(q.kartlar[+x.slice(1)]) : x).join(' ').replace(/\( /g, '(').replace(/ \)/g, ')');
  function kurBoard(q) {
    const kul = new Set(A.kur.filter(x => /^n\d+$/.test(x))), dis = !!A.fb, gec = E.ATOLYE.kurGecerli(q, A.kur);
    const deger = gec ? E.ATOLYE.sayiYaz(E.ATOLYE.ifadeHesapla(E.ATOLYE.kurIfade(q, A.kur))) : null;
    return `<div class="kur"><div class="kifade ${A.kur.length ? '' : 'bos'}">${A.kur.length ? esc(kurMetin(q, A.kur)) : 'Kartlara dokunarak işlemi kur 👇'}${A.fb && deger !== null ? ` <b>= ${deger}</b>` : ''}</div>
      <div class="kkart">${q.kartlar.map((k, i) => `<button class="ksayi" data-act="kur-k" data-v="${i}" ${dis || kul.has('n' + i) ? 'disabled' : ''}>${U.fmtN(k)}</button>`).join('')}</div>
      <div class="kop">${['+', '−', '×', '÷', '(', ')'].map(o => `<button data-act="kur-o" data-v="${o}" ${dis ? 'disabled' : ''}>${o}</button>`).join('')}<button data-act="kur-sil" ${dis || !A.kur.length ? 'disabled' : ''} aria-label="Son kartı sil">⌫</button></div>
      <div class="kes-not">Her sayı kartını bir kez kullanabilirsin. İstersen parantez kullan.</div></div>`;
  }

  /* ---------- Parmakla kesir: böl, boya, sayı doğrusunda göster ---------- */
  function kesBoard(q) {
    const K = A.kes, fb = A.fb, P = K.parca, b = K.on.filter(Boolean).length, [n, d] = q.hedef;
    const dis = fb ? 'disabled' : '';
    if (q.model === 'line') {
      const N = d * q.ust, W = 320, x0 = 22, x1 = W - 22, dx = (x1 - x0) / N, y = 62;
      let g = `<line x1="${x0 - 8}" y1="${y}" x2="${x1 + 8}" y2="${y}" class="kl-ana"/>`;
      for (let k = 0; k <= N; k++) {
        const x = x0 + k * dx, tam = k % d === 0, cls = fb && k === n ? 'dogru' : fb && k === K.konum && !fb.ok ? 'yanlis' : k === K.konum ? 'sec' : '';
        g += `<line x1="${x}" y1="${y - (tam ? 16 : 10)}" x2="${x}" y2="${y + (tam ? 16 : 10)}" class="kl-cizgi ${tam ? 'tam' : ''}"/>`;
        if (tam) g += `<text x="${x}" y="${y + 38}" class="kl-yazi">${k / d}</text>`;
        if (cls) g += `<g class="kl-pin ${cls}"><circle cx="${x}" cy="${y - 30}" r="11"/><path d="M${x - 7},${y - 24} L${x},${y - 6} L${x + 7},${y - 24} Z"/></g>`;
        g += `<rect x="${x - dx / 2}" y="${y - 46}" width="${dx}" height="92" class="kl-hedef" ${fb ? '' : `data-act="kes-nokta" data-v="${k}"`}><title>${k}. çizgi</title></rect>`;
      }
      return `<div class="kes"><svg class="kes-svg" viewBox="0 0 ${W} 112" role="group" aria-label="Sayı doğrusu: 0 ile ${q.ust} arası, her birlik ${d} eş aralık">${g}</svg>
        <div class="kes-not">${K.konum === null ? 'Doğru çizgiye dokun 👆' : `Seçtiğin yer: 0'dan <b>${K.konum}</b> aralık sonra`}</div></div>`;
    }
    let shape = '';
    if (q.model === 'pie') {
      const R = 92, c = 100;
      if (P === 1) shape = `<circle cx="${c}" cy="${c}" r="${R}" class="kd ${K.on[0] ? 'on' : ''}" ${dis ? '' : 'data-act="kes-dilim" data-v="0"'}/>`;
      else for (let i = 0; i < P; i++) {
        const a0 = (-90 + 360 * i / P) * Math.PI / 180, a1 = (-90 + 360 * (i + 1) / P) * Math.PI / 180;
        shape += `<path d="M${c},${c} L${(c + R * Math.cos(a0)).toFixed(2)},${(c + R * Math.sin(a0)).toFixed(2)} A${R},${R} 0 ${P === 2 ? 0 : 0} 1 ${(c + R * Math.cos(a1)).toFixed(2)},${(c + R * Math.sin(a1)).toFixed(2)} Z" class="kd ${K.on[i] ? 'on' : ''}" ${dis ? '' : `data-act="kes-dilim" data-v="${i}"`}/>`;
      }
      shape = `<svg class="kes-svg pie" viewBox="0 0 200 200" role="group" aria-label="${P} dilimli daire, ${b} dilim boyalı">${shape}</svg>`;
    } else {
      const W = 320, w = (W - 8) / P;
      for (let i = 0; i < P; i++) shape += `<rect x="${(4 + i * w).toFixed(2)}" y="6" width="${w.toFixed(2)}" height="70" rx="5" class="kd ${K.on[i] ? 'on' : ''}" ${dis ? '' : `data-act="kes-dilim" data-v="${i}"`}/>`;
      shape = `<svg class="kes-svg bar" viewBox="0 0 ${W} 82" role="group" aria-label="${P} parçalı şerit, ${b} parça boyalı">${shape}</svg>`;
    }
    const step = q.parca ? '' : `<div class="kes-adim"><button class="btn ghost" data-act="kes-parca" data-v="-1" ${dis || P <= 1 ? 'disabled' : ''} aria-label="Dilim azalt">−</button><div><b>${P}</b><small>${q.model === 'pie' ? 'dilim' : 'parça'}</small></div><button class="btn ghost" data-act="kes-parca" data-v="1" ${dis || P >= 12 ? 'disabled' : ''} aria-label="Dilim artır">+</button></div>`;
    const oku = q.denk || !q.parca ? `Boyadığın: <span class="kes-fr">${U.fr(b, P)}</span>` : `Boyalı parça: <b>${b}</b>`;
    return `<div class="kes">${step}${shape}<div class="kes-not">${oku}</div></div>`;
  }

  /* ---------- Çiftleri eşleştir ---------- */
  function matchBoard(q) {
    const M = A.mt; const cell = (side, idx) => { const pi = side === 'L' ? M.L[idx] : M.R[idx], html = side === 'L' ? q.pairs[pi].a : q.pairs[pi].b;
      const done = M.done.includes(pi), sel = (side === 'L' ? M.sL : M.sR) === idx, bad = M.bad && M.bad[side] === idx, just = M.just === pi;
      return `<button class="mcell ${done ? (just ? 'ok just' : 'gone') : ''} ${sel ? 'sel' : ''} ${bad ? 'bad' : ''}" data-act="mt" data-v="${side}${idx}" ${done || A.fb ? 'disabled' : ''}>${html}</button>`; };
    return `<div class="mboard">${M.L.map((_, i) => cell('L', i) + cell('R', i)).join('')}</div>`;
  }
  function matchTap(code) {
    const M = A.mt, side = code[0], idx = +code.slice(1);
    if (side === 'L') M.sL = M.sL === idx ? null : idx; else M.sR = M.sR === idx ? null : idx;
    M.bad = null; sfx.tap();
    if (M.sL !== null && M.sR !== null) {
      const a = M.L[M.sL], b = M.R[M.sR];
      if (a === b) { M.done.push(a); M.just = a; M.sL = M.sR = null; sfx.pair(M.done.length - 1);
        setTimeout(() => { if (A.mt === M) { M.just = null; render(); } }, 650);
        if (M.done.length === M.L.length) { render(); setTimeout(() => finishMatch(), 450); return; } }
      else { M.mist++; M.bad = { L: M.sL, R: M.sR }; M.sL = M.sR = null; sfx.bad(); if (navigator.vibrate) try { navigator.vibrate(60); } catch (e) { } setTimeout(() => { if (A.mt === M) { M.bad = null; render(); } }, 500); }
    }
    render();
  }
  function finishMatch() {
    const q = A.q, M = A.mt, res = { ok: M.mist <= 1, partial: M.mist === 1, mis: M.mist >= 2 ? q.mis : null };
    const gain = E.record(A.st, A.ses, q, res, Date.now() - A.t0, false);
    A.fb = { ok: res.ok, partial: res.partial, mis: res.mis, gain }; save();
    if (res.ok && !res.partial) celebrate(q, gain); else if (res.partial) tone(660, .2, 'triangle'); else sfx.bad();
    render();
  }

  // Problem Atölyesi: aşama şeridi (Anla → Planla → Çöz → Kontrol) + problem kartı (her adımda görünür)
  function atolyePanel(q) {
    // Şeritte 5 durak: tahmin "Planla"nın, derinleştir "Kontrol et"in içinde gösterilir (dar ekranda sığsın)
    const a = q.atolye, sira = ['anla', 'plan', 'coz', 'kontrol', 'bagimsiz'], durak = { tahmin: 'plan', derin: 'kontrol' }[a.asama] || a.asama, cur = sira.indexOf(durak), AS = E.ATOLYE.ASAMA, bag = a.asama === 'bagimsiz';
    const th = A.ses && A.ses.tahmin && A.ses.tahmin[a.pid], thNot = th && ['coz', 'kontrol'].includes(a.asama) ? `<div class="thnot">📝 Tahminin: «${th.t}»</div>` : '';
    const bas = bag ? '🎯 Yeni problem · Tek başına' : a.asama === 'derin' ? '🌟 Derinleştir · Başka bir yol' : '🧩 ' + esc(a.baslik);
    return `<div class="atolye"><div class="aserit">${sira.map((k, i) => `<span class="${i === cur ? 'on' : i < cur ? 'bitti' : ''} ${k === 'bagimsiz' ? 'hedef' : ''}"><b>${i < cur ? '✓' : k === 'bagimsiz' ? '🎯' : i + 1}</b>${i === cur ? AS[a.asama] : AS[k]}</span>`).join('')}</div>
      <div class="abaglam ${a.asama === 'anla' || bag ? '' : 'kucuk'} ${bag ? 'yeni' : ''} ${a.asama === 'derin' ? 'derin' : ''}"><div class="abas">${bas}</div><div>${a.baglam}</div></div>${thNot}</div>`;
  }
  // Hata Avcısı: hayali öğrencinin defteri (kim haklı / neden). Hatalı satır "neden"de baştan, "kim"de cevaptan sonra işaretlenir.
  function defterHTML(q) {
    return `<div class="defterler ${q.defter.length > 1 ? 'iki' : ''}">${q.defter.map(d => `<div class="defter"><div class="dad">✏️ ${esc(U.wk(d.ad, 'in'))} defteri</div><ol>${d.satirlar.map((x, i) => `<li class="${d.isaret === i || (A.fb && d.hata === i) ? 'isaret' : ''}">${x}</li>`).join('')}</ol></div>`).join('')}</div>`;
  }
  const hataNotu = (q) => q.hata ? `<div class="duz">✏️ ${q.steps.slice(0, 2).join('<br>')}</div>` : '';
  // İkinci şans ipucu: önce şıkka/sayıya özel ipucu, sonra sorunun kendi ipucu (atölye adımları), sonra gözlenen yanılgının kuralı. Cevabı asla söylemez.
  // Metni değişen yanılgı açıklamalarının sesi yeni sürüm adıyla üretilir (telefonda saklanan eski ses çalınmasın)
  const MIS_SES_SURUM = { oruntu_baslangic: 2, oruntu_bir: 2, olasilik_oran: 2 };
  const misSes = (id) => `mis_${id}${MIS_SES_SURUM[id] ? '_' + MIS_SES_SURUM[id] : ''}`;
  function ikinciIpucu(q, res) {
    if (res.ip) return res.ip;
    if (q.ip) return q.ip;
    if (res.mis && res.mis !== 'genel' && MIS[res.mis]) return MIS[res.mis].fix;
    return q.hint || 'Soruyu bir daha, yavaşça oku. Hangi bilgiyi kullanman gerekiyor?';
  }
  // Çözümün son adımından sonra: tahmin tuttu mu?
  function tahminKarsilastir(q) {
    const th = q.atolye && q.atolye.sonCoz && A.ses.tahmin && A.ses.tahmin[q.atolye.pid]; if (!th) return '';
    return th.ok ? `<div class="tahk ok">🎯 Tahminin tuttu! <b>«${th.t}»</b></div>` : `<div class="tahk">📏 Tahminin <b>«${th.t}»</b> idi; cevap <b>«${th.dogru}»</b> aralığında. Bir dahaki sefere sayıları yuvarlayıp kafandan hesapla.</div>`;
  }
  function feedbackSheet() {
    const fb = A.fb, q = A.q;
    if (fb.tahmin) return `<div class="sheet tahc"><div class="row"><div class="grow"><h3>📝 Tahminini not ettim!</h3><div class="ans">«${fb.secilen}» · +${fb.gain} XP</div><div class="sub">Şimdi adım adım çöz. Sonunda tahmininle karşılaştıracağız.</div></div>${mascot('think', 64)}</div><button class="btn" data-act="next">Çözmeye başla</button></div>`;
    if (fb.ok && fb.partial) return `<div class="sheet partc"><div class="row"><div class="grow"><h3>🙂 İyi, ama tam olmadı!</h3><div class="ans">1 eşleştirmede takıldın · +${fb.gain} XP</div></div>${mascot('think', 64)}</div><button class="btn warn" data-act="next">Devam</button></div>`;
    if (fb.ok) return `<div class="sheet okc"><div class="row"><div class="grow"><h3>✅ ${fb.kanit === 'ipucu' && A.deneme === 2 ? 'İpucuyla buldun!' : (fb.word || pick(PRAISE))}</h3><div class="ans">+${fb.gain} XP${A.ses.streak >= 3 ? ` · 🔥 ${A.ses.streak} seri doğru` : ''}</div>${hataNotu(q)}${tahminKarsilastir(q)}</div>${mascot('happy', 70)}</div><button class="btn ok" data-act="next">Devam</button></div>`;
    const right = q.type === 'kes' || q.type === 'tablo' || q.type === 'kur' ? q.cevap : q.type === 'match' ? `<div class="mright">${q.pairs.map(p => `<span>${p.a}</span><b>↔</b><span>${p.b}</span>`).join('')}</div>` : q.type === 'input' ? `${esc(q.answer).replace('.', ',')} ${q.unit ? esc(q.unit) : ''}` : q.type === 'cmp' ? `${q.cmp[0]} <b>${esc(q.options.find(o => o.ok).t)}</b> ${q.cmp[1]}` : q.options.find(o => o.ok).t;
    // Seviye belirleme: ilk tanışmada açıklama yığını yok; sadece doğru cevap ve cesaret
    if (A.ses.mode === 'placement') return `<div class="sheet learnc"><div class="row"><div class="grow"><h3>🌱 Bunu birlikte öğreneceğiz!</h3><div class="ans">Doğru cevap: <span style="font-size:20px">${right}</span></div><div class="sub">Şimdilik seviyeni ölçüyorum. Burada yanlış yapmak hiç sorun değil.</div></div>${mascot('think', 64)}</div><button class="btn" data-act="next">Devam</button></div>`;
    const m = MIS[fb.mis] || MIS.genel;
    const steps = (q.steps || []).length ? `<details class="howto"><summary>🪜 Nasıl çözülür?</summary><ol class="steps">${q.steps.map(s => `<li>${s}</li>`).join('')}</ol></details>` : '';
    return `<div class="sheet learnc"><div class="row" style="align-items:flex-start"><div class="grow"><h3>💡 Neredeyse!</h3><div class="ans">Doğru cevap: <span style="font-size:20px">${right}</span></div>${q.duzeltme ? `<div class="duz">✏️ Doğrusu: ${q.duzeltme}</div>` : ''}${q.atolye && !['kontrol', 'derin', 'bagimsiz'].includes(q.atolye.asama) ? '<div class="sub">Bu adımın çözümünü birlikte gördük. Doğru değerle sıradaki adıma geçiyoruz; asıl deneme sondaki "Kendin dene" sorusu!</div>' : ''}${tahminKarsilastir(q)}</div>${mascot('sad', 64)}</div>
      ${fb.ac ? `<div class="mis baglamli"><b>🧭 Neden olmadı?</b><div style="margin-top:4px">${fb.ac}</div></div>` : ''}
      ${fb.mis !== 'genel' ? `<div class="mis ${fb.ac ? 'kural' : ''}"><div class="row" style="justify-content:space-between;align-items:flex-start;gap:8px"><b>${fb.ac ? 'Genel kural: ' : ''}${esc(m.t)}</b><button class="say" data-act="say-mis" data-v="${fb.mis}" aria-label="Açıklamayı dinle">🔊</button></div><div style="margin-top:4px">${m.fix}</div></div>` : ''}
      ${steps}
      <div class="row"><button class="btn ghost" style="flex:1" data-act="explain-other">🔄 Başka anlat</button><button class="btn" style="flex:1.3" data-act="next">Anladım</button></div></div>`;
  }

  /* ---------- Ders sonu ödül akışı: Yıldız/puan ekranı → sandık (dokunarak aç) → görev ilerlemesi ----------
     Yıldızlar cezalandırmaz: dersi bitiren en az 1 yıldız alır; %70+ 2, %90+ 3 yıldız. */
  const yildizSayisi = (acc) => acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
  const endAdimlari = (r, ses) => ['skor', ...(r.gemsWon ? ['sandik'] : []), ...(r.quests && (r.quests.got.length || r.quests.monthDone) ? ['gorev'] : [])];
  function viewEnd() {
    const adim = (A.endSteps || ['skor'])[A.endStep || 0];
    if (adim === 'sandik') return viewSandik();
    if (adim === 'gorev') return viewGorevIlerleme();
    const r = A.result, ses = A.ses, acc = Math.round(r.acc * 100), mins = Math.max(1, Math.round((Date.now() - ses.start) / 60000));
    const yildizli = !['placement', 'speed', 'hazir'].includes(ses.mode), ys = yildizSayisi(r.acc);
    const title = ses.mode === 'placement' ? 'Seviyeni belirledim!' : ses.mode === 'exam' ? (acc >= 70 ? 'Sınav başarılı!' : 'Az kaldı!') : ses.mode === 'hazir' ? 'Ön bilgin ölçüldü!' : ses.mode === 'speed' ? `${ses.correct} doğru!` : `${ys} yıldız kazandın!`;
    const resc = ses.rescueTry ? `<div class="speech">💪 ${ses.rescueTry} hatandan sonra <b>${ses.rescueOk}</b> kez doğruya döndün. Hata yapmak öğrenmenin parçası!</div>` : '';
    // Yay göstergesi: doğruluk oranı kadar dolar; 3 işaret = yıldız eşikleri (%0 bitirme, %70, %90)
    const R = 92, C = 2 * Math.PI * R, yay = C * 0.75, dolu = yay * Math.max(0.04, r.acc);
    const isaret = (t) => { const a = (135 + 270 * t) * Math.PI / 180; return `<circle cx="${110 + R * Math.cos(a)}" cy="${110 + R * Math.sin(a)}" r="9" class="isaret ${r.acc >= t ? 'on' : ''}"/>`; };
    const gosterge = yildizli ? `<div class="skor"><svg viewBox="0 0 220 200" aria-hidden="true"><circle cx="110" cy="110" r="${R}" class="yay-bos" stroke-dasharray="${yay} ${C}" transform="rotate(135 110 110)"/><circle cx="110" cy="110" r="${R}" class="yay-dolu" style="--yay:${yay};--dolu:${dolu}" stroke-dasharray="${dolu} ${C}" transform="rotate(135 110 110)"/>${isaret(0.0001)}${isaret(0.7)}${isaret(0.9)}</svg>
      <div class="skor-ic"><div class="skor-et">Puan</div><div class="skor-sayi" data-sayac="${ses.xp}">0</div></div>
      <div class="yildizlar">${[1, 2, 3].map(i => `<span class="yildiz ${i <= ys ? 'on' : ''}" style="animation-delay:${0.9 + i * 0.35}s">★</span>`).join('')}</div></div>` : mascot('happy', 130);
    return `<div class="end">${gosterge}<h1>${title}</h1>
      <div class="tiles"><div class="tile gold"><div class="h">XP</div><div class="v">⚡ ${ses.xp}</div></div><div class="tile okt"><div class="h">Doğruluk</div><div class="v">🎯 %${acc}</div></div><div class="tile bl"><div class="h">Süre</div><div class="v">⏱ ${mins} dk</div></div></div>
      ${resc}${r.newBadges.map(b => `<div class="card row" style="width:100%"><div style="font-size:40px">${b.icon}</div><div style="text-align:left"><b>Yeni rozet: ${b.name}</b><div class="muted sm">${b.desc}</div></div></div>`).join('')}
      ${ses.mode === 'speed' && ses.correct >= A.st.speedBest ? '<div class="tag warm">🏅 Yeni rekor!</div>' : ''}
      ${r.trophy ? (r.trophy.pass ? `<div class="card row" style="width:100%;border-color:var(--gold)"><div style="font-size:44px">🏆</div><div style="text-align:left"><b>Tema sınavını geçtin! (%${acc})</b><div class="muted sm">Kupa senin. +50 💎</div></div></div>` : `<div class="speech">Sınav için %70 gerekiyor. Zorlandığın becerileri çalışıp tekrar dene, kupa seni bekliyor! 💪</div>`) : ''}
      <div style="flex:1"></div><button class="btn" data-act="end-ok" style="max-width:420px">${(A.endSteps || []).length > 1 ? 'Devam' : 'Devam'}</button></div>`;
  }
  // Sandık: önce kapalı, çocuk dokununca açılır ve elmaslar çıkar (değişken ödül hissi; para ile satılmaz, elmas sadece seri koruyucuya gider)
  function viewSandik() {
    const r = A.result, acik = A.sandikAcik;
    return `<div class="end sandik-ekran ${acik ? 'acik' : ''}">
      <div class="sandik-ust">${acik ? 'Harika!' : (r.acc >= 0.9 ? 'EFSANE SANDIK' : r.acc >= 0.7 ? 'SÜPER SANDIK' : 'SANDIK')}</div>
      <button class="sandik" data-act="sandik-ac" aria-label="Sandığı aç" ${acik ? 'disabled' : ''}><img src="img/sandik_${acik ? 'acik' : 'kapali'}.webp" alt="" draggable="false" onerror="this.outerHTML='<span style=&quot;font-size:120px&quot;>${acik ? '💎' : '🎁'}</span>'"></button>
      ${acik ? `<div class="sandik-odul">+<span data-sayac="${r.gemsWon}">0</span> 💎</div><div class="sandik-alt">Elmaslarınla seri koruyucu alabilirsin.</div>` : '<div class="sandik-alt">Açmak için dokun!</div>'}
      <div style="flex:1"></div>${acik ? '<button class="btn" data-act="end-ok" style="max-width:420px">Devam</button>' : ''}</div>`;
  }
  // Görev ilerlemesi: günlük görev çubukları dolar, biten görevin ödülü yazar
  function viewGorevIlerleme() {
    const r = A.result, Q = E.quests(A.st), got = new Set(r.quests.got.map(q => q.ad)), mo = Q.month;
    const satir = (q) => `<div class="gi-satir ${q.ok ? 'tamam' : ''}"><div class="grow"><b>${q.ikon} ${esc(q.ad)}</b><div class="qbar"><i style="--hedef:${Math.round(100 * Math.min(1, q.v / q.hedef))}%"></i><span>${Math.min(q.v, q.hedef)} / ${q.hedef}</span></div></div><div class="gi-odul">${q.ok ? (got.has(q.ad) ? `<b>+${q.odul}💎</b>` : '✅') : `🎁<small>${q.odul}💎</small>`}</div></div>`;
    return `<div class="end gorev-ekran"><h1>+${r.quests.got.length} Görev!</h1>
      <div class="card list gi" style="width:100%">${Q.list.map(satir).join('')}</div>
      <div class="card gi-ay" style="width:100%"><div class="grow" style="text-align:left"><b>📅 ${esc(mo.ad)}</b><div class="qbar"><i style="--hedef:${Math.min(100, Math.round(100 * mo.done / mo.hedef))}%"></i><span>${mo.done} / ${mo.hedef}</span></div></div>${r.quests.monthDone ? '<b>+100 💎</b>' : ''}</div>
      <div style="flex:1"></div><button class="btn" data-act="end-ok" style="max-width:420px">Devam</button></div>`;
  }
  // Sayaçlar (puan ve elmas) 0'dan yukarı sayar
  const sayacBaslat = () => document.querySelectorAll('[data-sayac]').forEach(el => { const hedef = +el.dataset.sayac, t0 = performance.now(), sure = 900; const adim = (t) => { const k = Math.min(1, (t - t0) / sure); el.textContent = Math.round(hedef * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(adim); }; requestAnimationFrame(adim); });


  /* ---------------- Karşılama / kayıt ---------------- */
  function viewOnboard() {
    const o = A.onb, d = o.data, dots = `<div class="dots">${[0, 1, 3].map(i => `<i class="${i === o.step ? 'on' : ''}"></i>`).join('')}</div>`;
    if (o.step === 0) return `<div class="onb">${dots}<div class="center" style="margin-top:18px">${PI_GORSEL ? `<img class="hero" src="${PI_GORSEL}kahraman.webp" alt="Pi" onerror="this.outerHTML=window.MY_MASCOT_SVG('happy',150)">` : mascot('happy', 150)}</div><h1 class="center" style="font-size:30px">Merhaba, ben Pi!</h1><div class="center"><button class="chip" data-act="pi-hello">🔊 Pi'yi dinle</button></div><p class="center muted" style="font-size:18px;font-weight:700">5. sınıf matematiğini seninle oyun gibi öğreneceğiz. Her öğrenci başka bir çiçektir; ben de sana en uygun yolu bulacağım. 🌸</p><div style="flex:1"></div><button class="btn" data-act="onb-next">Başlayalım</button></div>`;
    if (o.step === 1) return `<div class="onb">${dots}<h2>Seni tanıyalım</h2>
      <div class="field"><label>Sana ne diyelim?</label><input id="f-name" value="${esc(d.name || '')}" placeholder="Örn: Ela" autocomplete="off" maxlength="30"></div>
      <p class="muted sm" style="margin:4px 0 0">Sadece adın yeter. Pi seni bu adla çağıracak. 🙂</p>
      <div style="flex:1"></div><button class="btn" data-act="onb-next">İleri</button></div>`;
    const ch = (k, ic, t, s) => `<button class="card choice ${d.motivation === k ? 'on' : ''}" data-act="motiv" data-v="${k}"><span class="ic">${ic}</span><span><b>${t}</b><br><span class="muted sm">${s}</span></span></button>`;
    return `<div class="onb">${dots}<h2>Seni en çok ne mutlu eder?</h2>
      ${ch('yaris', '🏆', 'Yarışmak', 'Ligde arkadaşlarımı geçmek, rekor kırmak')}${ch('koleksiyon', '🏅', 'Toplamak', 'Rozet, taç ve elmas biriktirmek')}${ch('kesif', '🧭', 'Keşfetmek', 'Hikâyeler ve yeni konular keşfetmek')}
      <div style="flex:1"></div><button class="btn" data-act="onb-finish" ${d.motivation ? '' : 'disabled'}>Seviyemi belirle (7 soru)</button><button class="btn ghost" data-act="onb-finish-skip" ${d.motivation ? '' : 'disabled'}>Sıfırdan başla</button></div>`;
  }

  /* =================== RENDER =================== */
  function render() {
    let h = '';
    if (!A.st.profile) h = viewOnboard();
    else if (A.view === 'lesson') h = viewLesson();
    else if (A.view === 'end') h = viewEnd();
    else h = { yol: viewHome, kitap: viewBooks, pratik: viewPractice, lig: viewLeague, profil: viewProfile, veli: viewParent }[A.tab]();
    if (A.modal) h += '<div class="modal-bg" data-act="close-modal"></div>' + A.modal;
    $app.innerHTML = h;
  }

  /* =================== AKIŞ =================== */
  const TIPS = ['Hata yapmak, beynin yeni bağlantılar kurmasıdır.', 'Her gün 10 dakika, haftada bir saatten daha etkilidir.', 'Zorlandığın soru, en çok öğrendiğin sorudur.', 'Bir konuyu birine anlatabiliyorsan, gerçekten öğrenmişsindir.', 'Unuttuğun konuyu tekrar etmek, onu daha kalıcı yapar.', 'Uykudan önce yaptığın kısa tekrar, ertesi güne taşınır.'];
  function startSession(mode, skillId, theme) {
    A.modal = null; A.ses = E.newSession(A.st, mode, skillId, theme);
    if (!['speed', 'placement'].includes(mode)) { $app.innerHTML = `<div class="mid">${mascot('', 110)}<div class="muted" style="font-weight:900;letter-spacing:.08em">HAZIRLANIYOR…</div><p style="font-weight:800;max-width:300px;text-align:center">💡 ${pick(TIPS)}</p></div>`; return setTimeout(() => startSession2(mode, skillId), 900); }
    startSession2(mode, skillId);
  }
  function startSession2(mode, skillId) {
    if (mode === 'placement') { A.ses.plan = E.placementPlan(); A.ses.len = A.ses.plan.length; }
    if (A.ses.format && mode !== 'lesson' && mode !== 'learn') A.ses.format = null;
    A.ses.showCard = !!A.ses.format;
    if (mode === 'speed') { A.ses.left = 60; clearInterval(A.timer); A.timer = setInterval(() => { A.ses.left -= 1; if (A.ses.left <= 0) { clearInterval(A.timer); finishSession(); } else if (A.view === 'lesson' && !A.fb) { const t = document.querySelector('.timer'); if (t) t.textContent = Math.ceil(A.ses.left) + ' sn'; const p = document.querySelector('.prog>i'); if (p) p.style.width = (100 * (1 - A.ses.left / 60)) + '%'; } }, 1000); }
    A.view = 'lesson'; sfx.swoosh(); sahneHazirla(); if (mode === 'exam') setTimeout(() => piSay('sinav'), 200); else if (!A.ses.showCard && !['speed', 'placement'].includes(mode)) setTimeout(() => piSay('ders_basla'), 200);
    if (!A.ses.showCard) nextQuestion(); else { render(); if (A.st.settings.voice) setTimeout(() => sayCard(skillId, A.ses.format), 300); }
  }
  // Ders ortası mola ekranı (kısa, motive edici)
  function interstitial() {
    const acc = A.ses.answered.length ? A.ses.correct / A.ses.answered.length : 0;
    const msg = acc >= .85 ? 'Bravo! Yarıyı geçtin, ateş gibisin!' : acc >= .6 ? 'Yarı yoldasın, harika gidiyorsun!' : 'Yarıyı geçtin! Her soru seni güçlendiriyor.';
    $app.innerHTML = `<div class="mid">${mascot('happy', 150)}<h1>${msg}</h1><div class="muted" style="font-weight:800">${A.ses.correct} doğru · ⚡ ${A.ses.xp} XP</div></div>`;
    sfx.fire(); piSay('yari'); setTimeout(() => nextQuestion(), 1700);
  }
  // Takılınca yönlendirme: 25 sn hiçbir şeye dokunmazsa Pi ipucuna yönlendirir.
  // Pi ya da soru okuması sürerken ASLA araya girmez (17.10.2026: iPhone'da soru okunurken yarıda kesiliyordu); dokunuş sayacı sıfırlar.
  const sesSuruyor = () => { try { return (window.speechSynthesis && speechSynthesis.speaking) || (AUDIO.cur && !AUDIO.cur.paused && !AUDIO.cur.ended); } catch (e) { return false; } };
  function idleKur(ms = 25000) {
    clearTimeout(A.idle); if (!A.q) return; const uid = A.q.uid;
    A.idle = setTimeout(() => {
      if (A.view !== 'lesson' || !A.q || A.q.uid !== uid || A.fb || A.ses.mode === 'speed') return;
      if (sesSuruyor()) return idleKur(6000);
      piSay('yonlendir'); const h = document.querySelector('[data-act="hint"]'); if (h) h.classList.add('nudge');
    }, ms);
  }
  function nextQuestion() {
    if (A.ses.mode !== 'speed' && A.ses.i >= A.ses.len && !A.ses.lastWrong) return finishSession();
    if (!A.ses.halfShown && ['lesson', 'review', 'mix', 'learn'].includes(A.ses.mode) && A.ses.i >= Math.ceil(A.ses.len / 2) && A.ses.i < A.ses.len && !A.ses.lastWrong) { A.ses.halfShown = true; return interstitial(); }
    A.q = E.nextQ(A.st, A.ses); A.sel = null; A.input = '';
    A.tb = A.q.type === 'tablo' ? A.q.satirlar.map(() => null) : null; A.kur = A.q.type === 'kur' ? [] : null;
    A.kes = A.q.type === 'kes' ? { parca: A.q.parca || 1, on: Array(A.q.parca || 1).fill(false), konum: null } : null;
    A.mt = A.q.type === 'match' ? { L: U.shuffle(A.q.pairs.map((_, i) => i)), R: U.shuffle(A.q.pairs.map((_, i) => i)), sL: null, sR: null, done: [], mist: 0, bad: null, just: null } : null; A.hinted = false; A.showHint = false; A.fb = null; A.deneme = 1; A.elenen = []; A.ikinci = null; A.t0 = Date.now(); render();
    const lb = document.getElementById('lbody'); if (lb) lb.scrollTop = 0;
    if (A.q.rescue) setTimeout(() => piSay('telafi_soru'), 250);
    idleKur();
  }
  // Doğru cevap kutlaması: seviye seriye göre yükselir
  /* ---------------- Bilim kurgu kutlama sahneleri (Higgsfield) ----------------
     Seride (3, 5, 8, sonra her 5) ve ders sonunda 2–3 sn'lik kısa sahne. Dokununca geçilir, bitince kendiliğinden kapanır.
     Sıradan doğru cevapta sahne YOK (ders temposu bozulmasın). Hareketi azalt açık cihazlarda hiç oynatılmaz. */
  const SAHNE = { telafi: { yazi: '💪 Hatandan öğrendin!' }, ates: { yazi: '🔥 3 Seri!' }, durdurulamaz: { yazi: 'DURDURULAMAZ!' }, efsane: { yazi: 'EFSANE!' }, bitti: { yazi: '' } };
  const sahneBlob = {};
  // MP4 (H.264) daha küçük ve telefonların hepsinde oynar; oynatamayan tarayıcıda WebM (VP9)
  const SAHNE_UZANTI = (() => { try { const v = document.createElement('video'); return v.canPlayType('video/mp4; codecs="avc1.4D401E"') ? '.mp4' : '.webm'; } catch (e) { return '.mp4'; } })();
  const sahneHazirla = () => ['sandik_kapali', 'sandik_acik'].forEach(k => { const im = new Image(); im.src = 'img/' + k + '.webp'; }) || Object.keys(SAHNE).forEach(k => { if (sahneBlob[k]) return; fetch('img/sahne_' + k + SAHNE_UZANTI).then(r => r.ok ? r.blob() : null).then(b => { if (b) sahneBlob[k] = URL.createObjectURL(b); }).catch(() => { }); });
  const sahneOyna = (ad, bitince) => {
    const azalt = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (azalt || !sahneBlob[ad]) { if (bitince) bitince(); return false; }
    const d = document.createElement('div'); d.className = 'sahne'; d.setAttribute('role', 'presentation');
    d.innerHTML = `<video muted playsinline autoplay preload="auto" src="${sahneBlob[ad]}"></video>${SAHNE[ad].yazi ? `<div class="sahne-yazi">${SAHNE[ad].yazi}</div>` : ''}<div class="sahne-gec">Geçmek için dokun</div>`;
    let kapandi = false; const kapat = () => { if (kapandi) return; kapandi = true; d.classList.add('kapan'); setTimeout(() => d.remove(), 220); if (bitince) bitince(); };
    d.addEventListener('pointerdown', kapat); document.body.appendChild(d);
    const v = d.querySelector('video'); v.addEventListener('ended', kapat); v.play().catch(kapat); setTimeout(kapat, 4200);
    return true;
  };
  const seriSahnesi = (st) => st === 3 ? 'ates' : st === 5 ? 'durdurulamaz' : (st === 8 || (st > 8 && st % 5 === 0)) ? 'efsane' : null;
  function celebrate(q, gain) {
    const st = A.ses.streak, b = document.querySelector('[data-act="check"]'), r = b ? b.getBoundingClientRect() : null;
    const word = q.rescue ? pick(PRAISE_RESCUE) : pick(PRAISE); A.fb.word = word;
    // Telafi doğrusu: hatasını düzelten çocuğa aksiyonlu "güçlendin" sahnesi (oynatılamazsa eski filiz efekti)
    if (q.rescue && A.ses.mode !== 'speed' && sahneOyna('telafi')) { sfx.grow(); if (navigator.vibrate) try { navigator.vibrate([30, 40, 60]); } catch (e) { } setTimeout(() => say(`pi_telafi_${PRAISE_RESCUE.indexOf(word) + 1}`, word, false), 300); return; }
    const tier = window.MY_FX ? window.MY_FX.correct({ streak: st, rescue: q.rescue, xp: gain, word, origin: r ? { x: r.left + r.width / 2, y: r.top } : null }) : 'normal';
    ({ normal: sfx.ok, calm: sfx.ok, fire: sfx.fire, unstop: sfx.unstop, legend: sfx.legend, rescue: sfx.grow }[tier] || sfx.ok)();
    if (navigator.vibrate) try { navigator.vibrate(tier === 'normal' || tier === 'calm' ? 25 : [30, 40, 60]); } catch (e) { }
    if (A.ses.mode === 'speed') return;
    const sh = seriSahnesi(st); if (sh && !q.rescue) setTimeout(() => sahneOyna(sh), 350);
    if (tier === 'fire') piSay('seri3'); else if (tier === 'unstop') piSay('seri5'); else if (tier === 'legend') piSay('seri8'); else if (tier === 'rescue') say(`pi_telafi_${PRAISE_RESCUE.indexOf(word) + 1}`, word, false);
    else if (Math.random() < 0.4) say(`pi_dogru_${PRAISE.indexOf(word) + 1}`, word, false);
  }
  function checkAnswer() {
    const q = A.q, ans = q.type === 'tablo' ? A.tb.slice() : q.type === 'kur' ? A.kur.slice() : q.type === 'input' ? A.input : q.type === 'kes' ? { parca: A.kes.parca, boyali: A.kes.on.filter(Boolean).length, konum: A.kes.konum } : A.sel; if (ans === null || ans === '') return;
    const res = E.check(q, ans), ms = Date.now() - A.t0;
    // Tahmin: doğru/yanlış denmez, not edilir; çocuk çözünce tahminiyle karşılaştırılır
    if (q.atolye && q.atolye.asama === 'tahmin') {
      res.secilen = q.options[ans].t; const gain = E.record(A.st, A.ses, q, res, ms, false);
      A.fb = { tahmin: true, secilen: res.secilen, gain }; save(); sfx.tap(); render(); return;
    }
    // İkinci şans: cevabı söylemeden hedefli ipucu, bir yeniden deneme
    if (!res.ok && (A.deneme || 1) === 1 && E.ikinciSansUygun(A.ses, q)) {
      E.yanilgiNotu(A.st, q, res.mis); A.deneme = 2;
      const once = q.type === 'input' ? A.input.replace('.', ',') : q.type === 'kur' ? `${kurMetin(q, A.kur)}${res.deger ? ' = ' + res.deger : ''}` : null;
      if (q.type === 'tablo') (res.yanlisSatir || []).forEach(i => { A.tb[i] = null; }); // yanlış satırlar boşalır, doğrular kalır
      else if (q.type === 'kur') A.kur = [];
      else if (q.type !== 'input' && q.type !== 'kes') { A.elenen.push(A.sel); A.sel = null; } else if (q.type === 'input') A.input = '';
      A.ikinci = { ipucu: ikinciIpucu(q, res), once }; save();
      sfx.bad(); if (navigator.vibrate) try { navigator.vibrate(60); } catch (e) { }
      piSay('tekrar_dene'); render(); const s = document.querySelector('.ikinci'); if (s) s.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); idleKur(); return;
    }
    const kanit = res.ok ? ((A.deneme === 2 || A.hinted) ? 'ipucu' : 'ilk') : 'cozum';
    const gain = E.record(A.st, A.ses, q, res, ms, A.hinted || A.deneme === 2, kanit);
    A.fb = { ok: res.ok, mis: res.mis, ac: res.ac, gain, kanit }; save();
    if (res.ok) celebrate(q, gain); else { sfx.bad(); if (navigator.vibrate) try { navigator.vibrate(120); } catch (e) { } if (A.ses.mode !== 'speed') piSay('yanlis'); }
    if (A.ses.mode === 'speed') { A.fb = null; render(); const lb = document.getElementById('lbody'); if (!res.ok) toast(`Doğrusu: ${q.type === 'input' ? esc(q.answer) : q.type === 'cmp' ? esc(q.options.find(o => o.ok).t) : q.options.find(o => o.ok).t}`); A.ses.lastWrong = false; return nextQuestion(); }
    render();
    if (!res.ok) { const s = document.querySelector('.lbody'); if (s) { s.classList.add('shake'); } }
  }
  function finishSession() {
    clearInterval(A.timer); stopVoice();
    if (A.ses.mode === 'placement') E.applyPlacement(A.st, A.ses);
    if (A.ses.mode === 'speed') A.st.speedBest = Math.max(A.st.speedBest, A.ses.correct);
    A.result = E.finish(A.st, A.ses); A.endSteps = endAdimlari(A.result, A.ses); A.endStep = 0; A.sandikAcik = false; save(); if (CL) CL.dersBitti(A.ses).then(() => { if (A.tab === 'lig' && A.view !== 'lesson') render(); }); A.view = 'end'; A.fb = null; render(); sfx.win(); confetti(); setTimeout(sayacBaslat, 60); if (!['placement', 'speed', 'hazir'].includes(A.ses.mode)) for (let i = 1; i <= yildizSayisi(A.result.acc); i++) setTimeout(() => tone(660 + 160 * i, .22, 'triangle'), 900 + i * 350 + 150); if (!['speed', 'placement'].includes(A.ses.mode)) sahneOyna('bitti'); setTimeout(() => piSay(A.ses && A.ses.mode === 'speed' ? 'rekor' : A.result.trophy && A.result.trophy.pass ? 'kupa' : A.result.quests && A.result.quests.got.length ? 'gorev' : 'bitti'), 500);
    if (A.result.newBadges.length) setTimeout(sfx.badge, 700);
  }

  /* =================== OLAYLAR =================== */
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]'); if (!el) return;
    if (A.view === 'lesson' && A.q && !A.fb && A.idle) idleKur();
    const act = el.dataset.act, v = el.dataset.v;
    switch (act) {
      case 'ust': if (UST[v]) { sfx.tap(); toast(UST[v]()); } break;
      case 'tab': if (v !== 'veli') { A.veliAcik = false; A.veliDuzenle = false; } A.tab = v; A.view = 'home'; sfx.tap(); render(); window.scrollTo(0, 0); break;
      case 'theme': A.theme = v; sfx.tap(); render(); setTimeout(() => { const k = document.querySelector('.komsu'); if (k && komsuSay[v] === undefined) k.click(); }, 500); break;
      case 'node': A.modal = skillModal(v); render(); break;
      case 'komsu': { const k = KOMSU[v]; if (!k) break; const n = komsuSay[v] = komsuSay[v] === undefined ? 0 : (komsuSay[v] + 1) % k.soz.length;
        const b = el.querySelector('.kbal'); if (b) { b.textContent = k.soz[n]; b.classList.remove('acik'); void b.offsetWidth; b.classList.add('acik'); }
        el.classList.remove('tik'); void el.offsetWidth; el.classList.add('tik'); tone(520 + 80 * n, .12, 'triangle'); tone(780 + 80 * n, .12, 'triangle', .09);
        clearTimeout(el._t); el._t = setTimeout(() => { el.classList.remove('tik'); b && b.classList.remove('acik'); }, 4200); break; }
      case 'trophy': { const sk = SKILLS.filter(x => x.theme === v); if (A.st.trophies[v] || sk.every(x => E.crowns(E.eff(A.st.skills[x.id])) >= 1)) startSession('exam', null, v); else toast('🎓 Temadaki tüm becerilerde en az 1 yıldız topla, sınav açılsın!'); break; }
      case 'exam': startSession('exam', null, v); break;
      case 'hazir': startSession('hazir', null, v); break;
      case 'task': A.modal = taskModal(v); render(); break;
      case 'task-done': A.st.tasks[v] = Date.now(); A.st.xp += 30; A.st.week.xp += 30; save(); A.modal = null; render(); sfx.unstop(); toast('🛠️ Harika iş! +30 XP'); break;
      case 'book': A.book = +v; render(); break;
      case 'mt': if (!A.fb) matchTap(v); break;
      case 'close-modal': A.modal = null; render(); break;
      case 'start': startSession('lesson', v); break;
      case 'learn': startSession('learn', v); break;
      case 'fmt': A.ses.formatTried.push(A.ses.format); A.ses.format = v; render(); sayCard(A.ses.skill, v); break;
      case 'other-fmt': { E.rewardFormat(A.st, A.ses.format, 0.25); A.ses.formatTried.push(A.ses.format); const nf = E.pickFormat(A.st, A.ses.formatTried); A.ses.format = nf || 'gorsel'; if (A.ses.formatTried.length >= 3) A.ses.formatTried = []; render(); sayCard(A.ses.skill, A.ses.format); break; }
      case 'card-ok': A.ses.showCard = false; stopVoice(); nextQuestion(); break;
      case 'say-card': sayCard(el.dataset.s, v); break;
      case 'fmt-modal': A.modal = explainModal(A.q.skill, v); render(); sayCard(A.q.skill, v); break;
      case 'say-q': soruOku(); break;
      case 'tb': if (A.fb || !A.tb) break; { const [i, d] = v.split(':'); A.tb[+i] = A.tb[+i] === d ? null : d; sfx.tap(); render(); } break;
      case 'kur-k': if (A.fb || !A.kur || A.kur.includes('n' + v)) break; A.kur.push('n' + v); tone(600 + 40 * A.kur.length % 400, .07, 'triangle'); render(); break;
      case 'kur-o': if (A.fb || !A.kur) break; A.kur.push(v); sfx.tap(); render(); break;
      case 'kur-sil': if (A.fb || !A.kur) break; A.kur.pop(); sfx.tap(); render(); break;
      case 'kes-dilim': if (A.fb || !A.kes) break; { const i = +v; A.kes.on[i] = !A.kes.on[i]; tone(A.kes.on[i] ? 620 + 30 * A.kes.on.filter(Boolean).length : 420, .09, 'triangle'); render(); } break;
      case 'kes-parca': if (A.fb || !A.kes) break; { const P = Math.max(1, Math.min(12, A.kes.parca + +v)); A.kes = { parca: P, on: Array(P).fill(false), konum: null }; sfx.tap(); render(); } break;
      case 'kes-nokta': if (A.fb || !A.kes) break; A.kes.konum = +v; tone(560 + 25 * +v, .08, 'triangle'); render(); break;
      case 'opt': if (A.fb || (A.elenen || []).includes(+v)) break; A.sel = +v; sfx.tap(); render(); break;
      case 'key': if (A.fb) break; sfx.tap(); if (v === '⌫') A.input = A.input.slice(0, -1); else if (A.input.length < 12) { if (v === ',' && (A.input.includes(',') || !A.input)) break; A.input += v; } render(); break;
      case 'hint': A.hinted = true; A.showHint = true; render(); piSay('ipucu'); break;
      case 'check': checkAnswer(); break;
      case 'next': nextQuestion(); break;
      case 'explain-other': { const f = E.pickFormat(A.st, [E.formatRank(A.st)[0].f]); A.modal = explainModal(A.q.skill, f); render(); sayCard(A.q.skill, f); break; }
      case 'quit': A.modal = confirmModal('Dersten çıkmak istiyor musun?', 'Cevapladığın sorular kaydedildi, ama ders tamamlanmış sayılmayacak ve ders XP\'si verilmeyecek.', 'quit-yes', 'Çık', 'Derse devam'); render(); break;
      case 'quit-yes': clearInterval(A.timer); stopVoice(); A.modal = null; A.view = 'home'; A.ses = null; A.fb = null; render(); break;
      case 'sandik-ac': if (A.sandikAcik) break; A.sandikAcik = true; sfx.badge(); if (navigator.vibrate) try { navigator.vibrate([30, 30, 80]); } catch (e) { } render(); confetti(); setTimeout(sayacBaslat, 50); break;
      case 'end-ok': if (A.endSteps && A.endStep < A.endSteps.length - 1) { A.endStep++; sfx.tap(); render(); setTimeout(() => { sayacBaslat(); if (A.endSteps[A.endStep] === 'gorev') sfx.ok(); }, 60); break; }
        document.querySelectorAll('#confetti').forEach(c => c.remove()); A.view = 'home'; A.ses = null; render(); window.scrollTo(0, 0); break;
      case 'p-mistakes': if (A.st.mistakes.length) startSession('mistakes', A.st.mistakes[0].skill); break;
      case 'p-review': startSession('review', (E.dueSkills(A.st)[0] || { id: SKILLS.find(s => A.st.skills[s.id].n > 0).id }).id); break;
      case 'p-speed': startSession('speed', null); break;
      case 'p-atolye': startSession('atolye', null); break;
      case 'p-hata': startSession('hata', E.hataBecerileri(A.st)[0]); break;
      case 'p-mix': startSession('mix', SKILLS.find(s => A.st.skills[s.id].n > 0).id); break;
      case 'p-place': startSession('placement', null); break;
      case 'set-sound': A.st.settings.sound = el.checked; save(); break;
      case 'set-voice': A.st.settings.voice = el.checked; save(); break;
      case 'goal': A.st.dailyGoal = +v; save(); render(); break;
      case 'buy-freeze': if (A.st.gems >= 50) { A.st.gems -= 50; A.st.freezes++; save(); render(); toast('🧊 Seri koruyucu alındı!'); } else toast('Yeterli elmasın yok. Ders yaparak kazanabilirsin!'); break;
      case 'reset': A.modal = confirmModal('Tüm veriler silinsin mi?', 'İlerleme, rozetler, öğrenme parmak izi ve veli bilgileri bu cihazdan kalıcı olarak silinir.', 'reset-yes', 'Evet, sil', 'Vazgeç'); render(); break;
      case 'reset-yes': A.modal = null; A.st = E.reset(); A.onb = { step: 0, data: {} }; A.tab = 'yol'; render(); break;
      case 'copy': try { navigator.clipboard.writeText(E.parentReport(A.st).text).then(() => toast('Rapor kopyalandı ✓'), () => toast('Kopyalanamadı')); } catch (e) { toast('Kopyalanamadı'); } break;
      case 'edit-profile': A.veliDuzenle = true; render(); break;
      case 'veli-vazgec': A.veliDuzenle = false; render(); break;
      case 'veli-kaydet': { const p = A.st.profile || (A.st.profile = {}), g = id => (document.getElementById(id).value || '').trim();
        const ad = g('f-cname'), pn = g('f-pname'), ph = g('f-pphone'), pm = g('f-pmail'), kv = document.getElementById('f-kvkk').checked;
        if (!ad) { toast('Çocuğun adı boş kalamaz.'); break; }
        if ((ph || pm) && !kv) { toast('Telefon ya da e-posta için onay kutusunu işaretlemelisiniz.'); break; }
        Object.assign(p, { name: ad, parentName: pn, parentPhone: ph, parentEmail: pm, kvkk: kv }); save(); A.veliDuzenle = false; toast('Kaydedildi ✓'); render(); break; }
      case 'veli-pin-kur': { const a = (document.getElementById('f-pin1').value || '').trim(), b = (document.getElementById('f-pin2').value || '').trim();
        if (!/^\d{4}$/.test(a)) { toast('Şifre 4 rakam olmalı.'); break; }
        if (a !== b) { toast('İki şifre aynı değil.'); break; }
        if (/^(\d)\1{3}$/.test(a) || '0123456789'.includes(a) || '9876543210'.includes(a)) { toast('Bu şifre çok kolay tahmin edilir (1111, 1234 gibi). Başka bir şifre seçin.'); break; }
        const tuz = Math.random().toString(36).slice(2, 10); A.st.veli = { tuz, pin: pinOzet(tuz, a) }; save(); A.veliAcik = true; render(); break; }
      case 'veli-pin-gir': { const V = A.st.veli || {}, simdi = Date.now();
        if (A.veliKilit && simdi < A.veliKilit) { toast(`Çok fazla deneme. ${Math.ceil((A.veliKilit - simdi) / 1000)} sn sonra tekrar deneyin.`); break; }
        const a = (document.getElementById('f-pin').value || '').trim();
        if (V.pin && pinOzet(V.tuz, a) === V.pin) { A.veliAcik = true; A.veliHata = 0; render(); break; }
        A.veliHata = (A.veliHata || 0) + 1; if (A.veliHata >= 5) { A.veliHata = 0; A.veliKilit = simdi + 60000; toast('5 yanlış deneme: 1 dakika bekleyin.'); } else toast('Şifre yanlış.');
        document.getElementById('f-pin').value = ''; break; }
      case 'veli-unuttum': A.modal = confirmModal('Şifre sıfırlansın mı?', 'Güvenlik için veli bilgileri (ad, telefon, e-posta) ve verdiğiniz onay da silinir; yeni şifre belirleyip yeniden girersiniz. Çocuğun ilerlemesi silinmez.', 'veli-unuttum-evet', 'Evet, sıfırla', 'Vazgeç'); render(); break;
      case 'veli-unuttum-evet': { A.modal = null; const p = A.st.profile || {}; delete p.parentName; delete p.parentPhone; delete p.parentEmail; p.kvkk = false; A.st.veli = null; save(); A.veliAcik = false; render(); break; }
      case 'veli-kilitle': A.veliAcik = false; A.veliDuzenle = false; A.tab = 'profil'; render(); window.scrollTo(0, 0); break;
      case 'onb-next': case 'onb-skip': {
        const o = A.onb, d = o.data;
        if (o.step === 1) { d.name = (document.getElementById('f-name').value || '').trim(); if (!d.name) { toast('Adını yazar mısın? 🙂'); break; } }
        // Veli bilgileri ve onay çocuğun kaydında sorulmaz; veli bunları şifreli Veli alanında girer
        o.step = o.step === 1 ? 3 : o.step + 1; render(); break; }
      case 'cloud-login': { const m = (document.getElementById('f-cloudmail').value || '').trim(); if (!/.+@.+\..+/.test(m)) { toast('Geçerli bir e-posta yazın.'); break; } CL.girisBaglantisi(m).then(() => toast('📩 Giriş bağlantısı gönderildi. E-postanızı açın.'), () => toast('Gönderilemedi, tekrar deneyin.')); break; }
      case 'cloud-logout': CL.cikis().then(() => render()); break;
      case 'pi-hello': piSay('hosgeldin'); break;
      case 'say-mis': say(misSes(v), MIS[v].t + '. ' + MIS[v].fix); break;
      case 'motiv': A.onb.data.motivation = v; render(); break;
      case 'onb-finish': case 'onb-finish-skip': { const d = A.onb.data; A.st.profile = { name: d.name, parentName: d.parentName, parentPhone: d.parentPhone, parentEmail: d.parentEmail, kvkk: !!d.kvkk, motivation: d.motivation, created: Date.now() }; save(); if (act === 'onb-finish') startSession('placement', null); else render(); break; }
    }
  });
  document.addEventListener('keydown', (e) => {
    if (A.view !== 'lesson' || !A.q || A.ses.showCard) return;
    if (A.fb && (e.key === 'Enter')) { document.querySelector('[data-act="next"]').click(); return; }
    if (A.q.type === 'input' && !A.fb) { if (/^[0-9]$/.test(e.key)) { A.input += e.key; render(); } else if (e.key === ',' || e.key === '.') { if (!A.input.includes(',') && A.input) { A.input += ','; render(); } } else if (e.key === 'Backspace') { A.input = A.input.slice(0, -1); render(); } else if (e.key === 'Enter') checkAnswer(); }
    else if (!A.fb) { const n = +e.key; if (n >= 1 && n <= (A.q.options || []).length) { A.sel = n - 1; render(); } else if (e.key === 'Enter') checkAnswer(); }
  });
  if ('speechSynthesis' in window) try { speechSynthesis.onvoiceschanged = () => { }; speechSynthesis.getVoices(); } catch (e) { }
  try { const lr = E.rollWeek(A.st); if (lr) { save(); setTimeout(() => toast(`🏆 Haftalık lig bitti: ${lr.rank}. oldun!`), 800); } } catch (e) { }
  if (A.st.profile) document.addEventListener('pointerdown', function once() { document.removeEventListener('pointerdown', once); if (A.view !== 'lesson' && (A.st.sessions || []).length) setTimeout(() => piSay('hosgeldin_geri'), 120); }, { once: true });
  if (CL && CL.ayarli) CL.baslat(() => render()).then(async () => {
    try { if (CL.oturum && A.st.profile) { await CL.ogrenciHazirla(A.st.profile); const uzak = await CL.cek(A.st); if (uzak) { A.st = Object.assign(E.fresh(), uzak); E.save(A.st); toast('☁️ İlerlemen buluttan yüklendi'); } else CL.kaydet(A.st); await CL.ligYenile(); } } catch (e) { }
    render();
  });
  window.MY_APP = A; window.MY_MASCOT = mascot; window.MY_APP_RENDER = render; window.MY_DERS_SAHNE = DERS_SAHNE;
  render();
})();
