// ===== Service worker: makes the site work offline after one visit =====
// Files are fetched from the network first, so updates show up straight away,
// and fall back to the cache when offline. Bump VERSION to clear old caches.
const VERSION = 'v3';
const CACHE = `portfolio-${VERSION}`;
const CONCEPTS = {
  departures: ['big-shoulders-display', 'ibm-plex-mono-400', 'ibm-plex-mono-500', 'ibm-plex-mono-600'],
  catalogue: ['syne', 'instrument-sans', 'courier-prime-400', 'courier-prime-700'],
  mixtape: ['bricolage-grotesque', 'dm-mono-400', 'dm-mono-500']
};
const SHELL = [
  './', 'index.html', 'manifest.webmanifest',
  'shared/content.js', 'shared/site.js', 'shared/print.css',
  'departures/boot.js', 'departures/extras.js',
  ...Object.entries(CONCEPTS).flatMap(([c, fonts]) => [
    `${c}/`, `${c}/index.html`, `${c}/styles.css`, `${c}/script.js`, `${c}/manifest.webmanifest`,
    `assets/${c}/favicon.svg`, `assets/${c}/favicon-32.png`,
    `assets/fonts/${c}.css`, ...fonts.map((f) => `assets/fonts/${f}-latin.woff2`)
  ])
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin === self.location.origin) event.respondWith(networkFirst(request));
});
