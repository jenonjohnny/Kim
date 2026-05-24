"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Nav, { Tab } from "./components/Nav";
import TimeBlockView from "./components/TimeBlockView";
import AddTaskModal from "./components/AddTaskModal";
import TaskDetailModal from "./components/TaskDetailModal";
import QuickActionsView from "./components/QuickActionsView";
import WeekendScheduleView from "./components/WeekendScheduleView";
import SettingsSheet from "./components/SettingsSheet";
import { Task, TaskData, CAT_STYLE, detectCategory } from "./components/types";

const THAI_DAYS = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัส","ศุกร์","เสาร์"];
const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

type CalView = "today" | "tomorrow";

/* ─────────────────────────────────────────
   SHARED DESIGN TOKENS  (ตรงกับ Quick Actions)
   card: padding 14px 16px, radius 16, bg-card, border
   label: 14px 600 text-1
   sub:   11px text-3 mt-2
   arrow: › 12px text-3
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
  return (
    <div>
      <div style={{ fontSize: 10, color: "var(--amber)", fontWeight: 700, letterSpacing: "0.14em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--amber)", animation: "pulse-dot 2s infinite" }} />
        DAISI DESIGN OS
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em" }}>{greeting}</div>
      <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6 }}>คิม · {dateStr}</div>
    </div>
  );
}

/* ─── Page label — เหมือนกันทุกแท็บ ─── */
const PAGE_LABELS: Record<Tab, string> = {
  home:  "◈  วันนี้",
  tasks: "≡  งานทั้งหมด",
  okr:   "🎯  เป้าหมาย & OKR",
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
          รวม {data.urgent.length + data.soon.length + data.normal.length + data.review.length} งาน
        </span>
      )}
    </div>
  );
}

