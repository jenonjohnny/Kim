import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code" }, { status: 400 });
  }

  // แลก code เอา refresh token
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "https://kim-app-theta.vercel.app"}/api/auth/callback`,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await res.json();

  if (!tokens.refresh_token) {
    return new NextResponse(
      `<html><body style="background:#0a0a0f;color:#f2f2f2;font-family:sans-serif;padding:40px;text-align:center">
        <div style="font-size:32px;margin-bottom:16px">⚠️</div>
        <div style="font-size:16px;margin-bottom:8px">ไม่ได้รับ refresh token</div>
        <div style="color:#949597;font-size:13px">ลอง login ใหม่อีกครั้งนะคะ</div>
        <a href="/api/auth/google" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#ffb900;color:#000;border-radius:10px;text-decoration:none;font-weight:700">ลอง Connect ใหม่</a>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  // แสดง refresh token ให้ copy ไปใส่ Vercel
  const refreshToken = tokens.refresh_token;

  return new NextResponse(
    `<html><body style="background:#0a0a0f;color:#f2f2f2;font-family:-apple-system,sans-serif;padding:40px;max-width:520px;margin:0 auto">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.12em;color:#ffb900;margin-bottom:20px">● DAISI DESIGN OS</div>
      <div style="font-size:22px;font-weight:800;margin-bottom:8px">✅ เชื่อมต่อสำเร็จค่ะ!</div>
      <div style="color:#949597;font-size:13px;margin-bottom:28px">คิมได้รับสิทธิ์เข้า Google Calendar แล้ว</div>

      <div style="background:#111118;border:1px solid #24242e;border-radius:12px;padding:20px;margin-bottom:20px">
        <div style="font-size:11px;color:#949597;margin-bottom:8px">GOOGLE_REFRESH_TOKEN — copy ทั้งหมด</div>
        <div style="font-size:12px;color:#ffb900;word-break:break-all;font-family:monospace;line-height:1.6">${refreshToken}</div>
      </div>

      <div style="background:#335c6720;border:1px solid #335c6740;border-radius:12px;padding:16px;font-size:13px;line-height:1.7;color:#f2f2f2">
        <strong>ขั้นตอนต่อไป:</strong><br>
        1. Copy token ด้านบน<br>
        2. ไปที่ <a href="https://vercel.com" style="color:#ffb900">vercel.com</a> → kim-app → Settings → Environment Variables<br>
        3. เพิ่ม <code style="background:#1f1f28;padding:2px 6px;border-radius:4px">GOOGLE_REFRESH_TOKEN</code> = token ที่ copy<br>
        4. กด Save แล้วบอกคิมได้เลยค่ะ 🎉
      </div>
    </body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
