// FISCHER METHOD -- app.js
document.addEventListener('DOMContentLoaded', function() {

  // Remove service workers antigos que estao cacheando versoes velhas
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      regs.forEach(function(reg) { reg.unregister(); });
    });
  }

  initAuth();
});
