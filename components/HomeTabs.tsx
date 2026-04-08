"use client";

type Tab = "live" | "clips" | "sounds" | "cat";

const tabs: { key: Tab; label: string }[] = [
  { key: "live", label: "Live" },
  { key: "clips", label: "Clip" },
  { key: "sounds", label: "Suoni" },
  { key: "cat", label: "Il tuo gatto" }
];

export default function HomeTabs({
  value,
  onChange
}: {
  value: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <div className="tabs" aria-label="Sezioni principali">
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
