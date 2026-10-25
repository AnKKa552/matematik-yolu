// Çevrimdışı çalışma. Sayfanın kendisi, config.js ve ses listesi ÖNCE AĞDAN gelir (güncellemeler hemen ulaşır),
// ağ yoksa önbellekten açılır. Sayfa tarayıcının HTTP önbelleğini atlar (no-cache): GitHub Pages 10 dk önbelleğe aldığı için
// yayından hemen sonra ilk açılışta eski sürüm gelebiliyordu. Sesler ve diğer dosyalar önbellekten hızlı gelir.
const C = 'matematik-yolu-v48';
const GORSEL = 'pi-gorsel-v1';  // kostüm ve sandık resimleri: sürüm değişince silinmez (alınan kostüm çevrimdışı da görünsün)
self.addEventListener('install', e => e.waitUntil(caches.open(C).then(c => c.addAll(['./', './index.html', './manifest.webmanifest', './img/simge2_192.png'])).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C && k !== GORSEL).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  // Depodaki resimler (kostüm, sandık): önce telefondaki kopya, yoksa ağdan alıp sakla
  if (u.pathname.includes('/storage/v1/object/public/gorsel/') && !e.request.headers.has('range')) {
    e.respondWith(caches.open(GORSEL).then(c => c.match(e.request).then(r => r || fetch(e.request).then(res => { if (res.ok || res.type === 'opaque') c.put(e.request, res.clone()).catch(() => {}); return res; }))));
    return;
  }
  // Ses/medya ve parça (range) isteklerine karışma: Pi'nin sesleri uygulama içinde ayrıca saklanıyor
  if (e.request.headers.has('range') || e.request.destination === 'audio' || u.pathname.includes('/storage/')) return;
  const sayfa = e.request.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('index.html');
  const agOnce = sayfa || u.pathname.endsWith('config.js') || u.pathname.endsWith('manifest.json') || (u.hostname.endsWith('supabase.co') && !u.pathname.includes('/storage/'));
  if (agOnce) {
    e.respondWith((sayfa || u.pathname.endsWith('config.js') ? fetch(u.href, { cache: 'no-cache' }) : fetch(e.request)).then(res => { if (res.ok && sayfa) { const cp = res.clone(); caches.open(C).then(c => c.put('./index.html', cp)).catch(() => {}); } return res; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { if (res.ok && (u.origin === location.origin || u.hostname === 'cdn.jsdelivr.net')) { const cp = res.clone(); caches.open(C).then(c => c.put(e.request, cp)).catch(() => {}); } return res; }).catch(() => caches.match('./index.html'))));
});
// Hatırlatma bildirimi (Web Push, 20.10.2026): sunucu başlık ve metni gönderir; dokununca uygulama açılır
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { metin: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.baslik || 'Matematik Yolu', { body: d.metin || 'Pi seni bekliyor! 🚀', icon: './img/simge2_192.png', badge: './img/simge2_192.png', tag: 'matematik-yolu-hatirlatma', renotify: false, data: { url: './' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(L => { for (const c of L) if ('focus' in c) return c.focus(); return self.clients.openWindow('./'); }));
});
