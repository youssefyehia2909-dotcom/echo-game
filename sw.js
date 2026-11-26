/* Network first, so updates show on the next open. Falls back to the saved copy when offline.
   Bump VERSION when you change files, to clear old saved copies. */
var VERSION = "echo-v4";
var CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return c.addAll(CORE.map(function (u) { return new Request(u, { cache: "reload" }); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function save(req, res) {
  if (res && (res.ok || res.type === "opaque")) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
  return res;
}
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var same = new URL(req.url).origin === location.origin;
  if (!same) { /* fonts: saved copy first */
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) { return save(req, res); });
    }));
    return;
  }
  e.respondWith(fetch(req, { cache: "no-cache" }).then(function (res) { return save(req, res); }).catch(function () {
    return caches.match(req).then(function (hit) { return hit || caches.match("index.html"); });
  }));
});
