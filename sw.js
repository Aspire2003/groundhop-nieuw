// Groundhop web app: works in the stadium without signal. The page itself is fetched fresh when
// online (so a new version shows up) and falls back to the cached copy offline; so are the match data
// files. The bundle (hashed names) and fonts are cached on first use. 20260928142008 is replaced at build time.
const CACHE = 'groundhop-20260928142008';
// Every screen's code chunk, filled in at build time, so a screen never opened before still opens offline.
const CHUNKS = ["./_expo/static/js/web/+not-found-64014df8bd4b1db867445468ce256074.js","./_expo/static/js/web/[doc]-9a74ea1a89295f5eb7cb417729e4cae2.js","./_expo/static/js/web/[id]-31620550991378e4c905435a6324a3c9.js","./_expo/static/js/web/[id]-72b09b80ff6cf3a17c4e64ce2a342c10.js","./_expo/static/js/web/[id]-7c7f0a04ae6df1ac2769173301d00a44.js","./_expo/static/js/web/[id]-8ef99a96348709b8dad50199bf231226.js","./_expo/static/js/web/[id]-ca3990805897460977003145d90c372f.js","./_expo/static/js/web/[id]-ff617a22191352f9da7cdc3f031f195e.js","./_expo/static/js/web/__common-f022078b775356dec5a605007cf18b61.js","./_expo/static/js/web/__expo-metro-runtime-ed4c1cfa6193d76fc294130e42bd1916.js","./_expo/static/js/web/_layout-b151a26910c0b6afd93d6fc8437b8326.js","./_expo/static/js/web/_layout-e587a07f536f2eaf2182686d8ee604d9.js","./_expo/static/js/web/add-chooser-deb0e8b50b96f84e4fd0c9353ac078f1.js","./_expo/static/js/web/checkin-d4ccd31c6f69fbdfe410da005358cf2b.js","./_expo/static/js/web/club-pick-a37febbca9e89e364523380cfed81834.js","./_expo/static/js/web/compare-96cb1ffe2f339ffd31fa29b80719de0d.js","./_expo/static/js/web/competitions-pick-de5724be91861ebd348fa6ff1e9d5de5.js","./_expo/static/js/web/correct-ticket-2588ee486971ecedc65a82e0366da3c2.js","./_expo/static/js/web/entry-1822b55bf514d86477a12896887e6f5a.js","./_expo/static/js/web/grounds-e5e5d0ab6e195d790f3bf8557681bcb3.js","./_expo/static/js/web/help-78f1832be1aa08d84f05cc9845228559.js","./_expo/static/js/web/import-90e8d10d091ca690c485ed5e57f81416.js","./_expo/static/js/web/index-b05ccbfce38a681e73fade79f530d4ee.js","./_expo/static/js/web/live-c9502f5e49eaa8906168513c3332a3ed.js","./_expo/static/js/web/map-7411958a982b1c39066b027bc9ff8d0f.js","./_expo/static/js/web/map-bc457e8df58cf93613417e27ce043130.js","./_expo/static/js/web/match-add-fb3589859bee4444bca242b8efab8c61.js","./_expo/static/js/web/matchday-more-22673ddc1f1a543507e43072e1cffcc4.js","./_expo/static/js/web/my-xi-46251c9459069d6c203411cd7b8095d1.js","./_expo/static/js/web/passport-1addc6770a559443383781292e51b6e2.js","./_expo/static/js/web/photos-259b7b5f624ed48da471950bd1a462d2.js","./_expo/static/js/web/planner-914122affbe6febdfab98b36e1ca5dc0.js","./_expo/static/js/web/puzzle-2a287953cd17d2561901b7828eb1531c.js","./_expo/static/js/web/search-1e670962ceccacdbd092acc3aacb11b3.js","./_expo/static/js/web/season-add-1fa286799d5a5abe2f3df7919f82f769.js","./_expo/static/js/web/settings-f07d447344be305775476d07a3e4d443.js","./_expo/static/js/web/share-ticket-4b3a710eaad26ae6fa8600152f13f153.js","./_expo/static/js/web/shirt-add-537cd1eb826e0d98201f5f27a43bfb89.js","./_expo/static/js/web/shirts-935aa1ae857346fb2c037e4c6f07795e.js","./_expo/static/js/web/tickets-790e5eb5952a9628db7c7c60f3c52ba0.js","./_expo/static/js/web/tour-add-c6014de3c3f7b0428d8fb0b30f0d6623.js","./_expo/static/js/web/trophies-0ab4b6e545a793b79585f12d1f01c5bf.js","./_expo/static/js/web/visit-add-88f337ea7816534456bdaeff4df08b96.js","./_expo/static/js/web/visit-notes-b88921e1bd29335ed6bdb9e3b174987e.js","./_expo/static/js/web/welcome-bc337645ee9d8ef9fd79c975e577fc61.js","./_expo/static/js/web/wrapped-55f9647c5b9133cf6a506bd81858b2c1.js","./_expo/static/js/web/you-8288561dcff4de00260130c1d0dedaf8.js"];

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
