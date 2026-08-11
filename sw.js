// Service worker : network-first (le réseau prime, le cache sert en offline / secours).
// Prêt pour le futur : versionnez le cache à chaque mise à jour majeure.
const CACHE = 'sarl-2026-v1';
const ASSETS = [
  'style.css', 'darkmode.js', 'recherche.js', 'sauvegarde.js',
  'parametres-2026.js', 'moteur-calcul.js', 'manifest.json',
  'icon-192.png', 'icon-512.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Network-first : on essaie le réseau, on retombe sur le cache si offline
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then((m) => m || caches.match('index.html')))
  );
});
