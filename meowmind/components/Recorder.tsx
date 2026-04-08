"use client";

import { useState } from "react";
import { extractAudioFeatures, recordAudio, startMicStream } from "@/lib/audio";
import { classifyMeow } from "@/lib/classifier";
import { addDiaryEntry, buildBiasFromDiary, loadProfile } from "@/lib/storage";
import { AnalysisResult } from "@/lib/types";

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
      setError("Non sono riuscito ad accedere al microfono.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>🎙 Analisi Miagolio</h2>
      <p className="small">
        Registra 4 secondi e stima l’intenzione del gatto usando analisi audio locale.
      </p>

      <button className="bigButton" onClick={handleRecord} disabled={loading}>
        {loading ? "Sto ascoltando..." : "Registra e analizza"}
      </button>

      {error && <div className="note">{error}</div>}

      {result && (
        <>
          <div className="note">
            Il tuo gatto probabilmente sta comunicando: <b>{result.topIntent}</b> ({result.confidence}%)
          </div>

          <div style={{ marginTop: 14 }}>
            {Object.entries(result.scores)
              .sort((a, b) => b[1] - a[1])
              .map(([intent, score]) => (
                <div className="resultRow" key={intent}>
                  <span>{intent}</span>
                  <b>{score}%</b>
                </div>
              ))}
          </div>

          <div className="grid two" style={{ marginTop: 16 }}>
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