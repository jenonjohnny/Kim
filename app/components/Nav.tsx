"use client";
import { HomeIcon, ListIcon, CalendarIcon, TargetIcon, RobotIcon } from "./icons";

export type Tab = "home" | "tasks" | "chat" | "calendar" | "okr";

const TABS: { id: Tab; label: string; Icon: React.FC<{ size?: number; color?: string }> }[] = [
  { id: "home",     label: "วันนี้",  Icon: HomeIcon     },
  { id: "tasks",    label: "งาน",    Icon: ListIcon     },
  { id: "chat",     label: "Norte",  Icon: RobotIcon    },
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
      background: "rgba(10,10,15,0.92)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      borderTop: "1px solid rgba(30,30,42,0.8)",
      padding: "8px 0 calc(8px + env(safe-area-inset-bottom))",
      display: "flex", justifyContent: "center",
    }}>
      <div style={{ display: "flex", width: "100%", padding: "0 12px" }}>
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
                background: "none",
                border: "none", cursor: "pointer",
                borderRadius: 12,
                transition: "all 0.18s",
                color: on ? "var(--brand)" : "var(--icon-tint)",
              }}
            >
              <tab.Icon size={20} color={on ? "var(--brand)" : "var(--icon-tint)"} />
              <span style={{
                fontSize: 10, fontWeight: on ? 700 : 500,
                color: on ? "var(--brand)" : "var(--icon-tint)",
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
