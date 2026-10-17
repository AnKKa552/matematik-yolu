/* ============================================================
   Matematik Yolu — Bulut katmanı (Supabase)
   config.js yoksa ya da boşsa uygulama tamamen çevrimdışı çalışır.
   Varsa: veli e-posta bağlantısıyla giriş, bulut kaydı, gerçek lig,
   cevap günlüğü ve sunucudaki Pi seslerini kullanır.
   ============================================================ */
(function (G) {
  'use strict';
  const C = { hazir: false, oturum: null, ogrenci: null, durum: 'kapali', lig: null, hata: null };
  const cfg = G.MY_CONFIG || {};
  const LS = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } };
  C.ayarli = !!(cfg.supabaseUrl && cfg.anonKey);
  // Ses sürümü klasörü: 'damla/' (ElevenLabs Damla sesi, eleven_v4, 128 kbps). Eski Gamze sesleri kökte duruyor.
  C.sesAdresi = C.ayarli ? `${cfg.supabaseUrl}/storage/v1/object/public/sesler/damla/` : 'audio/';
  // Pi'nin görselleri (Higgsfield ile üretildi, 'gorseller' deposu)
  // Pi'nin soru okuması: önce depodaki hazır ses (soru/<özet>.mp3), yoksa soru-sesi fonksiyonu üretir
  C.soruDepo = C.ayarli ? `${cfg.supabaseUrl}/storage/v1/object/public/sesler/soru/` : null;
  C.soruSesiAdresi = C.ayarli ? `${cfg.supabaseUrl}/functions/v1/soru-sesi` : null;
  C.gorselAdresi = C.ayarli ? `${cfg.supabaseUrl}/storage/v1/object/public/gorseller/` : null;
  let sb = null, kayitZaman = null;
  const yukle = () => new Promise((ok, no) => { if (G.supabase) return ok(); const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  const takma = () => { const a = ['Hızlı', 'Parlak', 'Cesur', 'Neşeli', 'Akıllı', 'Yıldız', 'Şimşek', 'Gizemli']; const h = ['Kartal', 'Tilki', 'Yunus', 'Baykuş', 'Kaplan', 'Panda', 'Ejder', 'Sincap']; return `${a[Math.floor(Math.random() * a.length)]} ${h[Math.floor(Math.random() * h.length)]} ${10 + Math.floor(Math.random() * 90)}`; };

  C.baslat = async (onDegis) => {
    if (!C.ayarli) return C;
    try {
      await yukle(); sb = G.supabase.createClient(cfg.supabaseUrl, cfg.anonKey, { auth: { persistSession: true, detectSessionInUrl: true } });
      const { data } = await sb.auth.getSession(); C.oturum = data.session; C.ogrenci = LS('my_ogrenci_id');
      sb.auth.onAuthStateChange((_e, s) => { C.oturum = s; C.durum = s ? 'girisli' : 'cikis'; onDegis && onDegis(); });
      C.durum = C.oturum ? 'girisli' : 'cikis'; C.hazir = true;
    } catch (e) { C.hata = 'Sunucuya bağlanılamadı'; C.durum = 'hata'; }
    return C;
  };
  C.girisBaglantisi = async (eposta) => {
    const { error } = await sb.auth.signInWithOtp({ email: eposta, options: { emailRedirectTo: location.origin + location.pathname } });
    if (error) throw error; return true;
  };
  C.cikis = async () => { await sb.auth.signOut(); LS('my_ogrenci_id', null); C.ogrenci = null; };
  // Veli + öğrenci kaydını hazırla (ilk girişte)
  C.ogrenciHazirla = async (profil) => {
    const uid = C.oturum.user.id;
    await sb.from('veliler').upsert({ id: uid, ad: profil.parentName || null, telefon: (profil.parentPhone || '').replace(/\D/g, '').replace(/^0/, '90') || null, eposta: C.oturum.user.email, rapor_kanali: profil.parentPhone ? 'ikisi' : 'eposta' });
    if (profil.kvkk) await sb.from('rizalar').insert({ veli_id: uid, metin_surum: 'aydinlatma-v1', onay: true });
    if (C.ogrenci) return C.ogrenci;
    const { data: var_ } = await sb.from('ogrenciler').select('id, ad').eq('veli_id', uid);
    let o = (var_ || []).find(x => x.ad === profil.name);
    if (!o) { const { data, error } = await sb.from('ogrenciler').insert({ veli_id: uid, ad: profil.name, takma_ad: takma(), dogum_tarihi: profil.birth || null }).select('id').single(); if (error) throw error; o = data; }
    C.ogrenci = o.id; LS('my_ogrenci_id', o.id); return o.id;
  };
  // Buluttan çek: bulut daha yeniyse yereli değiştir
  C.cek = async (yerel) => {
    if (!C.ogrenci) return null;
    const { data } = await sb.from('ogrenci_durum').select('durum, surum').eq('ogrenci_id', C.ogrenci).maybeSingle();
    if (data && data.surum > (yerel.savedAt || 0)) return data.durum;
    return null;
  };
  // Kaydet (3 sn gecikmeli, art arda kayıtları birleştirir)
  C.kaydet = (st) => {
    if (!C.hazir || !C.oturum || !C.ogrenci) return;
    clearTimeout(kayitZaman);
    kayitZaman = setTimeout(async () => { try { await sb.from('ogrenci_durum').upsert({ ogrenci_id: C.ogrenci, durum: st, surum: st.savedAt || Date.now(), guncelleme: new Date().toISOString() }); C.sonKayit = Date.now(); } catch (e) { } }, 3000);
  };
  C.dersBitti = async (ses) => {
    if (!C.hazir || !C.oturum || !C.ogrenci) return;
    try {
      if (ses.xp > 0) await sb.rpc('xp_ekle', { p_ogrenci: C.ogrenci, p_xp: Math.min(500, ses.xp) });
      const rows = (ses.answered || []).map(a => ({ ogrenci_id: C.ogrenci, beceri: a.skill, seviye: a.level || 1, tip: a.type || 'mc', dogru: a.ok, kismi: !!a.partial, yanilgi: a.mis || null, sure_ms: a.ms, ipucu: !!a.hint, telafi: !!a.rescue }));
      if (rows.length) await sb.from('cevaplar').insert(rows);
      await C.ligYenile();
    } catch (e) { }
  };
  C.ligYenile = async () => {
    if (!C.hazir || !C.oturum || !C.ogrenci) return null;
    const { data } = await sb.rpc('lig_getir', { p_ogrenci: C.ogrenci });
    C.lig = data && data.length ? data : null; return C.lig;
  };
  G.MY_CLOUD = C;
})(window);
