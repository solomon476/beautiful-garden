// IndexedDB Media Storage for Garden Photos, Voice Notes, and Book PDFs
const DB_NAME = 'perfect_time_garden_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_files';

export interface StoredMediaItem {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  createdAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const mediaStorage = {
  /**
   * Reads a File or Blob into a base64 Data URL
   */
  readFileAsDataUrl(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  },

  /**
   * Stores a file or blob in IndexedDB and returns stored media metadata + data URL
   */
  async saveFile(fileOrBlob: File | Blob, customName?: string): Promise<StoredMediaItem> {
    const dataUrl = await this.readFileAsDataUrl(fileOrBlob);
    const id = `media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const name = customName || (fileOrBlob as File).name || `Garden-File-${Date.now()}`;
    const type = fileOrBlob.type || 'application/octet-stream';
    const size = fileOrBlob.size || dataUrl.length;

    const item: StoredMediaItem = {
      id,
      name,
      type,
      size,
      dataUrl,
      createdAt: new Date().toISOString(),
    };

    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Could not save to IndexedDB, fallback to memory/dataUrl', err);
    }

    return item;
  },

  /**
   * Retrieves a stored file by ID from IndexedDB
   */
  async getFile(id: string): Promise<StoredMediaItem | null> {
    try {
      const db = await openDB();
      return new Promise<StoredMediaItem | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  },

  /**
   * Deletes a stored file from IndexedDB
   */
  async deleteFile(id: string): Promise<void> {
    try {
      const db = await openDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // ignore
    }
  },

  /**
   * Human readable file size formatter
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  },
};

