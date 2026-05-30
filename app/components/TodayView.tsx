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
    : q === "Q2" ? "#e07840"
    : q === "Q3" ? "var(--amber)"
    : task.area === "sts"     ? "var(--amber)"
    : task.area === "daisi"   ? "var(--warm-gold)"
    : task.area === "digital" ? "var(--steel-teal)"
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
    const color = diff <= 0 ? "var(--red)" : diff <= 1 ? "var(--amber)" : "var(--text-3)";
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
              {qInfo.emoji} {qInfo.shortLabel} · {qInfo.label}
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

/* ─── Zone card wrapper ─── */
function ZoneCard({
  accentColor, label, labelIcon, count, children, defaultOpen = true,
}: {
  accentColor: string; label: string; labelIcon: React.ReactNode;
  count: number; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: "var(--bg-card)",
      border: `1px solid ${accentColor}30`,
      borderLeft: `2px solid ${accentColor}`,
      borderRadius: 16, marginBottom: 10, overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          width: "100%", padding: "12px 14px",
          background: "transparent", border: "none", cursor: "pointer",
        }}
      >
        <span style={{ display: "flex", alignItems: "center" }}>{labelIcon}</span>
        <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: accentColor, letterSpacing: "0.1em", textAlign: "left" }}>
          {label}
        </span>
        <span style={{
          fontSize: 12, fontWeight: 800, color: accentColor,
          background: accentColor + "18", borderRadius: 6, padding: "2px 9px",
        }}>{count}</span>
        <span style={{ display: "flex", transform: open ? "none" : "rotate(-90deg)", transition: "transform 0.2s" }}>
          <ChevronDownIcon size={13} color="var(--text-3)" />
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
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
    if (diff === 0) return { text: "วันนี้!", color: "var(--amber)" };
    if (diff === 1) return { text: "พรุ่งนี้", color: "var(--amber)" };
    const dateOnly = task.due.includes("T") ? task.due.split("T")[0] : task.due;
    const d = new Date(dateOnly + "T00:00:00");
    return { text: `${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`, color: "var(--text-3)" };
  };
  const due = dueLabel();
  const swipePct = Math.min(swipeX / SWIPE_THRESHOLD, 1);

  return (
    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden" }}>
      {/* Reveal layer */}
      <div style={{
        position: "absolute", inset: 0,
        background: swipePct >= 1 ? "var(--amber)" : "var(--brand-dim)",
        display: "flex", alignItems: "center", paddingLeft: 20,
        transition: swipeX === 0 ? "background 0.2s" : "none",
      }}>
        <span style={{
          fontSize: 18, fontWeight: 800,
          color: swipePct >= 1 ? "#000" : "var(--amber)",
          opacity: swipePct, transition: swipeX === 0 ? "opacity 0.2s" : "none",
        }}>✓</span>
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
          padding: "13px 16px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderLeft: `2px solid ${accent}`,
          borderRadius: 14,
          cursor: "pointer",
          opacity: done ? 0 : 1,
          transform: done ? "translateX(20px)" : `translateX(${swipeX}px)`,
          transition: swipeX === 0 ? "transform 0.32s cubic-bezier(0.32,0.72,0,1), opacity 0.25s" : "none",
        }}
      >
        {/* Checkbox */}
        <button
          onClick={handleDone}
          disabled={loading}
          style={{
            width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
            border: `2.5px solid ${loading ? accent : "var(--border)"}`,
            background: loading ? accent + "22" : "transparent",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          {loading && <span style={{ color: accent, fontSize: 12, fontWeight: 800 }}>✓</span>}
        </button>

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {task.title}
          </div>
          <TaskMeta task={task} />
        </div>

        {/* Due badge */}
        {due && <span style={{ fontSize: 11, color: due.color, flexShrink: 0, fontWeight: 600 }}>{due.text}</span>}
        <ChevronRightIcon size={14} color="var(--text-3)" />
      </div>
    </div>
  );
}

