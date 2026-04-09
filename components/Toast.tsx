"use client";

type ToastProps = {
    message: string;
    type?: "info" | "success" | "error";
    onClose: () => void;
};

export default function Toast({
    message,
    type = "info",
    onClose
}: ToastProps) {
    const config =
        type === "success"
            ? {
                title: "Completato",
                icon: "✓",
                shell: "linear-gradient(180deg, rgba(236,253,245,0.94), rgba(220,252,231,0.88))",
                border: "1px solid rgba(34,197,94,0.16)",
                iconBg: "rgba(34,197,94,0.12)"
            }
            : type === "error"
                ? {
                    title: "Attenzione",
                    icon: "!",
                    shell: "linear-gradient(180deg, rgba(254,242,242,0.96), rgba(254,226,226,0.88))",
                    border: "1px solid rgba(239,68,68,0.16)",
                    iconBg: "rgba(239,68,68,0.12)"
                }
                : {
                    title: "Aggiornamento",
                    icon: "i",
                    shell: "linear-gradient(180deg, rgba(238,242,255,0.96), rgba(224,231,255,0.88))",
                    border: "1px solid rgba(99,102,241,0.16)",
                    iconBg: "rgba(99,102,241,0.12)"
                };

    return (
        <div
            className="toastShell"
            style={{
                background: config.shell,
                border: config.border
            }}
        >
            <div className="toastInner">
                <div
                    className="toastIcon"
                    style={{
                        background: config.iconBg
                    }}
                >
                    {config.icon}
                </div>

                <div style={{ minWidth: 0 }}>
                    <div className="toastTitle">{config.title}</div>
                    <div className="toastMessage">{message}</div>
                </div>

                <button className="toastClose" onClick={onClose} aria-label="Chiudi notifica">
                    ×
                </button>
            </div>
        </div>
    );
}