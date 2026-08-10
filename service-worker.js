const CACHE_NAME = "system-level-up-v2";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png",
    "./apple-touch-icon.png"
];


self.addEventListener("install", function(event) {

    self.skipWaiting();

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(function(cache) {

                return Promise.all(

                    FILES_TO_CACHE.map(function(url) {

                        return cache.add(url)
                            .catch(function(e) {

                                console.log(
                                    "Skip caching (not found): " + url
                                );

                            });

                    })

                );

            })

    );

});


self.addEventListener("activate", function(event) {

    event.waitUntil(

        caches.keys().then(function(names) {

            return Promise.all(

                names.map(function(name) {

                    if (
                        name !== CACHE_NAME
                    ) {

                        return caches.delete(
                            name
                        );

                    }

                })

            );

        }).then(function() {

            return self.clients.claim();

        })

    );

});


/* NETWORK-FIRST: always try to get the latest file when online
   (so new deploys show up right away). Falls back to the cached
   copy only when there's no network — that's what gives you
   offline support. */

self.addEventListener("fetch", function(event) {

    if (event.request.method !== "GET")
        return;

    event.respondWith(

        fetch(event.request)
            .then(function(response) {

                var copy = response.clone();

                caches.open(CACHE_NAME).then(function(cache) {

                    cache.put(event.request, copy);

                });

                return response;

            })
            .catch(function() {

                return caches.match(event.request)
                    .then(function(cached) {

                        return cached || caches.match("./index.html");

                    });

            })

    );

});
