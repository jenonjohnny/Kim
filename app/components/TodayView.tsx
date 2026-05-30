"use client";
import React, { useState, useRef } from "react";
import { Task, TaskData, getQuadrant, QUADRANT_INFO } from "./types";
import {
  LightningIcon, ClockIcon, FileTextIcon, ChevronDownIcon, ChevronRightIcon, DotIcon,
} from "./icons";
import { AREA_STYLE, AreaBadge, TaskMeta } from "./TaskRow";
import MorningBriefCard from "./MorningBriefCard";

const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

export interface GCalEvent {
  id: string; title: string; start: string; end: string;
  color: string | null; fromKim: boolean;
}

/* ─── Meetings Strip — compact single-line rows ─── */
function MeetingsStrip({ events }: { events: GCalEvent[] }) {
  if (events.length === 0) return null;
  const now = new Date();
  const nowHHMM = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  return (
    <div style={{ marginBottom: 14 }}>
      {events.map(ev => {
        const isPast = ev.end <= nowHHMM;
        const isNow  = ev.start <= nowHHMM && ev.end > nowHHMM;
        return (
          <div key={ev.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "7px 0",
            borderBottom: "1px solid var(--border-soft)",
            opacity: isPast ? 0.4 : 1,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 600, color: "rgba(120,180,255,0.8)",
              minWidth: 42, flexShrink: 0, fontVariantNumeric: "tabular-nums",
            }}>{ev.start}</span>
            <span style={{
              flex: 1, fontSize: 13, fontWeight: isNow ? 600 : 400,
              color: isNow ? "var(--text-1)" : "var(--text-2)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{ev.title}</span>
            {isNow && (
              <span style={{
                fontSize: 8, fontWeight: 700,
                color: "rgba(84,132,237,1)", background: "rgba(84,132,237,0.15)",
                borderRadius: 4, padding: "2px 6px", flexShrink: 0,
              }}>NOW</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Focus Card — single most important task ─── */
function FocusCard({ task, onDone, onClick }: { task: Task; onDone: (id: string) => void; onClick: () => void }) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const q = getQuadrant(task);
  const qInfo = QUADRANT_INFO[q];
  const accentColor = q === "Q1" ? "var(--red)"
    : q === "Q2" ? "#ff9500"
    : q === "Q3" ? "var(--brand)"
    : task.area === "sts"     ? "var(--brand)"
    : task.area === "daisi"   ? "var(--brand)"
    : task.area === "digital" ? "var(--brand)"
    : "var(--text-3)";

  const handleDone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try { navigator.vibrate(18); } catch {}
    setLoading(true);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Done" }),
    });
    setDone(true);
    setTimeout(() => onDone(task.id), 280);
  };

  const dueStr = (() => {
    if (!task.due) return null;
    const today = new Date().toISOString().split("T")[0];
    const diff = Math.ceil((new Date(task.due).getTime() - new Date(today).getTime()) / 86400000);
    const dateOnly = task.due.includes("T") ? task.due.split("T")[0] : task.due;
    const d = new Date(dateOnly + "T00:00:00");
    const text = diff < 0 ? `เลย ${Math.abs(diff)} วัน` : diff === 0 ? "วันนี้" : diff === 1 ? "พรุ่งนี้" : `${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`;
    const color = diff <= 0 ? "var(--red)" : diff <= 1 ? "var(--brand)" : "var(--text-3)";
    return { text, color };
  })();

  return (
    <div style={{
      overflow: "hidden",
      maxHeight: done ? 0 : 300,
      marginBottom: done ? 0 : 16,
      transition: "max-height 0.35s ease-in-out, margin-bottom 0.35s",
    }}>
    <div
      onClick={onClick}
      style={{
        padding: "16px 18px 15px",
        background: "var(--bg-card)",
        border: `1px solid ${accentColor}40`,
        borderLeft: `2px solid ${accentColor}`,
        borderRadius: 16, cursor: "pointer",
        opacity: done ? 0 : 1,
        transform: done ? "translateY(-6px)" : "none",
        transition: "opacity 0.3s, transform 0.3s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
        <LightningIcon size={11} color={accentColor} />
        <span style={{ fontSize: 9, fontWeight: 700, color: accentColor, letterSpacing: "0.14em" }}>FOCUS NOW</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <button onClick={handleDone} disabled={loading} style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0, marginTop: 1,
          border: `2.5px solid ${loading ? accentColor : "var(--border)"}`,
          background: loading ? accentColor + "22" : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s",
        }}>
          {loading && <span style={{ color: accentColor, fontSize: 13, fontWeight: 800 }}>✓</span>}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.35, marginBottom: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {task.title}
          </div>
          <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{
              fontSize: 10, fontWeight: 800, color: qInfo.color,
              background: qInfo.color + "22", borderRadius: 5, padding: "2px 8px",
            }}>
              {qInfo.shortLabel} · {qInfo.label}
            </span>
            {task.area && <AreaBadge area={task.area} />}
            {dueStr && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: dueStr.color, fontWeight: 600 }}>
                <ClockIcon size={10} color={dueStr.color} /> {dueStr.text}
              </span>
            )}
          </div>
          {task.notes && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 5, fontSize: 11, color: "var(--text-3)", marginTop: 8, lineHeight: 1.5, overflow: "hidden" }}>
              <FileTextIcon size={11} color="var(--text-3)" />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.notes}</span>
            </div>
          )}
        </div>
        <span style={{ flexShrink: 0, marginTop: 4, display: "flex" }}>
          <ChevronRightIcon size={14} color="var(--text-3)" />
        </span>
      </div>
    </div>
    </div>
  );
}

