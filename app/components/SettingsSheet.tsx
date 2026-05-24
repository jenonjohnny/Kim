"use client";
import { useEffect, useRef, useState } from "react";

export interface AreaItem { id: string; name: string; emoji: string | null; }

const STORAGE_HIDDEN = "hidden_areas";
const STORAGE_PINNED = "pinned_areas";
const STORAGE_THEME  = "app_theme";

export function getVisibleAreaIds(all: AreaItem[]): string[] {
  if (typeof window === "undefined") return all.map(a => a.id);
  const hidden: string[] = JSON.parse(localStorage.getItem(STORAGE_HIDDEN) || "[]");
  return all.filter(a => !hidden.includes(a.id)).map(a => a.id);
}

export function getPinnedAreaIds(): string[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(STORAGE_PINNED) || "[]");
}

function sortAreas(areas: AreaItem[], pinned: string[]): AreaItem[] {
  return [...areas].sort((a, b) => {
    const ap = pinned.includes(a.id) ? 0 : 1;
    const bp = pinned.includes(b.id) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.name.localeCompare(b.name, "th");
  });
}

/* ── Sub-components ── */
function SectionLabel({ title, hint }: { title: string; hint?: string }) {
  return (
    <div style={{ padding: "18px 20px 6px", display: "flex", alignItems: "baseline", gap: 8 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase" as const }}>
        {title}
      </span>
      {hint && <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 400 }}>{hint}</span>}
    </div>
  );
}

function SettingsRow({ icon, label, value, dim, right }: {
  icon: string; label: string; value?: string; dim?: boolean; right?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "13px 20px", borderBottom: "1px solid var(--border-soft)",
    }}>
      <span style={{ fontSize: 16, width: 24, textAlign: "center", flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 13, color: dim ? "var(--text-3)" : "var(--text-1)" }}>{label}</span>
      {value && <span style={{ fontSize: 11, color: "var(--text-3)" }}>{value}</span>}
      {right}
    </div>
  );
}

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{
      width: 44, height: 26, borderRadius: 13, flexShrink: 0, cursor: "pointer",
      background: on ? "var(--green)" : "var(--bg-raised)",
      border: `1.5px solid ${on ? "var(--green)" : "var(--border)"}`,
      position: "relative", transition: "background 0.2s, border-color 0.2s",
    }}>
      <div style={{
        position: "absolute", top: 3,
        left: on ? 20 : 3,
        width: 18, height: 18, borderRadius: "50%",
        background: on ? "#fff" : "var(--text-3)",
        transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      }} />
    </div>
  );
}

/* ── Eye icons (SVG) ── */
function EyeOn() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function EyeOff() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

/* ── Area section header ── */
function AreaSectionHeader({ label, count, actionLabel, onAction }: {
  label: string; count: number; actionLabel: string; onAction: () => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 20px 6px",
    }}>
      <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>
        {label} · {count}
      </span>
      <button onClick={onAction} style={{
        background: "none", border: "none", cursor: "pointer",
        fontSize: 11, color: "var(--steel-teal)", fontWeight: 600, padding: "2px 0",
      }}>
        {actionLabel}
      </button>
    </div>
  );
}

/* ── Area row: compact, eye icon, long-press = pin ── */
function AreaRow({ area, visible, pinned, onToggle, onPin }: {
  area: AreaItem; visible: boolean; pinned: boolean;
  onToggle: () => void; onPin: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressing, setPressing] = useState(false);

  const startPress = () => {
    setPressing(true);
    timerRef.current = setTimeout(() => {
      onPin();
      setPressing(false);
      try { navigator.vibrate(40); } catch (_) {}
    }, 500);
  };
  const cancelPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPressing(false);
  };

  return (
    <div
      onTouchStart={startPress} onTouchEnd={cancelPress} onTouchMove={cancelPress}
      onMouseDown={startPress} onMouseUp={cancelPress} onMouseLeave={cancelPress}
      style={{
        display: "flex", alignItems: "center",
        padding: "7px 20px 7px 16px",
        borderBottom: "1px solid var(--border-soft)",
        background: pressing ? "var(--brand-soft)" : "transparent",
        transition: "background 0.1s",
        userSelect: "none", WebkitUserSelect: "none",
      } as React.CSSProperties}
    >
      {/* Emoji */}
      <span style={{ fontSize: 14, width: 20, textAlign: "center", flexShrink: 0, marginRight: 8 }}>
        {pinned ? "📌" : (area.emoji || "📁")}
      </span>
      {/* Name */}
      <span style={{
        flex: 1, fontSize: 13,
        color: pinned ? "var(--amber)" : visible ? "var(--text-1)" : "var(--text-3)",
        fontWeight: pinned ? 600 : 400,
      }}>
        {area.name}
      </span>
      {/* Eye toggle */}
      <button onClick={onToggle} style={{
        background: "none", border: "none", cursor: "pointer", padding: "4px",
        color: visible ? "var(--text-2)" : "var(--border)",
        display: "flex", alignItems: "center",
        flexShrink: 0,
      }}>
        {visible ? <EyeOn /> : <EyeOff />}
      </button>
    </div>
  );
}

