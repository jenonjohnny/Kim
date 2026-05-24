"use client";
import { useEffect, useState } from "react";
import { Task } from "./types";
import { AreaItem, getVisibleAreaIds, getPinnedAreaIds } from "./SettingsSheet";

const PRIORITIES = ["P1", "P2", "P3"] as const;
const PRIORITY_INFO: Record<string, { emoji: string; color: string }> = {
  P1: { emoji: "🔴", color: "var(--red)" },
  P2: { emoji: "🟡", color: "var(--amber)" },
  P3: { emoji: "🔵", color: "var(--steel-teal)" },
};

const THAI_MONTHS_SHORT = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const DAY_LABELS = ["อา","จ","อ","พ","พฤ","ศ","ส"];

function formatDateTH(s: string) {
  const d = new Date(s + "T00:00:00");
  return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`;
}

/* ── Custom inline calendar ── */
function CalendarPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const today = new Date();
  const sel = value ? new Date(value + "T00:00:00") : null;
  const [year, setYear]   = useState(sel?.getFullYear() || today.getFullYear());
  const [month, setMonth] = useState(sel?.getMonth() ?? today.getMonth());

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr    = today.toISOString().split("T")[0];

  const prevMonth = () => month === 0  ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1);
  const nextMonth = () => month === 11 ? (setMonth(0),  setYear(y => y + 1)) : setMonth(m => m + 1);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{
      marginTop: 8, padding: "12px 10px",
      background: "var(--bg-raised)", borderRadius: 14,
      border: "1px solid var(--border)",
    }}>
      {/* Month/Year nav */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <button onClick={prevMonth} style={{
          background: "none", border: "none", color: "var(--text-2)",
          cursor: "pointer", fontSize: 20, padding: "0 10px", lineHeight: 1,
        }}>‹</button>
        <div style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
          {THAI_MONTHS_SHORT[month]} {year + 543}
        </div>
        <button onClick={nextMonth} style={{
          background: "none", border: "none", color: "var(--text-2)",
          cursor: "pointer", fontSize: 20, padding: "0 10px", lineHeight: 1,
        }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
        {DAY_LABELS.map((d, i) => (
          <div key={d} style={{
            textAlign: "center", fontSize: 10, fontWeight: 600, padding: "2px 0",
            color: i === 0 ? "var(--red)" : "var(--text-3)",
          }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday    = dateStr === todayStr;
          const isSelected = dateStr === value;
          return (
            <button key={day} onClick={() => onChange(dateStr)} style={{
              padding: "7px 2px", textAlign: "center",
              background: isSelected ? "var(--amber)" : isToday ? "var(--brand-soft)" : "transparent",
              border: `1px solid ${isToday && !isSelected ? "rgba(255,185,0,0.35)" : "transparent"}`,
              borderRadius: 8,
              color: isSelected ? "#000" : isToday ? "var(--amber)" : "var(--text-1)",
              fontSize: 12, fontWeight: isSelected || isToday ? 700 : 400,
              cursor: "pointer", transition: "background 0.12s",
            }}>{day}</button>
          );
        })}
      </div>

      {/* Clear */}
      {value && (
        <button onClick={() => onChange("")} style={{
          marginTop: 10, width: "100%",
          background: "transparent", border: "1px solid var(--border)",
          borderRadius: 8, padding: "7px", fontSize: 11,
          color: "var(--text-3)", cursor: "pointer",
        }}>✕ ล้างวันที่</button>
      )}
    </div>
  );
}

/* ── Main Modal ── */
export default function AddTaskModal({ onClose, onAdd }: { onClose: () => void; onAdd: (t: Task) => void }) {
  const [title, setTitle]       = useState("");
  const [notes, setNotes]       = useState("");
  const [due, setDue]           = useState("");
  const [showCal, setShowCal]   = useState(false);
  const [areaId, setAreaId]     = useState("");
  const [priority, setPriority] = useState<string>("P3");
  const [isUrgent, setIsUrgent] = useState(false);
  const [areas, setAreas]       = useState<AreaItem[]>([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    fetch("/api/areas")
      .then(r => r.json())
      .then(d => {
        const all: AreaItem[] = d.areas || [];
        const visibleIds  = getVisibleAreaIds(all);
        const pinnedIds   = getPinnedAreaIds();
        const visible = all
          .filter(a => visibleIds.includes(a.id))
          .sort((a, b) => {
            const ap = pinnedIds.includes(a.id) ? 0 : 1;
            const bp = pinnedIds.includes(b.id) ? 0 : 1;
            if (ap !== bp) return ap - bp;
            return a.name.localeCompare(b.name, "th");
          });
        setAreas(visible);
        if (visible.length > 0) setAreaId(visible[0].id);
      });
  }, []);

  const submit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:  title.trim(),
        notes:  notes.trim() || undefined,
        due:    due || undefined,
        areaId: areaId || undefined,
        priority,
        urgent: isUrgent ? "!!!!" : undefined,
      }),
    });
    const task = await res.json();
    onAdd(task);
    onClose();
  };

  const selectedArea = areas.find(a => a.id === areaId);

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}
    >
      <div style={{
        background: "var(--bg-card)", borderTop: "1px solid var(--border)",
        borderRadius: "24px 24px 0 0",
        padding: "0 20px calc(24px + env(safe-area-inset-bottom))",
        width: "100%", maxWidth: 480,
        maxHeight: "92dvh", overflowY: "auto",
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 14px" }}>
          <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 2 }} />
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 14 }}>
          ➕ เพิ่มงานใหม่
        </div>

        {/* Title */}
        <input
          autoFocus value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !showCal && submit()}
          placeholder="ชื่องาน..."
          style={{
            width: "100%", background: "var(--bg-input)",
            border: `1px solid ${title ? "rgba(255,185,0,0.4)" : "var(--border)"}`,
            borderRadius: 12, padding: "13px 14px", fontSize: 15,
            color: "var(--text-1)", outline: "none", marginBottom: 8,
            boxSizing: "border-box", fontWeight: 500,
          }}
        />

        {/* Notes */}
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Note เพิ่มเติม... (ถ้ามี)"
          rows={2}
          style={{
            width: "100%", background: "var(--bg-input)",
            border: "1px solid var(--border)", borderRadius: 12,
            padding: "10px 14px", fontSize: 13, color: "var(--text-2)",
            outline: "none", marginBottom: 14, boxSizing: "border-box",
            resize: "none", fontFamily: "inherit", lineHeight: 1.5,
          }}
        />

        {/* Area — horizontal scroll, pinned first A-Z */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.1em", marginBottom: 7 }}>พื้นที่</div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 3, msOverflowStyle: "none" } as React.CSSProperties}>
            {areas.map(area => {
              const on = areaId === area.id;
              return (
                <button key={area.id} onClick={() => setAreaId(area.id)} style={{
                  flexShrink: 0, padding: "6px 10px", borderRadius: 8, cursor: "pointer",
                  border: `1.5px solid ${on ? "var(--amber)" : "var(--border)"}`,
                  background: on ? "var(--brand-soft)" : "transparent",
                  color: on ? "var(--amber)" : "var(--text-3)",
                  fontSize: 11, fontWeight: on ? 700 : 400,
                  whiteSpace: "nowrap", transition: "all 0.15s",
                }}>
                  {area.emoji || "📁"} {area.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Due date — custom calendar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.1em", marginBottom: 7 }}>วันที่กำหนด</div>
          <button
            onClick={() => setShowCal(v => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "11px 14px", borderRadius: 12, cursor: "pointer",
              background: "var(--bg-input)",
              border: `1.5px solid ${due ? "rgba(255,185,0,0.4)" : showCal ? "rgba(255,185,0,0.25)" : "var(--border)"}`,
            }}
          >
            <span style={{ fontSize: 17 }}>📅</span>
            <span style={{
              flex: 1, fontSize: 14, textAlign: "left",
              color: due ? "var(--amber)" : "var(--text-3)",
              fontWeight: due ? 600 : 400,
            }}>
              {due ? formatDateTH(due) : "กำหนดวันที่..."}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>{showCal ? "▲" : "▼"}</span>
          </button>
          {showCal && (
            <CalendarPicker
              value={due}
              onChange={v => { setDue(v); if (v) setShowCal(false); }}
            />
          )}
        </div>

        {/* Priority + Urgent — single row */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.1em", marginBottom: 7 }}>ลำดับความสำคัญ</div>
          <div style={{ display: "flex", gap: 6 }}>
            {PRIORITIES.map(p => {
              const on   = priority === p;
              const info = PRIORITY_INFO[p];
              return (
                <button key={p} onClick={() => setPriority(p)} style={{
                  flex: 1, padding: "8px 4px", borderRadius: 10, cursor: "pointer",
                  border: `1.5px solid ${on ? info.color : "var(--border)"}`,
                  background: on ? info.color + "18" : "transparent",
                  color: on ? info.color : "var(--text-3)",
                  fontSize: 11, fontWeight: on ? 700 : 400, transition: "all 0.15s",
                }}>
                  {info.emoji} {p}
                </button>
              );
            })}
            <button onClick={() => setIsUrgent(p => !p)} style={{
              padding: "8px 12px", borderRadius: 10, cursor: "pointer", flexShrink: 0,
              border: `1.5px solid ${isUrgent ? "var(--red)" : "var(--border)"}`,
              background: isUrgent ? "var(--red-soft)" : "transparent",
              color: isUrgent ? "var(--red)" : "var(--text-3)",
              fontSize: 11, fontWeight: isUrgent ? 700 : 400, transition: "all 0.15s",
            }}>
              🚨 ด่วน
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "14px 0", borderRadius: 12,
            border: "1px solid var(--border)", background: "none",
            color: "var(--text-2)", cursor: "pointer", fontSize: 14,
          }}>ยกเลิก</button>
          <button onClick={submit} disabled={loading || !title.trim()} style={{
            flex: 2, padding: "14px 0", borderRadius: 12, border: "none",
            background: title.trim() ? "var(--amber)" : "var(--border)",
            color: title.trim() ? "#000" : "var(--text-3)",
            cursor: title.trim() ? "pointer" : "default",
            fontSize: 14, fontWeight: 700, transition: "all 0.2s",
          }}>
            {loading ? "กำลังเพิ่ม..." : `เพิ่มใน ${selectedArea?.name || "Notion"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
