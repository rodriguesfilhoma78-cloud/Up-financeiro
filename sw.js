/* Service worker — permite instalar o app e usá-lo offline.
   Estratégia: cache-first para os arquivos do app. */
const CACHE = 'lista-compras-v3';
const ARQUIVOS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((resp) => {
      if (resp) return resp;
      return fetch(e.request)
        .then((res) => {
          // Guarda novas respostas válidas para uso offline futuro
          if (res && res.status === 200 && res.type === 'basic') {
            const copia = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copia));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
