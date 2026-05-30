"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  LinkIcon, UserIcon, KeyIcon, MoonIcon, SunIcon, GlobeIcon, SliderIcon,
  EyeIcon, EyeOffIcon, PinIcon, GearIcon,
} from "./icons";

export interface AreaItem { id: string; name: string; emoji: string | null; }

export const STORAGE_HIDDEN = "hidden_areas";
export const STORAGE_PINNED = "pinned_areas";
export const STORAGE_THEME  = "app_theme";

export function togglePinArea(id: string): string[] {
  if (typeof window === "undefined") return [];
  const prev: string[] = JSON.parse(localStorage.getItem(STORAGE_PINNED) || "[]");
  const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
  localStorage.setItem(STORAGE_PINNED, JSON.stringify(next));
  return next;
}

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
  icon: React.ReactNode; label: string; value?: string; dim?: boolean; right?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "13px 20px", borderBottom: "1px solid var(--border-soft)",
    }}>
      <span style={{ width: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--icon-tint)" }}>{icon}</span>
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
      background: on ? "var(--brand)" : "var(--bg-raised)",
      border: `1.5px solid ${on ? "var(--brand)" : "var(--border)"}`,
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

/* Eye icons now imported from icons.tsx */

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
        fontSize: 11, color: "var(--brand)", fontWeight: 600, padding: "2px 0",
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
      {/* Pin / area icon */}
      <span style={{ width: 20, display: "flex", justifyContent: "center", flexShrink: 0, marginRight: 8 }}>
        {pinned
          ? <PinIcon size={15} color="var(--brand)" />
          : <span style={{ fontSize: 14 }}>{area.emoji || "·"}</span>
        }
      </span>
      {/* Name */}
      <span style={{
        flex: 1, fontSize: 13,
        color: pinned ? "var(--brand)" : visible ? "var(--text-1)" : "var(--text-3)",
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
        {visible ? <EyeIcon size={17} /> : <EyeOffIcon size={17} />}
      </button>
    </div>
  );
}

/* ── Main Sheet ── */
export default function SettingsSheet({ onClose }: { onClose: () => void }) {
  const [areas, setAreas]       = useState<AreaItem[]>([]);
  const [hidden, setHidden]     = useState<string[]>([]);
  const [pinned, setPinned]     = useState<string[]>([]);
  const [theme, setTheme]       = useState<"dark" | "light">("dark");
  const [iconTint, setIconTint] = useState("#949597");
  const [loading, setLoading]   = useState(true);
  const [areasError, setAreasError] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);
  const [profileName, setProfileName] = useState("คิม");
  const [editingName, setEditingName] = useState(false);
  const nameInputRef   = useRef<HTMLInputElement>(null);
  const settingsDragRef= useRef<{startY:number; dy:number}|null>(null);
  const [sheetTransY,   setSheetTransY]   = useState(0);
  const [sheetDragging, setSheetDragging] = useState(false);

  useEffect(() => {
    setHidden(JSON.parse(localStorage.getItem(STORAGE_HIDDEN) || "[]"));
    setPinned(JSON.parse(localStorage.getItem(STORAGE_PINNED) || "[]"));
    const saved = localStorage.getItem(STORAGE_THEME) as "dark" | "light" | null;
    setTheme(saved || "dark");
    const savedTint = localStorage.getItem("icon_tint");
    if (savedTint) {
      setIconTint(savedTint);
      document.documentElement.style.setProperty("--icon-tint", savedTint);
    }
    const savedName = localStorage.getItem("profile_name");
    if (savedName) setProfileName(savedName);
    fetch("/api/areas")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setAreas(d.areas || []); })
      .catch(() => { setAreasError(true); })
      .finally(() => { setLoading(false); });
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

  const applyIconTint = (color: string) => {
    setIconTint(color);
    localStorage.setItem("icon_tint", color);
    document.documentElement.style.setProperty("--icon-tint", color);
  };

  const ICON_TINTS = [
    { label: "Gray",      value: "#949597" },
    { label: "Amber",     value: "var(--brand)" },
    { label: "Teal",      value: "#335c67" },
    { label: "Gold",      value: "#dfa040" },
    { label: "White",     value: "#e8e8e8" },
    { label: "Cream",     value: "#ede4a0" },
  ];

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
        transform: `translateY(${sheetTransY}px)`,
        transition: sheetDragging ? "none" : "transform 0.22s ease-out",
      }}>
        {/* Handle — swipe down to dismiss */}
        <div
          style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px", cursor: "s-resize", touchAction: "none", userSelect: "none" } as React.CSSProperties}
          onPointerDown={e => {
            e.currentTarget.setPointerCapture(e.pointerId);
            settingsDragRef.current = { startY: e.clientY, dy: 0 };
            setSheetDragging(true);
            setSheetTransY(0);
          }}
          onPointerMove={e => {
            if (!settingsDragRef.current) return;
            const dy = e.clientY - settingsDragRef.current.startY;
            settingsDragRef.current.dy = dy;
            if (dy > 0) setSheetTransY(dy);
          }}
          onPointerUp={() => {
            if (!settingsDragRef.current) return;
            const dy = settingsDragRef.current.dy;
            settingsDragRef.current = null;
            setSheetDragging(false);
            if (dy > 100) onClose();
            else setSheetTransY(0);
          }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border)" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 20px 2px" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>ตั้งค่า</span>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", padding: "4px 6px",
            display: "flex", alignItems: "center", color: "var(--text-3)",
          }}>
            <GearIcon size={16} color="var(--text-3)" />
          </button>
        </div>

        {/* ── บัญชีผู้ใช้ ── */}
        <SectionLabel title="บัญชีผู้ใช้" />
        <SettingsRow icon={<LinkIcon size={16} />} label="Notion Workspace" value="เชื่อมต่อแล้ว ✓" />

        {/* Profile name — editable inline */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "13px 20px", borderBottom: "1px solid var(--border-soft)",
        }}>
          <span style={{ width: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--icon-tint)" }}>
            <UserIcon size={16} />
          </span>
          <span style={{ fontSize: 13, color: "var(--text-1)", flexShrink: 0 }}>ชื่อที่แสดง</span>
          {editingName ? (
            <input
              ref={nameInputRef}
              defaultValue={profileName}
              onBlur={e => {
                const val = e.target.value.trim() || "คิม";
                setProfileName(val);
                localStorage.setItem("profile_name", val);
                // dispatch event so Greeting updates without reload
                window.dispatchEvent(new Event("profile-name-change"));
                setEditingName(false);
              }}
              onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") (e.target as HTMLInputElement).blur(); }}
              autoFocus
              style={{
                flex: 1, background: "var(--bg-input)",
                border: "1.5px solid var(--brand)", borderRadius: 8,
                padding: "5px 10px", fontSize: 13, color: "var(--text-1)",
                fontFamily: "inherit", outline: "none",
              }}
            />
          ) : (
            <button
              onClick={() => { setEditingName(true); setTimeout(() => nameInputRef.current?.focus(), 30); }}
              style={{
                flex: 1, textAlign: "left", background: "var(--bg-input)",
                border: "1px solid var(--border)", borderRadius: 8,
                padding: "5px 10px", fontSize: 13,
                color: "var(--text-2)", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {profileName}
            </button>
          )}
        </div>

        <SettingsRow icon={<KeyIcon size={16} />} label="เปลี่ยน Notion Token" value="เร็วๆ นี้" dim />

        {/* ── หน้าจอ ── */}
        <SectionLabel title="หน้าจอ" />
        <SettingsRow
          icon={theme === "dark" ? <MoonIcon size={16} /> : <SunIcon size={16} />}
          label={theme === "dark" ? "โหมดมืด" : "โหมดสว่าง"}
          right={<ToggleSwitch on={theme === "light"} onToggle={toggleTheme} />}
        />
        <SettingsRow icon={<GlobeIcon size={16} />} label="ภาษา" value="ไทย — เร็วๆ นี้" dim />

        {/* ── ไอคอน & สี ── */}
        <SectionLabel title="ไอคอน & สี" hint="· เลือก tint สำหรับ icon ทั้งหมด" />
        <div style={{ padding: "8px 20px 16px" }}>
          {/* Tint color presets */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {ICON_TINTS.map(t => {
              const on = iconTint === t.value;
              return (
                <button key={t.value} onClick={() => applyIconTint(t.value)} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                  background: "none", border: "none", cursor: "pointer", padding: "4px 2px",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: t.value,
                    border: `2px solid ${on ? "var(--brand)" : "var(--border)"}`,
                    boxShadow: on ? "0 0 0 3px rgba(255,185,0,0.25)" : "none",
                    transition: "all 0.15s",
                  }} />
                  <span style={{ fontSize: 9, color: on ? "var(--brand)" : "var(--text-3)", fontWeight: on ? 700 : 400 }}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Upload icon pack placeholder */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", borderRadius: 10,
            border: "1px dashed var(--border)", opacity: 0.6,
          }}>
            <SliderIcon size={16} color="var(--text-3)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 600 }}>อัพโหลด Icon Pack</div>
              <div style={{ fontSize: 10, color: "var(--text-3)" }}>เร็วๆ นี้ — แต่งแอพด้วย icon ของตัวเอง</div>
            </div>
          </div>
        </div>

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
        ) : areasError ? (
          <div style={{ color: "var(--text-3)", fontSize: 13, padding: "0 20px 12px" }}>
            ไม่สามารถโหลด Areas ได้ · ตรวจสอบ Notion token ค่ะ
          </div>
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
