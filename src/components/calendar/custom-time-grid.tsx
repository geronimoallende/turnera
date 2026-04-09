/**
 * CustomTimeGrid — Multi-doctor day view calendar.
 *
 * A single unified CSS grid replacing N independent FullCalendar instances.
 * One scrollbar, one DOM tree, no sync hacks.
 *
 * Visual design based on Doctolib + Google Calendar patterns:
 *   - Grey (#eef0f2) = not working / no schedule
 *   - White (#ffffff) = scheduled working hours
 *   - 3-level grid lines: hour (solid dark), half-hour (solid light), quarter (dashed faint)
 *   - Red now indicator with dot
 *   - Left-border colored appointment blocks
 */

"use client"

import { useRef, useEffect, useMemo, useCallback } from "react"
import { format } from "date-fns"
import type { AppointmentListItem } from "@/lib/hooks/use-appointments"
import type { EffectiveSchedule, TimeBlock } from "@/lib/schedule-utils"

// ─── Design tokens ──────────────────────────────────────────────
// Sourced from Google Calendar + FullCalendar defaults

const COLORS = {
  gridHour: "#d1d5db",        // hour lines — gray-300
  gridHalf: "#e5e7eb",        // half-hour lines — gray-200
  gridQuarter: "#f0f0f0",     // quarter-hour lines — very faint
  columnBorder: "#d1d5db",    // vertical dividers between doctor columns
  headerBorder: "#e5e7eb",    // header bottom border
  headerBg: "#fafafa",        // header background — off-white
  nonWorking: "#eef0f2",      // non-working hours background
  working: "#ffffff",          // working hours background
  hoverSlot: "rgba(59, 130, 246, 0.08)", // blue hover on working slots
  nowLine: "#ef4444",          // red now indicator
  timeLabel: "#6b7280",        // time label text — gray-500
}

// ─── Layout constants ───────────────────────────────────────────

const GRID_START_HOUR = 6
const GRID_END_HOUR = 22
const SLOT_MINUTES = 15
const SLOT_HEIGHT = 28         // px per 15-min slot (compact but readable)
const LABEL_INTERVAL = 30
const TIME_COL_W = 56          // time labels width
const GRID_PAD_TOP = 8         // space above first row so label isn't clipped

const TOTAL_SLOTS = ((GRID_END_HOUR - GRID_START_HOUR) * 60) / SLOT_MINUTES
const GRID_START_MIN = GRID_START_HOUR * 60

// ─── Types ──────────────────────────────────────────────────────

type Doctor = { id: string; full_name: string; specialty: string | null; color: string }

type CustomTimeGridProps = {
  date: Date
  doctors: Doctor[]
  appointments: AppointmentListItem[]
  schedulesByDoctor?: Record<string, EffectiveSchedule>
  onSlotSelect: (info: { start: Date; end: Date; doctorId: string }) => void
  onEventClick: (appointmentId: string) => void
}

// ─── Helpers ────────────────────────────────────────────────────

function hhmm(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function inSchedule(minute: number, blocks: TimeBlock[]): boolean {
  return blocks.some((b) => minute >= hhmm(b.start_time) && minute < hhmm(b.end_time))
}

function minToPx(minute: number): number {
  return GRID_PAD_TOP + ((minute - GRID_START_MIN) / SLOT_MINUTES) * SLOT_HEIGHT
}

// ─── Time slots (pre-computed, never changes) ───────────────────

type Slot = { minute: number; label: string | null; lineLevel: "hour" | "half" | "quarter" }

const SLOTS: Slot[] = (() => {
  const arr: Slot[] = []
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const minute = GRID_START_MIN + i * SLOT_MINUTES
    const m = minute % 60
    arr.push({
      minute,
      label: m % LABEL_INTERVAL === 0 ? `${Math.floor(minute / 60)}:${String(m).padStart(2, "0")}` : null,
      lineLevel: m === 0 ? "hour" : m === 30 ? "half" : "quarter",
    })
  }
  return arr
})()

// ─── Event overlap layout (Google Calendar algorithm) ───────────

type Positioned = {
  apt: AppointmentListItem
  top: number; height: number; left: string; width: string
}

