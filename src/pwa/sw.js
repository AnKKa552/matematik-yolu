// Çevrimdışı çalışma. Sayfanın kendisi, config.js ve ses listesi ÖNCE AĞDAN gelir (güncellemeler hemen ulaşır),
// ağ yoksa önbellekten açılır. Sesler ve diğer dosyalar önbellekten hızlı gelir.
const C = 'matematik-yolu-v18';
self.addEventListener('install', e => e.waitUntil(caches.open(C).then(c => c.addAll(['./', './index.html', './manifest.webmanifest', './img/simge2_192.png'])).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  // Ses/medya ve parça (range) isteklerine karışma: Pi'nin sesleri uygulama içinde ayrıca saklanıyor
  if (e.request.headers.has('range') || e.request.destination === 'audio' || u.pathname.includes('/storage/')) return;
  const sayfa = e.request.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('index.html');
  const agOnce = sayfa || u.pathname.endsWith('config.js') || u.pathname.endsWith('manifest.json') || (u.hostname.endsWith('supabase.co') && !u.pathname.includes('/storage/'));
  if (agOnce) {
    e.respondWith(fetch(e.request).then(res => { if (res.ok && sayfa) { const cp = res.clone(); caches.open(C).then(c => c.put('./index.html', cp)).catch(() => {}); } return res; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { if (res.ok && (u.origin === location.origin || u.hostname === 'cdn.jsdelivr.net')) { const cp = res.clone(); caches.open(C).then(c => c.put(e.request, cp)).catch(() => {}); } return res; }).catch(() => caches.match('./index.html'))));
});
