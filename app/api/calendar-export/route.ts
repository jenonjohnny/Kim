import { NextResponse } from "next/server";

// สร้าง .ics file สำหรับ import ใส่ Google Calendar
function toICSDate(dateStr: string, timeMin: number, offsetHours = 7) {
  // timeMin = minutes from midnight (local BKK time)
  const [y, m, d] = dateStr.split("-").map(Number);
  const totalMin = timeMin - offsetHours * 60; // convert to UTC
  let h = Math.floor(totalMin / 60);
  let min = totalMin % 60;
  let day = d, month = m, year = y;

  if (h < 0) { h += 24; day -= 1; }
  if (h >= 24) { h -= 24; day += 1; }

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}${pad(month)}${pad(day)}T${pad(h)}${pad(min)}00Z`;
}

function estimateDuration(title: string): number {
  const t = title.toLowerCase();
  if (/one on one|1on1|1:1/.test(t))              return 60;
  if (/meeting|ประชุม|present/.test(t))             return 60;
  if (/รีพอร์ต|ประเมิณ|ออกใบเตือน/.test(t))        return 90;
  if (/kpi|รีวิว|review|report|สรุป|recap/.test(t)) return 75;
  if (/pantone|canva|ใส่สี|quick/.test(t))          return 30;
  if (/booth|packaging|lb -|life bar|uniform/.test(t)) return 90;
  if (/promote|social|post|content/.test(t))        return 45;
  if (/stripe|สมัคร|admin|api/.test(t))             return 30;
  return 60;
}

interface Block {
  title: string;
  start: number; // minutes from midnight
  duration: number;
  isBreak: boolean;
}

function smartSchedule(tasks: { title: string; due: string | null }[]): Block[] {
  const blocks: Block[] = [];

  // Fixed breaks
  blocks.push({ title: "พักเบรก ☕",    start: 11 * 60 + 30, duration: 15, isBreak: true });
  blocks.push({ title: "พักกลางวัน 🍱", start: 12 * 60 + 30, duration: 60, isBreak: true });
  blocks.push({ title: "พักเบรก 🧃",   start: 15 * 60 + 30, duration: 15, isBreak: true });

  function findSlot(duration: number, after: number): number {
    let cursor = after;
    while (cursor + duration <= 19 * 60) {
      const conflict = blocks.find(b =>
        cursor < b.start + b.duration + 10 && cursor + duration > b.start - 10
      );
      if (!conflict) return cursor;
      cursor = conflict.start + conflict.duration + 10;
    }
    return -1;
  }

  // เช้า: doc/HR tasks, บ่าย: design/packaging
  const morning: typeof tasks = [];
  const afternoon: typeof tasks = [];
  tasks.forEach(t => {
    const tl = t.title.toLowerCase();
    if (/รีพอร์ต|สรุป|recap|report|kpi|ประเมิณ|stripe|สมัคร|meeting|one on|ประชุม/.test(tl))
      morning.push(t);
    else afternoon.push(t);
  });

  let mCursor = 10 * 60;
  morning.forEach(t => {
    const dur = estimateDuration(t.title);
    const slot = findSlot(dur, mCursor);
    if (slot !== -1 && slot < 19 * 60) {
      blocks.push({ title: t.title, start: slot, duration: dur, isBreak: false });
      mCursor = slot + dur + 10;
    }
  });

  let aCursor = 13 * 60 + 30;
  afternoon.forEach(t => {
    const dur = estimateDuration(t.title);
    const slot = findSlot(dur, aCursor);
    if (slot !== -1 && slot < 19 * 60) {
      blocks.push({ title: t.title, start: slot, duration: dur, isBreak: false });
      aCursor = slot + dur + 10;
    }
  });

  return blocks.sort((a, b) => a.start - b.start);
}

export async function GET() {
  const TOKEN = process.env.NOTION_TOKEN!;
  const DB = process.env.NOTION_TASKS_DB!;
  const today = new Date().toISOString().split("T")[0];
  const in3days = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];

  const res = await fetch(`https://api.notion.com/v1/databases/${DB}/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
    body: JSON.stringify({
      page_size: 50,
      filter: { and: [
        { property: "Status", status: { does_not_equal: "Done" } },
        { property: "Status", status: { does_not_equal: "On Hold" } },
        { property: "Projects", relation: { contains: "2b32ffbd-a6db-8083-be6a-cdaa8d01c9fc" } },
        { property: "Due Date", date: { on_or_before: in3days } },
      ]},
      sorts: [{ property: "Due Date", direction: "ascending" }],
    }),
  });

  const data = await res.json();
  const tasks = (data.results || []).map((p: any) => ({
    title: p.properties.Name?.title?.map((t: any) => t.plain_text).join("") || "",
    due: p.properties["Due Date"]?.date?.start || null,
  })).filter((t: any) => t.title);

  const blocks = smartSchedule(tasks);
  const todayStr = today; // YYYY-MM-DD

  const uid = () => Math.random().toString(36).slice(2) + "@daisi.design";
  const now = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";

  const events = blocks.map(b => {
    const dtstart = toICSDate(todayStr, b.start);
    const dtend   = toICSDate(todayStr, b.start + b.duration);
    const desc = b.isBreak ? "พักผ่อน" : "จัดโดยเลขาคิม · Daisi Design OS";
    return [
      "BEGIN:VEVENT",
      `UID:${uid()}`,
      `DTSTAMP:${now}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${b.title}`,
      `DESCRIPTION:${desc}`,
      `CATEGORIES:${b.isBreak ? "พัก" : "งาน"}`,
      "END:VEVENT",
    ].join("\r\n");
  }).join("\r\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kim · Daisi Design OS//TH",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:คิม · ตารางวันนี้`,
    "X-WR-TIMEZONE:Asia/Bangkok",
    events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="kim-schedule-${today}.ics"`,
    },
  });
}
