import { ReactionClip } from "./types";

const DB_NAME = "meowmind-db";
const DB_VERSION = 1;
const CLIPS_STORE = "reaction-clips";

type StoredReactionClip = ReactionClip & {
    blob: Blob;
};

export function isIndexedDbAvailable(): boolean {
    return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (!isIndexedDbAvailable()) {
            reject(new Error("IndexedDB non supportato in questo browser."));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(CLIPS_STORE)) {
                const store = db.createObjectStore(CLIPS_STORE, { keyPath: "id" });
                store.createIndex("createdAt", "createdAt", { unique: false });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("Errore apertura database"));
    });
}

export async function saveReactionClipToDb(
    clip: ReactionClip,
    blob: Blob
): Promise<void> {
    const db = await openDb();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(CLIPS_STORE, "readwrite");
        const store = tx.objectStore(CLIPS_STORE);

        const payload: StoredReactionClip = {
            ...clip,
            blob
        };

        store.put(payload);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error("Errore salvataggio clip"));
    });
}

export async function getAllReactionClipsFromDb(): Promise<StoredReactionClip[]> {
    const db = await openDb();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(CLIPS_STORE, "readonly");
        const store = tx.objectStore(CLIPS_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
            const items = (request.result || []) as StoredReactionClip[];
            items.sort((a, b) => {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            resolve(items);
        };

        request.onerror = () => reject(request.error || new Error("Errore lettura clip"));
    });
}

export async function getReactionClipBlobFromDb(id: string): Promise<Blob | null> {
    const db = await openDb();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(CLIPS_STORE, "readonly");
        const store = tx.objectStore(CLIPS_STORE);
        const request = store.get(id);

        request.onsuccess = () => {
            const item = request.result as StoredReactionClip | undefined;
            resolve(item?.blob || null);
        };

        request.onerror = () => reject(request.error || new Error("Errore lettura blob"));
    });
}

export async function deleteReactionClipFromDb(id: string): Promise<void> {
    const db = await openDb();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(CLIPS_STORE, "readwrite");
        const store = tx.objectStore(CLIPS_STORE);
        store.delete(id);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error("Errore eliminazione clip"));
    });
}