"use client";
import { useMemo } from "react";
import { Task, TimeBlock, CAT_STYLE, detectCategory, Category } from "./types";

const TIME_W = 42;     // width of the time-label column (px)
const START_HOUR = 9;
const END_HOUR   = 20;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const TIMELINE_MINS = TOTAL_HOURS * 60; // 540 min

/* ── Convert minutes-from-midnight → fraction of timeline (0‒1) ── */
const toFrac = (min: number) => (min - START_HOUR * 60) / TIMELINE_MINS;

function estimateDuration(title: string): number {
  const t = title.toLowerCase();

  // ── Meetings & calls (fixed) ──
  if (/one on one|1on1|1:1/.test(t))                                         return 60;
  if (/meeting|ประชุม|present/.test(t))                                       return 60;

  // ── Heavy production — booth / packaging / physical design ──
  // งานออกแบบสิ่งพิมพ์หรือบูท ต้องใช้เวลา 2–3 ชั่วโมง
  if (/booth|lb -|lb–|life bar|uniform|hanging|box set/.test(t))             return 150;
  if (/packaging|dessert|sleeve|food box|artwork/.test(t))                    return 120;

  // ── Documentation & reporting ──
  if (/รีพอร์ต|ประเมิณ|ออกใบเตือน/.test(t))                                  return 120;
  if (/kpi|รีวิว|review|report|สรุป|recap/.test(t))                           return 90;

  // ── Content & social ──
  if (/promote|social|post|content|caption|script/.test(t))                  return 90;

  // ── Design & visual (mid-weight) ──
  if (/canva|ใส่สี|color|pantone/.test(t))                                    return 60;
  if (/design|ดีไซน์|กราฟ|graphic|logo|brand/.test(t))                       return 90;

  // ── Admin & quick tasks ──
  if (/quick|ด่วน/.test(t))                                                   return 30;
  if (/stripe|สมัคร|admin|api|register/.test(t))                              return 45;

  return 90; // default ↑ 60→90 — งานทั่วไปใช้เวลามากกว่า 1 ชั่วโมง
}

function smartSchedule(tasks: Task[]): TimeBlock[] {
  const blocks: TimeBlock[] = [];
  // Team Lead Weekly — recurring block, ทุกวันพุธ 10:30
  blocks.push({ id: "team-lead", title: "Team Lead Weekly", start: 10 * 60 + 30, duration: 60, category: "งาน" });

  function findSlot(duration: number, after: number): number {
    let cursor = after;
    while (cursor + duration <= END_HOUR * 60) {
      const hit = blocks.find(b =>
        cursor < b.start + b.duration + 10 && cursor + duration > b.start - 10
      );
      if (!hit) return cursor;
      cursor = hit.start + hit.duration + 10; // 10-min buffer ระหว่าง task
    }
    return -1;
  }

  const meetings: Task[] = [];
  const rest: Task[]     = [];
  tasks.forEach(t => {
    const tl = t.title.toLowerCase();
    if (/สัมภาษณ์/.test(tl)) return;
    if (/one on one|1on1|meeting|ประชุม/.test(tl)) meetings.push(t);
    else rest.push(t);
  });

  // Meetings — schedule ในช่วงบ่าย (หลังเที่ยง), 1:1 ตอน 16:00
  meetings.forEach(t => {
    const dur   = estimateDuration(t.title);
    const start = /one on one/i.test(t.title) ? 16 * 60 : findSlot(dur, 13 * 60);
    if (start !== -1 && start < END_HOUR * 60)
      blocks.push({ id: t.id, title: t.title, start, duration: dur, category: detectCategory(t.title) as Category, taskId: t.id });
  });

  // แยก task ตามน้ำหนัก: งานหนัก → กลาง → เบา
  const heavyTasks  = rest.filter(t => /booth|lb -|lb–|life bar|uniform|hanging|box set|packaging|dessert|sleeve/.test(t.title.toLowerCase()));
  const docTasks    = rest.filter(t => !heavyTasks.includes(t) && /รีพอร์ต|สรุป|recap|report|kpi|ประเมิณ|website project/.test(t.title.toLowerCase()));
  const lightTasks  = rest.filter(t => !heavyTasks.includes(t) && !docTasks.includes(t));

  // เริ่มจาก 9:00 เพื่อให้มีเวลาก่อน Team Lead
  let cursor = START_HOUR * 60; // 09:00
  [...heavyTasks, ...docTasks, ...lightTasks].forEach(t => {
    const dur  = estimateDuration(t.title);
    const slot = findSlot(dur, cursor);
    if (slot === -1 || slot >= END_HOUR * 60) return;
    blocks.push({ id: t.id, title: t.title, start: slot, duration: dur, category: detectCategory(t.title) as Category, taskId: t.id });
    cursor = slot + dur + 10;
  });

  return blocks.sort((a, b) => a.start - b.start);
}

