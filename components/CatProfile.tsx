"use client";

import { useEffect, useState } from "react";
import { CatProfile as CatProfileType } from "@/lib/types";
import { buildBiasFromDiary, loadProfile, saveProfile } from "@/lib/storage";

const emptyProfile: CatProfileType = {
  name: "",
  age: "",
  breed: "",
  favoriteIntentBias: {}
};

export default function CatProfile() {
  const [profile, setProfile] = useState<CatProfileType>(emptyProfile);

  useEffect(() => {
    const stored = loadProfile();
    if (stored) setProfile(stored);
  }, []);

  const handleSave = () => {
    const autoBias = buildBiasFromDiary();
    const next = {
      ...profile,
      favoriteIntentBias: autoBias
    };
    setProfile(next);
    saveProfile(next);
    alert("Profilo salvato");
  };

  return (
    <div className="card">
      <h2>🧠 Profilo del gatto</h2>
      <p className="small">
        La V2 usa questo profilo per personalizzare l’interpretazione.
      </p>

      <input
        placeholder="Nome gatto"
        value={profile.name}
        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
      />
      <input
        placeholder="Età"
        value={profile.age}
        onChange={(e) => setProfile({ ...profile, age: e.target.value })}
      />
      <input
        placeholder="Razza"
        value={profile.breed}
        onChange={(e) => setProfile({ ...profile, breed: e.target.value })}
      />

      <button className="bigButton" onClick={handleSave}>
        Salva profilo e bias personale
      </button>

      <div className="note">
        Bias attuale: {JSON.stringify(profile.favoriteIntentBias || {})}
      </div>
    </div>
  );
}