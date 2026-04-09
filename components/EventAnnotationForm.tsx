"use client";

import { useMemo, useState } from "react";
import { addDatasetDraft, loadProfile } from "@/lib/storage";
import { saveAudioMedia } from "@/lib/mediaStorage";
import {
    DatasetContext,
    DatasetEventDraft,
    DatasetEventType,
    DatasetIntent,
    DatasetOutcome,
    DatasetQuality
} from "@/lib/types";

type Props = {
    source: "audio_recorder" | "live_interpreter" | "reaction_recorder";
    aiTopIntent?: string;
    aiConfidence?: number;
    defaultEventType?: DatasetEventType;
    defaultContext?: DatasetContext;
    defaultIntent?: DatasetIntent;
    defaultOutcome?: DatasetOutcome;
    recordedBlob?: Blob | null;
    recordedDurationSec?: number;
};

export default function EventAnnotationForm({
    source,
    aiTopIntent,
    aiConfidence,
    defaultEventType = "vocal_event",
    defaultContext = "unknown",
    defaultIntent = "unknown_or_mixed",
    defaultOutcome = "unknown",
    recordedBlob = null,
    recordedDurationSec
}: Props) {
    const profile = useMemo(() => loadProfile(), []);
    const [eventType, setEventType] = useState<DatasetEventType>(defaultEventType);
    const [context, setContext] = useState<DatasetContext>(defaultContext);
    const [intent, setIntent] = useState<DatasetIntent>(defaultIntent);
    const [outcome, setOutcome] = useState<DatasetOutcome>(defaultOutcome);
    const [quality, setQuality] = useState<DatasetQuality>("medium");
    const [notes, setNotes] = useState("");
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    const saveDraft = async () => {
        setSaving(true);

        try {
            const draftId = crypto.randomUUID();

            let savedMedia:
                | {
                    storageType: "local" | "remote";
                    mediaId: string;
                    fileName: string;
                    mimeType: string;
                    localBlobId?: string;
                    remoteKey?: string;
                    remoteUrl?: string;
                }
                | undefined;

            if (recordedBlob) {
                savedMedia = await saveAudioMedia({
                    blob: recordedBlob,
                    fileName: `${draftId}.webm`
                });
            }

            const entry: DatasetEventDraft = {
                id: draftId,
                createdAt: new Date().toISOString(),
                catId: profile?.name
                    ? `cat_${profile.name.toLowerCase().replace(/\s+/g, "_")}`
                    : undefined,
                sessionId: `ses_${new Date().toISOString().slice(0, 19).replace(/[:T-]/g, "")}`,
                source,
                eventType,
                context,
                intent,
                outcome,
                quality,
                aiTopIntent,
                aiConfidence,
                notes: notes.trim() || undefined,
                audioStorageType: savedMedia?.storageType,
                audioMediaId: savedMedia?.mediaId,
                audioMimeType: savedMedia?.mimeType,
                audioFileName: savedMedia?.fileName,
                audioLocalBlobId: savedMedia?.localBlobId,
                audioRemoteKey: savedMedia?.remoteKey,
                audioRemoteUrl: savedMedia?.remoteUrl,
                audioDurationSec: recordedDurationSec
            };

            addDatasetDraft(entry);
            setSaved(true);
            setTimeout(() => setSaved(false), 1800);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="annotationShell">
            <div className="sectionHeader">
                <div className="sectionHeaderText">
                    <div className="sectionLabel">
                        <span className="eyebrowDot" />
                        Dataset AI
                    </div>
                    <h2>Aggiungi il contesto di questo momento.</h2>
                </div>
            </div>

            <p className="small">
                Un po’ di contesto rende la lettura molto più utile da conservare e rivedere.
            </p>

            <div className="annotationSummary">
                <span className="annotationPill">Sorgente: {source}</span>
                <span className="annotationPill">AI: {aiTopIntent || "n/d"}</span>
                <span className="annotationPill">
                    Confidenza: {typeof aiConfidence === "number" ? `${aiConfidence}%` : "n/d"}
                </span>
                <span className="annotationPill">
                    {recordedBlob ? "Audio allegato pronto" : "Nessun audio allegato"}
                </span>
            </div>

            <div className="formSection">
                <div className="formLabel">Classificazione evento</div>

                <div className="fieldGrid">
                    <div>
                        <label className="formLabel">Tipo evento</label>
                        <select value={eventType} onChange={(e) => setEventType(e.target.value as DatasetEventType)}>
                            <option value="vocal_event">Miagolio / vocalizzazione</option>
                            <option value="purr_event">Fusa</option>
                            <option value="mixed_event">Suono misto</option>
                            <option value="noise_event">Rumore / non utile</option>
                        </select>
                    </div>

                    <div>
                        <label className="formLabel">Qualità</label>
                        <select value={quality} onChange={(e) => setQuality(e.target.value as DatasetQuality)}>
                            <option value="high">Qualità alta</option>
                            <option value="medium">Qualità media</option>
                            <option value="low">Qualità bassa</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="formSection">
                <div className="formLabel">Contesto e interpretazione</div>

                <div className="fieldGrid">
                    <div>
                        <label className="formLabel">Contesto</label>
                        <select value={context} onChange={(e) => setContext(e.target.value as DatasetContext)}>
                            <option value="unknown">Contesto non chiaro</option>
                            <option value="near_bowl">Vicino alla ciotola</option>
                            <option value="near_owner">Vicino a te</option>
                            <option value="near_door">Vicino alla porta</option>
                            <option value="play">Gioco</option>
                            <option value="rest">Relax / riposo</option>
                            <option value="carrier">Trasportino / situazione scomoda</option>
                        </select>
                    </div>

                    <div>
                        <label className="formLabel">Intento reale</label>
                        <select value={intent} onChange={(e) => setIntent(e.target.value as DatasetIntent)}>
                            <option value="unknown_or_mixed">Non chiaro / misto</option>
                            <option value="food_request">Richiesta cibo</option>
                            <option value="attention_request">Richiesta attenzione</option>
                            <option value="greeting">Saluto</option>
                            <option value="play_arousal">Gioco / attivazione</option>
                            <option value="stress_discomfort">Stress / fastidio</option>
                            <option value="affiliative_soft_contact">Contatto amichevole</option>
                            <option value="recall_or_follow_me">Richiamo / seguimi</option>
                            <option value="purr">Fusa</option>
                        </select>
                    </div>
                </div>

                <div style={{ marginTop: 12 }}>
                    <label className="formLabel">Esito osservato</label>
                    <select value={outcome} onChange={(e) => setOutcome(e.target.value as DatasetOutcome)}>
                        <option value="unknown">Esito non chiaro</option>
                        <option value="food_served">Hai dato cibo</option>
                        <option value="cat_moved_to_bowl">Si è mosso verso la ciotola</option>
                        <option value="cat_approached_owner">Si è avvicinato a te</option>
                        <option value="cat_moved_away">Si è allontanato</option>
                        <option value="cat_relaxed">Si è calmato</option>
                        <option value="cat_kept_vocalizing">Ha continuato a vocalizzare</option>
                    </select>
                </div>
            </div>

            <div className="formSection">
                <label className="formLabel">Note opzionali</label>
                <textarea
                    className="textarea"
                    placeholder="Per esempio: stava vicino a me, stava impastando, audio preso da speaker esterno, stanza silenziosa..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>

            <div className="inlineActions">
                <button className="bigButton" onClick={saveDraft} disabled={saving}>
                    {saving ? "Salvataggio..." : saved ? "Evento salvato" : "Salva come evento AI"}
                </button>
            </div>

            <div className="note">
                Anche poche informazioni ben scelte bastano a rendere questo momento più utile nel tempo.
            </div>
        </div>
    );
}