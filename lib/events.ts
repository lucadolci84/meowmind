const REACTION_CLIP_SAVED_EVENT = "meowmind:reaction-clip-saved";

export function emitReactionClipSaved() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(REACTION_CLIP_SAVED_EVENT));
}

export function onReactionClipSaved(callback: () => void) {
    if (typeof window === "undefined") return () => { };

    const handler = () => callback();
    window.addEventListener(REACTION_CLIP_SAVED_EVENT, handler);

    return () => {
        window.removeEventListener(REACTION_CLIP_SAVED_EVENT, handler);
    };
}