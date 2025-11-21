/**
 * Service Worker Registration
 * Registers the service worker for PWA functionality and caching
 */

export const registerServiceWorker = async (): Promise<void> => {
  // Only register in production and if service workers are supported
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[SW] Service Worker registered successfully:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, notify user
              console.log('[SW] New version available! Refresh to update.');
              
              // Optionally, you can show a toast notification here
              // showUpdateNotification();
            }
          });
        }
      });

      // Check for updates periodically (every hour)
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
    }
  } else if (!import.meta.env.PROD) {
    console.log('[SW] Service Worker not registered (development mode)');
  }
};

/**
 * Unregister service worker (useful for debugging)
 */
export const unregisterServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      await registration.unregister();
      console.log('[SW] Service Worker unregistered');
    }
  }
};

/**
 * Send message to service worker to invalidate cache
 */
export const invalidateCache = (cacheName?: string): void => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'INVALIDATE_CACHE',
      cacheName
    });
    console.log('[SW] Cache invalidation requested:', cacheName || 'all');
  }
};

/**
 * Force service worker to skip waiting and activate immediately
 */
export const skipWaiting = (): void => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SKIP_WAITING'
    });
  }
};
