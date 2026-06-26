/* Service worker — permite instalar o app e usá-lo offline.
   Estratégia: REDE PRIMEIRO. Com internet, sempre busca a versão mais
   recente e atualiza o cache; sem internet, usa a cópia salva. */
const CACHE = 'lista-compras-v5';
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
    fetch(e.request)
      .then((res) => {
        // Atualiza o cache com a versão mais nova baixada da rede
        if (res && res.status === 200 && res.type === 'basic') {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copia));
        }
        return res;
      })
      // Sem internet: usa o que está salvo; em última instância, a página inicial
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
