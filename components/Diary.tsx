"use client";

import { useEffect, useState } from "react";
import { loadDiary } from "@/lib/storage";
import { DiaryEntry } from "@/lib/types";
import { getIntentUiLabel } from "@/lib/copy";

export default function Diary() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    setEntries(loadDiary());
  }, []);

  const grouped = entries.slice(0, 20);

  return (
    <div className="card">
      <div className="sectionLabel">Cronologia</div>
      <h2 style={{ marginBottom: 10 }}>Le ultime letture</h2>
      <p className="small">
        Lo storico delle analisi resta sul dispositivo e ti aiuta a seguire nel tempo i pattern piu ricorrenti.
      </p>

      {grouped.length === 0 ? (
        <div className="emptyState">
          <div style={{ fontWeight: 800 }}>Ancora nessuna lettura salvata</div>
          <div className="small" style={{ marginTop: 8 }}>
            Inizia dal live interpreter o dall'analisi manuale per costruire la cronologia del tuo gatto.
          </div>
        </div>
      ) : (
        grouped.map((entry) => (
          <div className="resultRow" key={entry.id}>
            <div>
              <div style={{ fontWeight: 700 }}>{getIntentUiLabel(entry.result.topIntent)}</div>
              <div className="small" style={{ marginTop: 4 }}>
                {new Date(entry.result.createdAt).toLocaleString("it-IT")}
              </div>
            </div>
            <div style={{ fontWeight: 700 }}>{entry.result.confidence}%</div>
          </div>
        ))
      )}
    </div>
  );
}
