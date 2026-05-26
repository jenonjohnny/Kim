import { NextResponse } from "next/server";

const TOKEN = process.env.NOTION_TOKEN!;
const DB = process.env.NOTION_TASKS_DB!;
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

// Area IDs — configurable via env vars, falls back to owner defaults.
// If NOTION_STS_AREA_ID is not set, the Areas filter is skipped entirely
// so testers can connect any plain Notion DB without the Areas relation.
const STS_AREA_ID             = process.env.NOTION_STS_AREA_ID             || "2a02ffbd-a6db-8096-8ee5-f4a9b6b73c02";
const DAISI_AREA_ID           = process.env.NOTION_DAISI_AREA_ID           || "2982ffbd-a6db-8050-bf58-dfac37b527e2";
const DIGITAL_PRODUCT_AREA_ID = process.env.NOTION_DIGITAL_PRODUCT_AREA_ID || "36b2ffbd-a6db-81c1-b644-f337f63e7738";
// true only when the owner explicitly configured area IDs
const USE_AREAS = !!(process.env.NOTION_STS_AREA_ID);

function parseTask(p: any) {
  const props = p.properties;
  const title    = props.Name?.title?.map((t: any) => t.plain_text).join("") || "";
  const status   = props.Status?.status?.name || "Not started";
  // Always use start date as `due` so multi-day tasks position correctly
  const due      = props["Due Date"]?.date?.start || null;
  const endDue   = props["Due Date"]?.date?.end   || null;
  const urgent   = props.Urgent?.select?.name || null;
  const priority = props["Priority Level"]?.select?.name || null;
  const notes =
    props.Notes?.rich_text?.map((t: any) => t.plain_text).join("") ||
    props.Note?.rich_text?.map((t: any) => t.plain_text).join("") ||
    null;
  const areaIds: string[] = (props.Areas?.relation || []).map((r: any) => r.id);
  const area = areaIds.includes(DIGITAL_PRODUCT_AREA_ID) ? "digital"
             : areaIds.includes(DAISI_AREA_ID)           ? "daisi"
             : "sts";
  return { id: p.id, title, status, due, endDue, urgent, priority, notes, area };
}

export async function GET() {
  // Build filter: always exclude Done/Daily Tracking; optionally filter by Areas
  const statusFilters = [
    { property: "Status", status: { does_not_equal: "Done" } },
    { property: "Status", status: { does_not_equal: "Daily Tracking" } },
  ];
  const areaFilter = USE_AREAS
    ? [{ or: [
        { property: "Areas", relation: { contains: STS_AREA_ID } },
        { property: "Areas", relation: { contains: DAISI_AREA_ID } },
        { property: "Areas", relation: { contains: DIGITAL_PRODUCT_AREA_ID } },
      ]}]
    : [];

  const res = await fetch(`https://api.notion.com/v1/databases/${DB}/query`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      page_size: 100,
      filter: { and: [...statusFilters, ...areaFilter] },
      sorts: [{ property: "Due Date", direction: "ascending" }],
    }),
    cache: "no-store",   // ← ไม่ cache เลย ดึง Notion fresh ทุกครั้ง
  });
  const data = await res.json();
  const all = (data.results || []).map(parseTask);

  const today  = new Date().toISOString().split("T")[0];
  const in3days = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];

  // events = Note status ที่มีเวลาระบุ (meeting/event ที่ใส่ใน Time Block)
  const events  = all.filter((t: any) => t.status === "Note" && t.due && t.due.includes("T"));
  const onhold  = all.filter((t: any) => t.status === "On Hold");
  const review  = all.filter((t: any) => t.status === "Waiting");
  const active  = all.filter((t: any) => t.status !== "Waiting" && t.status !== "On Hold" && t.status !== "Note");

  const urgent  = active.filter((t: any) => t.due && t.due <= today);
  const soon    = active.filter((t: any) => t.due && t.due > today && t.due <= in3days);
  const normal  = active.filter((t: any) => !t.due || t.due > in3days);

  return NextResponse.json({ urgent, soon, normal, review, onhold, events, total: active.length });
}

export async function POST(req: Request) {
  const { title, due, endDue, notes, areaId, priority, urgent } = await req.json();
  const body: any = {
    parent: { database_id: DB },
    icon: { type: "external", external: { url: "https://www.notion.so/icons/checkmark_blue.svg" } },
    properties: {
      Name: { title: [{ text: { content: title } }] },
      Status: { status: { name: "Not started" } },
    },
  };
  if (areaId) body.properties["Areas"] = { relation: [{ id: areaId }] };
  if (due) body.properties["Due Date"] = { date: { start: due, end: endDue || null } };
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
