"use client";
import { Task, CAT_STYLE, detectCategory } from "./types";

/* ─────────────────────────────────────────────────────────────
   WeekendScheduleView — ตารางชีวิต วันเสาร์–อาทิตย์
   ไม่ใช่ work schedule แต่เป็น personal life + OKR blocks
   อาทิตย์เช้า: โบสถ์เป็นหลัก
   หลักๆ: เคลียงานค้าง, เรียน, side project, personal OKR
───────────────────────────────────────────────────────────── */

const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

function minToTime(m: number) {
  const h   = Math.floor(m / 60);
  const min = m % 60;
  return `${h}:${min.toString().padStart(2, "0")}`;
}

/* ── Personal time block definition ── */
interface PersonalBlock {
  id:       string;
  title:    string;
  sub?:     string;      // รายละเอียดสั้นๆ
  start:    number;      // minutes from midnight
  duration: number;
  emoji:    string;
  color:    string;
  bg:       string;
  fixed?:   boolean;     // true = ไม่ขยับ (เช่น โบสถ์)
  okr?:     boolean;     // true = เชื่อมกับ OKR
}

/* ── Schedule definitions ── */
const SUNDAY_BLOCKS: PersonalBlock[] = [
  {
    id: "church", title: "โบสถ์", sub: "Sunday service",
    start: 8 * 60, duration: 180, emoji: "🙏",
    color: "var(--brand)", bg: "rgba(0,129,255,0.12)", fixed: true,
  },
  {
    id: "sun-rest", title: "พักผ่อน / รับประทานอาหาร", sub: "หลังโบสถ์",
    start: 11 * 60 + 30, duration: 60, emoji: "🍽️",
    color: "var(--cat-friends)", bg: "rgba(127,170,178,0.12)",
  },
  {
    id: "sun-okr-art", title: "Art Direction Study", sub: "OKR — พัฒนาครบวงจร",
    start: 13 * 60, duration: 120, emoji: "🎨",
    color: "var(--cat-design)", bg: "rgba(102,133,204,0.13)", okr: true,
  },
  {
    id: "sun-clear", title: "เคลียงานค้าง", sub: "Optional — ถ้าไม่ได้ไปเที่ยว",
    start: 15 * 60, duration: 120, emoji: "📋",
    color: "var(--brand)", bg: "rgba(0,129,255,0.15)",
  },
  {
    id: "sun-side", title: "Side Project / รายได้เสริม", sub: "OKR — 20k target",
    start: 17 * 60, duration: 90, emoji: "💡",
    color: "var(--brand)", bg: "rgba(223,160,64,0.13)", okr: true,
  },
];

const SATURDAY_BLOCKS: PersonalBlock[] = [
  {
    id: "sat-morning", title: "Morning Routine", sub: "OKR review + planning",
    start: 9 * 60, duration: 60, emoji: "☀️",
    color: "var(--brand)", bg: "rgba(0,129,255,0.10)",
  },
  {
    id: "sat-art", title: "Art Direction Study", sub: "OKR — พัฒนาครบวงจร 3 เดือน",
    start: 10 * 60, duration: 120, emoji: "🎨",
    color: "var(--cat-design)", bg: "rgba(102,133,204,0.13)", okr: true,
  },
  {
    id: "sat-lunch", title: "พักเที่ยง", sub: "",
    start: 12 * 60, duration: 60, emoji: "🍱",
    color: "var(--cat-friends)", bg: "rgba(127,170,178,0.10)",
  },
  {
    id: "sat-side", title: "Side Job / รายได้เสริม", sub: "OKR — 20k target",
    start: 13 * 60, duration: 150, emoji: "💼",
    color: "var(--brand)", bg: "rgba(223,160,64,0.13)", okr: true,
  },
  {
    id: "sat-clear", title: "เคลียงานค้าง / งาน Daisi", sub: "Optional — ถ้ามีงานด่วน",
    start: 15 * 60 + 30, duration: 90, emoji: "📋",
    color: "var(--brand)", bg: "rgba(0,129,255,0.15)",
  },
  {
    id: "sat-learn", title: "เรียน / พัฒนาทักษะ", sub: "Course, workshop, อ่านหนังสือ",
    start: 17 * 60, duration: 90, emoji: "📚",
    color: "var(--cat-holiday)", bg: "rgba(254,244,176,0.10)", okr: true,
  },
];

