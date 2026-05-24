import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const NOTION_TOKEN = process.env.NOTION_TOKEN!;
const CHAT_LOG_DB = process.env.NOTION_CHAT_LOG_DB!;
const NOTION_HEADERS = {
  Authorization: `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

const KIM_SYSTEM = `คุณคือ "คิม" เลขาส่วนตัวของคุณจีนอน เจ้าของ Daisi Design — บริษัทรับงานออกแบบครบวงจร (Branding, Social Media, NPD Packaging)

บุคลิก:
- พูดภาษาไทยเสมอ ลงท้ายประโยคด้วย "ค่ะ" หรือ "คะ" ตามความเหมาะสม
- เรียกเจ้านายว่า "คุณจีนอน" หรือ "คุณ" ตามบริบท
- เป็นกันเอง อบอุ่น เข้าใจ แต่มืออาชีพ
- ตอบกระชับ ตรงประเด็น — ถ้าตอบยาว ให้แบ่งเป็นข้อสั้นๆ
- ถ้าเจ้านายบอกว่าเหนื่อย หรือทำงานหนักเกินไป ให้เห็นอกเห็นใจก่อนแล้วค่อยช่วยปรับแผน
- รู้จักงานของ Daisi Design: Branding, Social, NPD Packaging

ความสามารถ:
- ดู task จาก Notion และจัดลำดับความสำคัญ
- แนะนำการปรับตาราง time block ของวันนี้
- ให้คำแนะนำเรื่องงาน การพัก และ work-life balance
- จำบทสนทนาในอดีตและนำมาใช้ประกอบการตอบ

กฎ:
- ห้ามตอบเป็นภาษาอังกฤษ ยกเว้นคำเฉพาะทางที่ไม่มีคำไทย
- ถ้าไม่รู้ ให้บอกตรงๆ อย่าเดา`;

async function saveToNotion(userMsg: string, kimMsg: string, sessionId: string) {
  try {
    const truncate = (s: string, n: number) => s.length > n ? s.slice(0, n) + "…" : s;
    await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: NOTION_HEADERS,
      body: JSON.stringify({
        parent: { database_id: CHAT_LOG_DB },
        properties: {
          Session: { title: [{ text: { content: sessionId } }] },
          Date: { date: { start: new Date().toISOString() } },
          User: { rich_text: [{ text: { content: truncate(userMsg, 2000) } }] },
          Kim: { rich_text: [{ text: { content: truncate(kimMsg, 2000) } }] },
        },
      }),
    });
  } catch {
    // fail silently — don't break chat if logging fails
  }
}

export async function POST(req: Request) {
  const { messages, tasks, sessionId } = await req.json();

  let taskContext = "";
  if (tasks) {
    const fmt = (arr: any[], icon: string) =>
      arr?.map((t: any) => `${icon} ${t.title}${t.due ? ` (ครบ ${t.due})` : ""}`).join("\n") || "";
    taskContext = `\n\n---\nTask ของคุณจีนอนวันนี้:\n${fmt(tasks.urgent, "🔴")}\n${fmt(tasks.soon, "🟡")}\n${fmt(tasks.normal?.slice(0, 8), "⚪")}\n---`;
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: KIM_SYSTEM + taskContext,
  });

  // Build history (all except last user message)
  const history = messages.slice(0, -1).map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
  const lastMsg = messages[messages.length - 1].content;
  const result = await chat.sendMessage(lastMsg);
  const kimReply = result.response.text();

  // Save to Notion async (don't await)
  if (sessionId) saveToNotion(lastMsg, kimReply, sessionId);

  return NextResponse.json({ content: kimReply });
}
