/**
 * Register Background Sync capabilities with the service worker.
 * - Background Sync: retries failed offline actions when connectivity returns
 * - Periodic Background Sync: refreshes article cache in the background
 */

import { logger } from "./logger";

interface SyncQueueItem {
  url: string;
  options: RequestInit;
  timestamp: number;
  retries: number;
  id?: number;
}

const SYNC_MAX_RETRIES = 3;
const SYNC_QUEUE_KEY = 'nawbahar-sync-queue';

/** Queue a failed request for background sync retry */
export async function queueOfflineAction(
  url: string,
  options: RequestInit,
  onQueueSuccess?: () => void,
  onQueueFail?: (err: Error) => void
) {
  try {
    const item: SyncQueueItem = {
      url,
      options,
      timestamp: Date.now(),
      retries: 0,
    };

    const items = await getQueuedItems();
    items.push(item);

    const db = await openDatabase();
    const tx = db.transaction('syncQueue', 'readwrite');
    await tx.objectStore('syncQueue').put(item);

    // Request sync from Service Worker
    const reg = await navigator.serviceWorker.ready;
    if ('sync' in reg) {
      await (reg as any).sync.register('nawbahar-offline-actions');
    }

    onQueueSuccess?.();
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    onQueueFail?.(error);

    // Fallback: Store in localStorage
    try {
      const items = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
      items.push({ url, options, timestamp: Date.now() });
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(items));
    } catch {}
  }
}

/** Get all queued items from IndexedDB */
async function getQueuedItems(): Promise<SyncQueueItem[]> {
  try {
    const db = await openDatabase();
    const tx = db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch {
    // Fallback to localStorage
    try {
      return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    } catch {
      return [];
    }
  }
}

/** IndexedDB helper for better storage than Cache API */
export async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('nawbahar-sync', 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
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
        logger.info('PeriodicSync registered: nawbahar-sync-articles (1h interval)');
      }
    }
  } catch (err) {
    // Periodic Background Sync not supported or permission denied – graceful fallback
    logger.info('PeriodicSync not available:', err);
  }
}
