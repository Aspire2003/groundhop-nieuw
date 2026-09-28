// Groundhop web app: works in the stadium without signal. The page itself is fetched fresh when
// online (so a new version shows up) and falls back to the cached copy offline; so are the match data
// files. The bundle (hashed names) and fonts are cached on first use. 20260928153155 is replaced at build time.
const CACHE = 'groundhop-20260928153155';
// Every screen's code chunk, filled in at build time, so a screen never opened before still opens offline.
const CHUNKS = ["./_expo/static/js/web/+not-found-7964e2f7ed268de0bd7f40277c55f6a8.js","./_expo/static/js/web/[doc]-aa4720975423e929a54b01ff48e5c74b.js","./_expo/static/js/web/[id]-26c2c8aec2f64fff7144eabeb803b991.js","./_expo/static/js/web/[id]-60ffcd259ce399c705766c6463f22385.js","./_expo/static/js/web/[id]-8066025535c5c1e039a2164934a99d7d.js","./_expo/static/js/web/[id]-830554a37ca0295117f1334d022e4d20.js","./_expo/static/js/web/[id]-ab92fca4df09d6c3d747d2b082cf967a.js","./_expo/static/js/web/[id]-c39e0c415f56818f1d66052acef35f45.js","./_expo/static/js/web/__common-95832d5ca0473374787185fb60ce93d5.js","./_expo/static/js/web/__expo-metro-runtime-ed4c1cfa6193d76fc294130e42bd1916.js","./_expo/static/js/web/_layout-0b3e62e56e044251cecde9f4d5f3eb1f.js","./_expo/static/js/web/_layout-d835b41b71dd5fe376466c44f56e5353.js","./_expo/static/js/web/add-chooser-c9ba14ed1ead618f39e20fdaf7deb3c0.js","./_expo/static/js/web/checkin-416223eb36c1d8d29e476661d662cb8c.js","./_expo/static/js/web/club-pick-dc6867b9574f6d91641f4e8a6faea162.js","./_expo/static/js/web/compare-f26d2131930c5c2303098cfe9e18c019.js","./_expo/static/js/web/competitions-pick-ceb2c913589cc30d531bb197facd5aa5.js","./_expo/static/js/web/correct-ticket-a8f300314ed601c9bb0951c7f6bf15f5.js","./_expo/static/js/web/doubleheader-bdebf0cf5072754080fda024b7100b37.js","./_expo/static/js/web/entry-062a95617c6f3dce8c6c4c21c8d46e6d.js","./_expo/static/js/web/grounds-fc5f3a63dd1fd12e1d2b72ae678cc322.js","./_expo/static/js/web/help-20bc222256a257a44b5fe63e324fb0e3.js","./_expo/static/js/web/import-17d65debb4896bc964e878417859edfc.js","./_expo/static/js/web/index-aeff20608f03f6cbcc466484af67dcb3.js","./_expo/static/js/web/live-5e036b26bca1b5fb6167f7b76767eaa3.js","./_expo/static/js/web/map-76a9f887c9e56b1d805303553e790d40.js","./_expo/static/js/web/map-c2401a556571ac8837df6703243021e4.js","./_expo/static/js/web/match-add-6b4f4e059861354e64bcc97ba518f47a.js","./_expo/static/js/web/matchday-more-65b7c978d05bcce256a67830cc79527f.js","./_expo/static/js/web/my-xi-7b53bc39638aa83af9c944cd6620dccb.js","./_expo/static/js/web/passport-13557e04a3f2a8ca7045e40cc3e7b9eb.js","./_expo/static/js/web/photos-e7fdc66a7225b648c75bddd85b65e78e.js","./_expo/static/js/web/planner-acd1db019b2298dfdde7a0d3fb7669c3.js","./_expo/static/js/web/puzzle-53e821aeaddb1dade12e98e7d836fbdb.js","./_expo/static/js/web/search-c04b6ffd4745ef53dbb9170b6037c268.js","./_expo/static/js/web/season-add-cb8886cfaac657543f5b07fbf4ad8f3b.js","./_expo/static/js/web/settings-bee593d746c394c258fe2ed40f43a496.js","./_expo/static/js/web/share-ticket-6a932ffdf3bb64f40876ac79b90125f5.js","./_expo/static/js/web/shirt-add-4341203331c5455d2dac5664fc31ae88.js","./_expo/static/js/web/shirts-3ff3da574b12c04ab8141f05a99f35d0.js","./_expo/static/js/web/tickets-ad346d48dd75be5594ae561d305ddf94.js","./_expo/static/js/web/tour-add-1a387429d3a285409ee56612913f2874.js","./_expo/static/js/web/trophies-82059ddad7ae4a6dcce5ccd537816860.js","./_expo/static/js/web/visit-add-f1b0d1af4d17daedfaed6e72c54e1c3a.js","./_expo/static/js/web/visit-notes-8e506051edd135b7cf610f57bbff5982.js","./_expo/static/js/web/welcome-92cde90cbb49f781546f3811b00b81da.js","./_expo/static/js/web/wrapped-44eca6f223d52cc2fb9599c2deaf6c59.js","./_expo/static/js/web/you-a4aa27809775b22eddd15a5a11043601.js"];

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
