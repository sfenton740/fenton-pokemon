// Offline support: app shell cached, data.json network-first, card pictures cache-first.
const VERSION = 'v27-star-ace-2026-10-29';
const SHELL = 'shell-' + VERSION, DATA = 'data-' + VERSION, IMGS = 'imgs-v1', GAMES = 'games-v5';
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'games.js', 'tcg.js', 'trivia.js', 'trainer.js', 'math.js', 'games.css', 'math.css', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.png'];
// Game Time pictures (games/art = card art crops, games/sil = shadows, games/tcg = whole cards for Card Battle School)
const GAME_FILES = ["games/art/me4-7.jpg", "games/art/me5-59.jpg", "games/art/me55-10.jpg", "games/art/me55-100.jpg", "games/art/me55-102.jpg", "games/art/me55-103.jpg", "games/art/me55-104.jpg", "games/art/me55-105.jpg", "games/art/me55-106.jpg", "games/art/me55-107.jpg", "games/art/me55-108.jpg", "games/art/me55-109.jpg", "games/art/me55-11.jpg", "games/art/me55-110.jpg", "games/art/me55-112.jpg", "games/art/me55-113.jpg", "games/art/me55-114.jpg", "games/art/me55-116.jpg", "games/art/me55-119.jpg", "games/art/me55-12.jpg", "games/art/me55-120.jpg", "games/art/me55-121.jpg", "games/art/me55-125.jpg", "games/art/me55-129.jpg", "games/art/me55-13.jpg", "games/art/me55-14.jpg", "games/art/me55-15.jpg", "games/art/me55-16.jpg", "games/art/me55-17.jpg", "games/art/me55-18.jpg", "games/art/me55-19.jpg", "games/art/me55-20.jpg", "games/art/me55-21.jpg", "games/art/me55-23.jpg", "games/art/me55-3.jpg", "games/art/me55-5.jpg", "games/art/me55-53.jpg", "games/art/me55-55.jpg", "games/art/me55-56.jpg", "games/art/me55-57.jpg", "games/art/me55-58.jpg", "games/art/me55-59.jpg", "games/art/me55-61.jpg", "games/art/me55-63.jpg", "games/art/me55-65.jpg", "games/art/me55-67.jpg", "games/art/me55-68.jpg", "games/art/me55-69.jpg", "games/art/me55-71.jpg", "games/art/me55-73.jpg", "games/art/me55-74.jpg", "games/art/me55-75.jpg", "games/art/me55-76.jpg", "games/art/me55-77.jpg", "games/art/me55-78.jpg", "games/art/me55-8.jpg", "games/art/me55-80.jpg", "games/art/me55-81.jpg", "games/art/me55-82.jpg", "games/art/me55-83.jpg", "games/art/me55-84.jpg", "games/art/me55-85.jpg", "games/art/me55-86.jpg", "games/art/me55-87.jpg", "games/art/me55-9.jpg", "games/art/me55-90.jpg", "games/art/me55-91.jpg", "games/art/me55-93.jpg", "games/art/me55-94.jpg", "games/art/me55-95.jpg", "games/art/me55-96.jpg", "games/art/me55-97.jpg", "games/art/me55-98.jpg", "games/art/me55-99.jpg", "games/art/base1-46.jpg", "games/art/base1-24.jpg", "games/art/swsh12-14.jpg", "games/art/tcg-714372.jpg", "games/art/tcg-716156.jpg", "games/art/tcg-716158.jpg", "games/art/tcg-716160.jpg", "games/art/tcg-716161.jpg", "games/art/tcg-716191.jpg", "games/art/tcg-716206.jpg", "games/art/tcg-716208.jpg", "games/sil/me4-7.png", "games/sil/me5-59.png", "games/sil/me55-10.png", "games/sil/me55-100.png", "games/sil/me55-102.png", "games/sil/me55-103.png", "games/sil/me55-104.png", "games/sil/me55-105.png", "games/sil/me55-106.png", "games/sil/me55-107.png", "games/sil/me55-108.png", "games/sil/me55-109.png", "games/sil/me55-11.png", "games/sil/me55-110.png", "games/sil/me55-112.png", "games/sil/me55-113.png", "games/sil/me55-114.png", "games/sil/me55-116.png", "games/sil/me55-119.png", "games/sil/me55-12.png", "games/sil/me55-120.png", "games/sil/me55-121.png", "games/sil/me55-125.png", "games/sil/me55-129.png", "games/sil/me55-13.png", "games/sil/me55-14.png", "games/sil/me55-15.png", "games/sil/me55-16.png", "games/sil/me55-17.png", "games/sil/me55-18.png", "games/sil/me55-19.png", "games/sil/me55-20.png", "games/sil/me55-21.png", "games/sil/me55-23.png", "games/sil/me55-3.png", "games/sil/me55-5.png", "games/sil/me55-55.png", "games/sil/me55-56.png", "games/sil/me55-57.png", "games/sil/me55-58.png", "games/sil/me55-59.png", "games/sil/me55-61.png", "games/sil/me55-63.png", "games/sil/me55-65.png", "games/sil/me55-67.png", "games/sil/me55-68.png", "games/sil/me55-69.png", "games/sil/me55-71.png", "games/sil/me55-73.png", "games/sil/me55-74.png", "games/sil/me55-75.png", "games/sil/me55-76.png", "games/sil/me55-77.png", "games/sil/me55-78.png", "games/sil/me55-8.png", "games/sil/me55-80.png", "games/sil/me55-82.png", "games/sil/me55-83.png", "games/sil/me55-84.png", "games/sil/me55-85.png", "games/sil/me55-86.png", "games/sil/me55-87.png", "games/sil/me55-9.png", "games/sil/me55-90.png", "games/sil/me55-91.png", "games/sil/me55-94.png", "games/sil/me55-95.png", "games/sil/me55-96.png", "games/sil/me55-97.png", "games/sil/me55-99.png", "games/sil/swsh12-14.png", "games/sil/tcg-714372.png", "games/sil/tcg-716156.png", "games/sil/tcg-716158.png", "games/sil/tcg-716160.png", "games/sil/tcg-716161.png", "games/sil/tcg-716191.png", "games/sil/tcg-716206.png", "games/sil/tcg-716208.png", "games/tcg/me55-10.jpg", "games/tcg/me55-113.jpg", "games/tcg/me55-120.jpg", "games/tcg/me55-13.jpg", "games/tcg/me55-14.jpg", "games/tcg/me55-23.jpg", "games/tcg/me55-57.jpg", "games/tcg/me55-58.jpg", "games/tcg/me55-59.jpg", "games/tcg/me55-61.jpg", "games/tcg/me55-65.jpg", "games/tcg/me55-67.jpg", "games/tcg/me55-68.jpg", "games/tcg/me55-73.jpg", "games/tcg/me55-74.jpg", "games/tcg/me55-87.jpg", "games/tcg/me55-9.jpg", "games/tcg/me55-93.jpg", "games/tcg/me55-95.jpg", "games/tcg/me55-96.jpg", "games/tcg/me55-97.jpg", "games/tcg/me55-98.jpg", "games/tcg/me55-15.jpg", "games/tcg/me55-16.jpg", "games/tcg/me55-17.jpg", "games/tcg/me55-19.jpg", "games/tcg/me55-21.jpg", "games/tcg/me55-53.jpg", "games/tcg/me55-64.jpg", "games/tcg/me55-71.jpg", "games/tcg/me55-90.jpg", "games/tcg/me55-99.jpg", "games/tcg/me55-102.jpg", "games/tcg/tcg-714372.jpg", "games/tcg/base1-46.jpg", "games/tcg/base1-24.jpg"];
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
