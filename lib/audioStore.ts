const DB_NAME = "meowmind-local-media";
const DB_VERSION = 1;
const STORE_NAME = "audio_blobs";

export type AudioBlobRecord = {
    id: string;
    blob: Blob;
    createdAt: string;
    mimeType: string;
    fileName: string;
};

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function saveAudioBlob(params: {
    id: string;
    blob: Blob;
    mimeType?: string;
    fileName?: string;
}) {
    const db = await openDb();

    const record: AudioBlobRecord = {
        id: params.id,
        blob: params.blob,
        createdAt: new Date().toISOString(),
        mimeType: params.mimeType || params.blob.type || "audio/webm",
        fileName: params.fileName || `${params.id}.webm`
    };

    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put(record);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function getAudioBlob(id: string): Promise<AudioBlobRecord | null> {
    const db = await openDb();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result || null);
        };
        request.onerror = () => reject(request.error);
    });
}

export async function deleteAudioBlob(id: string) {
    const db = await openDb();

    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function listAudioBlobs(): Promise<AudioBlobRecord[]> {
    const db = await openDb();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}