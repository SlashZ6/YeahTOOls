import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'YeahToolsDB';
const DB_VERSION = 1;

export const STORES = {
  SETTINGS: 'settings', // For App Preferences
  USER_DATA: 'user_data', // For Pinned tools, Usage stats, Recents
  TOOL_STATE: 'tool_state' // For specific tool persistence (e.g. pinned fonts)
};

let dbPromise: Promise<IDBPDatabase<unknown>> | null = null;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS);
        }
        if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
          db.createObjectStore(STORES.USER_DATA);
        }
        if (!db.objectStoreNames.contains(STORES.TOOL_STATE)) {
          db.createObjectStore(STORES.TOOL_STATE);
        }
      },
    });
  }
  return dbPromise;
};

export const db = {
  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    const database = await initDB();
    return database.get(storeName, key);
  },

  async set(storeName: string, key: string, value: any): Promise<void> {
    const database = await initDB();
    await database.put(storeName, value, key);
  },

  async delete(storeName: string, key: string): Promise<void> {
    const database = await initDB();
    await database.delete(storeName, key);
  },

  async clearAll(): Promise<void> {
    const database = await initDB();
    const tx = database.transaction([STORES.SETTINGS, STORES.USER_DATA, STORES.TOOL_STATE], 'readwrite');
    await Promise.all([
      tx.objectStore(STORES.SETTINGS).clear(),
      tx.objectStore(STORES.USER_DATA).clear(),
      tx.objectStore(STORES.TOOL_STATE).clear(),
      tx.done
    ]);
  }
};
