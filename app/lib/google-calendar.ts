// ── Google Calendar helper ────────────────────────────────────────────

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
  if (!data.access_token) throw new Error("Cannot get access token: " + JSON.stringify(data));
  return data.access_token;
}

export interface CalEvent {
  title: string;
  startMin: number;  // minutes from midnight (Bangkok time)
  endMin: number;
  description?: string;
  colorId?: string;  // Google Calendar color 1-11
}

function toRFC3339(dateStr: string, minuteFromMidnight: number) {
  // Bangkok = UTC+7
  const [y, m, d] = dateStr.split("-");
  const h = Math.floor(minuteFromMidnight / 60);
  const min = minuteFromMidnight % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${m}-${d}T${pad(h)}:${pad(min)}:00+07:00`;
}

// Delete all Kim-created events for a given day before re-syncing
export async function deleteKimEventsForDay(dateStr: string): Promise<number> {
  const token = await getAccessToken();
  const timeMin = `${dateStr}T00:00:00+07:00`;
  const timeMax = `${dateStr}T23:59:59+07:00`;

  const listRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const listData = await listRes.json();
  const items: any[] = listData.items || [];

  // Only delete events created by Kim (identified by source or description)
  const kimEvents = items.filter(e =>
    e.source?.title === "Kim · Daisi Design OS" ||
    (e.description || "").includes("จัดโดยเลขาคิม")
  );

  let deleted = 0;
  for (const e of kimEvents) {
    const delRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${e.id}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    );
    if (delRes.status === 204) deleted++;
    await new Promise(r => setTimeout(r, 80));
  }
  return deleted;
}

export async function syncEventsToCalendar(
  events: CalEvent[],
  dateStr: string // YYYY-MM-DD
): Promise<{ ok: boolean; created: number; errors: number; deleted?: number }> {
  const token = await getAccessToken();

  // Delete old Kim events first to avoid duplicates
  const deleted = await deleteKimEventsForDay(dateStr);

  let created = 0;
  let errors = 0;

  for (const ev of events) {
    try {
      const body = {
        summary: ev.title,
        description: ev.description || "จัดโดยเลขาคิม · Daisi Design OS",
        start: { dateTime: toRFC3339(dateStr, ev.startMin), timeZone: "Asia/Bangkok" },
        end:   { dateTime: toRFC3339(dateStr, ev.endMin),   timeZone: "Asia/Bangkok" },
        colorId: ev.colorId,
        source: {
          title: "Kim · Daisi Design OS",
          url: process.env.NEXT_PUBLIC_APP_URL || "https://kim-app-theta.vercel.app",
        },
      };

      const res = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (res.ok) created++;
      else errors++;
    } catch {
      errors++;
    }
    // small delay to avoid rate limit
    await new Promise(r => setTimeout(r, 100));
  }

  return { ok: errors === 0, created, errors, deleted };
}
