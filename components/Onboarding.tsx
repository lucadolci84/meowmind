"use client";

type OnboardingProps = {
    onClose: () => void;
};

export default function Onboarding({ onClose }: OnboardingProps) {
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.65)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: 20
            }}
        >
            <div
                className="card"
                style={{
                    width: "100%",
                    maxWidth: 720,
                    marginBottom: 0
                }}
            >
                <div className="small">Benvenuto in MeowMind</div>
                <h2 style={{ marginTop: 8 }}>🐱 Capisci il tuo gatto. Crea clip. Condividi.</h2>

                <div className="grid two" style={{ marginTop: 16 }}>
                    <div className="stat">
                        <div style={{ fontWeight: 800 }}>⚡ Live Interpreter</div>
                        <div className="small" style={{ marginTop: 6 }}>
                            Ascolta in tempo reale e prova a stimare l’intenzione del miagolio.
                        </div>
                    </div>

                    <div className="stat">
                        <div style={{ fontWeight: 800 }}>📹 Reaction Recorder</div>
                        <div className="small" style={{ marginTop: 6 }}>
                            Registra video verticali con overlay e caption automatica.
                        </div>
                    </div>

                    <div className="stat">
                        <div style={{ fontWeight: 800 }}>🗂 Gallery locale</div>
                        <div className="small" style={{ marginTop: 6 }}>
                            Le clip restano salvate nel browser con persistenza locale.
                        </div>
                    </div>

                    <div className="stat">
                        <div style={{ fontWeight: 800 }}>😺 Soundboard</div>
                        <div className="small" style={{ marginTop: 6 }}>
                            Suoni felini da testare subito con il tuo gatto.
                        </div>
                    </div>
                </div>

                <div className="note" style={{ marginTop: 16 }}>
                    Consiglio: per sviluppare e testare usa Chrome desktop. Camera, microfono e codec
                    video sono più affidabili lì.
                </div>

                <button className="bigButton" onClick={onClose}>
                    Inizia
                </button>
            </div>
        </div>
    );
}