// Çevrimdışı çalışma: uygulama kabuğunu önbelleğe al. config.js ve ses listesi her zaman önce ağdan.
const C = 'matematik-yolu-v3';
self.addEventListener('install', e => e.waitUntil(caches.open(C).then(c => c.addAll(['./', './index.html', './manifest.webmanifest', './icon.svg'])).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  const agOnce = u.pathname.endsWith('config.js') || u.pathname.endsWith('manifest.json') || u.hostname.endsWith('supabase.co') && !u.pathname.includes('/storage/');
  if (agOnce) { e.respondWith(fetch(e.request).catch(() => caches.match(e.request))); return; }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { if (res.ok && (u.origin === location.origin || u.pathname.endsWith('.mp3') || u.hostname === 'cdn.jsdelivr.net')) { const cp = res.clone(); caches.open(C).then(c => c.put(e.request, cp)).catch(() => {}); } return res; }).catch(() => caches.match('./index.html'))));
});
