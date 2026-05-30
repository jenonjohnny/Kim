"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Nav, { Tab } from "./components/Nav";
import AddTaskModal from "./components/AddTaskModal";
import TaskDetailModal from "./components/TaskDetailModal";
import QuickActionsView from "./components/QuickActionsView";
import WeekView from "./components/WeekView";
import MonthView from "./components/MonthView";
import DayView from "./components/DayView";
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

/* ─── Greeting header ─── */
function Greeting() {
  const h = new Date().getHours();
  const greeting = h < 12 ? "อรุณสวัสดิ์ค่ะ" : h < 17 ? "สวัสดียามบ่ายค่ะ" : "สวัสดียามเย็นค่ะ";
  const now = new Date();
  const dateStr = `${THAI_DAYS[now.getDay()]} ${now.getDate()} ${THAI_MONTHS[now.getMonth()]} ${now.getFullYear() + 543}`;
  const [name, setName] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("profile_name") || "คิม") : "คิม"
  );
  // อัปเดตชื่อทันทีเมื่อเปลี่ยนใน Settings
  useEffect(() => {
    const handler = () => setName(localStorage.getItem("profile_name") || "คิม");
    window.addEventListener("profile-name-change", handler);
    return () => window.removeEventListener("profile-name-change", handler);
  }, []);
  return (
    <div>
      {/*
        ── HEADER BRAND ROW ──
        เปลี่ยนโลโก้: swap /public/logo-mark.png (cropped, no padding)
        ขนาด Lock: height 22px — อย่าแก้ CSS, swap ไฟล์แทน
        เปลี่ยนชื่อ: แก้ text ด้านล่างได้เลย
      */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-mark.png"
          alt="Norte"
          style={{
            height: 20,
            width: "auto",
            flexShrink: 0,
            animation: "pulse-dot 2.5s ease-in-out infinite",
          }}
        />
        <span style={{ fontSize: 11, color: "var(--amber)", fontWeight: 700, letterSpacing: "0.12em" }}>
          NORTE
        </span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em" }}>{greeting}</div>
      <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6 }}>{name} · {dateStr}</div>
    </div>
  );
}

