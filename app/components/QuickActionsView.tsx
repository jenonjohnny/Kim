"use client";
import React, { useState, useRef } from "react";
import { TargetIcon, FileTextIcon, ClockIcon, ChevronDownIcon } from "./icons";
import { TaskData } from "./types";

/* ──────────────────────────────────────────
   OKR CONFIG — อิงจาก OKR ของคิม
   เริ่ม 14 พ.ค. 2569 / 90 วัน
────────────────────────────────────────── */
const OKR_START         = new Date("2026-05-14");
const OKR_DAYS          = 90;
const OKR_INCOME_TARGET = 20000;

/* ── localStorage helpers ── */
function ls(key: string, def: string) {
  if (typeof window === "undefined") return def;
  return localStorage.getItem(key) ?? def;
}
function lsSet(key: string, val: string) { localStorage.setItem(key, val); }

const DISCIPLINES = ["Brand Identity", "Social Media", "Packaging / NPD", "Motion / Video", "Editorial / Print"];
const DEFAULT_TOOLS: [string, string] = ["Figma", "Framer"];

/* ── Progress bar — Norte v2 style with dot indicator ── */
function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const w = Math.min(pct * 100, 100);
  return (
    <div style={{ height: 6, background: "var(--bg-raised)", borderRadius: 10, marginTop: 6, position: "relative", overflow: "visible" }}>
      <div style={{
        height: "100%", width: `${w}%`,
        background: `linear-gradient(90deg, ${color}bb 0%, ${color} 100%)`,
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
function KRRow({ label, pct, color, children }: { label: string; pct: number; color: string; children?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 11, color, fontWeight: 700 }}>{Math.round(pct * 100)}%</span>
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
      onMouseDown={startPress}  onMouseUp={cancelPress}  onMouseLeave={cancelPress}
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
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 4l2.5 2.5 3.5-4"/>
        </svg>
      )}
      {label}
    </button>
  );
}

