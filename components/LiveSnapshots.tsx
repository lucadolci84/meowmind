"use client";

import { useEffect, useState } from "react";
import { loadLiveSnapshots } from "@/lib/storage";
import { LiveSnapshot } from "@/lib/types";
import { getIntentUiLabel } from "@/lib/copy";

export default function LiveSnapshots() {
  const [items, setItems] = useState<LiveSnapshot[]>([]);

  useEffect(() => {
    setItems(loadLiveSnapshots());
  }, []);

  return (
    <div className="card">
      <div className="sectionLabel">Momenti salvati</div>
      <h2 style={{ marginBottom: 10 }}>Snapshot del live</h2>
      <p className="small">
        Le letture che hai deciso di tenere, con la frase pronta per essere ripresa o condivisa.
      </p>

      {items.length === 0 ? (
        <div className="emptyState">
          <div style={{ fontWeight: 800 }}>Nessun momento salvato</div>
          <div className="small" style={{ marginTop: 8 }}>
            Quando il live interpreter trova una lettura interessante, puoi salvarla qui con un tap.
          </div>
        </div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="resultRow">
            <div>
              <div style={{ fontWeight: 700 }}>{getIntentUiLabel(item.intent)}</div>
              <div className="small" style={{ marginTop: 4 }}>{item.socialText}</div>
              <div className="small" style={{ marginTop: 4 }}>
                {new Date(item.createdAt).toLocaleString("it-IT")}
              </div>
            </div>
            <div style={{ fontWeight: 700 }}>{item.confidence}%</div>
          </div>
        ))
      )}
    </div>
  );
}
