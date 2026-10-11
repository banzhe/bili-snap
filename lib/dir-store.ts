import type { DirHandleLike } from './fsa';

const DB_NAME = 'bili-snap-spike'; // 沿用 spike 的库名，已授权的目录句柄不丢
const DB_VERSION = 1;
const STORE_NAME = 'handles';
const SAVE_DIR_KEY = 'saveDir';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const request = run(tx.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function saveDirHandle(handle: DirHandleLike): Promise<void> {
  await withStore('readwrite', (store) => store.put(handle, SAVE_DIR_KEY));
}

export async function loadDirHandle(): Promise<DirHandleLike | null> {
  const handle = await withStore<DirHandleLike | undefined>('readonly', (store) =>
    store.get(SAVE_DIR_KEY) as IDBRequest<DirHandleLike | undefined>,
  );
  return handle ?? null;
}

export async function clearDirHandle(): Promise<void> {
  await withStore('readwrite', (store) => store.delete(SAVE_DIR_KEY));
}
