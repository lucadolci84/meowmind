"use client";

export default function ReactionGallery() {
    return (
        <div className="card">
            <div className="sectionLabel">Libreria</div>
            <h2 style={{ marginBottom: 10 }}>I tuoi momenti</h2>
            <p className="small">
                Qui troverai le letture e i contenuti che deciderai di conservare.
            </p>
            <div className="emptyState revealCard">
                <div className="emptyIllustration" />
                <div style={{ fontWeight: 800 }}>La libreria è ancora vuota</div>
                <div className="small" style={{ marginTop: 8 }}>
                    I momenti salvati compariranno qui in modo naturale, senza interrompere il flusso.
                </div>
            </div>
        </div>
    );
}