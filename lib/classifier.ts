import { AnalysisResult, CatProfile, MeowIntent } from "./types";

const intents: MeowIntent[] = [
    "fame",
    "attenzione",
    "gioco",
    "saluto",
    "stress",
    "affetto",
    "richiamo",
    "fusa"
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
        richiamo: 0.1,
        fusa: 0.1
    };

    // Fame / richiamo / miagolii piu acuti
    if (pitchEstimate > 700) scores.fame += 0.28;
    if (pitchEstimate > 850) scores.richiamo += 0.2;

    // Toni medi e morbidi
    if (pitchEstimate >= 350 && pitchEstimate <= 650) scores.affetto += 0.22;
    if (pitchEstimate >= 450 && pitchEstimate <= 900) scores.saluto += 0.18;

    // Durata
    if (durationSec > 1.2 && pitchEstimate > 650) scores.fame += 0.18;
    if (durationSec < 0.6) scores.saluto += 0.2;
    if (durationSec < 0.8) scores.gioco += 0.15;

    // Energia
    if (rms > 0.08) scores.stress += 0.35;
    if (rms > 0.06 && pitchEstimate > 800) scores.richiamo += 0.18;
    if (rms < 0.035) scores.affetto += 0.2;

    // Zero crossing
    if (zcr > 0.12) scores.stress += 0.22;
    if (zcr < 0.08) scores.affetto += 0.12;
    if (zcr >= 0.08 && zcr <= 0.11) scores.attenzione += 0.16;

    // Regola base per fusa:
    // suono piu continuo, basso, poco aggressivo, non troppo frammentato
    if (
        durationSec > 2.0 &&
        rms < 0.05 &&
        zcr < 0.1 &&
        pitchEstimate > 0 &&
        pitchEstimate < 350
    ) {
        scores.fusa += 0.55;
        scores.affetto += 0.25;
        scores.fame = Math.max(0.05, scores.fame - 0.08);
        scores.richiamo = Math.max(0.05, scores.richiamo - 0.05);
    }

    // Variante fusa / suono molto morbido anche se il pitch e poco affidabile
    if (
        durationSec > 2.5 &&
        rms < 0.045 &&
        zcr < 0.09
    ) {
        scores.fusa += 0.25;
        scores.affetto += 0.12;
    }

    // Contesto orario
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 9) scores.fame += 0.12;
    if (hour >= 18 && hour <= 21) scores.fame += 0.15;
    if (hour >= 22 || hour <= 5) scores.attenzione += 0.1;

    // Bias personale
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