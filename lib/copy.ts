import { MeowIntent, ReactionMode } from "./types";

export function getIntentUiLabel(intent: MeowIntent): string {
    const map: Record<MeowIntent, string> = {
        fame: "🍗 Fame",
        attenzione: "🧠 Attenzione",
        gioco: "🎾 Gioco",
        saluto: "👋 Saluto",
        stress: "😾 Stress",
        affetto: "❤️ Affetto",
        richiamo: "📍 Richiamo"
    };

    return map[intent];
}

export function getIntentHumanText(intent: MeowIntent): string {
    const map: Record<MeowIntent, string> = {
        fame: "Il tuo gatto probabilmente sta chiedendo cibo o anticipando la routine della ciotola.",
        attenzione: "Il tuo gatto probabilmente vuole attenzione, presenza o una risposta da parte tua.",
        gioco: "Il tuo gatto sembra voler interazione, movimento o un momento di gioco.",
        saluto: "Il tuo gatto sembra fare una vocalizzazione breve di contatto o saluto.",
        stress: "Il suono sembra più teso o scomodo del normale. Potrebbe esserci fastidio o agitazione.",
        affetto: "Il tono sembra più morbido e compatibile con una comunicazione tranquilla o amichevole.",
        richiamo: "Il tuo gatto sembra cercare attivamente di farsi seguire, notare o raggiungere."
    };

    return map[intent];
}

export function getIntentSocialText(intent: MeowIntent): string {
    const map: Record<MeowIntent, string> = {
        fame: "“umano, la ciotola non si riempie da sola”",
        attenzione: "“guarda me, non quello schermo”",
        gioco: "“muoviti, adesso si caccia”",
        saluto: "“ok umano, sei tornato”",
        stress: "“questa situazione non mi piace per niente”",
        affetto: "“puoi restare, ma comportati bene”",
        richiamo: "“seguimi immediatamente”"
    };

    return map[intent];
}

export function getIntentColor(intent: MeowIntent): string {
    const map: Record<MeowIntent, string> = {
        fame: "#ffb84d",
        attenzione: "#7aa2ff",
        gioco: "#71e39b",
        saluto: "#a88bff",
        stress: "#ff6b6b",
        affetto: "#ff8cc6",
        richiamo: "#5ee6d8"
    };

    return map[intent];
}

export function getModeTitle(mode: ReactionMode): string {
    const map: Record<ReactionMode, string> = {
        cute: "Cute Mode",
        meme: "Meme Mode",
        scientific: "Scientific Mode"
    };
    return map[mode];
}

export function getModeCaption(
    mode: ReactionMode,
    label?: string,
    confidence?: number,
    socialText?: string
): string {
    if (mode === "cute") {
        return `🐱 MeowMind • ${label || "Live"} ${confidence ? `• ${confidence}%` : ""}\n${socialText || "Il mio gatto è troppo iconico."}`;
    }

    if (mode === "meme") {
        return `🐱 MeowMind Meme Drop\n${socialText || "Il mio gatto ha qualcosa da dire."}\n${label || ""} ${confidence ? `(${confidence}%)` : ""}`;
    }

    return `MeowMind Analysis\nIntent: ${label || "N/A"}\nConfidence: ${confidence || 0}%\n${socialText || ""}`;
}