import { NextResponse } from "next/server";
import { Resend } from "resend";
import { syncEventsToCalendar, CalEvent } from "@/app/lib/google-calendar";

const TOKEN = process.env.NOTION_TOKEN!;
const DB = process.env.NOTION_TASKS_DB!;
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

const THAI_DAYS = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัส","ศุกร์","เสาร์"];
const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

function thaiDate(d: Date) {
  return `${THAI_DAYS[d.getDay()]}ที่ ${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function dayDiff(due: string) {
  const today = new Date().toISOString().split("T")[0];
  const diff = Math.ceil((new Date(due).getTime() - new Date(today).getTime()) / 86400000);
  if (diff < 0) return `เลยกำหนด ${Math.abs(diff)} วัน`;
  if (diff === 0) return "ครบวันนี้";
  if (diff === 1) return "ครบพรุ่งนี้";
  return `อีก ${diff} วัน`;
}

async function fetchTasks() {
  const today = new Date().toISOString().split("T")[0];
  const in3days = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];

  // งานหลัก (ไม่รวม Daily Tracking / On Hold / Done)
  const res = await fetch(`https://api.notion.com/v1/databases/${DB}/query`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      page_size: 100,
      filter: {
        and: [
          { property: "Status", status: { does_not_equal: "Done" } },
          { property: "Status", status: { does_not_equal: "On Hold" } },
          { property: "Status", status: { does_not_equal: "Daily Tracking" } },
          { property: "Status", status: { does_not_equal: "Note" } },
          { property: "Projects", relation: { contains: "2b32ffbd-a6db-8083-be6a-cdaa8d01c9fc" } },
        ],
      },
      sorts: [{ property: "Due Date", direction: "ascending" }],
    }),
  });

  // รูทีนเช้า — Daily Tracking tasks
  const routineRes = await fetch(`https://api.notion.com/v1/databases/${DB}/query`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      page_size: 20,
      filter: {
        and: [
          { property: "Status", status: { equals: "Daily Tracking" } },
          { property: "Projects", relation: { contains: "2b32ffbd-a6db-8083-be6a-cdaa8d01c9fc" } },
        ],
      },
    }),
  });

  const data = await res.json();
  const routineData = await routineRes.json();

  const tasks = (data.results || []).map((p: any) => {
    const props = p.properties;
    return {
      title: props.Name?.title?.map((t: any) => t.plain_text).join("") || "",
      due: props["Due Date"]?.date?.start || null,
      status: props.Status?.status?.name || "",
    };
  });

  const routines = (routineData.results || []).map((p: any) => ({
    title: p.properties.Name?.title?.map((t: any) => t.plain_text).join("") || "",
  }));

  const urgent = tasks.filter((t: any) => t.due && t.due <= today);
  const soon   = tasks.filter((t: any) => t.due && t.due > today && t.due <= in3days);
  const normal = tasks.filter((t: any) => !t.due || t.due > in3days);

  return { urgent, soon, normal, total: tasks.length, routines };
}