function minToTime(m: number) {
  const h   = Math.floor(m / 60);
  const min = m % 60;
  return `${h}:${min.toString().padStart(2, "0")}`;
}

function minsLeft(endMin: number) {
  const now    = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const diff   = endMin - nowMin;
  if (diff <= 0) return null;
  if (diff < 60) return `เหลือ ${diff} นาที`;
  const h = Math.floor(diff / 60), m = diff % 60;
  return `เหลือ ${h} ชม.${m > 0 ? ` ${m} นาที` : ""}`;
}

interface Props {
  urgent: Task[];
  soon: Task[];
  normal: Task[];
  view: "today" | "tomorrow";
  onTaskClick?: (task: Task & { startMin: number; endMin: number }) => void;
}

export default function TimeBlockView({ urgent, soon, view, onTaskClick }: Props) {
  const now    = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isToday = view === "today";

  const blocks = useMemo(
    () => smartSchedule([...urgent, ...soon.slice(0, 6)]),
    [urgent, soon]
  );

  const hours      = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);
  const taskBlocks = blocks.filter(b => b.taskId);

  /* ── Summary cards — always show 2 cards so layout is equal ── */
  let leftBlock: TimeBlock | null | "gap" = null;
  let rightBlock: TimeBlock | null        = null;

  if (isToday) {
    const cur = blocks.find(b => b.start <= nowMin && b.start + b.duration > nowMin);
    leftBlock  = cur ?? "gap";
    rightBlock = blocks.find(b => b.start > nowMin) ?? null;
  } else {
    // tomorrow: first block on left, second block on right
    leftBlock  = blocks[0] ?? null;
    rightBlock = blocks[1] ?? null;
  }

  const showSummary = blocks.length > 0;

  if (blocks.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
        <div style={{ color: "var(--text-2)", fontSize: 15, fontWeight: 600 }}>ไม่มีงานค้างค่ะ</div>
        <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 6 }}>วันนี้ว่างทั้งวัน 🌿</div>
      </div>
    );
  }

  /* ── Render a summary card ── */
  const renderSummaryCard = (
    block: TimeBlock | "gap" | null,
    side: "left" | "right"
  ) => {
    if (block === "gap") {
      return (
        <div style={{
          flex: 1, background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 16, padding: "12px 14px",
        }}>
          <div style={{ fontSize: 9, color: "var(--text-3)", fontWeight: 700, marginBottom: 4 }}>ตอนนี้</div>
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>ช่วงว่าง 🌿</div>
        </div>
      );
    }
    if (!block) {
      return (
        <div style={{
          flex: 1, background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 16, padding: "12px 14px",
        }}>
          <div style={{ fontSize: 9, color: "var(--text-3)", fontWeight: 700, marginBottom: 4 }}>
            {side === "left" ? (isToday ? "ตอนนี้" : "งานแรก") : (isToday ? "ถัดไป" : "ถัดไป")}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>ยังไม่มีงาน 🌿</div>
        </div>
      );
    }

    const s       = CAT_STYLE[block.category];
    const isLeft  = side === "left";
    const isActive = isToday && isLeft;
    const label   = isLeft
      ? (isToday ? "ตอนนี้" : "งานแรก")
      : (isToday ? "ถัดไป" : "ถัดไป");

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
            ? <>ถึง {minToTime(block.start + block.duration)} น.{minsLeft(block.start + block.duration) && <span style={{ color: "var(--text-3)", marginLeft: 4 }}>· {minsLeft(block.start + block.duration)}</span>}</>
            : <>{minToTime(block.start)} น. · {s.emoji} {block.category}</>
          }
        </div>
      </div>
    );
  };

  return (
    <div style={{ paddingBottom: 8, overflowX: "hidden" }}>

      {/* Summary cards — always 2, equal layout for both today and tomorrow */}
      {showSummary && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {renderSummaryCard(leftBlock, "left")}
          {renderSummaryCard(rightBlock, "right")}
        </div>
      )}

      {/* Task count */}
      {taskBlocks.length > 0 && (
        <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 10, paddingLeft: 4 }}>
          {taskBlocks.length} งาน · กดบล็อกเพื่อดูรายละเอียด
        </div>
      )}

      {/* ── Timeline — height fills available space via CSS calc ──
          overhead: header(130) + content-pad(96) + PageLabel(50) + day-toggle(68) + summary(108) + task-count(24) + sync(34) ≈ 510px
      ── */}
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
          return (
            <div key={h} style={{
              position: "absolute",
              top: `${topPct.toFixed(3)}%`,
              left: 0, right: 0,
              display: "flex", alignItems: "flex-start", gap: 8,
            }}>
              <span style={{ fontSize: 10, color: "var(--text-3)", width: TIME_W, flexShrink: 0, paddingTop: 1, textAlign: "right" }}>
                {h}:00
              </span>
              <div style={{ flex: 1, height: 1, background: "var(--border-soft)", marginTop: 5 }} />
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
                background: isFixed
                  ? "repeating-linear-gradient(135deg, rgba(51,92,103,0.08) 0px, rgba(51,92,103,0.08) 4px, transparent 4px, transparent 10px)"
                  : s.bg,
                border:     `1px solid ${isFixed ? "var(--border)" : s.color + "30"}`,
                borderLeft: `3px solid ${isFixed ? "var(--steel-teal)" : (isCurrent ? s.color : s.color + "90")}`,
                borderRadius: 10,
                padding:    "6px 10px",
                overflow:   "hidden",
                boxShadow:  isCurrent ? `0 0 0 2px ${s.color}50, 0 2px 12px ${s.color}20` : "none",
                cursor:     isClickable ? "pointer" : "default",
                opacity:    isFixed ? 0.6 : (isCurrent ? 1 : 0.85),
                transition: "opacity 0.15s",
              }}
            >
              <div style={{
                fontSize: 10, fontWeight: 600,
                color: isFixed ? "var(--steel-teal)" : s.color,
                lineHeight: 1, marginBottom: 2,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span>{minToTime(block.start)}–{minToTime(block.start + block.duration)}</span>
                {isClickable && <span style={{ fontSize: 9, color: s.color, opacity: 0.6 }}>↗</span>}
              </div>
              <div style={{
                fontSize: 12,
                color: isFixed ? "var(--text-3)" : "var(--text-1)",
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

        {/* Now line — วันนี้เท่านั้น */}
        {isToday && nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60 && (() => {
          const topPct = toFrac(nowMin) * 100;
          return (
            <div style={{
              position: "absolute",
              top:  `${topPct.toFixed(3)}%`,
              left: TIME_W, right: 0,
              display: "flex", alignItems: "center", gap: 4, zIndex: 10,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--amber)", flexShrink: 0 }} />
              <div style={{ flex: 1, height: 1.5, background: "var(--amber)", opacity: 0.7 }} />
            </div>
          );
        })()}

        {/* End-of-schedule marker — หลัง task สุดท้าย */}
        {(() => {
          const lastBlock = [...blocks].sort((a, b) => (b.start + b.duration) - (a.start + a.duration))[0];
          if (!lastBlock) return null;
          const endMin = lastBlock.start + lastBlock.duration;
          if (endMin >= END_HOUR * 60) return null; // ถ้า task เต็มวันไม่ต้องแสดง
          const topPct = toFrac(endMin) * 100;
          return (
            <div style={{
              position: "absolute",
              top:  `${topPct.toFixed(3)}%`,
              left: TIME_W + 8, right: 0,
              zIndex: 5,
            }}>
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
