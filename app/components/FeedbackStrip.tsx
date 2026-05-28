"use client";
import { useState } from "react";
import { StarIcon, MessageSquareIcon, BugIcon, LightbulbIcon, SendIcon, CloseIcon } from "./icons";

const CATEGORIES = [
  { id: "Bug",   Icon: BugIcon,           label: "Bug"   },
  { id: "Idea",  Icon: LightbulbIcon,     label: "Idea"  },
  { id: "อื่นๆ", Icon: MessageSquareIcon, label: "อื่นๆ" },
];

type Step = "closed" | "open" | "sending" | "done";

interface Props {
  /** compact=true → floating pill button, click to expand modal */
  compact?: boolean;
}

export default function FeedbackStrip({ compact }: Props) {
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
    if (!rating)   return setError("เลือก rating ก่อนนะคะ");
    if (!category) return setError("เลือกประเภทด้วยค่ะ");
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
      setTimeout(reset, 2500);
    } catch {
      setStep("open");
      setError("ส่งไม่สำเร็จ ลองใหม่นะคะ");
    }
  }

  /* ══════════════════════════════════
     COMPACT MODE — floating pill
  ══════════════════════════════════ */
  if (compact) {
    return (
      <>
        {/* Floating pill button — hidden when form is open */}
        {step === "closed" && (
          <button onClick={() => setStep("open")} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 20,
            background: "var(--bg-card)", border: "1px solid var(--border)",
            cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
            color: "var(--text-3)", fontSize: 12, fontWeight: 500,
          }}>
            <MessageSquareIcon size={13} color="var(--text-3)" />
            Feedback
          </button>
        )}

        {/* Full-screen overlay form */}
        {(step === "open" || step === "sending" || step === "done") && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "flex-end",
          }} onClick={step !== "sending" ? reset : undefined}>
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: "100%",
                background: "var(--bg-card)",
                borderRadius: "20px 20px 0 0",
                border: "1px solid var(--border)",
                borderBottom: "none",
                padding: "20px 20px calc(24px + env(safe-area-inset-bottom))",
                boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
              }}
            >
              {step === "done" ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <CheckCircle />
                  <div style={{ color: "var(--text-1)", fontWeight: 700, fontSize: 15, marginTop: 12 }}>ขอบคุณมากค่ะ!</div>
                  <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>feedback ของคุณช่วยพัฒนา app ค่ะ</div>
                </div>
              ) : (
                <FormBody
                  step={step} rating={rating} hovered={hovered}
                  category={category} comment={comment} error={error}
                  onClose={reset} onRate={setRating} onHover={setHovered}
                  onCategory={setCategory} onComment={setComment}
                  onSubmit={submit}
                />
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  /* ══════════════════════════════════
     INLINE MODE — embedded in page
  ══════════════════════════════════ */
  if (step === "closed") {
    return (
      <button onClick={() => setStep("open")} style={{
        width: "100%", background: "none", border: "none",
        padding: "14px 0", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        color: "var(--text-3)", fontSize: 12,
      }}>
        <MessageSquareIcon size={13} color="var(--text-3)" />
        มีความคิดเห็นมั้ยคะ?
      </button>
    );
  }

  if (step === "done") {
    return (
      <div style={{
        margin: "8px 0 16px", padding: "24px 20px", textAlign: "center",
        background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16,
      }}>
        <CheckCircle />
        <div style={{ color: "var(--text-1)", fontWeight: 700, fontSize: 15, marginTop: 12 }}>ขอบคุณมากค่ะ!</div>
        <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>feedback ของคุณช่วยพัฒนา app ค่ะ</div>
      </div>
    );
  }

  return (
    <div style={{
      margin: "8px 0 16px",
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 16, overflow: "hidden",
    }}>
      <FormBody
        step={step} rating={rating} hovered={hovered}
        category={category} comment={comment} error={error}
        onClose={reset} onRate={setRating} onHover={setHovered}
        onCategory={setCategory} onComment={setComment}
        onSubmit={submit}
        inline
      />
    </div>
  );
}

