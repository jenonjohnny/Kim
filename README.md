# Personal OS — Time-Block Task Manager

แอปจัดการงานส่วนตัวที่เชื่อมกับ Notion โดยตรง  
ดู task, จัดเวลาด้วย drag & drop, ติดตาม priority — ทุกอย่างอยู่ใน Notion DB ของคุณ

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/kim-app&env=NOTION_TOKEN,NOTION_TASKS_DB&envDescription=Notion%20credentials&envLink=https://github.com/YOUR_USERNAME/kim-app/blob/main/SETUP.md)

---

## ฟีเจอร์หลัก

- 📅 **Time-Block Calendar** — ลาก task ขึ้น grid เวลาได้เลย
- 🗂 **Task Tray** — งานวันนี้ + งาน multi-day + งาน urgent
- 🎯 **Priority Tracking** — High / Medium / Low + Urgent flag
- 🌙 **Dark Mode** — ออกแบบมาสำหรับหน้าจอกลางคืน
- 🔗 **Notion Native** — ข้อมูลเก็บใน Notion DB ของคุณ ไม่ผ่าน server กลาง

---

## เริ่มต้น

ดูคู่มือติดตั้งแบบ step-by-step ได้ที่ → **[SETUP.md](./SETUP.md)**

### สรุปสั้น

1. Duplicate [Notion Template](#) *(ลิงก์เร็วๆ นี้)*
2. สร้าง Notion Integration → คัดลอก token
3. กดปุ่ม Deploy บน Vercel ด้านบน
4. ใส่ `NOTION_TOKEN` + `NOTION_TASKS_DB` → Deploy

**ค่าใช้จ่าย: $0** (Vercel free tier + Notion free)

---

## Tech Stack

- [Next.js](https://nextjs.org) 15 App Router
- [Notion API](https://developers.notion.com) v2022-06-28
- TypeScript + CSS Variables
- Deploy บน [Vercel](https://vercel.com)

---

## Local Development

```bash
# ติดตั้ง dependencies
npm install

# สร้างไฟล์ env
cp .env.example .env.local
# แก้ NOTION_TOKEN และ NOTION_TASKS_DB ใน .env.local

# รัน dev server
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | จำเป็น | คำอธิบาย |
|---|---|---|
| `NOTION_TOKEN` | ✅ | Notion Integration Secret (`secret_...`) |
| `NOTION_TASKS_DB` | ✅ | ID ของ Notion Database |
| `NOTION_STS_AREA_ID` | ❌ | Area ID สำหรับ STS (เฉพาะ owner) |
| `NOTION_DAISI_AREA_ID` | ❌ | Area ID สำหรับ Daisi (เฉพาะ owner) |
| `NOTION_DIGITAL_PRODUCT_AREA_ID` | ❌ | Area ID สำหรับ Digital (เฉพาะ owner) |
