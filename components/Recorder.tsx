"use client";

import { useState } from "react";
import { extractAudioFeatures, recordAudio, startMicStream } from "@/lib/audio";
import { classifyMeow } from "@/lib/classifier";
import { addDiaryEntry, buildBiasFromDiary, loadProfile } from "@/lib/storage";
import { AnalysisResult, MeowIntent } from "@/lib/types";
import { getIntentUiLabel, getIntentHumanText, getIntentColor } from "@/lib/copy";

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
      setError("Non sono riuscito ad accedere al microfono o a processare l'audio.");
    } finally {
      setLoading(false);
    }
  };

  const sortedScores = result
    ? Object.entries(result.scores).sort((a, b) => b[1] - a[1])
    : [];

  const accent = result ? getIntentColor(result.topIntent) : "#6c63ff";

  return (
    <div className="card">
      <div className="sectionLabel">Analisi manuale</div>
      <h2 style={{ marginBottom: 10 }}>Un controllo singolo, piu dettagliato.</h2>
      <p className="small">
        Registra quattro secondi di audio per ottenere una lettura completa con distribuzione dei risultati.
      </p>

      <button className="bigButton" onClick={handleRecord} disabled={loading}>
        {loading ? "Sto ascoltando" : "Registra e analizza"}
      </button>

      {error && <div className="note">{error}</div>}

      {result && (
        <>
          <div
            className="card"
            style={{
              marginTop: 16,
              marginBottom: 0,
              borderColor: `${accent}30`,
              boxShadow: `0 0 0 1px ${accent}12 inset`
            }}
          >
            <div className="small">Lettura principale</div>
            <div className="liveText" style={{ color: accent }}>
              {getIntentUiLabel(result.topIntent)}
            </div>
            <div style={{ marginTop: 8, color: "#63708b" }}>
              Confidenza stimata: <b>{result.confidence}%</b>
            </div>
            <div style={{ marginTop: 12, lineHeight: 1.6 }}>
              {getIntentHumanText(result.topIntent)}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Distribuzione</div>

            {sortedScores.map(([intent, score]) => (
              <div key={intent} style={{ marginBottom: 12 }}>
                <div
                  className="resultRow"
                  style={{ borderBottom: "none", padding: "0 0 6px 0" }}
                >
                  <span>{getIntentUiLabel(intent as MeowIntent)}</span>
                  <b>{score}%</b>
                </div>

                <div
                  style={{
                    width: "100%",
                    height: 10,
                    background: "rgba(99, 112, 139, 0.12)",
                    borderRadius: 999,
                    overflow: "hidden"
                  }}
                >
                  <div
                    style={{
                      width: `${score}%`,
                      height: "100%",
                      background: intent === result.topIntent ? accent : "#c7d2fe",
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
