import { NextResponse } from "next/server";

/* ─────────────────────────────────────────────────────────────────
   GET /api/gcal?date=YYYY-MM-DD
   Returns Google Calendar events for the given day (Bangkok time).
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
  if (!data.access_token) {
    console.error("GCal token error:", JSON.stringify(data));
    throw new Error(`GCal: cannot get access token — ${data.error || "unknown"}`);
  }
  return data.access_token;
}

/** Convert any Google Calendar dateTime string → "HH:MM" in Bangkok time (UTC+7) */
function toBkkHHMM(dateTimeStr: string): string {
  const d   = new Date(dateTimeStr);
  const bkk = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const h   = String(bkk.getUTCHours()).padStart(2, "0");
  const m   = String(bkk.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export async function GET(req: Request) {
  const hasGoogle = !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );

  // If Google credentials are not configured, return empty gracefully
  if (!hasGoogle) {
    return NextResponse.json({
      events: [],
      configured: false,
      debug: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN not set in env",
    });
  }

  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const token   = await getAccessToken();
    const timeMin = encodeURIComponent(`${date}T00:00:00+07:00`);
    const timeMax = encodeURIComponent(`${date}T23:59:59+07:00`);

    // 1. List all calendars the user has access to
    const calListRes = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50",
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    const calListData = await calListRes.json();

    // Filter to only selected/visible calendars (exclude declined/hidden)
    const calendarIds: string[] = (calListData.items || [])
      .filter((c: any) => c.selected !== false)
      .map((c: any) => c.id as string);

    // Fallback to primary if calendarList isn't accessible (old token scope)
    if (calendarIds.length === 0) calendarIds.push("primary");

    // 2. Fetch events from all calendars in parallel
    const allEvents = await Promise.all(
      calendarIds.map(async (calId) => {
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events` +
          `?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=50&singleEvents=true&orderBy=startTime`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
        );
        const data = await res.json();
        return (data.items || []) as any[];
      })
    );

    // 3. Flatten, deduplicate by id, filter all-day events
    const seen = new Set<string>();
    const events = allEvents.flat()
      .filter((e: any) => e.start?.dateTime && !seen.has(e.id) && seen.add(e.id))
      .map((e: any) => ({
        id:      e.id,
        title:   e.summary || "(ไม่มีชื่อ)",
        start:   toBkkHHMM(e.start.dateTime),
        end:     toBkkHHMM(e.end?.dateTime || e.start.dateTime),
        color:   e.colorId ? GCAL_COLOR[e.colorId] : null,
        fromKim: (e.description || "").includes("จัดโดยเลขาคิม"),
      }))
      .sort((a: any, b: any) => a.start.localeCompare(b.start));

    return NextResponse.json({ events, configured: true });
  } catch (err: any) {
    console.error("GCal fetch error:", err);
    return NextResponse.json({
      events: [],
      configured: true,
      error: String(err?.message || err),
    });
  }
}

// Google Calendar colorId → hex  (subset of their palette)
const GCAL_COLOR: Record<string, string> = {
  "1":  "#a4bdfc",  // Lavender
  "2":  "#7ae7bf",  // Sage
  "3":  "#dbadff",  // Grape
  "4":  "#ff887c",  // Flamingo
  "5":  "#fbd75b",  // Banana
  "6":  "#ffb878",  // Tangerine
  "7":  "#46d6db",  // Peacock
  "8":  "#e1e1e1",  // Graphite
  "9":  "#5484ed",  // Blueberry
  "10": "#51b749",  // Basil
  "11": "#dc2127",  // Tomato
};
