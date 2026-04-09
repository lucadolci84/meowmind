"use client";

export default function ReactionRecorder() {
    return (
        <div className="card">
            <div className="sectionLabel">Momenti</div>
            <h2 style={{ marginBottom: 10 }}>Salva i momenti che vuoi tenere.</h2>
            <p className="small">
                Questa sezione diventera il punto in cui trasformare una lettura riuscita in un momento salvato, pronto da rivedere o condividere.
            </p>
            <div className="emptyState revealCard">
                <div className="emptyIllustration" />
                <div style={{ fontWeight: 800 }}>Ancora nessun momento salvato</div>
                <div className="small" style={{ marginTop: 8 }}>
                    Quando una lettura merita di essere tenuta, potrai conservarla qui.
                </div>
            </div>
        </div>
    );
}