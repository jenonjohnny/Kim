@AGENTS.md

## Model Selection — ตรวจสอบก่อนทุกงาน

| งานประเภทนี้ | ใช้โมเดล |
|---|---|
| วางแผน architecture, วิเคราะห์ระบบ, roadmap, ตัดสินใจซับซ้อน | `opus` |
| เขียน code, แก้ bug, deploy, review, refactor | `sonnet` (default) |
| ตอบคำถามเร็ว, lookup ข้อมูล, อธิบาย concept สั้น | `haiku` |

**กฎ**: ก่อนลงมือทำ ให้ระบุในใจว่างานนี้เป็นประเภทไหน แล้วแนะนำโมเดลที่เหมาะสมให้ผู้ใช้ทราบถ้าต่างจาก default
