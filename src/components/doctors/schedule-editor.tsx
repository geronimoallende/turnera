/**
 * ScheduleEditor — weekly schedule management for a doctor.
 *
 * Shows time blocks grouped by day of week. Each row displays
 * start/end time, slot duration, active status, and a delete button.
 * The "+ Add Time Block" button opens an inline form.
 *
 * Editable by admin and the doctor themselves. Read-only for secretary.
 */

"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Plus } from "lucide-react"
import type { ScheduleBlock } from "@/lib/hooks/use-doctors"

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const addBlockSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().min(1, "Required"),
  end_time: z.string().min(1, "Required"),
  slot_duration_minutes: z.number().int().min(5).max(120).optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
})

type AddBlockFormData = z.infer<typeof addBlockSchema>

type Props = {
  schedules: ScheduleBlock[]
  canEdit: boolean
  isCreating: boolean
  createError?: string | null
  onAdd: (data: AddBlockFormData) => void
  onDelete: (scheduleId: string) => void
  defaultSlotDuration: number
}

export function ScheduleEditor({
  schedules,
  canEdit,
  isCreating,
  createError,
  onAdd,
  onDelete,
  defaultSlotDuration,
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddBlockFormData>({
    resolver: zodResolver(addBlockSchema),
    defaultValues: {
      slot_duration_minutes: defaultSlotDuration,
      valid_from: new Date().toISOString().split("T")[0],
    },
  })

  function handleAdd(data: AddBlockFormData) {
    onAdd(data)
    reset()
    setShowAddForm(false)
  }

  // Group schedules by day_of_week
  const byDay = new Map<number, ScheduleBlock[]>()
  for (const s of schedules) {
    const existing = byDay.get(s.day_of_week) ?? []
    existing.push(s)
    byDay.set(s.day_of_week, existing)
  }

  // Display order: Mon(1), Tue(2), ..., Sat(6), Sun(0)
  const dayOrder = [1, 2, 3, 4, 5, 6, 0]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1a1a1a]">Weekly Schedule</h2>
        {canEdit && !showAddForm && (
          <Button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 shadow-none hover:bg-blue-600"
            size="sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Time Block
          </Button>
        )}
      </div>

      {/* Schedule table */}
      <div className="overflow-hidden rounded-md border border-[#e5e5e5] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e5e5] bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="px-4 py-2.5">Day</th>
              <th className="px-4 py-2.5">Start</th>
              <th className="px-4 py-2.5">End</th>
              <th className="px-4 py-2.5">Slot Duration</th>
              <th className="px-4 py-2.5">Active</th>
              {canEdit && <th className="px-4 py-2.5 w-16"></th>}
            </tr>
          </thead>
          <tbody>
            {dayOrder.map((day) => {
              const blocks = byDay.get(day)
              if (!blocks || blocks.length === 0) {
                return (
                  <tr key={day} className="border-b border-[#e5e5e5] last:border-b-0">
                    <td className="px-4 py-2.5 font-medium text-[#1a1a1a]">
                      {DAY_NAMES[day]}
                    </td>
                    <td colSpan={canEdit ? 5 : 4} className="px-4 py-2.5 text-gray-400 italic">
                      No schedule configured
                    </td>
                  </tr>
                )
              }
              return blocks.map((block, idx) => (
                <tr
                  key={block.id}
                  className="border-b border-[#e5e5e5] last:border-b-0"
                >
                  <td className="px-4 py-2.5 font-medium text-[#1a1a1a]">
                    {idx === 0 ? DAY_NAMES[day] : ""}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {block.start_time.slice(0, 5)}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {block.end_time.slice(0, 5)}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {block.slot_duration_minutes} min
                  </td>
                  <td className="px-4 py-2.5">
                    {block.is_active ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => onDelete(block.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete schedule block"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            })}
          </tbody>
        </table>
      </div>

      {/* Add Time Block form */}
      {showAddForm && canEdit && (
        <div className="rounded-md border border-[#e5e5e5] bg-white p-4">
          <h3 className="mb-3 text-sm font-medium text-[#1a1a1a]">
            New Time Block
          </h3>
          <form onSubmit={handleSubmit(handleAdd)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">Day *</Label>
                <select
                  {...register("day_of_week", { valueAsNumber: true })}
                  className="flex h-9 w-full rounded-md border border-[#e5e5e5] bg-transparent px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                >
                  {dayOrder.map((d) => (
                    <option key={d} value={d}>{DAY_NAMES[d]}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">Start time *</Label>
                <Input
                  type="time"
                  {...register("start_time")}
                  className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
                />
                {errors.start_time && (
                  <p className="text-xs text-red-600">{errors.start_time.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">End time *</Label>
                <Input
                  type="time"
                  {...register("end_time")}
                  className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
                />
                {errors.end_time && (
                  <p className="text-xs text-red-600">{errors.end_time.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">Slot Duration (min)</Label>
                <select
                  {...register("slot_duration_minutes", { valueAsNumber: true })}
                  className="flex h-9 w-full rounded-md border border-[#e5e5e5] bg-transparent px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                >
                  {[15, 20, 30, 45, 60].map((min) => (
                    <option key={min} value={min}>{min} min</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">Valid from</Label>
                <Input
                  type="date"
                  {...register("valid_from")}
                  className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">Valid until</Label>
                <Input
                  type="date"
                  {...register("valid_until")}
                  placeholder="Indefinite"
                  className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
                />
              </div>
            </div>

            {createError && (
              <p className="text-sm text-red-600">{createError}</p>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-blue-500 shadow-none hover:bg-blue-600"
                size="sm"
              >
                {isCreating ? "Adding..." : "Add Block"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#e5e5e5] shadow-none"
                onClick={() => { setShowAddForm(false); reset() }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
