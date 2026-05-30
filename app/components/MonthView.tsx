"use client";
import { useState } from "react";
import { Task } from "./types";
import { ChevronLeftIcon, ChevronRightIcon, FlagIcon, DotIcon } from "./icons";

const THAI_DAYS_SHORT  = ["อา","จ","อ","พ","พฤ","ศ","ส"];
const THAI_MONTHS_FULL = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const THAI_MONTHS_SHORT = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

const AREA_COLOR: Record<string, string> = {
  sts:     "var(--brand)",
  daisi:   "var(--brand)",
  digital: "var(--brand)",
};

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/* ── Task chip inside the day panel ── */
function TaskChip({ task, onClick }: { task: Task; onClick: () => void }) {
  const areaColor = task.area ? (AREA_COLOR[task.area] ?? "var(--border)") : "var(--border)";
  const isP1 = task.priority === "P1";

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        width: "100%", padding: "9px 12px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${areaColor}`,
        borderRadius: 10, cursor: "pointer",
        textAlign: "left", transition: "background 0.1s",
      }}
    >
      <span style={{ flexShrink: 0, display: "flex" }}>
        {isP1
          ? <FlagIcon size={11} color="var(--red)" />
          : <DotIcon size={8} color={areaColor} />}
      </span>
      <span style={{
        flex: 1, fontSize: 13, fontWeight: 500, color: "var(--text-1)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {task.title}
      </span>
      {task.area && (
        <span style={{
          fontSize: 9, fontWeight: 700, color: areaColor,
          background: areaColor + "18", borderRadius: 4, padding: "1px 6px", flexShrink: 0,
        }}>
          {task.area === "sts" ? "STS" : task.area === "daisi" ? "Daisi" : "Digital"}
        </span>
      )}
      <ChevronRightIcon size={12} color="var(--text-3)" />
    </button>
  );
}

/* ══════════════════════════════════════════
   MONTH VIEW — main export
══════════════════════════════════════════ */
interface Props {
  urgent: Task[];
  soon:   Task[];
  normal: Task[];
  review: Task[];
  onTaskClick: (t: Task) => void;
}

