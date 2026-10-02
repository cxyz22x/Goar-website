const SHELL_CACHE = 'goar-shell-v1';
const SCOPE_URL = new URL(self.registration.scope);
const SHELL_URL = new URL('index.html', SCOPE_URL).href;
const CORE_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './brand.png',
  './favicon.png',
  './icons/goar-192.png',
  './icons/goar-512.png',
  './icons/goar-512-maskable.png',
  './shared/float.css',
  './shared/float.js',
];

function isLocalAppAsset(url) {
  if (url.origin !== SCOPE_URL.origin || !url.pathname.startsWith(SCOPE_URL.pathname)) return false;
  const path = url.pathname.slice(SCOPE_URL.pathname.length);
  return /^(?:assets\/|icons\/|brand\.png$|favicon\.(?:png|svg)$|manifest\.webmanifest$|shared\/float\.(?:css|js)$)/.test(path);
}

function isSeparateSitePath(url) {
  if (!url.pathname.startsWith(SCOPE_URL.pathname)) return false;
  const path = url.pathname.slice(SCOPE_URL.pathname.length);
  return ['pages/', 'media/', 'workspace/'].some((prefix) => path.startsWith(prefix));
}

function getBundledAssets(html) {
  const assets = new Set();
  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    try {
      const url = new URL(match[1], SCOPE_URL);
      if (
        url.origin === SCOPE_URL.origin
        && url.pathname.startsWith(SCOPE_URL.pathname)
        && /\.(?:m?js|css|woff2?|wasm)$/i.test(url.pathname)
      ) {
        assets.add(url.href);
      }
    } catch {
      // Ignore invalid or external HTML references.
    }
  }
  return [...assets];
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(CORE_FILES.map((path) => new URL(path, SCOPE_URL).href));

    const htmlResponse = await cache.match(SHELL_URL);
    if (!htmlResponse) throw new Error('The Goar app shell was not cached.');
    const assets = getBundledAssets(await htmlResponse.text());
    if (assets.length) await cache.addAll(assets);

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith('goar-shell-') && name !== SHELL_CACHE)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('range')) return;

  const url = new URL(request.url);
  if (url.origin !== SCOPE_URL.origin || isSeparateSitePath(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch {
        return (await caches.match(SHELL_URL))
          || new Response('Goar is offline. Reconnect and try again.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
      }
    })());
    return;
  }

  if (!isLocalAppAsset(url)) return;
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok && response.type !== 'opaque') {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  })());
});