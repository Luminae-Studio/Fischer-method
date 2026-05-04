// ================================================
// FISCHER METHOD — sw.js (Service Worker)
// ================================================
var CACHE = 'fischer-v1';
var ASSETS = [
  '/Fischer-method/',
  '/Fischer-method/index.html',
  '/Fischer-method/css/style.css',
  '/Fischer-method/js/config.js',
  '/Fischer-method/js/auth.js',
  '/Fischer-method/js/ui.js',
  '/Fischer-method/js/db.js',
  '/Fischer-method/js/app.js',
  '/Fischer-method/js/pages/inicio.js',
  '/Fischer-method/js/pages/treinos.js',
  '/Fischer-method/js/pages/progresso.js',
  '/Fischer-method/js/pages/perfil.js',
  '/Fischer-method/js/pages/dash.js',
  '/Fischer-method/js/pages/alunos.js',
  '/Fischer-method/js/pages/exercicios.js'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.hostname.includes('supabase') || url.hostname.includes('google')) return;
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(resp) {
        if (!resp || resp.status !== 200 || resp.type === 'opaque') return resp;
        var clone = resp.clone();
        caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        return resp;
      }).catch(function() { return caches.match('/Fischer-method/'); });
    })
  );
});
