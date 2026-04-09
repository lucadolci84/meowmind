"use client";

import { useEffect, useMemo, useState } from "react";
import { CatProfile as CatProfileType, MeowIntent } from "@/lib/types";
import { buildBiasFromDiary, loadProfile, saveProfile, loadDiary } from "@/lib/storage";
import { getIntentUiLabel } from "@/lib/copy";

const emptyProfile: CatProfileType = {
    name: "",
    age: "",
    breed: "",
    favoriteIntentBias: {}
};

export default function CatProfile() {
    const [profile, setProfile] = useState<CatProfileType>(emptyProfile);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const stored = loadProfile();
        if (stored) setProfile(stored);
    }, []);

    const biasEntries = useMemo(
        () =>
            Object.entries(profile.favoriteIntentBias || {}).sort(
                (a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0)
            ),
        [profile.favoriteIntentBias]
    );

    const diaryCount = typeof window !== "undefined" ? loadDiary().length : 0;

    const dominantIntent = biasEntries[0]?.[0]
        ? getIntentUiLabel(biasEntries[0][0] as MeowIntent)
        : "In definizione";

    const avatarLetter = (profile.name || "M").trim().charAt(0).toUpperCase();

    const handleSave = () => {
        const autoBias = buildBiasFromDiary();
        const next = {
            ...profile,
            favoriteIntentBias: autoBias
        };
        setProfile(next);
        saveProfile(next);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1600);
    };

    return (
        <div className="card">
            <div className="sectionHeader">
                <div className="sectionHeaderText">
                    <div className="sectionLabel">
                        <span className="eyebrowDot" />
                        Profilo
                    </div>
                    <h2>Il tuo gatto, come base della lettura.</h2>
                </div>
            </div>

            <p className="small">
                Qui MeowMind raccoglie l’identita del tuo gatto e i segnali che emergono piu spesso nel tempo.
            </p>

            <div className="profileHero">
                <div className="avatarOrb">{avatarLetter}</div>

                <div>
                    <div className="profileName">{profile.name || "Profilo in preparazione"}</div>
                    <div className="small" style={{ marginTop: 4 }}>
                        Un profilo semplice, personale e progressivamente piu preciso.
                    </div>

                    <div className="profileMeta">
                        <span className="metaPill">{profile.age || "Eta non definita"}</span>
                        <span className="metaPill">{profile.breed || "Razza non definita"}</span>
                        <span className="metaPill">{dominantIntent}</span>
                    </div>
                </div>
            </div>

            <div className="formGrid">
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
            </div>

            <button className="bigButton" onClick={handleSave}>
                {saved ? "Profilo aggiornato" : "Salva profilo"}
            </button>

            <div className="metricsGrid">
                <div className="metricCard">
                    <div className="small">Letture salvate</div>
                    <div className="metricValue">{diaryCount}</div>
                </div>

                <div className="metricCard">
                    <div className="small">Segnale dominante</div>
                    <div className="metricValue" style={{ fontSize: "1rem" }}>{dominantIntent}</div>
                </div>

                <div className="metricCard">
                    <div className="small">Bias rilevati</div>
                    <div className="metricValue">{biasEntries.length}</div>
                </div>

                <div className="metricCard">
                    <div className="small">Stato profilo</div>
                    <div className="metricValue" style={{ fontSize: "1rem" }}>
                        {profile.name ? "Attivo" : "Base"}
                    </div>
                </div>
            </div>

            {biasEntries.length === 0 ? (
                <div className="note">
                    Il profilo si affina dopo le prime analisi salvate. Più usi MeowMind, più la lettura può adattarsi al tuo gatto.
                </div>
            ) : (
                <div className="note">
                    <div style={{ fontWeight: 800, marginBottom: 10 }}>Segnali piu ricorrenti</div>
                    <div className="grid two">
                        {biasEntries.slice(0, 4).map(([intent, value]) => (
                            <div className="stat" key={intent}>
                                <div className="small">{getIntentUiLabel(intent as MeowIntent)}</div>
                                <div style={{ marginTop: 8, fontWeight: 800, fontSize: "1.1rem" }}>
                                    {Math.round((Number(value) || 0) * 100)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}