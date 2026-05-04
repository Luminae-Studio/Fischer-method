// FISCHER METHOD -- sw.js v4
// Service worker minimo - sem cache de JS/CSS
// Apenas remove caches antigos

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) {
        console.log('Deletando cache:', k);
        return caches.delete(k);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// SEM interceptacao de fetch
// Todos os arquivos vem sempre da rede
