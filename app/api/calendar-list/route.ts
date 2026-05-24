import { NextResponse } from "next/server";

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
  if (!data.access_token) throw new Error("Cannot get access token");
  return data.access_token;
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getAccessToken();
  const urlDate = new URL(req.url).searchParams.get("date");
  const today = urlDate || new Date().toISOString().split("T")[0];
  const timeMin = encodeURIComponent(`${today}T00:00:00+07:00`);
  const timeMax = encodeURIComponent(`${today}T23:59:59+07:00`);

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=50&singleEvents=true&orderBy=startTime`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();

  const events = (data.items || []).map((e: any) => ({
    title: e.summary,
    start: e.start?.dateTime?.slice(11, 16),
    end: e.end?.dateTime?.slice(11, 16),
    kim: (e.source?.title === "Kim · Daisi Design OS" || (e.description || "").includes("จัดโดยเลขาคิม")),
  }));

  return NextResponse.json({ date: today, count: events.length, events });
}
