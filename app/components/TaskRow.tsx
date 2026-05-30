"use client";
import React, { useState, useRef } from "react";
import { Task, TaskData, getQuadrant, QUADRANT_INFO } from "./types";
import {
  ClockIcon, FileTextIcon,
  ChevronDownIcon, ChevronRightIcon,
} from "./icons";

const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

export const AREA_STYLE: Record<string, { label: string; color: string }> = {
  sts:     { label: "STS",     color: "var(--brand)"  },
  daisi:   { label: "Daisi",   color: "var(--brand)"  },
  digital: { label: "Digital", color: "var(--brand)"  },
};

/* Norte-style area icons */
const AREA_ICON: Record<string, React.ReactNode> = {
  sts:     <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="1" width="6" height="6" rx="1"/><line x1="3" y1="1" x2="3" y2="7"/></svg>,
  daisi:   <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M4 1l.8 2.2 2.2.3-1.6 1.5.4 2.2L4 6.2 1.8 7.2l.4-2.2L.6 3.5l2.2-.3z"/></svg>,
  digital: <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,6 3,4 5,5 7,2"/></svg>,
};

const CARD = {
  padding: "13px 14px",
  borderRadius: 14,
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
} as const;

export function AreaBadge({ area }: { area: string }) {
  const s = AREA_STYLE[area];
  if (!s) return null;
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, color: "var(--brand)",
      background: "var(--brand-soft)", borderRadius: 5,
      border: "1px solid rgba(0,129,255,0.2)",
      padding: "1px 6px", letterSpacing: "0.04em",
      display: "inline-flex", alignItems: "center", gap: 3,
    }}>
      {AREA_ICON[area]}
      {s.label}
    </span>
  );
}

export function TaskMeta({ task }: { task: Task }) {
  const q = getQuadrant(task);
  const qInfo = QUADRANT_INFO[q];
  const hasArea = task.area && AREA_STYLE[task.area];
  const hasQData = task.urgent || task.priority;
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap", marginTop: 3 }}>
      {hasQData && (
        <span style={{
          fontSize: 10, fontWeight: 800,
          color: task.priority === "P1" ? "#ff3b30" : task.priority === "P2" ? "#ff9500" : "var(--text-3)",
          background: task.priority === "P1" ? "rgba(255,59,48,0.12)" : task.priority === "P2" ? "rgba(255,149,0,0.12)" : "var(--bg-raised)",
          border: `1px solid ${task.priority === "P1" ? "rgba(255,59,48,0.25)" : task.priority === "P2" ? "rgba(255,149,0,0.25)" : "var(--border)"}`,
          borderRadius: 5, padding: "1px 7px", letterSpacing: "0.03em",
        }}>
          {task.priority || qInfo.shortLabel}
        </span>
      )}
      {hasArea && <AreaBadge area={task.area!} />}
      {task.status === "Waiting" && (
        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "var(--brand)" }}>
          <ClockIcon size={11} color="var(--brand)" /> ติดตาม
        </span>
      )}
      {task.notes && (
        <FileTextIcon size={11} color="var(--text-3)" />
      )}
    </div>
  );
}

/* ─── Section divider label — lightweight, non-clickable ─── */
export function SectionDivider({ icon, label, color, count }: { icon: React.ReactNode; label: string; color: string; count: number }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      marginTop: 18, marginBottom: 10,
    }}>
      <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</span>
      <span style={{
        fontSize: 10, fontWeight: 700, color,
        background: color + "18", borderRadius: 6,
        padding: "1px 7px", marginLeft: 2,
      }}>{count}</span>
      <div style={{ flex: 1, height: 1, background: color + "22", marginLeft: 4 }} />
    </div>
  );
}

