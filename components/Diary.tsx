"use client";

import { useEffect, useState } from "react";
import { loadDiary } from "@/lib/storage";
import { DiaryEntry } from "@/lib/types";
import { getIntentUiLabel, getIntentColor, getIntentHumanText } from "@/lib/copy";

export default function Diary() {
    const [entries, setEntries] = useState<DiaryEntry[]>([]);

    useEffect(() => {
        setEntries(loadDiary());
    }, []);

    const grouped = entries.slice(0, 20);

    return (
        <div className="card">
            <div className="sectionHeader">
                <div className="sectionHeaderText">
                    <div className="sectionLabel">
                        <span className="eyebrowDot" />
                        Cronologia
                    </div>
                    <h2>Le letture piu recenti, in ordine naturale.</h2>
                </div>
            </div>

            <p className="small">
                Lo storico resta sul dispositivo e ti aiuta a vedere quali pattern tornano davvero nel tempo.
            </p>

            {grouped.length === 0 ? (
                <div className="emptyState revealCard">
                    <div className="emptyIllustration" />
                    <div style={{ fontWeight: 800 }}>Ancora nessuna lettura salvata</div>
                    <div className="small" style={{ marginTop: 8 }}>
                        Le analisi più recenti appariranno qui e ti aiuteranno a vedere cosa torna davvero nel tempo.
                    </div>
                </div>
            ) : (
                grouped.map((entry) => {
                    const color = getIntentColor(entry.result.topIntent);

                    return (
                        <div className="listCard" key={entry.id}>
                            <div className="listTop">
                                <div style={{ minWidth: 0 }}>
                                    <div className="timelineDotRow">
                                        <div className="timelineDot" style={{ background: color }} />
                                        <div className="listTitle">{getIntentUiLabel(entry.result.topIntent)}</div>
                                    </div>

                                    <div className="listMeta">
                                        <span className="intentTag">
                                            {new Date(entry.result.createdAt).toLocaleString("it-IT")}
                                        </span>
                                        <span className="intentTag">
                                            {entry.result.features.durationSec.toFixed(2)} s
                                        </span>
                                        <span className="intentTag">
                                            pitch {entry.result.features.pitchEstimate.toFixed(0)} Hz
                                        </span>
                                    </div>

                                    <div className="small" style={{ marginTop: 10, lineHeight: 1.65 }}>
                                        {getIntentHumanText(entry.result.topIntent)}
                                    </div>
                                </div>

                                <div className="confidenceBadge">{entry.result.confidence}%</div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}