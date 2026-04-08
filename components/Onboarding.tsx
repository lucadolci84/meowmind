"use client";

import { useEffect, useRef, useState } from "react";
import { classifyMeow } from "@/lib/classifier";
import { buildBiasFromDiary, loadProfile } from "@/lib/storage";
import { extractAudioFeatures } from "@/lib/audio";
import { MeowIntent, ReactionMode } from "@/lib/types";
import { saveReactionClipToDb } from "@/lib/db";
import {
    getIntentColor,
    getIntentHumanText,
    getIntentSocialText,
    getIntentUiLabel,
    getModeCaption,
    getModeTitle
} from "@/lib/copy";

type RecorderState = "idle" | "ready" | "recording" | "processing" | "done" | "error";

type StablePrediction = {
    intent: MeowIntent;
    label: string;
    confidence: number;
    humanText: string;
    socialText: string;
};

function buildPrediction(intent: MeowIntent, confidence: number): StablePrediction {
    return {
        intent,
        label: getIntentUiLabel(intent),
        confidence,
        humanText: getIntentHumanText(intent),
        socialText: getIntentSocialText(intent)
    };
}

export default function ReactionRecorder() {
    const [recorderState, setRecorderState] = useState<RecorderState>("idle");
    const [prediction, setPrediction] = useState<StablePrediction | null>(null);
    const [volume, setVolume] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [errorText, setErrorText] = useState("");
    const [mode, setMode] = useState<ReactionMode>("meme");

    const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
    const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const userStreamRef = useRef<MediaStream | null>(null);
    const composedStreamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const drawRafRef = useRef<number | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const monitorRafRef = useRef<number | null>(null);

    const recentPredictionsRef = useRef<MeowIntent[]>([]);
    const detectRecorderRef = useRef<MediaRecorder | null>(null);
    const detectChunksRef = useRef<BlobPart[]>([]);
    const detectingRef = useRef(false);
    const silenceTimerRef = useRef<number | null>(null);

    const VOLUME_THRESHOLD = 18;
    const SILENCE_HOLD_MS = 700;
    const MAX_CHUNK_MS = 1800;
    const MIN_CONFIDENCE = 32;

    const cleanup = () => {
        if (drawRafRef.current) cancelAnimationFrame(drawRafRef.current);
        if (monitorRafRef.current) cancelAnimationFrame(monitorRafRef.current);
        if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }

        if (detectRecorderRef.current && detectRecorderRef.current.state !== "inactive") {
            detectRecorderRef.current.stop();
        }

        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
            audioContextRef.current.close();
        }

        if (userStreamRef.current) {
            userStreamRef.current.getTracks().forEach((t) => t.stop());
        }

        if (composedStreamRef.current) {
            composedStreamRef.current.getTracks().forEach((t) => t.stop());
        }

        userStreamRef.current = null;
        composedStreamRef.current = null;
        mediaRecorderRef.current = null;
        detectRecorderRef.current = null;
        detectingRef.current = false;
        recentPredictionsRef.current = [];
    };

    useEffect(() => {
        return () => cleanup();
    }, []);

    const currentCaption = getModeCaption(
        mode,
        prediction?.label,
        prediction?.confidence,
        prediction?.socialText
    );

    const updatePrediction = (intent: MeowIntent, confidence: number) => {
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

        if (bestCount >= 2 || confidence >= 60) {
            setPrediction(buildPrediction(bestIntent, confidence));
        }
    };

    const analyzeChunk = async (blob: Blob) => {
        try {
            const features = await extractAudioFeatures(blob);

            const profile = loadProfile();
            const bias = buildBiasFromDiary();
            const mergedProfile = profile
                ? { ...profile, favoriteIntentBias: { ...profile.favoriteIntentBias, ...bias } }
                : null;

            const result = classifyMeow(features, mergedProfile);
            if (result.confidence >= MIN_CONFIDENCE) {
                updatePrediction(result.topIntent, result.confidence);
            }
        } catch { }
    };

    const stopAudioDetection = () => {
        const recorder = detectRecorderRef.current;
        if (!recorder) return;
        if (recorder.state === "recording") recorder.stop();
        detectingRef.current = false;
    };

    const startAudioDetection = () => {
        if (!userStreamRef.current || detectingRef.current) return;

        detectChunksRef.current = [];
        const recorder = new MediaRecorder(userStreamRef.current);
        detectRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) detectChunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
            const blob = new Blob(detectChunksRef.current, { type: "video/webm" });
            if (blob.size > 0) await analyzeChunk(blob);
        };

        recorder.start();
        detectingRef.current = true;

        window.setTimeout(() => {
            if (detectingRef.current) stopAudioDetection();
        }, MAX_CHUNK_MS);
    };

    const monitorAudio = () => {
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
            if (!detectingRef.current) startAudioDetection();
            if (silenceTimerRef.current) {
                window.clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
            }
        } else {
            if (detectingRef.current && !silenceTimerRef.current) {
                silenceTimerRef.current = window.setTimeout(() => {
                    stopAudioDetection();
                    silenceTimerRef.current = null;
                }, SILENCE_HOLD_MS);
            }
        }

        monitorRafRef.current = requestAnimationFrame(monitorAudio);
    };

    const wrapText = (
        ctx: CanvasRenderingContext2D,
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        lineHeight: number
    ) => {
        const words = text.split(" ");
        let line = "";
        let currentY = y;

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + " ";
            const width = ctx.measureText(testLine).width;
            if (width > maxWidth && i > 0) {
                ctx.fillText(line, x, currentY);
                line = words[i] + " ";
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }

        ctx.fillText(line, x, currentY);
    };

    const drawCuteOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const color = prediction ? getIntentColor(prediction.intent) : "#ff8cc6";

        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(0, height - 220, width, 220);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 40px Arial";
        ctx.fillText("🐱 MeowMind", 24, 70);

        ctx.fillStyle = color;
        ctx.font = "bold 34px Arial";
        ctx.fillText(prediction ? prediction.label : "💖 In ascolto", 24, height - 140);

        ctx.fillStyle = "#ffffff";
        ctx.font = "24px Arial";
        wrapText(ctx, currentCaption, 24, height - 90, width - 48, 30);
    };

    const drawMemeOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.fillRect(0, 0, width, 120);
        ctx.fillRect(0, height - 220, width, 220);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 42px Arial";
        ctx.fillText("MEOWMIND", 24, 70);

        ctx.fillStyle = prediction ? getIntentColor(prediction.intent) : "#6e7cff";
        ctx.fillRect(24, height - 180, width - 48, 10);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 34px Arial";
        ctx.fillText(prediction ? prediction.label : "🎧 WAITING FOR DRAMA", 24, height - 130);

        ctx.font = "26px Arial";
        wrapText(ctx, currentCaption, 24, height - 80, width - 48, 32);
    };

    const drawScientificOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.fillStyle = "rgba(7,10,18,0.55)";
        ctx.fillRect(0, 0, width, 150);
        ctx.fillRect(0, height - 250, width, 250);

        ctx.strokeStyle = "#7aa2ff";
        ctx.strokeRect(16, 16, width - 32, height - 32);

        ctx.fillStyle = "#7aa2ff";
        ctx.font = "bold 30px Arial";
        ctx.fillText("MEOWMIND ANALYSIS", 24, 54);

        ctx.fillStyle = "#ffffff";
        ctx.font = "26px Arial";
        ctx.fillText(`STATE: ${prediction ? prediction.label : "LISTENING"}`, 24, height - 170);
        ctx.fillText(`CONFIDENCE: ${prediction ? prediction.confidence : 0}%`, 24, height - 130);
        ctx.fillText(`VOLUME: ${volume}`, 24, height - 90);

        ctx.font = "20px Arial";
        wrapText(ctx, currentCaption, 24, height - 40, width - 48, 24);
    };

    const drawFrame = () => {
        const canvas = canvasRef.current;
        const hiddenVideo = hiddenVideoRef.current;
        if (!canvas || !hiddenVideo) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(hiddenVideo, 0, 0, width, height);

        if (mode === "cute") drawCuteOverlay(ctx, width, height);
        else if (mode === "meme") drawMemeOverlay(ctx, width, height);
        else drawScientificOverlay(ctx, width, height);

        drawRafRef.current = requestAnimationFrame(drawFrame);
    };

    const setupRecorder = async () => {
        setErrorText("");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 720 },
                    height: { ideal: 1280 }
                },
                audio: true
            });

            userStreamRef.current = stream;

            if (videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = stream;
                await videoPreviewRef.current.play().catch(() => { });
            }

            if (hiddenVideoRef.current) {
                hiddenVideoRef.current.srcObject = stream;
                await hiddenVideoRef.current.play().catch(() => { });
            }

            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            source.connect(analyser);
            analyserRef.current = analyser;

            const canvas = canvasRef.current;
            if (!canvas) throw new Error("Canvas non disponibile");

            canvas.width = 720;
            canvas.height = 1280;

            drawFrame();

            const canvasStream = canvas.captureStream(30);
            const audioTracks = stream.getAudioTracks();
            const composed = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...audioTracks
            ]);

            composedStreamRef.current = composed;
            setRecorderState("ready");
            monitorAudio();
        } catch (err) {
            console.error(err);
            setRecorderState("error");
            setErrorText("Non riesco ad accedere a camera o microfono.");
        }
    };

    const startRecording = () => {
        if (!composedStreamRef.current) return;

        if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl);
            setDownloadUrl(null);
        }

        chunksRef.current = [];
        setPrediction(null);

        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
            ? "video/webm;codecs=vp9,opus"
            : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
                ? "video/webm;codecs=vp8,opus"
                : "video/webm";

        const recorder = new MediaRecorder(composedStreamRef.current, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
            const blob = new Blob(chunksRef.current, { type: mimeType });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);
            setRecorderState("done");

            await saveReactionClipToDb(
                {
                    id: crypto.randomUUID(),
                    createdAt: new Date().toISOString(),
                    mode,
                    intent: prediction?.intent,
                    confidence: prediction?.confidence,
                    caption: currentCaption,
                    mimeType
                },
                blob
            );
        };

        recorder.start(250);
        setRecorderState("recording");
    };

    const stopRecording = () => {
        if (!mediaRecorderRef.current) return;
        if (mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            setRecorderState("processing");
        }
    };

    const copyCaption = async () => {
        await navigator.clipboard.writeText(currentCaption);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    const resetRecorder = () => {
        cleanup();
        setPrediction(null);
        setVolume(0);

        if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl);
        }

        setDownloadUrl(null);
        setCopied(false);
        setErrorText("");
        setRecorderState("idle");
    };

    return (
        <div className="card">
            <h2>📹 Reaction Recorder V5.1</h2>
            <p className="small">
                Registra video verticali con overlay dinamico, caption automatica e salvataggio persistente locale.
            </p>

            <div className="grid two" style={{ marginTop: 12 }}>
                <div className="card" style={{ marginBottom: 0 }}>
                    <div className="small">Modalità video</div>
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value as ReactionMode)}
                        disabled={recorderState === "recording"}
                    >
                        <option value="cute">Cute Mode</option>
                        <option value="meme">Meme Mode</option>
                        <option value="scientific">Scientific Mode</option>
                    </select>
                    <div className="note" style={{ marginTop: 12 }}>
                        Modalità attuale: <b>{getModeTitle(mode)}</b>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 0 }}>
                    <div className="small">Caption auto</div>
                    <div style={{ marginTop: 12, fontWeight: 700, whiteSpace: "pre-line" }}>
                        {currentCaption}
                    </div>
                </div>
            </div>

            {recorderState === "idle" && (
                <button className="bigButton" onClick={setupRecorder}>
                    Attiva camera e microfono
                </button>
            )}

            {errorText && <div className="note">{errorText}</div>}

            {(recorderState === "ready" ||
                recorderState === "recording" ||
                recorderState === "processing" ||
                recorderState === "done") && (
                    <>
                        <div className="grid two" style={{ alignItems: "start", marginTop: 16 }}>
                            <div className="card" style={{ marginBottom: 0 }}>
                                <div className="small">Anteprima live</div>
                                <video
                                    ref={videoPreviewRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    style={{
                                        width: "100%",
                                        marginTop: 10,
                                        borderRadius: 18,
                                        background: "#000",
                                        aspectRatio: "9 / 16",
                                        objectFit: "cover"
                                    }}
                                />

                                <div style={{ marginTop: 14 }}>
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
                                                background: prediction ? getIntentColor(prediction.intent) : "#6e7cff",
                                                borderRadius: 999
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="grid two" style={{ marginTop: 14 }}>
                                    {recorderState !== "recording" ? (
                                        <button className="bigButton" onClick={startRecording}>
                                            Inizia registrazione
                                        </button>
                                    ) : (
                                        <button className="bigButton" onClick={stopRecording}>
                                            Ferma registrazione
                                        </button>
                                    )}

                                    <button className="secondaryButton" onClick={resetRecorder}>
                                        Reset
                                    </button>
                                </div>
                            </div>

                            <div className="card" style={{ marginBottom: 0 }}>
                                <div className="small">Interpretazione live</div>
                                <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>
                                    {prediction ? prediction.label : "🎧 In ascolto"}
                                </div>

                                <div style={{ marginTop: 8, opacity: 0.88 }}>
                                    {prediction
                                        ? `Probabilità stimata: ${prediction.confidence}%`
                                        : "Sto aspettando un pattern sonoro abbastanza chiaro."}
                                </div>

                                {prediction && (
                                    <>
                                        <div style={{ marginTop: 14 }}>{prediction.humanText}</div>

                                        <div
                                            style={{
                                                marginTop: 14,
                                                padding: 14,
                                                borderRadius: 16,
                                                background: `${getIntentColor(prediction.intent)}16`,
                                                border: `1px solid ${getIntentColor(prediction.intent)}55`,
                                                fontWeight: 700
                                            }}
                                        >
                                            {prediction.socialText}
                                        </div>
                                    </>
                                )}

                                <div className="grid two" style={{ marginTop: 14 }}>
                                    <button className="secondaryButton" onClick={copyCaption}>
                                        {copied ? "Copiato" : "Copia caption"}
                                    </button>

                                    {downloadUrl ? (
                                        <a href={downloadUrl} download="meowmind-reaction.webm">
                                            <button className="bigButton" style={{ marginTop: 0 }}>
                                                Scarica video
                                            </button>
                                        </a>
                                    ) : (
                                        <button className="bigButton" disabled style={{ marginTop: 0, opacity: 0.5 }}>
                                            Scarica video
                                        </button>
                                    )}
                                </div>

                                <div className="note">
                                    Stato:{" "}
                                    {recorderState === "ready" && "pronto"}
                                    {recorderState === "recording" && "registrazione in corso"}
                                    {recorderState === "processing" && "sto processando il file"}
                                    {recorderState === "done" && "video pronto e salvato"}
                                    {recorderState === "error" && "errore"}
                                </div>
                            </div>
                        </div>

                        <video ref={hiddenVideoRef} autoPlay muted playsInline style={{ display: "none" }} />
                        <canvas ref={canvasRef} style={{ display: "none" }} />
                    </>
                )}
        </div>
    );
}