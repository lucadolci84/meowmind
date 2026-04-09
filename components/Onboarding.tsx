"use client";

type OnboardingProps = {
    onClose: () => void;
};

export default function Onboarding({ onClose }: OnboardingProps) {
    return (
        <div className="sheetOverlay">
            <div className="sheetCard">
                <div className="sectionLabel">
                    <span className="eyebrowDot" />
                    Benvenuto in MeowMind
                </div>

                <h2 style={{ marginTop: 10, marginBottom: 10 }}>
                    Una lettura piu chiara dei segnali del tuo gatto.
                </h2>

                <p className="small" style={{ fontSize: 14, lineHeight: 1.7 }}>
                    MeowMind ascolta i pattern vocali, li interpreta in modo leggibile e ti aiuta a salvare i momenti che contano davvero.
                </p>

                <div className="sheetGrid">
                    <div className="stat">
                        <div style={{ fontWeight: 800 }}>Live interpreter</div>
                        <div className="small" style={{ marginTop: 6 }}>
                            Ascolta in tempo reale e mostra una lettura solo quando il segnale diventa abbastanza coerente.
                        </div>
                    </div>

                    <div className="stat">
                        <div style={{ fontWeight: 800 }}>Analisi manuale</div>
                        <div className="small" style={{ marginTop: 6 }}>
                            Registra un momento singolo per ottenere una lettura piu dettagliata.
                        </div>
                    </div>

                    <div className="stat">
                        <div style={{ fontWeight: 800 }}>Momenti salvati</div>
                        <div className="small" style={{ marginTop: 6 }}>
                            Conserva le letture riuscite e costruisci una piccola libreria personale.
                        </div>
                    </div>

                    <div className="stat">
                        <div style={{ fontWeight: 800 }}>Profilo e dataset</div>
                        <div className="small" style={{ marginTop: 6 }}>
                            Il profilo del gatto e le annotazioni aiutano a rendere le letture piu utili nel tempo.
                        </div>
                    </div>
                </div>

                <div className="note" style={{ marginTop: 16 }}>
                    Per i test, Chrome desktop resta la scelta piu affidabile per microfono, codec e comportamento del browser.
                </div>

                <button className="bigButton" onClick={onClose}>
                    Inizia
                </button>
            </div>
        </div>
    );
}