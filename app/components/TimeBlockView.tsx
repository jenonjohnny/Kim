"use client";
import { useMemo, useState, useEffect } from "react";
import { Task, TimeBlock, CAT_STYLE, detectCategory, Category } from "./types";

const TIME_W = 42;
const START_HOUR    = 10;
const END_HOUR      = 19;
const WORK_END_HOUR = 19;
const LUNCH_START   = 13 * 60;      // 13:00
const LUNCH_END     = 13 * 60 + 45; // 13:45
const TOTAL_HOURS   = END_HOUR - START_HOUR;
const TIMELINE_MINS = TOTAL_HOURS * 60;

const WORK_AREAS = new Set(["sts", "daisi", "digital"]);

const toFrac = (min: number) => (min - START_HOUR * 60) / TIMELINE_MINS;

const DEEP_WORK_RE = /ci full|ci book|brand guide|brand identity|corporate identity/i;
function isDeepWork(title: string) { return DEEP_WORK_RE.test(title); }

/** ดึงเวลาที่ระบุไว้ตรงๆ จาก due datetime หรือจาก title — คืน minutes from midnight หรือ null */
function getFixedTime(task: Task): number | null {
  // 1. due datetime (Notion ISO เช่น "2026-05-26T14:00:00.000+07:00")
  if (task.due && task.due.includes("T")) {
    const tIdx = task.due.indexOf("T");
    const hh = parseInt(task.due.slice(tIdx + 1, tIdx + 3));
    const mm = parseInt(task.due.slice(tIdx + 4, tIdx + 6));
    if (!isNaN(hh) && !isNaN(mm)) return hh * 60 + mm;
  }
  // 2. เวลาในชื่อ task เช่น "14:00", "10.00", "10:00 น."
  const m1 = task.title.match(/(\d{1,2})[:.]\s*(\d{2})\s*(?:น\.?)?(?:\s|$)/);
  if (m1) {
    const h = parseInt(m1[1]), m = parseInt(m1[2]);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) return h * 60 + m;
  }
  // 3. "บ่าย 2" / "บ่ายสอง"
  const m2 = task.title.match(/บ่าย\s*(\d{1,2})/);
  if (m2) return (parseInt(m2[1]) + 12) * 60;
  return null;
}

function estimateDuration(title: string): number {
  const t = title.toLowerCase();
  if (/one on one|1on1|1:1/.test(t))                                         return 60;
  if (/meeting|ประชุม|present/.test(t))                                       return 60;
  if (/mini ci|ci -|lb ci|sts ci|trs ci/.test(t))                            return 180;
  if (/booth|uniform|hanging|box set/.test(t))                               return 150;
  if (/packaging|dessert|sleeve|food box|artwork|lb -|lb–|life bar/.test(t)) return 120;
  if (/landing page|waitlist|web|website/.test(t))                           return 120;
  if (/รีพอร์ต|ประเมิณ|ออกใบเตือน/.test(t))                                 return 120;
  if (/kpi|รีวิว|review|report|สรุป|recap/.test(t))                          return 90;
  if (/promote|social|post|content|caption|script/.test(t))                 return 90;
  if (/logo|brand|design|ดีไซน์|กราฟ|graphic/.test(t))                      return 90;
  if (/canva|ใส่สี|color|pantone/.test(t))                                   return 60;
  if (/lean canvas|canvas|plan|วางแผน|portfolio/.test(t))                   return 60;
  if (/quick|ด่วน/.test(t))                                                  return 30;
  if (/stripe|สมัคร|admin|api|register/.test(t))                             return 45;
  return 60;
}