/* ─── Empty state ─── */
function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
      <div style={{ color: "var(--text-2)", fontSize: 16, fontWeight: 600 }}>ไม่มีงานค้างค่ะ</div>
      <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 8 }}>คิมภูมิใจในตัวเจ้านายมากเลย</div>
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
    allActive.find(t => t.urgent && t.priority === "P1") ||
    allActive.find(t => t.priority === "P1") ||
    allActive.find(t => t.urgent) ||
    allActive.find(t => t.priority === "P2") ||
    allActive[0] || null;

  if (total === 0 && review.length === 0) return <EmptyState />;

  return (
    <div>
      {/* ── Morning Brief Card ── */}
      <MorningBriefCard data={data} />

      {/* ── Meetings Strip (GCal) ── */}
      <MeetingsStrip events={gcalEvents} />

      {/* ── Focus Card ── */}
      {focusTask && (
        <FocusCard task={focusTask} onDone={onDone} onClick={() => onTaskClick(focusTask)} />
      )}

      {/* ── Stats strip ── */}
      <div style={{
        display: "flex", gap: 0, marginBottom: 14,
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 14, overflow: "hidden",
      }}>
        {[
          { label: "ค้าง/วันนี้", n: now.length,    color: now.length > 0 ? "var(--red)" : "var(--text-3)" },
          { label: "เร็วๆนี้",    n: soon.length,   color: "var(--amber)"      },
          { label: "ถัดไป",       n: later.length,  color: "var(--text-3)"     },
          { label: "รอตรวจ",      n: review.length, color: "var(--steel-teal)" },
        ].map((s, i) => (
          <div key={s.label} style={{
            flex: 1, textAlign: "center", padding: "11px 4px",
            borderLeft: i > 0 ? "1px solid var(--border)" : "none",
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Zone: ตอนนี้ ── */}
      {now.length > 0 && (
        <ZoneCard
          accentColor="var(--red)" label="ตอนนี้" count={now.length}
          labelIcon={<DotIcon size={9} color="var(--red)" />}
        >
          {now.map(t => (
            <TodoItem key={t.id} task={t} onDone={onDone}
              onClick={() => onTaskClick(t)} accent="var(--red)" />
          ))}
        </ZoneCard>
      )}

      {/* ── Zone: เร็วๆนี้ ── */}
      {soon.length > 0 && (
        <ZoneCard
          accentColor="var(--amber)" label="เร็วๆ นี้ · 3 วัน" count={soon.length}
          labelIcon={<DotIcon size={9} color="var(--amber)" />}
        >
          {soon.map(t => (
            <TodoItem key={t.id} task={t} onDone={onDone}
              onClick={() => onTaskClick(t)} accent="var(--amber)" />
          ))}
        </ZoneCard>
      )}

      {/* ── Zone: ถัดไป ── */}
      {later.length > 0 && (
        <ZoneCard
          accentColor="var(--text-3)" label="ถัดไป" count={later.length}
          labelIcon={<DotIcon size={9} color="var(--text-3)" />}
          defaultOpen={false}
        >
          {later.slice(0, 10).map(t => (
            <TodoItem key={t.id} task={t} onDone={onDone}
              onClick={() => onTaskClick(t)} accent="var(--border)" />
          ))}
          {later.length > 10 && (
            <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-3)", paddingTop: 4 }}>
              +{later.length - 10} งานอีก · ดูที่แท็บ <strong style={{ color: "var(--amber)" }}>งาน</strong>
            </div>
          )}
        </ZoneCard>
      )}

      {/* ── Zone: รอตรวจ ── */}
      {review.length > 0 && (
        <ZoneCard
          accentColor="var(--steel-teal)" label="รอตรวจ" count={review.length}
          labelIcon={<ClockIcon size={11} color="var(--steel-teal)" />}
          defaultOpen={false}
        >
          {review.slice(0, 6).map(t => {
            const area = t.area ? AREA_STYLE[t.area] : null;
            return (
              <div key={t.id} onClick={() => onTaskClick(t)}
                style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "2px 0" }}>
                <ClockIcon size={12} color="var(--steel-teal)" />
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