/* ── Shared form body ── */
function FormBody({
  step, rating, hovered, category, comment, error,
  onClose, onRate, onHover, onCategory, onComment, onSubmit, inline,
}: {
  step: Step; rating: number; hovered: number;
  category: string; comment: string; error: string;
  onClose: () => void; onRate: (n: number) => void; onHover: (n: number) => void;
  onCategory: (s: string) => void; onComment: (s: string) => void;
  onSubmit: () => void; inline?: boolean;
}) {
  const displayRating = hovered || rating;
  return (
    <div style={{ padding: inline ? "14px 16px 18px" : 0, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MessageSquareIcon size={15} color="var(--amber)" />
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Feedback</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
          <CloseIcon size={16} color="var(--text-3)" />
        </button>
      </div>

      {/* Stars */}
      <div>
        <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 10, letterSpacing: "0.04em" }}>คะแนนโดยรวม</div>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => onRate(n)}
              onMouseEnter={() => onHover(n)} onMouseLeave={() => onHover(0)}
              style={{
                background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 8,
                color: displayRating >= n ? "var(--amber)" : "var(--text-3)",
                transform: displayRating >= n ? "scale(1.15)" : "scale(1)",
                transition: "color 0.1s, transform 0.1s",
              }}>
              <StarIcon size={26} color={displayRating >= n ? "var(--amber)" : "var(--text-3)"} filled={displayRating >= n} />
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 10, letterSpacing: "0.04em" }}>ประเภท</div>
        <div style={{ display: "flex", gap: 8 }}>
          {CATEGORIES.map(({ id, Icon, label }) => {
            const active = category === id;
            return (
              <button key={id} onClick={() => onCategory(id)} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "9px 8px", borderRadius: 10, cursor: "pointer",
                border: `1.5px solid ${active ? "var(--amber)" : "var(--border)"}`,
                background: active ? "rgba(255,185,0,0.07)" : "transparent",
                color: active ? "var(--amber)" : "var(--text-3)",
                fontSize: 12, fontWeight: active ? 700 : 500,
                transition: "all 0.15s",
              }}>
                <Icon size={13} color={active ? "var(--amber)" : "var(--text-3)"} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comment */}
      <div>
        <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 10, letterSpacing: "0.04em" }}>
          รายละเอียด <span style={{ opacity: 0.5 }}>(ไม่บังคับ)</span>
        </div>
        <textarea value={comment} onChange={e => onComment(e.target.value)}
          placeholder="บอกเราได้เลยค่ะ..." maxLength={500} rows={3}
          style={{
            width: "100%", resize: "none", boxSizing: "border-box",
            background: "var(--bg-base)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "10px 12px",
            color: "var(--text-1)", fontSize: 13, lineHeight: 1.6,
            outline: "none", fontFamily: "inherit",
          }}
          onFocus={e => e.target.style.borderColor = "var(--text-3)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        />
        <div style={{ textAlign: "right", fontSize: 10, color: "var(--text-3)", marginTop: 3 }}>{comment.length}/500</div>
      </div>

      {error && <div style={{ fontSize: 12, color: "var(--red)", marginTop: -8 }}>{error}</div>}

      {/* Submit */}
      <button onClick={onSubmit} disabled={step === "sending"} style={{
        width: "100%", padding: "13px 0",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        background: step === "sending" ? "var(--border)" : "var(--amber)",
        color: step === "sending" ? "var(--text-3)" : "#000",
        border: "none", borderRadius: 12,
        fontSize: 13, fontWeight: 700, cursor: step === "sending" ? "default" : "pointer",
        transition: "all 0.15s",
      }}>
        {step === "sending" ? "กำลังส่ง..." : <><SendIcon size={14} color="#000" />ส่ง Feedback</>}
      </button>
    </div>
  );
}

function CheckCircle() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
      stroke="var(--amber)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      style={{ margin: "0 auto", display: "block" }}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}
