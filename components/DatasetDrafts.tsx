"use client";

import { useEffect, useState } from "react";
import { loadDatasetDrafts, deleteDatasetDraft } from "@/lib/storage";
import { getAudioMediaUrl, deleteAudioMedia } from "@/lib/mediaStorage";
import { DatasetEventDraft } from "@/lib/types";

type DraftWithUrl = DatasetEventDraft & {
    audioUrl?: string | null;
};

export default function DatasetDrafts() {
    const [items, setItems] = useState<DraftWithUrl[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    const loadItems = async () => {
        const drafts = loadDatasetDrafts();

        const enriched = await Promise.all(
            drafts.map(async (item) => {
                if (!item.audioMediaId) {
                    return { ...item, audioUrl: null };
                }

                const url = await getAudioMediaUrl({
                    storageType: item.audioStorageType || "local",
                    mediaId: item.audioMediaId,
                    fileName: item.audioFileName || `${item.audioMediaId}.webm`,
                    mimeType: item.audioMimeType || "audio/webm",
                    localBlobId: item.audioLocalBlobId,
                    remoteKey: item.audioRemoteKey,
                    remoteUrl: item.audioRemoteUrl
                });

                return { ...item, audioUrl: url };
            })
        );

        setItems(enriched);
        setLoading(false);
    };

    useEffect(() => {
        loadItems();

        return () => {
            items.forEach((item) => {
                if (item.audioUrl?.startsWith("blob:")) {
                    URL.revokeObjectURL(item.audioUrl);
                }
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDelete = async (item: DraftWithUrl) => {
        try {
            setBusyId(item.id);

            if (item.audioMediaId) {
                await deleteAudioMedia({
                    storageType: item.audioStorageType || "local",
                    mediaId: item.audioMediaId,
                    fileName: item.audioFileName || `${item.audioMediaId}.webm`,
                    mimeType: item.audioMimeType || "audio/webm",
                    localBlobId: item.audioLocalBlobId,
                    remoteKey: item.audioRemoteKey,
                    remoteUrl: item.audioRemoteUrl
                });
            }

            if (item.audioUrl?.startsWith("blob:")) {
                URL.revokeObjectURL(item.audioUrl);
            }

            deleteDatasetDraft(item.id);
            await loadItems();
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="card">
            <div className="sectionHeader">
                <div className="sectionHeaderText">
                    <div className="sectionLabel">
                        <span className="eyebrowDot" />
                        Dataset drafts
                    </div>
                    <h2>I momenti annotati che hai deciso di tenere.</h2>
                </div>
            </div>

            <p className="small">
                Una piccola libreria privata dei momenti che vuoi conservare con contesto e audio.
            </p>

            {loading ? (
                <div className="revealCard" style={{ marginTop: 16 }}>
                    <div className="skeletonLine" style={{ width: "38%", marginBottom: 14 }} />
                    <div className="skeletonBlock" style={{ marginBottom: 12 }} />
                    <div className="skeletonBlock" />
                </div>
            ) : items.length === 0 ? (
                    <div className="emptyState revealCard">
                        <div className="emptyIllustration" />
                        <div style={{ fontWeight: 800 }}>Ancora nessun momento annotato</div>
                        <div className="small" style={{ marginTop: 8 }}>
                            Quando salvi un evento con contesto e audio, comparirà qui.
                        </div>
                    </div>
            ) : (
                items.slice(0, 20).map((item) => (
                    <div className="datasetCard" key={item.id}>
                        <div className="listTop">
                            <div>
                                <div className="listTitle">{item.intent}</div>

                                <div className="listMeta">
                                    <span className="intentTag">{item.context}</span>
                                    <span className="intentTag">{item.outcome}</span>
                                    <span className="intentTag">{item.quality}</span>
                                    <span className="intentTag">
                                        {item.audioStorageType === "remote"
                                            ? "audio remoto"
                                            : item.audioMediaId
                                                ? "audio locale"
                                                : "solo metadati"}
                                    </span>
                                </div>

                                <div className="small" style={{ marginTop: 10 }}>
                                    {new Date(item.createdAt).toLocaleString("it-IT")}
                                </div>

                                <div className="small" style={{ marginTop: 6 }}>
                                    {item.aiTopIntent
                                        ? `AI: ${item.aiTopIntent} ${item.aiConfidence || 0}%`
                                        : "AI: manuale"}
                                </div>
                            </div>

                            <div className="confidenceBadge">
                                {item.eventType === "purr_event" ? "Fusa" : item.eventType}
                            </div>
                        </div>

                        {item.audioUrl && (
                            <div style={{ marginTop: 14 }}>
                                <audio controls src={item.audioUrl} style={{ width: "100%" }} />
                            </div>
                        )}

                        <div className="datasetActions">
                            {item.audioUrl && (
                                <a
                                    className="miniButton"
                                    href={item.audioUrl}
                                    download={item.audioFileName || `${item.id}.webm`}
                                >
                                    Scarica audio
                                </a>
                            )}

                            <button
                                className="miniButton"
                                onClick={() => handleDelete(item)}
                                disabled={busyId === item.id}
                            >
                                {busyId === item.id ? "Elimino..." : "Cancella"}
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}