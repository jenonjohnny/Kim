# คู่มือติดตั้ง Personal OS App

แอปนี้เชื่อมกับ **Notion** ของคุณโดยตรง — task ทุกอันดึงมาจาก Notion DB ของคุณเอง  
ข้อมูลไม่ผ่านเซิร์ฟเวอร์กลาง ไม่มีใครเห็นข้อมูลของคุณนอกจากคุณ

---

## สิ่งที่ต้องมี

- บัญชี Notion (ฟรีได้)
- บัญชี GitHub (ฟรีได้)
- บัญชี Vercel (ฟรีได้)

**ค่าใช้จ่าย: ฟรีทั้งหมด** สำหรับการใช้งานส่วนตัว

---

## ขั้นตอนที่ 1 — Duplicate Notion Template

1. เปิดลิงก์ Notion Template ด้านล่างนี้  
   👉 **[คลิกที่นี่เพื่อ Duplicate Template](#)**  
   *(ลิงก์จะอัปเดตเร็วๆ นี้)*

2. คลิกปุ่ม **"Duplicate"** มุมขวาบน

3. เลือก workspace ของคุณ → คลิก **"Duplicate"**

4. จะได้ DB ที่ชื่อ **"Tasks"** ปรากฏใน Notion ของคุณ

> **DB นี้มี property อะไรบ้าง?**
> | Property | ประเภท | หมายเหตุ |
> |---|---|---|
> | Name | Title | ชื่อ task — จำเป็น |
> | Status | Status | Not started / In Progress / Done |
> | Due Date | Date | วันที่ + เวลา (ใส่เวลาเพื่อให้ขึ้น Time Block) |
> | Priority Level | Select | High / Medium / Low |
> | Urgent | Select | Urgent / Normal |
> | Notes | Text | หมายเหตุ |

---

## ขั้นตอนที่ 2 — สร้าง Notion Integration Token

1. ไปที่ [https://www.notion.so/profile/integrations](https://www.notion.so/profile/integrations)

2. คลิก **"+ New integration"**

3. ตั้งชื่อ เช่น `Personal OS App`

4. เลือก workspace ที่ duplicate template ไว้

5. ใน **"Capabilities"** ให้เปิด:
   - ✅ Read content
   - ✅ Update content
   - ✅ Insert content

6. คลิก **"Save"** → คัดลอก **"Internal Integration Secret"** เก็บไว้  
   *(ขึ้นต้นด้วย `secret_...`)*

---

## ขั้นตอนที่ 3 — เชื่อม Integration กับ DB

1. เปิด Notion DB "Tasks" ที่ duplicate มา

2. คลิก **"..."** มุมขวาบน → **"Connections"**

3. ค้นหาชื่อ Integration ที่สร้างไว้ → คลิก **"Confirm"**

---

## ขั้นตอนที่ 4 — หา Database ID

1. เปิด Notion DB "Tasks" ในเบราว์เซอร์ (ไม่ใช่ app)

2. ดู URL:  
   ```
   https://notion.so/[workspace]/[DATABASE_ID]?v=...
   ```
   `DATABASE_ID` คือตัวเลขระหว่าง `/` กับ `?v=`  
   ตัวอย่าง: `https://notion.so/myworkspace/abc123def456...?v=xxx`  
   → Database ID คือ `abc123def456...`

3. คัดลอก ID นั้นไว้

---

## ขั้นตอนที่ 5 — Deploy แอป

1. คลิกปุ่มด้านล่างเพื่อ deploy ไปยัง Vercel ของคุณ:

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_GITHUB_USERNAME/kim-app&env=NOTION_TOKEN,NOTION_TASKS_DB&envDescription=Notion%20Integration%20Token%20and%20Database%20ID&envLink=https://github.com/YOUR_GITHUB_USERNAME/kim-app/blob/main/SETUP.md)

   *(ลิงก์จะอัปเดตเร็วๆ นี้)*

2. **หรือ** Fork repo นี้บน GitHub แล้ว:
   - ไปที่ [vercel.com](https://vercel.com) → **"New Project"**
   - เลือก repo ที่ fork มา → คลิก **"Deploy"**

3. Vercel จะถามให้ใส่ **Environment Variables**:

   | Variable | ค่า |
   |---|---|
   | `NOTION_TOKEN` | `secret_xxx...` จากขั้นตอนที่ 2 |
   | `NOTION_TASKS_DB` | Database ID จากขั้นตอนที่ 4 |

4. คลิก **"Deploy"** → รอ 1-2 นาที → ได้ URL แอปของคุณ 🎉

---

## ทดสอบว่าใช้งานได้

1. เปิด URL ที่ได้จาก Vercel
2. กดแท็บ **"วันนี้"** — ควรเห็น task ของคุณจาก Notion
3. ถ้ายังไม่มี task ให้ไปสร้าง task ใน Notion DB ก่อน แล้ว refresh แอป

---

## ปัญหาที่พบบ่อย

| ปัญหา | วิธีแก้ |
|---|---|
| แอปโหลดแต่ไม่มี task | ตรวจสอบว่า Integration เชื่อมกับ DB แล้ว (ขั้นตอนที่ 3) |
| Error "unauthorized" | Token อาจพิมพ์ผิด ตรวจสอบอีกครั้งใน Vercel → Settings → Environment Variables |
| Task ไม่ขึ้น Time Block | ต้องใส่ **วันที่ + เวลา** ใน Due Date ใน Notion (เช่น `14 Jun 2026 09:00`) |
| แอปไม่ update realtime | กด refresh ที่แอป หรือ pull to refresh — แอปดึงข้อมูลจาก Notion ทุกครั้งที่โหลด |

---

## ถ้าต้องการความช่วยเหลือ

ส่งข้อความมาที่ **[ชื่อผู้สร้าง]** หรือกรอก feedback ในแอปได้เลยค่ะ