/* ── OKR Card wrapper — Norte v2 style ── */
function OKRCard({ children, status }: { children: React.ReactNode; status?: "behind" | "ontrack" | "done" }) {
  const borderColor = status === "behind" ? "rgba(255,149,0,0.18)" : "var(--border)";
  return (
    <div style={{
      marginBottom: 12,
      background: "var(--bg-card)",
      border: `1px solid ${borderColor}`,
      borderRadius: 18, padding: 18,
      position: "relative", overflow: "hidden",
    }}>
      {/* Glow */}
      <div style={{
        position: "absolute", top: -30, right: -30, width: 80, height: 80,
        borderRadius: "50%", background: "var(--brand-glow)", filter: "blur(20px)",
        pointerEvents: "none",
      }} />
      {children}
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
  const [portfolio, setPortfolio] = useState<string[]>(() => JSON.parse(ls("okr_portfolio", "[]")));
  const [projects,  setProjects]  = useState(() => parseInt(ls("okr_projects", "0")));
  const [courseDone, setCourseDone] = useState(() => ls("okr_course", "0") === "1");

  /* O2 */
  const [income,     setIncome]     = useState(() => parseInt(ls("okr_income", "0")));
  const [clientsOut, setClientsOut] = useState(() => parseInt(ls("okr_clients_out", "0")));
  const [firstClient,setFirstClient]= useState(() => ls("okr_first_client", "0") === "1");

  /* O3 */
  const [sessions,   setSessions]   = useState(() => parseInt(ls("okr_sessions", "0")));
  const [notes,      setNotes]      = useState(() => parseInt(ls("okr_notes", "0")));
  const [tools,      setTools]      = useState<string[]>(() => JSON.parse(ls("okr_tools", "[]")));
  const [toolNames,  setToolNames]  = useState<[string, string]>(() => {
    try { return JSON.parse(ls("okr_tool_names", JSON.stringify(DEFAULT_TOOLS))); } catch { return DEFAULT_TOOLS; }
  });
  const [editingTool, setEditingTool] = useState<number | null>(null);

  /* scores */
  const o1Score    = ((portfolio.length / 5) * 0.4) + (Math.min(projects / 3, 1) * 0.4) + (courseDone ? 0.2 : 0);
  const o2Score    = (Math.min(clientsOut / 5, 1) * 0.25) + (firstClient ? 0.25 : 0) + (Math.min(income / OKR_INCOME_TARGET, 1) * 0.5);
  const o3Score    = (Math.min(sessions / 12, 1) * 0.4) + (Math.min(notes / 8, 1) * 0.3) + (Math.min(tools.length / 2, 1) * 0.3);
  const totalScore = (o1Score * 0.4) + (o2Score * 0.35) + (o3Score * 0.25);
  const totalPct   = Math.round(totalScore * 100);

  const toggleArr = (arr: string[], val: string, key: string, setter: (a: string[]) => void) => {
    const next = arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
    setter(next); lsSet(key, JSON.stringify(next));
  };

  const o1Status = o1Score >= timePct ? "ontrack" : "behind";
  const o2Status = o2Score >= timePct ? "ontrack" : "behind";

  return (
    <>
      {/* ── Stats grid — วันผ่าน | วันเหลือ | โดยรวม ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {[
          { num: daysElapsed, unit: "วันผ่าน", color: "var(--brand)" },
          { num: daysLeft,    unit: "วันเหลือ", color: "var(--text-2)" },
          { num: totalPct,    unit: "โดยรวม",  color: totalScore >= timePct ? "var(--brand)" : "#ff9500", suffix: "%" },
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
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ marginBottom: 6 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11h18l-9 10z"/><path d="M3 11l3.5-7h11L21 11"/>
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 2, lineHeight: 1.3 }}>Art Direction ครบวงจร</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>Product Design · 3 เดือน</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "var(--brand)", letterSpacing: "-0.03em" }}>
              {Math.round(o1Score * 100)}%
            </div>
            <div style={{ fontSize: 9, color: o1Status === "ontrack" ? "var(--brand)" : "#ff9500", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 1 }}>
              {o1Status === "ontrack" ? "on track" : "ล้าหลัง"}
            </div>
          </div>
        </div>

        <KRRow label={`KR1 · Portfolio disciplines (${portfolio.length}/5)`} pct={portfolio.length / 5} color="var(--brand)">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {DISCIPLINES.map(d => {
              const on = portfolio.includes(d);
              return (
                <button key={d} onClick={() => toggleArr(portfolio, d, "okr_portfolio", setPortfolio)} style={{
                  padding: "4px 8px", borderRadius: 8, fontSize: 10, cursor: "pointer",
                  background: on ? "var(--brand-soft)" : "var(--bg-raised)",
                  border: `1px solid ${on ? "rgba(0,129,255,0.35)" : "var(--border)"}`,
                  color: on ? "var(--brand)" : "var(--text-3)", fontWeight: on ? 700 : 400,
                }}>
                  {on ? "✓ " : ""}{d}
                </button>
              );
            })}
          </div>
        </KRRow>

        <KRRow label={`KR2 · Daisi projects จบ (${projects}/3)`} pct={Math.min(projects / 3, 1)} color="var(--brand)">
          <Counter value={projects} min={0} max={10} color="var(--brand)"
            onChange={n => { setProjects(n); lsSet("okr_projects", String(n)); }} />
        </KRRow>

        <KRRow label="KR3 · จบ course / book (1 เล่ม)" pct={courseDone ? 1 : 0} color={courseDone ? "var(--brand)" : "#ff3b30"}>
          <button onClick={() => { const n = !courseDone; setCourseDone(n); lsSet("okr_course", n ? "1" : "0"); }} style={{
            padding: "5px 12px", borderRadius: 8, fontSize: 10, cursor: "pointer",
            background: courseDone ? "var(--brand-soft)" : "var(--bg-raised)",
            border: `1px solid ${courseDone ? "rgba(0,129,255,0.35)" : "var(--border)"}`,
            color: courseDone ? "var(--brand)" : "var(--text-3)", fontWeight: courseDone ? 700 : 400,
          }}>{courseDone ? "✓ จบแล้ว" : "ยังไม่จบ"}</button>
        </KRRow>
      </OKRCard>

      {/* ── O2: รายได้เสริม ── */}
      <OKRCard status={o2Status}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ marginBottom: 6 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="9"/><path d="M12 8v1.5m0 5V16m-2.5-7h4c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5h-3c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5H15"/>
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 2, lineHeight: 1.3 }}>รายได้เสริม 20k/เดือน</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>Income · Stretch 50k</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em",
              color: o2Status === "ontrack" ? "var(--brand)" : "#ff9500",
              background: o2Status === "behind" ? "rgba(255,149,0,0.08)" : "transparent",
              border: o2Status === "behind" ? "1px solid rgba(255,149,0,0.25)" : "none",
              borderRadius: 8, padding: o2Status === "behind" ? "2px 8px" : 0,
            }}>
              {Math.round(o2Score * 100)}%
            </div>
            <div style={{ fontSize: 9, color: o2Status === "ontrack" ? "var(--brand)" : "#ff9500", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 1 }}>
              {o2Status === "ontrack" ? "on track" : "ล้าหลัง"}
            </div>
          </div>
        </div>

        <KRRow label={`KR1 · รายได้สะสม (${income.toLocaleString()} / 20,000 ฿)`} pct={Math.min(income / OKR_INCOME_TARGET, 1)} color="#ff9500">
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#ff9500" }}>฿{income.toLocaleString()} ได้แล้ว</span>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>เป้า ฿20,000</span>
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
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
          }}>{firstClient ? "✓ มี client แล้ว!" : "ยังไม่มี client"}</button>
        </KRRow>
      </OKRCard>

      {/* ── O3: พัฒนาทักษะ ── */}
      <OKRCard>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ marginBottom: 6 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 7H20v13H6.5A2.5 2.5 0 014 17.5v-13z"/>
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 2, lineHeight: 1.3 }}>พัฒนาทักษะต่อเนื่อง</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>Learning · 3 เดือน</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "var(--brand)", letterSpacing: "-0.03em" }}>
              {Math.round(o3Score * 100)}%
            </div>
            <div style={{ fontSize: 9, color: o3Score >= timePct ? "var(--brand)" : "#ff9500", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 1 }}>
              {o3Score >= timePct ? "on track" : "ล้าหลัง"}
            </div>
          </div>
        </div>

        <KRRow label={`KR1 · Learning sessions (${sessions}/12 สัปดาห์)`} pct={Math.min(sessions / 12, 1)} color="var(--brand)">
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
              const name = toolNames[i] || DEFAULT_TOOLS[i];
              const isEditing = editingTool === i;
              return isEditing ? (
                <input
                  key={key} autoFocus defaultValue={name}
                  onBlur={e => {
                    const val = e.target.value.trim() || DEFAULT_TOOLS[i];
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
    </>
  );
}

/* ── Personal Tasks ── */
function PersonalTasks() {
  const [items, setItems] = useState<{ id: string; title: string }[]>(() => {
    try { return JSON.parse(ls("personal_tasks", "[]")); } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [doneIds, setDoneIds] = useState<string[]>([]);
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
    setDoneIds(prev => [...prev, id]);
    setTimeout(() => {
      setItems(prev => { const next = prev.filter(x => x.id !== id); lsSet("personal_tasks", JSON.stringify(next)); return next; });
      setDoneIds(prev => prev.filter(x => x !== id));
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
          {items.map(item => {
            const isDone = doneIds.includes(item.id);
            return (
              <div key={item.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10,
                background: "var(--bg-card)", border: "1px solid var(--border)",
                opacity: isDone ? 0 : 1,
                transform: isDone ? "translateX(20px)" : "none",
                transition: "opacity 0.25s, transform 0.28s cubic-bezier(0.32,0.72,0,1)",
              }}>
                <button onClick={() => done(item.id)} style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  border: "1.5px solid var(--border)", background: "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }} />
                <span style={{ flex: 1, fontSize: 13, color: "var(--text-1)", lineHeight: 1.4 }}>{item.title}</span>
              </div>
            );
          })}
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
  const daysElapsed = Math.max(0, Math.floor((now.getTime() - OKR_START.getTime()) / 86400000));
  const daysLeft    = Math.max(OKR_DAYS - daysElapsed, 0);

  return (
    <div style={{ paddingBottom: 8 }}>

      {/* ── OKR Hero — matches mockup ── */}
      <div style={{ padding: "8px 0 16px" }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brand)", marginBottom: 6, display: "block" }}>
          Objectives &amp; Key Results
        </span>
        <div style={{ fontSize: 30, fontWeight: 900, color: "var(--text-1)", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 4 }}>
          OKR<br/>Q2 2569
        </div>
        <div style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 400 }}>
          พ.ค. — ก.ค. 2569 · {daysLeft > 0 ? `${daysLeft} วันเหลือ` : "สิ้นสุด Q2 แล้ว"}
        </div>
      </div>

      {/* ── OKR tracker cards ── */}
      <OKRTracker />

      {/* ── Personal Tasks — collapsible ── */}
      <div style={{ marginTop: 8 }}>
        <CollapsibleSection label="งานส่วนตัว" defaultOpen={false}>
          <PersonalTasks />
        </CollapsibleSection>
      </div>

    </div>
  );
}
