import { NextRequest, NextResponse } from "next/server";

const NOTION_TOKEN   = process.env.NOTION_TOKEN!;
const FEEDBACK_DB_ID = process.env.NOTION_FEEDBACK_DB ?? "";

export async function POST(req: NextRequest) {
  if (!FEEDBACK_DB_ID) {
    return NextResponse.json({ ok: false, error: "NOTION_FEEDBACK_DB not configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const rating:   number = Number(body.rating)   || 0;
  const category: string = String(body.category  || "อื่นๆ");
  const comment:  string = String(body.comment   || "").slice(0, 500);

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ ok: false, error: "rating must be 1-5" }, { status: 400 });
  }

  const stars = "⭐".repeat(rating);
  const title = `${stars} [${category}] ${new Date().toLocaleDateString("th-TH")}`;

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { database_id: FEEDBACK_DB_ID },
      properties: {
        // Title
        Name: {
          title: [{ text: { content: title } }],
        },
        // Rating (Number)
        Rating: {
          number: rating,
        },
        // Category (Select)
        Category: {
          select: { name: category },
        },
        // Comment (Rich text)
        Comment: {
          rich_text: comment ? [{ text: { content: comment } }] : [],
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Notion feedback error:", err);
    return NextResponse.json({ ok: false, error: "Notion error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
