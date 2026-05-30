"use client";
import { useState, useRef, useEffect } from "react";
import { TaskData } from "./types";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "ปรับตารางวันนี้ให้หน่อย",
  "งานด่วนมีอะไรบ้างคะ",
  "ฉันเหนื่อยมาก ช่วยจัดลำดับให้ใหม่",
  "สรุปงานวันนี้ให้หน่อย",
];

export default function ChatView({ tasks }: { tasks: TaskData | null }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "สวัสดีค่ะคุณจีนอน คิมพร้อมช่วยเสมอเลยนะคะ วันนี้มีอะไรให้ช่วยไหมคะ?" },
  ]);
  const sessionId = useRef(`${new Date().toISOString().split("T")[0]}_${Math.random().toString(36).slice(2, 7)}`);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          tasks,
          sessionId: sessionId.current,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reply = data.content ?? "ขอโทษค่ะ เกิดข้อผิดพลาด ลองอีกครั้งนะคะ";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "ขอโทษค่ะ เกิดข้อผิดพลาด ลองอีกครั้งนะคะ" }]);
    }
    setLoading(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 140px)" }}>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Suggestion chips — only when just greeting */}
        {messages.length === 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4, marginTop: 4 }}>
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)} style={{
                padding: "8px 14px", borderRadius: 20,
                background: "var(--bg-card)", border: "1px solid var(--border)",
                color: "var(--text-2)", fontSize: 12, cursor: "pointer",
                transition: "all 0.15s",
              }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
          }}>
            {m.role === "assistant" && (
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "var(--brand)", color: "#000",
                fontSize: 12, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginRight: 8, marginTop: 2,
              }}>K</div>
            )}
            <div style={{
              maxWidth: "75%",
              padding: "10px 14px",
              borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: m.role === "user" ? "var(--brand)" : "var(--bg-card)",
              border: m.role === "user" ? "none" : "1px solid var(--border)",
              color: m.role === "user" ? "#000" : "var(--text-1)",
              fontSize: 14, lineHeight: 1.55,
              whiteSpace: "pre-wrap",
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "var(--brand)", color: "#000",
              fontSize: 12, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>K</div>
            <div style={{
              padding: "10px 14px", borderRadius: "18px 18px 18px 4px",
              background: "var(--bg-card)", border: "1px solid var(--border)",
              display: "flex", gap: 4, alignItems: "center",
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "var(--brand)", opacity: 0.7,
                  animation: `pulse-dot 1.2s ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 20px 16px",
        borderTop: "1px solid var(--border-soft)",
        background: "rgba(10,10,15,0.95)",
        backdropFilter: "blur(20px)",
      }}>
        <div style={{
          display: "flex", gap: 10, alignItems: "flex-end",
          background: "var(--bg-input)", borderRadius: 20,
          border: "1px solid var(--border)", padding: "8px 8px 8px 16px",
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="พิมพ์ถามคิมได้เลยค่ะ..."
            rows={1}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "var(--text-1)", fontSize: 14, lineHeight: 1.5,
              resize: "none", maxHeight: 100, overflowY: "auto",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              width: 36, height: 36, borderRadius: "50%", border: "none",
              background: input.trim() && !loading ? "var(--brand)" : "var(--border)",
              color: input.trim() && !loading ? "#000" : "var(--text-3)",
              cursor: input.trim() && !loading ? "pointer" : "default",
              fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", flexShrink: 0,
            }}
          >↑</button>
        </div>
        <div style={{ fontSize: 10, color: "var(--text-3)", textAlign: "center", marginTop: 8 }}>
          Enter ส่ง · Shift+Enter ขึ้นบรรทัดใหม่
        </div>
      </div>
    </div>
  );
}
