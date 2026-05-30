import { NextResponse } from "next/server";

const TOKEN = process.env.NOTION_TOKEN!;
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

const AREA_IDS: Record<string, string> = {
  sts:     "2a02ffbd-a6db-8096-8ee5-f4a9b6b73c02",
  daisi:   "2982ffbd-a6db-8050-bf58-dfac37b527e2",
  digital: "36b2ffbd-a6db-81c1-b644-f337f63e7738",
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const properties: any = {};

  if (body.title !== undefined)
    properties["Name"] = { title: [{ text: { content: body.title } }] };

  if (body.status !== undefined)
    properties["Status"] = { status: { name: body.status } };

  if (body.notes !== undefined)
    properties["Notes"] = {
      rich_text: body.notes ? [{ text: { content: body.notes } }] : [],
    };

  if (body.priority !== undefined)
    properties["Priority Level"] = { select: body.priority ? { name: body.priority } : null };

  if (body.due !== undefined)
    properties["Due Date"] = body.due
      ? { date: { start: body.due, end: body.endDue !== undefined ? (body.endDue || null) : null } }
      : { date: null };

  if (body.area !== undefined) {
    const areaId = AREA_IDS[body.area];
    properties["Areas"] = areaId ? { relation: [{ id: areaId }] } : { relation: [] };
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: "PATCH",
      headers: HEADERS,
      body: JSON.stringify({ properties }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Notion PATCH error:", res.status, errText);
      return NextResponse.json({ ok: false, error: "notion_error", status: res.status }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ ok: data.object === "page" });
  } catch (err) {
    console.error("PATCH /api/tasks/[id] error:", err);
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 503 });
  }
}
