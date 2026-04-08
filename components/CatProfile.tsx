"use client";

import { useEffect, useMemo, useState } from "react";
import { CatProfile as CatProfileType, MeowIntent } from "@/lib/types";
import { buildBiasFromDiary, loadProfile, saveProfile } from "@/lib/storage";
import { getIntentUiLabel } from "@/lib/copy";

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

  const biasEntries = useMemo(
    () => Object.entries(profile.favoriteIntentBias || {}).sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0)),
    [profile.favoriteIntentBias]
  );

  const handleSave = () => {
    const autoBias = buildBiasFromDiary();
    const next = {
      ...profile,
      favoriteIntentBias: autoBias
    };
    setProfile(next);
    saveProfile(next);
  };

  return (
    <div className="card">
      <div className="sectionLabel">Il tuo gatto</div>
      <h2 style={{ marginBottom: 10 }}>Profilo personale</h2>
      <p className="small">
        I dati di base aiutano MeowMind a personalizzare la lettura nel tempo.
      </p>

      <input
        placeholder="Nome"
        value={profile.name}
        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
      />
      <input
        placeholder="Eta"
        value={profile.age}
        onChange={(e) => setProfile({ ...profile, age: e.target.value })}
      />
      <input
        placeholder="Razza"
        value={profile.breed}
        onChange={(e) => setProfile({ ...profile, breed: e.target.value })}
      />

      <button className="bigButton" onClick={handleSave}>
        Salva profilo
      </button>

      {biasEntries.length === 0 ? (
        <div className="note">
          Il profilo si affina dopo le prime analisi salvate. Piu usi MeowMind, piu la lettura puo adattarsi al tuo gatto.
        </div>
      ) : (
        <div className="note">
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Segnali piu ricorrenti</div>
          <div className="grid two">
            {biasEntries.slice(0, 4).map(([intent, value]) => (
              <div className="stat" key={intent}>
                <div className="small">{getIntentUiLabel(intent as MeowIntent)}</div>
                <div style={{ marginTop: 6, fontWeight: 700 }}>{Math.round((Number(value) || 0) * 100)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
