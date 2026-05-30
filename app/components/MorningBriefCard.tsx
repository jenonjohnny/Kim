"use client";
import { useState } from "react";
import { TaskData } from "./types";

interface Props {
  data: TaskData;
}

export default function MorningBriefCard({ data }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  const send = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/morning-briefing/send", { method: "POST" });
      const json = await res.json();
      setStatus(json.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  const urgentTasks = data.urgent;
  const soonTasks   = data.soon;

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderLeft: "3px solid var(--amber)",
      borderRadius: 16,
      marginBottom: 16,
      overflow: "hidden",
    }}>
      {/* ── Header row ── */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 16 }}>☀️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>Morning Brief</div>
          <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 1 }}>
            สรุปงานประจำวัน · กดเพื่อดูรายการ
          </div>
        </div>
        {/* Stats */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--red)" }}>
            🔴 {urgentTasks.length}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--amber)" }}>
            🟡 {soonTasks.length}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>
            📋 {data.total}
          </span>
        </div>
        <span style={{
          fontSize: 10, color: "var(--text-3)",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
          display: "inline-block",
        }}>▾</span>
      </div>

      {/* ── Expanded task list ── */}
      {expanded && (
        <div style={{
          borderTop: "1px solid var(--border-soft)",
          padding: "12px 16px",
        }}>
          {urgentTasks.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--red)", letterSpacing: "0.08em", marginBottom: 6 }}>
                🔴 ด่วน
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {urgentTasks.map(t => (
                  <div key={t.id} style={{
                    fontSize: 12, color: "var(--text-1)",
                    padding: "5px 10px",
                    background: "rgba(255,82,82,0.06)",
                    borderRadius: 8,
                    borderLeft: "2px solid var(--red)",
                  }}>
                    {t.title}
                  </div>
                ))}
              </div>
            </div>
          )}
          {soonTasks.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--amber)", letterSpacing: "0.08em", marginBottom: 6 }}>
                🟡 ใกล้มา
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {soonTasks.map(t => (
                  <div key={t.id} style={{
                    fontSize: 12, color: "var(--text-1)",
                    padding: "5px 10px",
                    background: "rgba(255,185,0,0.06)",
                    borderRadius: 8,
                    borderLeft: "2px solid var(--amber)",
                  }}>
                    {t.title}
                  </div>
                ))}
              </div>
            </div>
          )}
          {urgentTasks.length === 0 && soonTasks.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", padding: "8px 0" }}>
              ไม่มีงานด่วนหรืองานใกล้มา 🌿
            </div>
          )}
        </div>
      )}

      {/* ── Send button ── */}
      <div style={{
        borderTop: "1px solid var(--border-soft)",
        padding: "10px 16px",
        display: "flex", justifyContent: "flex-end",
      }}>
        <button
          onClick={e => { e.stopPropagation(); send(); }}
          disabled={status === "loading" || status === "sent"}
          style={{
            padding: "8px 18px", borderRadius: 10, cursor: status === "loading" || status === "sent" ? "default" : "pointer",
            border: "none",
            background: status === "sent"
              ? "rgba(61,214,140,0.15)"
              : status === "error"
                ? "rgba(255,82,82,0.15)"
                : "var(--brand-soft)",
            color: status === "sent"
              ? "#3dd68c"
              : status === "error"
                ? "var(--red)"
                : "var(--amber)",
            fontSize: 12, fontWeight: 700,
            transition: "all 0.2s",
          }}
        >
          {status === "loading" ? "⏳ กำลังส่ง..." : status === "sent" ? "ส่งแล้วค่ะ ✅" : status === "error" ? "ส่งไม่ได้ ❌" : "📨 ส่ง Morning Brief"}
        </button>
      </div>
    </div>
  );
}
