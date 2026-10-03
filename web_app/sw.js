// PurePlate Modern React Service Worker (Network First Strategy)
const CACHE_NAME = "pureplate-v7-react";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/assets/logo.svg"
];

// Install Event: Cache fresh shell without breaking on 404s
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log("[ServiceWorker] Pre-caching clean production React shell");
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn("[ServiceWorker] Non-critical cache skip:", asset);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate Event: Obliterate ALL old caches immediately
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) {
            console.log("[ServiceWorker] Purging legacy cache:", k);
            return caches.delete(k);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network-First Strategy
// Guarantees fresh updates from Vercel edge, only using cache if user is completely offline
self.addEventListener("fetch", (e) => {
  if (!e.request.url.startsWith("http")) return;
  if (e.request.url.includes("/api/")) return;
  // Let map tiles bypass SW cache to prevent tile corruption
  if (e.request.url.includes("basemaps.cartocdn.com") || e.request.url.includes("tile.openstreetmap.org")) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (networkResponse.type === "basic" || networkResponse.type === "cors")
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Fallback to cache when offline
        const cachedResponse = await caches.match(e.request);
        if (cachedResponse) return cachedResponse;
        if (e.request.mode === "navigate") {
          return caches.match("/index.html") || caches.match("/");
        }
      })
  );
});
