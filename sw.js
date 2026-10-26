/* Service worker de la versión iPhone: la app vive en el teléfono y funciona sin internet */
const VERSION = '1.10.0-mvostiyq';
const CORE = ["./","css/fonts.css","css/law.css","css/rococo.css","css/styles.css","css/v17.css","css/v18.css","css/v20.css","fonts/atkinson-hyperlegible-latin-400-normal.woff2","fonts/atkinson-hyperlegible-latin-ext-400-normal.woff2","fonts/caveat-latin-500-normal.woff2","fonts/caveat-latin-600-normal.woff2","fonts/caveat-latin-ext-500-normal.woff2","fonts/caveat-latin-ext-600-normal.woff2","fonts/cormorant-garamond-latin-500-italic.woff2","fonts/cormorant-garamond-latin-500-normal.woff2","fonts/cormorant-garamond-latin-600-normal.woff2","fonts/cormorant-garamond-latin-700-normal.woff2","fonts/cormorant-garamond-latin-ext-500-italic.woff2","fonts/cormorant-garamond-latin-ext-500-normal.woff2","fonts/cormorant-garamond-latin-ext-600-normal.woff2","fonts/cormorant-garamond-latin-ext-700-normal.woff2","fonts/lora-latin-400-italic.woff2","fonts/lora-latin-400-normal.woff2","fonts/lora-latin-500-normal.woff2","fonts/lora-latin-600-normal.woff2","fonts/lora-latin-ext-400-italic.woff2","fonts/lora-latin-ext-400-normal.woff2","fonts/lora-latin-ext-500-normal.woff2","fonts/lora-latin-ext-600-normal.woff2","fonts/opendyslexic-latin-400-normal.woff2","fonts/pinyon-script-latin-400-normal.woff2","fonts/pinyon-script-latin-ext-400-normal.woff2","icon.png","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","index.html","js/album.js","js/annotations.js","js/audiobook.js","js/backup.js","js/bookopen.js","js/books-edit.js","js/boot.js","js/buddy-anim.js","js/buddy-life.js","js/buddy-plus.js","js/buddy.js","js/calendar-day.js","js/comics.js","js/core.js","js/data/facts.js","js/data/world.js","js/dates.js","js/decorator.js","js/dictionary.js","js/dress-plus.js","js/epub-reader.js","js/extras.js","js/extras12.js","js/features14.js","js/garden.js","js/goals.js","js/helpers.js","js/historia.js","js/law-codes.js","js/law-docs.js","js/law-main.js","js/law-passion.js","js/law-study.js","js/letters.js","js/map.js","js/memories18.js","js/migrate.js","js/organize.js","js/pageflip.js","js/quotes-diary.js","js/reader-plus.js","js/reader-v12.js","js/reader.js","js/reading18.js","js/salon-life.js","js/search.js","js/seasons.js","js/seasons2.js","js/session.js","js/settings.js","js/sounds.js","js/stats-adv.js","js/stats.js","js/storage.js","js/sync.js","js/system.js","js/updater.js","js/wrapped.js","manifest.webmanifest","mobile.css","vendor/epub.min.js","vendor/jszip.min.js","vendor/mammoth.browser.min.js","vendor/pdf-lib.min.js","vendor/pdf.min.js","vendor/pdf.worker.min.js","web-shim.js","web-tail.js"];
const CACHE = 'bib-' + VERSION;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('bib-') && k !== CACHE && k !== 'bib-extra').map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;           // SPIJ, RAE, clima: siempre por internet
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      // sonidos y diccionarios: se guardan la primera vez que se usan (y sobreviven a las actualizaciones)
      if (res.ok && res.status === 200 && /\/(sounds\/|js\/data\/dict-)/.test(url.pathname)) {
        const copy = res.clone(); caches.open('bib-extra').then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => req.mode === 'navigate' ? caches.match('./') : Response.error()))
  );
});
