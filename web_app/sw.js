// PurePlate Modern Service Worker (Network First Strategy)
const CACHE_NAME = "pureplate-v5-clean";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/data.js",
  "./js/storage.js",
  "./js/auth.js",
  "./js/sound.js",
  "./js/camera.js",
  "./js/map.js",
  "./js/quiz.js",
  "./js/app.js",
  "./manifest.json",
  "./assets/logo.svg"
];

// Install Event: Cache fresh shell
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Pre-caching clean production assets");
      return cache.addAll(ASSETS_TO_CACHE);
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
      .catch(() => {
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (e.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
      })
  );
});