/* ─── Page label — เหมือนกันทุกแท็บ ─── */
const PAGE_LABELS: Record<Tab, string> = {
  home:     "◈  วันนี้",
  tasks:    "≡  งานทั้งหมด",
  calendar: "⊞  ตารางงาน",
  okr:      "◎  เป้าหมาย & OKR",
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
          <span style={{ color: "var(--red)", fontWeight: 700 }}>{data.urgent.length}</span>
          {" "}ด่วน ·{" "}
          <span style={{ color: "var(--amber)", fontWeight: 700 }}>{data.soon.length}</span>
          {" "}ใกล้มา ·{" "}
          <span style={{ fontWeight: 600 }}>{data.total}</span>
          {" "}งาน
        </span>
      )}
      {tab === "tasks" && (
        <span style={{ fontSize: 10, color: "var(--text-3)" }}>
          {data.total} งาน
          {data.review.length > 0 && <> · <span style={{ color: "var(--steel-teal)" }}>{data.review.length} รอตรวจ</span></>}
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
  const color = ready ? "var(--amber)" : "var(--amber)";

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
      <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
      <div style={{ color: "var(--text-2)", fontSize: 16, fontWeight: 600 }}>ไม่มีงานค้างค่ะ</div>
      <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 8 }}>คิมภูมิใจในตัวเจ้านายมากเลย</div>
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
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 60); }, []);

  const allTasks = [
    ...data.urgent, ...data.soon, ...data.normal,
    ...data.review, ...data.onhold,
  ];
  const q = query.trim().toLowerCase();
  const results = q
    ? allTasks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.notes || "").toLowerCase().includes(q)
      )
    : [];

  const hi = (text: string) => {
    if (!q) return <span>{text}</span>;
    const idx = text.toLowerCase().indexOf(q);
    if (idx < 0) return <span>{text}</span>;
    return (
      <span>
        {text.slice(0, idx)}
        <mark style={{ background: "rgba(255,185,0,0.3)", color: "inherit", borderRadius: 3 }}>
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
          border: `1.5px solid ${query ? "rgba(255,185,0,0.45)" : "var(--border)"}`,
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
      </div>

      {/* ── Results — scroll ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 40px" }}>
        {!q && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-3)", fontSize: 13 }}>
            พิมพ์ชื่องานหรือ note เพื่อค้นหา
          </div>
        )}
        {q && results.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-3)", fontSize: 13 }}>
            ไม่พบงานที่ตรงกัน ✨
          </div>
        )}
        {results.length > 0 && (
          <>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 12, fontWeight: 600, letterSpacing: "0.08em" }}>
              พบ {results.length} รายการ
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
                          {qInfo.emoji} {qInfo.shortLabel}
                        </span>
                        {aStyle && <span style={{ fontSize: 9, color: aStyle.color, background: aStyle.color + "18", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>{aStyle.label}</span>}
                        {t.status === "On Hold" && (
                          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "var(--text-3)" }}>
                            <PauseIcon size={9} color="var(--text-3)" /> พัก
                          </span>
                        )}
                        {t.status === "Waiting" && (
                          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "var(--steel-teal)" }}>
                            <ClockIcon size={9} color="var(--steel-teal)" /> รอ
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
  const [calView, setCalView] = useState<"agenda"|"week"|"month">("agenda");
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
      userSelect: "none", WebkitUserSelect: "none",
    } as React.CSSProperties}>

      {/* Amber top accent */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0,
        height: 1, zIndex: 50,
        background: "linear-gradient(90deg, transparent, var(--amber) 50%, transparent)",
        opacity: 0.6,
      }} />

      {/* ── Header — flex-shrink:0 ── */}
      <div style={{
        flexShrink: 0, zIndex: 30,
        background: "var(--bg-base)",
        padding: "calc(env(safe-area-inset-top) + 14px) 20px 12px",
        borderBottom: "1px solid var(--border-soft)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Greeting />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Feedback */}
            <FeedbackStrip compact />
            {/* Search */}
            <button
              onClick={() => setShowSearch(true)}
              style={{
                width: 38, height: 38, borderRadius: 12, cursor: "pointer",
                background: "var(--bg-card)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 0,
              }}
            >
              <SearchIcon size={17} color="var(--icon-tint)" />
            </button>
            {/* Settings */}
            <button
              onClick={() => setShowSettings(true)}
              style={{
                ...CARD, width: 38, height: 38, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 0,
              }}
            >
              <GearIcon size={17} color="var(--icon-tint)" />
            </button>
          </div>
        </div>
        {/* OKR label — pinned inside header so it never scrolls away */}
        {tab === "okr" && data && (
          <div style={{ marginTop: 10, borderTop: "1px solid var(--border-soft)", paddingTop: 10 }}>
            <PageLabel tab="okr" data={data} />
          </div>
        )}

        {/* Calendar sub-tab — pinned inside header so it never scrolls away */}
        {tab === "calendar" && (
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            {([
              { id: "agenda", label: "วันนี้"  },
              { id: "week",   label: "สัปดาห์" },
              { id: "month",  label: "เดือน"   },
            ] as const).map(v => {
              const on = calView === v.id;
              return (
                <button key={v.id} onClick={() => { setCalView(v.id); if(v.id==="agenda") setCalDayReset(k=>k+1); }} style={{
                  flexShrink: 0, padding: "7px 16px", borderRadius: 10, cursor: "pointer",
                  border: `1.5px solid ${on ? "var(--amber)" : "var(--border)"}`,
                  background: on ? "var(--brand-soft)" : "transparent",
                  color: on ? "var(--amber)" : "var(--text-3)",
                  fontSize: 13, fontWeight: on ? 700 : 400, transition: "all 0.12s",
                }}>
                  {v.label}
                </button>
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
          padding: tab === "calendar" && calView === "agenda" ? "16px 20px 80px" : "16px 20px 80px",
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
            {/* Page label — hide for calendar/agenda and OKR (both handled in fixed header) */}
            {!(tab === "calendar" && calView === "agenda") && tab !== "okr" && (
              <PageLabel tab={tab} data={data} />
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
                { id: "sts",     label: "STS",     color: "var(--amber)"      },
                { id: "daisi",   label: "Daisi",   color: "var(--warm-gold)"  },
                { id: "digital", label: "Digital", color: "var(--steel-teal)" },
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
                <Section icon={<FlagIcon size={13} color="var(--red)" />} label="P1 · ทำทันที" count={p1.length}
                  color="var(--red)" bg="var(--red-soft)"
                  tasks={p1} onDone={markDone} onTaskClick={openDetail}
                  defaultOpen={true} limit={20} />
                <Section icon={<DotIcon size={9} color="#e07840" />} label="P2 · มอบหมาย" count={p2.length}
                  color="#e07840" bg="rgba(224,120,64,0.08)"
                  tasks={p2} onDone={markDone} onTaskClick={openDetail}
                  defaultOpen={true} limit={20} />
                <Section icon={<DotIcon size={9} color="var(--amber)" />} label="P3 · วางแผน" count={p3.length}
                  color="var(--amber)" bg="var(--brand-soft)"
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
                  <Section icon={<ClockIcon size={13} color="var(--steel-teal)" />} label="รอตรวจ / ติดตาม" count={review.length}
                    color="var(--steel-teal)" bg="var(--teal-glow)"
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
            background: "var(--amber)", border: "none",
            color: "#000", fontSize: 28, fontWeight: 400, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 1, paddingBottom: 2,
            boxShadow: "0 4px 24px rgba(255,185,0,0.35)",
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
