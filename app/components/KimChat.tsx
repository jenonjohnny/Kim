"use client";
import { useEffect, useRef, useState } from "react";
import { TaskData } from "./types";

interface Msg {
  role: "user" | "kim";
  text: string;
  ts: number;
}

const SESSION_KEY = "kim_chat_session";
const HISTORY_KEY = "kim_chat_history";
const MAX_HISTORY = 40; // messages stored locally

function getSessionId() {
  if (typeof window === "undefined") return "web";
  let s = sessionStorage.getItem(SESSION_KEY);
  if (!s) { s = `web-${Date.now()}`; sessionStorage.setItem(SESSION_KEY, s); }
  return s;
}

function loadHistory(): Msg[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveHistory(msgs: Msg[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(msgs.slice(-MAX_HISTORY)));
}

/* ── Typing indicator ── */
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--text-3)",
          animation: `typingBounce 1.2s ${i * 0.2}s infinite ease-in-out`,
        }} />
      ))}
    </div>
  );
}

/* ── Message bubble ── */
function Bubble({ msg }: { msg: Msg }) {
  const isKim = msg.role === "kim";
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: isKim ? "flex-start" : "flex-end",
      marginBottom: 10,
    }}>
      <div style={{
        maxWidth: "82%", padding: "10px 13px",
        borderRadius: isKim ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
        background: isKim ? "var(--bg-raised)" : "var(--brand)",
        color: isKim ? "var(--text-1)" : "#000",
        fontSize: 13, lineHeight: 1.55,
        whiteSpace: "pre-wrap", wordBreak: "break-word",
        border: isKim ? "1px solid var(--border)" : "none",
      }}>
        {msg.text}
      </div>
      <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 3, paddingInline: 4 }}>
        {isKim ? "Norte · " : ""}
        {new Date(msg.ts).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

interface Props {
  data: TaskData | null;
  onClose: () => void;
  /** ถ้า true = ไม่แสดง backdrop (ใช้เป็น tab เต็มหน้า) */
  inline?: boolean;
}

export default function KimChat({ data, onClose, inline = false }: Props) {
  const [messages, setMessages] = useState<Msg[]>(() => loadHistory());
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const sessionId = getSessionId();

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: Msg = { role: "user", text, ts: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    saveHistory(next);
    setLoading(true);

    try {
      // Build message history for API — field must be `content`, kim role = "assistant"
      const apiMsgs = next.slice(-20).map(m => ({
        role: m.role === "kim" ? "assistant" : "user",
        content: m.text,
      }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMsgs, tasks: data, sessionId }),
      });
      const json = await res.json();
      const kimMsg: Msg = { role: "kim", text: json.content || json.reply || "ขอโทษค่ะ ไม่ได้รับคำตอบ", ts: Date.now() };
      const withKim = [...next, kimMsg];
      setMessages(withKim);
      saveHistory(withKim);
    } catch {
      const errMsg: Msg = { role: "kim", text: "เกิดข้อผิดพลาดค่ะ ลองใหม่อีกครั้งนะคะ", ts: Date.now() };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearHistory = () => {
    if (confirm("ล้างประวัติการสนทนาทั้งหมด?")) {
      localStorage.removeItem(HISTORY_KEY);
      setMessages([]);
    }
  };

  // Quick prompts
  const QUICK_PROMPTS = [
    "วันนี้มีงานอะไรต้องทำบ้าง?",
    "งานไหนด่วนที่สุด?",
    "จัดลำดับงานให้หน่อยค่ะ",
    "ช่วยสรุปงานค้างทั้งหมด",
  ];

  return (
    <>
      {/* Backdrop — แสดงเฉพาะตอนไม่ได้ใช้เป็น tab */}
      {!inline && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(3px)",
            zIndex: 70,
            animation: "fadeIn 0.18s ease-out",
          }}
        />
      )}

      {/* Chat sheet */}
      <div style={inline ? {
        position: "fixed",
        top: "calc(env(safe-area-inset-top) + 115px)", /* below fixed header */
        bottom: "calc(env(safe-area-inset-bottom) + 62px)", /* above nav */
        left: 0, right: 0, zIndex: 5,
        background: "var(--bg-base)",
        display: "flex", flexDirection: "column",
      } : {
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 71,
        background: "var(--bg-base)",
        borderRadius: "22px 22px 0 0",
        borderTop: "2px solid var(--brand)",
        height: "86dvh",
        display: "flex", flexDirection: "column",
        animation: "sheetIn 0.42s cubic-bezier(0.32, 0.72, 0, 1)",
      }}>
        {/* ── Header ── */}
        <div style={{
          flexShrink: 0,
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 20px 12px",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
            background: "var(--brand)", color: "#000",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="9" r="7"/><path d="M9 5v1.5m0 5V13m-3.5-4h1.5m5 0H13"/><circle cx="9" cy="9" r="2" fill="white" stroke="none"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Norte AI</div>
            <div style={{ fontSize: 10, color: "var(--text-3)" }}>เลขาส่วนตัว AI · Gemini</div>
          </div>
          {messages.length > 0 && (
            <button onClick={clearHistory} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 11, color: "var(--text-3)", padding: "4px 6px",
            }}>ล้าง</button>
          )}
          {!inline && (
            <button onClick={onClose} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 20, color: "var(--text-2)", padding: "4px 6px", lineHeight: 1,
            }}>✕</button>
          )}
        </div>

        {/* ── Messages ── */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "16px 16px 8px",
        }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 0 20px" }}>
              <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="13" cy="13" r="10"/><path d="M13 7v3m0 6v3m-5-6h3m6 0h3"/><circle cx="13" cy="13" r="3" fill="white" stroke="none"/>
                  </svg>
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>
                สวัสดีค่ะ คุณจีนอน
              </div>
              <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20, lineHeight: 1.6 }}>
                คิมพร้อมช่วยเสมอนะคะ<br/>มีอะไรให้ช่วยไหมคะ?
              </div>
              {/* Quick prompts */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {QUICK_PROMPTS.map(p => (
                  <button key={p} onClick={() => { setInput(p); setTimeout(send, 0); }} style={{
                    padding: "9px 14px", borderRadius: 12, cursor: "pointer",
                    border: "1px solid var(--border)",
                    background: "var(--bg-card)",
                    color: "var(--text-2)", fontSize: 12,
                    textAlign: "left",
                  }}>{p}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => <Bubble key={i} msg={m} />)}

          {loading && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10,
            }}>
              <div style={{
                padding: "10px 13px",
                borderRadius: "4px 16px 16px 16px",
                background: "var(--bg-raised)",
                border: "1px solid var(--border)",
              }}>
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Quick prompts row (when has messages) ── */}
        {messages.length > 0 && !loading && (
          <div style={{
            flexShrink: 0, overflowX: "auto",
            display: "flex", gap: 6,
            padding: "8px 14px 4px",
            borderTop: "1px solid var(--border-soft)",
          }}>
            {QUICK_PROMPTS.map(p => (
              <button key={p} onClick={() => { setInput(p); }} style={{
                flexShrink: 0, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-3)", fontSize: 11,
                whiteSpace: "nowrap",
              }}>{p}</button>
            ))}
          </div>
        )}

        {/* ── Input ── */}
        <div style={{
          flexShrink: 0,
          display: "flex", alignItems: "flex-end", gap: 10,
          padding: "10px 14px calc(20px + env(safe-area-inset-bottom))",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-card)",
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="พิมพ์คำถาม... (Enter ส่ง, Shift+Enter ขึ้นบรรทัดใหม่)"
            rows={1}
            style={{
              flex: 1, background: "var(--bg-raised)",
              border: `1px solid ${input ? "rgba(0,129,255,0.4)" : "var(--border)"}`,
              borderRadius: 12, padding: "10px 13px",
              fontSize: 14, color: "var(--text-1)",
              outline: "none", resize: "none", fontFamily: "inherit",
              lineHeight: 1.5, maxHeight: 120, overflowY: "auto",
              transition: "border 0.15s",
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            style={{
              width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
              background: input.trim() && !loading ? "var(--brand)" : "var(--border)",
              border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
              color: input.trim() && !loading ? "#000" : "var(--text-3)",
              fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}
          >↑</button>
        </div>
      </div>

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
