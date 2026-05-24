import { NextResponse } from "next/server";

const TOKEN = process.env.NOTION_TOKEN!;
const DB = process.env.NOTION_TASKS_DB!;
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

const STS_AREA_ID   = "2a02ffbd-a6db-8096-8ee5-f4a9b6b73c02";
const DAISI_AREA_ID = "2982ffbd-a6db-8050-bf58-dfac37b527e2";

function parseTask(p: any) {
  const props = p.properties;
  const title    = props.Name?.title?.map((t: any) => t.plain_text).join("") || "";
  const status   = props.Status?.status?.name || "Not started";
  const due      = props["Due Date"]?.date?.start || null;
  const urgent   = props.Urgent?.select?.name || null;
  const priority = props["Priority Level"]?.select?.name || null;
  const notes =
    props.Notes?.rich_text?.map((t: any) => t.plain_text).join("") ||
    props.Note?.rich_text?.map((t: any) => t.plain_text).join("") ||
    null;
  const areaIds: string[] = (props.Areas?.relation || []).map((r: any) => r.id);
  const area = areaIds.includes(DAISI_AREA_ID) ? "daisi" : "sts";
  return { id: p.id, title, status, due, urgent, priority, notes, area };
}

export async function GET() {
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
          { or: [
            { property: "Areas", relation: { contains: STS_AREA_ID } },
            { property: "Areas", relation: { contains: DAISI_AREA_ID } },
          ]},
        ],
      },
      sorts: [{ property: "Due Date", direction: "ascending" }],
    }),
    cache: "no-store",   // ← ไม่ cache เลย ดึง Notion fresh ทุกครั้ง
  });
  const data = await res.json();
  const all = (data.results || []).map(parseTask);

  const today  = new Date().toISOString().split("T")[0];
  const in3days = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];

  // Waiting = รอคนอื่นทำ → ขึ้นเฉพาะ review เท่านั้น ไม่นับเป็น urgent/soon/normal
  const review  = all.filter((t: any) => t.status === "Waiting");
  const active  = all.filter((t: any) => t.status !== "Waiting");

  const urgent  = active.filter((t: any) => t.due && t.due <= today);
  const soon    = active.filter((t: any) => t.due && t.due > today && t.due <= in3days);
  const normal  = active.filter((t: any) => !t.due || t.due > in3days);

  return NextResponse.json({ urgent, soon, normal, review, total: all.length });
}

export async function POST(req: Request) {
  const { title, due, notes, areaId, priority, urgent } = await req.json();
  const body: any = {
    parent: { database_id: DB },
    icon: { type: "external", external: { url: "https://www.notion.so/icons/checkmark_blue.svg" } },
    properties: {
      Name: { title: [{ text: { content: title } }] },
      Status: { status: { name: "Not started" } },
    },
  };
  if (areaId) body.properties["Areas"] = { relation: [{ id: areaId }] };
  if (due) body.properties["Due Date"] = { date: { start: due } };
  if (notes) body.properties["Notes"] = { rich_text: [{ text: { content: notes } }] };
  if (priority) body.properties["Priority Level"] = { select: { name: priority } };
  if (urgent) body.properties["Urgent"] = { select: { name: urgent } };

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  const result = await res.json();
  return NextResponse.json(parseTask(result));
}
