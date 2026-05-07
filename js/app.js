// FISCHER METHOD -- app.js
document.addEventListener('DOMContentLoaded', function() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(function(reg) {
        console.log('SW registrado:', reg.scope);
        // Detecta atualizacao disponivel
        reg.addEventListener('updatefound', function() {
          var newWorker = reg.installing;
          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Nova versao disponivel!');
            }
          });
        });
      })
      .catch(function(err) { console.log('SW erro:', err); });

    // Prompt de instalacao
    window.addEventListener('beforeinstallprompt', function(e) {
      e.preventDefault();
      window._installPrompt = e;
      // Mostra banner apos 3 segundos se nao estiver instalado
      setTimeout(function() {
        if (!window.matchMedia('(display-mode: standalone)').matches) {
          showInstallBanner();
        }
      }, 3000);
    });
  }

  initAuth();
});

function showInstallBanner() {
  if (localStorage.getItem('fm_install_dismissed')) return;
  var existing = document.getElementById('install-banner');
  if (existing) return;

  var banner = document.createElement('div');
  banner.id = 'install-banner';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:var(--green);color:#fff;padding:12px 16px;display:flex;align-items:center;gap:12px;font-size:13px;font-weight:500;box-shadow:0 2px 12px rgba(0,0,0,.3);';
  banner.innerHTML =
    '<span style="flex:1;">Instalar Fischer Method como app?</span>' +
    '<button onclick="installApp()" style="background:#fff;color:var(--green);border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;">Instalar</button>' +
    '<button onclick="dismissInstall()" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:0 4px;">&#x2715;</button>';
  document.body.prepend(banner);
}

function installApp() {
  if (window._installPrompt) {
    window._installPrompt.prompt();
    window._installPrompt.userChoice.then(function() {
      dismissInstall();
      window._installPrompt = null;
    });
  }
}

function dismissInstall() {
  var b = document.getElementById('install-banner');
  if (b) b.remove();
  localStorage.setItem('fm_install_dismissed', '1');
}
