"use client";
import { useState } from "react";
import { Task, getQuadrant, QUADRANT_INFO } from "./types";
import { ChevronLeftIcon, ChevronRightIcon, FlagIcon, ClockIcon, DotIcon } from "./icons";

const THAI_DAYS_SHORT = ["อา","จ","อ","พ","พฤ","ศ","ส"];
const THAI_DAYS_FULL  = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัส","ศุกร์","เสาร์"];
const THAI_MONTHS     = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

const AREA_COLOR: Record<string, string> = {
  sts:     "var(--amber)",
  daisi:   "var(--warm-gold)",
  digital: "var(--steel-teal)",
};

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

/* ── Compact task row ── */
function WeekTaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const q = getQuadrant(task);
  const qInfo = QUADRANT_INFO[q];
  const areaColor = task.area ? AREA_COLOR[task.area] : "var(--border)";
  const isReview = task.status === "Waiting";
  const isOnHold = task.status === "On Hold";

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "9px 12px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${areaColor}`,
        borderRadius: 10,
        cursor: "pointer",
        transition: "background 0.12s",
      }}
    >
      {/* Priority dot */}
      <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
        {task.priority === "P1"
          ? <FlagIcon size={11} color="var(--red)" />
          : <DotIcon size={8} color={qInfo.color} />}
      </span>

      {/* Title */}
      <span style={{
        flex: 1, fontSize: 12, fontWeight: 500, color: "var(--text-1)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        lineHeight: 1.3,
      }}>
        {task.title}
      </span>

      {/* Badges */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        {isReview && (
          <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 9, color: "var(--steel-teal)" }}>
            <ClockIcon size={9} color="var(--steel-teal)" /> รอ
          </span>
        )}
        {isOnHold && (
          <span style={{ fontSize: 9, color: "var(--text-3)" }}>พัก</span>
        )}
        {task.area && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: areaColor,
            background: areaColor + "18", borderRadius: 4,
            padding: "1px 5px",
          }}>
            {task.area === "sts" ? "STS" : task.area === "daisi" ? "Daisi" : "Digital"}
          </span>
        )}
        <ChevronRightIcon size={12} color="var(--text-3)" />
      </div>
    </div>
  );
}