/* ─── Zone card wrapper — non-collapsible (matches mockup) ─── */
function ZoneCard({
  accentColor, label, labelIcon, count, children, isUrgent = false,
  collapsible = false, defaultOpen = true,
}: {
  accentColor: string; label: string; labelIcon: React.ReactNode;
  count: number; children: React.ReactNode; isUrgent?: boolean;
  collapsible?: boolean; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 4 }}>
      {/* Section header */}
      <div
        onClick={collapsible ? () => setOpen(v => !v) : undefined}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 0 10px",
          cursor: collapsible ? "pointer" : "default",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {isUrgent ? (
            <span style={{
              display: "inline-block", width: 6, height: 6, borderRadius: "50%",
              background: "#ff3b30", flexShrink: 0,
              animation: "pulse-red 2s ease-in-out infinite",
            }} />
          ) : (
            <span style={{ display: "flex" }}>{labelIcon}</span>
          )}
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {label}
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Count badge — always brand blue per mockup */}
          <span style={{
            fontSize: 10, fontWeight: 700, color: "var(--brand)",
            background: "var(--brand-soft)", borderRadius: 20,
            padding: "2px 8px", border: "1px solid rgba(0,129,255,0.2)",
          }}>{count} งาน</span>
          {collapsible && (
            <span style={{ display: "flex", transform: open ? "none" : "rotate(-90deg)", transition: "transform 0.2s" }}>
              <ChevronDownIcon size={12} color="var(--text-3)" />
            </span>
          )}
        </span>
      </div>
      {(!collapsible || open) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── TodoItem — flat to-do list item used in TodayView zones ─── */
export function TodoItem({
  task, onDone, onClick, accent,
}: {
  task: Task; onDone: (id: string) => void; onClick: () => void;
  accent: string;
}) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const swipeRef = useRef<{ startX: number; startY: number; tracking: boolean }>({ startX: 0, startY: 0, tracking: false });
  const SWIPE_THRESHOLD = 80;

  const handleDone = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (loading || done) return;
    try { navigator.vibrate(18); } catch {}
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Done" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDone(true);
      setTimeout(() => onDone(task.id), 280);
    } catch (err) {
      console.error("handleDone failed:", err);
      setLoading(false);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    swipeRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, tracking: true };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!swipeRef.current.tracking) return;
    const dx = e.touches[0].clientX - swipeRef.current.startX;
    const dy = Math.abs(e.touches[0].clientY - swipeRef.current.startY);
    if (dy > 16 || dx < 0) { swipeRef.current.tracking = false; setSwipeX(0); return; }
    e.stopPropagation();
    setSwipeX(Math.min(dx, SWIPE_THRESHOLD + 24));
  };
  const onTouchEnd = () => {
    if (swipeX >= SWIPE_THRESHOLD) handleDone();
    setSwipeX(0);
    swipeRef.current.tracking = false;
  };

  const dueLabel = () => {
    if (!task.due) return null;
    const today = new Date().toISOString().split("T")[0];
    const diff = Math.ceil((new Date(task.due).getTime() - new Date(today).getTime()) / 86400000);
    if (diff < 0) return { text: `เลย ${Math.abs(diff)} วัน`, color: "var(--red)" };
    if (diff === 0) return { text: "วันนี้!", color: "var(--brand)" };
    if (diff === 1) return { text: "พรุ่งนี้", color: "var(--brand)" };
    const dateOnly = task.due.includes("T") ? task.due.split("T")[0] : task.due;
    const d = new Date(dateOnly + "T00:00:00");
    return { text: `${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`, color: "var(--text-3)" };
  };
  const due = dueLabel();
  const swipePct = Math.min(swipeX / SWIPE_THRESHOLD, 1);

  // Time-left chip — Norte style
  const timeLeftChip = (() => {
    if (!task.due) return null;
    const today = new Date().toISOString().split("T")[0];
    const diff = Math.ceil((new Date(task.due).getTime() - new Date(today).getTime()) / 86400000);
    if (diff < 0) return { text: "เลยกำหนด!", color: "#ff3b30", bg: "rgba(255,59,48,0.12)", border: "rgba(255,59,48,0.3)" };
    if (diff === 0) return { text: "เหลือวันนี้", color: "#ff9500", bg: "rgba(255,149,0,0.10)", border: "rgba(255,149,0,0.25)" };
    if (diff === 1) return { text: "พรุ่งนี้", color: "var(--text-3)", bg: "var(--bg-raised)", border: "var(--border)" };
    return null;
  })();

  // Priority badge — Norte v2: P1=brand blue, P2=brand soft, P3=transparent
  const pBadge = (() => {
    const p = task.priority;
    if (p === "P1") return { label: "P1", color: "white", bg: "var(--brand)", border: "none" };
    if (p === "P2") return { label: "P2", color: "var(--brand)", bg: "var(--brand-soft)", border: "1px solid rgba(0,129,255,0.25)" };
    if (p === "P3") return { label: "P3", color: "var(--text-3)", bg: "transparent", border: "1px solid var(--border)" };
    return null;
  })();

  const isOverdue = task.due && task.due < new Date().toISOString().split("T")[0];
  const isP1 = task.priority === "P1";

  return (
    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden" }}>
      {/* Swipe reveal layer */}
      <div style={{
        position: "absolute", inset: 0,
        background: swipePct >= 1 ? "var(--brand)" : "var(--brand-dim)",
        display: "flex", alignItems: "center", paddingLeft: 20,
        transition: swipeX === 0 ? "background 0.2s" : "none",
      }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ opacity: swipePct, transition: swipeX === 0 ? "opacity 0.2s" : "none" }}>
          <path d="M3 9l5 5 7-8"/>
        </svg>
      </div>

      {/* Card */}
      <div
        onClick={onClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: "relative",
          display: "flex", alignItems: "center", gap: 12,
          padding: "13px 14px",
          background: "var(--bg-card)",
          border: `1px solid ${isOverdue ? "rgba(255,59,48,0.35)" : isP1 ? "rgba(255,59,48,0.2)" : "var(--border)"}`,
          borderRadius: 14,
          boxShadow: isOverdue
            ? "inset 2px 0 0 #ff3b30"
            : isP1
              ? "inset 2px 0 0 rgba(255,59,48,0.5)"
              : "none",
          cursor: "pointer",
          opacity: done ? 0 : 1,
          transform: done ? "translateX(20px)" : `translateX(${swipeX}px)`,
          transition: swipeX === 0 ? "transform 0.32s cubic-bezier(0.32,0.72,0,1), opacity 0.25s" : "none",
        }}
      >
        {/* Checkbox — rounded square */}
        <button
          onClick={handleDone}
          disabled={loading}
          style={{
            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
            border: `1.5px solid ${loading ? accent : "var(--border)"}`,
            background: loading ? accent + "22" : "transparent",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          {loading && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1.5 5l3 3 4-4"/>
            </svg>
          )}
        </button>

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14,
            fontWeight: isP1 ? 700 : task.priority === "P2" ? 600 : 500,
            color: "var(--text-1)", lineHeight: 1.3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            marginBottom: 4,
          }}>
            {task.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <TaskMeta task={task} />
            {timeLeftChip && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 5,
                background: timeLeftChip.bg, color: timeLeftChip.color,
                border: `1px solid ${timeLeftChip.border}`, flexShrink: 0,
              }}>{timeLeftChip.text}</span>
            )}
          </div>
        </div>

        {/* Priority badge */}
        {pBadge && (
          <span style={{
            width: 24, height: 24, borderRadius: 7, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 800,
            background: pBadge.bg, color: pBadge.color, border: pBadge.border,
          }}>{pBadge.label}</span>
        )}
      </div>
    </div>
  );
}

