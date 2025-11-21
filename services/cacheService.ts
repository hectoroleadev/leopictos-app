/**
 * IndexedDB Cache Service for Pictogram Data
 * Provides client-side caching with TTL for API responses
 */

import { Pictogram } from '../types';

const DB_NAME = 'PictogramCache';
const DB_VERSION = 1;
const STORE_NAME = 'pictograms';
const LIST_CACHE_KEY = '__list__';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Initialize IndexedDB
 */
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        console.log('[Cache] IndexedDB store created');
      }
    };
  });
};

/**
 * Get data from cache
 */
const getFromCache = async <T>(key: string): Promise<T | null> => {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T> | undefined;
        
        if (!entry) {
          resolve(null);
          return;
        }
        
        // Check if cache is expired
        if (Date.now() > entry.expiresAt) {
          console.log('[Cache] Cache expired for:', key);
          // Delete expired entry
          deleteFromCache(key);
          resolve(null);
          return;
        }
        
        console.log('[Cache] Cache hit for:', key);
        resolve(entry.data);
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Cache] Error reading from cache:', error);
    return null;
  }
};

/**
 * Save data to cache
 */
const saveToCache = async <T>(key: string, data: T, ttl: number = CACHE_TTL): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    };
    
    // Add 'id' property for keyPath
    const cacheItem = { id: key, ...entry };
    
    return new Promise((resolve, reject) => {
      const request = store.put(cacheItem);
      
      request.onsuccess = () => {
        console.log('[Cache] Saved to cache:', key);
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Cache] Error saving to cache:', error);
  }
};

/**
 * Delete data from cache
 */
const deleteFromCache = async (key: string): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      
      request.onsuccess = () => {
        console.log('[Cache] Deleted from cache:', key);
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Cache] Error deleting from cache:', error);
  }
};

/**
 * Clear all cache
 */
export const clearCache = async (): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      
      request.onsuccess = () => {
        console.log('[Cache] All cache cleared');
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error);
  }
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Get cached pictogram list
 */
export const getCachedPictogramList = async (): Promise<Pictogram[] | null> => {
  return getFromCache<Pictogram[]>(LIST_CACHE_KEY);
};

/**
 * Cache pictogram list
 */
export const cachePictogramList = async (pictograms: Pictogram[]): Promise<void> => {
  await saveToCache(LIST_CACHE_KEY, pictograms);
};

/**
 * Get cached individual pictogram
 */
export const getCachedPictogram = async (id: string): Promise<Pictogram | null> => {
  return getFromCache<Pictogram>(id);
};

/**
 * Cache individual pictogram
 */
export const cachePictogram = async (pictogram: Pictogram): Promise<void> => {
  await saveToCache(pictogram.id, pictogram);
};

/**
 * Invalidate pictogram list cache (call after create/delete)
 */
export const invalidatePictogramListCache = async (): Promise<void> => {
  await deleteFromCache(LIST_CACHE_KEY);
};

/**
 * Invalidate specific pictogram cache (call after update)
 */
export const invalidatePictogramCache = async (id: string): Promise<void> => {
  await deleteFromCache(id);
  // Also invalidate list since it contains this pictogram
  await invalidatePictogramListCache();
};
