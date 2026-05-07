// FISCHER METHOD -- app.js
document.addEventListener('DOMContentLoaded', function() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      regs.forEach(function(reg) { reg.unregister(); });
    });
    navigator.serviceWorker.register('/sw.js').catch(function(){});
  }
  initAuth();
});
