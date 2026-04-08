import { AnalysisResult, CatProfile, MeowIntent } from "./types";

const intents: MeowIntent[] = [
  "fame",
  "attenzione",
  "gioco",
  "saluto",
  "stress",
  "affetto",
  "richiamo"
];

function clamp(n: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n));
}

function normalizeScores(scores: Record<MeowIntent, number>) {
  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const normalized = {} as Record<MeowIntent, number>;

  for (const key of intents) {
    normalized[key] = Number(((scores[key] / total) * 100).toFixed(1));
  }

  return normalized;
}

export function classifyMeow(
  features: {
    durationSec: number;
    rms: number;
    zcr: number;
    pitchEstimate: number;
  },
  profile?: CatProfile | null
): AnalysisResult {
  const { durationSec, rms, zcr, pitchEstimate } = features;

  const scores: Record<MeowIntent, number> = {
    fame: 0.1,
    attenzione: 0.1,
    gioco: 0.1,
    saluto: 0.1,
    stress: 0.1,
    affetto: 0.1,
    richiamo: 0.1
  };

  if (pitchEstimate > 700) scores.fame += 0.35;
  if (pitchEstimate > 850) scores.richiamo += 0.2;
  if (pitchEstimate >= 350 && pitchEstimate <= 650) scores.affetto += 0.25;
  if (pitchEstimate >= 450 && pitchEstimate <= 900) scores.saluto += 0.2;

  if (durationSec > 1.2) scores.fame += 0.25;
  if (durationSec < 0.6) scores.saluto += 0.2;
  if (durationSec < 0.8) scores.gioco += 0.15;

  if (rms > 0.08) scores.stress += 0.35;
  if (rms > 0.06 && pitchEstimate > 800) scores.richiamo += 0.18;
  if (rms < 0.035) scores.affetto += 0.2;

  if (zcr > 0.12) scores.stress += 0.22;
  if (zcr < 0.08) scores.affetto += 0.12;
  if (zcr >= 0.08 && zcr <= 0.11) scores.attenzione += 0.16;

  const hour = new Date().getHours();
  if (hour >= 6 && hour <= 9) scores.fame += 0.12;
  if (hour >= 18 && hour <= 21) scores.fame += 0.15;
  if (hour >= 22 || hour <= 5) scores.attenzione += 0.1;

  if (profile?.favoriteIntentBias) {
    for (const intent of intents) {
      scores[intent] += profile.favoriteIntentBias[intent] || 0;
    }
  }

  for (const key of intents) {
    scores[key] = clamp(scores[key], 0.01, 10);
  }

  const normalized = normalizeScores(scores);
  const entries = Object.entries(normalized).sort((a, b) => b[1] - a[1]);
  const topIntent = entries[0][0] as MeowIntent;
  const confidence = entries[0][1];

  return {
    topIntent,
    confidence,
    scores: normalized,
    features: {
      durationSec,
      rms,
      zcr,
      pitchEstimate
    },
    createdAt: new Date().toISOString()
  };
}