"use client";
import { useState } from "react";

const CATEGORIES = [
  { id: "Bug",   emoji: "🐛", label: "Bug"   },
  { id: "Idea",  emoji: "💡", label: "Idea"  },
  { id: "อื่นๆ", emoji: "💬", label: "อื่นๆ" },
];

type Step = "closed" | "open" | "sending" | "done";

export default function FeedbackStrip() {
  const [step,     setStep]     = useState<Step>("closed");
  const [rating,   setRating]   = useState(0);
  const [hovered,  setHovered]  = useState(0);
  const [category, setCategory] = useState("");
  const [comment,  setComment]  = useState("");
  const [error,    setError]    = useState("");

  function reset() {
    setStep("closed");
    setRating(0); setHovered(0);
    setCategory(""); setComment(""); setError("");
  }

  async function submit() {
    if (!rating)    return setError("เลือก rating ก่อนนะคะ ⭐");
    if (!category)  return setError("เลือกประเภทด้วยค่ะ");
    setError("");
    setStep("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, category, comment }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setStep("done");
      setTimeout(reset, 3000);
    } catch {
      setStep("open");
      setError("ส่งไม่สำเร็จ ลองใหม่นะคะ");
    }
  }

  /* ── Closed state ── */
  if (step === "closed") {
    return (
      <button
        onClick={() => setStep("open")}
        style={{
          width: "100%", marginTop: 8,
          background: "none", border: "none",
          padding: "12px 0", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, color: "var(--text-3)", fontSize: 12,
        }}
      >
        <span style={{ fontSize: 14 }}>💬</span>
        มีความคิดเห็นมั้ยคะ?
      </button>
    );
  }

  /* ── Done state ── */
  if (step === "done") {
    return (
      <div style={{
        margin: "8px 0 16px", padding: 20, textAlign: "center",
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 16,
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🙏</div>
        <div style={{ color: "var(--text-1)", fontWeight: 700, fontSize: 15 }}>ขอบคุณมากค่ะ!</div>
        <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>feedback ของคุณช่วยพัฒนา app มากเลยค่ะ</div>
      </div>
    );
  }

  /* ── Open / Sending state ── */
  const displayRating = hovered || rating;

  return (
    <div style={{
      margin: "8px 0 16px",
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 16, padding: "18px 16px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
          💬 มีความคิดเห็นมั้ยคะ?
        </div>
        <button
          onClick={reset}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 18, lineHeight: 1 }}
        >×</button>
      </div>

      {/* Star Rating */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8 }}>ให้คะแนนโดยรวม</div>
        <div style={{ display: "flex", gap: 6 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              style={{
                fontSize: 28, background: "none", border: "none",
                cursor: "pointer", padding: "2px 4px",
                opacity: displayRating >= n ? 1 : 0.25,
                transform: displayRating >= n ? "scale(1.1)" : "scale(1)",
                transition: "all 0.1s",
              }}
            >⭐</button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8 }}>ประเภท</div>
        <div style={{ display: "flex", gap: 8 }}>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              style={{
                padding: "6px 14px", borderRadius: 20, cursor: "pointer",
                fontSize: 12, fontWeight: 600,
                border: category === c.id ? "1.5px solid var(--amber)" : "1.5px solid var(--border)",
                background: category === c.id ? "rgba(255,185,0,0.08)" : "transparent",
                color: category === c.id ? "var(--amber)" : "var(--text-2)",
                transition: "all 0.15s",
              }}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8 }}>รายละเอียด (ไม่บังคับ)</div>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="บอกเราได้เลยค่ะ..."
          maxLength={500}
          rows={3}
          style={{
            width: "100%", resize: "none",
            background: "var(--bg-base)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "10px 12px",
            color: "var(--text-1)", fontSize: 13, lineHeight: 1.5,
            outline: "none", fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
        <div style={{ textAlign: "right", fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>
          {comment.length}/500
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 10 }}>{error}</div>
      )}

      {/* Submit */}
      <button
        onClick={submit}
        disabled={step === "sending"}
        style={{
          width: "100%", padding: "12px 0",
          background: step === "sending" ? "var(--border)" : "var(--amber)",
          color: step === "sending" ? "var(--text-3)" : "#000",
          border: "none", borderRadius: 12,
          fontSize: 14, fontWeight: 700, cursor: step === "sending" ? "default" : "pointer",
          transition: "all 0.15s",
        }}
      >
        {step === "sending" ? "กำลังส่ง..." : "ส่ง Feedback ✨"}
      </button>
    </div>
  );
}
