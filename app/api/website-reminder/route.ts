import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return NextResponse.json({ error: "No Resend key" }, { status: 503 });

  const today = new Date().toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    weekday: "long", day: "numeric", month: "long",
  });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "onboarding@resend.dev",
      to: [process.env.USER_EMAIL || "stpkt.166@gmail.com"],
      subject: `📢 คุยกับทีม Website วันนี้แล้วหรือยัง? — ${today}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <div style="font-size:28px;margin-bottom:8px">📢</div>
          <h2 style="font-size:18px;color:#1a1a2e;margin:0 0 12px">Website Team Check-in</h2>
          <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 16px">
            แวะคุยกับทีม Website วันนี้หน่อยนะ 🙂<br/>
            ถามความคืบหน้า และแจ้ง next step ถ้ามี
          </p>
          <div style="background:#f5f5f5;border-radius:8px;padding:12px 16px;font-size:13px;color:#666">
            <b>Checklist สั้นๆ</b><br/>
            ☐ มี blocker อะไรมั้ย?<br/>
            ☐ งานที่ส่งไปล่าสุดเป็นยังไงบ้าง?<br/>
            ☐ next step คืออะไร?
          </div>
          <p style="font-size:11px;color:#999;margin-top:20px">จาก เลขาคิม · Daisi Design OS</p>
        </div>
      `,
    }),
  });

  const data = await res.json();
  return NextResponse.json({ ok: res.ok, id: data.id, date: today });
}
