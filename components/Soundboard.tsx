"use client";

const sounds = [
  {
    key: "food",
    label: "Cibo",
    description: "Richiamo legato alla ciotola.",
    file: "/sounds/food.mp3"
  },
  {
    key: "greeting",
    label: "Saluto",
    description: "Pattern breve di contatto.",
    file: "/sounds/greeting.mp3"
  },
  {
    key: "play",
    label: "Gioco",
    description: "Richiamo leggero e vivace.",
    file: "/sounds/play.mp3"
  },
  {
    key: "come",
    label: "Richiamo",
    description: "Invito ad avvicinarsi.",
    file: "/sounds/come.mp3"
  },
  {
    key: "affection",
    label: "Affetto",
    description: "Suono piu morbido e calmo.",
    file: "/sounds/affection.mp3"
  },
  {
    key: "away",
    label: "Distanza",
    description: "Segnale piu secco di stop.",
    file: "/sounds/away.mp3"
  }
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
      <div className="sectionLabel">Suoni</div>
      <h2 style={{ marginBottom: 10 }}>Pattern vocali pronti da provare.</h2>
      <p className="small">
        Una libreria rapida per testare diversi richiami e osservare la risposta del tuo gatto.
      </p>

      <div className="soundGrid" style={{ marginTop: 16 }}>
        {sounds.map((sound) => (
          <button
            key={sound.key}
            className="soundButton"
            onClick={() => playSound(sound.file)}
          >
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