/* ─── Task row — ใช้ CARD tokens เหมือน Quick Actions ─── */
function TaskRow({
  task, onDone, onClick,
}: {
  task: Task; onDone: (id: string) => void; onClick?: () => void;
}) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const s = CAT_STYLE[task.category ?? detectCategory(task.title)];

  const handleDone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Done" }),
    });
    setDone(true);
    setTimeout(() => onDone(task.id), 320);
  };

  const dueLabel = () => {
    if (!task.due) return null;
    const today = new Date().toISOString().split("T")[0];
    const diff = Math.ceil((new Date(task.due).getTime() - new Date(today).getTime()) / 86400000);
    if (diff < 0) return { text: `เลย ${Math.abs(diff)} วัน`, color: "var(--red)" };
    if (diff === 0) return { text: "วันนี้", color: "var(--amber)" };
    if (diff === 1) return { text: "พรุ่งนี้", color: "var(--amber)" };
    const d = new Date(task.due + "T00:00:00");
    return { text: `${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`, color: "var(--text-3)" };
  };
  const due = dueLabel();

  return (
    <div
      onClick={onClick}
      style={{
        ...CARD,
        display: "flex", alignItems: "center", gap: 12,
        borderLeft: `3px solid ${s.color}`,
        opacity: done ? 0 : 1,
        transform: done ? "translateX(10px)" : "none",
        transition: "opacity 0.3s, transform 0.3s",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {/* Done button */}
      <button
        onClick={handleDone}
        disabled={loading}
        style={{
          width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
          border: `2px solid ${loading ? s.color : "var(--border)"}`,
          background: loading ? s.bg : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s",
        }}
      >
        {loading && <span style={{ color: s.color, fontSize: 11, fontWeight: 700 }}>✓</span>}
      </button>

      {/* Title + category */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.3,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {task.title}
        </div>
        <div style={{ fontSize: 11, color: s.color, marginTop: 2 }}>
          {s.emoji} {task.category ?? detectCategory(task.title)}
          {task.status === "Waiting" && (
            <span style={{ color: "var(--steel-teal)", marginLeft: 6 }}>· ⏳ ติดตาม</span>
          )}
          {task.notes && (
            <span style={{ color: "var(--text-3)", marginLeft: 6 }}>· 📝</span>
          )}
        </div>
      </div>

      {/* Due date */}
      {due && (
        <span style={{ fontSize: 11, color: due.color, flexShrink: 0, fontWeight: 600 }}>
          {due.text}
        </span>
      )}
      {/* Arrow */}
      {onClick && <span style={{ fontSize: 12, color: "var(--text-3)", flexShrink: 0 }}>›</span>}
    </div>
  );
}

/* ── height constant — ทุก block เท่ากัน fill 1/4 screen ──
   overhead = header(130) + content-padding(96) + PageLabel(50) + 3 gaps(30) + sync(24) + buffer = ~340px
── */
const BLOCK_H = "max(60px, calc((100dvh - 340px) / 4))";

/* ─── Section — header ใช้ CARD style เหมือน Quick Actions ─── */
function Section({
  emoji, label, count, color, bg,
  tasks, onDone, onTaskClick,
  defaultOpen = true, limit = 99,
  forceShow = false,
}: {
  emoji: string; label: string; count: number;
  color: string; bg: string;
  tasks: Task[]; onDone: (id: string) => void;
  onTaskClick?: (t: Task) => void;
  defaultOpen?: boolean; limit?: number;
  forceShow?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [showAll, setShowAll] = useState(false);
  if (!tasks.length && !forceShow) return null;
  const visible = showAll ? tasks : tasks.slice(0, limit);
  const hasItems = tasks.length > 0;

  return (
    <div style={{ marginBottom: 10 }}>
      {/* Section header — fixed minHeight = 1/4 screen, เท่ากันทุก block */}
      <button
        onClick={() => hasItems && setOpen(o => !o)}
        style={{
          ...CARD,
          display: "flex", alignItems: "center", gap: 14,
          width: "100%", cursor: hasItems ? "pointer" : "default",
          marginBottom: open && hasItems ? 8 : 0,
          minHeight: BLOCK_H,
          background: open && hasItems ? bg : "var(--bg-card)",
          border: `1px solid ${open && hasItems ? color + "40" : "var(--border)"}`,
          transition: "all 0.15s",
        }}
      >
        <span style={{ fontSize: 20, flexShrink: 0 }}>{emoji}</span>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{label}</div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
            {hasItems
              ? `${count} รายการ${!open ? " — กดเพื่อดู" : ""}`
              : "ไม่มีรายการ ✨"}
          </div>
        </div>
        <span style={{ fontSize: 13, color: "var(--text-3)", flexShrink: 0 }}>
          {hasItems ? (open ? "▲" : "›") : "—"}
        </span>
      </button>

      {/* Tasks */}
      {open && hasItems && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {visible.map(t => (
              <TaskRow
                key={t.id}
                task={{ ...t, category: detectCategory(t.title) }}
                onDone={onDone}
                onClick={onTaskClick ? () => onTaskClick(t) : undefined}
              />
            ))}
          </div>
          {!showAll && tasks.length > limit && (
            <button
              onClick={e => { e.stopPropagation(); setShowAll(true); }}
              style={{
                marginTop: 6, width: "100%", ...CARD,
                fontSize: 12, color: "var(--text-3)", cursor: "pointer",
                textAlign: "center",
              }}
            >
              แสดงอีก {tasks.length - limit} รายการ ▼
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Today — flat to-do list item ─── */
function TodoItem({
  task, onDone, onClick, accent,
}: {
  task: Task; onDone: (id: string) => void; onClick: () => void;
  accent: string;
}) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const s = CAT_STYLE[task.category ?? detectCategory(task.title)];

  const handleDone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Done" }),
    });
    setDone(true);
    setTimeout(() => onDone(task.id), 280);
  };

  const dueLabel = () => {
    if (!task.due) return null;
    const today = new Date().toISOString().split("T")[0];
    const diff = Math.ceil((new Date(task.due).getTime() - new Date(today).getTime()) / 86400000);
    if (diff < 0) return { text: `เลย ${Math.abs(diff)} วัน`, color: "var(--red)" };
    if (diff === 0) return { text: "วันนี้!", color: "var(--amber)" };
    if (diff === 1) return { text: "พรุ่งนี้", color: "var(--amber)" };
    const d = new Date(task.due + "T00:00:00");
    return { text: `${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`, color: "var(--text-3)" };
  };
  const due = dueLabel();

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "13px 16px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${accent}`,
        borderRadius: 14,
        cursor: "pointer",
        opacity: done ? 0 : 1,
        transform: done ? "translateX(10px)" : "none",
        transition: "opacity 0.25s, transform 0.25s",
      }}
    >
      {/* Checkbox */}
      <button
        onClick={handleDone}
        disabled={loading}
        style={{
          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
          border: `2.5px solid ${loading ? accent : "var(--border)"}`,
          background: loading ? accent + "22" : "transparent",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s",
        }}
      >
        {loading && <span style={{ color: accent, fontSize: 12, fontWeight: 800 }}>✓</span>}
      </button>

      {/* Title + category */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {task.title}
        </div>
        <div style={{ fontSize: 11, color: s.color, marginTop: 2 }}>
          {s.emoji} {task.category ?? detectCategory(task.title)}
          {task.status === "Waiting" && <span style={{ color: "var(--steel-teal)", marginLeft: 6 }}>· ⏳</span>}
        </div>
      </div>

      {/* Due badge */}
      {due && <span style={{ fontSize: 11, color: due.color, flexShrink: 0, fontWeight: 600 }}>{due.text}</span>}
      <span style={{ fontSize: 12, color: "var(--text-3)", flexShrink: 0 }}>›</span>
    </div>
  );
}

/* ─── Section label — lightweight, non-clickable ─── */
function SectionDivider({ emoji, label, color, count }: { emoji: string; label: string; color: string; count: number }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      marginTop: 18, marginBottom: 10,
    }}>
      <span style={{ fontSize: 13 }}>{emoji}</span>
      <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</span>
      <span style={{
        fontSize: 10, fontWeight: 700, color,
        background: color + "18", borderRadius: 6,
        padding: "1px 7px", marginLeft: 2,
      }}>{count}</span>
      <div style={{ flex: 1, height: 1, background: color + "22", marginLeft: 4 }} />
    </div>
  );
}

