"use client";
import { useState } from "react";
import { Task, CAT_STYLE, detectCategory } from "./types";

function minToTime(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}:${min.toString().padStart(2, "0")}`;
}

interface Props {
  task: Task & { startMin?: number; endMin?: number };
  onClose: () => void;
  onDone: (id: string) => void;
}

export default function TaskDetailModal({ task, onClose, onDone }: Props) {
  const cat = task.category || detectCategory(task.title);
  const s = CAT_STYLE[cat];
  const notionUrl = `https://notion.so/${task.id.replace(/-/g, "")}`;

  const [notes, setNotes] = useState(task.notes || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveNotes = async () => {
    if (notes === (task.notes || "")) return;
    setSaving(true);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const dueLabel = () => {
    if (!task.due) return null;
    const today = new Date().toISOString().split("T")[0];
    const diff = Math.ceil((new Date(task.due).getTime() - new Date(today).getTime()) / 86400000);
    if (diff < 0) return { text: `เลยกำหนด ${Math.abs(diff)} วัน`, color: "var(--red)" };
    if (diff === 0) return { text: "ครบวันนี้", color: "var(--amber)" };
    if (diff === 1) return { text: "ครบพรุ่งนี้", color: "var(--amber)" };
    return { text: `อีก ${diff} วัน`, color: "var(--text-2)" };
  };
  const due = dueLabel();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)", zIndex: 60,
        }}
      />

      {/* Sheet */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        width: "100%", zIndex: 61,
        background: "var(--bg-card)",
        borderRadius: "24px 24px 0 0",
        borderTop: `3px solid ${s.color}`,
        padding: "0 0 40px",
        animation: "slideUp 0.22s ease",
        maxHeight: "90dvh",
        overflowY: "auto",
        overflowX: "hidden",
      }}>
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)" }} />
        </div>

        <div style={{ padding: "8px 20px 0" }}>
          {/* Category badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            color: s.color, background: s.bg,
            borderRadius: 8, padding: "4px 10px", marginBottom: 14,
          }}>
            {s.emoji} {cat}
          </div>

          {/* Status badge for review */}
          {task.status === "Waiting" && (
            <span style={{
              marginLeft: 8,
              fontSize: 11, fontWeight: 700,
              color: "var(--amber)", background: "var(--brand-soft)",
              borderRadius: 8, padding: "4px 10px",
            }}>
              ⏳ รอตรวจ
            </span>
          )}

          {/* Title */}
          <div style={{
            fontSize: 20, fontWeight: 700, lineHeight: 1.3,
            color: "var(--text-1)", marginBottom: 20,
          }}>
            {task.title}
          </div>

          {/* Meta */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {task.startMin !== undefined && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 15 }}>🕐</span>
                <span style={{ fontSize: 13, color: "var(--text-2)" }}>
                  {minToTime(task.startMin)} – {minToTime(task.endMin!)} น.
                  <span style={{ color: "var(--text-3)", marginLeft: 6 }}>
                    ({task.endMin! - task.startMin!} นาที)
                  </span>
                </span>
              </div>
            )}
            {task.due && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 15 }}>📅</span>
                <span style={{ fontSize: 13, color: "var(--text-2)" }}>
                  {task.due}
                  {due && <span style={{ color: due.color, marginLeft: 8, fontWeight: 600 }}>{due.text}</span>}
                </span>
              </div>
            )}
            {task.priority && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 15 }}>⭐️</span>
                <span style={{ fontSize: 13, color: "var(--text-2)" }}>{task.priority}</span>
              </div>
            )}
          </div>

          {/* Notes field */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "var(--text-3)",
              letterSpacing: "0.08em", marginBottom: 8,
            }}>
              📝 NOTES
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="เพิ่ม notes... (sync กับ Notion อัตโนมัติ)"
              rows={3}
              style={{
                width: "100%", padding: "10px 12px",
                background: "var(--bg-raised)", border: "1px solid var(--border)",
                borderRadius: 12, color: "var(--text-1)", fontSize: 13,
                resize: "vertical", lineHeight: 1.5, fontFamily: "inherit",
                outline: "none", transition: "border 0.15s",
              }}
              onFocus={e => (e.target.style.border = `1px solid ${s.color}50`)}
            />
            {(saving || saved) && (
              <div style={{ fontSize: 10, color: saving ? "var(--text-3)" : "var(--green)", marginTop: 4 }}>
                {saving ? "กำลังบันทึก..." : "✓ บันทึกใน Notion แล้ว"}
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "var(--border)", marginBottom: 16 }} />

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <a
              href={notionUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, padding: "13px 0", borderRadius: 14,
                background: "var(--bg-raised)", border: "1px solid var(--border)",
                color: "var(--text-2)", fontSize: 13, fontWeight: 600,
                textAlign: "center", textDecoration: "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              ↗ เปิดใน Notion
            </a>
            <button
              onClick={() => { onDone(task.id); onClose(); }}
              style={{
                flex: 1, padding: "13px 0", borderRadius: 14,
                background: "var(--green-soft)", border: "1px solid var(--green)40",
                color: "var(--green)", fontSize: 13, fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ✓ เสร็จแล้ว
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
