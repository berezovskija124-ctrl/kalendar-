// Хранит приложение на телефоне, чтобы оно открывалось без интернета.
const CACHE = 'moi-smeny-v1';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const save = res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy));
    return res;
  };
  // Шрифты берём из памяти, если они уже скачаны.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(save)));
    return;
  }
  if (url.origin !== location.origin) return;
  // Сначала пробуем сеть, чтобы обновления приходили сразу. Без сети открываем сохранённое.
  e.respondWith(
    fetch(e.request).then(save).catch(() =>
      caches.match(e.request).then(hit => hit || caches.match('index.html'))
    )
  );
});
