"use client";

import { useEffect, useState } from "react";
import HomeTabs from "@/components/HomeTabs";
import Recorder from "@/components/Recorder";
import LiveInterpreter from "@/components/LiveInterpreter";
import Soundboard from "@/components/Soundboard";
import CatProfile from "@/components/CatProfile";
import Diary from "@/components/Diary";
import LiveSnapshots from "@/components/LiveSnapshots";
import ReactionRecorder from "@/components/ReactionRecorder";
import ReactionGallery from "@/components/ReactionGallery";
import Onboarding from "@/components/Onboarding";
import { hasSeenOnboarding, setSeenOnboarding } from "@/lib/app-storage";

type Tab = "record" | "live" | "reaction" | "speak" | "profile" | "diary";

export default function HomePage() {
    const [tab, setTab] = useState<Tab>("reaction");
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        setShowOnboarding(!hasSeenOnboarding());
    }, []);

    const handleCloseOnboarding = () => {
        setSeenOnboarding(true);
        setShowOnboarding(false);
    };

    return (
        <main className="container">
            {showOnboarding && <Onboarding onClose={handleCloseOnboarding} />}

            <section className="hero">
                <h1 className="title">🐱 MeowMind</h1>
                <p className="subtitle">
                    Interpreta i miagolii, registra reaction verticali e trasforma il tuo gatto in contenuto memorabile.
                </p>

                <div style={{ marginTop: 14 }}>
                    <span className="badge">reaction recorder</span>
                    <span className="badge">live interpreter</span>
                    <span className="badge">AI locale</span>
                    <span className="badge">product beta</span>
                </div>
            </section>

            <div className="grid two">
                <div className="card">
                    <div className="small">Feature flagship</div>
                    <h3 style={{ marginTop: 8, marginBottom: 8 }}>📹 Reaction Recorder V6</h3>
                    <p className="small">
                        Crea clip verticali con overlay, caption e gallery persistente.
                    </p>
                </div>

                <div className="card">
                    <div className="small">Motore AI</div>
                    <h3 style={{ marginTop: 8, marginBottom: 8 }}>⚡ Live Interpreter</h3>
                    <p className="small">
                        Ascolta e stabilizza l’interpretazione in tempo reale prima di mostrarla.
                    </p>
                </div>
            </div>

            <HomeTabs value={tab} onChange={(next) => setTab(next)} />

            {tab === "live" && (
                <>
                    <LiveInterpreter />
                    <LiveSnapshots />
                </>
            )}

            {tab === "reaction" && (
                <>
                    <ReactionRecorder />
                    <ReactionGallery />
                </>
            )}

            {tab === "record" && <Recorder />}
            {tab === "speak" && <Soundboard />}
            {tab === "profile" && <CatProfile />}
            {tab === "diary" && <Diary />}
        </main>
    );
}