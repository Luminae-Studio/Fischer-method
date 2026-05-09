// FISCHER METHOD -- sw.js v5
var CACHE = 'fischer-v5';

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll([
        '/',
        '/index.html',
        '/css/style.css',
        '/manifest.json',
        '/icons/icon-192.png',
        '/icons/icon-512.png'
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

  // Nunca intercepta Supabase ou Google
  if (url.hostname.includes('supabase') ||
      url.hostname.includes('google') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('jsdelivr')) return;

  // JS e CSS: sempre busca da rede primeiro
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    e.respondWith(
      fetch(e.request).then(function(resp) {
        var clone = resp.clone();
        caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        return resp;
      }).catch(function() { return caches.match(e.request); })
    );
    return;
  }

  // Tudo mais: cache primeiro
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