/* ── Schedule ── */
function smartSchedule(tasks: Task[], nowMin: number): TimeBlock[] {
  const blocks: TimeBlock[] = [];
  const today     = new Date();
  const isWed     = today.getDay() === 3;
  const isWeekday = today.getDay() >= 1 && today.getDay() <= 5;
  const dayStart  = Math.max(START_HOUR * 60, nowMin);

  // ── Fixed blocks: Lunch + Wednesday Team Lead ──
  blocks.push({ id: "lunch", title: "🍱 พักกลางวัน", start: LUNCH_START, duration: LUNCH_END - LUNCH_START, category: "วันหยุด" });
  if (isWed) {
    blocks.push({ id: "team-lead", title: "Team Lead Weekly", start: 10 * 60 + 30, duration: 60, category: "งาน" });
  }

  function findSlot(duration: number, after: number, maxEnd = END_HOUR * 60): number {
    let cursor = after;
    while (cursor + duration <= maxEnd) {
      const hit = blocks.find(b => cursor < b.start + b.duration + 10 && cursor + duration > b.start - 10);
      if (!hit) return cursor;
      cursor = hit.start + hit.duration + 10;
    }
    return -1;
  }

  // ── Pass 1: Time-anchored tasks (มีเวลาระบุ) → วางตรงเวลานั้นเลย ──
  const anchored: Task[] = [];
  const floating: Task[] = [];
  tasks.forEach(t => {
    if (/สัมภาษณ์/.test(t.title.toLowerCase())) return;
    if (getFixedTime(t) !== null) anchored.push(t);
    else floating.push(t);
  });

  anchored.forEach(t => {
    const fixedStart = getFixedTime(t)!;
    if (fixedStart < START_HOUR * 60 || fixedStart >= END_HOUR * 60) return; // นอกกรอบเวลา
    const dur = estimateDuration(t.title);
    // ถ้าชน block อื่น → เลื่อนออกไปนิดหน่อย แต่ยึดเวลาเป็นหลัก
    const start = blocks.find(b => fixedStart < b.start + b.duration && fixedStart + dur > b.start)
      ? findSlot(dur, fixedStart) // หาช่องใกล้ๆ
      : fixedStart;
    if (start !== -1)
      blocks.push({ id: t.id, title: t.title, start, duration: dur, category: detectCategory(t.title) as Category, taskId: t.id });
  });

  // ── Pass 2: Floating tasks → แยก STS / Side / Personal แล้วหาช่องว่าง ──
  const stsTasks:      Task[] = [];
  const sideTasks:     Task[] = [];
  const personalTasks: Task[] = [];
  floating.forEach(t => {
    const area = t.area ?? "";
    if (area === "sts")                              stsTasks.push(t);
    else if (area === "daisi" || area === "digital") sideTasks.push(t);
    else                                             personalTasks.push(t);
  });

  // Deep Work (CI Full) → block ใหญ่ก่อนพัก หรือหลังพัก
  const deepTasks      = stsTasks.filter(t => isDeepWork(t.title));
  const normalStsTasks = stsTasks.filter(t => !isDeepWork(t.title));

  let stsCursor = dayStart;
  deepTasks.forEach(t => {
    const slot = findSlot(240, stsCursor, LUNCH_START) !== -1
      ? findSlot(240, stsCursor, LUNCH_START)
      : findSlot(240, LUNCH_END);
    if (slot !== -1) {
      blocks.push({ id: t.id, title: t.title, start: slot, duration: 240, category: detectCategory(t.title) as Category, taskId: t.id });
      stsCursor = slot + 250;
    }
  });

  if (isWeekday) {
    // STS งานอื่น → ช่องว่างที่เหลือ
    const heavy = normalStsTasks.filter(t => /packaging|dessert|sleeve|food box|artwork|lb -|life bar/.test(t.title.toLowerCase()));
    const light = normalStsTasks.filter(t => !heavy.includes(t));
    [...heavy, ...light].forEach(t => {
      const dur  = estimateDuration(t.title);
      const slot = findSlot(dur, stsCursor, END_HOUR * 60);
      if (slot === -1) return;
      blocks.push({ id: t.id, title: t.title, start: slot, duration: dur, category: detectCategory(t.title) as Category, taskId: t.id });
      stsCursor = slot + dur + 10;
    });

    // Side + Personal → หลัง 16:00
    let sideCursor = Math.max(16 * 60, stsCursor);
    [...sideTasks, ...personalTasks].forEach(t => {
      const dur  = estimateDuration(t.title);
      const slot = findSlot(dur, sideCursor, END_HOUR * 60);
      if (slot === -1) return;
      blocks.push({ id: t.id, title: t.title, start: slot, duration: dur, category: detectCategory(t.title) as Category, taskId: t.id });
      sideCursor = slot + dur + 10;
    });

  } else {
    // เสาร์-อาทิตย์
    const weekend = [...sideTasks, ...personalTasks, ...normalStsTasks];
    let cursor = stsCursor;
    weekend.forEach(t => {
      const dur  = estimateDuration(t.title);
      const slot = findSlot(dur, cursor, END_HOUR * 60);
      if (slot === -1) return;
      blocks.push({ id: t.id, title: t.title, start: slot, duration: dur, category: detectCategory(t.title) as Category, taskId: t.id });
      cursor = slot + dur + 10;
    });
  }

  return blocks.sort((a, b) => a.start - b.start);
}

