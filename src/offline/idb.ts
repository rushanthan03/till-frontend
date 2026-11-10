// A tiny IndexedDB wrapper: just enough for the offline catalogue and the sale outbox, no dependencies.
// IndexedDB survives restarts and holds far more than localStorage, which matters for thousands of products.

const DB_NAME = 'auvren-till';
const DB_VERSION = 1;
export type StoreName = 'products' | 'meta' | 'outbox';

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains('products')) {
                    const s = db.createObjectStore('products', { keyPath: 'key' }); // key = storeId:productId
                    s.createIndex('storeId', 'storeId');
                }
                if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
                if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'clientRef' });
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => { dbPromise = null; reject(req.error); };
        });
    }
    return dbPromise;
}

const done = <T,>(req: IDBRequest<T>) => new Promise<T>((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
const finished = (tx: IDBTransaction) => new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); });

export const idb = {
    async get<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> {
        return done((await open()).transaction(store).objectStore(store).get(key));
    },
    async getAll<T>(store: StoreName): Promise<T[]> {
        return done((await open()).transaction(store).objectStore(store).getAll());
    },
    async getAllByIndex<T>(store: StoreName, index: string, key: IDBValidKey): Promise<T[]> {
        return done((await open()).transaction(store).objectStore(store).index(index).getAll(key));
    },
    async put(store: StoreName, value: unknown, key?: IDBValidKey): Promise<void> {
        const tx = (await open()).transaction(store, 'readwrite');
        tx.objectStore(store).put(value, key);
        await finished(tx);
    },
    async putMany(store: StoreName, values: unknown[]): Promise<void> {
        const tx = (await open()).transaction(store, 'readwrite');
        values.forEach(v => tx.objectStore(store).put(v));
        await finished(tx);
    },
    async delete(store: StoreName, key: IDBValidKey): Promise<void> {
        const tx = (await open()).transaction(store, 'readwrite');
        tx.objectStore(store).delete(key);
        await finished(tx);
    },
    /** Replaces every product of a store in one transaction, so a half-finished sync never leaves a mixed catalogue. */
    async replaceProducts(storeId: string, products: { key: string; storeId: string }[]): Promise<void> {
        const tx = (await open()).transaction('products', 'readwrite');
        const os = tx.objectStore('products');
        const old = await done(os.index('storeId').getAllKeys(storeId));
        old.forEach(k => os.delete(k));
        products.forEach(p => os.put(p));
        await finished(tx);
    },
};