/* ── Timeline constants ── */
const START_HOUR = 8;
const END_HOUR   = 20;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const TIMELINE_MINS = TOTAL_HOURS * 60;
const TIME_W = 42;

const toFrac = (min: number) => (min - START_HOUR * 60) / TIMELINE_MINS;

interface Props {
  day: "saturday" | "sunday";
  date: Date;
  tasks: Task[];      // งานค้างที่อาจเคลีย
  onTaskClick?: (t: Task) => void;
}

export default function WeekendScheduleView({ day, date, tasks, onTaskClick }: Props) {
  const blocks = day === "sunday" ? SUNDAY_BLOCKS : SATURDAY_BLOCKS;
  const hours  = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  const now    = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isToday = date.toDateString() === now.toDateString();

  /* tasks ที่สามารถเคลียวันนี้ — urgent + soon */
  const clearable = tasks.filter(t => t.due).slice(0, 5);

  const dateStr = `${date.getDate()} ${THAI_MONTHS[date.getMonth()]}`;
  const dayLabel = day === "sunday" ? "อาทิตย์" : "เสาร์";

  return (
    <div style={{ paddingBottom: 8, overflowX: "hidden" }}>

      {/* ── Weekend badge ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, padding: "12px 16px",
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 16,
        borderLeft: "3px solid var(--brand)",
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
            วัน{dayLabel} · {dateStr}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
            {day === "sunday" ? "โบสถ์เช้า · พักผ่อน · เคลียงาน" : "เรียน · Side project · เคลียงาน"}
          </div>
        </div>
        <div style={{
          fontSize: 10, fontWeight: 700, color: "var(--brand)",
          background: "var(--brand-soft)", borderRadius: 8,
          padding: "4px 10px", letterSpacing: "0.08em",
        }}>
          DAY OFF
        </div>
      </div>

      {/* ── OKR reminder strip ── */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 16, overflowX: "auto",
        paddingBottom: 2,
      }}>
        {[
          { label: "Art Direction", sub: "ครบวงจร 3 เดือน", color: "var(--cat-design)" },
          { label: "รายได้เสริม", sub: "20k target",        color: "var(--brand)" },
          { label: "พัฒนาทักษะ", sub: "เรียนรู้ต่อเนื่อง", color: "var(--cat-holiday)" },
        ].map(okr => (
          <div key={okr.label} style={{
            flexShrink: 0,
            padding: "7px 12px",
            background: "var(--bg-card)", border: `1px solid ${okr.color}30`,
            borderLeft: `3px solid ${okr.color}`,
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: okr.color }}>{okr.label}</div>
            <div style={{ fontSize: 10, color: "var(--text-3)" }}>{okr.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Timeline ── */}
      <div style={{
        position: "relative",
        height: "calc(100dvh - 510px)",
        minHeight: 220,
        overflowX: "hidden",
        marginBottom: 16,
      }}>

        {/* Hour lines */}
        {hours.map(h => (
          <div key={h} style={{
            position: "absolute",
            top: `${(((h - START_HOUR) / TOTAL_HOURS) * 100).toFixed(3)}%`,
            left: 0, right: 0,
            display: "flex", alignItems: "flex-start", gap: 8,
          }}>
            <span style={{ fontSize: 10, color: "var(--text-3)", width: TIME_W, flexShrink: 0, paddingTop: 1, textAlign: "right" }}>
              {h}:00
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border-soft)", marginTop: 5 }} />
          </div>
        ))}

        {/* Personal blocks */}
        {blocks.map(block => {
          const topPct    = toFrac(block.start) * 100;
          const heightPct = (block.duration / TIMELINE_MINS) * 100;
          const isCurrent = isToday && block.start <= nowMin && block.start + block.duration > nowMin;

          return (
            <div key={block.id} style={{
              position: "absolute",
              top:    `${topPct.toFixed(3)}%`,
              height: `max(32px, ${heightPct.toFixed(3)}%)`,
              left:   TIME_W + 8,
              right:  0,
              background: isCurrent ? block.bg.replace("0.1", "0.22").replace("0.12", "0.25").replace("0.13", "0.25").replace("0.15", "0.28") : block.bg,
              border:      `1px solid ${block.color}30`,
              borderLeft:  `3px solid ${block.fixed ? block.color : block.color + "80"}`,
              borderRadius: 10,
              padding: "6px 10px",
              overflow: "hidden",
              boxShadow: isCurrent ? `0 0 0 2px ${block.color}40` : "none",
              opacity: 0.9,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 600,
                color: block.color, lineHeight: 1, marginBottom: 2,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span>{minToTime(block.start)}–{minToTime(block.start + block.duration)}</span>
                {block.okr && <span style={{ fontSize: 9, color: block.color, opacity: 0.7, letterSpacing: "0.06em" }}>OKR</span>}
                {block.fixed && <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke={block.color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}><rect x="1.5" y="4" width="6" height="4.5" rx="1"/><path d="M2.5 4V3a2 2 0 0 1 4 0v1"/></svg>}
              </div>
              <div style={{
                fontSize: 12, color: "var(--text-1)", fontWeight: 600,
                lineHeight: 1.3, overflow: "hidden",
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              }}>
                {block.title}
              </div>
              {block.sub && (
                <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {block.sub}
                </div>
              )}
            </div>
          );
        })}

        {/* Now line */}
        {isToday && nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60 && (() => {
          const topPct = toFrac(nowMin) * 100;
          return (
            <div style={{
              position: "absolute",
              top: `${topPct.toFixed(3)}%`,
              left: TIME_W, right: 0,
              display: "flex", alignItems: "center", gap: 4, zIndex: 10,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--brand)", flexShrink: 0 }} />
              <div style={{ flex: 1, height: 1.5, background: "var(--brand)", opacity: 0.7 }} />
            </div>
          );
        })()}
      </div>

      {/* ── งานค้างที่อาจเคลียได้วันนี้ ── */}
      {clearable.length > 0 && (
        <div style={{
          padding: "14px 16px",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderLeft: "3px solid var(--brand)",
          borderRadius: 14, marginBottom: 8,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--brand)", letterSpacing: "0.1em", marginBottom: 12 }}>
            งานที่อาจเคลียได้วันนี้ · {clearable.length} รายการ
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {clearable.map(t => {
              const s = CAT_STYLE[detectCategory(t.title)];
              const today = new Date().toISOString().split("T")[0];
              const diff  = t.due ? Math.ceil((new Date(t.due).getTime() - new Date(today).getTime()) / 86400000) : null;
              const dueColor = diff !== null && diff < 0 ? "var(--red)" : diff === 0 ? "var(--brand)" : "var(--text-3)";
              const dueText  = diff !== null
                ? diff < 0 ? `ค้าง ${Math.abs(diff)} วัน` : diff === 0 ? "วันนี้" : `+${diff} วัน`
                : null;
              return (
                <div key={t.id} onClick={() => onTaskClick?.(t)}
                  style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "var(--text-1)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.title}
                  </span>
                  {dueText && <span style={{ fontSize: 10, color: dueColor, flexShrink: 0, fontWeight: 600 }}>{dueText}</span>}
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>›</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 12, fontStyle: "italic" }}>
            ไม่บังคับ — เคลียถ้าสะดวก ถ้าไปเที่ยวก็ผ่านไปก่อนนะคะ
          </div>
        </div>
      )}

      {/* ── Personal tasks from agents (placeholder for future) ── */}
      <div style={{
        padding: "12px 16px",
        background: "var(--bg-raised)", border: "1px dashed var(--border)",
        borderRadius: 14, marginBottom: 8,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6"/><path d="M8 4.5v2m0 3v2m-3-5h2m3 0h2"/><circle cx="8" cy="8" r="1.5" fill="var(--text-3)" stroke="none"/>
        </svg>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>Personal Tasks จาก AI Agent</div>
          <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>เร็วๆ นี้ — เลขาแพรจะส่งงานส่วนตัวมาได้โดยตรง</div>
        </div>
      </div>

    </div>
  );
}
