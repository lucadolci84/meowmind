"use client";

import { useState } from "react";
import { extractAudioFeatures, recordAudio, startMicStream } from "@/lib/audio";
import { classifyMeow } from "@/lib/classifier";
import { addDiaryEntry, buildBiasFromDiary, loadProfile } from "@/lib/storage";
import { AnalysisResult } from "@/lib/types";

function getIntentLabel(intent: string) {
    const map: Record<string, string> = {
        fame: "🍗 Fame",
        attenzione: "🧠 Attenzione",
        gioco: "🎾 Gioco",
        saluto: "👋 Saluto",
        stress: "😾 Stress",
        affetto: "❤️ Affetto",
        richiamo: "📍 Richiamo"
    };

    return map[intent] || intent;
}

function getIntentDescription(intent: string) {
    const map: Record<string, string> = {
        fame: "Il gatto potrebbe stare chiedendo cibo o anticipando la routine della ciotola.",
        attenzione: "Potrebbe voler interazione, presenza o risposta da parte tua.",
        gioco: "Sembra un segnale più vicino a stimolazione o voglia di giocare.",
        saluto: "Potrebbe essere una vocalizzazione breve di contatto o saluto.",
        stress: "L’audio sembra più teso, intenso o scomodo del normale.",
        affetto: "Il tono sembra più morbido, vicino a una comunicazione tranquilla.",
        richiamo: "Sembra un tentativo di farsi seguire o notare con più decisione."
    };

    return map[intent] || "";
}

export default function Recorder() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState("");

    const handleRecord = async () => {
        setLoading(true);
        setError("");

        try {
            const stream = await startMicStream();
            const blob = await recordAudio(stream, 4000);
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

    return (
        <div className="card">
            <h2>🎙 Analisi Miagolio</h2>
            <p className="small">
                Registra 4 secondi di audio e stima l’intenzione probabile del gatto.
            </p>

            <button className="bigButton" onClick={handleRecord} disabled={loading}>
                {loading ? "Sto ascoltando..." : "Registra e analizza"}
            </button>

            {error && <div className="note">{error}</div>}

            {result && (
                <>
                    <div
                        style={{
                            marginTop: 16,
                            padding: 18,
                            borderRadius: 18,
                            background: "#0d142b",
                            border: "1px solid rgba(255,255,255,0.08)"
                        }}
                    >
                        <div className="small">Interpretazione principale</div>
                        <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
                            {getIntentLabel(result.topIntent)}
                        </div>
                        <div style={{ marginTop: 6, opacity: 0.9 }}>
                            Probabilità stimata: <b>{result.confidence}%</b>
                        </div>
                        <div style={{ marginTop: 10, opacity: 0.82 }}>
                            {getIntentDescription(result.topIntent)}
                        </div>
                    </div>

                    <div style={{ marginTop: 18 }}>
                        <div style={{ fontWeight: 700, marginBottom: 10 }}>Distribuzione risultati</div>

                        {sortedScores.map(([intent, score]) => (
                            <div key={intent} style={{ marginBottom: 12 }}>
                                <div className="resultRow" style={{ borderBottom: "none", padding: "0 0 6px 0" }}>
                                    <span>{getIntentLabel(intent)}</span>
                                    <b>{score}%</b>
                                </div>

                                <div
                                    style={{
                                        width: "100%",
                                        height: 10,
                                        background: "#1b2347",
                                        borderRadius: 999,
                                        overflow: "hidden"
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${score}%`,
                                            height: "100%",
                                            background: "#6e7cff",
                                            borderRadius: 999
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid two" style={{ marginTop: 18 }}>
                        <div className="stat">
                            <div className="small">Durata</div>
                            <div>{result.features.durationSec.toFixed(2)} s</div>
                        </div>
                        <div className="stat">
                            <div className="small">Pitch stimato</div>
                            <div>{result.features.pitchEstimate.toFixed(0)} Hz</div>
                        </div>
                        <div className="stat">
                            <div className="small">Energia</div>
                            <div>{result.features.rms.toFixed(4)}</div>
                        </div>
                        <div className="stat">
                            <div className="small">Zero crossing</div>
                            <div>{result.features.zcr.toFixed(4)}</div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}