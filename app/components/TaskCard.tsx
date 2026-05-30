"use client";
import { useState } from "react";
import { Task, CAT_STYLE, detectCategory } from "./types";

const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

function formatDate(d: string) {
  const dt = new Date(d + "T00:00:00");
  const today = new Date();
  const diff = Math.ceil((dt.getTime() - today.setHours(0,0,0,0)) / 86400000);
  if (diff === 0) return "วันนี้";
  if (diff === 1) return "พรุ่งนี้";
  if (diff < 0) return `เลย ${Math.abs(diff)} วัน`;
  return `${dt.getDate()} ${THAI_MONTHS[dt.getMonth()]}`;
}

export default function TaskCard({ task, onDone }: { task: Task; onDone: (id: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const cat = task.category ?? detectCategory(task.title);
  const style = CAT_STYLE[cat];
  const isLate = task.due && new Date(task.due) < new Date(new Date().toDateString());

  const handleDone = async () => {
    setLoading(true);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Done" }),
    });
    setDone(true);
    setTimeout(() => onDone(task.id), 350);
  };

  return (
    <div style={{
      background: "var(--bg-card)",
      border: `1px solid ${done ? "transparent" : "var(--border)"}`,
      borderLeft: `3px solid ${done ? "transparent" : style.color}`,
      borderRadius: 14,
      padding: "13px 14px",
      display: "flex", alignItems: "center", gap: 12,
      opacity: done ? 0 : 1,
      transform: done ? "translateX(12px)" : "none",
      transition: "opacity 0.3s, transform 0.3s",
    }}>
      <button onClick={handleDone} disabled={loading} style={{
        width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${loading ? style.color : "var(--border)"}`,
        background: loading ? style.bg : "transparent",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s",
      }}>
        {loading && <span style={{ color: style.color, fontSize: 11, fontWeight: 700 }}>✓</span>}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, lineHeight: 1.4, color: "var(--text-1)" }} className="truncate">
          {task.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
          <span style={{
            fontSize: 10, color: style.color, background: style.bg,
            borderRadius: 5, padding: "2px 7px", fontWeight: 600,
          }}>{cat}</span>
          {task.due && (
            <span style={{
              fontSize: 10,
              color: isLate ? "var(--red)" : "var(--text-3)",
            }}>{formatDate(task.due)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