function minToTime(m: number) {
  const h   = Math.floor(m / 60);
  const min = m % 60;
  return `${h}:${min.toString().padStart(2, "0")}`;
}

function minsLeft(endMin: number, nowMin: number) {
  const diff = endMin - nowMin;
  if (diff <= 0) return null;
  if (diff < 60) return `เหลือ ${diff} นาที`;
  const h = Math.floor(diff / 60), m = diff % 60;
  return `เหลือ ${h} ชม.${m > 0 ? ` ${m} นาที` : ""}`;
}

interface Props {
  urgent: Task[];
  soon: Task[];
  normal: Task[];
  events?: Task[];  // Meeting/Event (status: Note + datetime)
  view: "today" | "tomorrow";
  onTaskClick?: (task: Task & { startMin: number; endMin: number }) => void;
}

export default function TimeBlockView({ urgent, soon, normal, events = [], view, onTaskClick }: Props) {
  // ── Real-time clock — refresh ทุก 1 นาที ──
  const [nowMin, setNowMin] = useState(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setNowMin(n.getHours() * 60 + n.getMinutes());
    };
    // sync ให้ตรงต้นนาที
    const msToNextMin = 60000 - (Date.now() % 60000);
    const timeout = setTimeout(() => {
      tick();
      const interval = setInterval(tick, 60000);
      return () => clearInterval(interval);
    }, msToNextMin);
    return () => clearTimeout(timeout);
  }, []);

  const isToday = view === "today";

  // ── Schedule: today ใช้ nowMin เป็น cursor เริ่มต้น, tomorrow เริ่ม 9:00 ──
  const scheduleStart = isToday ? nowMin : START_HOUR * 60;

  // กรอง events ตามวัน (today/tomorrow)
  const targetDate = isToday
    ? new Date().toISOString().split("T")[0]
    : new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const todayEvents = events.filter(e => e.due?.startsWith(targetDate));

  const blocks = useMemo(
    () => smartSchedule([...todayEvents, ...urgent, ...soon, ...normal.slice(0, 12)], scheduleStart),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todayEvents, urgent, soon, normal, isToday, Math.floor(scheduleStart / 15)]
  );

  const hours      = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);
  const taskBlocks = blocks.filter(b => b.taskId);

  // ── Summary cards ──
  let leftBlock: TimeBlock | null | "gap" = null;
  let rightBlock: TimeBlock | null        = null;

  if (isToday) {
    const cur = blocks.find(b => b.start <= nowMin && b.start + b.duration > nowMin);
    leftBlock  = cur ?? "gap";
    rightBlock = blocks.find(b => b.start > nowMin) ?? null;
  } else {
    leftBlock  = blocks[0] ?? null;
    rightBlock = blocks[1] ?? null;
  }

  const remainingCount = isToday
    ? blocks.filter(b => b.taskId && b.start + b.duration > nowMin).length
    : taskBlocks.length;

  if (blocks.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
        <div style={{ color: "var(--text-2)", fontSize: 15, fontWeight: 600 }}>
          {isToday ? "ไม่มีงานเหลือวันนี้แล้วค่ะ" : "พรุ่งนี้ยังไม่มีงานค่ะ"}
        </div>
        <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 6 }}>🌿</div>
      </div>
    );
  }

  const renderSummaryCard = (block: TimeBlock | "gap" | null, side: "left" | "right") => {
    if (block === "gap") {
      return (
        <div style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, color: "var(--text-3)", fontWeight: 700, marginBottom: 4 }}>ตอนนี้</div>
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>ช่วงว่าง 🌿</div>
        </div>
      );
    }
    if (!block) {
      return (
        <div style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, color: "var(--text-3)", fontWeight: 700, marginBottom: 4 }}>
            {side === "left" ? (isToday ? "ตอนนี้" : "งานแรก") : "ถัดไป"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>หมดงานแล้ว 🎉</div>
        </div>
      );
    }

    const s      = CAT_STYLE[block.category];
    const isLeft = side === "left";
    const isActive = isToday && isLeft;
    const label  = isLeft ? (isToday ? "ตอนนี้" : "งานแรก") : "ถัดไป";

    return (
      <div
        onClick={() => block.taskId && onTaskClick?.({
          id: block.taskId, title: block.title, category: block.category,
          startMin: block.start, endMin: block.start + block.duration,
          due: null, urgent: null, priority: null, status: "",
        })}
        style={{
          flex: 1,
          background: isActive ? s.bg : "var(--bg-card)",
          border: `1.5px solid ${isActive ? s.color + "50" : "var(--border)"}`,
          borderRadius: 16, padding: "12px 14px",
          cursor: block.taskId ? "pointer" : "default",
        }}
      >
        <div style={{ fontSize: 9, color: isActive ? s.color : "var(--text-3)", fontWeight: 700, marginBottom: 4, letterSpacing: "0.08em" }}>
          {isActive ? "● " : ""}{label}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-1)", fontWeight: 600, lineHeight: 1.3 }}>
          {block.title}
        </div>
        <div style={{ fontSize: 11, color: s.color, marginTop: 5 }}>
          {isActive
            ? <>ถึง {minToTime(block.start + block.duration)} น.
                {minsLeft(block.start + block.duration, nowMin) &&
                  <span style={{ color: "var(--text-3)", marginLeft: 4 }}>
                    · {minsLeft(block.start + block.duration, nowMin)}
                  </span>}
              </>
            : <>{minToTime(block.start)} น. · {s.emoji} {block.category}</>
          }
        </div>
      </div>
    );
  };

  return (
    <div style={{ paddingBottom: 8, overflowX: "hidden" }}>

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {renderSummaryCard(leftBlock, "left")}
        {renderSummaryCard(rightBlock, "right")}
      </div>

      {/* Context line */}
      <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 10, paddingLeft: 4, display: "flex", justifyContent: "space-between" }}>
        <span>
          {isToday
            ? remainingCount > 0
              ? `${remainingCount} งานเหลือวันนี้ · เริ่มจาก ${minToTime(scheduleStart)} น.`
              : "หมดงานวันนี้แล้ว 🎉"
            : `${taskBlocks.length} งาน · พรุ่งนี้`}
        </span>
        <span style={{ color: "var(--text-3)" }}>กดบล็อกเพื่อดูรายละเอียด</span>
      </div>

      {/* Timeline */}
      <div style={{
        position: "relative",
        height: "calc(100dvh - 510px)",
        minHeight: 200,
        overflowX: "hidden",
        marginBottom: 8,
      }}>
        {/* Hour lines */}
        {hours.map(h => {
          const topPct = ((h - START_HOUR) / TOTAL_HOURS) * 100;
          const isPast = isToday && h * 60 < nowMin;
          return (
            <div key={h} style={{
              position: "absolute",
              top: `${topPct.toFixed(3)}%`,
              left: 0, right: 0,
              display: "flex", alignItems: "flex-start", gap: 8,
            }}>
              <span style={{
                fontSize: 10,
                color: isPast ? "var(--text-3)" : "var(--text-3)",
                opacity: isPast ? 0.4 : 1,
                width: TIME_W, flexShrink: 0, paddingTop: 1, textAlign: "right",
              }}>
                {h}:00
              </span>
              <div style={{
                flex: 1, height: 1,
                background: isPast ? "var(--border-soft)" : "var(--border-soft)",
                opacity: isPast ? 0.4 : 1,
                marginTop: 5,
              }} />
            </div>
          );
        })}

        {/* Blocks */}
        {blocks.map(block => {
          const isFixed    = block.id === "team-lead";
          const s          = CAT_STYLE[block.category];
          const topPct     = toFrac(block.start) * 100;
          const heightPct  = (block.duration / TIMELINE_MINS) * 100;
          const isCurrent  = isToday && block.start <= nowMin && block.start + block.duration > nowMin;
          const isDone     = isToday && block.start + block.duration <= nowMin;
          const isClickable = !!block.taskId && !isFixed;

          return (
            <div
              key={block.id}
              onClick={() => isClickable && onTaskClick?.({
                id: block.taskId!, title: block.title, category: block.category,
                startMin: block.start, endMin: block.start + block.duration,
                due: null, urgent: null, priority: null, status: "",
              })}
              style={{
                position: "absolute",
                top:    `${topPct.toFixed(3)}%`,
                height: `max(28px, ${heightPct.toFixed(3)}%)`,
                left:   TIME_W + 8,
                right:  0,
                background: isDone
                  ? "var(--bg-raised)"
                  : isFixed
                    ? "repeating-linear-gradient(135deg, rgba(51,92,103,0.08) 0px, rgba(51,92,103,0.08) 4px, transparent 4px, transparent 10px)"
                    : s.bg,
                border:     `1px solid ${isDone ? "var(--border-soft)" : isFixed ? "var(--border)" : s.color + "30"}`,
                borderLeft: `3px solid ${isDone ? "var(--border)" : isFixed ? "var(--brand)" : isCurrent ? s.color : s.color + "90"}`,
                borderRadius: 10,
                padding:    "6px 10px",
                overflow:   "hidden",
                boxShadow:  isCurrent ? `0 0 0 2px ${s.color}50, 0 2px 12px ${s.color}20` : "none",
                cursor:     isClickable && !isDone ? "pointer" : "default",
                opacity:    isDone ? 0.35 : isFixed ? 0.6 : 1,
                transition: "opacity 0.15s",
              }}
            >
              <div style={{
                fontSize: 10, fontWeight: 600,
                color: isDone ? "var(--text-3)" : isFixed ? "var(--brand)" : s.color,
                lineHeight: 1, marginBottom: 2,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span>{minToTime(block.start)}–{minToTime(block.start + block.duration)}</span>
                {isDone && <span style={{ fontSize: 9, opacity: 0.6 }}>ผ่านไปแล้ว</span>}
                {isClickable && !isDone && <span style={{ fontSize: 9, color: s.color, opacity: 0.6 }}>↗</span>}
              </div>
              <div style={{
                fontSize: 12,
                color: isDone ? "var(--text-3)" : isFixed ? "var(--text-3)" : "var(--text-1)",
                fontWeight: 600, lineHeight: 1.3,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}>
                {block.title}
              </div>
            </div>
          );
        })}

        {/* Now line */}
        {isToday && nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60 && (() => {
          const topPct = toFrac(nowMin) * 100;
          return (
            <div style={{
              position: "absolute",
              top:  `${topPct.toFixed(3)}%`,
              left: TIME_W, right: 0,
              display: "flex", alignItems: "center", gap: 4, zIndex: 10,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--brand)", flexShrink: 0 }} />
              <div style={{ flex: 1, height: 1.5, background: "var(--brand)", opacity: 0.7 }} />
            </div>
          );
        })()}

        {/* End-of-schedule marker */}
        {(() => {
          const remaining = blocks.filter(b => !isToday || b.start + b.duration > nowMin);
          if (remaining.length === 0) return null;
          const lastBlock = [...remaining].sort((a, b) => (b.start + b.duration) - (a.start + a.duration))[0];
          const endMin = lastBlock.start + lastBlock.duration;
          if (endMin >= END_HOUR * 60) return null;
          const topPct = toFrac(endMin) * 100;
          return (
            <div style={{ position: "absolute", top: `${topPct.toFixed(3)}%`, left: TIME_W + 8, right: 0, zIndex: 5 }}>
              <div style={{
                marginTop: 10, padding: "6px 12px",
                background: "var(--bg-raised)",
                border: "1px dashed var(--border)",
                borderRadius: 8,
                fontSize: 11, color: "var(--text-3)",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span>✓</span>
                <span>เสร็จงานตามแผน {minToTime(endMin)} น.</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
