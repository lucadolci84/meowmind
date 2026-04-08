"use client";

import { useState } from "react";
import HomeTabs from "@/components/HomeTabs";
import Recorder from "@/components/Recorder";
import LiveInterpreter from "@/components/LiveInterpreter";
import Soundboard from "@/components/Soundboard";
import CatProfile from "@/components/CatProfile";
import Diary from "@/components/Diary";

type Tab = "record" | "live" | "speak" | "profile" | "diary";

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("record");

  return (
    <main className="container">
      <section className="hero">
        <h1 className="title">🐱 MeowMind V2</h1>
        <p className="subtitle">
          AI leggera per interpretare i miagolii, personalizzare il profilo del gatto
          e creare una base reale per una futura versione addestrata meglio.
        </p>
        <div style={{ marginTop: 12 }}>
          <span className="badge">gratis</span>
          <span className="badge">Vercel-ready</span>
          <span className="badge">client-side</span>
          <span className="badge">AI migliorabile</span>
        </div>
      </section>

      <HomeTabs value={tab} onChange={(next) => setTab(next)} />

      {tab === "record" && <Recorder />}
      {tab === "live" && <LiveInterpreter />}
      {tab === "speak" && <Soundboard />}
      {tab === "profile" && <CatProfile />}
      {tab === "diary" && <Diary />}
    </main>
  );
}