"use client";
import { useState } from "react";

export const THAI_MONTHS_SHORT = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const DAY_LABELS = ["อา","จ","อ","พ","พฤ","ศ","ส"];

export function formatDateTH(s: string) {
  const d = new Date(s.slice(0, 10) + "T00:00:00");
  return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function MiniToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={e => { e.preventDefault(); e.stopPropagation(); onToggle(); }}
      style={{
        width: 38, height: 22, borderRadius: 11, flexShrink: 0, cursor: "pointer",
        background: on ? "var(--brand)" : "var(--bg-raised)",
        border: `1.5px solid ${on ? "var(--brand)" : "var(--border)"}`,
        position: "relative", transition: "background 0.2s, border-color 0.2s",
      }}
    >
      <div style={{
        position: "absolute", top: 2, left: on ? 17 : 2,
        width: 16, height: 16, borderRadius: "50%",
        background: on ? "#000" : "var(--text-3)",
        transition: "left 0.2s",
      }} />
    </div>
  );
}

export function CalendarPicker({
  startValue, onStartChange, endValue, onEndChange,
}: {
  startValue: string; onStartChange: (v: string) => void;
  endValue: string;   onEndChange: (v: string) => void;
}) {
  const today = new Date();
  const parseSel = (s: string) => s ? new Date(s.slice(0, 10) + "T00:00:00") : null;
  const selStart = parseSel(startValue);

  const initMonth = selStart || today;
  const [year, setYear]   = useState(initMonth.getFullYear());
  const [month, setMonth] = useState(initMonth.getMonth());
  const [showEnd, setShowEnd] = useState(!!endValue);
  const [picking, setPicking] = useState<"start" | "end">("start");

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr    = today.toISOString().split("T")[0];

  // ── Always 42 cells (6 rows × 7) — ไม่เปลี่ยน height ตามเดือน ──
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < 42) cells.push(null); // pad to always 6 rows

  const prevMonth = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1);
  };
  const nextMonth = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1);
  };
  const goToday = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setYear(today.getFullYear()); setMonth(today.getMonth());
  };

  const handleDayClick = (e: React.MouseEvent, dateStr: string) => {
    e.preventDefault(); e.stopPropagation();
    if (picking === "start") {
      onStartChange(dateStr);
      if (endValue && endValue.slice(0, 10) < dateStr) onEndChange("");
      if (showEnd) setPicking("end");
    } else {
      if (dateStr < startValue.slice(0, 10)) { onStartChange(dateStr); setPicking("start"); }
      else onEndChange(dateStr);
    }
  };

  const isInRange = (dateStr: string) =>
    !!(startValue && endValue && dateStr > startValue.slice(0, 10) && dateStr < endValue.slice(0, 10));

  const hasDates = !!(startValue || endValue);

  return (
    /* ── stop scroll propagation entirely ── */
    <div
      onTouchMove={e => e.stopPropagation()}
      onScroll={e => e.stopPropagation()}
      style={{
        marginTop: 8, background: "var(--bg-card)", borderRadius: 16,
        border: "1px solid var(--border)", overflow: "hidden",
        /* ── fixed structure — ไม่เปลี่ยน height ── */
        userSelect: "none",
      }}
    >
      {/* Month/Year nav */}
      <div style={{ display: "flex", alignItems: "center", padding: "12px 16px 8px" }}>
        <button onClick={prevMonth} style={{
          background: "none", border: "none", color: "var(--text-2)",
          cursor: "pointer", fontSize: 22, padding: "0 4px", lineHeight: 1,
          minWidth: 32, textAlign: "center",
        }}>‹</button>
        <div style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
          {THAI_MONTHS_SHORT[month]} {year + 543}
        </div>
        <button onClick={goToday} style={{
          background: "none", border: "none", color: "var(--text-3)",
          cursor: "pointer", fontSize: 11, padding: "0 6px",
        }}>วันนี้</button>
        <button onClick={nextMonth} style={{
          background: "none", border: "none", color: "var(--text-2)",
          cursor: "pointer", fontSize: 22, padding: "0 4px", lineHeight: 1,
          minWidth: 32, textAlign: "center",
        }}>›</button>
      </div>

      {/* Picking tabs — always rendered, hidden when showEnd=false → ไม่ shift layout */}
      <div style={{
        display: "flex", gap: 6, padding: "0 14px 8px",
        visibility: showEnd ? "visible" : "hidden",
        height: showEnd ? "auto" : 56, // reserve fixed space
        overflow: "hidden",
      }}>
        {(["start", "end"] as const).map(mode => {
          const val = mode === "start" ? startValue : endValue;
          const active = picking === mode;
          return (
            <button
              key={mode}
              onClick={e => { e.preventDefault(); e.stopPropagation(); setPicking(mode); }}
              style={{
                flex: 1, padding: "7px 8px", borderRadius: 10, cursor: "pointer",
                border: `1.5px solid ${active ? "var(--brand)" : "var(--border)"}`,
                background: active ? "var(--brand-soft)" : "transparent",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 9, color: "var(--text-3)", fontWeight: 600, marginBottom: 2 }}>
                {mode === "start" ? "วันเริ่ม" : "วันสิ้นสุด"}
              </div>
              <div style={{ fontSize: 11, color: val ? "var(--brand)" : "var(--text-3)", fontWeight: val ? 600 : 400 }}>
                {val ? formatDateTH(val) : "ยังไม่เลือก"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 10px" }}>
        {DAY_LABELS.map((d, i) => (
          <div key={d} style={{
            textAlign: "center", fontSize: 10, fontWeight: 600, padding: "2px 0 4px",
            color: i === 0 ? "var(--red)" : "var(--text-3)",
          }}>{d}</div>
        ))}
      </div>

      {/* Day grid — always 42 cells = 6 rows, fixed height */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
        gap: 2, padding: "0 10px 10px",
      }}>
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`e${i}`} style={{ padding: "8px 2px" }} />;
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday  = dateStr === todayStr;
          const isStart  = dateStr === startValue.slice(0, 10);
          const isEnd    = dateStr === endValue.slice(0, 10);
          const inRange  = isInRange(dateStr);
          return (
            <button
              key={`d${day}`}
              onClick={e => handleDayClick(e, dateStr)}
              style={{
                padding: "8px 2px", textAlign: "center", borderRadius: 8,
                background: isStart || isEnd ? "var(--brand)" : inRange ? "var(--brand-soft)" : "transparent",
                border: `1px solid ${isToday && !isStart && !isEnd ? "rgba(0,129,255,0.4)" : "transparent"}`,
                color: isStart || isEnd ? "#000" : isToday ? "var(--brand)" : inRange ? "var(--brand)" : "var(--text-1)",
                fontSize: 12, fontWeight: isStart || isEnd || isToday ? 700 : 400,
                cursor: "pointer", transition: "background 0.1s",
              }}
            >{day}</button>
          );
        })}
      </div>

      {/* End date toggle */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", borderTop: "1px solid var(--border-soft)",
      }}>
        <span style={{ fontSize: 13, color: "var(--text-2)" }}>วันสิ้นสุด</span>
        <MiniToggle on={showEnd} onToggle={() => {
          const next = !showEnd;
          setShowEnd(next);
          if (!next) { onEndChange(""); setPicking("start"); }
          else setPicking("end");
        }} />
      </div>

      {/* Clear — always takes space, invisible when no dates → ไม่ shift */}
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); onStartChange(""); onEndChange(""); setShowEnd(false); setPicking("start"); }}
        style={{
          width: "100%", padding: "11px", borderTop: "1px solid var(--border-soft)",
          background: "transparent", border: "none",
          fontSize: 12, cursor: hasDates ? "pointer" : "default",
          fontWeight: 600, letterSpacing: "0.04em",
          color: hasDates ? "var(--text-3)" : "transparent",
          pointerEvents: hasDates ? "auto" : "none",
        }}
      >✕  ล้างวันที่</button>
    </div>
  );
}
