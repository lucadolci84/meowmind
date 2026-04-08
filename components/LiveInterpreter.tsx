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

    const text = `MeowMind Live\n${prediction.label} - ${prediction.confidence}%\n${prediction.socialText}`;
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
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  const cardColor = prediction ? getIntentColor(prediction.intent) : "#6c63ff";

  return (
    <div className="card">
      <div className="sectionLabel">Live interpreter</div>
      <h2 style={{ marginBottom: 10 }}>Una lettura piu chiara, in diretta.</h2>
      <p className="small">
        MeowMind ascolta in continuo, rileva i momenti utili e aspetta una lettura abbastanza stabile.
      </p>

      {!running ? (
        <button className="bigButton" onClick={startLive}>
          Avvia il live interpreter
        </button>
      ) : (
        <button className="secondaryButton" onClick={stopLive}>
          Ferma il live interpreter
        </button>
      )}

      <div className="grid two" style={{ marginTop: 18, alignItems: "start" }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="small">Stato</div>
          <div className="liveText">
            {liveState === "idle" && "Pronto"}
            {liveState === "listening" && "In ascolto"}
            {liveState === "detecting" && "Suono rilevato"}
            {liveState === "interpreting" && "Analisi in corso"}
            {liveState === "unclear" && "Segnale poco chiaro"}
          </div>

          <div style={{ marginTop: 18 }}>
            <div className="small">Attivita audio</div>
            <div
              style={{
                width: "100%",
                height: 12,
                background: "rgba(99, 112, 139, 0.12)",
                borderRadius: 999,
                overflow: "hidden",
                marginTop: 8
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

          <div className="note">
            {lastDetections.length > 0
              ? `Ultime rilevazioni: ${lastDetections.join(" - ")}`
              : "Appena rilevo un pattern utile, la lettura apparira qui."}
          </div>
        </div>

        <div
          className="card"
          style={{
            marginBottom: 0,
            borderColor: `${cardColor}33`,
            boxShadow: `0 0 0 1px ${cardColor}14 inset`
          }}
        >
          <div className="small">Lettura attuale</div>
          <div className="liveText" style={{ color: prediction ? cardColor : undefined }}>
            {prediction ? prediction.label : "In attesa di una lettura stabile"}
          </div>

          <div style={{ marginTop: 8, color: "#63708b" }}>
            {prediction
              ? `Confidenza stimata: ${prediction.confidence}%`
              : "Per evitare risultati casuali, mostro la lettura solo quando il segnale e abbastanza coerente."}
          </div>

          {prediction && (
            <>
              <div style={{ marginTop: 16, lineHeight: 1.6 }}>{prediction.humanText}</div>

              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  borderRadius: 18,
                  background: `${cardColor}12`,
                  border: `1px solid ${cardColor}33`,
                  fontWeight: 700,
                  lineHeight: 1.5
                }}
              >
                {prediction.socialText}
              </div>

              <div className="grid two" style={{ marginTop: 14 }}>
                <button className="secondaryButton" onClick={copySocialText}>
                  {copied ? "Copiato" : "Condividi o copia"}
                </button>
                <button className="secondaryButton" onClick={saveSnapshot}>
                  Salva momento
                </button>
              </div>

              {onCreateClip && (
                <button className="bigButton" onClick={onCreateClip}>
                  Trasforma questa lettura in una clip
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
