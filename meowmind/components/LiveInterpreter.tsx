"use client";

import { useEffect, useRef, useState } from "react";
import { classifyMeow } from "@/lib/classifier";
import { loadProfile, buildBiasFromDiary } from "@/lib/storage";

export default function LiveInterpreter() {
  const [running, setRunning] = useState(false);
  const [text, setText] = useState("In attesa...");
  const [confidence, setConfidence] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const startLive = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    setRunning(true);

    intervalRef.current = window.setInterval(() => {
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: "audio/webm" });
          const { extractAudioFeatures } = await import("@/lib/audio");
          const features = await extractAudioFeatures(blob);

          const profile = loadProfile();
          const bias = buildBiasFromDiary();
          const mergedProfile = profile
            ? { ...profile, favoriteIntentBias: { ...profile.favoriteIntentBias, ...bias } }
            : null;

          const result = classifyMeow(features, mergedProfile);
          setText(result.topIntent);
          setConfidence(result.confidence);
        } catch {
          setText("Audio non chiaro");
          setConfidence(null);
        }
      };

      recorder.start();
      setTimeout(() => recorder.stop(), 1500);
    }, 2000);
  };

  const stopLive = () => {
    setRunning(false);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  };

  useEffect(() => {
    return () => stopLive();
  }, []);

  return (
    <div className="card">
      <h2>⚡ Cat Live Interpreter</h2>
      <p className="small">
        Ascolto quasi in tempo reale. Perfetto per video social.
      </p>

      {!running ? (
        <button className="bigButton" onClick={startLive}>
          Avvia live
        </button>
      ) : (
        <button className="secondaryButton" onClick={stopLive}>
          Ferma live
        </button>
      )}

      <div className="liveText">{text}</div>
      {confidence !== null && <div className="badge">probabilità {confidence}%</div>}

      <div className="note">
        Modalità V2: l’interpretazione usa feature audio locali + profilo personale del gatto.
      </div>
    </div>
  );
}