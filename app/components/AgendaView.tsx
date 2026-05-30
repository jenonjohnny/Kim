"use client";
import { useState } from "react";
import { Task } from "./types";
import { FlagIcon, DotIcon, ClockIcon, ChevronRightIcon } from "./icons";

const THAI_DAYS_FULL  = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัส","ศุกร์","เสาร์"];
const THAI_MONTHS_SHORT = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

const AREA_COLOR: Record<string, string> = {
  sts:     "var(--brand)",
  daisi:   "var(--brand)",
  digital: "var(--brand)",
};

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}

/* ── Single task row ── */
function AgendaRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const areaColor = task.area ? (AREA_COLOR[task.area] ?? "var(--border)") : "var(--border)";
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "10px 14px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${areaColor}`,
        borderRadius: 12, cursor: "pointer", textAlign: "left",
        transition: "background 0.1s",
      }}
    >
      <span style={{ flexShrink: 0, display: "flex" }}>
        {task.priority === "P1"
          ? <FlagIcon size={12} color="var(--red)" />
          : <DotIcon size={8} color={areaColor} />}
      </span>
      <span style={{
        flex: 1, fontSize: 13, fontWeight: 500, color: "var(--text-1)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {task.title}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {task.status === "Waiting" && (
          <span style={{ fontSize: 9, color: "var(--brand)", fontWeight: 700 }}>รอ</span>
        )}
        {task.area && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: areaColor,
            background: areaColor + "18", borderRadius: 4, padding: "1px 5px",
          }}>
            {task.area === "sts" ? "STS" : task.area === "daisi" ? "Daisi" : "Digital"}
          </span>
        )}
        <ChevronRightIcon size={12} color="var(--text-3)" />
      </div>
    </button>
  );
}

/* ── Day header pill ── */
function DayHeader({ date, count, isToday, isPast }: {
  date: Date; count: number; isToday: boolean; isPast: boolean;
}) {
  const dow = date.getDay();
  const isWeekend = dow === 0 || dow === 6;
  const label = isToday ? "วันนี้"
    : isPast ? THAI_DAYS_FULL[dow]
    : THAI_DAYS_FULL[dow];
  const dateLabel = `${date.getDate()} ${THAI_MONTHS_SHORT[date.getMonth()]}`;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "14px 4px 8px",
    }}>
      {/* Day pill */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        width: 42, flexShrink: 0,
        background: isToday ? "var(--brand)" : "var(--bg-raised)",
        border: `1px solid ${isToday ? "var(--brand)" : "var(--border)"}`,
        borderRadius: 10, padding: "5px 0",
      }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.04em",
          color: isToday ? "#000" : isPast ? "var(--text-3)" : isWeekend ? "var(--brand)" : "var(--text-3)",
        }}>
          {THAI_DAYS_FULL[dow].slice(0, 3)}
        </span>
        <span style={{
          fontSize: 15, fontWeight: 800, lineHeight: 1.1,
          color: isToday ? "#000" : isPast ? "var(--text-3)" : "var(--text-1)",
        }}>
          {date.getDate()}
        </span>
      </div>

      {/* Label */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: isToday ? "var(--brand)" : isPast ? "var(--text-3)" : isWeekend ? "var(--brand)" : "var(--text-2)",
          }}>{label}</span>
          {isToday && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: "var(--brand)",
              background: "var(--brand-soft)", borderRadius: 4,
              padding: "1px 5px", letterSpacing: "0.06em",
            }}>TODAY</span>
          )}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 1 }}>{dateLabel}</div>
      </div>

      {/* Count badge */}
      {count > 0 && (
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: isToday && isPast ? "var(--red)" : isToday ? "var(--brand)" : "var(--text-3)",
          background: "var(--bg-raised)", borderRadius: 6,
          padding: "2px 8px", flexShrink: 0,
        }}>{count}</span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   AGENDA VIEW
══════════════════════════════════════════ */
interface Props {
  urgent: Task[];
  soon:   Task[];
  normal: Task[];
  review: Task[];
  onTaskClick: (t: Task) => void;
}

