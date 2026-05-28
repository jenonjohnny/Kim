"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { Task } from "./types";
import {
  ChevronLeftIcon, ChevronRightIcon, ClockIcon,
  FlagIcon, DotIcon, ChevronDownIcon,
} from "./icons";

/* ═══════════════════════════════  CONSTANTS  ═══════════════════════════════ */
const HOUR_H    = 72;
const PX_MIN    = HOUR_H / 60;
const SNAP      = 15;
const H_START   = 6;
const H_END     = 23;
const GRID_H    = (H_END - H_START) * 60 * PX_MIN;
const TIME_W    = 46;
const MIN_DUR   = 15;
const DEF_DUR   = 60;
const HOLD_MS      = 300;
const TRAY_HOLD_MS = 400;
const DIR_THRESH   = 6;
const SCROLL_ZONE  = 100;
const SCROLL_SPEED = 10;

const THAI_DAYS   = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัส","ศุกร์","เสาร์"];
const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const AREA_COLOR: Record<string,string> = { sts:"var(--amber)", daisi:"var(--warm-gold)", digital:"var(--steel-teal)" };
// Explicit rgba fills — CSS-var+hex doesn't work for dark colors like steel-teal
const AREA_FILL:     Record<string,string> = { sts:"rgba(255,185,0,0.22)", daisi:"rgba(223,160,64,0.22)", digital:"rgba(51,92,103,0.55)" };
const AREA_FILL_SEL: Record<string,string> = { sts:"rgba(255,185,0,0.42)", daisi:"rgba(223,160,64,0.42)", digital:"rgba(51,92,103,0.78)" };
const AREA_LABEL: Record<string,string> = { sts:"STS", daisi:"Daisi", digital:"Digital" };
const AREA_IDS:   Record<string,string> = {
  sts:"2a02ffbd-a6db-8096-8ee5-f4a9b6b73c02",
  daisi:"2982ffbd-a6db-8050-bf58-dfac37b527e2",
  digital:"36b2ffbd-a6db-81c1-b644-f337f63e7738",
};
const AREAS = ["sts","daisi","digital"] as const;

