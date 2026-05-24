"use client";
import { useState } from "react";
import { TaskData } from "./types";

const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

/* ──────────────────────────────────────────
   OKR CONFIG — อิงจาก OKR ของคิม
   เริ่ม 14 พ.ค. 2569 / 3 เดือน
────────────────────────────────────────── */
const OKR_START   = new Date("2026-05-14");
const OKR_DAYS    = 90;
const OKR_INCOME_TARGET = 20000; // บาท

const OKRs = [
  {
    id: "art",
    emoji: "🎨",
    label: "Art Direction ครบวงจร",
    sub: "พัฒนาทักษะ 3 เดือน",
    color: "var(--cat-design)",
    type: "time" as const,       // วัดจากวันที่ผ่านไป
  },
  {
    id: "income",
    emoji: "💰",
    label: "รายได้เสริม",
    sub: "เป้า 20,000 บาท",
    color: "var(--warm-gold)",
    type: "manual" as const,     // อัปเดตเอง
  },
  {
    id: "skill",
    emoji: "📚",
    label: "พัฒนาทักษะ",
    sub: "เรียนรู้ต่อเนื่อง",
    color: "var(--cat-holiday)",
    type: "time" as const,
  },
];

/* ── shared card style ── */
const CARD_H = "max(60px, calc((100dvh - 310px) / 4))";

function ActionCard({
  emoji, title, desc, color = "var(--amber)", onClick, active,
}: {
  emoji: string; title: string; desc: string;
  color?: string; onClick: () => void; active?: boolean;
}) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 16px", borderRadius: 16,
      background: active ? `${color}18` : "var(--bg-card)",
      border: `1px solid ${active ? color + "50" : "var(--border)"}`,
      cursor: "pointer", width: "100%", textAlign: "left",
      transition: "background 0.15s, border 0.15s",
      minHeight: CARD_H,
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{title}</div>
        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{desc}</div>
      </div>
      <span style={{ fontSize: 12, color: active ? color : "var(--text-3)", flexShrink: 0 }}>
        {active ? "▼" : "›"}
      </span>
    </button>
  );
}

function PanelWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--bg-raised)", borderRadius: 16,
      border: "1px solid var(--border)", padding: 16, marginTop: 8,
    }}>{children}</div>
  );
}

/* ── Progress bar ── */
function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 5, background: "var(--border)", borderRadius: 3, overflow: "hidden", marginTop: 6 }}>
      <div style={{
        height: "100%", width: `${Math.min(pct * 100, 100).toFixed(1)}%`,
        background: color, borderRadius: 3,
        transition: "width 0.5s ease",
      }} />
    </div>
  );
}

