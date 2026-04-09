"use client";

const sounds = [
    { key: "food", label: "Cibo", description: "Richiamo legato alla ciotola.", file: "/sounds/food.mp3", icon: "🍽️" },
    { key: "greeting", label: "Saluto", description: "Pattern breve di contatto.", file: "/sounds/greeting.mp3", icon: "✨" },
    { key: "play", label: "Gioco", description: "Richiamo leggero e vivace.", file: "/sounds/play.mp3", icon: "🎾" },
    { key: "come", label: "Richiamo", description: "Invito ad avvicinarsi.", file: "/sounds/come.mp3", icon: "📍" },
    { key: "affection", label: "Affetto", description: "Suono piu morbido e calmo.", file: "/sounds/affection.mp3", icon: "💗" },
    { key: "away", label: "Distanza", description: "Segnale piu secco di stop.", file: "/sounds/away.mp3", icon: "🫧" }
];

export default function Soundboard() {
    const playSound = (src: string) => {
        const audio = new Audio(src);
        audio.currentTime = 0;
        audio.play().catch((err) => {
            console.error("Errore riproduzione audio:", err);
            alert("Non riesco a riprodurre questo suono sul dispositivo attuale.");
        });
    };

    return (
        <div className="card">
            <div className="sectionHeader">
                <div className="sectionHeaderText">
                    <div className="sectionLabel">
                        <span className="eyebrowDot" />
                        Suoni
                    </div>
                    <h2>Una libreria rapida per testare pattern diversi.</h2>
                </div>
            </div>

            <p className="small">
                Usa questi richiami come reference veloce e osserva come reagisce il tuo gatto.
            </p>

            <div className="soundGrid" style={{ marginTop: 16 }}>
                {sounds.map((sound) => (
                    <button
                        key={sound.key}
                        className="soundCard cardHoverLift revealCard"
                        onClick={() => playSound(sound.file)}
                    >
                        <div className="soundIcon">{sound.icon}</div>
                        <div style={{ fontSize: 17, fontWeight: 800 }}>{sound.label}</div>
                        <div className="small" style={{ marginTop: 8 }}>
                            {sound.description}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}