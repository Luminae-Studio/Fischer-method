// FISCHER METHOD -- sw.js v8
var CACHE = 'fischer-v8';

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll([
        '/icons/icon-192.png',
        '/icons/icon-512.png',
        '/manifest.json'
      ]).catch(function(err) { console.log('Cache error:', err); });
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);

  // Nunca intercepta Supabase, Google, CDNs externos
  if (url.hostname.includes('supabase') ||
      url.hostname.includes('google') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('jsdelivr') ||
      url.hostname.includes('youtube') ||
      url.hostname.includes('fonts.g')) return;

  // HTML, JS e CSS: SEMPRE rede primeiro
  // Garante que qualquer deploy chega imediatamente, sem precisar limpar cache
  var isAppFile = url.pathname === '/' ||
                  url.pathname.endsWith('.html') ||
                  url.pathname.endsWith('.js') ||
                  url.pathname.endsWith('.css');

  if (isAppFile) {
    e.respondWith(
      fetch(e.request).then(function(resp) {
        var clone = resp.clone();
        caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        return resp;
      }).catch(function() {
        // Offline: serve do cache como fallback
        return caches.match(e.request) || caches.match('/index.html');
      })
    );
    return;
  }

  // Imagens e icons: cache primeiro (mudam raramente)
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(resp) {
        var clone = resp.clone();
        caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        return resp;
      });
    }).catch(function() { return caches.match('/index.html'); })
  );
});
