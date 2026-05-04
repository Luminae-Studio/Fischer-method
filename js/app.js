// FISCHER METHOD -- app.js
// Versao: 2026-05-04

document.addEventListener('DOMContentLoaded', function() {

  // Remove TODOS os service workers e caches antigos
  if ('serviceWorker' in navigator) {
    // Desregistra todos os SWs
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      var promises = regs.map(function(reg) {
        console.log('Removendo SW:', reg.scope);
        return reg.unregister();
      });
      return Promise.all(promises);
    }).then(function() {
      // Limpa todos os caches
      return caches.keys().then(function(keys) {
        return Promise.all(keys.map(function(k) {
          console.log('Limpando cache:', k);
          return caches.delete(k);
        }));
      });
    }).catch(function(err) {
      console.log('SW cleanup error:', err);
    });
  }

  initAuth();
});
