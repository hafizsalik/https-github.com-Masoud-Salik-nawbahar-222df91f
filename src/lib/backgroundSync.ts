/**
 * Register Background Sync capabilities with the service worker.
 * - Background Sync: retries failed offline actions when connectivity returns
 * - Periodic Background Sync: refreshes article cache in the background
 */

const SYNC_QUEUE_KEY = 'nawbahar-sync-queue';

/** Queue a failed request for background sync retry */
export async function queueOfflineAction(url: string, options: RequestInit) {
  try {
    const cache = await caches.open(SYNC_QUEUE_KEY);
    const headers = new Headers(options.headers);
    const response = new Response(options.body as string, { headers });
    await cache.put(new Request(url, { method: options.method || 'POST' }), response);

    // Request a sync
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      await (registration as any).sync.register('nawbahar-offline-actions');
    }
  } catch (err) {
    console.warn('[BackgroundSync] Failed to queue action:', err);
  }
}

/** Register periodic background sync for article updates */
export async function registerPeriodicSync() {
  try {
    const registration = await navigator.serviceWorker.ready;

    if ('periodicSync' in registration) {
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as any,
      });

      if (status.state === 'granted') {
        await (registration as any).periodicSync.register('nawbahar-sync-articles', {
          minInterval: 60 * 60 * 1000, // 1 hour
        });
        console.info('[PeriodicSync] Registered: nawbahar-sync-articles (1h interval)');
      }
    }
  } catch (err) {
    // Periodic Background Sync not supported or permission denied – graceful fallback
    console.info('[PeriodicSync] Not available:', err);
  }
}
