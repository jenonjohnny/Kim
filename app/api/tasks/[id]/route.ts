import { NextResponse } from "next/server";

const TOKEN = process.env.NOTION_TOKEN!;
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const properties: any = {};

  if (body.status !== undefined)
    properties["Status"] = { status: { name: body.status } };

  if (body.notes !== undefined)
    properties["Notes"] = {
      rich_text: body.notes ? [{ text: { content: body.notes } }] : [],
    };

  const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
    method: "PATCH",
    headers: HEADERS,
    body: JSON.stringify({ properties }),
  });
  const data = await res.json();
  return NextResponse.json({ ok: data.object === "page" });
}
