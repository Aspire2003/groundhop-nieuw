// Groundhop web app: works in the stadium without signal. The page itself is fetched fresh when
// online (so a new version shows up) and falls back to the cached copy offline; so are the match data
// files. The bundle (hashed names) and fonts are cached on first use. 20260928190407 is replaced at build time.
const CACHE = 'groundhop-20260928190407';
// Every screen's code chunk, filled in at build time, so a screen never opened before still opens offline.
const CHUNKS = ["./_expo/static/js/web/+not-found-41a8d44e1a0bea82ba202be35989024c.js","./_expo/static/js/web/[doc]-d4a9385ace36b6ea30b41746611b49a2.js","./_expo/static/js/web/[id]-0c0ff94a3e483e7473721ebfa33eff0c.js","./_expo/static/js/web/[id]-2491b337183a822f0804f3f1ea04787f.js","./_expo/static/js/web/[id]-6b65b7aee6c11186ba20ea36d5379c6c.js","./_expo/static/js/web/[id]-7f459ce9325e383c83f61d8e35499812.js","./_expo/static/js/web/[id]-85c98f532c856a8b481e0e8365d84c87.js","./_expo/static/js/web/[id]-d8fd49b0e398d3ccfa1663dc6b3441dd.js","./_expo/static/js/web/__common-896aebb30f2d8b6203eba2959065780d.js","./_expo/static/js/web/__expo-metro-runtime-ed4c1cfa6193d76fc294130e42bd1916.js","./_expo/static/js/web/_layout-dc94572b6414b9187bfe3d3b8c14ebff.js","./_expo/static/js/web/_layout-faf6a96ee8922a0fac774c9adfa7c957.js","./_expo/static/js/web/account-9e09626c7c454b8e4e07a3eedb632a49.js","./_expo/static/js/web/account-forgot-3cf4940c6ca9d88507d970b7c64729ef.js","./_expo/static/js/web/account-signin-16b5aa05541a86fb0955cbfe9fd3905f.js","./_expo/static/js/web/add-chooser-f15207818cafd0bc8288338ac4677e04.js","./_expo/static/js/web/checkin-10e4e63777ca1ba19ab82adb878982f3.js","./_expo/static/js/web/club-pick-85ce811ec19250004754500a0af38f50.js","./_expo/static/js/web/compare-6ee77ee03097d2a1a99c6d07c5d37247.js","./_expo/static/js/web/competitions-pick-354efd65ee37042bab8dcfd709cdb7ac.js","./_expo/static/js/web/correct-ticket-bbf2f35ed20d03036023a3b646e24982.js","./_expo/static/js/web/doubleheader-febe408910395f7616836c7450a121cd.js","./_expo/static/js/web/entry-8de488b47f5807664c3cd06599794464.js","./_expo/static/js/web/grounds-4ef3b7c570851094a16250608f9f26cb.js","./_expo/static/js/web/help-1fcab912bef4a0f409a8f4972a035c52.js","./_expo/static/js/web/import-e6e1753542b16ea2e6c0d44d3377ec1f.js","./_expo/static/js/web/index-a8c6b6cc2f9639a5eddf07450f791bda.js","./_expo/static/js/web/live-5859557fac3a9574e3526f531a4ca2ec.js","./_expo/static/js/web/map-165c22a2d09a8bebe58f9d8553871bfa.js","./_expo/static/js/web/map-52819a08237d0f6cd8a7374e942527f2.js","./_expo/static/js/web/match-add-380d5b307ca165800682a7d10ec9ee5d.js","./_expo/static/js/web/matchday-more-42517a4678c561467ddcb77d596a0248.js","./_expo/static/js/web/my-xi-af493357ecc92d7fbb1568ef2e118be2.js","./_expo/static/js/web/passport-4a69a8c7fdfe19cffd9e0ced1913f785.js","./_expo/static/js/web/photos-69409e18f3485612d45569b942144b7e.js","./_expo/static/js/web/planner-9213068ee33a46debd83ae9d6bbd3b79.js","./_expo/static/js/web/puzzle-525c9d6b137ac88c64460c6c77824fbb.js","./_expo/static/js/web/search-99456646bca2edcceaad4aedcece66c2.js","./_expo/static/js/web/season-add-7f500046b2d88e196dfcdcd3a16a63b8.js","./_expo/static/js/web/settings-dc94e26469ff30cd93cc282276781bda.js","./_expo/static/js/web/share-ticket-4f273550677b455f92d1fd189e823755.js","./_expo/static/js/web/shirt-add-1157be8bbdc4e8cde3c3cf7af5370f3e.js","./_expo/static/js/web/shirts-4b1bf4e5f5e11f537bf72379ab10bd61.js","./_expo/static/js/web/tickets-1729137a7f1523d59885ae0b04c221bd.js","./_expo/static/js/web/tour-add-eebefe2f2485412324c2474c1fd5684c.js","./_expo/static/js/web/trophies-116c39117afa13e8e49f669ef63d50d1.js","./_expo/static/js/web/visit-add-120fe28cfbf059d73c2d90de6b328f0d.js","./_expo/static/js/web/visit-notes-4a8eabf3bf57439d571bce763aa968fc.js","./_expo/static/js/web/welcome-b921e650a78a4d8a8922b0f37591d8d1.js","./_expo/static/js/web/wrapped-afcc4d0944889e652371a3055afb954c.js","./_expo/static/js/web/you-3495a2ce9e921a634fde643d4d9ba003.js"];

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
