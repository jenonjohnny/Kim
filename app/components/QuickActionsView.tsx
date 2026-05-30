"use client";
import React, { useState, useRef } from "react";
import { ChevronDownIcon } from "./icons";
import { TaskData } from "./types";

/* ──────────────────────────────────────────
   OKR CONFIG
   Q2 2569: 14 พ.ค. — 13 ส.ค. 2569 (92 วัน)
────────────────────────────────────────── */
const OKR_START         = new Date("2026-05-14");
const OKR_DAYS          = 92;
const OKR_INCOME_TARGET = 20000;

/* ── localStorage helpers ── */
function ls(key: string, def: string) {
  if (typeof window === "undefined") return def;
  return localStorage.getItem(key) ?? def;
}
function lsSet(key: string, val: string) { localStorage.setItem(key, val); }

const DISCIPLINES = ["Brand Identity", "Social Media", "Packaging / NPD", "Motion / Video", "Editorial / Print"];

/* ── Milestones ── */
const MILESTONE_LIST = [
  { id: "m1", title: "เริ่ม norte-app development",      date: "1 พ.ค.",   defaultDone: true  },
  { id: "m2", title: "สร้าง Design System เบื้องต้น",    date: "15 พ.ค.",  defaultDone: true  },
  { id: "m3", title: "Blue mockup + redesign Norte",      date: "30 พ.ค.",  defaultDone: false },
  { id: "m4", title: "Launch MVP app จริง",               date: "30 มิ.ย.", defaultDone: false },
];

/* ── Progress bar — Norte v2 ── */
function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const w = Math.min(pct * 100, 100);
  return (
    <div style={{ height: 6, background: "var(--bg-raised)", borderRadius: 10, overflow: "visible", position: "relative" }}>
      <div style={{
        height: "100%", width: `${w}%`,
        background: `linear-gradient(90deg, ${color}99 0%, ${color} 100%)`,
        borderRadius: 10, position: "relative",
        transition: "width 0.5s ease",
        minWidth: w > 0 ? 10 : 0,
      }}>
        {w > 0 && (
          <div style={{
            position: "absolute", right: 0, top: "50%",
            transform: "translate(50%, -50%)",
            width: 10, height: 10, borderRadius: "50%",
            background: color, boxShadow: `0 0 8px ${color}66`,
          }} />
        )}
      </div>
    </div>
  );
}

/* ── KR row ── */
function KRRow({ label, pct, color, pctLabel, children }: { label: string; pct: number; color: string; pctLabel?: string; children?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 11, color, fontWeight: 700 }}>{pctLabel ?? `${Math.round(pct * 100)}%`}</span>
      </div>
      <ProgressBar pct={pct} color={color} />
      {children && <div style={{ marginTop: 8 }}>{children}</div>}
    </div>
  );
}

/* ── Counter ── */
function Counter({ value, min, max, onChange, color }: { value: number; min: number; max: number; onChange: (n: number) => void; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} style={{ width: 24, height: 24, borderRadius: 6, background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-2)", fontSize: 14, cursor: "pointer" }}>−</button>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 28, textAlign: "center" }}>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} style={{ width: 24, height: 24, borderRadius: 6, background: "var(--bg-raised)", border: "1px solid var(--border)", color, fontSize: 14, cursor: "pointer" }}>+</button>
    </div>
  );
}

/* ── Tool chip ── */
function ToolChip({ label, on, onTap, onLongPress }: { label: string; on: boolean; onTap: () => void; onLongPress: () => void }) {
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPress = () => { timerRef.current = setTimeout(() => { onLongPress(); try { navigator.vibrate(30); } catch {} }, 500); };
  const cancelPress = () => { if (timerRef.current) clearTimeout(timerRef.current); };
  return (
    <button
      onClick={onTap}
      onTouchStart={startPress} onTouchEnd={cancelPress} onTouchMove={cancelPress}
      onMouseDown={startPress} onMouseUp={cancelPress} onMouseLeave={cancelPress}
      onContextMenu={e => { e.preventDefault(); onLongPress(); }}
      style={{
        padding: "5px 12px", borderRadius: 8, fontSize: 10, cursor: "pointer",
        background: on ? "var(--brand-soft)" : "var(--bg-raised)",
        border: `1px solid ${on ? "rgba(0,129,255,0.35)" : "var(--border)"}`,
        color: on ? "var(--brand)" : "var(--text-3)", fontWeight: on ? 700 : 400,
        userSelect: "none", WebkitUserSelect: "none",
        display: "flex", alignItems: "center", gap: 4,
      } as React.CSSProperties}
    >
      {on && (
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M1 4l2.5 2.5 3.5-4"/>
        </svg>
      )}
      {label}
    </button>
  );
}

