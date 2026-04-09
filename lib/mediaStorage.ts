import { saveAudioBlob, getAudioBlob, deleteAudioBlob } from "./audioStore";

export type SavedMediaRef = {
    storageType: "local" | "remote";
    mediaId: string;
    fileName: string;
    mimeType: string;
    localBlobId?: string;
    remoteKey?: string;
    remoteUrl?: string;
};

type SaveAudioParams = {
    blob: Blob;
    fileName?: string;
};

type MediaStorageAdapter = {
    saveAudio(params: SaveAudioParams): Promise<SavedMediaRef>;
    getAudioUrl(ref: SavedMediaRef): Promise<string | null>;
    deleteAudio(ref: SavedMediaRef): Promise<void>;
};

const localAdapter: MediaStorageAdapter = {
    async saveAudio({ blob, fileName }) {
        const mediaId = crypto.randomUUID();
        const mimeType = blob.type || "audio/webm";
        const finalFileName = fileName || `${mediaId}.webm`;
        const localBlobId = `audio_${mediaId}`;

        await saveAudioBlob({
            id: localBlobId,
            blob,
            mimeType,
            fileName: finalFileName
        });

        return {
            storageType: "local",
            mediaId,
            fileName: finalFileName,
            mimeType,
            localBlobId
        };
    },

    async getAudioUrl(ref) {
        if (!ref.localBlobId) return null;
        const record = await getAudioBlob(ref.localBlobId);
        if (!record) return null;
        return URL.createObjectURL(record.blob);
    },

    async deleteAudio(ref) {
        if (!ref.localBlobId) return;
        await deleteAudioBlob(ref.localBlobId);
    }
};

const remoteAdapter: MediaStorageAdapter = {
    async saveAudio({ blob, fileName }) {
        throw new Error("Remote adapter non ancora implementato");
    },

    async getAudioUrl(ref) {
        return ref.remoteUrl || null;
    },

    async deleteAudio(ref) {
        return;
    }
};

function getPreferredStorage(): "local" | "remote" {
    if (typeof window === "undefined") return "local";

    const configured = window.localStorage.getItem("meowmind_media_storage_mode");
    if (configured === "remote") return "remote";
    return "local";
}

function getAdapter(): MediaStorageAdapter {
    const mode = getPreferredStorage();
    return mode === "remote" ? remoteAdapter : localAdapter;
}

export async function saveAudioMedia(params: SaveAudioParams): Promise<SavedMediaRef> {
    return getAdapter().saveAudio(params);
}

export async function getAudioMediaUrl(ref: SavedMediaRef): Promise<string | null> {
    return getAdapter().getAudioUrl(ref);
}

export async function deleteAudioMedia(ref: SavedMediaRef): Promise<void> {
    return getAdapter().deleteAudio(ref);
}