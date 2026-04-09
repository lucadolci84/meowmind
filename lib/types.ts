export type MeowIntent =
    | "fame"
    | "attenzione"
    | "gioco"
    | "saluto"
    | "stress"
    | "affetto"
    | "richiamo"
    | "fusa";

export type AnalysisResult = {
    topIntent: MeowIntent;
    confidence: number;
    scores: Record<MeowIntent, number>;
    features: {
        durationSec: number;
        rms: number;
        zcr: number;
        pitchEstimate: number;
        lowBandRatio: number;
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

export type LiveSnapshot = {
    id: string;
    intent: MeowIntent;
    confidence: number;
    createdAt: string;
    humanText: string;
    socialText: string;
};

export type ReactionMode = "cute" | "meme" | "scientific";

export type ReactionClip = {
    id: string;
    createdAt: string;
    mode: ReactionMode;
    blob?: Blob;
    blobUrl?: string;
    fileName?: string;
    caption?: string;
    label?: string;
    confidence?: number;
    socialText?: string;
    durationMs?: number;
};

export type DatasetEventType =
    | "vocal_event"
    | "purr_event"
    | "mixed_event"
    | "noise_event";

export type DatasetContext =
    | "near_bowl"
    | "near_owner"
    | "near_door"
    | "play"
    | "rest"
    | "carrier"
    | "unknown";

export type DatasetIntent =
    | "food_request"
    | "attention_request"
    | "greeting"
    | "play_arousal"
    | "stress_discomfort"
    | "affiliative_soft_contact"
    | "recall_or_follow_me"
    | "purr"
    | "unknown_or_mixed";

export type DatasetOutcome =
    | "food_served"
    | "cat_approached_owner"
    | "cat_moved_to_bowl"
    | "cat_moved_away"
    | "cat_relaxed"
    | "cat_kept_vocalizing"
    | "unknown";

export type DatasetQuality = "high" | "medium" | "low";

export type DatasetEventDraft = {
    id: string;
    createdAt: string;
    catId?: string;
    sessionId?: string;
    source: "audio_recorder" | "live_interpreter" | "reaction_recorder";
    eventType: DatasetEventType;
    context: DatasetContext;
    intent: DatasetIntent;
    outcome: DatasetOutcome;
    quality: DatasetQuality;
    aiTopIntent?: string;
    aiConfidence?: number;
    notes?: string;
    audioStorageType?: "local" | "remote";
    audioMediaId?: string;
    audioMimeType?: string;
    audioFileName?: string;
    audioLocalBlobId?: string;
    audioRemoteKey?: string;
    audioRemoteUrl?: string;
    audioDurationSec?: number;
};