export type Category = "งาน" | "ดีไซน์" | "ครอบครัว" | "เพื่อน" | "วันหยุด" | "Note";

/* ── Eisenhower Matrix ── */
export type Quadrant = "Q1" | "Q2" | "Q3" | "Q4";

export const QUADRANT_INFO: Record<Quadrant, {
  label: string; shortLabel: string; action: string; emoji: string; color: string;
}> = {
  Q1: { label: "เร่งด่วน + สำคัญ",      shortLabel: "P1", action: "ทำทันที",   emoji: "🔴", color: "var(--red)"    },
  Q2: { label: "สำคัญ + ไม่เร่งด่วน",   shortLabel: "P2", action: "วางแผน",    emoji: "🟠", color: "#e07840"       },
  Q3: { label: "เร่งด่วน + ไม่สำคัญ",   shortLabel: "P3", action: "มอบหมาย",   emoji: "🟡", color: "var(--amber)"  },
  Q4: { label: "ไม่เร่งด่วน + ไม่สำคัญ", shortLabel: "P4", action: "ตัดออก/รอ", emoji: "⬜", color: "var(--text-2)" },
};

/** ใหม่: P1/P2/P3/P4 = Notion Priority Level เดียว ไม่ใช้ urgent field แยก
 *  Backward compat: task ที่มี urgent="!!!!" + priority เดิม (P1/P2/P3 old) → Q1/Q2 */
export function getQuadrant(task: Pick<Task, "urgent" | "priority">): Quadrant {
  switch (task.priority) {
    case "P1": return "Q1";
    case "P2": return "Q2";
    case "P3": return "Q3";
    case "P4": return "Q4";
    default: {
      // backward compat — old system: P1/P3 + urgent field
      const u = !!task.urgent;
      const imp = task.priority === "P1" || task.priority === "P2";
      if (u && imp)  return "Q1";
      if (u)         return "Q2";
      if (imp)       return "Q3";
      return "Q4";
    }
  }
}

/** ส่งไป Notion: Priority Level field เดียว P1/P2/P3/P4 */
export function quadrantToNotion(q: Quadrant): { priority: "P1" | "P2" | "P3" | "P4" } {
  const map: Record<Quadrant, "P1"|"P2"|"P3"|"P4"> = {
    Q1: "P1", Q2: "P2", Q3: "P3", Q4: "P4",
  };
  return { priority: map[q] };
}

export type Task = {
  id: string;
  title: string;
  status: string;
  due: string | null;
  endDue?: string | null;   // end date for multi-day tasks (from Notion Calendar)
  urgent: string | null;
  priority: string | null;
  notes?: string | null;
  category?: Category;
  area?: "sts" | "daisi" | "digital";
};

export type TaskData = {
  urgent: Task[];
  soon:   Task[];
  normal: Task[];
  review: Task[];  // status: Waiting — รอฝั่งตรงข้าม/ติดตาม
  onhold: Task[];  // status: On Hold — พักยาว ไม่ต้องเห็นในหน้าหลัก
  events: Task[];  // status: Note + มีเวลา — Meeting/Event ใส่ใน Time Block
  total:  number;
};

export type TimeBlock = {
  id: string;
  title: string;
  start: number; // minutes from midnight
  duration: number; // minutes
  category: Category;
  taskId?: string;
};

export const CAT_STYLE: Record<Category, { color: string; bg: string; emoji: string }> = {
  งาน:       { color: "var(--cat-work)",    bg: "var(--cat-work-bg)",    emoji: "💼" },
  ดีไซน์:    { color: "var(--cat-design)",  bg: "var(--cat-design-bg)",  emoji: "🎨" },
  ครอบครัว: { color: "var(--cat-family)",  bg: "var(--cat-family-bg)",  emoji: "🏠" },
  เพื่อน:    { color: "var(--cat-friends)", bg: "var(--cat-friends-bg)", emoji: "👥" },
  วันหยุด:   { color: "var(--cat-holiday)", bg: "var(--cat-holiday-bg)", emoji: "🌴" },
  Note:       { color: "var(--cat-note)",    bg: "var(--cat-note-bg)",    emoji: "📝" },
};

export function detectCategory(title: string): Category {
  const t = title.toLowerCase();
  if (/meeting|ประชุม|stand up|present|report|hiring|jd|kpi/.test(t)) return "งาน";
  if (/design|npd|artwork|logo|art|lb|lifebar|life bar|mockup|dieline|packaging|box|banner|poster|ci|template|ออกแบบ|แก้|สี|รูป/.test(t)) return "ดีไซน์";
  if (/family|ครอบครัว|พ่อ|แม่|บ้าน/.test(t)) return "ครอบครัว";
  if (/friend|เพื่อน/.test(t)) return "เพื่อน";
  if (/workout|diet|food|lunch|gym|วันหยุด|holiday|travel/.test(t)) return "วันหยุด";
  return "Note";
}
