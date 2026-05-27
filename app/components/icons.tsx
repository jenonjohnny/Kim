"use client";
import React from "react";

/* ─────────────────────────────────────────────────
   Daisi Design OS — Icon Library
   All icons: 24×24 viewBox, stroke-based, round caps
   Pass `size` and `color` to override defaults.
   Default color = "currentColor" (inherits from CSS)
───────────────────────────────────────────────── */

type P = { size?: number; color?: string };

function Ic({
  size = 20, color = "currentColor", sw = 1.8, children,
}: P & { sw?: number; children: React.ReactNode }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: "block" }}
    >
      {children}
    </svg>
  );
}

/* ── Navigation ──────────────────────────────── */

export function HomeIcon(p: P) {
  return (
    <Ic {...p}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </Ic>
  );
}

export function ListIcon(p: P) {
  return (
    <Ic {...p}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="16" y2="18" />
    </Ic>
  );
}

export function CalendarIcon(p: P) {
  return (
    <Ic {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </Ic>
  );
}

export function TargetIcon(p: P) {
  return (
    <Ic {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </Ic>
  );
}

/* ── UI Chrome ───────────────────────────────── */

export function GearIcon(p: P) {
  return (
    <Ic {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </Ic>
  );
}

export function SearchIcon(p: P) {
  return (
    <Ic {...p}>
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="22" y2="22" />
    </Ic>
  );
}

export function CloseIcon(p: P) {
  return (
    <Ic {...p}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Ic>
  );
}

export function CheckIcon(p: P) {
  return (
    <Ic {...p} sw={2.2}>
      <polyline points="20 6 9 17 4 12" />
    </Ic>
  );
}

export function ChevronRightIcon(p: P) {
  return <Ic {...p}><path d="M9 18l6-6-6-6" /></Ic>;
}

export function ChevronLeftIcon(p: P) {
  return <Ic {...p}><path d="M15 18l-6-6 6-6" /></Ic>;
}

export function ChevronDownIcon(p: P) {
  return <Ic {...p}><path d="M6 9l6 6 6-6" /></Ic>;
}

export function ChevronUpIcon(p: P) {
  return <Ic {...p}><path d="M18 15l-6-6-6 6" /></Ic>;
}

export function PinIcon(p: P) {
  return (
    <Ic {...p}>
      <path d="M12 2a5 5 0 015 5c0 3.5-5 11-5 11S7 10.5 7 7a5 5 0 015-5z" />
      <circle cx="12" cy="7" r="2" />
    </Ic>
  );
}

export function RefreshIcon(p: P) {
  return (
    <Ic {...p}>
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </Ic>
  );
}

/* ── Status & Priority ───────────────────────── */

export function LightningIcon(p: P) {
  return (
    <Ic {...p}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </Ic>
  );
}

export function FlagIcon(p: P) {
  return (
    <Ic {...p}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </Ic>
  );
}

export function ClockIcon(p: P) {
  return (
    <Ic {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </Ic>
  );
}

export function PauseIcon(p: P) {
  return (
    <Ic {...p}>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </Ic>
  );
}

export function ArchiveIcon(p: P) {
  return (
    <Ic {...p}>
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" rx="1" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </Ic>
  );
}

export function FileTextIcon(p: P) {
  return (
    <Ic {...p}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </Ic>
  );
}

/* ── Settings ────────────────────────────────── */

export function LinkIcon(p: P) {
  return (
    <Ic {...p}>
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </Ic>
  );
}

export function UserIcon(p: P) {
  return (
    <Ic {...p}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Ic>
  );
}

export function KeyIcon(p: P) {
  return (
    <Ic {...p}>
      <circle cx="8" cy="15" r="4" />
      <path d="M11.5 12L21 2.5" />
      <path d="M19 4l2 2" />
      <path d="M16 7l2 2" />
    </Ic>
  );
}

export function MoonIcon(p: P) {
  return (
    <Ic {...p}>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </Ic>
  );
}

export function SunIcon(p: P) {
  return (
    <Ic {...p}>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </Ic>
  );
}

export function GlobeIcon(p: P) {
  return (
    <Ic {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a14.5 14.5 0 010 18M3 12h18" />
    </Ic>
  );
}

export function SliderIcon(p: P) {
  return (
    <Ic {...p}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </Ic>
  );
}

export function EyeIcon(p: P) {
  return (
    <Ic {...p}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </Ic>
  );
}

export function EyeOffIcon(p: P) {
  return (
    <Ic {...p}>
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </Ic>
  );
}

/* ── Content / OKR ───────────────────────────── */

export function BriefcaseIcon(p: P) {
  return (
    <Ic {...p}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="17" />
      <line x1="9.5" y1="14.5" x2="14.5" y2="14.5" />
    </Ic>
  );
}

export function PenIcon(p: P) {
  return (
    <Ic {...p}>
      <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </Ic>
  );
}

export function TrendingUpIcon(p: P) {
  return (
    <Ic {...p}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </Ic>
  );
}

export function BookIcon(p: P) {
  return (
    <Ic {...p}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </Ic>
  );
}

export function RobotIcon(p: P) {
  return (
    <Ic {...p}>
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M9 8V6a3 3 0 016 0v2" />
      <circle cx="9" cy="14" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1.5" fill="currentColor" stroke="none" />
      <line x1="9" y1="18" x2="15" y2="18" />
    </Ic>
  );
}

export function SparkleIcon(p: P) {
  return (
    <Ic {...p}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </Ic>
  );
}

export function StarIcon(p: P & { filled?: boolean }) {
  return (
    <Ic {...p}>
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        fill={p.filled ? "currentColor" : "none"}
      />
    </Ic>
  );
}

export function MessageSquareIcon(p: P) {
  return (
    <Ic {...p}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </Ic>
  );
}

export function BugIcon(p: P) {
  return (
    <Ic {...p}>
      <path d="M8 2l1.5 1.5" />
      <path d="M14.5 3.5L16 2" />
      <path d="M9 7.5A3 3 0 0115 7.5v5a3 3 0 01-6 0v-5z" />
      <path d="M6.5 9.5H3M6.5 12.5H2M6.5 15.5H4" />
      <path d="M17.5 9.5H21M17.5 12.5H22M17.5 15.5H20" />
      <path d="M9 19.5a3 3 0 006 0" />
    </Ic>
  );
}

export function LightbulbIcon(p: P) {
  return (
    <Ic {...p}>
      <path d="M9 18h6M10 22h4M12 2a7 7 0 017 7c0 2.5-1.3 4.7-3.3 6H8.3A7 7 0 0112 2z" />
    </Ic>
  );
}

export function SendIcon(p: P) {
  return (
    <Ic {...p}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </Ic>
  );
}

/* ── Dot indicator (colored fill, no stroke) ─── */
export function DotIcon({
  size = 8, color = "currentColor", outline = false,
}: {
  size?: number; color?: string; outline?: boolean;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8"
      style={{ flexShrink: 0, display: "block" }}>
      <circle cx="4" cy="4" r="3.5"
        fill={outline ? "none" : color}
        stroke={color}
        strokeWidth={outline ? 1.5 : 0}
      />
    </svg>
  );
}
