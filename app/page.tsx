"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Nav, { Tab } from "./components/Nav";
import KimChat from "./components/KimChat";
import AddTaskModal from "./components/AddTaskModal";
import TaskDetailModal from "./components/TaskDetailModal";
import QuickActionsView from "./components/QuickActionsView";
import WeekView from "./components/WeekView";
import MonthView from "./components/MonthView";
import DayView from "./components/DayView";
import TimeBlockView from "./components/TimeBlockView";
import WeekendScheduleView from "./components/WeekendScheduleView";
import SettingsSheet from "./components/SettingsSheet";
import FeedbackStrip from "./components/FeedbackStrip";
import TodayView, { GCalEvent } from "./components/TodayView";
import { Section, AREA_STYLE } from "./components/TaskRow";
import { Task, TaskData, detectCategory, getQuadrant, QUADRANT_INFO } from "./components/types";
import {
  SearchIcon, GearIcon, FlagIcon, ClockIcon, PauseIcon,
  ArchiveIcon, FileTextIcon, ChevronRightIcon, DotIcon,
} from "./components/icons";

const THAI_DAYS = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัส","ศุกร์","เสาร์"];
const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

/* ─────────────────────────────────────────
   SHARED DESIGN TOKENS  (ตรงกับ Quick Actions)
───────────────────────────────────────── */
const CARD = {
  padding: "14px 16px",
  borderRadius: 16,
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
} as const;

/* ─── Greeting header — Norte layout ─── */
function Greeting({ onSearch, onSettings }: { onSearch: () => void; onSettings: () => void }) {
  const now = new Date();
  const dateStr = `${THAI_DAYS[now.getDay()]} ${now.getDate()} ${THAI_MONTHS[now.getMonth()]} ${now.getFullYear() + 543}`;
  const [name, setName] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("profile_name") || "คิม") : "คิม"
  );
  useEffect(() => {
    const handler = () => setName(localStorage.getItem("profile_name") || "คิม");
    window.addEventListener("profile-name-change", handler);
    return () => window.removeEventListener("profile-name-change", handler);
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      {/* Left — logo + wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-white.png" alt="Norte" style={{ height: 26, width: "auto", flexShrink: 0 }} />
        <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em" }}>Norte</span>
      </div>

      {/* Right — greeting + date + actions */}
      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>สวัสดีค่ะ {name}</span>
          <button onClick={onSearch} style={{
            width: 32, height: 32, borderRadius: 10, cursor: "pointer",
            background: "var(--bg-card)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
          }}>
            <SearchIcon size={15} color="var(--icon-tint)" />
          </button>
          <button onClick={onSettings} style={{
            width: 32, height: 32, borderRadius: 10, cursor: "pointer",
            background: "var(--bg-card)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
          }}>
            <GearIcon size={15} color="var(--icon-tint)" />
          </button>
        </div>
        <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 400 }}>{dateStr}</span>
      </div>
    </div>
  );
}

/* ─── Page label — เหมือนกันทุกแท็บ ─── */
const PAGE_LABELS: Record<Tab, string> = {
  home:     "วันนี้",
  tasks:    "งานทั้งหมด",
  chat:     "Norte AI",
  calendar: "ตารางงาน",
  okr:      "เป้าหมาย & OKR",
};

function PageLabel({ tab, data }: { tab: Tab; data: TaskData }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      minHeight: 36, marginBottom: 14,
    }}>
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
        color: "var(--text-3)", textTransform: "uppercase",
      }}>
        {PAGE_LABELS[tab]}
      </span>
      {tab === "home" && (
        <span style={{ fontSize: 10, color: "var(--text-3)" }}>
          <span style={{ color: "#ff3b30", fontWeight: 700 }}>{data.urgent.length}</span>
          {" "}ด่วน ·{" "}
          <span style={{ color: "#ff9500", fontWeight: 700 }}>{data.soon.length}</span>
          {" "}วันนี้ ·{" "}
          <span style={{ fontWeight: 600 }}>{data.total}</span>
          {" "}งาน
        </span>
      )}
      {tab === "tasks" && (
        <span style={{ fontSize: 10, color: "var(--text-3)" }}>
          {data.total} งาน
          {data.review.length > 0 && <> · <span style={{ color: "var(--brand)" }}>{data.review.length} รอตรวจ</span></>}
          {data.onhold.length > 0 && <> · {data.onhold.length} พัก</>}
        </span>
      )}
    </div>
  );
}


