export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  confirmed: "#3b82f6",
  arrived: "#22c55e",
  in_progress: "#15803d",
  completed: "#6b7280",
  no_show: "#ef4444",
  cancelled_patient: "#6b7280",
  cancelled_doctor: "#6b7280",
  cancelled_clinic: "#6b7280",
  rescheduled: "#6b7280",
  otorgado: "#f59e0b",
  scheduled: "#3b82f6",
}

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  arrived: "Arrived",
  in_progress: "In progress",
  completed: "Completed",
  no_show: "No show",
  cancelled_patient: "Cancelled (patient)",
  cancelled_doctor: "Cancelled (doctor)",
  cancelled_clinic: "Cancelled (clinic)",
  rescheduled: "Rescheduled",
  otorgado: "Pending confirmation",
  scheduled: "Scheduled",
}

export const VALID_TRANSITIONS: Record<string, string[]> = {
  confirmed: [
    "arrived",
    "cancelled_patient",
    "cancelled_doctor",
    "cancelled_clinic",
    "rescheduled",
    "no_show",
  ],
  arrived: ["in_progress", "cancelled_patient", "no_show"],
  in_progress: ["completed"],
}

export function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export const TERMINAL_STATUSES = [
  "completed",
  "no_show",
  "cancelled_patient",
  "cancelled_doctor",
  "cancelled_clinic",
  "rescheduled",
]

export const FADED_STATUSES = [
  "completed",
  "no_show",
  "cancelled_patient",
  "cancelled_doctor",
  "cancelled_clinic",
  "rescheduled",
]

export const CONSULTATION_TYPES = [
  { value: "consultation", label: "Consultation" },
  { value: "follow_up", label: "Follow-up" },
  { value: "procedure", label: "Procedure" },
  { value: "emergency", label: "Emergency" },
]

export const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
]

export const DOCTOR_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#059669",
  "#d97706",
  "#dc2626",
  "#0891b2",
  "#7c3aed",
  "#db2777",
]
