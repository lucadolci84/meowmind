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

export default function LiveInterpreter({
    onCreateClip
}: {
    onCreateClip?: () => void;
}) {
    const [running, setRunning] = useState(false);
    const [liveState, setLiveState] = useState<LiveState>("idle");
    const [volume, setVolume] = useState(0);
    const [rawLevel, setRawLevel] = useState(0);
    const [prediction, setPrediction] = useState<StablePrediction | null>(null);
    const [lastDetections, setLastDetections] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);
    const [lastChunkInfo, setLastChunkInfo] = useState<{
        durationMs: number;
        rms?: number;
        zcr?: number;
        pitchEstimate?: number;
        lowBandRatio?: number;
        topIntent?: string;
        confidence?: number;
    } | null>(null);

    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationRef = useRef<number | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const detectingRef = useRef(false);
    const silenceTimerRef = useRef<number | null>(null);
    const maxRecTimeoutRef = useRef<number | null>(null);

    const detectionStartedAtRef = useRef<number | null>(null);
    const smoothedVolumeRef = useRef(0);

    const recentPredictionsRef = useRef<MeowIntent[]>([]);
    const lastStableIntentRef = useRef<MeowIntent | null>(null);

    const VOLUME_THRESHOLD = 5;
    const SILENCE_HOLD_MS = 2600;
    const MAX_REC_MS = 8000;
    const MIN_REC_MS = 1800;
    const MIN_CONFIDENCE_TO_SHOW = 24;

    const cleanup = () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
        if (maxRecTimeoutRef.current) window.clearTimeout(maxRecTimeoutRef.current);

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
        silenceTimerRef.current = null;
        maxRecTimeoutRef.current = null;
        detectionStartedAtRef.current = null;
        smoothedVolumeRef.current = 0;
    };

    const buildStablePrediction = (
        intent: MeowIntent,
        confidence: number
    ): StablePrediction => ({
        intent,
        label: getIntentUiLabel(intent),
        confidence,
        humanText: getIntentHumanText(intent),
        socialText: getIntentSocialText(intent)
    });

    const stabilizePrediction = (intent: MeowIntent, confidence: number) => {
        const arr = recentPredictionsRef.current;
        arr.push(intent);
        if (arr.length > 5) arr.shift();

        const counts: Partial<Record<MeowIntent, number>> = {};
        for (const item of arr) {
            counts[item] = (counts[item] || 0) + 1;
        }

        const best = Object.entries(counts).sort(
            (a, b) => (b[1] || 0) - (a[1] || 0)
        )[0];
        if (!best) return;

        const bestIntent = best[0] as MeowIntent;
        const bestCount = best[1] || 0;

        setLastDetections(arr.map((x) => getIntentUiLabel(x)));

        const shouldPromote =
            bestIntent === "fusa"
                ? bestCount >= 3 || confidence >= 68 || lastStableIntentRef.current === bestIntent
                : bestCount >= 2 || confidence >= 60 || lastStableIntentRef.current === bestIntent;

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
                ? {
                    ...profile,
                    favoriteIntentBias: {
                        ...profile.favoriteIntentBias,
                        ...bias
                    }
                }
                : null;

            const result = classifyMeow(features, mergedProfile);

            setLastChunkInfo((prev) => ({
                durationMs: prev?.durationMs || 0,
                rms: features.rms,
                zcr: features.zcr,
                pitchEstimate: features.pitchEstimate,
                lowBandRatio: features.lowBandRatio,
                topIntent: result.topIntent,
                confidence: result.confidence
            }));

            const fusaLooksWeak =
                result.topIntent === "fusa" &&
                (features.durationSec < 2.2 || features.lowBandRatio < 0.22);

            if (fusaLooksWeak) {
                setPrediction(buildStablePrediction(result.topIntent, result.confidence));
                setLiveState("unclear");

                window.setTimeout(() => {
                    setLiveState("listening");
                }, 900);

                return;
            }

            if (result.confidence < MIN_CONFIDENCE_TO_SHOW) {
                setPrediction(buildStablePrediction(result.topIntent, result.confidence));
                setLiveState("unclear");

                window.setTimeout(() => {
                    setLiveState("listening");
                }, 900);

                return;
            }

            stabilizePrediction(result.topIntent, result.confidence);
            setLiveState("listening");
        } catch {
            setLiveState("unclear");

            window.setTimeout(() => {
                setLiveState("listening");
            }, 900);
        }
    };

    const stopDetection = () => {
        const recorder = mediaRecorderRef.current;
        if (!recorder) return;

        if (recorder.state === "recording") {
            recorder.stop();
        }

        detectingRef.current = false;

        if (maxRecTimeoutRef.current) {
            window.clearTimeout(maxRecTimeoutRef.current);
            maxRecTimeoutRef.current = null;
        }
    };

    const startDetection = () => {
        if (detectingRef.current || !streamRef.current) return;

        chunksRef.current = [];
        const recorder = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current = recorder;
        detectionStartedAtRef.current = Date.now();

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
            const durationMs = detectionStartedAtRef.current
                ? Date.now() - detectionStartedAtRef.current
                : 0;

            const blob = new Blob(chunksRef.current, { type: "audio/webm" });

            detectionStartedAtRef.current = null;
            setLastChunkInfo((prev) => ({
                ...prev,
                durationMs
            }));

            if (blob.size > 0 && durationMs >= MIN_REC_MS) {
                await analyzeRecordedChunk(blob);
            } else {
                setLiveState("listening");
            }
        };

        recorder.start();
        detectingRef.current = true;
        setLiveState("detecting");

        maxRecTimeoutRef.current = window.setTimeout(() => {
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

        const instantAvg = sum / buffer.length;
        smoothedVolumeRef.current =
            smoothedVolumeRef.current * 0.82 + instantAvg * 0.18;

        const avg = smoothedVolumeRef.current;
        setRawLevel(avg);
        setVolume(Math.min(100, Math.round(avg * 8)));

        if (avg > VOLUME_THRESHOLD) {
            if (!detectingRef.current) {
                startDetection();
            }

            if (silenceTimerRef.current) {
                window.clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
            }
        } else if (detectingRef.current && !silenceTimerRef.current) {
            silenceTimerRef.current = window.setTimeout(() => {
                stopDetection();
                silenceTimerRef.current = null;
            }, SILENCE_HOLD_MS);
        }

        animationRef.current = requestAnimationFrame(monitor);
    };

    const startLive = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

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
            setSaved(false);
            setLastChunkInfo(null);

            monitor();
        } catch {
            setLiveState("unclear");
        }
    };

    const stopLive = () => {
        setRunning(false);
        setLiveState("idle");
        setVolume(0);
        cleanup();
    };

    const copySocialText = async () => {
        if (!prediction) return;

        const text = `MeowMind Live\n${prediction.label} - ${prediction.confidence}%\n${prediction.socialText}`;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
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

        setSaved(true);
        window.setTimeout(() => setSaved(false), 1800);
    };

    useEffect(() => {
        return () => cleanup();
    }, []);

    const cardColor = prediction ? getIntentColor(prediction.intent) : "#6c63ff";

    const statusText =
        liveState === "idle"
            ? "Pronto"
            : liveState === "listening"
                ? "In ascolto"
                : liveState === "detecting"
                    ? "Suono rilevato"
                    : liveState === "interpreting"
                        ? "Analisi in corso"
                        : "Segnale ancora poco chiaro";

    const helperText =
        liveState === "unclear"
            ? "Per ora il segnale non e ancora abbastanza coerente da mostrare una lettura affidabile."
            : "Il live interpreta solo quando il segnale sembra abbastanza stabile da meritare una lettura.";

    return (
        <div className="card liveShell">
            <div className="liveHeroCard">
                <div className="sectionLabel">Live interpreter</div>
                <h2 style={{ marginBottom: 10 }}>Una lettura continua dei segnali piu chiari.</h2>
                <p className="small">{helperText}</p>

                {!running ? (
                    <button className="bigButton" onClick={startLive}>
                        Avvia il live interpreter
                    </button>
                ) : (
                    <button className="secondaryButton" onClick={stopLive}>
                        Ferma il live interpreter
                    </button>
                )}

                <div className="liveOrbRow">
                    <div
                        className={`liveOrb ${liveState === "idle"
                                ? "idle"
                                : liveState === "detecting" || liveState === "interpreting"
                                    ? "detecting"
                                    : ""
                            }`}
                    />
                    <div className="liveStateText">{statusText}</div>
                </div>

                <div style={{ marginTop: 18 }}>
                    <div className="liveStateText">Attivita audio</div>
                    <div className="liveMeter">
                        <div
                            className="liveMeterFill"
                            style={{ width: `${volume}%` }}
                        />
                    </div>

                    <div className="tapBar">
                        <span className="mutedBadge">{running ? "Attivo" : "In pausa"}</span>
                        <span className="mutedBadge">Volume {volume}</span>
                        <span className="mutedBadge">Raw {rawLevel.toFixed(2)}</span>
                        <span className="mutedBadge">
                            {prediction ? prediction.label : "Nessuna lettura"}
                        </span>
                    </div>

                    {lastChunkInfo && (
                        <div className="tapBar">
                            <span className="mutedBadge">
                                Chunk {Math.round(lastChunkInfo.durationMs)} ms
                            </span>
                        </div>
                    )}

                    {lastChunkInfo?.topIntent && (
                        <div className="tapBar">
                            <span className="mutedBadge">
                                {lastChunkInfo.topIntent} {lastChunkInfo.confidence?.toFixed(0)}%
                            </span>
                            {typeof lastChunkInfo.lowBandRatio === "number" && (
                                <span className="mutedBadge">
                                    Low {(lastChunkInfo.lowBandRatio * 100).toFixed(0)}%
                                </span>
                            )}
                            {typeof lastChunkInfo.pitchEstimate === "number" && (
                                <span className="mutedBadge">
                                    Pitch {lastChunkInfo.pitchEstimate.toFixed(0)} Hz
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="note">
                    {lastDetections.length > 0
                        ? `Ultime rilevazioni: ${lastDetections.join(" · ")}`
                        : "Appena rilevo un pattern abbastanza chiaro, la lettura comparira qui."}
                </div>
            </div>

            <div
                className="livePredictionCard"
                style={{
                    borderColor: `${cardColor}33`
                }}
            >
                <div className="liveStateText">Lettura attuale</div>

                <div className="liveText" style={{ color: prediction ? cardColor : undefined }}>
                    {prediction ? prediction.label : "In attesa di una lettura stabile"}
                </div>

                <div className="liveConfidence">
                    {prediction
                        ? `Confidenza stimata: ${prediction.confidence}%`
                        : "Per ora nessun pattern sufficientemente stabile"}
                </div>

                {prediction ? (
                    <>
                        <div style={{ marginTop: 16, lineHeight: 1.65 }}>{prediction.humanText}</div>

                        <div
                            className="liveSocialCard"
                            style={{
                                background: `${cardColor}10`,
                                border: `1px solid ${cardColor}22`
                            }}
                        >
                            {prediction.socialText}
                        </div>

                        <div className="grid two" style={{ marginTop: 14 }}>
                            <button className="secondaryButton" onClick={copySocialText}>
                                {copied ? "Copiato" : "Copia testo"}
                            </button>
                            <button className="secondaryButton" onClick={saveSnapshot}>
                                {saved ? "Salvato" : "Salva momento"}
                            </button>
                        </div>

                        {onCreateClip && false && (
                            <button className="bigButton" onClick={onCreateClip}>
                                Salva come momento
                            </button>
                        )}
                    </>
                ) : (
                    <div style={{ marginTop: 16 }} className="small">
                        Per ora il segnale non e ancora abbastanza coerente da mostrare una lettura affidabile.
                    </div>
                )}
            </div>
        </div>
    );
}