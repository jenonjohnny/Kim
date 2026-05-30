"use client";
import { useState } from "react";
import { TaskData } from "./types";

interface Props { data: TaskData; }

export default function MorningBriefCard({ data }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  const send = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/morning-briefing/send", { method: "POST" });
      const json = await res.json();
      setStatus(json.ok ? "sent" : "error");
    } catch { setStatus("error"); }
  };

  const urgentCount = data.urgent.length;
  const soonCount   = data.soon.length;

  const title = urgentCount > 0
    ? `วันนี้มีงาน P1 ค้างอยู่ ${urgentCount} อย่าง`
    : soonCount > 0
      ? `มี ${soonCount} งานที่ต้องทำวันนี้`
      : "ไม่มีงานด่วนวันนี้ค่ะ";

  const sub = urgentCount > 0
    ? "แนะนำ: เริ่มจากงาน P1 ก่อน ค่อยไปงานอื่น"
    : "วันนี้ดูเบาลงค่ะ วางแผนงานถัดไปได้เลย";

  return (
    <div style={{ marginBottom: 16 }}>
      {/* ── Gradient card ── */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          background: "linear-gradient(135deg, #0062cc 0%, #0081ff 60%, #339dff 100%)",
          borderRadius: 16, padding: "16px 18px",
          position: "relative", overflow: "hidden", cursor: "pointer",
        }}
      >
        {/* Deco circles */}
        <div style={{ position: "absolute", right: -28, top: -28, width: 100, height: 100, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.10)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 18, bottom: -22, width: 56, height: 56, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.07)", pointerEvents: "none" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="rgba(255,255,255,0.8)"><path d="M4 0.5l.65 2.2 2.35.3-1.7 1.6.4 2.3L4 5.7 2.3 6.9l.4-2.3L1 3l2.35-.3z"/></svg>
            Morning Brief
          </span>
          <div style={{ width: 20, height: 20, background: "rgba(255,255,255,0.15)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              <path d="M2 3.5l3 3 3-3"/>
            </svg>
          </div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{sub}</div>
      </div>

      {/* ── Expanded task list ── */}
      {expanded && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderTop: "none", borderRadius: "0 0 16px 16px",
          padding: "12px 16px",
        }}>
          {data.urgent.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#ff3b30", letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" }}>
                ด่วนมาก · P1
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {data.urgent.map(t => (
                  <div key={t.id} style={{
                    fontSize: 12, color: "var(--text-1)", padding: "6px 10px",
                    background: "rgba(255,59,48,0.06)", borderRadius: 8,
                    boxShadow: "inset 2px 0 0 rgba(255,59,48,0.5)",
                  }}>{t.title}</div>
                ))}
              </div>
            </div>
          )}
          {data.soon.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#ff9500", letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" }}>
                วันนี้ · P2
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {data.soon.map(t => (
                  <div key={t.id} style={{
                    fontSize: 12, color: "var(--text-1)", padding: "6px 10px",
                    background: "rgba(255,149,0,0.06)", borderRadius: 8,
                    boxShadow: "inset 2px 0 0 rgba(255,149,0,0.5)",
                  }}>{t.title}</div>
                ))}
              </div>
            </div>
          )}
          {data.urgent.length === 0 && data.soon.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", padding: "8px 0" }}>
              ไม่มีงานด่วนวันนี้ค่ะ
            </div>
          )}

          {/* Send button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button
              onClick={e => { e.stopPropagation(); send(); }}
              disabled={status === "loading" || status === "sent"}
              style={{
                padding: "7px 16px", borderRadius: 10, border: "none",
                cursor: status === "loading" || status === "sent" ? "default" : "pointer",
                background: status === "sent" ? "rgba(45,184,119,0.15)" : "var(--brand-soft)",
                color: status === "sent" ? "#2db877" : status === "error" ? "#ff3b30" : "var(--brand)",
                fontSize: 11, fontWeight: 700, transition: "all 0.2s",
              }}
            >
              {status === "loading" ? "กำลังส่ง..." : status === "sent" ? "ส่งแล้วค่ะ" : status === "error" ? "ส่งไม่ได้" : "ส่ง Morning Brief"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