/* ═══════════════════════════════  HELPERS  ═══════════════════════════════ */
const snapM  = (m:number) => Math.round(m/SNAP)*SNAP;
const clamp  = (v:number,lo:number,hi:number) => Math.min(Math.max(v,lo),hi);
const minToY = (m:number) => (m - H_START*60) * PX_MIN;
const yToMin = (y:number) => y / PX_MIN + H_START*60;
const fmt    = (m:number) => `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
const addD   = (d:Date, n:number) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };
const dStr   = (d:Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const durLabel = (min:number) => min<60 ? `${min}น.` : min%60===0 ? `${min/60}ชม.` : `${Math.floor(min/60)}ชม.${min%60}น.`;

function parseTime(due:string):number|null {
  if(!due.includes("T")) return null;
  const i=due.indexOf("T"), h=parseInt(due.slice(i+1,i+3)), m=parseInt(due.slice(i+4,i+6));
  if(isNaN(h)||isNaN(m)) return null;
  const min=h*60+m;
  return (min>=H_START*60&&min<H_END*60) ? min : null;
}

async function patchTime(id:string, day:string, start:number, dur:number) {
  await fetch(`/api/tasks/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ due:`${day}T${fmt(start)}:00`, endDue:`${day}T${fmt(start+dur)}:00` }) });
}
async function clearTime(id:string) {
  await fetch(`/api/tasks/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ due:null }) });
}
async function createTaskApi(title:string, notes:string, day:string, start:number, end:number, areaKey:string|null) {
  const areaId = areaKey ? AREA_IDS[areaKey] : undefined;
  const res = await fetch("/api/tasks", { method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ title, notes:notes||undefined, due:`${day}T${fmt(start)}:00`, endDue:`${day}T${fmt(end)}:00`, areaId }) });
  return res.json();
}

/* ── Overlap layout ── */
interface ColInfo { col:number; totalCols:number; }
function layoutBlocks(blocks:Record<string,Block>):Map<string,ColInfo> {
  const sorted=Object.values(blocks).sort((a,b)=>a.startMin-b.startMin);
  const result=new Map<string,ColInfo>();
  let i=0;
  while(i<sorted.length){
    let end=sorted[i].startMin+sorted[i].dur, j=i+1;
    while(j<sorted.length&&sorted[j].startMin<end){ end=Math.max(end,sorted[j].startMin+sorted[j].dur); j++; }
    const group=sorted.slice(i,j), colEnds:number[]=[], assign:{id:string;col:number}[]=[];
    group.forEach(b=>{ let placed=false;
      for(let c=0;c<colEnds.length;c++) if(colEnds[c]<=b.startMin){ colEnds[c]=b.startMin+b.dur; assign.push({id:b.task.id,col:c}); placed=true; break; }
      if(!placed){ assign.push({id:b.task.id,col:colEnds.length}); colEnds.push(b.startMin+b.dur); }
    });
    assign.forEach(({id,col})=>result.set(id,{col,totalCols:colEnds.length}));
    i=j;
  }
  return result;
}

/* ── localStorage ── */
function saveBlocks(date:string, blocks:Record<string,Block>) {
  try { localStorage.setItem(`day-blocks-${date}`, JSON.stringify(Object.fromEntries(Object.entries(blocks).map(([id,b])=>[id,{startMin:b.startMin,dur:b.dur}])))); } catch {}
}
function loadBlocks(date:string):Record<string,{startMin:number;dur:number}>|null {
  try { const r=localStorage.getItem(`day-blocks-${date}`); return r?JSON.parse(r):null; } catch { return null; }
}

/* ═══════════════════════════════  TYPES  ═══════════════════════════════ */
interface Block { task:Task; startMin:number; dur:number; }
interface PeekState { task:Task; startMin:number; dur:number; }
interface CreateSheet { startMin:number; endMin:number; }

type DragPhase =
  | { phase:"hold"; source:"block"; taskId:string; startX:number; startY:number; blockOffsetMin:number; }
  | { phase:"tray-hold"; source:"tray"; task:Task; startX:number; startY:number; pointerId:number; }
  | { phase:"pending"; source:"block"|"tray"; taskId?:string; task?:Task; startX:number; startY:number; pointerId:number; blockOffsetMin?:number; }
  | { phase:"active"; source:"block"|"tray"; taskId?:string; task?:Task;
      curPY:number; curPX:number; blockOffsetMin?:number; overGrid:boolean; };

/* ═══════════════════════════════  MAIN  ═══════════════════════════════ */
interface Props {
  urgent:Task[]; soon:Task[]; normal:Task[]; review:Task[];
  onTaskClick:(t:Task)=>void;
  onDone?: (id:string)=>void;
  scrollContainer?: React.RefObject<HTMLDivElement|null>;
  resetKey?: number;
}

export default function DayView({ urgent, soon, normal, review, onTaskClick, onDone, scrollContainer, resetKey }:Props) {
  const today    = new Date();
  const todayStr = dStr(today);

  const [dayOff,     setDayOff]     = useState(0);
  const [blocks,     setBlocks]     = useState<Record<string,Block>>({});
  const [drag,       setDrag]       = useState<DragPhase|null>(null);
  const [saving,     setSaving]     = useState<string|null>(null);
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [peekTask,   setPeekTask]   = useState<PeekState|null>(null);
  const [peekTransY, setPeekTransY] = useState(0);
  const [pickTask,   setPickTask]   = useState<Task|null>(null);
  const [createSheet,setCreateSheet]= useState<CreateSheet|null>(null);
  const [createTitle,setCreateTitle]= useState("");
  const [createNote, setCreateNote] = useState("");
  const [createArea, setCreateArea] = useState<typeof AREAS[number]|null>(null);
  const [creating,   setCreating]   = useState(false);
  const [createTransY, setCreateTransY] = useState(0);
  const [removedIds,   setRemovedIds]   = useState<Set<string>>(new Set());
  const [activeTrayId,   setActiveTrayId]   = useState<string|null>(null); // tap-to-highlight
  const [createExpanded, setCreateExpanded] = useState(false);
  const [doneTrayIds,    setDoneTrayIds]    = useState<Set<string>>(new Set());

  // Google Calendar read-only events
  interface GCalEvent { id:string; title:string; start:string; end:string; color:string|null; fromKim:boolean; }
  const [gcalEvents, setGcalEvents] = useState<GCalEvent[]>([]);

  const gridRef        = useRef<HTMLDivElement>(null);
  const dragRef        = useRef<DragPhase|null>(null);
  const blocksRef      = useRef<Record<string,Block>>({});
  const holdTimerRef     = useRef<ReturnType<typeof setTimeout>|null>(null);
  const trayHoldTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const latestPtrRef   = useRef({x:0,y:0});
  const rafRef         = useRef<number|null>(null);
  const peekDragRef    = useRef<{startY:number; dy:number}|null>(null);
  const createDragRef  = useRef<{startY:number}|null>(null);
  // Handle drag (top/bot circle on selected block)
  const handleDragRef  = useRef<{id:string; type:"top"|"bot"}|null>(null);

  dragRef.current   = drag;
  blocksRef.current = blocks;

  useEffect(()=>{ setDayOff(0); },[resetKey]);
  // Reset removedIds when the day changes
  useEffect(()=>{ setRemovedIds(new Set()); },[dayOff]);

  // Fetch Google Calendar events for the current day (read-only overlay)
  // Use dayOff as dep and compute date here — curDate is declared later
  useEffect(()=>{
    const d=addD(new Date(),dayOff);
    const dateStr=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    setGcalEvents([]);
    fetch(`/api/gcal?date=${dateStr}`)
      .then(r=>r.json())
      .then(data=>{ if(data.events) setGcalEvents(data.events); })
      .catch(()=>{}); // silent fail — GCal is optional
  },[dayOff]);

  const curDay  = addD(today, dayOff);
  const curDate = dStr(curDay);
  const isToday = curDate===todayStr;

  /* ── Task categorisation ── */
  const urgentIds=new Set(urgent.map(t=>t.id)), soonIds=new Set(soon.map(t=>t.id)), normalIds=new Set(normal.map(t=>t.id));
  const seen=new Set<string>();
  const all=[...urgent,...soon,...normal,...review].filter(t=>{ if(seen.has(t.id)) return false; seen.add(t.id); return true; });

  const scheduled:Task[]=[], tray:Task[]=[];
  all.forEach(t=>{
    const dateOnly=t.due?t.due.split("T")[0]:null;
    const timeMin=t.due?parseTime(t.due):null;
    const endDateOnly=t.endDue?t.endDue.split("T")[0]:null;
    // Task explicitly removed from grid → always show in tray
    if(removedIds.has(t.id)){ tray.push(t); return; }
    if(dateOnly===curDate&&timeMin!==null) scheduled.push(t);
    else if(dateOnly===curDate) tray.push(t);
    // Multi-day spanning: show in tray for all days within the range
    else if(dateOnly&&dateOnly<curDate&&endDateOnly&&endDateOnly>=curDate) tray.push(t);
    // Overdue date-only (no end date)
    else if(dateOnly&&dateOnly<curDate&&!endDateOnly&&!(t.due?.includes("T"))) tray.push(t);
    else if(!t.due&&(urgentIds.has(t.id)||soonIds.has(t.id)||normalIds.has(t.id))) tray.push(t);
  });
  tray.sort((a,b)=>{ const ap=a.priority==="P1"?0:1,bp=b.priority==="P1"?0:1; if(ap!==bp)return ap-bp; return (a.due??"")<(b.due??"") ?-1:1; });

  /* ── Init / restore blocks ── */
  useEffect(()=>{
    const saved=loadBlocks(curDate), next:Record<string,Block>={};
    // Prefer localStorage startMin so manually positioned blocks don't jump back
    scheduled.forEach(t=>{ const sm=parseTime(t.due!); if(sm===null)return; next[t.id]={task:t,startMin:saved?.[t.id]?.startMin??sm,dur:saved?.[t.id]?.dur??DEF_DUR}; });
    if(saved){ all.forEach(t=>{ if(next[t.id])return; const s=saved[t.id]; if(s) next[t.id]={task:t,startMin:s.startMin,dur:s.dur}; }); }
    setBlocks(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[curDate,urgent.length,soon.length,normal.length,review.length]);

  useEffect(()=>{ saveBlocks(curDate,blocks); },[blocks,curDate]);

  const layout=layoutBlocks(blocks);
  const nowMin=today.getHours()*60+today.getMinutes();
  const nowY=isToday&&nowMin>=H_START*60&&nowMin<H_END*60?minToY(nowMin):null;

  useEffect(()=>{
    if(nowY===null)return;
    const sc=scrollContainer?.current; if(!sc)return;
    const t=setTimeout(()=>{
      const gridTop=gridRef.current?.getBoundingClientRect().top??0;
      const containerTop=sc.getBoundingClientRect().top;
      sc.scrollTo({top:Math.max(0,sc.scrollTop+(gridTop-containerTop)+nowY-180),behavior:"smooth"});
    },100);
    return()=>clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  /* ── Coord helpers ── */
  const getGridY=useCallback((py:number)=>py-(gridRef.current?.getBoundingClientRect().top??0),[]);
  const isOverGrid=useCallback((px:number,py:number)=>{
    const r=gridRef.current?.getBoundingClientRect(); if(!r)return false;
    return px>=r.left&&px<=r.right&&py>=r.top&&py<=r.bottom;
  },[]);

  /* ── Auto-scroll ── */
  const startAutoScroll=useCallback((py:number)=>{
    if(rafRef.current)cancelAnimationFrame(rafRef.current);
    const sc=scrollContainer?.current; if(!sc)return;
    const rect=sc.getBoundingClientRect();
    const dTop=py-rect.top, dBot=rect.bottom-py;
    let spd=0;
    if(dTop<SCROLL_ZONE) spd=-(1-dTop/SCROLL_ZONE)*SCROLL_SPEED*2;
    else if(dBot<SCROLL_ZONE) spd=(1-dBot/SCROLL_ZONE)*SCROLL_SPEED*2;
    if(spd===0)return;
    const tick=()=>{ sc.scrollTop+=spd; rafRef.current=requestAnimationFrame(tick); };
    rafRef.current=requestAnimationFrame(tick);
  },[scrollContainer]);
  const stopAutoScroll=useCallback(()=>{ if(rafRef.current){ cancelAnimationFrame(rafRef.current); rafRef.current=null; } },[]);

  const activateDrag=useCallback((d:DragPhase,py:number,px:number)=>{
    const next:DragPhase={ phase:"active", source:d.source as any,
      taskId:(d as any).taskId, task:(d as any).task, blockOffsetMin:(d as any).blockOffsetMin,
      curPY:py, curPX:px, overGrid:isOverGrid(px,py) };
    setDrag(next); dragRef.current=next;
    try{ navigator.vibrate(20); }catch{}
  },[isOverGrid]);

  /* ── Global pointermove ── */
  const onPM=useCallback((e:PointerEvent)=>{
    // Handle drag (circle handles on selected block)
    const hd=handleDragRef.current;
    if(hd){
      const y=getGridY(e.clientY);
      const min=snapM(clamp(yToMin(y),H_START*60,H_END*60));
      setBlocks(prev=>{
        const b=prev[hd.id]; if(!b) return prev;
        if(hd.type==="top"){
          const endMin=b.startMin+b.dur;
          const newStart=clamp(min,H_START*60,endMin-MIN_DUR);
          return {...prev,[hd.id]:{...b,startMin:newStart,dur:endMin-newStart}};
        } else {
          const dur=snapM(clamp(min-b.startMin,MIN_DUR,H_END*60-b.startMin));
          return {...prev,[hd.id]:{...b,dur}};
        }
      });
      return;
    }

    latestPtrRef.current={x:e.clientX,y:e.clientY};
    const d=dragRef.current;
    if(d){
      if(d.phase==="hold"){
        const dx=Math.abs(e.clientX-d.startX),dy=Math.abs(e.clientY-d.startY);
        if(dy>20||dx>20){ if(holdTimerRef.current){ clearTimeout(holdTimerRef.current); holdTimerRef.current=null; } setDrag(null); }
        return;
      }
      if(d.phase==="tray-hold"){
        const dy=Math.abs(e.clientY-d.startY);
        // Cancel hold if user is scrolling vertically
        if(dy>10){ if(trayHoldTimerRef.current){ clearTimeout(trayHoldTimerRef.current); trayHoldTimerRef.current=null; } setDrag(null); dragRef.current=null; }
        return;
      }
      if(d.phase==="pending"){
        const dx=Math.abs(e.clientX-d.startX),dy=Math.abs(e.clientY-d.startY);
        if(dy>DIR_THRESH||dx>DIR_THRESH) activateDrag(d,e.clientY,e.clientX);
        return;
      }
      const og=isOverGrid(e.clientX,e.clientY);
      startAutoScroll(e.clientY);
      if(d.source==="block"&&d.taskId){
        const rawMin=yToMin(getGridY(e.clientY))-(d.blockOffsetMin??0);
        const b=blocksRef.current[d.taskId];
        const sm=snapM(clamp(rawMin,H_START*60,H_END*60-(b?.dur??DEF_DUR)));
        setBlocks(prev=>{ const bb=prev[d.taskId!]; if(!bb)return prev; return {...prev,[d.taskId!]:{...bb,startMin:sm}}; });
      }
      setDrag({...d,curPY:e.clientY,curPX:e.clientX,overGrid:og});
    }
  },[activateDrag,isOverGrid,startAutoScroll,getGridY]);

  /* ── Global pointerup ── */
  const onPU=useCallback(async(e:PointerEvent)=>{
    // Handle drag release — save
    const hd=handleDragRef.current;
    if(hd){
      handleDragRef.current=null;
      const b=blocksRef.current[hd.id];
      if(b){ setSaving(hd.id); await patchTime(hd.id,curDate,b.startMin,b.dur); setSaving(null); }
      // Update peekTask time if same block
      setPeekTask(prev=>prev&&prev.task.id===hd.id ? {...prev,startMin:b?.startMin??prev.startMin,dur:b?.dur??prev.dur} : prev);
      return;
    }

    if(holdTimerRef.current){ clearTimeout(holdTimerRef.current); holdTimerRef.current=null; }
    if(trayHoldTimerRef.current){ clearTimeout(trayHoldTimerRef.current); trayHoldTimerRef.current=null; }
    const d=dragRef.current; if(!d){ setDrag(null); return; }
    setDrag(null); stopAutoScroll();
    if(d.phase==="hold"||d.phase==="pending"||d.phase==="tray-hold") return;

    const og=isOverGrid(e.clientX,e.clientY);
    if(d.source==="tray"&&d.task){
      if(!og)return;
      const sm=snapM(clamp(yToMin(getGridY(e.clientY)),H_START*60,H_END*60-DEF_DUR));
      const t=d.task;
      setBlocks(prev=>({...prev,[t.id]:{task:t,startMin:sm,dur:DEF_DUR}}));
      setRemovedIds(prev=>{ const n=new Set(prev); n.delete(t.id); return n; });
      setSaving(t.id); await patchTime(t.id,curDate,sm,DEF_DUR); setSaving(null);
    } else if(d.source==="block"&&d.taskId){
      if(!og){
        const tid=d.taskId;
        setBlocks(prev=>{ const n={...prev}; delete n[tid]; return n; });
        setRemovedIds(prev=>new Set([...prev,tid])); // re-add to tray
        setSelectedId(v=>v===tid?null:v);
        setSaving(tid); await clearTime(tid); setSaving(null);
      } else {
        const b=blocksRef.current[d.taskId]; if(!b)return;
        setSaving(d.taskId); await patchTime(d.taskId,curDate,b.startMin,b.dur); setSaving(null);
      }
    }
  },[stopAutoScroll,isOverGrid,getGridY,curDate]);

  useEffect(()=>{
    window.addEventListener("pointermove",onPM); window.addEventListener("pointerup",onPU);
    return()=>{ window.removeEventListener("pointermove",onPM); window.removeEventListener("pointerup",onPU); stopAutoScroll(); };
  },[onPM,onPU,stopAutoScroll]);

  /* ── Block drag (only when selected — activates immediately on movement) ── */
  const onBlockPD=(e:React.PointerEvent, taskId:string)=>{
    if(selectedId!==taskId) return; // must be selected first
    e.stopPropagation();
    const rect=e.currentTarget.getBoundingClientRect();
    const blockOffsetMin=(e.clientY-rect.top)/PX_MIN;
    // No hold timer — selected blocks drag immediately on first movement
    const pending:DragPhase={ phase:"pending", source:"block", taskId, startX:e.clientX, startY:e.clientY, pointerId:e.pointerId, blockOffsetMin };
    setDrag(pending); dragRef.current=pending;
    latestPtrRef.current={x:e.clientX,y:e.clientY};
  };

  /* ── Tray pointerdown — tap = highlight, hold 400ms = drag ── */
  const onTrayPD=(e:React.PointerEvent, task:Task)=>{
    // Don't preventDefault on initial touch — allows page scroll if user just scrolls
    if(trayHoldTimerRef.current) clearTimeout(trayHoldTimerRef.current);
    const d:DragPhase={phase:"tray-hold",source:"tray",task,startX:e.clientX,startY:e.clientY,pointerId:e.pointerId};
    setDrag(d); dragRef.current=d;
    latestPtrRef.current={x:e.clientX,y:e.clientY};
    trayHoldTimerRef.current=setTimeout(()=>{
      trayHoldTimerRef.current=null;
      const cur=dragRef.current;
      if(cur?.phase==="tray-hold"){
        try{ navigator.vibrate(18); }catch{}
        activateDrag(cur,latestPtrRef.current.y,latestPtrRef.current.x);
      }
    },TRAY_HOLD_MS);
  };

  /* ── Tray tap (quick release) = toggle highlight ── */
  const onTrayTap=(task:Task)=>{
    setActiveTrayId(prev => prev===task.id ? null : task.id);
  };

  /* ── Tray done — mark complete & remove from tray ── */
  const onTrayDone=useCallback(async(task:Task)=>{
    setDoneTrayIds(prev=>new Set([...prev,task.id]));
    setActiveTrayId(prev=>prev===task.id?null:prev);
    onDone?.(task.id);
    await fetch(`/api/tasks/${task.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"Done"})});
  },[onDone]);

  /* ── Grid tap: deselect or create ── */
  const onGridClick=(e:React.MouseEvent)=>{
    if(drag) return;
    if(selectedId){
      setSelectedId(null); setPeekTask(null); return;
    }
    const y=getGridY(e.clientY);
    const sm=snapM(clamp(yToMin(y),H_START*60,H_END*60-60));
    setCreateSheet({startMin:sm,endMin:sm+DEF_DUR});
    setCreateTitle(""); setCreateNote(""); setCreateArea(null); setCreateTransY(0);
  };

  const dismissPeek=useCallback(()=>{ setPeekTask(null); setPeekTransY(0); setSelectedId(null); },[]);

  const activeDrag=drag?.phase==="active"?drag:null;
  const draggingOffGrid=activeDrag?.source==="block"&&!activeDrag.overGrid;

  const hours=Array.from({length:H_END-H_START+1},(_,i)=>H_START+i);
  const dow=curDay.getDay();
  const dayLabel=`${THAI_DAYS[dow]} ${curDay.getDate()} ${THAI_MONTHS[curDay.getMonth()]} ${curDay.getFullYear()+543}`;

  const ghostMin=activeDrag?.source==="tray"
    ? snapM(clamp(yToMin(getGridY(activeDrag.curPY))-DEF_DUR/2,H_START*60,H_END*60-DEF_DUR))
    : null;

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div>
      {/* ── Day nav — sticky ── */}
      <div style={{display:"flex",alignItems:"center",gap:8,background:"var(--bg-base)",borderBottom:"1px solid var(--border)",position:"sticky",top:-16,zIndex:10,margin:"-16px -20px 8px",padding:"8px 20px"}}>
        <button onClick={()=>setDayOff(v=>v-1)} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",flexShrink:0}}><ChevronLeftIcon size={18} color="var(--text-3)"/></button>
        <button onClick={()=>setDayOff(0)} style={{flex:1,textAlign:"center",background:"none",border:"none",cursor:dayOff!==0?"pointer":"default",padding:"4px 0"}}>
          <div style={{fontSize:13,fontWeight:700,color:isToday?"var(--amber)":"var(--text-1)"}}>
            {isToday?"วันนี้":dayOff===1?"พรุ่งนี้":dayOff===-1?"เมื่อวาน":dayLabel}
          </div>
          <div style={{fontSize:10,color:"var(--text-3)",marginTop:1}}>{dayLabel}</div>
        </button>
        <button onClick={()=>setDayOff(v=>v+1)} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",flexShrink:0}}><ChevronRightIcon size={18} color="var(--text-3)"/></button>
      </div>

      {/* ── Grid ── */}
      <div style={{background:"var(--bg-card)",border:`2px solid ${draggingOffGrid?"var(--red)":activeDrag?.source==="tray"?"var(--amber)":"var(--border)"}`,borderRadius:14,overflow:"hidden",marginBottom:12,transition:"border-color 0.12s"}}>
        {saving&&<div style={{padding:"5px 14px",background:"var(--brand-soft)",fontSize:10,fontWeight:700,color:"var(--amber)",letterSpacing:"0.08em"}}>บันทึก...</div>}
        {draggingOffGrid&&<div style={{padding:"5px 14px",background:"rgba(255,80,80,0.12)",fontSize:10,fontWeight:700,color:"var(--red)"}}>ปล่อยนอก grid → ลบออก</div>}

        <div ref={gridRef} style={{position:"relative",height:GRID_H+20}}>

          {/* Hour shading */}
          {hours.slice(0,-1).map(h=>(
            <div key={`shade-${h}`} style={{position:"absolute",left:TIME_W,right:0,top:minToY(h*60),height:HOUR_H,background:h%2===0?"rgba(255,255,255,0.04)":"transparent",pointerEvents:"none"}}/>
          ))}

          {/* Hour lines */}
          {hours.map(h=>(
            <div key={h} style={{position:"absolute",left:0,right:0,top:minToY(h*60),display:"flex",alignItems:"flex-start",pointerEvents:"none"}}>
              <div style={{width:TIME_W,flexShrink:0,fontSize:10,fontWeight:600,color:(isToday&&h===today.getHours())?"var(--amber)":"var(--text-3)",paddingRight:8,textAlign:"right",transform:"translateY(-6px)"}}>
                {`${String(h).padStart(2,"0")}:00`}
              </div>
              <div style={{flex:1,borderTop:`1px solid ${h%2===0?"var(--border)":"rgba(255,255,255,0.04)"}`}}/>
            </div>
          ))}
          {hours.slice(0,-1).map(h=>(
            <div key={`${h}h`} style={{position:"absolute",left:TIME_W,right:0,top:minToY(h*60+30),borderTop:"1px dashed rgba(255,255,255,0.06)",pointerEvents:"none"}}/>
          ))}

          {/* Now line */}
          {nowY!==null&&(
            <div style={{position:"absolute",left:TIME_W-4,right:0,top:nowY,height:2,background:"var(--red)",zIndex:8,pointerEvents:"none"}}>
              <div style={{position:"absolute",left:-3,top:-3,width:8,height:8,borderRadius:"50%",background:"var(--red)"}}/>
            </div>
          )}

          {/* Blocks area */}
          <div style={{position:"absolute",left:TIME_W,right:0,top:0,bottom:0}}>

            {/* Grid background — tap to create / deselect */}
            <div style={{position:"absolute",inset:0,zIndex:1,cursor:"crosshair"}} onClick={onGridClick}/>

            {/* Tray drop indicator */}
            {activeDrag?.source==="tray"&&ghostMin!==null&&(
              <div style={{position:"absolute",left:3,right:3,top:minToY(ghostMin),height:DEF_DUR*PX_MIN,background:"var(--amber)20",border:"2px dashed var(--amber)",borderRadius:8,zIndex:5,pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:11,fontWeight:700,color:"var(--amber)"}}>{fmt(ghostMin)} – {fmt(ghostMin+DEF_DUR)}</span>
              </div>
            )}

            {/* ── Google Calendar read-only event blocks ── */}
            {gcalEvents.map(ev=>{
              const [sh,sm2]=ev.start.split(":").map(Number);
              const [eh,em]=ev.end.split(":").map(Number);
              const startMin=sh*60+sm2;
              const endMin  =eh*60+em;
              const dur     =Math.max(endMin-startMin,15);
              if(startMin<H_START*60||startMin>=H_END*60) return null;
              // Check if any task block overlaps this time — if so, shrink GCal to left column
              const hasTaskBlock=Object.values(blocks).some(b=>b.startMin<endMin&&(b.startMin+b.dur)>startMin);
              const top   =minToY(startMin);
              const height=Math.max(dur*PX_MIN,MIN_DUR*PX_MIN);
              const short =dur<=30;
              // Subtle blue-slate look — clearly different from task blocks
              const gcFill  ="rgba(84,132,237,0.14)";
              const gcBorder="rgba(84,132,237,0.45)";
              const gcText  ="rgba(160,196,255,0.90)";
              const gcSub   ="rgba(130,168,255,0.60)";
              // GCal events occupy left 38% — task blocks use right 62% to avoid overlap
              const gcWidth = hasTaskBlock ? "38%" : "100%";
              return (
                <div key={ev.id} style={{
                  position:"absolute", top, height,
                  left:2, width:`calc(${gcWidth} - 4px)`,
                  background:gcFill,
                  border:`1px solid ${gcBorder}`,
                  borderLeft:`2px solid rgba(84,132,237,0.75)`,
                  borderRadius:8, zIndex:2,
                  pointerEvents:"none", overflow:"hidden",
                } as React.CSSProperties}>
                  <div style={{padding:short?"3px 7px":"5px 8px 4px",height:"100%",display:"flex",flexDirection:"column",gap:2,overflow:"hidden"}}>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <span style={{fontSize:8,fontWeight:700,color:"rgba(84,132,237,0.9)",background:"rgba(84,132,237,0.2)",borderRadius:3,padding:"1px 4px",flexShrink:0}}>G</span>
                      <span style={{fontSize:11,fontWeight:600,color:gcText,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</span>
                    </div>
                    {!short&&<div style={{fontSize:9,color:gcSub}}>{ev.start} – {ev.end}</div>}
                  </div>
                </div>
              );
            })}

            {/* Blocks */}
            {Object.values(blocks).map(b=>{
              const {col,totalCols}=layout.get(b.task.id)??{col:0,totalCols:1};
              const top=minToY(b.startMin);
              const height=Math.max(b.dur*PX_MIN,MIN_DUR*PX_MIN);
              const ac=b.task.area?(AREA_COLOR[b.task.area]??"var(--steel-teal)"):"var(--steel-teal)";
              const fillNorm=b.task.area?(AREA_FILL[b.task.area]??"rgba(100,150,180,0.28)"):"rgba(100,150,180,0.28)";
              const fillSel =b.task.area?(AREA_FILL_SEL[b.task.area]??"rgba(100,150,180,0.48)"):"rgba(100,150,180,0.48)";
              const short=b.dur<=30;
              const isDrag=activeDrag?.taskId===b.task.id;
              const isSelected=selectedId===b.task.id;
              const offGrid=isDrag&&draggingOffGrid;
              const pct=1/totalCols;
              // Offset task blocks right when any GCal event overlaps the same time range
              const gcalOverlap=gcalEvents.some(ev=>{
                const [sh2,sm2]=ev.start.split(":").map(Number);
                const [eh2,em2]=ev.end.split(":").map(Number);
                return sh2*60+sm2<b.startMin+b.dur&&eh2*60+em2>b.startMin;
              });
              const taskOff=gcalOverlap?0.40:0;

              return (
                <div key={b.task.id}
                  style={{
                    position:"absolute", top, height,
                    left:`calc(${taskOff*100+col*pct*(1-taskOff)*100}% + 2px)`,
                    width:`calc(${pct*(1-taskOff)*100}% - 4px)`,
                    background:offGrid?"rgba(255,80,80,0.22)":isSelected?fillSel:fillNorm,
                    border:`1px solid ${offGrid?"var(--red)":isSelected?ac:ac+"60"}`,
                    borderLeft:`2px solid ${offGrid?"var(--red)":ac}`,
                    borderRadius:8, overflow:"visible",
                    opacity:offGrid?0.5:isDrag?0.7:1,
                    transform:isDrag?"scale(1.04)":"scale(1)",
                    boxShadow:isSelected?`0 0 0 3px ${ac}40, 0 4px 16px ${ac}35`:isDrag?`0 8px 24px ${ac}50`:"none",
                    zIndex:isSelected?8:isDrag?10:3,
                    cursor:isSelected?(isDrag?"grabbing":"grab"):"pointer",
                    userSelect:"none", WebkitUserSelect:"none",
                    transition:isDrag?"none":"transform 0.15s,box-shadow 0.2s",
                    touchAction:isSelected?"none":"pan-y",
                  } as React.CSSProperties}
                  onPointerDown={e=>onBlockPD(e, b.task.id)}
                  onClick={e=>{
                    e.stopPropagation();
                    if(!isSelected){
                      // First tap = select + open peek
                      setSelectedId(b.task.id);
                      setPeekTask({task:b.task,startMin:b.startMin,dur:b.dur});
                      setPeekTransY(0);
                    } else {
                      // Second tap = deselect + close peek
                      dismissPeek();
                    }
                  }}
                >
                  {/* Block content */}
                  <div style={{padding:short?"3px 7px":"6px 8px 4px",height:"100%",display:"flex",flexDirection:"column",gap:2,overflow:"hidden"}}>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      {b.task.priority==="P1"&&<FlagIcon size={9} color="var(--red)"/>}
                      <span style={{fontSize:11,fontWeight:700,color:offGrid?"var(--red)":ac,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.task.title}</span>
                    </div>
                    {!short&&<div style={{fontSize:9,color:ac,opacity:0.8}}>{fmt(b.startMin)} – {fmt(b.startMin+b.dur)}</div>}
                    {!short&&b.task.area&&<div style={{fontSize:8,fontWeight:700,color:ac,background:ac+"25",borderRadius:3,padding:"1px 4px",alignSelf:"flex-start",marginTop:"auto"}}>{AREA_LABEL[b.task.area]}</div>}
                  </div>

                  {/* Drag tooltip */}
                  {isDrag&&(
                    <div style={{position:"absolute",top:-22,left:"50%",transform:"translateX(-50%)",background:offGrid?"var(--red)":"var(--amber)",borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:700,color:"#000",zIndex:20,whiteSpace:"nowrap",pointerEvents:"none"}}>
                      {offGrid?"ลบ":fmt(b.startMin)}
                    </div>
                  )}

                  {/* ── TOP HANDLE (selected only) ── */}
                  {isSelected&&(
                    <div
                      style={{
                        position:"absolute", top:-9, left:"50%",
                        transform:"translateX(-50%)",
                        width:18, height:18, borderRadius:"50%",
                        background:ac, border:"2px solid var(--bg-card)",
                        zIndex:20, touchAction:"none", cursor:"ns-resize",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        boxShadow:`0 2px 6px ${ac}60`,
                      } as React.CSSProperties}
                      onPointerDown={e=>{
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        handleDragRef.current={id:b.task.id,type:"top"};
                      }}
                      onClick={e=>e.stopPropagation()}
                    >
                      <div style={{width:6,height:1.5,background:"rgba(0,0,0,0.5)",borderRadius:1}}/>
                    </div>
                  )}

                  {/* ── BOTTOM HANDLE (selected only) ── */}
                  {isSelected&&(
                    <div
                      style={{
                        position:"absolute", bottom:-9, left:"50%",
                        transform:"translateX(-50%)",
                        width:18, height:18, borderRadius:"50%",
                        background:ac, border:"2px solid var(--bg-card)",
                        zIndex:20, touchAction:"none", cursor:"ns-resize",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        boxShadow:`0 2px 6px ${ac}60`,
                      } as React.CSSProperties}
                      onPointerDown={e=>{
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        handleDragRef.current={id:b.task.id,type:"bot"};
                      }}
                      onClick={e=>e.stopPropagation()}
                    >
                      <div style={{width:6,height:1.5,background:"rgba(0,0,0,0.5)",borderRadius:1}}/>
                    </div>
                  )}

                  {/* Time label shown only while dragging (not on select — avoids glitch) */}
                  {isDrag&&!offGrid&&(
                    <div style={{position:"absolute",top:-22,left:"50%",transform:"translateX(-50%)",background:"var(--bg-card)",border:`1px solid ${ac}`,borderRadius:6,padding:"2px 8px",fontSize:9,fontWeight:700,color:ac,zIndex:18,whiteSpace:"nowrap",pointerEvents:"none"}}>
                      {fmt(b.startMin)} – {fmt(b.startMin+b.dur)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {Object.keys(blocks).length===0&&(
            <div style={{position:"absolute",left:TIME_W,right:0,top:minToY(9*60),padding:16,textAlign:"center",pointerEvents:"none"}}>
              <div style={{fontSize:12,color:"var(--text-3)"}}>ยังไม่มี block วันนี้</div>
              <div style={{fontSize:10,color:"var(--text-3)",marginTop:4}}>แตะ grid เพื่อสร้าง · ลาก task จากด้านล่าง</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tray (always open) ── */}
      {tray.length>0&&(
        <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:14,overflow:"hidden",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"13px 14px 10px"}}>
            <ClockIcon size={13} color="var(--text-3)"/>
            <span style={{flex:1,fontSize:12,fontWeight:700,color:"var(--text-2)"}}>{isToday?"งานวันนี้ — ยังไม่มีเวลา":"งาน — ยังไม่มีเวลา"}</span>
            <span style={{fontSize:11,fontWeight:700,color:"var(--text-3)",background:"var(--bg-raised)",borderRadius:6,padding:"2px 8px"}}>{tray.length}</span>
          </div>
          <div style={{padding:"0 12px 12px",display:"flex",flexDirection:"column",gap:6}}>
            {tray.filter(t=>!doneTrayIds.has(t.id)).map(t=>{
              const ac=t.area?(AREA_COLOR[t.area]??"var(--text-3)"):"var(--text-3)";
              const placed=!!blocks[t.id];
              const isDragging=activeDrag?.source==="tray"&&activeDrag.task?.id===t.id;
              const isActive=activeTrayId===t.id;
              const borderSide=isActive?ac:isDragging?ac:"var(--border)";
              return (
                <div key={t.id}
                  style={{
                    display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
                    background:isActive?ac+"18":isDragging?ac+"20":"var(--bg-raised)",
                    borderTop:`1px solid ${borderSide}`,
                    borderRight:`1px solid ${borderSide}`,
                    borderBottom:`1px solid ${borderSide}`,
                    borderLeft:`3px solid ${ac}`,
                    borderRadius:10,opacity:placed?0.35:1,
                    transform:isDragging?"scale(1.01)":"none",
                    transition:"transform 0.1s,background 0.15s,border-color 0.15s",
                    cursor:"grab",userSelect:"none",WebkitUserSelect:"none",
                  } as React.CSSProperties}
                  onPointerDown={e=>onTrayPD(e,t)}
                  onClick={()=>onTrayTap(t)}>
                  {/* Done button */}
                  <button
                    onPointerDown={e=>e.stopPropagation()}
                    onClick={e=>{e.stopPropagation();onTrayDone(t);}}
                    style={{
                      width:20,height:20,borderRadius:"50%",flexShrink:0,
                      border:`1.5px solid ${isActive?ac:"var(--border)"}`,
                      background:"transparent",cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      transition:"all 0.15s",
                    }}>
                  </button>
                  {t.priority==="P1"?<FlagIcon size={11} color="var(--red)"/>:<DotIcon size={8} color={ac}/>}
                  <span style={{flex:1,fontSize:13,fontWeight:isActive?600:500,color:isActive?"var(--text-1)":"var(--text-2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</span>
                  {t.due&&t.due.split("T")[0]<curDate&&<span style={{fontSize:9,fontWeight:700,color:"var(--red)",background:"rgba(255,80,80,0.12)",borderRadius:4,padding:"1px 5px",flexShrink:0}}>เลย</span>}
                  {t.area&&<span style={{fontSize:9,fontWeight:700,color:ac,background:ac+"18",borderRadius:4,padding:"1px 5px",flexShrink:0}}>{AREA_LABEL[t.area]}</span>}
                  {isActive&&<span style={{fontSize:9,color:ac,flexShrink:0,opacity:0.7}}>กดค้างเพื่อลาก</span>}
                </div>
              );
            })}
            <div style={{textAlign:"center",fontSize:9,color:"var(--text-3)",paddingTop:2}}>ลาก task ขึ้นไปวางบน grid · ลากออกนอก grid เพื่อลบ</div>
          </div>
        </div>
      )}

      <div style={{textAlign:"center",fontSize:10,color:"var(--text-3)",paddingBottom:4}}>
        แตะ grid สร้าง · แตะ block เลือก · ลากวงกลมปรับเวลา · กดค้าง block ที่เลือกแล้วเพื่อย้าย
      </div>

      {/* Tray drag ghost */}
      {activeDrag?.source==="tray"&&activeDrag.task&&(
        <div style={{position:"fixed",left:16,right:16,top:activeDrag.curPY-32,zIndex:120,pointerEvents:"none"}}>
          <div style={{background:(activeDrag.task.area?AREA_COLOR[activeDrag.task.area]:"var(--steel-teal)")+"30",border:`2px solid ${activeDrag.task.area?AREA_COLOR[activeDrag.task.area]:"var(--steel-teal)"}`,borderRadius:10,padding:"8px 14px",boxShadow:"0 8px 28px rgba(0,0,0,0.4)"}}>
            <div style={{fontSize:12,fontWeight:700,color:activeDrag.task.area?AREA_COLOR[activeDrag.task.area]:"var(--steel-teal)"}}>{activeDrag.task.title}</div>
            {ghostMin!==null&&<div style={{fontSize:10,opacity:0.8,color:activeDrag.task.area?AREA_COLOR[activeDrag.task.area]:"var(--steel-teal)",marginTop:2}}>{fmt(ghostMin)} – {fmt(ghostMin+DEF_DUR)}</div>}
          </div>
        </div>
      )}

      {/* ── Peek sheet — backdrop is pointer-events:none so grid stays interactive ── */}
      {peekTask&&(
        <div style={{position:"fixed",inset:0,zIndex:85,display:"flex",alignItems:"flex-end",pointerEvents:"none"}}>
          <div
            style={{
              width:"100%", background:"var(--bg-card)",
              borderRadius:"20px 20px 0 0",
              padding:"0 20px calc(24px + env(safe-area-inset-bottom))",
              border:"1px solid var(--border)",
              borderBottom:"none",
              boxShadow:"0 -8px 40px rgba(0,0,0,0.45)",
              transform:`translateY(${peekTransY}px)`,
              transition:peekDragRef.current?"none":"transform 0.22s ease-out",
              maxHeight:"60vh", overflowY:"auto",
              pointerEvents:"all",
            }}
            onClick={e=>e.stopPropagation()}>

            {/* Swipe handle — up=detail, down=dismiss */}
            <div style={{display:"flex",justifyContent:"center",paddingTop:14,paddingBottom:12,cursor:"ns-resize",touchAction:"none",userSelect:"none"} as React.CSSProperties}
              onPointerDown={e=>{
                e.currentTarget.setPointerCapture(e.pointerId);
                peekDragRef.current={startY:e.clientY,dy:0};
                setPeekTransY(0);
              }}
              onPointerMove={e=>{
                if(!peekDragRef.current) return;
                const dy=e.clientY-peekDragRef.current.startY;
                peekDragRef.current.dy=dy;
                if(dy<-70){
                  peekDragRef.current=null;
                  dismissPeek();
                  onTaskClick(peekTask.task);
                  return;
                }
                setPeekTransY(dy); // allow both up and down movement
              }}
              onPointerUp={()=>{
                if(!peekDragRef.current) return;
                const dy=peekDragRef.current.dy;
                peekDragRef.current=null;
                if(dy>80) dismissPeek();
                else if(dy<-50) { dismissPeek(); onTaskClick(peekTask.task); }
                else setPeekTransY(0); // snap back
              }}>
              <div style={{width:40,height:5,borderRadius:3,background:"var(--border)"}}/>
            </div>

            {/* Content */}
            <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:peekTask.task.notes?12:16}}>
              {peekTask.task.area&&(
                <div style={{width:4,alignSelf:"stretch",borderRadius:2,background:AREA_COLOR[peekTask.task.area]??"var(--border)",flexShrink:0,minHeight:24}}/>
              )}
              <div style={{flex:1}}>
                <div style={{fontSize:17,fontWeight:800,color:"var(--text-1)",lineHeight:1.3,marginBottom:6}}>
                  {peekTask.task.title}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  <span style={{fontSize:12,color:"var(--text-3)",fontWeight:500}}>
                    {fmt(peekTask.startMin)} – {fmt(peekTask.startMin+peekTask.dur)}
                  </span>
                  <span style={{fontSize:10,color:"var(--text-3)"}}>·</span>
                  <span style={{fontSize:11,color:"var(--text-3)"}}>{durLabel(peekTask.dur)}</span>
                  {peekTask.task.area&&(
                    <span style={{fontSize:10,fontWeight:700,color:AREA_COLOR[peekTask.task.area],background:AREA_COLOR[peekTask.task.area]+"18",borderRadius:5,padding:"1px 6px"}}>
                      {AREA_LABEL[peekTask.task.area]}
                    </span>
                  )}
                  {peekTask.task.priority==="P1"&&(
                    <span style={{fontSize:10,fontWeight:700,color:"var(--red)",background:"rgba(255,80,80,0.12)",borderRadius:5,padding:"1px 6px"}}>P1</span>
                  )}
                </div>
              </div>
            </div>

            {peekTask.task.notes&&(
              <div style={{fontSize:13,color:"var(--text-2)",lineHeight:1.6,background:"var(--bg-raised)",borderRadius:10,padding:"10px 12px",marginBottom:16}}>
                {peekTask.task.notes}
              </div>
            )}

            <div style={{textAlign:"center",fontSize:10,color:"var(--text-3)",marginBottom:4,opacity:0.7}}>
              ↑ ลากขึ้นดูรายละเอียด · ↓ ลากลงปิด
            </div>
          </div>
        </div>
      )}

      {/* ── Time picker ── */}
      {pickTask&&(
        <div style={{position:"fixed",inset:0,zIndex:90,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"flex-end"}} onClick={()=>setPickTask(null)}>
          <div style={{width:"100%",background:"var(--bg-card)",borderRadius:"20px 20px 0 0",padding:"0 20px calc(20px + env(safe-area-inset-bottom))",border:"1px solid var(--border)"}} onClick={e=>e.stopPropagation()}>
            <PickerInner task={pickTask} curDate={curDate}
              onDone={async(sm)=>{ setPickTask(null); setBlocks(prev=>({...prev,[pickTask.id]:{task:pickTask,startMin:sm,dur:DEF_DUR}})); setSaving(pickTask.id); await patchTime(pickTask.id,curDate,sm,DEF_DUR); setSaving(null); }}
              onCancel={()=>setPickTask(null)}/>
          </div>
        </div>
      )}

      {/* ── Create sheet — mini peek → full form ── */}
      {createSheet&&(
        <div style={{position:"fixed",inset:0,zIndex:90,background:createExpanded?"rgba(0,0,0,0.5)":"transparent",display:"flex",alignItems:"flex-end",pointerEvents:createExpanded?"auto":"none"}}
          onClick={()=>{ if(createExpanded){setCreateSheet(null);setCreateExpanded(false);} }}>
          <div
            style={{
              width:"100%", background:"var(--bg-card)",
              borderRadius:"20px 20px 0 0",
              border:"1px solid var(--border)",
              boxShadow:"0 -8px 40px rgba(0,0,0,0.5)",
              transform:`translateY(${Math.max(0,createTransY)}px)`,
              transition:createDragRef.current?"none":"transform 0.22s ease-out",
              pointerEvents:"auto",
            }}
            onClick={e=>e.stopPropagation()}>

            {/* Swipe handle — drag up=expand, drag down=dismiss (whole top area is draggable) */}
            <div style={{display:"flex",justifyContent:"center",paddingTop:10,paddingBottom:10,cursor:"ns-resize",touchAction:"none",userSelect:"none",WebkitUserSelect:"none"} as React.CSSProperties}
              onPointerDown={e=>{ e.currentTarget.setPointerCapture(e.pointerId); createDragRef.current={startY:e.clientY}; setCreateTransY(0); }}
              onPointerMove={e=>{ if(!createDragRef.current) return; const dy=e.clientY-createDragRef.current.startY; setCreateTransY(dy); }}
              onPointerUp={()=>{
                if(!createDragRef.current) return;
                if(createTransY<-30){ setCreateExpanded(true); setCreateTransY(0); } // swipe up → expand
                else if(createTransY>60){ setCreateSheet(null); setCreateExpanded(false); } // swipe down → dismiss
                else setCreateTransY(0);
                createDragRef.current=null;
              }}>
              <div style={{width:44,height:5,borderRadius:3,background:"var(--border)"}}/>
            </div>

            {/* ── MINI state — time only, swipe whole area to expand ── */}
            {!createExpanded&&(
              <div style={{padding:"4px 20px calc(28px + env(safe-area-inset-bottom))",display:"flex",alignItems:"center",gap:12,touchAction:"none",userSelect:"none"} as React.CSSProperties}
                onPointerDown={e=>{ if((e.target as HTMLElement).tagName==="BUTTON") return; e.currentTarget.setPointerCapture(e.pointerId); createDragRef.current={startY:e.clientY}; setCreateTransY(0); }}
                onPointerMove={e=>{ if(!createDragRef.current) return; const dy=e.clientY-createDragRef.current.startY; setCreateTransY(dy); }}
                onPointerUp={()=>{ if(!createDragRef.current) return; if(createTransY<-30){setCreateExpanded(true);setCreateTransY(0);} else if(createTransY>60){setCreateSheet(null);setCreateExpanded(false);} else setCreateTransY(0); createDragRef.current=null; }}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:"var(--text-3)",marginBottom:2}}>แตะ "สร้างงาน" หรือเลื่อนขึ้น</div>
                  <div style={{fontSize:20,fontWeight:800,color:"var(--amber)"}}>{fmt(createSheet.startMin)} – {fmt(createSheet.endMin)}</div>
                </div>
                <button onClick={()=>setCreateExpanded(true)}
                  style={{padding:"10px 18px",borderRadius:12,background:"var(--amber)",border:"none",color:"#000",fontSize:13,fontWeight:700,cursor:"pointer",flexShrink:0,touchAction:"auto"}}>
                  สร้างงาน →
                </button>
                <button onClick={()=>{ setCreateSheet(null); setCreateExpanded(false); }}
                  style={{padding:"10px 14px",borderRadius:12,background:"var(--bg-raised)",border:"1px solid var(--border)",color:"var(--text-3)",fontSize:13,cursor:"pointer",flexShrink:0,touchAction:"auto"}}>
                  ✕
                </button>
              </div>
            )}

            {/* ── FULL state ── */}
            {createExpanded&&(
            <div style={{padding:"0 20px calc(24px + env(safe-area-inset-bottom))"}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--text-3)",letterSpacing:"0.1em",marginBottom:14}}>สร้าง BLOCK ใหม่</div>

              {/* Time range — native time inputs (scroll wheel on iOS) */}
              <div style={{background:"var(--bg-raised)",borderRadius:12,padding:"12px 14px",marginBottom:14}}>
                <div style={{fontSize:10,color:"var(--text-3)",fontWeight:600,marginBottom:10,letterSpacing:"0.06em"}}>
                  ช่วงเวลา · {durLabel(createSheet.endMin-createSheet.startMin)}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:9,color:"var(--text-3)",marginBottom:4}}>เริ่ม</div>
                    <input type="time" value={fmt(createSheet.startMin)}
                      onChange={e=>{
                        if(!e.target.value) return;
                        const [h,m]=e.target.value.split(":").map(Number);
                        const sm=clamp(h*60+m,H_START*60,createSheet.endMin-MIN_DUR);
                        setCreateSheet(s=>s?{...s,startMin:sm}:s);
                      }}
                      style={{width:"100%",padding:"10px 12px",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,fontSize:18,fontWeight:800,color:"var(--amber)",fontFamily:"inherit",outline:"none",boxSizing:"border-box"} as React.CSSProperties}/>
                  </div>
                  <div style={{fontSize:14,color:"var(--text-3)",paddingTop:18}}>—</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:9,color:"var(--text-3)",marginBottom:4}}>สิ้นสุด</div>
                    <input type="time" value={fmt(createSheet.endMin)}
                      onChange={e=>{
                        if(!e.target.value) return;
                        const [h,m]=e.target.value.split(":").map(Number);
                        const em=clamp(h*60+m,createSheet.startMin+MIN_DUR,H_END*60);
                        setCreateSheet(s=>s?{...s,endMin:em}:s);
                      }}
                      style={{width:"100%",padding:"10px 12px",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,fontSize:18,fontWeight:800,color:"var(--amber)",fontFamily:"inherit",outline:"none",boxSizing:"border-box"} as React.CSSProperties}/>
                  </div>
                </div>
              </div>

              {/* Title — no autoFocus to prevent keyboard bounce */}
              <input value={createTitle} onChange={e=>setCreateTitle(e.target.value)}
                placeholder="ชื่องาน..."
                style={{width:"100%",padding:"13px 14px",background:"var(--bg-raised)",border:"1px solid var(--border)",borderRadius:12,fontSize:15,fontWeight:600,color:"var(--text-1)",fontFamily:"inherit",outline:"none",marginBottom:8,boxSizing:"border-box"}}/>

              {/* Note */}
              <textarea value={createNote} onChange={e=>setCreateNote(e.target.value)}
                placeholder="Note (ถ้ามี)..."
                rows={2}
                style={{width:"100%",padding:"11px 14px",background:"var(--bg-raised)",border:"1px solid var(--border)",borderRadius:12,fontSize:13,color:"var(--text-2)",fontFamily:"inherit",outline:"none",marginBottom:12,boxSizing:"border-box",resize:"none",lineHeight:1.5}}/>

              {/* Area */}
              <div style={{display:"flex",gap:6,marginBottom:16}}>
                {AREAS.map(a=>(
                  <button key={a} onClick={()=>setCreateArea(createArea===a?null:a)}
                    style={{padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:700,background:createArea===a?AREA_COLOR[a]+"22":"var(--bg-raised)",border:`1px solid ${createArea===a?AREA_COLOR[a]:"var(--border)"}`,color:createArea===a?AREA_COLOR[a]:"var(--text-3)"}}>
                    {AREA_LABEL[a]}
                  </button>
                ))}
              </div>

              {/* Buttons */}
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>{ setCreateSheet(null); setCreateExpanded(false); }} style={{flex:1,padding:13,borderRadius:12,background:"var(--bg-raised)",border:"1px solid var(--border)",color:"var(--text-3)",fontSize:14,cursor:"pointer"}}>ยกเลิก</button>
                <button disabled={!createTitle.trim()||creating}
                  onClick={async()=>{
                    if(!createTitle.trim())return;
                    setCreating(true);
                    const task=await createTaskApi(createTitle.trim(),createNote.trim(),curDate,createSheet.startMin,createSheet.endMin,createArea);
                    setBlocks(prev=>({...prev,[task.id]:{task,startMin:createSheet.startMin,dur:createSheet.endMin-createSheet.startMin}}));
                    setCreateSheet(null); setCreateExpanded(false); setCreating(false); setCreateTitle(""); setCreateNote(""); setCreateArea(null);
                  }}
                  style={{flex:2,padding:13,borderRadius:12,background:createTitle.trim()?"var(--amber)":"var(--bg-raised)",border:"none",color:createTitle.trim()?"#000":"var(--text-3)",fontSize:14,fontWeight:700,cursor:createTitle.trim()?"pointer":"default"}}>
                  {creating?"กำลังบันทึก...":"สร้าง"}
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Time picker ── */
function PickerInner({task,curDate,onDone,onCancel}:{task:Task;curDate:string;onDone:(m:number)=>void;onCancel:()=>void}) {
  const [time,setTime]=useState("09:00");
  const ac=task.area?(AREA_COLOR[task.area]??"var(--steel-teal)"):"var(--steel-teal)";
  return <>
    <div style={{display:"flex",justifyContent:"center",paddingTop:14,paddingBottom:12}}>
      <div style={{width:40,height:5,borderRadius:3,background:"var(--border)"}}/>
    </div>
    <div style={{padding:"0 0 calc(env(safe-area-inset-bottom))"}}>
      <div style={{fontSize:11,fontWeight:700,color:"var(--text-3)",letterSpacing:"0.1em",marginBottom:10}}>เลือกเวลา</div>
      <div style={{fontSize:14,fontWeight:600,color:"var(--text-1)",marginBottom:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.title}</div>
      <input type="time" value={time} onChange={e=>setTime(e.target.value)}
        style={{width:"100%",padding:"11px 14px",background:"var(--bg-raised)",border:"1px solid var(--border)",borderRadius:12,fontSize:20,fontWeight:700,color:ac,fontFamily:"inherit",outline:"none",marginBottom:12,boxSizing:"border-box"}}/>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:18}}>
        {["08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00","18:00"].map(t=>(
          <button key={t} onClick={()=>setTime(t)} style={{padding:"5px 11px",borderRadius:8,cursor:"pointer",fontSize:11,background:time===t?ac+"22":"var(--bg-raised)",border:`1px solid ${time===t?ac:"var(--border)"}`,color:time===t?ac:"var(--text-3)",fontWeight:time===t?700:400}}>{t}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={onCancel} style={{flex:1,padding:13,borderRadius:12,background:"var(--bg-raised)",border:"1px solid var(--border)",color:"var(--text-3)",fontSize:14,cursor:"pointer"}}>ยกเลิก</button>
        <button onClick={()=>{const [h,m]=time.split(":").map(Number);onDone(h*60+m);}} style={{flex:2,padding:13,borderRadius:12,background:ac,border:"none",color:"#000",fontSize:14,fontWeight:700,cursor:"pointer"}}>วางบน grid</button>
      </div>
    </div>
  </>;
}