/* ─── Task row — used in Tasks tab (all tasks view) ─── */
export default function TaskRow({
  task, onDone, onClick,
}: {
  task: Task; onDone: (id: string) => void; onClick?: () => void;
}) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const swipeRef = useRef<{ startX: number; startY: number; tracking: boolean }>({ startX: 0, startY: 0, tracking: false });
  const SWIPE_THRESHOLD = 80;
  // Norte v2 urgency-only border system
  const isOverdue = task.due && task.due < new Date().toISOString().split("T")[0];
  const isP1 = task.priority === "P1" || task.urgent;
  const isP2 = task.priority === "P2";
  const borderColor = isOverdue ? "rgba(255,59,48,0.4)"
    : isP1 ? "rgba(255,59,48,0.25)"
    : isP2 ? "rgba(255,149,0,0.18)"
    : "var(--border)";
  const insetShadow = isOverdue ? "inset 2px 0 0 #ff3b30"
    : isP1 ? "inset 2px 0 0 rgba(255,59,48,0.55)"
    : isP2 ? "inset 2px 0 0 rgba(255,149,0,0.5)"
    : "none";
  const checkColor = isOverdue || isP1 ? "#ff3b30" : isP2 ? "#ff9500" : "var(--brand)";

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
      setTimeout(() => onDone(task.id), 320);
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
    if (diff < 0) return { text: `เลย ${Math.abs(diff)} วัน`, color: "#ff3b30" };
    if (diff === 0) return { text: "วันนี้", color: "#ff9500" };
    if (diff === 1) return { text: "พรุ่งนี้", color: "#ff9500" };
    const dateOnly = task.due.includes("T") ? task.due.split("T")[0] : task.due;
    const d = new Date(dateOnly + "T00:00:00");
    return { text: `${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`, color: "var(--text-3)" };
  };
  const due = dueLabel();
  const swipePct = Math.min(swipeX / SWIPE_THRESHOLD, 1);

  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden" }}>
      {/* Reveal layer */}
      <div style={{
        position: "absolute", inset: 0,
        background: swipePct >= 1 ? "var(--brand)" : "var(--brand-dim)",
        display: "flex", alignItems: "center", paddingLeft: 18,
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
          ...CARD,
          display: "flex", alignItems: "center", gap: 12,
          borderColor,
          boxShadow: insetShadow,
          opacity: done ? 0 : 1,
          transform: done ? "translateX(20px)" : `translateX(${swipeX}px)`,
          transition: swipeX === 0 ? "transform 0.32s cubic-bezier(0.32,0.72,0,1), opacity 0.3s" : "none",
          cursor: onClick ? "pointer" : "default",
        }}
      >
        {/* Done button */}
        <button
          onClick={handleDone}
          disabled={loading}
          style={{
            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
            border: `1.5px solid ${loading ? checkColor : "var(--border)"}`,
            background: loading ? checkColor + "22" : "transparent",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          {loading && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={checkColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1.5 5l3 3 4-4"/>
            </svg>
          )}
        </button>

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14,
            fontWeight: isP1 ? 700 : isP2 ? 600 : 500,
            color: "var(--text-1)", lineHeight: 1.3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {task.title}
          </div>
          <TaskMeta task={task} />
        </div>

        {/* Due date */}
        {due && (
          <span style={{ fontSize: 11, color: due.color, flexShrink: 0, fontWeight: 600 }}>
            {due.text}
          </span>
        )}
        {/* Arrow */}
        {onClick && <ChevronRightIcon size={14} color="var(--text-3)" />}
      </div>
    </div>
  );
}

/* ─── Section — Norte v2 task-section-header style ─── */
export function Section({
  icon, label, count, color,
  tasks, onDone, onTaskClick,
  defaultOpen = true, limit = 99,
  forceShow = false,
}: {
  icon: React.ReactNode; label: string; count: number;
  color: string; bg?: string;
  tasks: Task[]; onDone: (id: string) => void;
  onTaskClick?: (t: Task) => void;
  defaultOpen?: boolean; limit?: number;
  forceShow?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [showAll, setShowAll] = useState(false);
  if (!tasks.length && !forceShow) return null;
  const visible = showAll ? tasks : tasks.slice(0, limit);
  const hasItems = tasks.length > 0;

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Section header — matches mockup task-section-header */}
      <button
        onClick={() => hasItems && setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "20px 0 10px",
          background: "transparent", border: "none",
          cursor: hasItems ? "pointer" : "default",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
            {label}
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {hasItems ? (
            <span style={{
              fontSize: 10, fontWeight: 700, color: "var(--brand)",
              background: "var(--brand-soft)", borderRadius: 20,
              padding: "2px 8px", border: "1px solid rgba(0,129,255,0.2)",
            }}>{count} งาน</span>
          ) : (
            <span style={{ fontSize: 10, color: "var(--text-3)" }}>ว่าง</span>
          )}
          {hasItems && (
            <span style={{ display: "flex", transform: open ? "none" : "rotate(-90deg)", transition: "transform 0.2s" }}>
              <ChevronDownIcon size={12} color="var(--text-3)" />
            </span>
          )}
        </span>
      </button>

      {open && hasItems && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {visible.map(t => (
              <TaskRow
                key={t.id}
                task={t}
                onDone={onDone}
                onClick={onTaskClick ? () => onTaskClick(t) : undefined}
              />
            ))}
          </div>
          {!showAll && tasks.length > limit && (
            <button
              onClick={e => { e.stopPropagation(); setShowAll(true); }}
              style={{
                marginTop: 6, width: "100%",
                padding: "9px 0", borderRadius: 10,
                background: "transparent",
                border: "1px dashed var(--border)",
                fontSize: 11, color: "var(--text-3)", cursor: "pointer",
                textAlign: "center",
              }}
            >
              + {tasks.length - limit} งานอีก
            </button>
          )}
        </div>
      )}
    </div>
  );
}
