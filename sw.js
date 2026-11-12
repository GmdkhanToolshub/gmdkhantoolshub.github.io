/* GM AI Tools HUB service worker: makes the site installable and lets pages and tools you have already opened work offline.
   It only handles same-site GET requests. Ads, analytics, jobs data and anything cross-site go straight to the network, untouched. */
var VERSION = 'gm-pwa-v1';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin || r.headers.has('range')) return;
  if (/^\/data\//.test(u.pathname) || /\.(mp4|webm|mp3)$/i.test(u.pathname) || /sw\.js$/.test(u.pathname)) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(function (res) { if (res.ok) { var c = res.clone(); caches.open(VERSION).then(function (ch) { ch.put(r, c); }); } return res; })
      .catch(function () { return caches.match(r).then(function (m) { return m || caches.match('/') || new Response('You are offline. Open this page once while online to use it offline.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }); }));
    return;
  }
  e.respondWith(caches.match(r).then(function (hit) {
    var net = fetch(r).then(function (res) { if (res.ok && res.type === 'basic') { var c = res.clone(); caches.open(VERSION).then(function (ch) { ch.put(r, c); }); } return res; }).catch(function () { return hit; });
    return hit || net;
  }));
});