export default function MonthView({ urgent, soon, normal, review, onTaskClick }: Props) {
  const today     = new Date();
  const todayStr  = toDateStr(today);

  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);

  // Calculate target month
  const baseYear  = today.getFullYear();
  const baseMonth = today.getMonth();
  const targetDate = new Date(baseYear, baseMonth + monthOffset, 1);
  const year  = targetDate.getFullYear();
  const month = targetDate.getMonth();

  const daysInMonth   = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun

  // Deduplicate all tasks
  const seen = new Set<string>();
  const allTasks = [...urgent, ...soon, ...normal, ...review].filter(t => {
    if (seen.has(t.id)) return false;
    seen.add(t.id); return true;
  });

  // Group tasks by date
  const byDate: Record<string, Task[]> = {};
  const undated: Task[] = [];
  allTasks.forEach(t => {
    if (t.due) {
      const d = t.due.split("T")[0]; // strip time if any
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(t);
    } else {
      undated.push(t);
    }
  });

  // Selected day tasks
  const selectedTasks = selectedDate ? (byDate[selectedDate] ?? []) : [];

  // Month summary
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd   = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  const monthTasks = allTasks.filter(t => t.due && t.due >= monthStart && t.due <= monthEnd);
  const overdueCount = allTasks.filter(t => t.due && t.due < todayStr).length;

  // Grid cells: leading blanks + day cells
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(totalCells - firstDayOfWeek - daysInMonth).fill(null),
  ];

  // Month label
  const monthLabel = `${THAI_MONTHS_FULL[month]} ${year + 543}`;
  const isThisMonth = monthOffset === 0;

  return (
    <div>
      {/* ── Month navigator ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px", marginBottom: 12,
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 14,
      }}>
        <button
          onClick={() => setMonthOffset(v => v - 1)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
        >
          <ChevronLeftIcon size={18} color="var(--text-3)" />
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
            {isThisMonth ? "เดือนนี้" : monthLabel}
          </div>
          {isThisMonth && (
            <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 1 }}>{monthLabel}</div>
          )}
        </div>
        <button
          onClick={() => setMonthOffset(v => v + 1)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
        >
          <ChevronRightIcon size={18} color="var(--text-3)" />
        </button>
      </div>

      {/* ── Summary strip ── */}
      <div style={{
        display: "flex", gap: 0, marginBottom: 14,
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 12, overflow: "hidden",
      }}>
        {[
          { label: "งานเดือนนี้",   n: monthTasks.length, color: "var(--brand)" },
          { label: "เลยกำหนด",      n: overdueCount,       color: "var(--red)"        },
          { label: "ไม่มีกำหนด",    n: undated.length,     color: "var(--text-3)"     },
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

      {/* ── Day-of-week header ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
        marginBottom: 4, paddingBottom: 6,
        borderBottom: "1px solid var(--border-soft)",
      }}>
        {THAI_DAYS_SHORT.map((d, i) => {
          const isWeekend = i === 0 || i === 6;
          return (
            <div key={d} style={{
              textAlign: "center", fontSize: 10, fontWeight: 700,
              color: isWeekend ? "var(--brand)" : "var(--text-3)",
              padding: "4px 0",
            }}>{d}</div>
          );
        })}
      </div>

      {/* ── Month grid ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
        gap: "3px 2px", marginBottom: 14,
      }}>
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`blank-${idx}`} />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const tasks = byDate[dateStr] ?? [];
          const isToday    = dateStr === todayStr;
          const isPast     = dateStr < todayStr;
          const isSelected = dateStr === selectedDate;
          const isWeekend  = (idx % 7 === 0) || (idx % 7 === 6);
          const hasOverdue = isPast && tasks.length > 0;

          // Dot colors for up to 3 tasks
          const dotColors = tasks.slice(0, 3).map(t =>
            t.area ? (AREA_COLOR[t.area] ?? "var(--border)") : "var(--border)"
          );

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "6px 2px",
                borderRadius: 10,
                border: isSelected
                  ? `1.5px solid ${isToday ? "var(--brand)" : "var(--brand)"}`
                  : "1.5px solid transparent",
                background: isToday
                  ? "var(--brand)"
                  : isSelected
                    ? (isToday ? "var(--brand-soft)" : "rgba(0,129,255,0.12)")
                    : "transparent",
                cursor: "pointer",
                transition: "all 0.12s",
                minHeight: 48,
              }}
            >
              {/* Date number */}
              <span style={{
                fontSize: 13, fontWeight: isToday ? 800 : tasks.length > 0 ? 600 : 400,
                color: isToday
                  ? "#000"
                  : hasOverdue
                    ? "var(--red)"
                    : isPast
                      ? "var(--text-3)"
                      : isWeekend
                        ? "var(--brand)"
                        : "var(--text-1)",
                lineHeight: 1,
              }}>
                {day}
              </span>

              {/* Task count badge */}
              {tasks.length > 0 ? (
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  color: hasOverdue ? "var(--red)" : isToday ? "#000" : "var(--text-3)",
                  marginTop: 2, lineHeight: 1,
                }}>
                  {tasks.length}
                </span>
              ) : (
                <span style={{ height: 11 }} />
              )}

              {/* Color dots */}
              {dotColors.length > 0 && (
                <div style={{ display: "flex", gap: 2, marginTop: 3 }}>
                  {dotColors.map((c, i) => (
                    <div key={i} style={{
                      width: 4, height: 4, borderRadius: "50%",
                      background: isToday ? "rgba(0,0,0,0.4)" : c,
                    }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Selected day panel ── */}
      {selectedDate && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 14, padding: "14px 14px 10px",
          marginBottom: 14,
        }}>
          {/* Panel header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
          }}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              background: selectedDate === todayStr ? "var(--brand)" : "var(--bg-raised)",
              border: `1px solid ${selectedDate === todayStr ? "var(--brand)" : "var(--border)"}`,
              borderRadius: 8, padding: "4px 8px", minWidth: 36, flexShrink: 0,
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: selectedDate === todayStr ? "#000" : "var(--text-3)", lineHeight: 1 }}>
                {THAI_DAYS_SHORT[new Date(selectedDate).getDay()]}
              </span>
              <span style={{ fontSize: 15, fontWeight: 800, color: selectedDate === todayStr ? "#000" : "var(--text-1)", lineHeight: 1.1 }}>
                {new Date(selectedDate).getDate()}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>
                {new Date(selectedDate).getDate()} {THAI_MONTHS_SHORT[new Date(selectedDate).getMonth()]} {new Date(selectedDate).getFullYear() + 543}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 1 }}>
                {selectedTasks.length > 0 ? `${selectedTasks.length} งาน` : "ว่าง"}
              </div>
            </div>
          </div>

          {/* Tasks */}
          {selectedTasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "10px 0 6px", color: "var(--text-3)", fontSize: 12 }}>
              ไม่มีงานวันนี้
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {selectedTasks.map(t => (
                <TaskChip key={t.id} task={t} onClick={() => onTaskClick(t)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Undated tasks ── */}
      {undated.length > 0 && (
        <UndatedPanel tasks={undated} onTaskClick={onTaskClick} />
      )}

      <div style={{ textAlign: "center", fontSize: 10, color: "var(--text-3)", marginTop: 8, paddingBottom: 4 }}>
        แตะวันเพื่อดูงาน
      </div>
    </div>
  );
}

/* ── Undated collapsible ── */
function UndatedPanel({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (t: Task) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 14, overflow: "hidden", marginBottom: 8,
    }}>
      <button
        onClick={() => setOpen(v => !v)}
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
          background: "var(--bg-raised)", borderRadius: 6,
          padding: "2px 8px",
        }}>
          {tasks.length}
        </span>
        {open
          ? <ChevronLeftIcon size={13} color="var(--text-3)" />
          : <ChevronRightIcon size={13} color="var(--text-3)" />}
      </button>
      {open && (
        <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          {tasks.map(t => (
            <TaskChip key={t.id} task={t} onClick={() => onTaskClick(t)} />
          ))}
        </div>
      )}
    </div>
  );
}
