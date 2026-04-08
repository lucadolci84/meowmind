"use client";

const sounds = [
  { key: "food", label: "🐟 Cibo", file: "/sounds/food.mp3" },
  { key: "greeting", label: "👋 Saluto", file: "/sounds/greeting.mp3" },
  { key: "play", label: "🎾 Giochiamo", file: "/sounds/play.mp3" },
  { key: "come", label: "📍 Vieni qui", file: "/sounds/come.mp3" },
  { key: "affection", label: "❤️ Affetto", file: "/sounds/affection.mp3" },
  { key: "away", label: "😾 Vai via", file: "/sounds/away.mp3" }
];

export default function Soundboard() {
  const playSound = (src: string) => {
    const audio = new Audio(src);
    audio.play();
  };

  return (
    <div className="card">
      <h2>😺 Parla al gatto</h2>
      <p className="small">
        Usa clip audio feline. In V2 puoi sostituire questi file con vocalizzazioni reali migliori.
      </p>

      <div className="soundGrid">
        {sounds.map((sound) => (
          <button
            key={sound.key}
            className="soundButton"
            onClick={() => playSound(sound.file)}
          >
            {sound.label}
          </button>
        ))}
      </div>
    </div>
  );
}