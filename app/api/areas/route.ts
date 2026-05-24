import { NextResponse } from "next/server";

const TOKEN = process.env.NOTION_TOKEN!;
const AREAS_DB = "2972ffbd-a6db-80f5-aabe-ea8f5067314f";
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

export async function GET() {
  const res = await fetch(`https://api.notion.com/v1/databases/${AREAS_DB}/query`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ page_size: 50 }),
    cache: "no-store",
  });
  const data = await res.json();

  const areas = (data.results || []).map((r: any) => {
    const props = r.properties || {};
    const title = Object.values(props).find((v: any) => v?.type === "title") as any;
    const name = title?.title?.map((t: any) => t.plain_text).join("") || "?";
    const icon = r.icon || {};
    const emoji = icon.type === "emoji" ? icon.emoji : null;
    return { id: r.id, name, emoji };
  });

  return NextResponse.json({ areas });
}