/* ── Morning Brief — Work + Personal side by side ── */
function MorningBrief({ tasks }: { tasks: TaskData }) {
  const now     = new Date();
  const hour    = now.getHours();
  const timeTag = hour < 12 ? "เช้า" : hour < 17 ? "บ่าย" : "เย็น";

  const daysElapsed = Math.floor((now.getTime() - OKR_START.getTime()) / 86400000);
  const okrPct      = Math.min(daysElapsed / OKR_DAYS, 1);
  const daysLeft    = Math.max(OKR_DAYS - daysElapsed, 0);
  const dow         = now.getDay();
  const isWeekend   = dow === 0 || dow === 6;

  // งาน Daisi ที่สำคัญที่สุดวันนี้
  const topWork = [...tasks.urgent.slice(0, 2), ...tasks.soon.slice(0, 1)].slice(0, 2);

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Header strip */}
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.12em", marginBottom: 10 }}>
        ⚡ BRIEF {timeTag}นี้
      </div>

      <div style={{ display: "flex", gap: 8 }}>

        {/* ── Work side — Daisi ── */}
        <div style={{
          flex: 1,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderLeft: "3px solid var(--steel-teal)",
          borderRadius: 14, padding: "12px 14px",
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--steel-teal)", letterSpacing: "0.1em", marginBottom: 8 }}>
            🏢 DAISI
          </div>
          {tasks.urgent.length + tasks.soon.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>ไม่มีงานด่วน ✨</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {topWork.map(t => {
                const today  = new Date().toISOString().split("T")[0];
                const isUrgent = t.due && t.due <= today;
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 4,
                      background: isUrgent ? "var(--red)" : "var(--amber)",
                    }} />
                    <span style={{ fontSize: 12, color: "var(--text-1)", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {t.title}
                    </span>
                  </div>
                );
              })}
              {tasks.urgent.length + tasks.soon.length > 2 && (
                <div style={{ fontSize: 10, color: "var(--text-3)" }}>
                  +{tasks.urgent.length + tasks.soon.length - 2} งานอีก
                </div>
              )}
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 10, color: "var(--text-3)", borderTop: "1px solid var(--border-soft)", paddingTop: 6 }}>
            รวม {tasks.total} งาน · ค้าง {tasks.urgent.length} ด่วน
          </div>
        </div>

        {/* ── Personal side — OKR ── */}
        <div style={{
          flex: 1,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderLeft: "3px solid var(--warm-gold)",
          borderRadius: 14, padding: "12px 14px",
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--warm-gold)", letterSpacing: "0.1em", marginBottom: 8 }}>
            🎯 OKR
          </div>
          <div style={{ fontSize: 12, color: "var(--text-1)", fontWeight: 600, marginBottom: 4 }}>
            Day {daysElapsed}/{OKR_DAYS}
          </div>
          <ProgressBar pct={okrPct} color="var(--warm-gold)" />
          <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 6 }}>
            เหลือ {daysLeft} วัน
          </div>

          {/* Daily nudge */}
          <div style={{ marginTop: 8, fontSize: 10, color: "var(--warm-gold)", borderTop: "1px solid var(--border-soft)", paddingTop: 6, lineHeight: 1.4 }}>
            {isWeekend
              ? "🌿 วันหยุด — เคลียงาน + OKR ได้เลยค่ะ"
              : daysElapsed % 3 === 0
                ? "🎨 วันนี้ควรทำ Art Direction ด้วยค่ะ"
                : "💼 วันนี้มีเวลา Side Project ไหมคะ?"}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── helpers ── */
function ls(key: string, def: string) {
  if (typeof window === "undefined") return def;
  return localStorage.getItem(key) ?? def;
}
function lsSet(key: string, val: string) { localStorage.setItem(key, val); }

const DISCIPLINES = ["Brand Identity", "Social Media", "Packaging / NPD", "Motion / Video", "Editorial / Print"];
const TOOLS_LABEL = ["Tool 1", "Tool 2"];

/* ── KR row ── */
function KRRow({ label, pct, color, children }: { label: string; pct: number; color: string; children?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: "var(--text-2)" }}>{label}</span>
        <span style={{ fontSize: 10, color }}>{Math.round(pct * 100)}%</span>
      </div>
      <ProgressBar pct={pct} color={color} />
      {children && <div style={{ marginTop: 6 }}>{children}</div>}
    </div>
  );
}

/* ── small +/− counter ── */
function Counter({ value, min, max, onChange, color }: { value: number; min: number; max: number; onChange: (n: number) => void; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} style={{ width: 24, height: 24, borderRadius: 6, background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-2)", fontSize: 14, cursor: "pointer" }}>−</button>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 28, textAlign: "center" }}>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} style={{ width: 24, height: 24, borderRadius: 6, background: "var(--bg-raised)", border: "1px solid var(--border)", color, fontSize: 14, cursor: "pointer" }}>+</button>
    </div>
  );
}

