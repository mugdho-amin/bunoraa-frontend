/**
 * Bunoraa Service Worker
 * Provides offline support, caching strategies, and background sync.
 * 
 * @version 1.0.0
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `bunoraa-static-${CACHE_VERSION}`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/icon.png',
  '/apple-icon.png',
  '/favicon.ico',
  '/site.webmanifest',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn('[SW] Failed to cache some static assets:', err);
          // Continue installation even if some assets fail
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Installation failed:', err);
        throw err;
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete old version caches
              return name.startsWith('bunoraa-') && 
                     !name.includes(CACHE_VERSION);
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip unsupported protocols
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Skip cross-origin requests to avoid opaque response blocking for remote media
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Skip media requests entirely to avoid CORS and opaque response issues
  if (url.pathname.startsWith('/media/') || isImageRequest(request)) {
    return;
  }
  
  if (isAssetRequest(request)) {
    event.respondWith(assetStrategy(request));
  }
});

// Helper: Check if request is for static assets
function isAssetRequest(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith('/_next/static/') ||
    /\.(js|css|woff2?|webmanifest)$/.test(url.pathname)
  );
}

// Helper: Check if request is for images
function isImageRequest(request) {
  return /\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/.test(request.url);
}

// Strategy: Cache first for static assets
async function assetStrategy(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    // Return cached and refresh in background
    fetchAndCache(request, cache);
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    console.error('[SW] Asset fetch failed');
    return cached || new Response('Asset unavailable', { status: 503 });
  }
}

// Helper: Fetch and cache in background
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
  } catch {
    // Silently fail background updates
  }
}

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncFormSubmissions());
  }
});

// Sync queued form submissions
async function syncFormSubmissions() {
  // This would integrate with IndexedDB to queue and retry form submissions
  console.log('[SW] Syncing offline form submissions');
  // Implementation depends on your form handling strategy
}

// Push notification support
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }
  
  const title = payload.title || 'Bunoraa';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon.png',
    badge: payload.badge || '/favicon.ico',
    data: payload.data || {},
    actions: payload.actions || [],
    requireInteraction: false,
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Message handling for app-level communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map((name) => caches.delete(name)));
    });
  }
});

console.log('[SW] Service Worker loaded');