function layoutEvents(apts: AppointmentListItem[]): Positioned[] {
  if (!apts.length) return []

  const evs = apts.map((apt) => {
    const s = hhmm(apt.start_time), e = hhmm(apt.end_time)
    return { apt, s, e, top: minToPx(s), height: Math.max(((e - s) / SLOT_MINUTES) * SLOT_HEIGHT, SLOT_HEIGHT * 0.75) }
  }).sort((a, b) => a.s - b.s || (b.e - b.s) - (a.e - a.s))

  const clusters: typeof evs[] = []
  let cur: typeof evs = [], end = -1
  for (const ev of evs) {
    if (!cur.length || ev.s < end) { cur.push(ev); end = Math.max(end, ev.e) }
    else { clusters.push(cur); cur = [ev]; end = ev.e }
  }
  if (cur.length) clusters.push(cur)

  const result: Positioned[] = []
  for (const cluster of clusters) {
    const cols: number[] = []
    const assignments: number[] = []
    for (const ev of cluster) {
      let c = 0
      while (c < cols.length && cols[c] > ev.s) c++
      if (c >= cols.length) cols.push(ev.e); else cols[c] = ev.e
      assignments.push(c)
    }
    const n = cols.length
    cluster.forEach((ev, i) => {
      result.push({
        apt: ev.apt, top: ev.top, height: ev.height,
        left: `${(assignments[i] / n) * 100}%`,
        width: `${(1 / n) * 100}%`,
      })
    })
  }
  return result
}

// ─── Status colors ──────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  confirmed: "#3b82f6", pending: "#f59e0b", arrived: "#22c55e",
  in_progress: "#10b981", completed: "#6b7280", no_show: "#ef4444",
  cancelled_patient: "#9ca3af", cancelled_doctor: "#9ca3af", rescheduled: "#8b5cf6",
}

const HIDDEN = new Set(["cancelled_patient", "cancelled_doctor", "rescheduled"])

// ─── Component ──────────────────────────────────────────────────

