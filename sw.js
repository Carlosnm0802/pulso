// ============================================================================
// Service Worker — Pulso PWA
// ============================================================================

const CACHE_NAME = 'pulso-v1';

// Recursos estáticos locales para almacenar en caché
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './css/components.css',
  './css/pages.css',
  './js/config.js',
  './js/app.js',
  './js/utils/date.js',
  './js/services/metrics.js',
  './js/services/categories.js',
  './js/services/tasks.js',
  './js/services/habits.js',
  './js/services/completions.js',
  './js/components/chart.js',
  './js/components/modals.js',
  './js/pages/today.js',
  './js/pages/manage.js',
  './js/pages/history.js',
  './assets/icons/icon-192x192.svg',
  './assets/icons/icon-512x512.svg'
];

// Instalar Service Worker y guardar recursos estáticos en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Almacenando recursos en caché...');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activar Service Worker y limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Limpiando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia de respuesta: Network First con fallback a Caché para recursos estáticos
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones a la API de Supabase o CDNs externas para asegurar datos frescos siempre
  if (
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('jsdelivr.net')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Clonar y actualizar la caché con la respuesta fresca si la red responde ok
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback a caché si el usuario pierde conexión
        return caches.match(event.request);
      })
  );
});
