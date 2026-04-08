"use client";

import { useEffect, useRef, useState } from "react";
import { classifyMeow } from "@/lib/classifier";
import { buildBiasFromDiary, loadProfile, addLiveSnapshot } from "@/lib/storage";
import { extractAudioFeatures } from "@/lib/audio";
import { MeowIntent } from "@/lib/types";
import {
    getIntentColor,
    getIntentHumanText,
    getIntentSocialText,
    getIntentUiLabel
} from "@/lib/copy";

type LiveState =
    | "idle"
    | "listening"
    | "detecting"
    | "interpreting"
    | "unclear";

type StablePrediction = {
    intent: MeowIntent;
    label: string;
    confidence: number;
    humanText: string;
    socialText: string;
};

export default function LiveInterpreter() {
    const [running, setRunning] = useState(false);
    const [liveState, setLiveState] = useState<LiveState>("idle");
    const [volume, setVolume] = useState(0);
    const [prediction, setPrediction] = useState<StablePrediction | null>(null);
    const [lastDetections, setLastDetections] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);

    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationRef = useRef<number | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const detectingRef = useRef(false);
    const silenceTimerRef = useRef<number | null>(null);

    const recentPredictionsRef = useRef<MeowIntent[]>([]);
    const lastStableIntentRef = useRef<MeowIntent | null>(null);

    const VOLUME_THRESHOLD = 18;
    const SILENCE_HOLD_MS = 700;
    const MAX_REC_MS = 1800;
    const MIN_CONFIDENCE_TO_SHOW = 32;

    const cleanup = () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }

        sourceRef.current?.disconnect();
        analyserRef.current?.disconnect();

        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
            audioContextRef.current.close();
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
        }

        streamRef.current = null;
        audioContextRef.current = null;
        analyserRef.current = null;
        sourceRef.current = null;
        mediaRecorderRef.current = null;
        chunksRef.current = [];
        detectingRef.current = false;
        recentPredictionsRef.current = [];
        lastStableIntentRef.current = null;
    };

    const buildStablePrediction = (
        intent: MeowIntent,
        confidence: number
    ): StablePrediction => {
        return {
            intent,
            label: getIntentUiLabel(intent),
            confidence,
            humanText: getIntentHumanText(intent),
            socialText: getIntentSocialText(intent)
        };
    };

    const stabilizePrediction = (intent: MeowIntent, confidence: number) => {
        const arr = recentPredictionsRef.current;
        arr.push(intent);
        if (arr.length > 5) arr.shift();

        const counts: Partial<Record<MeowIntent, number>> = {};
        for (const item of arr) {
            counts[item] = (counts[item] || 0) + 1;
        }

        const best = Object.entries(counts).sort((a, b) => (b[1] || 0) - (a[1] || 0))[0];
        if (!best) return;

        const bestIntent = best[0] as MeowIntent;
        const bestCount = best[1] || 0;

        setLastDetections(arr.map((x) => getIntentUiLabel(x)));

        const shouldPromote =
            bestCount >= 2 ||
            confidence >= 60 ||
            lastStableIntentRef.current === bestIntent;

        if (!shouldPromote) return;

        lastStableIntentRef.current = bestIntent;
        setPrediction(buildStablePrediction(bestIntent, confidence));
    };

    const analyzeRecordedChunk = async (blob: Blob) => {
        try {
            setLiveState("interpreting");

            const features = await extractAudioFeatures(blob);

            const profile = loadProfile();
            const bias = buildBiasFromDiary();
            const mergedProfile = profile
                ? { ...profile, favoriteIntentBias: { ...profile.favoriteIntentBias, ...bias } }
                : null;

            const result = classifyMeow(features, mergedProfile);

            if (result.confidence < MIN_CONFIDENCE_TO_SHOW) {
                setLiveState("unclear");
                return;
            }

            stabilizePrediction(result.topIntent, result.confidence);
            setLiveState("listening");
        } catch {
            setLiveState("unclear");
        }
    };

    const stopDetection = async () => {
        const recorder = mediaRecorderRef.current;
        if (!recorder) return;
        if (recorder.state === "recording") {
            recorder.stop();
        }
        detectingRef.current = false;
    };

    const startDetection = () => {
        if (detectingRef.current || !streamRef.current) return;

        chunksRef.current = [];
        const recorder = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
            const blob = new Blob(chunksRef.current, { type: "audio/webm" });
            if (blob.size > 0) {
                await analyzeRecordedChunk(blob);
            }
        };

        recorder.start();
        detectingRef.current = true;
        setLiveState("detecting");

        window.setTimeout(() => {
            if (detectingRef.current) {
                stopDetection();
            }
        }, MAX_REC_MS);
    };

    const monitor = () => {
        const analyser = analyserRef.current;
        if (!analyser) return;

        const buffer = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(buffer);

        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
            const v = buffer[i] - 128;
            sum += Math.abs(v);
        }

        const avg = sum / buffer.length;
        setVolume(Math.round(avg));

        if (avg > VOLUME_THRESHOLD) {
            if (!detectingRef.current) {
                startDetection();
            }

            if (silenceTimerRef.current) {
                window.clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
            }
        } else {
            if (detectingRef.current && !silenceTimerRef.current) {
                silenceTimerRef.current = window.setTimeout(() => {
                    stopDetection();
                    silenceTimerRef.current = null;
                }, SILENCE_HOLD_MS);
            }
        }

        animationRef.current = requestAnimationFrame(monitor);
    };

    const startLive = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            analyserRef.current = analyser;

            source.connect(analyser);

            setRunning(true);
            setLiveState("listening");
            setPrediction(null);
            setLastDetections([]);
            setCopied(false);

            monitor();
        } catch {
            setLiveState("unclear");
        }
    };

    const stopLive = () => {
        setRunning(false);
        setLiveState("idle");
        cleanup();
    };

    const copySocialText = async () => {
        if (!prediction) return;

        const text = `🐱 MeowMind Live Interpreter\n${prediction.label} • ${prediction.confidence}%\n${prediction.socialText}`;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    const saveSnapshot = () => {
        if (!prediction) return;

        addLiveSnapshot({
            id: crypto.randomUUID(),
            intent: prediction.intent,
            confidence: prediction.confidence,
            createdAt: new Date().toISOString(),
            humanText: prediction.humanText,
            socialText: prediction.socialText
        });

        alert("Snapshot live salvato");
    };

    useEffect(() => {
        return () => cleanup();
    }, []);

    const cardColor = prediction ? getIntentColor(prediction.intent) : "#6e7cff";

    return (
        <div className="card">
            <h2>⚡ Cat Live Interpreter</h2>
            <p className="small">
                La funzione chiave dell’app: ascolta in tempo reale, rileva attività sonora,
                stabilizza il risultato e genera una lettura pronta anche per i social.
            </p>

            {!running ? (
                <button className="bigButton" onClick={startLive}>
                    Avvia live interpreter
                </button>
            ) : (
                <button className="secondaryButton" onClick={stopLive}>
                    Ferma live interpreter
                </button>
            )}

            <div style={{ marginTop: 18 }}>
                <div className="small">Stato live</div>
                <div className="liveText">
                    {liveState === "idle" && "Pronto"}
                    {liveState === "listening" && "🎧 In ascolto"}
                    {liveState === "detecting" && "🐾 Suono rilevato"}
                    {liveState === "interpreting" && "🧠 Interpretazione..."}
                    {liveState === "unclear" && "❓ Segnale poco chiaro"}
                </div>
            </div>

            <div style={{ marginTop: 16 }}>
                <div className="small">Attività audio</div>
                <div
                    style={{
                        width: "100%",
                        height: 12,
                        background: "#1b2347",
                        borderRadius: 999,
                        overflow: "hidden",
                        marginTop: 6
                    }}
                >
                    <div
                        style={{
                            width: `${Math.min(100, volume * 2.2)}%`,
                            height: "100%",
                            background: cardColor,
                            borderRadius: 999,
                            transition: "width 120ms linear"
                        }}
                    />
                </div>
            </div>

            <div
                style={{
                    marginTop: 18,
                    padding: 20,
                    borderRadius: 20,
                    background: "#0d142b",
                    border: `1px solid ${cardColor}55`,
                    boxShadow: `0 0 0 1px ${cardColor}22 inset`
                }}
            >
                <div className="small">Interpretazione corrente</div>

                <div
                    style={{
                        fontSize: 30,
                        fontWeight: 800,
                        marginTop: 8
                    }}
                >
                    {prediction ? prediction.label : "Nessuna interpretazione stabile"}
                </div>

                <div style={{ marginTop: 8, opacity: 0.88 }}>
                    {prediction
                        ? `Probabilità stimata: ${prediction.confidence}%`
                        : "Aspetto un pattern sonoro chiaro prima di mostrare un risultato."}
                </div>

                {prediction && (
                    <>
                        <div style={{ marginTop: 14, lineHeight: 1.5 }}>
                            {prediction.humanText}
                        </div>

                        <div
                            style={{
                                marginTop: 14,
                                padding: 14,
                                borderRadius: 16,
                                background: `${cardColor}16`,
                                border: `1px solid ${cardColor}44`,
                                fontWeight: 700
                            }}
                        >
                            {prediction.socialText}
                        </div>

                        <div className="grid two" style={{ marginTop: 14 }}>
                            <button className="bigButton" onClick={copySocialText}>
                                {copied ? "Copiato" : "Copia testo social"}
                            </button>
                            <button className="secondaryButton" onClick={saveSnapshot}>
                                Salva snapshot
                            </button>
                        </div>
                    </>
                )}
            </div>

            <div className="note">
                Ultime rilevazioni:{" "}
                {lastDetections.length > 0 ? lastDetections.join(" • ") : "nessuna"}
            </div>
        </div>
    );
}