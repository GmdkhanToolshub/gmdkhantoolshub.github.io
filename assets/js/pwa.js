/* Registers the service worker so the site can be installed and opened offline. Safe to skip: the site works the same without it. */
(function () {
  if (!('serviceWorker' in navigator)) return;
  if (!(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;
  window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () { /* offline mode unavailable: ignore */ }); });
})();
