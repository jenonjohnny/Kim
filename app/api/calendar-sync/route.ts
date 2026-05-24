import { NextResponse } from "next/server";
import { syncEventsToCalendar, CalEvent } from "@/app/lib/google-calendar";

const TOKEN = process.env.NOTION_TOKEN!;
const DB    = process.env.NOTION_TASKS_DB!;

function estimateDuration(title: string): number {
  const t = title.toLowerCase();
  if (/one on one|1on1|1:1/.test(t))                              return 60;
  if (/meeting|ประชุม|present/.test(t))                            return 60;
  if (/รีพอร์ต|ประเมิณ|ออกใบเตือน/.test(t))                       return 90;
  if (/kpi|รีวิว|review|report|สรุป|recap/.test(t))                return 75;
  if (/pantone|canva|ใส่สี|quick/.test(t))                         return 30;
  if (/booth|packaging|lb -|life bar|uniform|hanging/.test(t))     return 90;
  if (/promote|social|post|content/.test(t))                       return 45;
  if (/stripe|สมัคร|admin|api/.test(t))                            return 30;
  return 60;
}

interface Block { title: string; start: number; duration: number; isBreak: boolean }

function buildSchedule(tasks: { title: string }[]): Block[] {
  const blocks: Block[] = [];

  // Detect interview end time to adjust lunch if needed
  const interviewTask = tasks.find(t => /สัมภาษณ์/.test(t.title));
  const lunchStart = interviewTask ? 13 * 60 : 12 * 60 + 30;  // push lunch to 13:00 if interview at 12

  // Fixed breaks — short walking breaks (matches TimeBlockView)
  blocks.push({ title: "พักกลางวัน 🍱",          start: lunchStart, duration: 45, isBreak: true });
  blocks.push({ title: "🚶 ลุกเดิน พักสายตา",    start: 15 * 60 + 30, duration: 10, isBreak: true });
  blocks.push({ title: "🚶 ลุกเดิน พักสายตา",    start: 17 * 60 + 15, duration: 10, isBreak: true });

  function findSlot(dur: number, after: number) {
    let c = after;
    while (c + dur <= 19 * 60) {
      const hit = blocks.find(b => c < b.start + b.duration + 5 && c + dur > b.start - 5);
      if (!hit) return c;
      c = hit.start + hit.duration + 5;
    }
    return -1;
  }

  // Separate meetings and other tasks
  // - สัมภาษณ์ + meeting ที่มีเวลาในชื่อ → user มีใน calendar แล้ว ไม่สร้างซ้ำ
  // - One on One → คิมจัดเอง fixed 16:00
  // - meeting ทั่วไป → หา slot
  const meetings: typeof tasks = [];
  const rest: typeof tasks = [];
  tasks.forEach(t => {
    const tl = t.title.toLowerCase();
    const hasTime = /\d{1,2}:\d{2}/.test(t.title);
    if (/สัมภาษณ์/.test(tl)) return;               // user มี event เอง
    if (/meeting|ประชุม/.test(tl) && hasTime) return; // มีเวลาระบุ = user จัดเองแล้ว
    if (/one on one|1on1|meeting|ประชุม/.test(tl)) meetings.push(t);
    else rest.push(t);
  });

  // Place meetings — One on One fixed 16:00, others find slot
  meetings.forEach(t => {
    const isOneOnOne = /one on one/i.test(t.title);
    const dur = estimateDuration(t.title);
    const start = isOneOnOne ? 16 * 60 : findSlot(dur, 13 * 60 + 30);
    if (start !== -1 && start < 19 * 60) blocks.push({ title: t.title, start, duration: dur, isBreak: false });
  });

  // Other tasks — booth/LB tasks FIRST (urgent production), then doc, then rest
  const boothTasks = rest.filter(t => /booth|packaging|lb -|life bar|uniform|hanging|dessert|sleeve|food|box set/.test(t.title.toLowerCase()));
  const docTasks   = rest.filter(t => !boothTasks.includes(t) && /รีพอร์ต|สรุป|recap|report|kpi|ประเมิณ|stripe|สมัคร/.test(t.title.toLowerCase()));
  const designTasks = rest.filter(t => !boothTasks.includes(t) && !docTasks.includes(t));

  let cursor = 12 * 60 + 30;
  [...boothTasks, ...docTasks, ...designTasks].forEach(t => {
    const dur = estimateDuration(t.title);
    const slot = findSlot(dur, cursor);
    if (slot !== -1 && slot < 19 * 60) {
      blocks.push({ title: t.title, start: slot, duration: dur, isBreak: false });
      cursor = slot + dur + 10;
    }
  });

  return blocks.sort((a, b) => a.start - b.start);
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    return NextResponse.json({ error: "Google not connected yet" }, { status: 503 });
  }

  // Allow ?date=YYYY-MM-DD to sync a specific day (default = today)
  const urlDate = new URL(req.url).searchParams.get("date");
  const today = urlDate || new Date().toISOString().split("T")[0];

  const res = await fetch(`https://api.notion.com/v1/databases/${DB}/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
    body: JSON.stringify({
      page_size: 50,
      filter: { and: [
        { property: "Status", status: { does_not_equal: "Done" } },
        { property: "Status", status: { does_not_equal: "On Hold" } },
        { property: "Projects", relation: { contains: "2b32ffbd-a6db-8083-be6a-cdaa8d01c9fc" } },
        { property: "Due Date", date: { on_or_before: today } },  // only today's + overdue
      ]},
    }),
  });

  const data = await res.json();
  const tasks = (data.results || []).map((p: any) => ({
    title: p.properties.Name?.title?.map((t: any) => t.plain_text).join("") || "",
  })).filter((t: any) => t.title);

  const schedule = buildSchedule(tasks);

  // Map to CalEvent with Google Calendar colors
  // 11=tomato(red), 5=banana(yellow), 1=lavender, 2=sage(green)
  const calEvents: CalEvent[] = schedule.map(b => ({
    title: b.title,
    startMin: b.start,
    endMin: b.start + b.duration,
    description: b.isBreak ? "🌿 ช่วงพักผ่อน" : "📋 จัดโดยเลขาคิม · Daisi Design OS",
    colorId: b.isBreak ? "2" : b.title.includes("LB") || b.title.includes("packaging") || b.title.includes("Booth") ? "5" : "11",
  }));

  const result = await syncEventsToCalendar(calEvents, today);
  return NextResponse.json({ ...result, date: today, events: calEvents.length });
}