/* ── OKR Tracker panel ── */
function OKRTracker() {
  const now = new Date();
  const daysElapsed = Math.max(0, Math.floor((now.getTime() - OKR_START.getTime()) / 86400000));
  const timePct = Math.min(daysElapsed / OKR_DAYS, 1);
  const daysLeft = Math.max(OKR_DAYS - daysElapsed, 0);

  /* O1 state */
  const [portfolio, setPortfolio] = useState<string[]>(() => JSON.parse(ls("okr_portfolio", "[]")));
  const [projects, setProjects]   = useState(() => parseInt(ls("okr_projects", "0")));
  const [courseDone, setCourseDone] = useState(() => ls("okr_course", "0") === "1");

  /* O2 state */
  const [income, setIncome]           = useState(() => parseInt(ls("okr_income", "0")));
  const [clientsOut, setClientsOut]   = useState(() => parseInt(ls("okr_clients_out", "0")));
  const [firstClient, setFirstClient] = useState(() => ls("okr_first_client", "0") === "1");

  /* O3 state */
  const [sessions, setSessions] = useState(() => parseInt(ls("okr_sessions", "0")));
  const [notes, setNotes]       = useState(() => parseInt(ls("okr_notes", "0")));
  const [tools, setTools]       = useState<string[]>(() => JSON.parse(ls("okr_tools", "[]")));

  /* score calculations */
  const o1Score = ((portfolio.length / 5) * 0.4) + (Math.min(projects / 3, 1) * 0.4) + (courseDone ? 0.2 : 0);
  const o2Score = (Math.min(clientsOut / 5, 1) * 0.25) + (firstClient ? 0.25 : 0) + (Math.min(income / OKR_INCOME_TARGET, 1) * 0.5);
  const o3Score = (Math.min(sessions / 12, 1) * 0.4) + (Math.min(notes / 8, 1) * 0.3) + (Math.min(tools.length / 2, 1) * 0.3);
  const totalScore = (o1Score * 0.4) + (o2Score * 0.35) + (o3Score * 0.25);

  const toggle = (arr: string[], val: string, key: string, setter: (a: string[]) => void) => {
    const next = arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
    setter(next); lsSet(key, JSON.stringify(next));
  };

  const sectionHead = (emoji: string, label: string, score: number, color: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color }}>{emoji} {label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 10, color: "var(--text-3)" }}>on-track: {Math.round(timePct * 100)}%</span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: score >= timePct ? "var(--green)" : "var(--red)",
          background: score >= timePct ? "var(--green-soft)" : "var(--red-soft)",
          padding: "2px 6px", borderRadius: 6,
        }}>{Math.round(score * 100)}%</span>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* ── Overall header ── */}
      <div style={{ marginBottom: 16, padding: "12px 14px", background: "var(--bg-raised)", borderRadius: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)" }}>⏱ Day {daysElapsed} / {OKR_DAYS} · เหลือ {daysLeft} วัน</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: totalScore >= timePct ? "var(--green)" : "var(--amber)" }}>
            รวม {Math.round(totalScore * 100)}%
          </span>
        </div>
        <ProgressBar pct={timePct} color="var(--border)" />
        <div style={{ marginTop: 3 }}>
          <ProgressBar pct={totalScore} color={totalScore >= timePct ? "var(--green)" : "var(--amber)"} />
        </div>
        <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 4 }}>
          แถบบน = เวลาที่ผ่านไป · แถบล่าง = ความคืบหน้าจริง
        </div>
      </div>

      {/* ══ O1: Art Direction ══ */}
      <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border-soft)" }}>
        {sectionHead("🎨", "O1: Art Direction ครบวงจร", o1Score, "var(--cat-design)")}

        <KRRow label="KR1 · Portfolio disciplines (0/5)" pct={portfolio.length / 5} color="var(--cat-design)">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {DISCIPLINES.map(d => {
              const on = portfolio.includes(d);
              return (
                <button key={d} onClick={() => toggle(portfolio, d, "okr_portfolio", setPortfolio)} style={{
                  padding: "4px 8px", borderRadius: 8, fontSize: 10, cursor: "pointer",
                  background: on ? "var(--cat-design-bg)" : "var(--bg-raised)",
                  border: `1px solid ${on ? "var(--cat-design)" : "var(--border)"}`,
                  color: on ? "var(--cat-design)" : "var(--text-3)", fontWeight: on ? 700 : 400,
                }}>{on ? "✓ " : ""}{d}</button>
              );
            })}
          </div>
        </KRRow>

        <KRRow label={`KR2 · Daisi projects จบ (${projects}/3)`} pct={Math.min(projects / 3, 1)} color="var(--cat-design)">
          <Counter value={projects} min={0} max={10} color="var(--cat-design)"
            onChange={n => { setProjects(n); lsSet("okr_projects", String(n)); }} />
        </KRRow>

        <KRRow label="KR3 · จบ course / book (1 เล่ม)" pct={courseDone ? 1 : 0} color="var(--cat-design)">
          <button onClick={() => { const n = !courseDone; setCourseDone(n); lsSet("okr_course", n ? "1" : "0"); }} style={{
            padding: "5px 12px", borderRadius: 8, fontSize: 10, cursor: "pointer",
            background: courseDone ? "var(--cat-design-bg)" : "var(--bg-raised)",
            border: `1px solid ${courseDone ? "var(--cat-design)" : "var(--border)"}`,
            color: courseDone ? "var(--cat-design)" : "var(--text-3)", fontWeight: courseDone ? 700 : 400,
          }}>{courseDone ? "✓ จบแล้ว" : "ยังไม่จบ"}</button>
        </KRRow>
      </div>

      {/* ══ O2: รายได้เสริม ══ */}
      <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border-soft)" }}>
        {sectionHead("💰", "O2: รายได้เสริม 20k", o2Score, "var(--warm-gold)")}

        <KRRow label={`KR1 · Reach out clients (${clientsOut}/5)`} pct={Math.min(clientsOut / 5, 1)} color="var(--warm-gold)">
          <Counter value={clientsOut} min={0} max={20} color="var(--warm-gold)"
            onChange={n => { setClientsOut(n); lsSet("okr_clients_out", String(n)); }} />
        </KRRow>

        <KRRow label="KR2 · ได้ client คนแรก (ก่อน Day 30)" pct={firstClient ? 1 : 0} color="var(--warm-gold)">
          <button onClick={() => { const n = !firstClient; setFirstClient(n); lsSet("okr_first_client", n ? "1" : "0"); }} style={{
            padding: "5px 12px", borderRadius: 8, fontSize: 10, cursor: "pointer",
            background: firstClient ? "var(--brand-soft)" : "var(--bg-raised)",
            border: `1px solid ${firstClient ? "var(--warm-gold)" : "var(--border)"}`,
            color: firstClient ? "var(--warm-gold)" : "var(--text-3)", fontWeight: firstClient ? 700 : 400,
          }}>{firstClient ? "✓ มี client แล้ว! 🎉" : "ยังไม่มี client"}</button>
        </KRRow>

        <KRRow label={`KR3 · รายได้สะสม (${income.toLocaleString()} / 20,000 ฿)`} pct={Math.min(income / OKR_INCOME_TARGET, 1)} color="var(--warm-gold)">
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {[500, 1000, 5000, 10000].map(n => (
              <button key={n} onClick={() => { const next = income + n; setIncome(next); lsSet("okr_income", String(next)); }} style={{
                padding: "5px 10px", borderRadius: 8, cursor: "pointer",
                background: "var(--bg-raised)", border: "1px solid var(--border)",
                color: "var(--warm-gold)", fontSize: 10, fontWeight: 600,
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
      </div>

      {/* ══ O3: พัฒนาทักษะ ══ */}
      <div>
        {sectionHead("📚", "O3: พัฒนาทักษะต่อเนื่อง", o3Score, "var(--cat-holiday)")}

        <KRRow label={`KR1 · Learning sessions (${sessions}/12 สัปดาห์)`} pct={Math.min(sessions / 12, 1)} color="var(--cat-holiday)">
          <Counter value={sessions} min={0} max={12} color="var(--cat-holiday)"
            onChange={n => { setSessions(n); lsSet("okr_sessions", String(n)); }} />
        </KRRow>

        <KRRow label={`KR2 · Notion Learning Notes (${notes}/8)`} pct={Math.min(notes / 8, 1)} color="var(--cat-holiday)">
          <Counter value={notes} min={0} max={20} color="var(--cat-holiday)"
            onChange={n => { setNotes(n); lsSet("okr_notes", String(n)); }} />
        </KRRow>

        <KRRow label={`KR3 · Tools ใหม่ (${tools.length}/2)`} pct={Math.min(tools.length / 2, 1)} color="var(--cat-holiday)">
          <div style={{ display: "flex", gap: 5 }}>
            {TOOLS_LABEL.map((t, i) => {
              const key = `tool_${i}`;
              const on = tools.includes(key);
              return (
                <button key={key} onClick={() => toggle(tools, key, "okr_tools", setTools)} style={{
                  padding: "5px 12px", borderRadius: 8, fontSize: 10, cursor: "pointer",
                  background: on ? "var(--cat-holiday-bg)" : "var(--bg-raised)",
                  border: `1px solid ${on ? "var(--cat-holiday)" : "var(--border)"}`,
                  color: on ? "var(--cat-holiday)" : "var(--text-3)", fontWeight: on ? 700 : 400,
                }}>{on ? "✓ " : ""}{t}</button>
              );
            })}
          </div>
        </KRRow>
      </div>

    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════ */
export default function QuickActionsView({
  tasks,
}: {
  tasks: TaskData;
}) {
  const [panel, setPanel] = useState<string | null>(null);
  const toggle = (id: string) => setPanel(p => p === id ? null : id);

  return (
    <div style={{ paddingBottom: 8 }}>

      {/* ═══ Morning Brief — always visible ═══ */}
      <MorningBrief tasks={tasks} />

      {/* ═══ Work section label ═══ */}
      <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.12em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        🏢 DAISI DESIGN
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      {/* ── Work stats compact (ไม่มี accordion ให้กระชับ) ── */}
      <div style={{
        marginBottom: 16, padding: "12px 16px",
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 14,
        display: "flex", gap: 0,
      }}>
        {[
          { label: "ด่วน",   n: tasks.urgent.length, color: "var(--red)"        },
          { label: "ใกล้มา", n: tasks.soon.length,   color: "var(--amber)"      },
          { label: "ถัดไป",  n: tasks.normal.length, color: "var(--text-3)"     },
          { label: "รวม",    n: tasks.total,          color: "var(--steel-teal)" },
        ].map((s, i) => (
          <div key={s.label} style={{ flex: 1, textAlign: "center", borderLeft: i > 0 ? "1px solid var(--border)" : "none" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ═══ Personal section label ═══ */}
      <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.12em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        🎯 งานตัวเอง &amp; OKR
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      {/* ── OKR Tracker ── */}
      <div style={{ marginBottom: 10 }}>
        <ActionCard
          emoji="🎯" title="OKR Progress"
          desc="Art Direction · รายได้เสริม · ทักษะ"
          color="var(--warm-gold)"
          onClick={() => toggle("okr")}
          active={panel === "okr"}
        />
        {panel === "okr" && (
          <PanelWrap><OKRTracker /></PanelWrap>
        )}
      </div>

      {/* ── Personal tasks placeholder ── */}
      <div style={{ marginBottom: 10 }}>
        <ActionCard
          emoji="🤖" title="งานส่วนตัว (เร็วๆ นี้)"
          desc="เลขาแพรจะส่ง personal tasks มาได้โดยตรง"
          color="var(--text-3)"
          onClick={() => toggle("personal")}
          active={panel === "personal"}
        />
        {panel === "personal" && (
          <PanelWrap>
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🤖</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 8 }}>กำลังพัฒนาค่ะ</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>
                เลขาแพร + เลขาพีช จะสามารถ<br/>ส่ง task ส่วนตัวมาแสดงที่นี่ได้<br/>เชื่อมกับ Notion Personal DB ค่ะ
              </div>
            </div>
          </PanelWrap>
        )}
      </div>

    </div>
  );
}