/* ── Day section ── */
function DaySection({
  date, tasks, isToday, isPast, onTaskClick,
}: {
  date: Date; tasks: Task[]; isToday: boolean; isPast: boolean;
  onTaskClick: (t: Task) => void;
}) {
  const [open, setOpen] = useState(isToday || tasks.length > 0);
  const dow = date.getDay();
  const isWeekend = dow === 0 || dow === 6;
  const dateStr = `${date.getDate()} ${THAI_MONTHS[date.getMonth()]}`;
  const dayLabel = THAI_DAYS_FULL[dow];

  const accentColor = isToday
    ? "var(--amber)"
    : isWeekend
      ? "var(--warm-gold)"
      : isPast
        ? "var(--border)"
        : "var(--steel-teal)";

  const urgentCount = tasks.filter(t => {
    const today = toDateStr(new Date());
    return t.due && t.due <= today && t.priority === "P1";
  }).length;

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Day header */}
      <button
        onClick={() => tasks.length > 0 && setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", padding: "10px 4px 8px",
          background: "transparent", border: "none",
          cursor: tasks.length > 0 ? "pointer" : "default",
        }}
      >
        {/* Day pill */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          width: 40, flexShrink: 0,
          background: isToday ? "var(--amber)" : isPast ? "transparent" : "var(--bg-raised)",
          border: `1px solid ${isToday ? "var(--amber)" : "var(--border)"}`,
          borderRadius: 10, padding: "5px 0",
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: isToday ? "#000" : isPast ? "var(--text-3)" : "var(--text-3)", letterSpacing: "0.04em" }}>
            {THAI_DAYS_SHORT[dow]}
          </span>
          <span style={{ fontSize: 14, fontWeight: 800, color: isToday ? "#000" : isPast ? "var(--text-3)" : "var(--text-1)", lineHeight: 1.1 }}>
            {date.getDate()}
          </span>
        </div>

        {/* Label + count */}
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: isPast ? "var(--text-3)" : accentColor,
              opacity: isPast ? 0.6 : 1,
            }}>
              {dayLabel}
            </span>
            {isToday && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: "var(--amber)",
                background: "var(--brand-soft)", borderRadius: 4,
                padding: "1px 5px", letterSpacing: "0.06em",
              }}>TODAY</span>
            )}
            {isWeekend && !isToday && (
              <span style={{ fontSize: 9, color: "var(--text-3)" }}>วันหยุด</span>
            )}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 1 }}>{dateStr}</div>
        </div>

        {/* Task count */}
        {tasks.length > 0 ? (
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: urgentCount > 0 ? "var(--red)" : accentColor,
            background: (urgentCount > 0 ? "var(--red)" : accentColor) + "18",
            borderRadius: 6, padding: "2px 8px", flexShrink: 0,
          }}>
            {tasks.length}
          </span>
        ) : (
          <span style={{ fontSize: 10, color: "var(--text-3)", flexShrink: 0 }}>ว่าง</span>
        )}

        {/* Divider line */}
        <div style={{ width: 1, alignSelf: "stretch", background: "var(--border-soft)", flexShrink: 0 }} />
      </button>

      {/* Task list */}
      {open && tasks.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 50 }}>
          {tasks.map(t => (
            <WeekTaskRow key={t.id} task={t} onClick={() => onTaskClick(t)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Undated tasks section ── */
function UndatedSection({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (t: Task) => void }) {
  const [open, setOpen] = useState(false);
  if (tasks.length === 0) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", padding: "10px 4px 8px",
          background: "transparent", border: "none", cursor: "pointer",
        }}
      >
        <div style={{
          width: 40, flexShrink: 0,
          background: "var(--bg-raised)",
          border: "1px solid var(--border)",
          borderRadius: 10, padding: "5px 0",
          textAlign: "center",
          fontSize: 16, color: "var(--text-3)",
        }}>
          —
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>ยังไม่กำหนดวัน</span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, color: "var(--text-3)",
          background: "var(--bg-raised)", borderRadius: 6,
          padding: "2px 8px", flexShrink: 0,
        }}>
          {tasks.length}
        </span>
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 50 }}>
          {tasks.map(t => (
            <WeekTaskRow key={t.id} task={t} onClick={() => onTaskClick(t)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   WEEK VIEW — main export
══════════════════════════════════════════ */
interface Props {
  urgent: Task[];
  soon: Task[];
  normal: Task[];
  review: Task[];
  onTaskClick: (t: Task) => void;
}

export default function WeekView({ urgent, soon, normal, review, onTaskClick }: Props) {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, -1 = last week, +1 = next week
  const today = new Date();
  const todayStr = toDateStr(today);

  const baseMonday = getMonday(today);
  const monday = addDays(baseMonday, weekOffset * 7);

  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const weekStart = toDateStr(days[0]);
  const weekEnd   = toDateStr(days[6]);

  // Merge all tasks
  const allTasks = [...urgent, ...soon, ...normal, ...review];

  // Deduplicate by id (urgent/soon can overlap)
  const seen = new Set<string>();
  const deduped = allTasks.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });

  // Group by due date (strip time component so datetime strings match day keys)
  const byDate: Record<string, Task[]> = {};
  const undated: Task[] = [];
  deduped.forEach(t => {
    if (t.due) {
      const d = t.due.split("T")[0]; // strip time
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(t);
    } else if (weekOffset === 0) {
      undated.push(t); // แสดง undated เฉพาะสัปดาห์ปัจจุบัน
    }
  });

  // Summary: tasks in this week window (compare date-only)
  const weekTasks = deduped.filter(t => {
    if (!t.due) return false;
    const d = t.due.split("T")[0];
    return d >= weekStart && d <= weekEnd;
  });
  const weekUrgent = weekTasks.filter(t => {
    const d = t.due!.split("T")[0];
    return d <= todayStr;
  }).length;

  // Week label
  const isSameMonth = days[0].getMonth() === days[6].getMonth();
  const weekLabel = isSameMonth
    ? `${days[0].getDate()}–${days[6].getDate()} ${THAI_MONTHS[days[6].getMonth()]} ${days[6].getFullYear() + 543}`
    : `${days[0].getDate()} ${THAI_MONTHS[days[0].getMonth()]} – ${days[6].getDate()} ${THAI_MONTHS[days[6].getMonth()]} ${days[6].getFullYear() + 543}`;

  return (
    <div>
      {/* ── Week navigator ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px", marginBottom: 12,
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 14,
      }}>
        <button
          onClick={() => setWeekOffset(v => v - 1)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
        >
          <ChevronLeftIcon size={18} color="var(--text-3)" />
        </button>

        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>
            {weekOffset === 0 ? "สัปดาห์นี้" : weekOffset === -1 ? "สัปดาห์ที่แล้ว" : weekOffset === 1 ? "สัปดาห์หน้า" : `${weekOffset > 0 ? "+" : ""}${weekOffset} สัปดาห์`}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>{weekLabel}</div>
        </div>

        <button
          onClick={() => setWeekOffset(v => v + 1)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
        >
          <ChevronRightIcon size={18} color="var(--text-3)" />
        </button>
      </div>

      {/* ── Summary strip ── */}
      <div style={{
        display: "flex", gap: 0, marginBottom: 12,
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 12, overflow: "hidden",
      }}>
        {[
          { label: "งานสัปดาห์นี้", n: weekTasks.length, color: "var(--steel-teal)" },
          { label: "เลยกำหนด",       n: weekUrgent,        color: "var(--red)"        },
          { label: "ยังไม่กำหนดวัน", n: undated.length,    color: "var(--text-3)"     },
        ].map((s, i) => (
          <div key={s.label} style={{
            flex: 1, textAlign: "center", padding: "10px 4px",
            borderLeft: i > 0 ? "1px solid var(--border)" : "none",
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Day rows ── */}
      {days.map(date => {
        const ds = toDateStr(date);
        const dayTasks = byDate[ds] || [];
        const isToday = ds === todayStr;
        const isPast = ds < todayStr;
        return (
          <DaySection
            key={ds}
            date={date}
            tasks={dayTasks}
            isToday={isToday}
            isPast={isPast}
            onTaskClick={onTaskClick}
          />
        );
      })}

      {/* ── Undated ── */}
      <UndatedSection tasks={undated} onTaskClick={onTaskClick} />

      <div style={{ textAlign: "center", fontSize: 10, color: "var(--text-3)", marginTop: 16, paddingBottom: 4 }}>
        แสดงเฉพาะงานที่ Active · ครอบคลุม 7 วัน
      </div>
    </div>
  );
}
