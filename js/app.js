// ================================================
// FISCHER METHOD — app.js
// ================================================
document.addEventListener('DOMContentLoaded', function() {
  // Registra service worker para PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/Fischer-method/sw.js')
      .then(function(reg) { console.log('SW registrado:', reg.scope); })
      .catch(function(err) { console.log('SW erro:', err); });
  }
  initAuth();
});
