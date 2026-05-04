// FISCHER METHOD -- sw.js v3
// Network first - nunca cacheia JS para garantir atualizacoes

self.addEventListener('install', function() {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  // Deleta TODOS os caches antigos
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Sem interceptacao de fetch - deixa tudo ir para a rede normalmente
// Isso garante que atualizacoes chegam imediatamente
