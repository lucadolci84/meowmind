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
import DatasetDrafts from "@/components/DatasetDrafts";

type Tab = "live" | "clips" | "sounds" | "cat";

export default function HomePage() {
    const [tab, setTab] = useState<Tab>("live");

    useEffect(() => {
        if (!window.localStorage.getItem("meowmind_media_storage_mode")) {
            window.localStorage.setItem("meowmind_media_storage_mode", "local");
        }
    }, []);

    return (
        <main className="container pageFade">

            <div className="floatingTopBar">
                <div className="floatingTopBarInner">
                    <div>
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 800,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                color: "#64748b"
                            }}
                        >
                            MeowMind
                        </div>
                        <div
                            style={{
                                marginTop: 4,
                                fontSize: 14,
                                color: "#5b6b80"
                            }}
                        >
                            Interpretazione vocale per momenti reali.
                        </div>
                    </div>
                </div>
            </div>

            <section className="hero">
                <div className="heroGrid">
                    <div>
                        <div className="eyebrow">MeowMind</div>
                        <h1 className="title">Capire il tuo gatto, con piu calma e piu chiarezza.</h1>
                        <p className="subtitle">
                            Ascolta i pattern vocali, interpreta i segnali piu coerenti e salva i momenti che contano.
                        </p>

                        <div className="heroActions">
                            <button
                                className="bigButton heroPrimary"
                                onClick={() => setTab("live")}
                            >
                                Prova il live
                            </button>
                            <button
                                className="secondaryButton heroSecondary"
                                onClick={() => setTab("clips")}
                            >
                                Vedi i momenti
                            </button>
                        </div>

                    </div>

                    <div className="heroPanel">
                        <div className="sectionLabel">Come funziona</div>
                        <div className="flowList">
                            <div className="flowItem">
                                <div className="flowIndex">1</div>
                                <div>
                                    <div className="flowTitle">Rileva</div>
                                    <div className="flowText">
                                        MeowMind ascolta il segnale e aspetta abbastanza coerenza prima di mostrarti una lettura.
                                    </div>
                                </div>
                            </div>

                            <div className="flowItem">
                                <div className="flowIndex">2</div>
                                <div>
                                    <div className="flowTitle">Interpreta</div>
                                    <div className="flowText">
                                        Quando il pattern è più chiaro, restituisce una lettura breve, leggibile e subito utile.
                                    </div>
                                </div>
                            </div>

                            <div className="flowItem">
                                <div className="flowIndex">3</div>
                                <div>
                                    <div className="flowTitle">Salva</div>
                                    <div className="flowText">
                                        I momenti migliori possono essere salvati per costruire una memoria più personale nel tempo.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <HomeTabs value={tab} onChange={setTab} />

            {tab === "live" && (
                <div className="tabPanel">
                    <LiveInterpreter onCreateClip={() => setTab("clips")} />
                    <Recorder />
                    <LiveSnapshots />
                </div>
            )}

            {tab === "clips" && (
                <div className="tabPanel">
                    <>
                        <ReactionRecorder />
                        <ReactionGallery />
                    </>
                </div>
            )}

            {tab === "cat" && (
                <div className="tabPanel">
                    <CatProfile />
                    <Diary />
                    <DatasetDrafts />
                </div>
            )}

            {tab === "sounds" && (
                <div className="tabPanel">
                    <Soundboard />
                </div>
            )}
        </main>
    );
}
