"use client";

import { useEffect, useState } from "react";
import { loadDiary } from "@/lib/storage";
import { DiaryEntry } from "@/lib/types";

export default function Diary() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    setEntries(loadDiary());
  }, []);

  const grouped = entries.slice(0, 20);

  return (
    <div className="card">
      <h2>📊 Diario del gatto</h2>
      <p className="small">
        Storico locale delle ultime analisi. Gratis, senza backend.
      </p>

      {grouped.length === 0 && <div className="note">Nessuna analisi registrata.</div>}

      {grouped.map((entry) => (
        <div className="resultRow" key={entry.id}>
          <div>
            <div><b>{entry.result.topIntent}</b></div>
            <div className="small">
              {new Date(entry.result.createdAt).toLocaleString("it-IT")}
            </div>
          </div>
          <div>{entry.result.confidence}%</div>
        </div>
      ))}
    </div>
  );
}