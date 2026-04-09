"use client";

import { useEffect, useState } from "react";
import { loadLiveSnapshots } from "@/lib/storage";
import { LiveSnapshot } from "@/lib/types";
import { getIntentUiLabel, getIntentColor } from "@/lib/copy";

export default function LiveSnapshots() {
    const [items, setItems] = useState<LiveSnapshot[]>([]);

    useEffect(() => {
        setItems(loadLiveSnapshots());
    }, []);

    return (
        <div className="card">
            <div className="sectionHeader">
                <div className="sectionHeaderText">
                    <div className="sectionLabel">
                        <span className="eyebrowDot" />
                        Momenti salvati
                    </div>
                    <h2>Le letture che hai deciso di tenere.</h2>
                </div>
            </div>

            <p className="small">
                Una mini libreria dei momenti piu interessanti emersi dal live interpreter.
            </p>

            {items.length === 0 ? (
                <div className="emptyState revealCard">
                    <div className="emptyIllustration" />
                    <div style={{ fontWeight: 800 }}>Nessun momento salvato</div>
                    <div className="small" style={{ marginTop: 8 }}>
                        Quando il live produce una lettura convincente, puoi conservarla qui con un tap.
                    </div>
                </div>
            ) : (
                items.map((item) => {
                    const color = getIntentColor(item.intent);

                    return (
                        <div className="listCard" key={item.id}>
                            <div className="listTop">
                                <div>
                                    <div className="timelineDotRow">
                                        <div className="timelineDot" style={{ background: color }} />
                                        <div className="listTitle">{getIntentUiLabel(item.intent)}</div>
                                    </div>

                                    <div className="listMeta">
                                        <span className="intentTag">
                                            {new Date(item.createdAt).toLocaleString("it-IT")}
                                        </span>
                                    </div>

                                    <div className="small" style={{ marginTop: 10, lineHeight: 1.65 }}>
                                        {item.socialText}
                                    </div>
                                </div>

                                <div className="confidenceBadge">{item.confidence}%</div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}