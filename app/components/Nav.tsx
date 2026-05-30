"use client";
import { HomeIcon, ListIcon, CalendarIcon, TargetIcon, RobotIcon } from "./icons";

export type Tab = "home" | "tasks" | "chat" | "calendar" | "okr";

const TABS: { id: Tab; label: string; Icon: React.FC<{ size?: number; color?: string }> }[] = [
  { id: "home",     label: "วันนี้",  Icon: HomeIcon     },
  { id: "tasks",    label: "งาน",    Icon: ListIcon     },
  { id: "chat",     label: "คิม",    Icon: RobotIcon    },
  { id: "calendar", label: "ตาราง",  Icon: CalendarIcon },
  { id: "okr",      label: "OKR",    Icon: TargetIcon   },
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
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "7px 4px 8px",
                background: on ? "var(--brand-soft)" : "none",
                border: "none", cursor: "pointer",
                borderRadius: 12,
                transition: "background 0.18s",
                color: on ? "var(--icon-active)" : "var(--icon-tint)",
              }}
            >
              <tab.Icon size={20} color={on ? "var(--icon-active)" : "var(--icon-tint)"} />
              <span style={{
                fontSize: 10, fontWeight: on ? 700 : 400,
                color: on ? "var(--amber)" : "var(--icon-tint)",
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
