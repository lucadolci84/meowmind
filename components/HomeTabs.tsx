"use client";

type Tab =
    | "record"
    | "live"
    | "reaction"
    | "speak"
    | "profile"
    | "diary";

const tabs: { key: Tab; label: string }[] = [
    { key: "live", label: "⚡ Live Interpreter" },
    { key: "reaction", label: "📹 Reaction Recorder" },
    { key: "record", label: "🎙 Ascolta" },
    { key: "speak", label: "😺 Parla al gatto" },
    { key: "profile", label: "🧠 Profilo" },
    { key: "diary", label: "📊 Diario" }
];

export default function HomeTabs({
    value,
    onChange
}: {
    value: Tab;
    onChange: (tab: Tab) => void;
}) {
    return (
        <div className="tabs">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    className={`tabButton ${value === tab.key ? "active" : ""}`}
                    onClick={() => onChange(tab.key)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}