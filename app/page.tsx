"use client";

import { useState } from "react";
import HomeTabs from "@/components/HomeTabs";
import Recorder from "@/components/Recorder";
import LiveInterpreter from "@/components/LiveInterpreter";
import Soundboard from "@/components/Soundboard";
import CatProfile from "@/components/CatProfile";
import Diary from "@/components/Diary";
import LiveSnapshots from "@/components/LiveSnapshots";
import ReactionRecorder from "@/components/ReactionRecorder";
import ReactionGallery from "@/components/ReactionGallery";

type Tab = "live" | "clips" | "sounds" | "cat";

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("live");

  return (
    <main className="container">
      <section className="hero">
        <div className="heroGrid">
          <div>
            <div className="eyebrow">MeowMind</div>
            <h1 className="title">Capisci il tuo gatto, in tempo reale.</h1>
            <p className="subtitle">
              Un'interfaccia pulita per ascoltare i miagolii, ottenere una stima leggibile e trasformare i momenti migliori in clip da condividere.
            </p>

            <div className="heroActions">
              <button
                className="bigButton heroPrimary"
                onClick={() => setTab("live")}
              >
                Apri il live interpreter
              </button>
              <button
                className="secondaryButton heroSecondary"
                onClick={() => setTab("clips")}
              >
                Crea una clip
              </button>
            </div>

            <div className="heroMetrics">
              <span className="pill">Lettura live</span>
              <span className="pill">Clip verticali</span>
              <span className="pill">Profilo personale</span>
            </div>
          </div>

          <div className="heroPanel">
            <div className="sectionLabel">Percorso principale</div>
            <div className="flowList">
              <div className="flowItem">
                <div className="flowIndex">1</div>
                <div>
                  <div className="flowTitle">Ascolta</div>
                  <div className="flowText">
                    Il live interpreter rileva il miagolio e aspetta un pattern abbastanza chiaro prima di mostrare il risultato.
                  </div>
                </div>
              </div>

              <div className="flowItem">
                <div className="flowIndex">2</div>
                <div>
                  <div className="flowTitle">Leggi</div>
                  <div className="flowText">
                    Ottieni una stima semplice, una frase umana e un testo gia pronto per essere condiviso.
                  </div>
                </div>
              </div>

              <div className="flowItem">
                <div className="flowIndex">3</div>
                <div>
                  <div className="flowTitle">Crea</div>
                  <div className="flowText">
                    Passa alle clip verticali, salva i momenti migliori e costruisci nel tempo il profilo del tuo gatto.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeTabs value={tab} onChange={setTab} />

      {tab === "live" && (
        <>
          <LiveInterpreter onCreateClip={() => setTab("clips")} />
          <div className="grid two">
            <Recorder />
            <LiveSnapshots />
          </div>
        </>
      )}

      {tab === "clips" && (
        <>
          <ReactionRecorder />
          <ReactionGallery />
        </>
      )}

      {tab === "sounds" && <Soundboard />}

      {tab === "cat" && (
        <div className="grid two">
          <CatProfile />
          <Diary />
        </div>
      )}
    </main>
  );
}
