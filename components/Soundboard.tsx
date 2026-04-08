"use client";

const sounds = [
    {
        key: "food",
        label: "🐟 Cibo",
        description: "Richiamo fame / ciotola",
        file: "/sounds/food.mp3"
    },
    {
        key: "greeting",
        label: "👋 Saluto",
        description: "Trillo breve / saluto",
        file: "/sounds/greeting.mp3"
    },
    {
        key: "play",
        label: "🎾 Giochiamo",
        description: "Invito al gioco",
        file: "/sounds/play.mp3"
    },
    {
        key: "come",
        label: "📍 Vieni qui",
        description: "Richiamo",
        file: "/sounds/come.mp3"
    },
    {
        key: "affection",
        label: "❤️ Affetto",
        description: "Suono morbido / amichevole",
        file: "/sounds/affection.mp3"
    },
    {
        key: "away",
        label: "😾 Vai via",
        description: "Soffio / distanza",
        file: "/sounds/away.mp3"
    }
];

export default function Soundboard() {
    const playSound = (src: string) => {
        const audio = new Audio(src);
        audio.currentTime = 0;
        audio.play().catch((err) => {
            console.error("Errore riproduzione audio:", err);
            alert("Non riesco a riprodurre il file audio. Controlla che esista in public/sounds.");
        });
    };

    return (
        <div className="card">
            <h2>😺 Parla al gatto</h2>
            <p className="small">
                Premi un pulsante per riprodurre una vocalizzazione felina.
            </p>

            <div className="soundGrid">
                {sounds.map((sound) => (
                    <button
                        key={sound.key}
                        className="soundButton"
                        onClick={() => playSound(sound.file)}
                    >
                        <div style={{ fontSize: 18, fontWeight: 800 }}>{sound.label}</div>
                        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                            {sound.description}
                        </div>
                    </button>
                ))}
            </div>

            <div className="note">
                Se un pulsante non funziona, controlla che il file corrispondente esista davvero in
                <b> public/sounds/</b>.
            </div>
        </div>
    );
}