function buildEmail(data: any) {
  const now = new Date();
  const dateStr = thaiDate(now);
  const h = now.getHours();
  const greeting = h < 12 ? "อรุณสวัสดิ์ค่ะ" : "สวัสดีค่ะ";

  const taskRow = (t: any) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #1e1e2a;font-size:14px;color:#f2f2f2;">${t.title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e1e2a;font-size:12px;color:#949597;white-space:nowrap;">${t.due ? dayDiff(t.due) : "—"}</td>
    </tr>`;

  const section = (label: string, color: string, tasks: any[]) => tasks.length === 0 ? "" : `
    <div style="margin-bottom:24px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:${color};
        background:${color}20;border-radius:6px;padding:5px 12px;display:inline-block;margin-bottom:12px;">
        ${label} · ${tasks.length} รายการ
      </div>
      <table style="width:100%;border-collapse:collapse;background:#111118;border-radius:10px;overflow:hidden;">
        ${tasks.map(taskRow).join("")}
      </table>
    </div>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">

    <!-- Header -->
    <div style="margin-bottom:28px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.14em;color:#ffb900;margin-bottom:10px;">
        ● DAISI DESIGN OS · รายงานประจำวัน
      </div>
      <div style="font-size:22px;font-weight:800;color:#f2f2f2;line-height:1.2;">
        ${greeting} คุณจีนอน 👋
      </div>
      <div style="font-size:13px;color:#949597;margin-top:6px;">${dateStr}</div>
    </div>

    <!-- Stat bar -->
    <div style="display:flex;gap:10px;margin-bottom:28px;">
      <div style="flex:1;background:#ff525220;border-radius:12px;padding:14px 10px;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:#ff5252;">${data.urgent.length}</div>
        <div style="font-size:10px;color:#ff5252;margin-top:4px;font-weight:600;">ด่วน</div>
      </div>
      <div style="flex:1;background:#ffb90020;border-radius:12px;padding:14px 10px;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:#ffb900;">${data.soon.length}</div>
        <div style="font-size:10px;color:#ffb900;margin-top:4px;font-weight:600;">ใกล้มา</div>
      </div>
      <div style="flex:1;background:#335c6730;border-radius:12px;padding:14px 10px;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:#335c67;">${data.total}</div>
        <div style="font-size:10px;color:#335c67;margin-top:4px;font-weight:600;">ทั้งหมด</div>
      </div>
    </div>

    <!-- Morning Routine -->
    ${data.routines?.length > 0 ? `
    <div style="margin-bottom:24px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:#3dd68c;
        background:#3dd68c20;border-radius:6px;padding:5px 12px;display:inline-block;margin-bottom:12px;">
        🌅 รูทีนเช้า · ${data.routines.length} รายการ
      </div>
      <div style="background:#111118;border-radius:10px;overflow:hidden;">
        ${data.routines.map((r: any) => `
        <div style="padding:10px 14px;border-bottom:1px solid #1e1e2a;font-size:13px;color:#f2f2f2;display:flex;align-items:center;gap:8px;">
          <span style="color:#3dd68c;font-size:16px;">☐</span> ${r.title}
        </div>`).join("")}
      </div>
    </div>` : ""}

    <!-- Task sections -->
    ${section("🔴 ด่วน — เลยกำหนดแล้ว", "#ff5252", data.urgent)}
    ${section("🟡 ใกล้มา — 3 วันข้างหน้า", "#ffb900", data.soon)}
    ${data.normal.length > 0 ? section("📋 งานต่อไป", "#335c67", data.normal.slice(0, 5)) : ""}

    <!-- Footer -->
    <div style="border-top:1px solid #1e1e2a;padding-top:20px;margin-top:8px;">
      <div style="font-size:13px;color:#3a3a48;line-height:1.6;">
        คิมส่งรายงานให้ทุกเช้า 8:00 น. ค่ะ<br>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://kim-app-theta.vercel.app"}"
          style="color:#ffb900;text-decoration:none;font-weight:600;">เปิดแอปคิม →</a>
      </div>
    </div>

  </div>
</body>
</html>`;
}

export async function GET(req: Request) {
  // Security: verify cron secret
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const data = await fetchTasks();
  const html = buildEmail(data);

  // ── ส่ง email ──────────────────────────────────────────────────
  await resend.emails.send({
    from: "Kim · Daisi Design <onboarding@resend.dev>",
    to: "stpkt.166@gmail.com",
    subject: `☀️ รายงานเช้า — ${thaiDate(new Date())} · งาน ${data.total} รายการ`,
    html,
  });

  // ── sync Google Calendar (ถ้าเชื่อมต่อแล้ว) ─────────────────
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const allTasks = [...data.urgent, ...data.soon].map((t: any) => ({ title: t.title }));

      // สร้าง schedule เดียวกับ TimeBlockView
      function est(title: string) {
        const t = title.toLowerCase();
        if (/one on one|1on1/.test(t)) return 60;
        if (/meeting|ประชุม/.test(t)) return 60;
        if (/รีพอร์ต|ประเมิณ/.test(t)) return 90;
        if (/kpi|สรุป|recap|report/.test(t)) return 75;
        if (/pantone|canva/.test(t)) return 30;
        if (/booth|lb -|life bar|uniform|hanging/.test(t)) return 90;
        if (/stripe|สมัคร/.test(t)) return 30;
        return 60;
      }

      const fixed = [
        { title: "พักเบรก ☕", start: 11*60+30, duration: 15, isBreak: true },
        { title: "พักกลางวัน 🍱", start: 12*60+30, duration: 60, isBreak: true },
        { title: "พักเบรก 🧃", start: 15*60+30, duration: 15, isBreak: true },
      ];
      const blocks = [...fixed];

      function findSlot(dur: number, after: number) {
        let c = after;
        while (c + dur <= 19*60) {
          const hit = blocks.find(b => c < b.start+b.duration+10 && c+dur > b.start-10);
          if (!hit) return c;
          c = hit.start + hit.duration + 10;
        }
        return -1;
      }

      const morning = allTasks.filter(t => /รีพอร์ต|สรุป|recap|report|kpi|ประเมิณ|stripe|สมัคร|meeting|one on|ประชุม/.test(t.title.toLowerCase()));
      const afternoon = allTasks.filter(t => !morning.includes(t));

      let mc = 10*60;
      morning.forEach(t => {
        const dur = est(t.title);
        const slot = findSlot(dur, mc);
        if (slot !== -1) { blocks.push({ title: t.title, start: slot, duration: dur, isBreak: false }); mc = slot+dur+10; }
      });
      let ac = 13*60+30;
      afternoon.forEach(t => {
        const dur = est(t.title);
        const slot = findSlot(dur, ac);
        if (slot !== -1) { blocks.push({ title: t.title, start: slot, duration: dur, isBreak: false }); ac = slot+dur+10; }
      });

      const calEvents: CalEvent[] = blocks.map(b => ({
        title: b.title,
        startMin: b.start,
        endMin: b.start + b.duration,
        description: b.isBreak ? "🌿 ช่วงพักผ่อน" : "📋 จัดโดยเลขาคิม · Daisi Design OS",
        colorId: b.isBreak ? "2" : "11",
      }));

      await syncEventsToCalendar(calEvents, today);
    } catch {
      // fail silently — email ยังส่งได้แม้ calendar จะ error
    }
  }

  return NextResponse.json({ ok: true, sent: new Date().toISOString() });
}
