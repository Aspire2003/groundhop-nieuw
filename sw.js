// Groundhop web app: works in the stadium without signal. The page itself is fetched fresh when
// online (so a new version shows up) and falls back to the cached copy offline; so are the match data
// files. The bundle (hashed names) and fonts are cached on first use. 20260928091244 is replaced at build time.
const CACHE = 'groundhop-20260928091244';
// Every screen's code chunk, filled in at build time, so a screen never opened before still opens offline.
const CHUNKS = ["./_expo/static/js/web/+not-found-64014df8bd4b1db867445468ce256074.js","./_expo/static/js/web/[doc]-607d82b381f2db1c84572fb3240853bf.js","./_expo/static/js/web/[id]-1baae5d10b1793ccdbcc73ebae99d1da.js","./_expo/static/js/web/[id]-1d4414cb995662608a4ac1b31350d0bd.js","./_expo/static/js/web/[id]-445ae7768433f56dcb6ca4e6ba487779.js","./_expo/static/js/web/[id]-63ef146dd5f89b3d68bb94796d773ace.js","./_expo/static/js/web/[id]-6c88cdbcd0eba224faf915d1241bbf19.js","./_expo/static/js/web/[id]-b76f06bd5d6886af06e10c05f40a4c5f.js","./_expo/static/js/web/__common-c6557da24137ce568c155bacf2ee1371.js","./_expo/static/js/web/__expo-metro-runtime-ed4c1cfa6193d76fc294130e42bd1916.js","./_expo/static/js/web/_layout-3e08c6dde78b8e907b8250661762e932.js","./_expo/static/js/web/_layout-c96d5f8bbb21e82e221f8f2a3170d1b3.js","./_expo/static/js/web/add-chooser-6a4bb799db1239fa5a61e14d36def771.js","./_expo/static/js/web/checkin-86a21baf39bb9925971f215aa4404ce1.js","./_expo/static/js/web/club-pick-c486f967624602ca6b2f8d0a03b1343d.js","./_expo/static/js/web/compare-2d3f549fab5748869097e1d0b6e25d97.js","./_expo/static/js/web/competitions-pick-d75de9b447a468d672691403e1ce99ad.js","./_expo/static/js/web/correct-ticket-55a6159b04aa818bd835dfcbb10cddcb.js","./_expo/static/js/web/entry-da2ca8dfec85ab253d2c25cb3b858c3e.js","./_expo/static/js/web/grounds-f0493141c406478cc11e86eff97b81c4.js","./_expo/static/js/web/help-df07051d598392f8b3ed340241b76dab.js","./_expo/static/js/web/import-826e905df09ae1d427ac109cac89dfe6.js","./_expo/static/js/web/index-5516de768fad1dc0b878f86064ba8a98.js","./_expo/static/js/web/live-39a80c0d461f00eda28703e5759cf355.js","./_expo/static/js/web/map-0f4cc80224bedda1842d7dee2e740075.js","./_expo/static/js/web/map-47abdafc17be914663ba43b783d163e3.js","./_expo/static/js/web/match-add-631de2a6af4eb6990c699fb9452486b9.js","./_expo/static/js/web/matchday-more-66fbd50854e66f951a36450cb1c62a62.js","./_expo/static/js/web/my-xi-d6f25d771fbbfe863b65aecb16a0d7e1.js","./_expo/static/js/web/passport-43cf1dc4fef339c3d3e55724add0e577.js","./_expo/static/js/web/photos-a482932418d9046bd25efd221da53952.js","./_expo/static/js/web/planner-f6ad19f2f3efb6aaf3f3d6f59ffb2278.js","./_expo/static/js/web/puzzle-2287b6a3705df9070b1daa02731ea9cb.js","./_expo/static/js/web/search-2996f99c10a2ee798c8483eb7a0a2ddf.js","./_expo/static/js/web/season-add-24e483b591e57e3760b0c8dc85a1c567.js","./_expo/static/js/web/settings-fe13732ca0aa3cbc6a090270e8afced2.js","./_expo/static/js/web/share-ticket-71c1eda83dceeaa4e97dce53eefa5299.js","./_expo/static/js/web/shirt-add-7ecaf3504669a9fe057e412aaa43b127.js","./_expo/static/js/web/shirts-e12c463d61cb07c98404938d72098498.js","./_expo/static/js/web/tickets-09f1ab90708977046712195c92970c06.js","./_expo/static/js/web/tour-add-c0f8d8d3dc539b5a159f6d6c1e23ee98.js","./_expo/static/js/web/trophies-7cffd459c0b6f36f0fc3d8374314fe0f.js","./_expo/static/js/web/visit-add-05f78981d791799f6938296eed0f067c.js","./_expo/static/js/web/visit-notes-241ab0e88a007d570125314c4709593b.js","./_expo/static/js/web/welcome-8562169d925df2e9a06d8986120f1427.js","./_expo/static/js/web/wrapped-785f701c350140aad3ed9e2a883caac3.js","./_expo/static/js/web/you-b907b59665bbdc73f2f21f51def5eb9c.js"];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html', './manifest.webmanifest', ...CHUNKS])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('groundhop-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }
  // Match data and the version file: fresh when online (new results, new version), the cached copy offline.
  const path = new URL(req.url).pathname;
  if (path.includes('/data/') || path.endsWith('/version.json')) {
    event.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req)),
    );
    return;
  }
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
