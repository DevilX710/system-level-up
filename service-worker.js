/*
 * SYSTEM // AWAKENING
 * iPhone 6 Legacy Service Worker
 *
 * Network-first caching:
 * - New deployments are picked up automatically.
 * - Offline fallback still works.
 * - Old caches are removed when this worker activates.
 * - localStorage is NEVER deleted.
 */

var CACHE_VERSION = "system-awakening-v7";
var STATIC_CACHE = CACHE_VERSION + "-static";
var OFFLINE_URL = "./index.html";

var APP_SHELL = [
  "./",
  "./index.html",
  "./accessibility-fix.css"
];

/* Install the new service worker */
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(function(cache) {
        return cache.addAll(APP_SHELL);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

/* Delete old caches and take control immediately */
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(
          keys.map(function(key) {
            if (key !== STATIC_CACHE) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(function() {
        return self.clients.claim();
      })
  );
});

/*
 * HTML / page requests:
 * NETWORK FIRST
 *
 * This means a new deployment is preferred over
 * an old cached version.
 */
function networkFirst(request) {
  return fetch(request)
    .then(function(response) {

      if (response && response.ok) {
        var copy = response.clone();

        caches.open(STATIC_CACHE)
          .then(function(cache) {
            cache.put(request, copy);
          });
      }

      return response;
    })
    .catch(function() {

      return caches.match(request)
        .then(function(cached) {

          return cached || caches.match(OFFLINE_URL);

        });

    });
}

/*
 * CSS / JS / images / other assets:
 * Network first, cache fallback.
 */
function assetRequest(request) {

  return fetch(request)
    .then(function(response) {

      if (response && response.ok) {

        var copy = response.clone();

        caches.open(STATIC_CACHE)
          .then(function(cache) {
            cache.put(request, copy);
          });

      }

      return response;

    })
    .catch(function() {

      return caches.match(request);

    });

}

/* Handle requests */
self.addEventListener("fetch", function(event) {

  var request = event.request;

  if (request.method !== "GET") {
    return;
  }

  var url = new URL(request.url);

  /* Only handle files from your own website */
  if (url.origin !== self.location.origin) {
    return;
  }

  /*
   * HTML pages → network first
   */
  if (
    request.mode === "navigate" ||
    request.destination === "document"
  ) {

    event.respondWith(
      networkFirst(request)
    );

    return;
  }

  /*
   * Other files → network first
   */
  event.respondWith(
    assetRequest(request)
  );

});