/* ─── Pull-to-refresh spinner — SVG arc that fills as you pull ─── */
function PullSpinner({ pct, ready }: { pct: number; ready: boolean }) {
  const R = 10;        // radius
  const C = 2 * Math.PI * R; // circumference ≈ 62.8
  const dash = pct * C;
  const gap  = C - dash;
  const color = ready ? "var(--brand)" : "var(--brand)";

  return (
    <svg
      width={24} height={24} viewBox="0 0 24 24"
      style={{ animation: ready ? "ptr-spin 0.7s linear infinite" : "none" }}
    >
      <circle
        cx={12} cy={12} r={R}
        fill="none"
        stroke="var(--border)"
        strokeWidth={2}
      />
      <circle
        cx={12} cy={12} r={R}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={C * 0.25}   /* start from top */
        style={{ transition: ready ? "none" : "stroke 0.2s" }}
      />
    </svg>
  );
}

function LoadingState() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 5,
      background: "var(--bg-base)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 28,
    }}>
      {/*
        ── LOADING LOGO — ขนาด Lock ไว้: max 280px / 74vw ──
        เปลี่ยนโลโก้: swap ไฟล์ /public/logo-white.png (ใช้ size เดิม อย่าแก้ CSS)
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-white.png"
        alt="Logo"
        style={{
          width: "min(74vw, 280px)",
          height: "auto",
          animation: "pulse-dot 2.5s ease-in-out infinite",
        }}
      />
      <div style={{ color: "var(--text-3)", fontSize: 12, letterSpacing: "0.06em" }}>
        กำลังดึงข้อมูล...
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.35}>
          <circle cx="24" cy="24" r="20"/><path d="M16 24l6 6 10-12"/>
        </svg>
      </div>
      <div style={{ color: "var(--text-2)", fontSize: 16, fontWeight: 600 }}>ไม่มีงานค้างค่ะ</div>
      <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 8 }}>เยี่ยมมาก ทำได้ครบหมดแล้ว</div>
    </div>
  );
}

/* ─── Search Overlay — fixed top, results scroll ─── */
function SearchSheet({
  data, query, onQueryChange, onTaskClick, onClose,
}: {
  data: TaskData; query: string;
  onQueryChange: (q: string) => void;
  onTaskClick: (t: Task) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchArea, setSearchArea] = useState<"all"|"sts"|"daisi"|"digital">("all");
  const [searchP1, setSearchP1] = useState(false);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 60); }, []);

  const allTasks = [
    ...data.urgent, ...data.soon, ...data.normal,
    ...data.review, ...data.onhold,
  ];
  const q = query.trim().toLowerCase();
  const hasFilter = searchArea !== "all" || searchP1;
  const results = q || hasFilter
    ? allTasks.filter(t =>
        (searchArea === "all" || t.area === searchArea) &&
        (!searchP1 || t.priority === "P1") &&
        (!q || t.title.toLowerCase().includes(q) || (t.notes || "").toLowerCase().includes(q))
      )
    : [];

  const hi = (text: string) => {
    if (!q) return <span>{text}</span>;
    const idx = text.toLowerCase().indexOf(q);
    if (idx < 0) return <span>{text}</span>;
    return (
      <span>
        {text.slice(0, idx)}
        <mark style={{ background: "rgba(0,129,255,0.25)", color: "inherit", borderRadius: 3 }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </span>
    );
  };

  return (
    /* Full-screen overlay — ค้างบนจอ, ไม่ bounce */
    <div style={{
      position: "fixed", inset: 0, zIndex: 70,
      background: "var(--bg-base)",
      display: "flex", flexDirection: "column",
      animation: "fadeIn 0.12s ease-out",
    }}>
      {/* ── Search bar — sticky top ── */}
      <div style={{
        flexShrink: 0,
        padding: "calc(env(safe-area-inset-top) + 52px) 16px 10px",
        background: "var(--bg-base)",
        borderBottom: "1px solid var(--border-soft)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--bg-card)", borderRadius: 14,
          padding: "11px 14px",
          border: `1.5px solid ${query ? "rgba(0,129,255,0.45)" : "var(--border)"}`,
          transition: "border 0.15s",
        }}>
          <SearchIcon size={16} color="var(--text-3)" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="ค้นหางาน..."
            style={{
              flex: 1, background: "transparent", border: "none",
              fontSize: 15, color: "var(--text-1)", outline: "none",
              fontFamily: "inherit",
            }}
          />
          {query ? (
            <button onClick={() => onQueryChange("")} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 15, color: "var(--text-3)", padding: "0 2px",
            }}>✕</button>
          ) : (
            <button onClick={onClose} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, color: "var(--text-3)", padding: "0 2px",
              fontWeight: 600,
            }}>ยกเลิก</button>
          )}
        </div>

        {/* ── Filter chips ── */}
        <div style={{ display: "flex", gap: 6, marginTop: 10, overflowX: "auto", paddingBottom: 2 }}>
          {([
            { id: "all",     label: "ทั้งหมด", color: "var(--text-2)"     },
            { id: "sts",     label: "STS",     color: "var(--brand)"      },
            { id: "daisi",   label: "Daisi",   color: "var(--brand)"  },
            { id: "digital", label: "Digital", color: "var(--brand)" },
          ] as { id: typeof searchArea; label: string; color: string }[]).map(f => {
            const on = searchArea === f.id;
            return (
              <button key={f.id} onClick={() => setSearchArea(f.id)} style={{
                flexShrink: 0, padding: "6px 12px", borderRadius: 9, cursor: "pointer",
                border: `1.5px solid ${on ? f.color : "var(--border)"}`,
                background: on ? f.color + "18" : "transparent",
                color: on ? f.color : "var(--text-3)",
                fontSize: 11, fontWeight: on ? 700 : 400, transition: "all 0.12s",
              }}>
                {f.label}
              </button>
            );
          })}
          <button onClick={() => setSearchP1(v => !v)} style={{
            flexShrink: 0, padding: "6px 12px", borderRadius: 9, cursor: "pointer",
            border: `1.5px solid ${searchP1 ? "var(--red)" : "var(--border)"}`,
            background: searchP1 ? "rgba(255,82,82,0.12)" : "transparent",
            color: searchP1 ? "var(--red)" : "var(--text-3)",
            fontSize: 11, fontWeight: searchP1 ? 700 : 400, transition: "all 0.12s",
          }}>
            P1 เท่านั้น
          </button>
        </div>
      </div>

      {/* ── Results — scroll ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 40px" }}>
        {!q && !hasFilter && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-3)", fontSize: 13 }}>
            พิมพ์ชื่องานหรือ note เพื่อค้นหา
          </div>
        )}
        {(q || hasFilter) && results.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-3)", fontSize: 13 }}>
            ไม่พบงานที่ตรงกัน
          </div>
        )}
        {results.length > 0 && (
          <>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 12, fontWeight: 600, letterSpacing: "0.08em" }}>
              พบ {results.length} รายการ{hasFilter ? " (filtered)" : ""}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {results.map(t => {
                const aStyle = AREA_STYLE[t.area || ""];
                const qInfo = QUADRANT_INFO[getQuadrant(t)];
                return (
                  <div key={t.id} onClick={() => onTaskClick(t)} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 14px", borderRadius: 14, cursor: "pointer",
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 4, lineHeight: 1.3 }}>
                        {hi(t.title)}
                      </div>
                      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: qInfo.color, fontWeight: 700 }}>
                          {qInfo.shortLabel}
                        </span>
                        {aStyle && <span style={{ fontSize: 9, color: aStyle.color, background: aStyle.color + "18", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>{aStyle.label}</span>}
                        {t.status === "On Hold" && (
                          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "var(--text-3)" }}>
                            <PauseIcon size={9} color="var(--text-3)" /> พัก
                          </span>
                        )}
                        {t.status === "Waiting" && (
                          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "var(--brand)" }}>
                            <ClockIcon size={9} color="var(--brand)" /> รอ
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRightIcon size={14} color="var(--text-3)" />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function Home() {
  const [tab, setTab] = useState<Tab>("home");
  const [areaFilter, setAreaFilter] = useState<"all"|"sts"|"daisi"|"digital">("all");
  const [calView, setCalView] = useState<"agenda"|"week"|"month"|"timeblock"|"weekend">("agenda");
  const [calDayReset, setCalDayReset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [data, setData] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [createBlockTime, setCreateBlockTime] = useState<{due:string;endDue:string}|null>(null);
  const [refreshed, setRefreshed] = useState(new Date());
  const [detailTask, setDetailTask] = useState<(Task & { startMin?: number; endMin?: number }) | null>(null);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pullY, setPullY] = useState(0);
  const PULL_THRESHOLD = 70;
  const [gcalToday, setGcalToday] = useState<GCalEvent[]>([]);

  // Fetch today's GCal events for the dashboard strip
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    fetch(`/api/gcal?date=${today}`)
      .then(r => r.json())
      .then(d => { if (d.events) setGcalToday(d.events); })
      .catch(() => {});
  }, []);

  // ── Body scroll lock when any overlay is open ──
  useEffect(() => {
    const anyOpen = showAdd || showSettings || !!detailTask || showSearch;
    document.body.classList.toggle("modal-open", anyOpen);
    return () => document.body.classList.remove("modal-open");
  }, [showAdd, showSettings, detailTask, showSearch]);

  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setRefreshed(new Date());
    } catch (err) {
      console.error("fetchTasks failed:", err);
      // silent refresh failures are ignored; initial load shows stale/empty gracefully
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    autoRefreshRef.current = setInterval(() => fetchTasks(true), 5 * 60 * 1000);
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [fetchTasks]);

  /* ── Pull-to-refresh ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let startY = 0;
    let dist = 0;

    const onTouchStart = (e: TouchEvent) => {
      startY = el.scrollTop === 0 ? e.touches[0].clientY : 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!startY || el.scrollTop > 0) { startY = 0; return; }
      const dy = e.touches[0].clientY - startY;
      if (dy > 0) { e.preventDefault(); dist = dy; setPullY(dy); }
    };
    const onTouchEnd = () => {
      if (dist >= PULL_THRESHOLD) fetchTasks(true);
      setPullY(0); startY = 0; dist = 0;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove",  onTouchMove,  { passive: false });
    el.addEventListener("touchend",   onTouchEnd,   { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove",  onTouchMove);
      el.removeEventListener("touchend",   onTouchEnd);
    };
  }, [fetchTasks, PULL_THRESHOLD]);

  // remove task from ALL sections (urgent, soon, normal, review, onhold)
  const removeTask = useCallback((id: string) =>
    setData(prev => {
      if (!prev) return prev;
      const f = (arr: Task[]) => arr.filter(t => t.id !== id);
      const wasActive = [...prev.urgent, ...prev.soon, ...prev.normal].some(t => t.id === id);
      return {
        ...prev,
        urgent: f(prev.urgent), soon: f(prev.soon), normal: f(prev.normal),
        review: f(prev.review), onhold: f(prev.onhold),
        total: wasActive ? prev.total - 1 : prev.total,
      };
    }), []);

  const markDone = useCallback(async (id: string) => {
    removeTask(id);
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Done" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error("markDone failed:", err);
      // Re-fetch so the task reappears if PATCH failed
      fetchTasks(true);
    }
  }, [removeTask, fetchTasks]);

  const addTask = (task: Task) =>
    setData(prev => prev ? { ...prev, normal: [task, ...prev.normal], total: prev.total + 1 } : prev);

  const batchDone = useCallback((ids: string[]) =>
    setData(prev => {
      if (!prev) return prev;
      const f = (arr: Task[]) => arr.filter(t => !ids.includes(t.id));
      const activeCount = ids.filter(id =>
        [...prev.urgent, ...prev.soon, ...prev.normal].some(t => t.id === id)
      ).length;
      return {
        ...prev,
        urgent: f(prev.urgent), soon: f(prev.soon), normal: f(prev.normal),
        review: f(prev.review), onhold: f(prev.onhold),
        total: prev.total - activeCount,
      };
    }), []);

  const openDetail = (t: Task) =>
    setDetailTask({ ...t, category: detectCategory(t.title) });

  return (
    <main style={{
      width: "100%",
      height: "100dvh",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      position: "relative",
      userSelect: "none", WebkitUserSelect: "none",
    } as React.CSSProperties}>

      {/* Norte blue top glow — 1px line at very top */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0,
        height: 1, zIndex: 50,
        background: "linear-gradient(90deg, transparent, var(--brand) 50%, transparent)",
        opacity: 0.5,
      }} />

      {/* ── Logo watermark — faded background (matches mockup) ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mark.png"
        alt=""
        aria-hidden="true"
        style={{
          position: "fixed", left: -22, top: 28,
          width: 190, height: "auto",
          opacity: 0.07,
          filter: "brightness(10)",
          pointerEvents: "none", userSelect: "none",
          zIndex: 0,
        }}
      />

      {/* ── Geo rings — decorative blue circles (matches mockup) ── */}
      <svg
        aria-hidden="true"
        style={{ position: "fixed", right: -20, top: 200, opacity: 0.25, pointerEvents: "none", zIndex: 0 }}
        width="110" height="110" viewBox="0 0 110 110" fill="none"
      >
        <circle cx="55" cy="55" r="50" stroke="rgba(0,129,255,0.15)" strokeWidth="1"/>
        <circle cx="55" cy="55" r="34" stroke="rgba(0,129,255,0.10)" strokeWidth="1"/>
        <circle cx="55" cy="55" r="18" stroke="rgba(0,129,255,0.07)" strokeWidth="1"/>
        <line x1="55" y1="3" x2="55" y2="107" stroke="rgba(0,129,255,0.05)" strokeWidth="0.5"/>
        <line x1="3" y1="55" x2="107" y2="55" stroke="rgba(0,129,255,0.05)" strokeWidth="0.5"/>
      </svg>

      {/* ── Header — no border-bottom (matches mockup) ── */}
      <div style={{
        flexShrink: 0, zIndex: 30,
        background: "var(--bg-base)",
        padding: "calc(env(safe-area-inset-top) + 14px) 20px 12px",
      }}>
        {tab === "okr" ? (
          /* OKR header — logo + Q2 ACTIVE badge */
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-white.png" alt="Norte" style={{ height: 26, width: "auto", flexShrink: 0 }} />
              <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em" }}>Norte</span>
            </div>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 600 }}>Q2 2569</span>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)", boxShadow: "0 0 6px rgba(0,129,255,0.5)", display: "block", flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: "var(--brand)", fontWeight: 700, letterSpacing: "0.04em" }}>ACTIVE</span>
            </div>
          </div>
        ) : tab === "calendar" ? (
          /* Calendar header — logo left + Day/Week toggle right (matches mockup Screen 3) */
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-white.png" alt="Norte" style={{ height: 26, width: "auto", flexShrink: 0 }} />
              <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em" }}>Norte</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["agenda","week"] as const).map(v => {
                const on = calView === v;
                const label = v === "agenda" ? "Day" : "Week";
                return (
                  <button key={v} onClick={() => { setCalView(v); if(v==="agenda") setCalDayReset(k=>k+1); }} style={{
                    padding: "6px 14px", borderRadius: 10, cursor: "pointer",
                    border: `1px solid ${on ? "rgba(0,129,255,0.25)" : "var(--border)"}`,
                    background: on ? "var(--brand-soft)" : "var(--bg-card)",
                    color: on ? "var(--brand)" : "var(--text-2)",
                    fontSize: 11, fontWeight: on ? 700 : 600,
                  }}>{label}</button>
                );
              })}
            </div>
          </div>
        ) : (
          <Greeting onSearch={() => setShowSearch(true)} onSettings={() => setShowSettings(true)} />
        )}

        {/* Calendar header — matches mockup Screen 3 */}
        {tab === "calendar" && (calView === "month" || calView === "timeblock" || calView === "weekend") && (
          /* Secondary strip — only shows when on a non-Day/Week view */
          <div style={{ marginTop: 8, display: "flex", gap: 5 }}>
            {([
              { id: "month",     label: "Month"    },
              { id: "timeblock", label: "แผนงาน"   },
              { id: "weekend",   label: "วีคเอนด์" },
            ] as { id: "agenda"|"week"|"month"|"timeblock"|"weekend"; label: string }[]).map(v => {
              const on = calView === v.id;
              return (
                <button key={v.id} onClick={() => setCalView(v.id)} style={{
                  padding: "5px 12px", borderRadius: 9, cursor: "pointer",
                  border: `1px solid ${on ? "rgba(0,129,255,0.25)" : "var(--border)"}`,
                  background: on ? "var(--brand-soft)" : "var(--bg-card)",
                  color: on ? "var(--brand)" : "var(--text-3)",
                  fontSize: 11, fontWeight: on ? 700 : 500,
                }}>{v.label}</button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Content — fills remaining, scrolls internally, ไม่มี horizontal scroll ── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: "auto", overflowX: "hidden",
          padding: "8px 20px 80px",
          position: "relative", zIndex: 1,
        }}
      >
        {/* Pull-to-refresh indicator */}
        {pullY > 8 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: Math.min(pullY * 0.38, 40), overflow: "hidden",
            marginTop: -6, marginBottom: 4,
            transition: pullY === 0 ? "height 0.3s" : "none",
          }}>
            <PullSpinner pct={Math.min(pullY / PULL_THRESHOLD, 1)} ready={pullY >= PULL_THRESHOLD} />
          </div>
        )}

        {loading ? <LoadingState /> : !data ? null : (
          <>
            {/* Page label — only for tasks tab; home has section label inside TodayView, calendar/OKR in header */}
            {tab === "tasks" && (
              <PageLabel tab={tab} data={data} />
            )}

            {/* ── CHAT — คุยกับคิม ── */}
            {tab === "chat" && (
              <KimChat data={data} onClose={() => setTab("home")} inline />
            )}

            {/* ── HOME — วันนี้ ── */}
            {tab === "home" && (
              <TodayView
                data={data}
                onDone={markDone}
                onTaskClick={openDetail}
                syncTime={refreshed.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                gcalEvents={gcalToday}
              />
            )}

            {/* ── TASKS — งานทั้งหมด ── */}
            {tab === "tasks" && (() => {
              // Apply area filter
              const af = (arr: Task[]) => areaFilter === "all" ? arr : arr.filter(t => t.area === areaFilter);
              const active  = af([...data.urgent, ...data.soon, ...data.normal]);
              const review  = af(data.review);
              const onhold  = af(data.onhold);

              if (active.length + review.length + onhold.length === 0) return <EmptyState />;

              // Group active tasks by priority
              const byP = (p: string) => active.filter(t => t.priority === p);
              const p1 = byP("P1");
              const p2 = byP("P2");
              const p3 = byP("P3");
              const p4 = byP("P4");
              const noP = active.filter(t => !t.priority);

              // Area filter chips
              const areaOpts: { id: typeof areaFilter; label: string; color: string }[] = [
                { id: "all",     label: "ทั้งหมด", color: "var(--text-2)"     },
                { id: "sts",     label: "STS",     color: "var(--brand)"      },
                { id: "daisi",   label: "Daisi",   color: "var(--brand)"  },
                { id: "digital", label: "Digital", color: "var(--brand)" },
              ];

              return <>
                {/* ── Area filter chips ── */}
                <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", WebkitOverflowScrolling: "touch" as any, paddingBottom: 2 }}>
                  {areaOpts.map(f => {
                    const on = areaFilter === f.id;
                    return (
                      <button key={f.id} onClick={() => setAreaFilter(f.id)} style={{
                        flexShrink: 0, padding: "7px 14px", borderRadius: 10, cursor: "pointer",
                        border: `1.5px solid ${on ? f.color : "var(--border)"}`,
                        background: on ? f.color + "18" : "transparent",
                        color: on ? f.color : "var(--text-3)",
                        fontSize: 12, fontWeight: on ? 700 : 400, transition: "all 0.12s",
                      }}>
                        {f.label}
                      </button>
                    );
                  })}
                </div>

                {/* ── P1 → P4 sections ── */}
                <Section icon={<FlagIcon size={13} color="#ff3b30" />} label="P1 · ทำทันที" count={p1.length}
                  color="#ff3b30" bg="rgba(255,59,48,0.08)"
                  tasks={p1} onDone={markDone} onTaskClick={openDetail}
                  defaultOpen={true} limit={20} />
                <Section icon={<DotIcon size={9} color="#ff9500" />} label="P2 · มอบหมาย" count={p2.length}
                  color="#ff9500" bg="rgba(255,149,0,0.08)"
                  tasks={p2} onDone={markDone} onTaskClick={openDetail}
                  defaultOpen={true} limit={20} />
                <Section icon={<DotIcon size={9} color="var(--brand)" />} label="P3 · วางแผน" count={p3.length}
                  color="var(--brand)" bg="var(--brand-soft)"
                  tasks={p3} onDone={markDone} onTaskClick={openDetail}
                  defaultOpen={false} limit={20} />
                <Section icon={<ArchiveIcon size={13} color="var(--text-2)" />} label="P4 · ตัดออก/รอ" count={p4.length}
                  color="var(--text-2)" bg="var(--bg-raised)"
                  tasks={p4} onDone={markDone} onTaskClick={openDetail}
                  defaultOpen={false} limit={20} />
                {noP.length > 0 && (
                  <Section icon={<FileTextIcon size={13} color="var(--text-3)" />} label="ไม่ระบุ priority" count={noP.length}
                    color="var(--text-3)" bg="var(--bg-raised)"
                    tasks={noP} onDone={markDone} onTaskClick={openDetail}
                    defaultOpen={false} limit={20} />
                )}

                {/* ── Waiting / รอตรวจ ── */}
                {review.length > 0 && (
                  <Section icon={<ClockIcon size={13} color="var(--brand)" />} label="รอตรวจ / ติดตาม" count={review.length}
                    color="var(--brand)" bg="var(--teal-glow)"
                    tasks={review} onDone={markDone} onTaskClick={openDetail}
                    defaultOpen={true} limit={20} />
                )}

                {/* ── On Hold — collapsed ── */}
                {onhold.length > 0 && (
                  <Section icon={<PauseIcon size={13} color="var(--text-3)" />} label="พักไว้ (On Hold)" count={onhold.length}
                    color="var(--text-3)" bg="var(--bg-raised)"
                    tasks={onhold} onDone={markDone} onTaskClick={openDetail}
                    defaultOpen={false} limit={30} />
                )}
              </>;
            })()}

            {/* ── CALENDAR — Time Block + Week ── */}
            {tab === "calendar" && data && (
              <>

                {/* Day time-block view */}
                {calView === "agenda" && (
                  <DayView
                    urgent={data.urgent}
                    soon={data.soon}
                    normal={data.normal}
                    review={data.review}
                    onTaskClick={openDetail}
                    onDone={markDone}
                    scrollContainer={scrollRef}
                    resetKey={calDayReset}
                    onCreateBlock={(due,endDue)=>setCreateBlockTime({due,endDue})}
                  />
                )}

                {/* Week view */}
                {calView === "week" && (
                  <WeekView
                    urgent={data.urgent}
                    soon={data.soon}
                    normal={data.normal}
                    review={data.review}
                    onTaskClick={openDetail}
                  />
                )}

                {/* Month view */}
                {calView === "month" && (
                  <MonthView
                    urgent={data.urgent}
                    soon={data.soon}
                    normal={data.normal}
                    review={data.review}
                    onTaskClick={openDetail}
                  />
                )}

                {/* TimeBlock view — แผนงานวันนี้ */}
                {calView === "timeblock" && (
                  <TimeBlockView
                    urgent={data.urgent}
                    soon={data.soon}
                    normal={data.normal}
                    view="today"
                    onTaskClick={t => openDetail(t)}
                  />
                )}

                {/* Weekend view — ตารางชีวิตวีคเอนด์ */}
                {calView === "weekend" && (() => {
                  const now = new Date();
                  const dow = now.getDay(); // 0=Sun, 6=Sat
                  // ถ้าวันนี้เป็นเสาร์หรืออาทิตย์ ใช้วันนี้ ไม่งั้นหาวันเสาร์ถัดไป
                  let targetDate: Date;
                  let day: "saturday" | "sunday";
                  if (dow === 6) { targetDate = now; day = "saturday"; }
                  else if (dow === 0) { targetDate = now; day = "sunday"; }
                  else {
                    const daysToSat = 6 - dow;
                    targetDate = new Date(now.getTime() + daysToSat * 86400000);
                    day = "saturday";
                  }
                  return (
                    <WeekendScheduleView
                      day={day}
                      date={targetDate}
                      tasks={[...data.urgent, ...data.soon, ...data.normal]}
                      onTaskClick={openDetail}
                    />
                  );
                })()}
              </>
            )}

            {/* ── OKR ── */}
            {tab === "okr" && (
              <QuickActionsView tasks={data} />
            )}
          </>
        )}
      </div>

      {/* FAB — Add task only */}
      <div style={{ position: "fixed", bottom: 90, right: 20, zIndex: 35 }}>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "var(--brand)", border: "none",
            color: "#fff", fontSize: 28, fontWeight: 400, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 1, paddingBottom: 2,
            boxShadow: "0 4px 24px rgba(0,129,255,0.40)",
          }}
        >+</button>
      </div>

      <Nav active={tab} onChange={setTab} />

      {(showAdd || createBlockTime) && (
        <AddTaskModal
          onClose={() => { setShowAdd(false); setCreateBlockTime(null); }}
          onAdd={task => { addTask(task); setCreateBlockTime(null); }}
          initialDue={createBlockTime?.due}
          initialEndDue={createBlockTime?.endDue}
        />
      )}
      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onDone={id => { markDone(id); setDetailTask(null); }}
        />
      )}

      {showSearch && data && (
        <SearchSheet
          data={data}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onTaskClick={t => { setShowSearch(false); openDetail(t); }}
          onClose={() => setShowSearch(false)}
        />
      )}
    </main>
  );
}
