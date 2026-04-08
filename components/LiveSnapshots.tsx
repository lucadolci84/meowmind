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
            <h2>📸 Snapshot live</h2>
            <p className="small">
                Le ultime interpretazioni salvate localmente dal Live Interpreter.
            </p>

            {items.length === 0 && (
                <div className="note">Nessuno snapshot salvato per ora.</div>
            )}

            {items.map((item) => (
                <div key={item.id} className="resultRow">
                    <div>
                        <div><b>{getIntentUiLabel(item.intent)}</b></div>
                        <div className="small">{item.socialText}</div>
                        <div className="small">
                            {new Date(item.createdAt).toLocaleString("it-IT")}
                        </div>
                    </div>
                    <div>{item.confidence}%</div>
                </div>
            ))}
        </div>
    );
}