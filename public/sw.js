// PurePlate Offline Production Service Worker
const CACHE_NAME = "pureplate-v3";
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
  "./js/devmode.js",
  "./manifest.json",
  "./assets/logo.svg"
];

// Install Event: Pre-cache static shell
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Pre-caching offline assets");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up old cache versions
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) {
            console.log("[ServiceWorker] Removing old cache:", k);
            return caches.delete(k);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Cache First with Network Fallback
self.addEventListener("fetch", (e) => {
  // Allow chrome-extension and external analytics to pass through
  if (!e.request.url.startsWith("http")) return;

  // Never cache live backend REST API requests
  if (e.request.url.includes("/api/")) return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(e.request)
        .then((networkResponse) => {
          // If response is valid, clone and cache it for future offline use
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
          // If offline and request is for page navigation, return cached index.html
          if (e.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
    })
  );
});
