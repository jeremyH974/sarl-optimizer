// Enregistrement du service worker (offline / PWA) — silencieux si non supporté.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