export function CustomTimeGrid({
  date, doctors, appointments, schedulesByDoctor = {}, onSlotSelect, onEventClick,
}: CustomTimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const nowRef = useRef<HTMLDivElement>(null)

  // Group + layout per doctor (filter hidden statuses)
  const layoutMap = useMemo(() => {
    const m = new Map<string, Positioned[]>()
    for (const d of doctors) {
      const visible = appointments.filter((a) => a.doctors.id === d.id && !HIDDEN.has(a.status))
      m.set(d.id, layoutEvents(visible))
    }
    return m
  }, [appointments, doctors])

  // Scroll to ~7:30am on mount
  useEffect(() => {
    const t = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = Math.max(0, minToPx(7 * 60 + 30) - 80)
      }
    }, 50)
    return () => clearTimeout(t)
  }, [])

  // Now indicator
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const isToday = format(date, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")
  const showNow = isToday && nowMin >= GRID_START_MIN && nowMin < GRID_END_HOUR * 60

  // Click empty slot
  const clickSlot = useCallback((doctorId: string, minute: number) => {
    const d = format(date, "yyyy-MM-dd")
    const sh = Math.floor(minute / 60), sm = minute % 60
    const em = minute + SLOT_MINUTES, eh = Math.floor(em / 60), emin = em % 60
    const start = new Date(`${d}T${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}:00`)
    const end = new Date(`${d}T${String(eh).padStart(2, "0")}:${String(emin).padStart(2, "0")}:00`)
    onSlotSelect({ start, end, doctorId })
  }, [date, onSlotSelect])

  if (!doctors.length) {
    return <div className="flex flex-1 items-center justify-center text-sm text-gray-400">Select at least one doctor from the sidebar</div>
  }

  const gridH = GRID_PAD_TOP + TOTAL_SLOTS * SLOT_HEIGHT

  return (
    <div className="flex h-full flex-col bg-white">

      {/* ═══ HEADER — sticky doctor names ═══ */}
      <div className="flex shrink-0 bg-white" style={{ borderBottom: `1px solid ${COLORS.headerBorder}` }}>
        {/* Time gutter spacer */}
        <div style={{ width: TIME_COL_W }} className="shrink-0" />

        {/* Doctor columns */}
        {doctors.map((doc, i) => {
          const sch = schedulesByDoctor[doc.id]
          const hasBlocks = (sch?.blocks?.length ?? 0) > 0
          const blocked = sch?.is_blocked ?? false

          return (
            <div
              key={doc.id}
              className="flex flex-1 flex-col items-center py-2.5"
              style={{
                borderLeft: i === 0 ? `1px solid ${COLORS.columnBorder}` : `1px solid ${COLORS.columnBorder}`,
                borderTop: `3px solid ${doc.color}`,
              }}
            >
              <span className="text-[12px] font-semibold" style={{ color: doc.color }}>{doc.full_name}</span>
              <span className="text-[10px] text-gray-400">{doc.specialty || "\u00A0"}</span>
              {blocked && <span className="mt-0.5 text-[10px] font-medium text-red-500">{sch?.block_reason || "Day off"}</span>}
              {!blocked && !hasBlocks && <span className="mt-0.5 text-[10px] text-gray-400">Not working today</span>}
            </div>
          )
        })}
      </div>

      {/* ═══ SCROLLABLE GRID ═══ */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto">
        <div className="relative" style={{ height: gridH }}>

          {/* ── Time labels ── */}
          {SLOTS.map((slot) => slot.label && (
            <div
              key={`lbl-${slot.minute}`}
              className="absolute flex items-start justify-end pr-2"
              style={{ top: minToPx(slot.minute), width: TIME_COL_W, height: SLOT_HEIGHT, color: COLORS.timeLabel, fontSize: 11 }}
            >
              <span style={{ transform: "translateY(-50%)" }}>{slot.label}</span>
            </div>
          ))}

          {/* ── Grid lines ── */}
          {SLOTS.map((slot) => (
            <div
              key={`ln-${slot.minute}`}
              className="absolute"
              style={{
                top: minToPx(slot.minute),
                left: TIME_COL_W,
                right: 0,
                borderTopWidth: 1,
                borderTopStyle: slot.lineLevel === "quarter" ? "dashed" : "solid",
                borderTopColor: slot.lineLevel === "hour" ? COLORS.gridHour : slot.lineLevel === "half" ? COLORS.gridHalf : COLORS.gridQuarter,
              }}
            />
          ))}

          {/* ── Doctor columns (backgrounds + events) ── */}
          <div className="absolute top-0 bottom-0 flex" style={{ left: TIME_COL_W, right: 0 }}>
            {doctors.map((doc) => {
              const sch = schedulesByDoctor[doc.id]
              const blocks = sch?.blocks ?? []
              const evts = layoutMap.get(doc.id) ?? []

              return (
                <div key={doc.id} className="relative flex-1" style={{ borderLeft: `1px solid ${COLORS.columnBorder}` }}>

                  {/* Cell backgrounds */}
                  {SLOTS.map((slot) => {
                    const working = inSchedule(slot.minute, blocks)
                    return (
                      <div
                        key={slot.minute}
                        className="absolute w-full"
                        style={{
                          top: minToPx(slot.minute),
                          height: SLOT_HEIGHT,
                          backgroundColor: working ? COLORS.working : COLORS.nonWorking,
                          cursor: working ? "pointer" : "default",
                        }}
                        onMouseEnter={(e) => { if (working) (e.currentTarget.style.backgroundColor = COLORS.hoverSlot) }}
                        onMouseLeave={(e) => { if (working) (e.currentTarget.style.backgroundColor = COLORS.working) }}
                        onClick={() => working && clickSlot(doc.id, slot.minute)}
                      />
                    )
                  })}

                  {/* Appointment blocks */}
                  {evts.map(({ apt, top, height, left, width }) => (
                    <div
                      key={apt.id}
                      className="absolute z-10 cursor-pointer overflow-hidden rounded-sm bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                      style={{
                        top, height,
                        left: `calc(${left} + 2px)`,
                        width: `calc(${width} - 6px)`,
                        borderLeft: `3px solid ${STATUS_COLOR[apt.status] ?? "#3b82f6"}`,
                      }}
                      onClick={(e) => { e.stopPropagation(); onEventClick(apt.id) }}
                    >
                      <div className="px-1.5 py-0.5">
                        <div className="truncate text-[11px] font-semibold leading-tight text-gray-800">
                          {apt.clinic_patients.last_name}, {apt.clinic_patients.first_name}
                        </div>
                        <div className="truncate text-[10px] leading-tight text-gray-500">
                          {apt.start_time.slice(0, 5)} · {apt.reason || "Appointment"}
                        </div>
                        {apt.is_overbooking && (
                          <div className="text-[9px] font-medium text-purple-600">Entreturno</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          {/* ── Now indicator ── */}
          {showNow && (
            <div
              ref={nowRef}
              className="pointer-events-none absolute z-20"
              style={{ top: minToPx(nowMin), left: TIME_COL_W - 5, right: 0 }}
            >
              <div className="absolute -top-[5px] left-0 h-[10px] w-[10px] rounded-full" style={{ backgroundColor: COLORS.nowLine }} />
              <div className="ml-[7px]" style={{ height: 2, backgroundColor: COLORS.nowLine }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