export default function AgendaView({ urgent, soon, normal, review, onTaskClick }: Props) {
  const today    = new Date();
  const todayStr = toDateStr(today);
  const [showUndated, setShowUndated] = useState(false);

  // Deduplicate
  const seen = new Set<string>();
  const allTasks = [...urgent, ...soon, ...normal, ...review].filter(t => {
    if (seen.has(t.id)) return false; seen.add(t.id); return true;
  });

  // Split overdue vs dated vs undated
  const overdue  = allTasks.filter(t => t.due && t.due < todayStr);
  const dated    = allTasks.filter(t => t.due && t.due >= todayStr);
  const undated  = allTasks.filter(t => !t.due);

  // Group dated by day
  const byDate: Record<string, Task[]> = {};
  dated.forEach(t => {
    const d = t.due!.split("T")[0];
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(t);
  });

  // Build timeline: today → 14 days, include days with tasks beyond that
  const taskDates = new Set(Object.keys(byDate));
  const timelineDates: string[] = [];
  // Always include today + 13 more days
  for (let i = 0; i < 14; i++) {
    timelineDates.push(toDateStr(addDays(today, i)));
  }
  // Add any task dates beyond 14 days
  taskDates.forEach(d => { if (!timelineDates.includes(d)) timelineDates.push(d); });
  timelineDates.sort();

  // Summary
  const overdueCount = overdue.length;
  const todayCount   = (byDate[todayStr] ?? []).length;
  const totalActive  = allTasks.filter(t => t.status !== "Waiting").length;

  return (
    <div>
      {/* ── Summary strip ── */}
      <div style={{
        display: "flex", gap: 0, marginBottom: 16,
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 14, overflow: "hidden",
      }}>
        {[
          { label: "เลยกำหนด", n: overdueCount, color: overdueCount > 0 ? "var(--red)" : "var(--text-3)" },
          { label: "วันนี้",    n: todayCount,   color: "var(--brand)"      },
          { label: "ไม่มีกำหนด", n: undated.length, color: "var(--text-3)" },
          { label: "รวมทั้งหมด", n: totalActive,  color: "var(--brand)" },
        ].map((s, i) => (
          <div key={s.label} style={{
            flex: 1, textAlign: "center", padding: "11px 4px",
            borderLeft: i > 0 ? "1px solid var(--border)" : "none",
          }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Overdue section ── */}
      {overdue.length > 0 && (
        <div style={{
          background: "rgba(255,80,80,0.06)",
          border: "1px solid rgba(255,80,80,0.2)",
          borderRadius: 14, padding: "12px 14px", marginBottom: 12,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 10, fontWeight: 700, color: "var(--red)",
            letterSpacing: "0.1em", marginBottom: 10,
          }}>
            <ClockIcon size={11} color="var(--red)" />
            เลยกำหนด · {overdue.length} งาน
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {overdue.map(t => (
              <AgendaRow key={t.id} task={t} onClick={() => onTaskClick(t)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Daily timeline ── */}
      {timelineDates.map(ds => {
        const tasks = byDate[ds] ?? [];
        // Skip empty days beyond 3 days from today
        const daysFromToday = Math.ceil((new Date(ds).getTime() - today.getTime()) / 86400000);
        if (tasks.length === 0 && daysFromToday > 3) return null;

        const date    = new Date(ds + "T00:00:00");
        const isToday = ds === todayStr;
        const isPast  = ds < todayStr;

        return (
          <div key={ds} style={{ marginBottom: 4 }}>
            <DayHeader date={date} count={tasks.length} isToday={isToday} isPast={isPast} />
            {tasks.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingLeft: 52 }}>
                {tasks.map(t => (
                  <AgendaRow key={t.id} task={t} onClick={() => onTaskClick(t)} />
                ))}
              </div>
            ) : (
              <div style={{ paddingLeft: 52, fontSize: 11, color: "var(--text-3)", paddingBottom: 4 }}>ว่าง</div>
            )}
          </div>
        );
      })}

      {/* ── Undated ── */}
      {undated.length > 0 && (
        <div style={{
          marginTop: 12,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 14, overflow: "hidden",
        }}>
          <button
            onClick={() => setShowUndated(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "12px 14px",
              background: "transparent", border: "none", cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", flex: 1, textAlign: "left" }}>
              ยังไม่กำหนดวัน
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, color: "var(--text-3)",
              background: "var(--bg-raised)", borderRadius: 6, padding: "2px 8px",
            }}>{undated.length}</span>
            <span style={{ display: "flex", transform: showUndated ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
              <ChevronRightIcon size={13} color="var(--text-3)" />
            </span>
          </button>
          {showUndated && (
            <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
              {undated.map(t => (
                <AgendaRow key={t.id} task={t} onClick={() => onTaskClick(t)} />
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ textAlign: "center", fontSize: 10, color: "var(--text-3)", marginTop: 16, paddingBottom: 4 }}>
        แสดงทุก Active task · 14 วันข้างหน้า
      </div>
    </div>
  );
}
