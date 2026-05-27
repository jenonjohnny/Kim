import { NextResponse } from "next/server";

/* ─────────────────────────────────────────────────────────────────
   GET /api/gcal?date=YYYY-MM-DD
   Returns Google Calendar events for the given day (owner's calendar).
   Accessible from the client — no CRON_SECRET required.
   Uses server-side env vars so tokens are never exposed to the browser.
───────────────────────────────────────────────────────────────── */

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type:    "refresh_token",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("GCal: cannot get access token");
  return data.access_token;
}

export async function GET(req: Request) {
  // If Google credentials are not configured, return empty gracefully
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
    return NextResponse.json({ events: [], configured: false });
  }

  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const token    = await getAccessToken();
    const timeMin  = encodeURIComponent(`${date}T00:00:00+07:00`);
    const timeMax  = encodeURIComponent(`${date}T23:59:59+07:00`);

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
      `?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=50&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    const data = await res.json();

    const events = (data.items || [])
      // Skip all-day events (no dateTime, only date)
      .filter((e: any) => e.start?.dateTime)
      .map((e: any) => ({
        id:    e.id,
        title: e.summary || "(ไม่มีชื่อ)",
        start: e.start.dateTime.slice(11, 16),   // "HH:MM"
        end:   e.end?.dateTime?.slice(11, 16) || e.start.dateTime.slice(11, 16),
        color: e.colorId ? GCal_COLOR[e.colorId] : null,
        fromKim: (e.description || "").includes("จัดโดยเลขาคิม"),
      }));

    return NextResponse.json({ events, configured: true });
  } catch (err) {
    console.error("GCal fetch error:", err);
    return NextResponse.json({ events: [], configured: true, error: String(err) });
  }
}

// Google Calendar colorId → hex  (subset of their palette)
const GCal_COLOR: Record<string, string> = {
  "1": "#a4bdfc",  // Lavender
  "2": "#7ae7bf",  // Sage
  "3": "#dbadff",  // Grape
  "4": "#ff887c",  // Flamingo
  "5": "#fbd75b",  // Banana
  "6": "#ffb878",  // Tangerine
  "7": "#46d6db",  // Peacock
  "8": "#e1e1e1",  // Graphite
  "9": "#5484ed",  // Blueberry
  "10": "#51b749", // Basil
  "11": "#dc2127", // Tomato
};
