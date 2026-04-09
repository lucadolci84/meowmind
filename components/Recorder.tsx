"use client";

import { useState } from "react";
import { startMicStream, recordAudio, extractAudioFeatures } from "@/lib/audio";
import { classifyMeow } from "@/lib/classifier";
import { addDiaryEntry, buildBiasFromDiary, loadProfile } from "@/lib/storage";
import { AnalysisResult, MeowIntent } from "@/lib/types";
import { getIntentUiLabel, getIntentHumanText, getIntentColor } from "@/lib/copy";
import EventAnnotationForm from "@/components/EventAnnotationForm";

export default function Recorder() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState("");
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

    const handleRecord = async () => {
        setLoading(true);
        setError("");

        try {
            const stream = await startMicStream();
            const blob = await recordAudio(stream, 4000);
            setRecordedBlob(blob);

            const features = await extractAudioFeatures(blob);

            const profile = loadProfile();
            const bias = buildBiasFromDiary();
            const mergedProfile = profile
                ? { ...profile, favoriteIntentBias: { ...profile.favoriteIntentBias, ...bias } }
                : null;

            const analysis = classifyMeow(features, mergedProfile);
            setResult(analysis);

            addDiaryEntry({
                id: crypto.randomUUID(),
                result: analysis
            });

            stream.getTracks().forEach((t) => t.stop());
        } catch (e) {
            console.error(e);
            setError("Non sono riuscito ad accedere al microfono o a processare l’audio.");
        } finally {
            setLoading(false);
        }
    };

    const sortedScores = result
        ? Object.entries(result.scores).sort((a, b) => b[1] - a[1])
        : [];

    const accent = result ? getIntentColor(result.topIntent) : "#6366f1";

    return (
        <div className="card recorderShell">
            <div className="recorderHero">
                <div className="sectionLabel">
                    <span className="eyebrowDot" />
                    Analisi manuale
                </div>

                <h2 style={{ marginBottom: 10 }}>Analizza un singolo momento con più precisione.</h2>

                <p className="small">
                    Registra un breve frammento audio per ottenere una lettura più dettagliata e un contesto tecnico essenziale.
                </p>

                <div className="recorderActions">
                    <button className="bigButton" onClick={handleRecord} disabled={loading}>
                        {loading ? "Sto registrando..." : "Registra e analizza"}
                    </button>
                </div>

                <div className="recorderStatusRow">
                    <span className="statusChip">Registrazione breve</span>
                    <span className="statusChip">Lettura dettagliata</span>
                    <span className="statusChip">Salvataggio locale</span>
                </div>

                <div className="microStatRow">
                    <span className="mutedBadge">Locale</span>
                    <span className="mutedBadge">4 sec</span>
                    <span className="mutedBadge">Audio + contesto</span>
                </div>

                {error && <div className="note">{error}</div>}
            </div>

            {result && (
                <>
                    <div
                        className="analysisHeroCard revealCard cardHoverLift"
                        style={{
                            borderColor: `${accent}26`
                        }}
                    >
                        <div className="small">Lettura principale</div>

                        <div className="liveText" style={{ color: accent }}>
                            {getIntentUiLabel(result.topIntent)}
                        </div>

                        <div className="liveConfidence" style={{ marginTop: 12 }}>
                            Confidenza stimata: {result.confidence}%
                        </div>

                        <div style={{ marginTop: 16, lineHeight: 1.65 }}>
                            {getIntentHumanText(result.topIntent)}
                        </div>
                    </div>

                    <div className="card" style={{ marginBottom: 0 }}>
                        <div className="sectionHeader">
                            <div className="sectionHeaderText">
                                <div className="sectionLabel">
                                    <span className="eyebrowDot" />
                                    Distribuzione
                                </div>
                                <h2>Come si sono distribuiti i segnali.</h2>
                            </div>
                        </div>

                        <p className="small">
                            La lettura finale mostra l’ipotesi più forte, ma qui puoi vedere anche quanto le altre classi siano risultate plausibili.
                        </p>

                        <div style={{ marginTop: 16 }}>
                            {sortedScores.map(([intent, score]) => {
                                const rowAccent =
                                    intent === result.topIntent
                                        ? accent
                                        : "linear-gradient(90deg, rgba(99,102,241,0.35), rgba(20,184,166,0.35))";

                                return (
                                    <div key={intent} style={{ marginBottom: 14 }}>
                                        <div
                                            className="resultRow"
                                            style={{
                                                borderBottom: "none",
                                                padding: "0 0 8px 0"
                                            }}
                                        >
                                            <span>{getIntentUiLabel(intent as MeowIntent)}</span>
                                            <b>{score}%</b>
                                        </div>

                                        <div className="scoreBar">
                                            <div
                                                className="scoreBarFill"
                                                style={{
                                                    width: `${score}%`,
                                                    background: rowAccent
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="sectionLabel" style={{ marginBottom: 10 }}>
                            <span className="eyebrowDot" />
                            Dettagli audio
                        </div>

                        <div className="metricsGrid" style={{ marginTop: 18 }}>
                            <div className="metricCard">
                                <div className="small">Durata</div>
                                <div className="metricValue">{result.features.durationSec.toFixed(2)} s</div>
                            </div>

                            <div className="metricCard">
                                <div className="small">Pitch stimato</div>
                                <div className="metricValue">{result.features.pitchEstimate.toFixed(0)} Hz</div>
                            </div>

                            <div className="metricCard">
                                <div className="small">Energia</div>
                                <div className="metricValue">{result.features.rms.toFixed(4)}</div>
                            </div>

                            <div className="metricCard">
                                <div className="small">Zero crossing</div>
                                <div className="metricValue">{result.features.zcr.toFixed(4)}</div>
                            </div>
                        </div>

                        <div className="metricsGrid" style={{ marginTop: 12 }}>
                            <div className="metricCard">
                                <div className="small">Low band ratio</div>
                                <div className="metricValue">{(result.features.lowBandRatio * 100).toFixed(1)}%</div>
                            </div>

                            <div className="metricCard">
                                <div className="small">Audio allegato</div>
                                <div className="metricValue" style={{ fontSize: "1rem" }}>
                                    {recordedBlob ? "Pronto" : "Assente"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <EventAnnotationForm
                        source="audio_recorder"
                        aiTopIntent={result.topIntent}
                        aiConfidence={result.confidence}
                        recordedBlob={recordedBlob}
                        recordedDurationSec={result.features.durationSec}
                        defaultEventType={result.topIntent === "fusa" ? "purr_event" : "vocal_event"}
                        defaultIntent={
                            result.topIntent === "fame"
                                ? "food_request"
                                : result.topIntent === "attenzione"
                                    ? "attention_request"
                                    : result.topIntent === "saluto"
                                        ? "greeting"
                                        : result.topIntent === "gioco"
                                            ? "play_arousal"
                                            : result.topIntent === "stress"
                                                ? "stress_discomfort"
                                                : result.topIntent === "affetto"
                                                    ? "affiliative_soft_contact"
                                                    : result.topIntent === "richiamo"
                                                        ? "recall_or_follow_me"
                                                        : result.topIntent === "fusa"
                                                            ? "purr"
                                                            : "unknown_or_mixed"
                        }
                    />
                </>
            )}
        </div>
    );
}