"use client";

export type Tab = "home" | "tasks" | "okr";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "home",  label: "วันนี้", icon: "◈" },
  { id: "tasks", label: "งาน",   icon: "≡" },
  { id: "okr",   label: "OKR",   icon: "🎯" },
];

export default function Nav({
  active, onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
      background: "rgba(11,11,16,0.95)",
      backdropFilter: "blur(24px)",
      borderTop: "1px solid var(--border-soft)",
      padding: "8px 0 calc(8px + env(safe-area-inset-bottom))",
      display: "flex", justifyContent: "center",
    }}>
      <div style={{ display: "flex", width: "100%", padding: "0 16px" }}>
        {TABS.map(tab => {
          const on = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                flex: 1,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "7px 4px 8px",
                background: on ? "var(--brand-soft)" : "none",
                border: "none", cursor: "pointer",
                borderRadius: 12,
                transition: "background 0.18s",
              }}
            >
              <span style={{
                fontSize: 18, lineHeight: 1,
                color: on ? "var(--amber)" : "var(--text-3)",
                transition: "color 0.18s",
              }}>
                {tab.icon}
              </span>
              <span style={{
                fontSize: 10, fontWeight: on ? 700 : 400,
                color: on ? "var(--amber)" : "var(--text-3)",
                letterSpacing: "0.03em",
                transition: "color 0.18s",
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