/* ─── Today — flat to-do list view ─── */
function TodayView({
  data, onDone, onTaskClick, syncTime,
}: {
  data: TaskData; onDone: (id: string) => void;
  onTaskClick: (t: Task) => void; syncTime: string;
}) {
  const todayStr = new Date().toISOString().split("T")[0];

  // แยก urgent ออกเป็น: ค้างจากวันก่อน vs ครบวันนี้
  const overdue  = data.urgent.filter(t => t.due && t.due < todayStr);
  const dueToday = data.urgent.filter(t => t.due && t.due === todayStr);
  const soon     = data.soon;
  const normal   = data.normal;
  const review   = data.review;
  const total    = data.urgent.length + soon.length + normal.length;

  if (total === 0 && review.length === 0) return <EmptyState />;

  return (
    <div>
      {/* ── Summary bar ── */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "14px 18px",
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 16, marginBottom: 4, gap: 0,
      }}>
        {[
          { label: "วันนี้",   n: dueToday.length, color: "var(--red)"       },
          { label: "ค้าง",     n: overdue.length,  color: "var(--warm-gray)" },
          { label: "ใกล้มา",   n: soon.length,     color: "var(--amber)"     },
          { label: "รอตรวจ",   n: review.length,   color: "var(--steel-teal)"},
        ].map((s, i) => (
          <div key={s.label} style={{ flex: 1, textAlign: "center", borderLeft: i > 0 ? "1px solid var(--border)" : "none", padding: "0 8px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 3, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Due today ── */}
      {dueToday.length > 0 && (
        <>
          <SectionDivider emoji="🔴" label="ครบวันนี้" color="var(--red)" count={dueToday.length} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dueToday.map(t => (
              <TodoItem key={t.id} task={{ ...t, category: detectCategory(t.title) }}
                onDone={onDone} onClick={() => onTaskClick(t)} accent="var(--red)" />
            ))}
          </div>
        </>
      )}

      {/* ── Overdue from past days ── */}
      {overdue.length > 0 && (
        <>
          <SectionDivider emoji="⚠️" label="ค้างจากก่อนหน้า" color="var(--warm-gray)" count={overdue.length} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {overdue.map(t => (
              <TodoItem key={t.id} task={{ ...t, category: detectCategory(t.title) }}
                onDone={onDone} onClick={() => onTaskClick(t)} accent="var(--warm-gray)" />
            ))}
          </div>
        </>
      )}

      {/* ── Soon ── */}
      {soon.length > 0 && (
        <>
          <SectionDivider emoji="🟡" label="ใกล้ครบกำหนด · 3 วัน" color="var(--amber)" count={soon.length} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {soon.map(t => (
              <TodoItem key={t.id} task={{ ...t, category: detectCategory(t.title) }}
                onDone={onDone} onClick={() => onTaskClick(t)} accent="var(--amber)" />
            ))}
          </div>
        </>
      )}

      {/* ── Normal — limited to 5, rest in Tasks tab ── */}
      {normal.length > 0 && (
        <>
          <SectionDivider emoji="📋" label="งานอื่นๆ" color="var(--text-3)" count={normal.length} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {normal.slice(0, 5).map(t => (
              <TodoItem key={t.id} task={{ ...t, category: detectCategory(t.title) }}
                onDone={onDone} onClick={() => onTaskClick(t)} accent="var(--border)" />
            ))}
          </div>
          {normal.length > 5 && (
            <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-3)", marginTop: 10, padding: "8px 0" }}>
              +{normal.length - 5} งานอีก · ดูทั้งหมดที่แท็บ <strong style={{ color: "var(--amber)" }}>งาน</strong>
            </div>
          )}
        </>
      )}

      {/* ── Review — compact card ── */}
      {review.length > 0 && (
        <div style={{
          marginTop: 20, padding: "13px 16px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderLeft: "3px solid var(--steel-teal)",
          borderRadius: 14,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--steel-teal)", letterSpacing: "0.1em", marginBottom: 10 }}>
            ⏳ รอตรวจ · {review.length} งาน
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {review.slice(0, 4).map(t => {
              const s = CAT_STYLE[detectCategory(t.title)];
              return (
                <div key={t.id} onClick={() => onTaskClick(t)}
                  style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <span style={{ fontSize: 13 }}>⏳</span>
                  <span style={{ fontSize: 13, color: "var(--text-2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                  <span style={{ fontSize: 10, color: s.color, flexShrink: 0 }}>{s.emoji}</span>
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>›</span>
                </div>
              );
            })}
            {review.length > 4 && (
              <div style={{ fontSize: 11, color: "var(--text-3)", paddingTop: 2 }}>+{review.length - 4} งานอีก</div>
            )}
          </div>
        </div>
      )}

      {/* Sync */}
      <div style={{ textAlign: "center", fontSize: 10, color: "var(--text-3)", marginTop: 20, paddingBottom: 4 }}>
        sync {syncTime} น. · auto ทุก 5 นาที
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <div style={{ fontSize: 32, marginBottom: 12, animation: "pulse 1.5s infinite" }}>◈</div>
      <div style={{ color: "var(--text-3)", fontSize: 14 }}>คิมกำลังดึงข้อมูล...</div>
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

/* ─── Main page ─── */
export default function Home() {
  const [tab, setTab] = useState<Tab>("home");
  const [calView, setCalView] = useState<CalView>("today");
  const [showSettings, setShowSettings] = useState(false);
  const [data, setData] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [refreshed, setRefreshed] = useState(new Date());
  const [detailTask, setDetailTask] = useState<(Task & { startMin?: number; endMin?: number }) | null>(null);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pullY, setPullY] = useState(0);
  const PULL_THRESHOLD = 70;

  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await fetch("/api/tasks", { cache: "no-store" });
    setData(await res.json());
    setRefreshed(new Date());
    if (!silent) setLoading(false);
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

  // remove task from ALL sections (urgent, soon, normal, review)
  const removeTask = useCallback((id: string) =>
    setData(prev => {
      if (!prev) return prev;
      const f = (arr: Task[]) => arr.filter(t => t.id !== id);
      return { ...prev, urgent: f(prev.urgent), soon: f(prev.soon), normal: f(prev.normal), review: f(prev.review), total: prev.total - 1 };
    }), []);

  const markDone = useCallback(async (id: string) => {
    removeTask(id);
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Done" }),
    });
  }, [removeTask]);

  const addTask = (task: Task) =>
    setData(prev => prev ? { ...prev, normal: [task, ...prev.normal], total: prev.total + 1 } : prev);

  const batchDone = useCallback((ids: string[]) =>
    setData(prev => {
      if (!prev) return prev;
      const f = (arr: Task[]) => arr.filter(t => !ids.includes(t.id));
      return { ...prev, urgent: f(prev.urgent), soon: f(prev.soon), normal: f(prev.normal), review: f(prev.review), total: prev.total - ids.length };
    }), []);

  const openDetail = (t: Task) =>
    setDetailTask({ ...t, category: detectCategory(t.title) });

  return (
    <main style={{
      width: "100%",
      height: "100dvh",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>

      {/* Amber top accent */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0,
        height: 1, zIndex: 50,
        background: "linear-gradient(90deg, transparent, var(--amber) 50%, transparent)",
        opacity: 0.6,
      }} />

      {/* ── Header — flex-shrink:0, ไม่ sticky, fully opaque ── */}
      <div style={{
        flexShrink: 0, zIndex: 30,
        background: "var(--bg-base)",
        padding: "52px 20px 14px",
        borderBottom: "1px solid var(--border-soft)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Greeting />
          <button
            onClick={() => setShowSettings(true)}
            style={{
              ...CARD, width: 38, height: 38, cursor: "pointer",
              color: "var(--text-2)", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 0,
            }}
          >⚙️</button>
        </div>
      </div>

      {/* ── Content — fills remaining, scrolls internally, ไม่มี horizontal scroll ── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: "auto", overflowX: "hidden",
          padding: "16px 20px 80px",
        }}
      >
        {/* Pull-to-refresh indicator */}
        {pullY > 8 && (
          <div style={{
            textAlign: "center", marginTop: -8, marginBottom: 8,
            height: Math.min(pullY * 0.35, 36), overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: pullY === 0 ? "height 0.3s" : "none",
          }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: pullY >= PULL_THRESHOLD ? "var(--green)" : "var(--amber)",
              transition: "color 0.2s",
            }}>
              {pullY >= PULL_THRESHOLD ? "↑ ปล่อยเพื่อรีเฟรช" : "↓ ดึงเพื่อรีเฟรช"}
            </span>
          </div>
        )}

        {loading ? <LoadingState /> : !data ? null : (
          <>
            {/* Page label — same position, same style, every tab */}
            <PageLabel tab={tab} data={data} />

            {/* ── HOME — วันนี้ ── */}
            {tab === "home" && (
              <TodayView
                data={data}
                onDone={markDone}
                onTaskClick={openDetail}
                syncTime={refreshed.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
              />
            )}

            {/* ── TASKS — งานทั้งหมด + calendar ── */}
            {tab === "tasks" && (() => {
              const all = [...data.urgent, ...data.soon, ...data.normal, ...data.review];
              if (all.length === 0) return <EmptyState />;

              const byArea = (area: "sts" | "daisi") => ({
                urgent: data.urgent.filter(t => t.area === area),
                soon:   data.soon.filter(t => t.area === area),
                normal: data.normal.filter(t => t.area === area),
                review: data.review.filter(t => t.area === area),
              });
              const sts   = byArea("sts");
              const daisi = byArea("daisi");

              const AreaHeader = ({ emoji, label, color, count }: { emoji: string; label: string; color: string; count: number }) => (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  margin: "12px 0 8px", padding: "0 4px",
                }}>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
                    {emoji} {label}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text-3)" }}>{count}</span>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                </div>
              );

              return <>
                {/* Sub-nav: List / Calendar */}
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  {([["list","≡ รายการ"], ["cal","▦ ตาราง"]] as const).map(([v, label]) => {
                    const on = (calView === "today" || calView === "tomorrow") ? v === "cal" : v === "list";
                    // use calView === "today" | "tomorrow" for calendar sub-view
                    const isCalMode = calView === "today" || calView === "tomorrow";
                    const active = v === "cal" ? isCalMode : !isCalMode;
                    return (
                      <button key={v} onClick={() => { if (v === "cal") setCalView("today"); else setCalView("today"); }}
                        style={{
                          padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: active ? 700 : 400,
                          border: `1px solid ${active ? "var(--amber)" : "var(--border)"}`,
                          background: active ? "var(--brand-soft)" : "transparent",
                          color: active ? "var(--amber)" : "var(--text-3)", cursor: "pointer",
                        }}>
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* ── STS ── */}
                <AreaHeader emoji="🏢" label="งานประจำ · STS" color="var(--steel-teal)"
                  count={sts.urgent.length + sts.soon.length + sts.normal.length + sts.review.length} />
                <Section emoji="🔴" label="ด่วน" count={sts.urgent.length}
                  color="var(--red)" bg="var(--red-soft)"
                  tasks={sts.urgent} onDone={markDone} onTaskClick={openDetail}
                  defaultOpen={true} limit={4} />
                <Section emoji="🟡" label="ใกล้มา" count={sts.soon.length}
                  color="var(--amber)" bg="var(--brand-soft)"
                  tasks={sts.soon} onDone={markDone} onTaskClick={openDetail}
                  defaultOpen={true} limit={4} />
                <Section emoji="⏳" label="ติดตามงาน" count={sts.review.length}
                  color="var(--steel-teal)" bg="var(--teal-glow)"
                  tasks={sts.review} onDone={markDone} onTaskClick={openDetail}
                  defaultOpen={true} limit={4} forceShow={true} />
                <Section emoji="📋" label="ถัดไป" count={sts.normal.length}
                  color="var(--text-2)" bg="var(--bg-raised)"
                  tasks={sts.normal} onDone={markDone} onTaskClick={openDetail}
                  defaultOpen={false} limit={4} />

                {/* ── Daisi ── */}
                <AreaHeader emoji="🎨" label="งานส่วนตัว · Daisi" color="var(--warm-gold)"
                  count={daisi.urgent.length + daisi.soon.length + daisi.normal.length + daisi.review.length} />
                <Section emoji="🔴" label="ด่วน" count={daisi.urgent.length}
                  color="var(--red)" bg="var(--red-soft)"
                  tasks={daisi.urgent} onDone={markDone} onTaskClick={openDetail}
                  defaultOpen={true} limit={4} />
                <Section emoji="🟡" label="ใกล้มา" count={daisi.soon.length}
                  color="var(--amber)" bg="var(--brand-soft)"
                  tasks={daisi.soon} onDone={markDone} onTaskClick={openDetail}
                  defaultOpen={true} limit={4} />
                <Section emoji="📋" label="ถัดไป" count={daisi.normal.length}
                  color="var(--warm-gold)" bg="var(--bg-raised)"
                  tasks={daisi.normal} onDone={markDone} onTaskClick={openDetail}
                  defaultOpen={false} limit={4} />
                <Section emoji="🔒" label="Blocked · รอ Lean Canvas" count={daisi.review.length}
                  color="var(--text-3)" bg="var(--bg-raised)"
                  tasks={daisi.review} onDone={markDone} onTaskClick={openDetail}
                  defaultOpen={false} limit={6} />
              </>;
            })()}

            {/* ── OKR ── */}
            {tab === "okr" && (
              <QuickActionsView tasks={data} />
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        style={{
          position: "fixed", bottom: 90, right: 20,
          width: 52, height: 52, borderRadius: "50%",
          background: "var(--amber)", border: "none",
          color: "#000", fontSize: 26, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 24px rgba(255,185,0,0.35)",
          zIndex: 35,
        }}
      >+</button>

      <Nav active={tab} onChange={setTab} />

      {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} onAdd={addTask} />}
      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onDone={id => { markDone(id); setDetailTask(null); }}
        />
      )}
    </main>
  );
}