/* ── OKR Card ── */
function OKRCard({ children, status }: { children: React.ReactNode; status?: "behind" | "ontrack" }) {
  const borderColor = status === "behind" ? "rgba(0,129,255,0.18)" : "var(--border)";
  return (
    <div style={{
      marginBottom: 12,
      background: "var(--bg-card)",
      border: `1px solid ${borderColor}`,
      borderRadius: 18, padding: 18,
      position: "relative", overflow: "hidden",
    }}>
      {/* Glow blob */}
      <div style={{
        position: "absolute", top: -30, right: -30,
        width: 80, height: 80, borderRadius: "50%",
        background: "var(--brand-glow)", filter: "blur(20px)",
        pointerEvents: "none",
      }} />
      {children}
    </div>
  );
}

/* ── Card header row ── */
function OKRCardHeader({ icon, title, sub, pct, pctStatus }: {
  icon: React.ReactNode; title: string; sub: string;
  pct: number; pctStatus: "ontrack" | "behind";
}) {
  const pctColor = pctStatus === "ontrack" ? "var(--brand)" : "#ff9500";
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
      <div>
        <div style={{ marginBottom: 6 }}>{icon}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 2, lineHeight: 1.3 }}>{title}</div>
        <div style={{ fontSize: 11, color: "var(--text-3)" }}>{sub}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{
          fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em",
          color: pctColor,
          ...(pctStatus === "behind" ? {
            background: "rgba(255,149,0,0.10)",
            border: "1px solid rgba(255,149,0,0.25)",
            borderRadius: 8, padding: "2px 8px",
          } : {}),
        }}>
          {Math.round(pct * 100)}%
        </div>
        <span style={{
          fontSize: 9, color: pctColor, display: "block", marginTop: 1,
          fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const,
        }}>
          {pctStatus === "ontrack" ? "complete" : "ล้าหลัง"}
        </span>
      </div>
    </div>
  );
}

/* ── Collapsible section ── */
function CollapsibleSection({ label, count, children, defaultOpen = false }: { label: string; count?: number; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 12 }}>
      <button onClick={() => setOpen(v => !v)} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "12px 0 10px",
        background: "transparent", border: "none", cursor: "pointer",
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {count !== undefined && (
            <span style={{ fontSize: 10, color: "var(--brand)", background: "var(--brand-soft)", borderRadius: 20, padding: "2px 8px", border: "1px solid rgba(0,129,255,0.2)", fontWeight: 700 }}>{count}</span>
          )}
          <span style={{ display: "flex", transform: open ? "none" : "rotate(-90deg)", transition: "transform 0.2s" }}>
            <ChevronDownIcon size={12} color="var(--text-3)" />
          </span>
        </span>
      </button>
      {open && children}
    </div>
  );
}

