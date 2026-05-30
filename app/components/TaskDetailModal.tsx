"use client";
import React, { useRef, useState } from "react";
import { Task, getQuadrant, QUADRANT_INFO, quadrantToNotion, Quadrant } from "./types";
import { CalendarPicker, formatDateTH } from "./CalendarPicker";
import { ClockIcon, FileTextIcon, ChevronUpIcon, ChevronDownIcon, PauseIcon } from "./icons";

const AREA_OPTS: { id: string; label: string; color: string }[] = [
  { id: "sts",     label: "STS",     color: "var(--brand)"      },
  { id: "daisi",   label: "Daisi",   color: "var(--brand)"  },
  { id: "digital", label: "Digital", color: "var(--brand)" },
];
const AREA_MAP = Object.fromEntries(AREA_OPTS.map(a => [a.id, a]));

const STATUS_OPTIONS: { name: string; label: string; icon: React.ReactNode; color: string }[] = [
  { name: "Not started", label: "ยังไม่เริ่ม", icon: <span style={{ fontSize: 10 }}>○</span>,  color: "var(--text-3)"     },
  { name: "In progress", label: "กำลังทำ",    icon: <span style={{ fontSize: 10 }}>▶</span>,  color: "var(--brand)" },
  { name: "Waiting",     label: "รอตรวจ",      icon: <ClockIcon size={11} color="var(--brand)" />,       color: "var(--brand)"      },
  { name: "On Hold",     label: "พักไว้",       icon: <PauseIcon size={11} color="var(--text-3)" />,      color: "var(--text-3)"     },
];

function dueLabelStr(due: string) {
  const today = new Date().toISOString().split("T")[0];
  const diff  = Math.ceil((new Date(due).getTime() - new Date(today).getTime()) / 86400000);
  if (diff < 0) return { text: `เลยกำหนด ${Math.abs(diff)} วัน`, color: "var(--red)" };
  if (diff === 0) return { text: "ครบวันนี้",   color: "var(--brand)" };
  if (diff === 1) return { text: "ครบพรุ่งนี้", color: "var(--brand)" };
  return { text: `อีก ${diff} วัน`, color: "var(--text-3)" };
}

interface Props {
  task: Task & { startMin?: number; endMin?: number };
  onClose: () => void;
  onDone: (id: string) => void;
}

