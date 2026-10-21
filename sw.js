// Offline support: app shell cached, data.json network-first, card pictures cache-first.
const VERSION = 'v6-unsortedgroup-2026-10-21';
const SHELL = 'shell-' + VERSION, DATA = 'data-' + VERSION, IMGS = 'imgs-v1';
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(k => ![SHELL, DATA, IMGS].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'tcgplayer-cdn.tcgplayer.com') {           // pictures: cache first
    e.respondWith(caches.open(IMGS).then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      try { const res = await fetch(req); if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }
      catch (err) { return Response.error(); }
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith('data.json')) {                         // data: network first, offline fallback
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(DATA).then(c => c.put('data.json', copy)); return res; })
      .catch(() => caches.open(DATA).then(c => c.match('data.json'))));
    return;
  }
  e.respondWith(fetch(req).then(res => {                            // shell: network first so updates show up
    if (res.ok) { const copy = res.clone(); caches.open(SHELL).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match('index.html'))));
});
