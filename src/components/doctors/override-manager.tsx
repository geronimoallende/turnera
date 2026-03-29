/**
 * OverrideManager — manages one-off schedule exceptions.
 *
 * Shows a table of upcoming overrides with date, type (block/available),
 * time range, reason, and delete button.
 * "+ Add Override" button opens an inline form.
 */

"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus } from "lucide-react"
import type { ScheduleOverride } from "@/lib/hooks/use-doctors"

const addOverrideSchema = z.object({
  override_date: z.string().min(1, "Date is required"),
  override_type: z.enum(["block", "available"]),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  reason: z.string().optional(),
})

type AddOverrideFormData = z.infer<typeof addOverrideSchema>

type Props = {
  overrides: ScheduleOverride[]
  canEdit: boolean
  isCreating: boolean
  createError?: string | null
  onAdd: (data: AddOverrideFormData) => void
  onDelete: (overrideId: string) => void
}

export function OverrideManager({
  overrides,
  canEdit,
  isCreating,
  createError,
  onAdd,
  onDelete,
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddOverrideFormData>({
    resolver: zodResolver(addOverrideSchema),
    defaultValues: { override_type: "block" },
  })

  function handleAdd(data: AddOverrideFormData) {
    onAdd({
      ...data,
      start_time: data.start_time || undefined,
      end_time: data.end_time || undefined,
      reason: data.reason || undefined,
    })
    reset()
    setShowAddForm(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1a1a1a]">Schedule Overrides</h2>
        {canEdit && !showAddForm && (
          <Button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 shadow-none hover:bg-blue-600"
            size="sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Override
          </Button>
        )}
      </div>

      {/* Overrides table */}
      {overrides.length === 0 ? (
        <div className="rounded-md border border-[#e5e5e5] bg-white p-8 text-center text-sm text-gray-500">
          No upcoming overrides.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-[#e5e5e5] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e5e5] bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Time Range</th>
                <th className="px-4 py-2.5">Reason</th>
                {canEdit && <th className="px-4 py-2.5 w-16"></th>}
              </tr>
            </thead>
            <tbody>
              {overrides.map((ov) => (
                <tr
                  key={ov.id}
                  className="border-b border-[#e5e5e5] last:border-b-0"
                >
                  <td className="px-4 py-2.5 font-medium text-[#1a1a1a]">
                    {ov.override_date}
                  </td>
                  <td className="px-4 py-2.5">
                    {ov.override_type === "block" ? (
                      <Badge className="bg-red-50 text-red-600 shadow-none hover:bg-red-50">
                        Block
                      </Badge>
                    ) : (
                      <Badge className="bg-green-50 text-green-600 shadow-none hover:bg-green-50">
                        Available
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {ov.start_time && ov.end_time
                      ? `${ov.start_time.slice(0, 5)} - ${ov.end_time.slice(0, 5)}`
                      : "Full day"}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {ov.reason ?? "—"}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => onDelete(ov.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete override"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Override form */}
      {showAddForm && canEdit && (
        <div className="rounded-md border border-[#e5e5e5] bg-white p-4">
          <h3 className="mb-3 text-sm font-medium text-[#1a1a1a]">
            New Override
          </h3>
          <form onSubmit={handleSubmit(handleAdd)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">Date *</Label>
                <Input
                  type="date"
                  {...register("override_date")}
                  className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
                />
                {errors.override_date && (
                  <p className="text-xs text-red-600">{errors.override_date.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">Type *</Label>
                <select
                  {...register("override_type")}
                  className="flex h-9 w-full rounded-md border border-[#e5e5e5] bg-transparent px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                >
                  <option value="block">Block (not available)</option>
                  <option value="available">Available (extra hours)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">Reason</Label>
                <Input
                  {...register("reason")}
                  placeholder="Vacation, Conference, etc."
                  className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">Start time</Label>
                <Input
                  type="time"
                  {...register("start_time")}
                  className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
                />
                <p className="text-xs text-gray-400">Leave empty for full day</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">End time</Label>
                <Input
                  type="time"
                  {...register("end_time")}
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
                {isCreating ? "Adding..." : "Add Override"}
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
