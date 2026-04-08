export type MeowIntent =
  | "fame"
  | "attenzione"
  | "gioco"
  | "saluto"
  | "stress"
  | "affetto"
  | "richiamo";

export type AnalysisResult = {
  topIntent: MeowIntent;
  confidence: number;
  scores: Record<MeowIntent, number>;
  features: {
    durationSec: number;
    rms: number;
    zcr: number;
    pitchEstimate: number;
  };
  createdAt: string;
};

export type CatProfile = {
  name: string;
  age: string;
  breed: string;
  favoriteIntentBias: Partial<Record<MeowIntent, number>>;
};

export type DiaryEntry = {
  id: string;
  result: AnalysisResult;
};