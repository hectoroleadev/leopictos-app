// Service Worker for LeoPictos PWA
// Implements aggressive caching for S3 images and smart caching for API calls

const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
  images: `leopictos-images-${CACHE_VERSION}`,
  api: `leopictos-api-${CACHE_VERSION}`,
  static: `leopictos-static-${CACHE_VERSION}`
};

const API_ENDPOINT = 'https://rmxx2fv016.execute-api.us-east-1.amazonaws.com/dev';
const S3_PATTERN = /\.s3\.amazonaws\.com/;
const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes for API cache

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAMES.static).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json'
      ]).catch(err => {
        console.warn('[SW] Failed to cache some static assets:', err);
      });
    })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches that don't match current version
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Strategy 1: Cache-First for S3 images (permanent cache)
  if (S3_PATTERN.test(url.hostname)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.images));
    return;
  }

  // Strategy 2: Network-First for API calls (with cache fallback)
  if (url.origin === API_ENDPOINT || url.href.startsWith(API_ENDPOINT)) {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.api));
    return;
  }

  // Strategy 3: Stale-While-Revalidate for other assets
  event.respondWith(staleWhileRevalidateStrategy(request, CACHE_NAMES.static));
});

// Cache-First Strategy: Check cache first, fallback to network
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Cache hit:', request.url);
      return cachedResponse;
    }
    
    console.log('[SW] Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);
    
    // Only cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-First failed:', error);
    throw error;
  }
}

// Network-First Strategy: Try network first, fallback to cache
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful GET requests
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving from cache (offline):', request.url);
      return cachedResponse;
    }
    
    throw error;
  }
}

// Stale-While-Revalidate: Return cache immediately, update in background
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Message handler for cache invalidation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INVALIDATE_CACHE') {
    console.log('[SW] Invalidating cache:', event.data.cacheName);
    
    if (event.data.cacheName) {
      caches.delete(event.data.cacheName);
    } else {
      // Invalidate all caches
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => caches.delete(cacheName));
      });
    }
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
