"use client";

import { useEffect, useMemo, useState } from "react";
import {
    deleteReactionClipFromDb,
    getAllReactionClipsFromDb,
    getReactionClipBlobFromDb,
    isIndexedDbAvailable
} from "@/lib/db";
import { ReactionClip, ReactionMode } from "@/lib/types";
import { getModeTitle } from "@/lib/copy";
import { onReactionClipSaved } from "@/lib/events";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

type GalleryItem = ReactionClip & {
    objectUrl: string;
};

type SortMode = "newest" | "oldest";

export default function ReactionGallery() {
    const [clips, setClips] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterMode, setFilterMode] = useState<ReactionMode | "all">("all");
    const [sortMode, setSortMode] = useState<SortMode>("newest");
    const [dbSupported, setDbSupported] = useState(true);

    const { toast, showToast, hideToast } = useToast();

    const loadGallery = async () => {
        setLoading(true);

        try {
            const supported = isIndexedDbAvailable();
            setDbSupported(supported);

            if (!supported) {
                setClips([]);
                return;
            }

            const stored = await getAllReactionClipsFromDb();

            const items = stored.map((item) => ({
                id: item.id,
                createdAt: item.createdAt,
                mode: item.mode,
                intent: item.intent,
                confidence: item.confidence,
                caption: item.caption,
                mimeType: item.mimeType,
                objectUrl: URL.createObjectURL(item.blob)
            }));

            setClips((prev) => {
                prev.forEach((p) => URL.revokeObjectURL(p.objectUrl));
                return items;
            });
        } catch (error) {
            console.error(error);
            showToast("Non sono riuscito a caricare la gallery.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGallery();

        const unsubscribe = onReactionClipSaved(() => {
            loadGallery();
        });

        return () => {
            unsubscribe();
            clips.forEach((clip) => URL.revokeObjectURL(clip.objectUrl));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredClips = useMemo(() => {
        let next = [...clips];

        if (filterMode !== "all") {
            next = next.filter((clip) => clip.mode === filterMode);
        }

        next.sort((a, b) => {
            const aTime = new Date(a.createdAt).getTime();
            const bTime = new Date(b.createdAt).getTime();
            return sortMode === "newest" ? bTime - aTime : aTime - bTime;
        });

        return next;
    }, [clips, filterMode, sortMode]);

    const handleDelete = async (id: string) => {
        try {
            await deleteReactionClipFromDb(id);
            await loadGallery();
            showToast("Clip eliminata.", "success");
        } catch (error) {
            console.error(error);
            showToast("Non sono riuscito a eliminare la clip.", "error");
        }
    };

    const handleDownload = async (clip: GalleryItem) => {
        try {
            const blob = await getReactionClipBlobFromDb(clip.id);
            if (!blob) {
                showToast("File video non trovato.", "error");
                return;
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `meowmind-reaction-${clip.id}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            showToast("Download avviato.", "success");
        } catch (error) {
            console.error(error);
            showToast("Non sono riuscito a scaricare la clip.", "error");
        }
    };

    const handleCopy = async (caption: string) => {
        try {
            await navigator.clipboard.writeText(caption);
            showToast("Caption copiata.", "success");
        } catch (error) {
            console.error(error);
            showToast("Impossibile copiare la caption.", "error");
        }
    };

    const handleShare = async (clip: GalleryItem) => {
        try {
            const blob = await getReactionClipBlobFromDb(clip.id);
            if (!blob) {
                showToast("File video non trovato.", "error");
                return;
            }

            const file = new File([blob], `meowmind-reaction-${clip.id}.webm`, {
                type: clip.mimeType || "video/webm"
            });

            const nav = navigator as Navigator & {
                canShare?: (data?: ShareData) => boolean;
                share?: (data?: ShareData) => Promise<void>;
            };

            if (nav.share && nav.canShare?.({ files: [file] })) {
                await nav.share({
                    title: "MeowMind Reaction",
                    text: clip.caption,
                    files: [file]
                });
                showToast("Condivisione completata.", "success");
                return;
            }

            await navigator.clipboard.writeText(clip.caption);
            showToast("Condivisione file non supportata. Caption copiata.", "info");
        } catch (error) {
            console.error(error);
            showToast("Condivisione non riuscita.", "error");
        }
    };

    return (
        <>
            <div className="card">
                <div className="galleryHeader">
                    <div>
                        <h2 style={{ marginBottom: 6 }}>🗂 Gallery reaction</h2>
                        <p className="small">Clip persistenti in IndexedDB, filtrabili e condivisibili.</p>
                    </div>

                    <button className="secondaryButton" style={{ marginTop: 0 }} onClick={loadGallery}>
                        Aggiorna gallery
                    </button>
                </div>

                {!dbSupported && (
                    <div className="note" style={{ marginTop: 16 }}>
                        IndexedDB non è disponibile in questo browser. La gallery persistente non funzionerà correttamente.
                    </div>
                )}

                <div className="grid two" style={{ marginTop: 14 }}>
                    <div className="card" style={{ marginBottom: 0 }}>
                        <div className="small">Filtro modalità</div>
                        <select
                            value={filterMode}
                            onChange={(e) => setFilterMode(e.target.value as ReactionMode | "all")}
                        >
                            <option value="all">Tutte</option>
                            <option value="cute">Cute</option>
                            <option value="meme">Meme</option>
                            <option value="scientific">Scientific</option>
                        </select>
                    </div>

                    <div className="card" style={{ marginBottom: 0 }}>
                        <div className="small">Ordina per</div>
                        <select
                            value={sortMode}
                            onChange={(e) => setSortMode(e.target.value as SortMode)}
                        >
                            <option value="newest">Più recenti</option>
                            <option value="oldest">Più vecchie</option>
                        </select>
                    </div>
                </div>

                {loading && <div className="note" style={{ marginTop: 16 }}>Sto caricando la gallery...</div>}

                {!loading && filteredClips.length === 0 && (
                    <div className="emptyState">
                        <div style={{ fontSize: 42 }}>📹</div>
                        <div style={{ fontWeight: 800, marginTop: 8 }}>Nessuna clip trovata</div>
                        <div className="small" style={{ marginTop: 8 }}>
                            Registra una reaction dal tab “Reaction Recorder” e tornerà qui automaticamente.
                        </div>
                    </div>
                )}

                <div className="grid two" style={{ marginTop: 16 }}>
                    {filteredClips.map((clip) => (
                        <div key={clip.id} className="card" style={{ marginBottom: 0 }}>
                            <div className="small">{getModeTitle(clip.mode)}</div>

                            <video
                                src={clip.objectUrl}
                                controls
                                playsInline
                                preload="metadata"
                                style={{
                                    width: "100%",
                                    marginTop: 10,
                                    borderRadius: 16,
                                    background: "#000",
                                    aspectRatio: "9 / 16",
                                    objectFit: "cover"
                                }}
                            />

                            <div style={{ marginTop: 10, fontWeight: 700, whiteSpace: "pre-line" }}>
                                {clip.caption}
                            </div>

                            <div className="small" style={{ marginTop: 8 }}>
                                {new Date(clip.createdAt).toLocaleString("it-IT")}
                            </div>

                            <div className="grid two" style={{ marginTop: 12 }}>
                                <button className="secondaryButton" onClick={() => handleCopy(clip.caption)}>
                                    Copia caption
                                </button>
                                <button className="bigButton" onClick={() => handleDownload(clip)} style={{ marginTop: 0 }}>
                                    Scarica
                                </button>
                            </div>

                            <div className="grid two" style={{ marginTop: 10 }}>
                                <button className="secondaryButton" onClick={() => handleShare(clip)}>
                                    Condividi
                                </button>
                                <button className="secondaryButton" onClick={() => handleDelete(clip.id)}>
                                    Elimina
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {toast.visible && (
                <Toast message={toast.message} type={toast.type} onClose={hideToast} />
            )}
        </>
    );
}