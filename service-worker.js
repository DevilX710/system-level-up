const CACHE_NAME = "system-level-up-v2-1";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./enhancements.js",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png",
    "./apple-touch-icon.png"
];

self.addEventListener("install", function(event) {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return Promise.all(
                FILES_TO_CACHE.map(function(url) {
                    return cache.add(url).catch(function(e) {
                        console.log("Skip caching (not found): " + url);
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
                    if (name !== CACHE_NAME) return caches.delete(name);
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

/* NETWORK-FIRST with a tiny HTML enhancement injection.
   The main index.html remains untouched so the existing UI/data logic
   stays intact. */
self.addEventListener("fetch", function(event) {
    if (event.request.method !== "GET") return;

    event.respondWith(
        fetch(event.request).then(function(response) {
            var url = event.request.url;
            var isHtml = response.headers.get("content-type") &&
                response.headers.get("content-type").indexOf("text/html") !== -1;

            if (isHtml && (url.indexOf("/index.html") !== -1 || url.endsWith("/"))) {
                return response.clone().text().then(function(html) {
                    if (html.indexOf("enhancements.js") === -1) {
                        html = html.replace("</body>", "<script src=\"./enhancements.js\"></script>\n</body>");
                    }
                    var headers = new Headers(response.headers);
                    headers.set("content-type", "text/html; charset=utf-8");
                    return new Response(html, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: headers
                    });
                });
            }

            return response;
        }).then(function(response) {
            var copy = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
                cache.put(event.request, copy);
            });
            return response;
        }).catch(function() {
            return caches.match(event.request).then(function(cached) {
                return cached || caches.match("./index.html");
            });
        })
    );
});