async function patchTask(id: string, body: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function TaskDetailModal({ task, onClose, onDone }: Props) {
  const initQ = getQuadrant(task);
  const [quadrant, setQuadrant] = useState<Quadrant>(initQ);
  const [status,   setStatus]   = useState(task.status);
  const [notes,    setNotes]    = useState(task.notes || "");
  const [title,    setTitle]    = useState(task.title);
  const [due,      setDue]      = useState(task.due || "");
  const [endDue,   setEndDue]   = useState(task.endDue || "");
  const [area,     setArea]     = useState<string>(task.area || "sts");

  const [editQ,   setEditQ]   = useState(false);
  const [showCal, setShowCal] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved,  setSaved]  = useState(false);

  const titleInputRef  = useRef<HTMLTextAreaElement>(null);
  const calRowRef      = useRef<HTMLDivElement>(null);
  const sheetRef       = useRef<HTMLDivElement>(null);
  const modalDragRef   = useRef<{startY:number; dy:number}|null>(null);
  const [sheetTransY,  setSheetTransY]  = useState(0);
  const [sheetDragging,setSheetDragging]= useState(false);
  const [titleExpanded, setTitleExpanded] = useState(false);

  // ตรวจว่า title เกิน 2 บรรทัดมั้ย (rough: >45 chars ≈ overflow ที่ font 19px)
  const titleOverflows = title.length > 45;

  const qInfo      = QUADRANT_INFO[quadrant];
  const areaInfo   = AREA_MAP[area] || null;
  const dueInfo    = due ? dueLabelStr(due) : null;
  const notionUrl  = `https://notion.so/${task.id.replace(/-/g, "")}`;
  const dueSummary = due ? (endDue ? `${formatDateTH(due)} – ${formatDateTH(endDue)}` : formatDateTH(due)) : null;

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 1800); };

  const [saveError, setSaveError] = useState(false);
  const flashError = () => { setSaveError(true); setTimeout(() => setSaveError(false), 2500); };

  const changeQuadrant = async (q: Quadrant) => {
    setQuadrant(q); setEditQ(false);
    setSaving("priority");
    const ok = await patchTask(task.id, { priority: quadrantToNotion(q).priority });
    setSaving(null); ok ? flash() : (setQuadrant(initQ), flashError());
  };

  const changeStatus = async (s: string) => {
    setStatus(s);
    setSaving("status");
    const ok = await patchTask(task.id, { status: s });
    setSaving(null); ok ? flash() : (setStatus(task.status), flashError());
  };

  const changeArea = async (a: string) => {
    setArea(a);
    setSaving("area");
    const ok = await patchTask(task.id, { area: a });
    setSaving(null); ok ? flash() : (setArea(task.area || "sts"), flashError());
  };

  const saveNotes = async () => {
    if (notes === (task.notes || "")) return;
    setSaving("notes");
    const ok = await patchTask(task.id, { notes });
    setSaving(null); ok ? flash() : flashError();
  };

  const saveTitle = async () => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === task.title) { setTitle(task.title); return; }
    setSaving("title");
    const ok = await patchTask(task.id, { title: trimmed });
    setSaving(null); ok ? flash() : (setTitle(task.title), flashError());
  };

  const saveDue = async (newDue: string, newEnd: string) => {
    setSaving("due");
    // Always send both due and endDue to avoid wiping the end date (bug C4/B2)
    const ok = await patchTask(task.id, {
      due: newDue || null,
      endDue: newEnd || null,
    });
    setSaving(null); ok ? flash() : flashError();
  };

  const handleDuePick = (newStart: string) => {
    setDue(newStart);
    if (!newStart) { setEndDue(""); saveDue("", ""); return; }
    // auto-save ทันที แต่ไม่ปิดปฏิทิน — ผู้ใช้ปิดเองโดยกดปุ่มอีกครั้ง
    saveDue(newStart, endDue);
  };

  const handleEndDuePick = (newEnd: string) => {
    setEndDue(newEnd);
    saveDue(due, newEnd);
    // ไม่ setShowCal(false) — ไม่ให้เด้งปิดเอง
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)", zIndex: 60,
        animation: "fadeIn 0.18s ease-out",
      }} />

      {/* Sheet */}
      <div ref={sheetRef} style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 61,
        background: "var(--bg-card)",
        borderRadius: "24px 24px 0 0",
        borderTop: `3px solid ${qInfo.color}`,
        paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
        maxHeight: "92vh", overflowY: "auto",
        overscrollBehavior: "contain", overflowAnchor: "none" as any,
        animation: sheetTransY > 0 ? "none" : "sheetIn 0.42s cubic-bezier(0.32, 0.72, 0, 1)",
        transform: `translateY(${sheetTransY}px)`,
        transition: sheetDragging ? "none" : "transform 0.22s ease-out",
      }}>
        {/* Handle — swipe down to dismiss */}
        <div
          style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px", cursor: "s-resize", touchAction: "none", userSelect: "none" } as React.CSSProperties}
          onPointerDown={e => {
            e.currentTarget.setPointerCapture(e.pointerId);
            modalDragRef.current = { startY: e.clientY, dy: 0 };
            setSheetDragging(true);
            setSheetTransY(0);
          }}
          onPointerMove={e => {
            if (!modalDragRef.current) return;
            const dy = e.clientY - modalDragRef.current.startY;
            modalDragRef.current.dy = dy;
            if (dy > 0) setSheetTransY(dy);
          }}
          onPointerUp={() => {
            if (!modalDragRef.current) return;
            const dy = modalDragRef.current.dy;
            modalDragRef.current = null;
            setSheetDragging(false);
            if (dy > 100) onClose();
            else setSheetTransY(0);
          }}
        >
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)" }} />
        </div>

        <div style={{ padding: "8px 20px 0" }}>

          {/* ── Top badges row ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {/* Quadrant badge — tap to edit */}
            <button onClick={() => setEditQ(v => !v)} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 11, fontWeight: 700,
              color: qInfo.color, background: qInfo.color + "18",
              border: `1px solid ${editQ ? qInfo.color + "80" : "transparent"}`,
              borderRadius: 8, padding: "5px 10px", cursor: "pointer",
              transition: "all 0.15s",
            }}>
              {qInfo.emoji} {qInfo.shortLabel} · {qInfo.label}
              {editQ ? <ChevronUpIcon size={11} color={qInfo.color} /> : <ChevronDownIcon size={11} color={qInfo.color} />}
            </button>

            {/* Area badge */}
            {areaInfo && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: areaInfo.color,
                background: areaInfo.color + "20", borderRadius: 6, padding: "4px 9px",
              }}>{areaInfo.label}</span>
            )}

            {/* Save indicator */}
            {(saving || saved || saveError) && (
              <span style={{ fontSize: 10, color: saving ? "var(--text-3)" : saveError ? "var(--red)" : "var(--brand)", marginLeft: "auto" }}>
                {saving ? "กำลังบันทึก..." : saveError ? "⚠ บันทึกไม่สำเร็จ" : "✓ Saved"}
              </span>
            )}
          </div>

          {/* ── Inline quadrant picker ── */}
          {editQ && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
              {(["Q1","Q2","Q3","Q4"] as Quadrant[]).map(q => {
                const info = QUADRANT_INFO[q];
                const on = quadrant === q;
                return (
                  <button key={q} onClick={() => changeQuadrant(q)} style={{
                    padding: "9px 10px", borderRadius: 12, cursor: "pointer",
                    border: `1.5px solid ${on ? info.color : "var(--border)"}`,
                    background: on ? info.color + "18" : "transparent",
                    textAlign: "left", transition: "all 0.12s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: on ? info.color : "var(--text-2)" }}>
                        {info.shortLabel}
                      </span>
                      <span style={{ fontSize: 11 }}>{info.emoji}</span>
                    </div>
                    <div style={{ fontSize: 10, color: on ? info.color : "var(--text-3)", lineHeight: 1.3 }}>
                      {info.label}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Title — 2-line textarea with expand ── */}
          <div style={{ marginBottom: 18 }}>
            <textarea
              ref={titleInputRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => {
                if (e.key === "Enter") { e.preventDefault(); saveTitle(); titleInputRef.current?.blur(); }
                if (e.key === "Escape") { setTitle(task.title); titleInputRef.current?.blur(); }
              }}
              rows={titleExpanded ? 5 : 2}
              style={{
                width: "100%", fontSize: 18, fontWeight: 700, lineHeight: 1.4,
                color: "var(--text-1)", fontFamily: "inherit",
                background: "transparent",
                border: "none",
                borderBottom: `2px solid var(--border)`,
                outline: "none", padding: "4px 0 6px",
                boxSizing: "border-box",
                resize: "none",
                overflow: titleExpanded ? "auto" : "hidden",
                transition: "border-color 0.15s",
                display: "block",
              }}
              onFocus={e => { e.target.style.borderBottomColor = `${qInfo.color}80`; }}
              onBlurCapture={e => { e.target.style.borderBottomColor = "var(--border)"; }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
              <div style={{ fontSize: 10, color: "var(--text-3)" }}>แตะเพื่อแก้ไขชื่อ · Enter บันทึก</div>
              {titleOverflows && (
                <button onClick={() => setTitleExpanded(v => !v)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 10, color: "var(--text-3)", padding: "0 2px",
                }}>
                  {titleExpanded ? "▲ ย่อ" : "▼ ดูเพิ่ม"}
                </button>
              )}
            </div>
          </div>

          {/* ── Due date — tap to open calendar ── */}
          <div ref={calRowRef} style={{ marginBottom: 16 }}>
            <button
              onClick={() => {
                const next = !showCal;
                setShowCal(next);
                if (next) {
                  // scroll sheet so calendar is fully visible
                  setTimeout(() => {
                    calRowRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 50);
                }
              }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "11px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                background: showCal ? "var(--bg-raised)" : "transparent",
                border: `1px solid ${due ? (showCal ? qInfo.color + "60" : "var(--border)") : "var(--border)"}`,
                transition: "all 0.15s",
              }}
            >
              <ClockIcon size={17} color={due ? qInfo.color : "var(--text-3)"} />
              <span style={{ flex: 1, fontSize: 13 }}>
                {dueSummary ? (
                  <>
                    <span style={{ color: "var(--text-1)", fontWeight: 600 }}>{dueSummary}</span>
                    {dueInfo && <span style={{ color: dueInfo.color, fontSize: 11, marginLeft: 10 }}>{dueInfo.text}</span>}
                  </>
                ) : (
                  <span style={{ color: "var(--text-3)" }}>ยังไม่กำหนดวันที่</span>
                )}
              </span>
              {showCal ? <ChevronUpIcon size={13} color="var(--text-3)" /> : <ChevronDownIcon size={13} color="var(--text-3)" />}
            </button>

            {showCal && (
              <CalendarPicker
                startValue={due}
                onStartChange={v => { handleDuePick(v); if (v) {} }}
                endValue={endDue}
                onEndChange={handleEndDuePick}
              />
            )}
          </div>

          {/* ── Status chips ── */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.1em", marginBottom: 8 }}>
              สถานะ
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {STATUS_OPTIONS.map(opt => {
                const on = status === opt.name;
                return (
                  <button key={opt.name} onClick={() => changeStatus(opt.name)} style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "7px 12px", borderRadius: 10, cursor: "pointer", fontSize: 11,
                    border: `1.5px solid ${on ? opt.color : "var(--border)"}`,
                    background: on ? opt.color + "18" : "transparent",
                    color: on ? opt.color : "var(--text-3)",
                    fontWeight: on ? 700 : 400, transition: "all 0.12s",
                  }}>
                    {opt.icon} {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Area ── */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.1em", marginBottom: 8 }}>
              พื้นที่งาน
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {AREA_OPTS.map(opt => {
                const on = area === opt.id;
                return (
                  <button key={opt.id} onClick={() => changeArea(opt.id)} style={{
                    flex: 1, padding: "8px 0", borderRadius: 10, cursor: "pointer", fontSize: 12,
                    border: `1.5px solid ${on ? opt.color : "var(--border)"}`,
                    background: on ? opt.color + "18" : "transparent",
                    color: on ? opt.color : "var(--text-3)",
                    fontWeight: on ? 700 : 400, transition: "all 0.12s",
                  }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Notes ── */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.08em", marginBottom: 8 }}>
              <FileTextIcon size={11} color="var(--text-3)" /> NOTES
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="เพิ่ม notes... (sync กับ Notion อัตโนมัติ)"
              rows={3}
              style={{
                width: "100%", padding: "10px 12px",
                background: "var(--bg-raised)", border: "1px solid var(--border)",
                borderRadius: 12, color: "var(--text-1)", fontSize: 13,
                resize: "vertical", lineHeight: 1.5, fontFamily: "inherit",
                outline: "none", transition: "border 0.15s", boxSizing: "border-box",
              }}
              onFocus={e => (e.target.style.border = `1px solid ${qInfo.color}60`)}
              onBlurCapture={e => (e.target.style.border = "1px solid var(--border)")}
            />
          </div>

          <div style={{ height: 1, background: "var(--border)", marginBottom: 16 }} />

          {/* ── Actions ── */}
          <div style={{ display: "flex", gap: 10 }}>
            <a href={notionUrl} target="_blank" rel="noopener noreferrer" style={{
              flex: 1, padding: "13px 0", borderRadius: 14,
              background: "var(--bg-raised)", border: "1px solid var(--border)",
              color: "var(--text-2)", fontSize: 13, fontWeight: 600,
              textAlign: "center", textDecoration: "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>↗ Notion</a>
            <button onClick={() => { onDone(task.id); onClose(); }} style={{
              flex: 2, padding: "13px 0", borderRadius: 14,
              background: "var(--brand-soft)", border: "1px solid rgba(255,185,0,0.35)",
              color: "var(--brand)", fontSize: 14, fontWeight: 700,
              cursor: "pointer",
            }}>✓ เสร็จแล้ว</button>
          </div>

        </div>
      </div>

    </>
  );
}
