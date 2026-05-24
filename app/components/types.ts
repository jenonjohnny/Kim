export type Category = "งาน" | "ดีไซน์" | "ครอบครัว" | "เพื่อน" | "วันหยุด" | "Note";

export type Task = {
  id: string;
  title: string;
  status: string;
  due: string | null;
  urgent: string | null;
  priority: string | null;
  notes?: string | null;
  category?: Category;
  area?: "sts" | "daisi";
};

export type TaskData = {
  urgent: Task[];
  soon: Task[];
  normal: Task[];
  review: Task[];   // status: Waiting — งานที่มอบให้คนอื่น รอตรวจ
  total: number;
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
