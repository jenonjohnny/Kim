"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Task } from "./types";
import { Quadrant, QUADRANT_INFO, quadrantToNotion } from "./types";
import { AreaItem, getVisibleAreaIds, getPinnedAreaIds, STORAGE_PINNED, togglePinArea } from "./SettingsSheet";
import { CalendarPicker, formatDateTH } from "./CalendarPicker";

/* ── Eisenhower 2×2 Grid — P1/P2/P3/P4 ── */
function EisenhowerPicker({ value, onChange }: { value: Quadrant; onChange: (q: Quadrant) => void }) {
  const quadrants: Quadrant[] = ["Q1", "Q2", "Q3", "Q4"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
      {quadrants.map(q => {
        const info = QUADRANT_INFO[q];
        const on = value === q;
        return (
          <button key={q} onClick={() => onChange(q)} style={{
            padding: "10px 10px 9px",
            borderRadius: 12, cursor: "pointer",
            border: `1.5px solid ${on ? info.color : "var(--border)"}`,
            background: on ? info.color + "18" : "transparent",
            textAlign: "left", transition: "all 0.15s",
          }}>
            {/* P-label + emoji */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <span style={{
                fontSize: 14, fontWeight: 800,
                color: on ? info.color : "var(--text-2)",
              }}>{info.shortLabel}</span>
              <span style={{ fontSize: 12 }}>{info.emoji}</span>
            </div>
            {/* Description */}
            <div style={{ fontSize: 10, fontWeight: 500, color: on ? info.color : "var(--text-3)", lineHeight: 1.4 }}>
              {info.label}
            </div>
            {/* Action hint */}
            <div style={{ fontSize: 9, color: on ? info.color + "cc" : "var(--text-3)", marginTop: 3, fontWeight: 600, opacity: 0.7 }}>
              → {info.action}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ── Area chip with long-press to pin ── */
function AreaChip({ area, selected, pinned, onSelect, onPin }: {
  area: AreaItem; selected: boolean; pinned: boolean;
  onSelect: () => void; onPin: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressing, setPressing] = useState(false);

  const startPress = () => {
    setPressing(true);
    timerRef.current = setTimeout(() => {
      onPin(); setPressing(false);
      try { navigator.vibrate(40); } catch (_) {}
    }, 500);
  };
  const cancelPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPressing(false);
  };

  return (
    <button
      onClick={onSelect}
      onTouchStart={startPress} onTouchEnd={cancelPress} onTouchMove={cancelPress}
      onMouseDown={startPress}  onMouseUp={cancelPress}  onMouseLeave={cancelPress}
      style={{
        flexShrink: 0, padding: "6px 10px", borderRadius: 8, cursor: "pointer",
        border: `1.5px solid ${selected ? "var(--amber)" : pinned ? "rgba(255,185,0,0.3)" : "var(--border)"}`,
        background: pressing ? "var(--brand-soft)" : selected ? "var(--brand-soft)" : pinned ? "rgba(255,185,0,0.06)" : "transparent",
        color: selected ? "var(--amber)" : pinned ? "var(--amber)" : "var(--text-3)",
        fontSize: 11, fontWeight: selected || pinned ? 700 : 400,
        whiteSpace: "nowrap", transition: "all 0.15s",
        userSelect: "none", WebkitUserSelect: "none",
      } as React.CSSProperties}
    >
      {pinned && !selected ? "📌 " : (area.emoji || "📁") + " "}{area.name}
    </button>
  );
}

/* ── Main Modal ── */
export default function AddTaskModal({
  onClose, onAdd, initialDue, initialEndDue,
}: {
  onClose: () => void; onAdd: (t: Task) => void;
  initialDue?: string; initialEndDue?: string;
}) {
  const [title, setTitle]       = useState("");
  const [notes, setNotes]       = useState("");
  const [due, setDue]           = useState(initialDue || "");
  const [endDue, setEndDue]     = useState(initialEndDue || "");
  const [showCal, setShowCal]   = useState(false);
  const [areaId, setAreaId]     = useState("");
  const [quadrant, setQuadrant] = useState<Quadrant>("Q3");
  const [areas, setAreas]       = useState<AreaItem[]>([]);
  const [pinned, setPinned]     = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);

  const sortAreas = (list: AreaItem[], pins: string[]) =>
    [...list].sort((a, b) => {
      const ap = pins.includes(a.id) ? 0 : 1;
      const bp = pins.includes(b.id) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return a.name.localeCompare(b.name, "th");
    });

  useEffect(() => {
    const pins = getPinnedAreaIds();
    setPinned(pins);
    fetch("/api/areas")
      .then(r => r.json())
      .then(d => {
        const all: AreaItem[] = d.areas || [];
        const visibleIds = getVisibleAreaIds(all);
        const visible = sortAreas(all.filter(a => visibleIds.includes(a.id)), pins);
        setAreas(visible);
        if (visible.length > 0) setAreaId(visible[0].id);
      });
  }, []);

  const handlePin = (id: string) => {
    const next = togglePinArea(id);
    setPinned(next);
    setAreas(prev => sortAreas(prev, next));
  };

  const submit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    const { priority } = quadrantToNotion(quadrant);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:  title.trim(),
        notes:  notes.trim() || undefined,
        due:    due || undefined,
        endDue: endDue || undefined,
        areaId: areaId || undefined,
        priority,
      }),
    });
    const task = await res.json();
    onAdd(task);
    onClose();
  };

  const selectedArea = areas.find(a => a.id === areaId);
  const dueSummary = due ? (endDue ? `${formatDateTH(due)} – ${formatDateTH(endDue)}` : formatDateTH(due)) : null;

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50, animation: "fadeIn 0.15s ease-out" }}
    >
      <div style={{
        background: "var(--bg-card)", borderTop: "1px solid var(--border)",
        borderRadius: "24px 24px 0 0",
        padding: "0 20px calc(24px + env(safe-area-inset-bottom))",
        width: "100%", maxWidth: 480,
        maxHeight: "92vh", overflowY: "auto",
        overscrollBehavior: "contain", overflowAnchor: "none" as any,
        animation: "sheetIn 0.42s cubic-bezier(0.32, 0.72, 0, 1)",
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

        {/* Area — กดค้างเพื่อปักหมุด */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.1em", marginBottom: 7 }}>
            พื้นที่ <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>· กดค้างเพื่อปักหมุด</span>
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 3, msOverflowStyle: "none" } as React.CSSProperties}>
            {areas.map(area => (
              <AreaChip
                key={area.id}
                area={area}
                selected={areaId === area.id}
                pinned={pinned.includes(area.id)}
                onSelect={() => setAreaId(area.id)}
                onPin={() => handlePin(area.id)}
              />
            ))}
          </div>
        </div>

        {/* Due date */}
        <div id="cal-row-add" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.1em", marginBottom: 7 }}>วันที่กำหนด</div>
          <button
            onClick={() => {
              const next = !showCal;
              setShowCal(next);
              if (next) setTimeout(() => document.getElementById("cal-row-add")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
            }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "11px 14px", borderRadius: 12, cursor: "pointer",
              background: "var(--bg-input)",
              border: `1.5px solid ${due ? "rgba(255,185,0,0.4)" : showCal ? "rgba(255,185,0,0.25)" : "var(--border)"}`,
            }}
          >
            <span style={{ fontSize: 17 }}>📅</span>
            <span style={{
              flex: 1, fontSize: 13, textAlign: "left",
              color: dueSummary ? "var(--amber)" : "var(--text-3)",
              fontWeight: dueSummary ? 600 : 400,
            }}>
              {dueSummary || "กำหนดวันที่..."}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>{showCal ? "▲" : "▼"}</span>
          </button>
          {showCal && (
            <CalendarPicker
              startValue={due} onStartChange={v => { setDue(v); }}
              endValue={endDue} onEndChange={v => { setEndDue(v); }}
            />
          )}
        </div>

        {/* Eisenhower priority */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.1em", marginBottom: 7 }}>ลำดับความสำคัญ</div>
          <EisenhowerPicker value={quadrant} onChange={setQuadrant} />
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
