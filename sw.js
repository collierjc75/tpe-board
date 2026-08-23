/* TPE PWA service worker v1 (2026-08-22)
   Strategy: network-first for pages (freshness is the product; auto-refresh machinery
   must keep working), cache fallback when offline; cache-first for static assets. */
const SHELL = "tpe-shell-v1";
const ASSETS = ["icon-192.png", "icon-512.png", "apple-touch-icon.png", "manifest.webmanifest"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (e.request.mode === "navigate" || url.pathname.endsWith(".html")) {
    e.respondWith(
      fetch(e.request).then(r => {
        const cp = r.clone();
        caches.open(SHELL).then(c => c.put(e.request, cp));
        return r;
      }).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
        const cp = r.clone();
        caches.open(SHELL).then(c => c.put(e.request, cp));
        return r;
      }))
    );
  }
});
