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
    const bg =
        type === "success"
            ? "rgba(113, 227, 155, 0.16)"
            : type === "error"
                ? "rgba(255, 107, 107, 0.16)"
                : "rgba(110, 124, 255, 0.16)";

    const border =
        type === "success"
            ? "rgba(113, 227, 155, 0.45)"
            : type === "error"
                ? "rgba(255, 107, 107, 0.45)"
                : "rgba(110, 124, 255, 0.45)";

    return (
        <div
            style={{
                position: "fixed",
                right: 20,
                bottom: 20,
                zIndex: 1200,
                minWidth: 280,
                maxWidth: 420,
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 16,
                padding: "14px 16px",
                backdropFilter: "blur(8px)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
            }}
        >
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>{message}</div>
                <button
                    onClick={onClose}
                    style={{
                        border: "none",
                        background: "transparent",
                        color: "white",
                        fontSize: 16,
                        cursor: "pointer"
                    }}
                >
                    ×
                </button>
            </div>
        </div>
    );
}