// The test link has moved into the regular app: remove this old worker and send open tabs on.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.registration.unregister().then(() => self.clients.matchAll()).then((cs) => cs.forEach((c) => c.navigate('https://aspire2003.github.io/groundhop-preview/')))));
