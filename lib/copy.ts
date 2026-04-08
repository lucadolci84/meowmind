import { MeowIntent } from "./types";

export function getIntentUiLabel(intent: MeowIntent): string {
    const map: Record<MeowIntent, string> = {
        fame: "Fame",
        attenzione: "Attenzione",
        gioco: "Gioco",
        saluto: "Saluto",
        stress: "Stress",
        affetto: "Affetto",
        richiamo: "Richiamo",
        fusa: "Fusa"
    };

    return map[intent];
}

export function getIntentHumanText(intent: MeowIntent): string {
    const map: Record<MeowIntent, string> = {
        fame: "Il tuo gatto potrebbe stare chiedendo cibo o anticipando la routine della ciotola.",
        attenzione: "Il tuo gatto potrebbe volere presenza, risposta o un momento di contatto.",
        gioco: "Il pattern sembra piu vicino a una richiesta di movimento o di interazione.",
        saluto: "La vocalizzazione sembra breve e compatibile con un segnale di contatto o di rientro.",
        stress: "Il suono appare piu teso del normale. Potrebbe esserci fastidio o agitazione.",
        affetto: "Il tono sembra piu morbido e vicino a una comunicazione tranquilla o amichevole.",
        richiamo: "Il tuo gatto sembra cercare attivamente di farsi seguire, notare o raggiungere.",
        fusa: "Il suono sembra piu vicino a una fusa: uno stato di calma, comfort o contatto."
    };

    return map[intent];
}

export function getIntentSocialText(intent: MeowIntent): string {
    const map: Record<MeowIntent, string> = {
        fame: '"la ciotola non si riempie da sola"',
        attenzione: '"guarda me, non quello schermo"',
        gioco: '"muoviti, adesso si gioca"',
        saluto: '"bene, sei tornato"',
        stress: '"questa situazione non mi convince"',
        affetto: '"puoi restare, ma con delicatezza"',
        richiamo: '"seguimi subito"',
        fusa: '"ok umano, questo momento mi va bene"'
    };

    return map[intent];
}

export function getIntentColor(intent: MeowIntent): string {
    const map: Record<MeowIntent, string> = {
        fame: "#f59e0b",
        attenzione: "#6366f1",
        gioco: "#10b981",
        saluto: "#8b5cf6",
        stress: "#ef4444",
        affetto: "#ec4899",
        richiamo: "#06b6d4",
        fusa: "#14b8a6"
    };

    return map[intent];
}