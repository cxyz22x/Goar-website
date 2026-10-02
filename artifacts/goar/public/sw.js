const SHELL_CACHE = 'goar-shell-v1';
const SCOPE_URL = new URL(self.registration.scope);
const SHELL_URL = new URL('index.html', SCOPE_URL).href;
const CORE_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './brand.png',
  './favicon.png',
  './favicon.svg',
  './icons/goar-192.png',
  './icons/goar-512.png',
  './icons/goar-512-maskable.png',
  './shared/float.css',
  './shared/float.js',
  './games.json',
  './media/index.html',
  './workspace/index.html',
  './pages/anime/index.html',
  './pages/games/index.html',
  './pages/home/index.html',
  './pages/live/index.html',
  './pages/music/index.html',
  './pages/watch/index.html',
];

function isLocalAppAsset(url) {
  if (url.origin !== SCOPE_URL.origin || !url.pathname.startsWith(SCOPE_URL.pathname)) return false;
  const path = url.pathname.slice(SCOPE_URL.pathname.length);
  return /^(?:assets\/|icons\/|brand\.png$|favicon\.(?:png|svg)$|manifest\.webmanifest$|shared\/float\.(?:css|js)$)/.test(path);
}

function isCacheableSiteFile(url) {
  if (url.origin !== SCOPE_URL.origin || !url.pathname.startsWith(SCOPE_URL.pathname)) return false;
  const path = url.pathname.slice(SCOPE_URL.pathname.length);
  if (/(?:^|\/)(?:api|auth|backend|proxy|relay|stream|tunnel|ws)(?:\/|$)/.test(path)) return false;
  if (/^(?:assets\/|icons\/|shared\/float\.(?:css|js)$)/.test(path)) return true;
  if (/^(?:brand\.png|favicon\.(?:png|svg)|games\.json|manifest\.webmanifest)$/.test(path)) return true;
  if (!/^(?:media|pages|workspace)\//.test(path)) return false;
  return /\.(?:html|css|js|mjs|json|svg|png|webp|jpe?g|woff2?|wasm)$/i.test(path);
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

async function cacheModuleGraph(seeds, cache) {
  const pending = seeds.filter((asset) => /\.m?js(?:[?#]|$)/i.test(asset));
  const visited = new Set();
  const importPattern = /\b(?:import\s*(?:[\s\S]*?\bfrom\s*)?|export\s+[\s\S]*?\bfrom\s*)["']([^"']+)["']/g;

  while (pending.length) {
    const href = pending.pop();
    if (visited.has(href)) continue;
    visited.add(href);

    const moduleUrl = new URL(href, SCOPE_URL);
    if (moduleUrl.origin !== SCOPE_URL.origin || !moduleUrl.pathname.startsWith(SCOPE_URL.pathname)) continue;

    let response = await cache.match(moduleUrl.href);
    if (!response) {
      try {
        response = await fetch(moduleUrl.href);
        if (!response.ok) continue;
        await cache.put(moduleUrl.href, response.clone());
      } catch {
        continue;
      }
    }

    const source = await response.text();
    for (const match of source.matchAll(importPattern)) {
      try {
        const imported = new URL(match[1], moduleUrl);
        if (
          imported.origin === SCOPE_URL.origin
          && imported.pathname.startsWith(SCOPE_URL.pathname)
          && /\.m?js$/i.test(imported.pathname)
        ) {
          pending.push(imported.href);
        }
      } catch {
        // Ignore bare package names and non-URL module references.
      }
    }
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(CORE_FILES.map((path) => new URL(path, SCOPE_URL).href));

    const pageShells = CORE_FILES.filter((path) => /\.html$/.test(path) && !path.includes('/workspace/'));
    const assets = new Set();
    for (const path of pageShells) {
      const pageUrl = new URL(path, SCOPE_URL).href;
      const page = await cache.match(pageUrl);
      if (page) {
        for (const asset of getBundledAssets(await page.text())) assets.add(asset);
      }
    }
    if (!await cache.match(SHELL_URL)) throw new Error('The Goar app shell was not cached.');
    if (assets.size) {
      await cache.addAll([...assets]);
      await cacheModuleGraph([...assets], cache);
    }

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
  if (url.origin !== SCOPE_URL.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch {
        return (await caches.match(request, { ignoreSearch: true }))
          || (await caches.match(SHELL_URL))
          || new Response('Goar is offline. Reconnect and try again.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
      }
    })());
    return;
  }

  if (!isCacheableSiteFile(url)) return;
  event.respondWith((async () => {
    const cached = await caches.match(request, { ignoreSearch: true });
    try {
      const response = await fetch(request);
      if (!response.ok && cached) return cached;
      if (response.ok && response.type !== 'opaque') {
        const cache = await caches.open(SHELL_CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      return cached || new Response('This Goar page asset is not available offline yet.', {
        status: 504,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  })());
});