/* ══════════════════════════════════════════
   OKR TRACKER — O1, O2, O3
══════════════════════════════════════════ */
function OKRTracker() {
  const now = new Date();
  const daysElapsed = Math.max(0, Math.floor((now.getTime() - OKR_START.getTime()) / 86400000));
  const daysLeft    = Math.max(OKR_DAYS - daysElapsed, 0);
  const timePct     = Math.min(daysElapsed / OKR_DAYS, 1);

  /* O1 */
  const [portfolio,  setPortfolio]  = useState<string[]>(() => JSON.parse(ls("okr_portfolio", "[]")));
  const [projects,   setProjects]   = useState(() => parseInt(ls("okr_projects", "0")));
  const [courseDone, setCourseDone] = useState(() => ls("okr_course", "0") === "1");

  /* O2 */
  const [income,      setIncome]      = useState(() => parseInt(ls("okr_income", "0")));
  const [freelance,   setFreelance]   = useState(() => parseInt(ls("okr_freelance", "0")));
  const [digital,     setDigital]     = useState(() => parseInt(ls("okr_digital", "0")));
  const [boardGame,   setBoardGame]   = useState(() => parseInt(ls("okr_boardgame", "0")));
  const [clientsOut,  setClientsOut]  = useState(() => parseInt(ls("okr_clients_out", "0")));
  const [firstClient, setFirstClient] = useState(() => ls("okr_first_client", "0") === "1");

  /* O3 */
  const [sessions,    setSessions]    = useState(() => parseInt(ls("okr_sessions", "0")));
  const [notes,       setNotes]       = useState(() => parseInt(ls("okr_notes", "0")));
  const [tools,       setTools]       = useState<string[]>(() => JSON.parse(ls("okr_tools", "[]")));
  const [toolNames,   setToolNames]   = useState<[string, string]>(() => {
    try { return JSON.parse(ls("okr_tool_names", JSON.stringify(["Figma", "Framer"]))); } catch { return ["Figma", "Framer"]; }
  });
  const [editingTool, setEditingTool] = useState<number | null>(null);

  /* Milestones */
  const [mDone, setMDone] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(ls("okr_milestones", "null"));
      if (saved) return saved;
    } catch {}
    return MILESTONE_LIST.filter(m => m.defaultDone).map(m => m.id);
  });
  const toggleMilestone = (id: string) => {
    setMDone(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      lsSet("okr_milestones", JSON.stringify(next));
      return next;
    });
  };

  /* Scores */
  const totalIncome = freelance + digital + boardGame;
  const o1Score  = ((portfolio.length / 5) * 0.4) + (Math.min(projects / 3, 1) * 0.4) + (courseDone ? 0.2 : 0);
  const o2Score  = (Math.min(clientsOut / 5, 1) * 0.25) + (firstClient ? 0.25 : 0) + (Math.min(Math.max(income, totalIncome) / OKR_INCOME_TARGET, 1) * 0.5);
  const o3Score  = (Math.min(sessions / 12, 1) * 0.4) + (Math.min(notes / 8, 1) * 0.3) + (Math.min(tools.length / 2, 1) * 0.3);
  const totalScore = (o1Score * 0.4) + (o2Score * 0.35) + (o3Score * 0.25);
  const totalPct   = Math.round(totalScore * 100);

  const toggleArr = (arr: string[], val: string, key: string, setter: (a: string[]) => void) => {
    const next = arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
    setter(next); lsSet(key, JSON.stringify(next));
  };

  const o1Status: "ontrack" | "behind" = o1Score >= timePct ? "ontrack" : "behind";
  const o2Status: "ontrack" | "behind" = o2Score >= timePct ? "ontrack" : "behind";
  const o3Status: "ontrack" | "behind" = o3Score >= timePct ? "ontrack" : "behind";

  /* income combined */
  const effectiveIncome = Math.max(income, totalIncome);

  return (
    <>
      {/* ── Stats grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {[
          { num: daysElapsed, unit: "วันผ่าน",  color: "var(--brand)" },
          { num: daysLeft,    unit: "วันเหลือ", color: "var(--text-2)" },
          { num: totalPct,    unit: "โดยรวม",   color: totalScore >= timePct ? "var(--brand)" : "#ff9500", suffix: "%" },
        ].map(s => (
          <div key={s.unit} style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "14px 10px", textAlign: "center",
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 4 }}>
              {s.num}{s.suffix ?? ""}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.unit}</div>
          </div>
        ))}
      </div>

      {/* ── O1: Art Direction ── */}
      <OKRCard status={o1Status}>
        <OKRCardHeader
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11h18l-9 10z"/><path d="M3 11l3.5-7h11L21 11"/>
            </svg>
          }
          title="Art Direction ครบวงจร"
          sub="Product Design · 3 เดือน"
          pct={o1Score}
          pctStatus={o1Status}
        />

        <KRRow label={`KR1 · Design System ครบ (${portfolio.length}/5)`} pct={portfolio.length / 5} color="var(--brand)">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {DISCIPLINES.map(d => {
              const on = portfolio.includes(d);
              return (
                <button key={d} onClick={() => toggleArr(portfolio, d, "okr_portfolio", setPortfolio)} style={{
                  padding: "4px 8px", borderRadius: 8, fontSize: 10, cursor: "pointer",
                  background: on ? "var(--brand-soft)" : "var(--bg-raised)",
                  border: `1px solid ${on ? "rgba(0,129,255,0.35)" : "var(--border)"}`,
                  color: on ? "var(--brand)" : "var(--text-3)", fontWeight: on ? 700 : 400,
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  {on && <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 4l2.5 2.5 3.5-4"/></svg>}
                  {d}
                </button>
              );
            })}
          </div>
        </KRRow>

        <KRRow label={`KR2 · Launch Brand Identity (${projects}/3)`} pct={Math.min(projects / 3, 1)} color={projects >= 2 ? "var(--brand)" : "#ff9500"}>
          <Counter value={projects} min={0} max={10} color={projects >= 2 ? "var(--brand)" : "#ff9500"}
            onChange={n => { setProjects(n); lsSet("okr_projects", String(n)); }} />
        </KRRow>

        <KRRow label="KR3 · Case Study 2 ชิ้น" pct={courseDone ? 1 : 0} color={courseDone ? "var(--brand)" : "#ff3b30"}
          pctLabel={courseDone ? "100%" : "0%"}>
          {!courseDone && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: "rgba(255,59,48,0.12)", color: "#ff5252", border: "1px solid rgba(255,59,48,0.25)" }}>
              ยังไม่เริ่ม
            </span>
          )}
          <button onClick={() => { const n = !courseDone; setCourseDone(n); lsSet("okr_course", n ? "1" : "0"); }} style={{
            marginTop: courseDone ? 0 : 6,
            padding: "5px 12px", borderRadius: 8, fontSize: 10, cursor: "pointer",
            background: courseDone ? "var(--brand-soft)" : "var(--bg-raised)",
            border: `1px solid ${courseDone ? "rgba(0,129,255,0.35)" : "var(--border)"}`,
            color: courseDone ? "var(--brand)" : "var(--text-3)", fontWeight: courseDone ? 700 : 400,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            {courseDone && <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 4l2.5 2.5 3.5-4"/></svg>}
            {courseDone ? "จบแล้ว" : "ยังไม่จบ"}
          </button>
        </KRRow>
      </OKRCard>

      {/* ── O2: รายได้เสริม ── */}
      <OKRCard status={o2Status}>
        <OKRCardHeader
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="9"/><path d="M12 8v1.5m0 5V16m-2.5-7h4c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5h-3c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5H15"/>
            </svg>
          }
          title="รายได้เสริม 20k/เดือน"
          sub="Income · Stretch 50k"
          pct={o2Score}
          pctStatus={o2Status}
        />

        <KRRow
          label={`KR1 · รายได้สะสม`}
          pct={Math.min(effectiveIncome / OKR_INCOME_TARGET, 1)}
          color="#ff9500"
          pctLabel={`${effectiveIncome.toLocaleString()} / 20,000 ฿`}
        >
          {/* Progress labels */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#ff9500" }}>฿{effectiveIncome.toLocaleString()} ได้แล้ว</span>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>เป้า ฿20,000</span>
          </div>

          {/* Income breakdown grid — matches mockup */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
            {[
              { label: "Freelance",  value: freelance,  setter: setFreelance,  key: "okr_freelance"  },
              { label: "Digital",    value: digital,    setter: setDigital,    key: "okr_digital"    },
              { label: "Board Game", value: boardGame,  setter: setBoardGame,  key: "okr_boardgame"  },
            ].map(src => (
              <div key={src.label} style={{
                background: "var(--bg-raised)", borderRadius: 10, padding: "10px 8px", textAlign: "center",
              }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: src.value > 0 ? "var(--brand)" : "var(--text-3)", lineHeight: 1 }}>
                  {src.value > 0 ? src.value.toLocaleString() : "—"}
                </div>
                <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 2, fontWeight: 600 }}>{src.label}</div>
                {/* +/− controls */}
                <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 6 }}>
                  <button onClick={() => { const n = Math.max(0, src.value - 500); src.setter(n); lsSet(src.key, String(n)); }} style={{ width: 20, height: 20, borderRadius: 5, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-3)", fontSize: 12, cursor: "pointer", lineHeight: 1 }}>−</button>
                  <button onClick={() => { const n = src.value + 500; src.setter(n); lsSet(src.key, String(n)); }} style={{ width: 20, height: 20, borderRadius: 5, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--brand)", fontSize: 12, cursor: "pointer", lineHeight: 1 }}>+</button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick-add buttons */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {[500, 1000, 5000, 10000].map(n => (
              <button key={n} onClick={() => { const next = income + n; setIncome(next); lsSet("okr_income", String(next)); }} style={{
                padding: "5px 10px", borderRadius: 8, cursor: "pointer",
                background: "var(--bg-raised)", border: "1px solid var(--border)",
                color: "#ff9500", fontSize: 10, fontWeight: 600,
              }}>+{n >= 1000 ? `${n/1000}k` : n}</button>
            ))}
            {income > 0 && (
              <button onClick={() => { setIncome(0); lsSet("okr_income", "0"); }} style={{
                padding: "5px 8px", borderRadius: 8, cursor: "pointer",
                background: "none", border: "1px solid var(--border-soft)",
                color: "var(--text-3)", fontSize: 9,
              }}>reset</button>
            )}
          </div>
        </KRRow>

        <KRRow label={`KR2 · Reach out clients (${clientsOut}/5)`} pct={Math.min(clientsOut / 5, 1)} color="var(--brand)">
          <Counter value={clientsOut} min={0} max={20} color="var(--brand)"
            onChange={n => { setClientsOut(n); lsSet("okr_clients_out", String(n)); }} />
        </KRRow>

        <KRRow label="KR3 · ได้ client คนแรก (ก่อน Day 30)" pct={firstClient ? 1 : 0} color="var(--brand)">
          <button onClick={() => { const n = !firstClient; setFirstClient(n); lsSet("okr_first_client", n ? "1" : "0"); }} style={{
            padding: "5px 12px", borderRadius: 8, fontSize: 10, cursor: "pointer",
            background: firstClient ? "var(--brand-soft)" : "var(--bg-raised)",
            border: `1px solid ${firstClient ? "rgba(0,129,255,0.35)" : "var(--border)"}`,
            color: firstClient ? "var(--brand)" : "var(--text-3)", fontWeight: firstClient ? 700 : 400,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            {firstClient && <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 4l2.5 2.5 3.5-4"/></svg>}
            {firstClient ? "มี client แล้ว!" : "ยังไม่มี client"}
          </button>
        </KRRow>
      </OKRCard>

      {/* ── O3: พัฒนาทักษะ ── */}
      <OKRCard status={o3Status}>
        <OKRCardHeader
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 7H20v13H6.5A2.5 2.5 0 014 17.5v-13z"/>
            </svg>
          }
          title="พัฒนาทักษะต่อเนื่อง"
          sub="Learning · 3 เดือน"
          pct={o3Score}
          pctStatus={o3Status}
        />

        <KRRow label={`KR1 · Learning sessions (${sessions}/12)`} pct={Math.min(sessions / 12, 1)} color="var(--brand)">
          <Counter value={sessions} min={0} max={12} color="var(--brand)"
            onChange={n => { setSessions(n); lsSet("okr_sessions", String(n)); }} />
        </KRRow>

        <KRRow label={`KR2 · Notion Learning Notes (${notes}/8)`} pct={Math.min(notes / 8, 1)} color="var(--brand)">
          <Counter value={notes} min={0} max={20} color="var(--brand)"
            onChange={n => { setNotes(n); lsSet("okr_notes", String(n)); }} />
        </KRRow>

        <KRRow label={`KR3 · Tools ใหม่ (${tools.length}/2)`} pct={Math.min(tools.length / 2, 1)} color="var(--brand)">
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {([0, 1] as const).map(i => {
              const key = `tool_${i}`;
              const on = tools.includes(key);
              const name = toolNames[i] || ["Figma", "Framer"][i];
              const isEditing = editingTool === i;
              return isEditing ? (
                <input
                  key={key} autoFocus defaultValue={name}
                  onBlur={e => {
                    const val = e.target.value.trim() || ["Figma", "Framer"][i];
                    const next: [string, string] = [...toolNames] as [string, string];
                    next[i] = val;
                    setToolNames(next); lsSet("okr_tool_names", JSON.stringify(next));
                    setEditingTool(null);
                  }}
                  onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                  style={{
                    padding: "4px 8px", borderRadius: 8, fontSize: 10,
                    background: "var(--bg-raised)", border: "1px solid rgba(0,129,255,0.35)",
                    color: "var(--brand)", fontWeight: 700, outline: "none", width: 90, fontFamily: "inherit",
                  }}
                />
              ) : (
                <ToolChip key={key} label={name} on={on}
                  onTap={() => toggleArr(tools, key, "okr_tools", setTools)}
                  onLongPress={() => setEditingTool(i)} />
              );
            })}
            <span style={{ fontSize: 9, color: "var(--text-3)", alignSelf: "center" }}>กดค้างเพื่อเปลี่ยนชื่อ</span>
          </div>
        </KRRow>
      </OKRCard>

      {/* ── Milestones — matches mockup ── */}
      <div style={{ marginTop: 4, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-3)" }}>Milestones</span>
          <span style={{ fontSize: 11, color: "var(--brand)", fontWeight: 600 }}>ดูทั้งหมด</span>
        </div>
        {MILESTONE_LIST.map((m, idx) => {
          const isDone   = mDone.includes(m.id);
          const isActive = !isDone && MILESTONE_LIST.slice(0, idx).every(x => mDone.includes(x.id));
          return (
            <div
              key={m.id}
              onClick={() => toggleMilestone(m.id)}
              style={{
                background: isActive
                  ? "linear-gradient(90deg, rgba(0,129,255,0.06) 0%, var(--bg-card) 100%)"
                  : "var(--bg-card)",
                border: `1px solid ${isActive ? "rgba(0,129,255,0.2)" : "var(--border)"}`,
                borderRadius: 12, padding: "12px 14px",
                display: "flex", alignItems: "center", gap: 10,
                marginBottom: 8, cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {/* dot */}
              <div style={{
                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                background: isDone ? "var(--brand)" : isActive ? "var(--brand)" : "var(--text-3)",
                opacity: isDone ? 0.5 : 1,
                boxShadow: isActive ? "0 0 6px rgba(0,129,255,0.5)" : "none",
              }} />
              {/* text */}
              <span style={{
                fontSize: 13, fontWeight: 500, flex: 1,
                color: isDone ? "var(--text-3)" : "var(--text-1)",
                textDecoration: isDone ? "line-through" : "none",
              }}>
                {m.title}
              </span>
              {/* date */}
              <span style={{ fontSize: 10, color: isActive ? "var(--brand)" : "var(--text-3)", fontWeight: 500, flexShrink: 0 }}>
                {m.date}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ── Personal Tasks ── */
function PersonalTasks() {
  const [items, setItems] = useState<{ id: string; title: string }[]>(() => {
    try { return JSON.parse(ls("personal_tasks", "[]")); } catch { return []; }
  });
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = () => {
    const t = input.trim();
    if (!t) return;
    const next = [...items, { id: Date.now().toString(), title: t }];
    setItems(next); lsSet("personal_tasks", JSON.stringify(next));
    setInput(""); inputRef.current?.focus();
  };

  const done = (id: string) => {
    try { navigator.vibrate(18); } catch {}
    setTimeout(() => {
      setItems(prev => { const next = prev.filter(x => x.id !== id); lsSet("personal_tasks", JSON.stringify(next)); return next; });
    }, 280);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <input
          ref={inputRef} value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") add(); }}
          placeholder="เพิ่มงานส่วนตัว..."
          style={{
            flex: 1, background: "var(--bg-input)",
            border: `1px solid ${input ? "rgba(0,129,255,0.4)" : "var(--border)"}`,
            borderRadius: 10, padding: "9px 12px", fontSize: 13,
            color: "var(--text-1)", outline: "none", fontFamily: "inherit",
            transition: "border 0.15s",
          }}
        />
        <button onClick={add} disabled={!input.trim()} style={{
          width: 38, height: 38, borderRadius: 10, border: "none", flexShrink: 0,
          background: input.trim() ? "var(--brand)" : "var(--border)",
          color: input.trim() ? "#fff" : "var(--text-3)",
          fontSize: 20, fontWeight: 400, lineHeight: 1,
          cursor: input.trim() ? "pointer" : "default", transition: "all 0.15s",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>+</button>
      </div>
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "14px 0 6px", color: "var(--text-3)", fontSize: 12 }}>ไม่มีงานส่วนตัว</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {items.map(item => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10,
              background: "var(--bg-card)", border: "1px solid var(--border)",
            }}>
              <button onClick={() => done(item.id)} style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                border: "1.5px solid var(--border)", background: "transparent",
                cursor: "pointer",
              }} />
              <span style={{ flex: 1, fontSize: 13, color: "var(--text-1)", lineHeight: 1.4 }}>{item.title}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 10, textAlign: "center" }}>บันทึกใน device · ไม่ sync Notion</div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN — OKR DASHBOARD
══════════════════════════════════════════ */
export default function QuickActionsView({ tasks }: { tasks: TaskData }) {
  const now = new Date();
  const daysLeft = Math.max(OKR_DAYS - Math.floor((now.getTime() - OKR_START.getTime()) / 86400000), 0);

  return (
    <div style={{ paddingBottom: 8, position: "relative" }}>

      {/* Geo rings decoration — left bottom (matches mockup Screen 2) */}
      <div style={{ position: "fixed", left: -40, bottom: 180, opacity: 0.25, pointerEvents: "none", zIndex: 0 }}>
        <svg width="150" height="150" viewBox="0 0 150 150" fill="none">
          <circle cx="75" cy="75" r="68" stroke="rgba(0,129,255,0.10)" strokeWidth="1"/>
          <circle cx="75" cy="75" r="48" stroke="rgba(0,129,255,0.07)" strokeWidth="1"/>
          <circle cx="75" cy="75" r="28" stroke="rgba(0,129,255,0.05)" strokeWidth="1"/>
          <line x1="75" y1="4" x2="75" y2="146" stroke="rgba(0,129,255,0.04)" strokeWidth="0.5"/>
          <line x1="4" y1="75" x2="146" y2="75" stroke="rgba(0,129,255,0.04)" strokeWidth="0.5"/>
          <line x1="22" y1="22" x2="128" y2="128" stroke="rgba(0,129,255,0.03)" strokeWidth="0.5"/>
          <line x1="128" y1="22" x2="22" y2="128" stroke="rgba(0,129,255,0.03)" strokeWidth="0.5"/>
        </svg>
      </div>

      {/* ── OKR Hero ── */}
      <div style={{ padding: "8px 0 16px", position: "relative", zIndex: 1 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brand)", marginBottom: 6, display: "block" }}>
          Objectives &amp; Key Results
        </span>
        <div style={{ fontSize: 30, fontWeight: 900, color: "var(--text-1)", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 4 }}>
          OKR<br/>Q2 2569
        </div>
        <div style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 400 }}>
          พ.ค. — ก.ค. 2569 · 92 วัน
        </div>
      </div>

      {/* ── OKR tracker ── */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <OKRTracker />
      </div>

      {/* ── Personal Tasks ── */}
      <div style={{ marginTop: 8, position: "relative", zIndex: 1 }}>
        <CollapsibleSection label="งานส่วนตัว" defaultOpen={false}>
          <PersonalTasks />
        </CollapsibleSection>
      </div>

    </div>
  );
}