/* ── Main Sheet ── */
export default function SettingsSheet({ onClose }: { onClose: () => void }) {
  const [areas, setAreas]     = useState<AreaItem[]>([]);
  const [hidden, setHidden]   = useState<string[]>([]);
  const [pinned, setPinned]   = useState<string[]>([]);
  const [theme, setTheme]     = useState<"dark" | "light">("dark");
  const [loading, setLoading] = useState(true);
  const [areasOpen, setAreasOpen] = useState(false);

  useEffect(() => {
    setHidden(JSON.parse(localStorage.getItem(STORAGE_HIDDEN) || "[]"));
    setPinned(JSON.parse(localStorage.getItem(STORAGE_PINNED) || "[]"));
    const saved = localStorage.getItem(STORAGE_THEME) as "dark" | "light" | null;
    setTheme(saved || "dark");
    fetch("/api/areas")
      .then(r => r.json())
      .then(d => { setAreas(d.areas || []); setLoading(false); });
  }, []);

  const toggleHidden = (id: string) =>
    setHidden(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(STORAGE_HIDDEN, JSON.stringify(next));
      return next;
    });

  const togglePin = (id: string) =>
    setPinned(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(STORAGE_PINNED, JSON.stringify(next));
      return next;
    });

  const toggleTheme = () =>
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_THEME, next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });

  const sorted = sortAreas(areas, pinned);

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      }} />

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 51,
        background: "var(--bg-card)",
        borderRadius: "20px 20px 0 0",
        border: "1px solid var(--border)",
        paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
        maxHeight: "82dvh", overflowY: "auto",
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border)" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 20px 2px" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>ตั้งค่า</span>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: 18,
            color: "var(--text-3)", cursor: "pointer", padding: "4px 6px",
          }}>✕</button>
        </div>

        {/* ── บัญชีผู้ใช้ ── */}
        <SectionLabel title="บัญชีผู้ใช้" />
        <SettingsRow icon="🔗" label="Notion Workspace" value="เชื่อมต่อแล้ว ✓" />
        <SettingsRow icon="👤" label="โปรไฟล์ & ชื่อผู้ใช้" value="เร็วๆ นี้" dim />
        <SettingsRow icon="🔑" label="เปลี่ยน Notion Token" value="เร็วๆ นี้" dim />

        {/* ── หน้าจอ ── */}
        <SectionLabel title="หน้าจอ" />
        <SettingsRow
          icon={theme === "dark" ? "🌙" : "☀️"}
          label={theme === "dark" ? "โหมดมืด" : "โหมดสว่าง"}
          right={<ToggleSwitch on={theme === "light"} onToggle={toggleTheme} />}
        />
        <SettingsRow icon="🌐" label="ภาษา" value="ไทย — เร็วๆ นี้" dim />
        <SettingsRow icon="🎨" label="Custom Icons & Themes" value="เร็วๆ นี้" dim />

        {/* ── พื้นที่ ── */}
        <button
          onClick={() => setAreasOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            width: "100%", padding: "18px 20px 10px",
            background: "none", border: "none", cursor: "pointer",
            borderTop: "1px solid var(--border-soft)",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase" as const }}>พื้นที่</span>
            <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 400 }}>· กดค้างเพื่อปักหมุด</span>
          </div>
          <span style={{ fontSize: 12, color: "var(--text-3)", transition: "transform 0.2s", display: "inline-block", transform: areasOpen ? "rotate(180deg)" : "none" }}>▼</span>
        </button>

        {areasOpen && (loading ? (
          <div style={{ color: "var(--text-3)", fontSize: 13, padding: "0 20px 12px" }}>กำลังโหลด...</div>
        ) : (() => {
          const visibleAreas = sorted.filter(a => !hidden.includes(a.id));
          const hiddenAreas  = sorted.filter(a =>  hidden.includes(a.id));
          return (
            <>
              {/* Shown */}
              <AreaSectionHeader
                label="แสดงอยู่" count={visibleAreas.length}
                actionLabel="ซ่อนทั้งหมด"
                onAction={() => {
                  const next = areas.map(a => a.id);
                  setHidden(next);
                  localStorage.setItem(STORAGE_HIDDEN, JSON.stringify(next));
                }}
              />
              <div style={{ border: "1px solid var(--border-soft)", borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
                {visibleAreas.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--text-3)", padding: "10px 20px" }}>ไม่มีพื้นที่ที่แสดง</div>
                ) : visibleAreas.map(area => (
                  <AreaRow key={area.id} area={area} visible={true}
                    pinned={pinned.includes(area.id)}
                    onToggle={() => toggleHidden(area.id)}
                    onPin={() => togglePin(area.id)}
                  />
                ))}
              </div>

              {/* Hidden */}
              {hiddenAreas.length > 0 && (
                <>
                  <AreaSectionHeader
                    label="ซ่อนอยู่" count={hiddenAreas.length}
                    actionLabel="แสดงทั้งหมด"
                    onAction={() => {
                      setHidden([]);
                      localStorage.setItem(STORAGE_HIDDEN, "[]");
                    }}
                  />
                  <div style={{ border: "1px solid var(--border-soft)", borderRadius: 10, overflow: "hidden", marginBottom: 4 }}>
                    {hiddenAreas.map(area => (
                      <AreaRow key={area.id} area={area} visible={false}
                        pinned={pinned.includes(area.id)}
                        onToggle={() => toggleHidden(area.id)}
                        onPin={() => togglePin(area.id)}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          );
        })())}

        {/* Footer */}
        <div style={{ padding: "16px 20px 0", borderTop: "1px solid var(--border-soft)", marginTop: 16 }}>
          <div style={{ fontSize: 10, color: "var(--text-3)", textAlign: "center", lineHeight: 1.9 }}>
            Personal OS v1.0 · เชื่อมกับ Notion<br />
            ข้อมูลทั้งหมดอยู่ใน Notion ส่วนตัวของคุณ
          </div>
        </div>
      </div>
    </>
  );
}
