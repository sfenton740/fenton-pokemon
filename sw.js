// Offline support: app shell cached, data.json network-first, card pictures cache-first.
const VERSION = 'v12-clean-shadows-2026-10-22';
const SHELL = 'shell-' + VERSION, DATA = 'data-' + VERSION, IMGS = 'imgs-v1', GAMES = 'games-v2';
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'games.js', 'games.css', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.png'];
// Game Time pictures (games/art = card art crops, games/sil = shadows)
const GAME_FILES = ["games/art/me55-10.jpg", "games/art/me55-102.jpg", "games/art/me55-11.jpg", "games/art/me55-113.jpg", "games/art/me55-116.jpg", "games/art/me55-119.jpg", "games/art/me55-12.jpg", "games/art/me55-120.jpg", "games/art/me55-121.jpg", "games/art/me55-14.jpg", "games/art/me55-15.jpg", "games/art/me55-16.jpg", "games/art/me55-17.jpg", "games/art/me55-18.jpg", "games/art/me55-19.jpg", "games/art/me55-21.jpg", "games/art/me55-23.jpg", "games/art/me55-55.jpg", "games/art/me55-63.jpg", "games/art/me55-65.jpg", "games/art/me55-67.jpg", "games/art/me55-68.jpg", "games/art/me55-69.jpg", "games/art/me55-71.jpg", "games/art/me55-75.jpg", "games/art/me55-81.jpg", "games/art/me55-83.jpg", "games/art/me55-9.jpg", "games/art/me55-90.jpg", "games/art/me55-91.jpg", "games/art/me55-93.jpg", "games/art/me55-95.jpg", "games/art/tcg-714372.jpg", "games/sil/me55-10.png", "games/sil/me55-102.png", "games/sil/me55-11.png", "games/sil/me55-113.png", "games/sil/me55-116.png", "games/sil/me55-119.png", "games/sil/me55-12.png", "games/sil/me55-120.png", "games/sil/me55-121.png", "games/sil/me55-15.png", "games/sil/me55-16.png", "games/sil/me55-17.png", "games/sil/me55-18.png", "games/sil/me55-19.png", "games/sil/me55-21.png", "games/sil/me55-23.png", "games/sil/me55-55.png", "games/sil/me55-63.png", "games/sil/me55-65.png", "games/sil/me55-67.png", "games/sil/me55-68.png", "games/sil/me55-69.png", "games/sil/me55-71.png", "games/sil/me55-83.png", "games/sil/me55-9.png", "games/sil/me55-90.png", "games/sil/me55-91.png", "games/sil/me55-95.png", "games/sil/tcg-714372.png"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES))
    .then(() => caches.open(GAMES).then(c => c.addAll(GAME_FILES)).catch(() => {}))   // game pictures, so Game Time works offline
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(k => ![SHELL, DATA, IMGS, GAMES].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
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
  if (url.pathname.includes('/games/')) {                          // game pictures: cache first (they never change name)
    e.respondWith(caches.open(GAMES).then(c => c.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }))));
    return;
  }
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
