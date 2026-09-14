const DB_NAME = "spin-media";
const STORE = "items";

export type MediaItem = {
  id: string;
  name: string;
  mime: string;
  blob: Blob;
  createdAt: number;
};

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>) {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = work(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
      }),
  );
}

export function listMedia() {
  return run("readonly", (store) => store.getAll()).then((rows) =>
    (rows as MediaItem[]).sort((a, b) => b.createdAt - a.createdAt),
  );
}

export function saveMedia(item: MediaItem) {
  return run("readwrite", (store) => store.put(item));
}

export function deleteMedia(id: string) {
  return run("readwrite", (store) => store.delete(id));
}