/* ─── Empty state ─── */
function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.4}>
          <circle cx="24" cy="24" r="20"/>
          <path d="M16 24l6 6 10-12"/>
        </svg>
      </div>
      <div style={{ color: "var(--text-2)", fontSize: 16, fontWeight: 600 }}>ไม่มีงานค้างค่ะ</div>
      <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 8 }}>เยี่ยมมาก ทำงานได้ครบหมดแล้ว</div>
    </div>
  );
}

/* ─── TodayView — 3-zone card layout ─── */
export default function TodayView({
  data, onDone, onTaskClick, syncTime, gcalEvents,
}: {
  data: TaskData; onDone: (id: string) => void;
  onTaskClick: (t: Task) => void; syncTime: string;
  gcalEvents: GCalEvent[];
}) {
  const todayStr = new Date().toISOString().split("T")[0];

  const overdue  = data.urgent.filter(t => t.due && t.due < todayStr);
  const dueToday = data.urgent.filter(t => t.due && t.due === todayStr);
  const now      = [...overdue, ...dueToday];
  const soon     = data.soon;
  const later    = data.normal;
  const review   = data.review;
  const total    = data.urgent.length + soon.length + later.length;

  const allActive = [...data.urgent, ...data.soon, ...data.normal];
  const focusTask =
    allActive.find(t => t.priority === "P1") ||
    allActive.find(t => t.priority === "P2") ||
    allActive[0] || null;

  if (total === 0 && review.length === 0) return <EmptyState />;

  return (
    <div>
      {/* ── Section label — ภาพรวมวันนี้ (matches mockup) ── */}
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
        textTransform: "uppercase", color: "var(--text-3)",
        marginBottom: 8, marginTop: 20,
      }}>
        ภาพรวมวันนี้
      </div>

      {/* ── Stats — 3 cards (Norte v2 style) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          {
            label: "ด่วนมาก", n: now.length, type: "urgent",
            numColor: now.length > 0 ? "#ff3b30" : "var(--text-3)",
            barColor: now.length > 0 ? "#ff3b30" : "var(--border)",
            icon: (c: string) => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M6 2v4m0 2.5v.5"/><circle cx="6" cy="6" r="5"/></svg>,
          },
          {
            label: "วันนี้", n: soon.length, type: "soon",
            numColor: soon.length > 0 ? "#ff9500" : "var(--text-3)",
            barColor: soon.length > 0 ? "#ff9500" : "var(--border)",
            icon: (c: string) => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><circle cx="6" cy="6" r="5"/><path d="M6 3.5V6l1.5 1.5"/></svg>,
          },
          {
            label: "ทั้งหมด", n: total, type: "total",
            numColor: "var(--text-2)",
            barColor: "rgba(0,129,255,0.2)",
            icon: (c: string) => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M2 9h8M2 6h6M2 3h4"/></svg>,
          },
        ].map(s => (
          <div key={s.label} style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 16, padding: "14px 12px",
            display: "flex", flexDirection: "column", gap: 3,
            position: "relative", overflow: "hidden",
          }}>
            {/* Top color bar */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: s.barColor, borderRadius: "16px 16px 0 0",
            }} />
            <div style={{ marginBottom: 6, opacity: 0.5 }}>{s.icon(s.numColor)}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.numColor, lineHeight: 1, letterSpacing: "-0.03em" }}>{s.n}</div>
            <div style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 500, letterSpacing: "0.03em", marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Morning Brief Card — after stats, before tasks (matches mockup) ── */}
      <MorningBriefCard data={data} />

      {/* ── Meetings Strip (GCal) — only if events exist ── */}
      {gcalEvents.length > 0 && <MeetingsStrip events={gcalEvents} />}

      {/* ── Zone: ตอนนี้ ── */}
      {now.length > 0 && (
        <ZoneCard
          accentColor="#ff3b30" label="ด่วนมาก — P1" count={now.length}
          labelIcon={<DotIcon size={9} color="#ff3b30" />} isUrgent={true}
        >
          {now.map(t => (
            <TodoItem key={t.id} task={t} onDone={onDone}
              onClick={() => onTaskClick(t)} accent="#ff3b30" />
          ))}
        </ZoneCard>
      )}

      {/* ── Zone: เร็วๆนี้ ── */}
      {soon.length > 0 && (
        <ZoneCard
          accentColor="#ff9500" label="วันนี้ — P2" count={soon.length}
          labelIcon={<DotIcon size={9} color="#ff9500" />}
        >
          {soon.map(t => (
            <TodoItem key={t.id} task={t} onDone={onDone}
              onClick={() => onTaskClick(t)} accent="#ff9500" />
          ))}
        </ZoneCard>
      )}

      {/* ── Zone: ถัดไป — collapsible, collapsed by default ── */}
      {later.length > 0 && (
        <ZoneCard
          accentColor="var(--brand)" label="ถัดไป" count={later.length}
          labelIcon={<DotIcon size={9} color="var(--brand)" />}
          collapsible defaultOpen={false}
        >
          {later.slice(0, 10).map(t => (
            <TodoItem key={t.id} task={t} onDone={onDone}
              onClick={() => onTaskClick(t)} accent="var(--border)" />
          ))}
          {later.length > 10 && (
            <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-3)", paddingTop: 4 }}>
              +{later.length - 10} งานอีก · ดูที่แท็บ <strong style={{ color: "var(--brand)" }}>งาน</strong>
            </div>
          )}
        </ZoneCard>
      )}

      {/* ── Zone: รอตรวจ — collapsible, collapsed by default ── */}
      {review.length > 0 && (
        <ZoneCard
          accentColor="var(--text-3)" label="รอตรวจ" count={review.length}
          labelIcon={<ClockIcon size={11} color="var(--text-3)" />}
          collapsible defaultOpen={false}
        >
          {review.slice(0, 6).map(t => {
            const area = t.area ? AREA_STYLE[t.area] : null;
            return (
              <div key={t.id} onClick={() => onTaskClick(t)}
                style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "2px 0" }}>
                <ClockIcon size={12} color="var(--brand)" />
                <span style={{ fontSize: 13, color: "var(--text-2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                {area && <span style={{ fontSize: 9, color: area.color, background: area.color + "20", borderRadius: 4, padding: "1px 5px", fontWeight: 700, flexShrink: 0 }}>{area.label}</span>}
                <ChevronRightIcon size={13} color="var(--text-3)" />
              </div>
            );
          })}
          {review.length > 6 && (
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>+{review.length - 6} งานอีก</div>
          )}
        </ZoneCard>
      )}

      <div style={{ textAlign: "center", fontSize: 10, color: "var(--text-3)", marginTop: 8, paddingBottom: 16 }}>
        sync {syncTime} น. · auto ทุก 5 นาที
      </div>
    </div>
  );
}
