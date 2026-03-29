export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      appointment_history: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          appointment_id: string
          clinic_id: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          performed_by: string | null
          performed_by_source: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          appointment_id: string
          clinic_id: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          performed_by_source?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          appointment_id?: string
          clinic_id?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          performed_by_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_history_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          actual_duration_minutes: number | null
          appointment_date: string
          cancellation_fee_applied: boolean | null
          cancellation_reason: string | null
          cancelled_at: string | null
          checked_in_at: string | null
          clinic_id: string
          completed_at: string | null
          confirmation_sent_at: string | null
          confirmed_at: string | null
          created_at: string | null
          created_by: string | null
          doctor_id: string
          doctor_notes: string | null
          duration_minutes: number
          end_time: string
          id: string
          insurance_auth_status:
            | Database["public"]["Enums"]["insurance_auth_status"]
            | null
          internal_notes: string | null
          invoice_number: string | null
          is_emergency: boolean | null
          is_invoiced: boolean | null
          is_overbooking: boolean | null
          modality: Database["public"]["Enums"]["appointment_modality"]
          patient_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_updated_at: string | null
          payment_updated_by: string | null
          pre_consultation_instructions: string | null
          reason: string | null
          recurrence_parent_id: string | null
          recurrence_rule: string | null
          reminder_24h_sent_at: string | null
          reminder_sameday_sent_at: string | null
          rescheduled_from_id: string | null
          rescheduled_to_id: string | null
          source: Database["public"]["Enums"]["appointment_source"]
          start_time: string
          started_at: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string | null
        }
        Insert: {
          actual_duration_minutes?: number | null
          appointment_date: string
          cancellation_fee_applied?: boolean | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          checked_in_at?: string | null
          clinic_id: string
          completed_at?: string | null
          confirmation_sent_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          doctor_id: string
          doctor_notes?: string | null
          duration_minutes?: number
          end_time: string
          id?: string
          insurance_auth_status?:
            | Database["public"]["Enums"]["insurance_auth_status"]
            | null
          internal_notes?: string | null
          invoice_number?: string | null
          is_emergency?: boolean | null
          is_invoiced?: boolean | null
          is_overbooking?: boolean | null
          modality?: Database["public"]["Enums"]["appointment_modality"]
          patient_id: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_updated_at?: string | null
          payment_updated_by?: string | null
          pre_consultation_instructions?: string | null
          reason?: string | null
          recurrence_parent_id?: string | null
          recurrence_rule?: string | null
          reminder_24h_sent_at?: string | null
          reminder_sameday_sent_at?: string | null
          rescheduled_from_id?: string | null
          rescheduled_to_id?: string | null
          source?: Database["public"]["Enums"]["appointment_source"]
          start_time: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string | null
        }
        Update: {
          actual_duration_minutes?: number | null
          appointment_date?: string
          cancellation_fee_applied?: boolean | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          checked_in_at?: string | null
          clinic_id?: string
          completed_at?: string | null
          confirmation_sent_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          doctor_id?: string
          doctor_notes?: string | null
          duration_minutes?: number
          end_time?: string
          id?: string
          insurance_auth_status?:
            | Database["public"]["Enums"]["insurance_auth_status"]
            | null
          internal_notes?: string | null
          invoice_number?: string | null
          is_emergency?: boolean | null
          is_invoiced?: boolean | null
          is_overbooking?: boolean | null
          modality?: Database["public"]["Enums"]["appointment_modality"]
          patient_id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_updated_at?: string | null
          payment_updated_by?: string | null
          pre_consultation_instructions?: string | null
          reason?: string | null
          recurrence_parent_id?: string | null
          recurrence_rule?: string | null
          reminder_24h_sent_at?: string | null
          reminder_sameday_sent_at?: string | null
          rescheduled_from_id?: string | null
          rescheduled_to_id?: string | null
          source?: Database["public"]["Enums"]["appointment_source"]
          start_time?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinic_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_payment_updated_by_fkey"
            columns: ["payment_updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_rescheduled_from_id_fkey"
            columns: ["rescheduled_from_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_rescheduled_to_id_fkey"
            columns: ["rescheduled_to_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_patients: {
        Row: {
          allergies: string | null
          blacklist_status: Database["public"]["Enums"]["blacklist_status"]
          blood_type: string | null
          clinic_id: string
          created_at: string | null
          date_of_birth: string | null
          dni: string | null
          email: string | null
          financial_status: string | null
          first_name: string
          frequency: string | null
          gender: string | null
          id: string
          insurance_member_number: string | null
          insurance_plan: string | null
          insurance_provider: string | null
          is_active: boolean | null
          last_name: string
          no_show_count: number
          notes: string | null
          patient_type: string | null
          phone: string | null
          priority: string | null
          tags: string[] | null
          updated_at: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          allergies?: string | null
          blacklist_status?: Database["public"]["Enums"]["blacklist_status"]
          blood_type?: string | null
          clinic_id: string
          created_at?: string | null
          date_of_birth?: string | null
          dni?: string | null
          email?: string | null
          financial_status?: string | null
          first_name: string
          frequency?: string | null
          gender?: string | null
          id?: string
          insurance_member_number?: string | null
          insurance_plan?: string | null
          insurance_provider?: string | null
          is_active?: boolean | null
          last_name: string
          no_show_count?: number
          notes?: string | null
          patient_type?: string | null
          phone?: string | null
          priority?: string | null
          tags?: string[] | null
          updated_at?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          allergies?: string | null
          blacklist_status?: Database["public"]["Enums"]["blacklist_status"]
          blood_type?: string | null
          clinic_id?: string
          created_at?: string | null
          date_of_birth?: string | null
          dni?: string | null
          email?: string | null
          financial_status?: string | null
          first_name?: string
          frequency?: string | null
          gender?: string | null
          id?: string
          insurance_member_number?: string | null
          insurance_plan?: string | null
          insurance_provider?: string | null
          is_active?: boolean | null
          last_name?: string
          no_show_count?: number
          notes?: string | null
          patient_type?: string | null
          phone?: string | null
          priority?: string | null
          tags?: string[] | null
          updated_at?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          business_hours: Json | null
          cancellation_fee_amount: number | null
          cancellation_policy_hours: number | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          max_booking_days_ahead: number
          min_booking_hours_ahead: number
          n8n_webhook_secret: string | null
          n8n_webhook_url: string | null
          name: string
          phone: string | null
          slug: string
          timezone: string
          updated_at: string | null
          whatsapp_business_id: string | null
          whatsapp_number: string | null
          whatsapp_phone_number_id: string | null
          whatsapp_waba_id: string | null
        }
        Insert: {
          address?: string | null
          business_hours?: Json | null
          cancellation_fee_amount?: number | null
          cancellation_policy_hours?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_booking_days_ahead?: number
          min_booking_hours_ahead?: number
          n8n_webhook_secret?: string | null
          n8n_webhook_url?: string | null
          name: string
          phone?: string | null
          slug: string
          timezone?: string
          updated_at?: string | null
          whatsapp_business_id?: string | null
          whatsapp_number?: string | null
          whatsapp_phone_number_id?: string | null
          whatsapp_waba_id?: string | null
        }
        Update: {
          address?: string | null
          business_hours?: Json | null
          cancellation_fee_amount?: number | null
          cancellation_policy_hours?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_booking_days_ahead?: number
          min_booking_hours_ahead?: number
          n8n_webhook_secret?: string | null
          n8n_webhook_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          timezone?: string
          updated_at?: string | null
          whatsapp_business_id?: string | null
          whatsapp_number?: string | null
          whatsapp_phone_number_id?: string | null
          whatsapp_waba_id?: string | null
        }
        Relationships: []
      }
      doctor_clinic_settings: {
        Row: {
          allows_overbooking: boolean | null
          clinic_id: string
          consultation_fee: number | null
          created_at: string | null
          default_slot_duration_minutes: number
          doctor_id: string
          id: string
          is_active: boolean | null
          max_daily_appointments: number | null
          max_overbooking_slots: number | null
          updated_at: string | null
          virtual_enabled: boolean | null
          virtual_link: string | null
        }
        Insert: {
          allows_overbooking?: boolean | null
          clinic_id: string
          consultation_fee?: number | null
          created_at?: string | null
          default_slot_duration_minutes?: number
          doctor_id: string
          id?: string
          is_active?: boolean | null
          max_daily_appointments?: number | null
          max_overbooking_slots?: number | null
          updated_at?: string | null
          virtual_enabled?: boolean | null
          virtual_link?: string | null
        }
        Update: {
          allows_overbooking?: boolean | null
          clinic_id?: string
          consultation_fee?: number | null
          created_at?: string | null
          default_slot_duration_minutes?: number
          doctor_id?: string
          id?: string
          is_active?: boolean | null
          max_daily_appointments?: number | null
          max_overbooking_slots?: number | null
          updated_at?: string | null
          virtual_enabled?: boolean | null
          virtual_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_clinic_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_clinic_settings_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_schedules: {
        Row: {
          clinic_id: string
          created_at: string | null
          day_of_week: number
          doctor_id: string
          end_time: string
          id: string
          is_active: boolean | null
          slot_duration_minutes: number
          start_time: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          day_of_week: number
          doctor_id: string
          end_time: string
          id?: string
          is_active?: boolean | null
          slot_duration_minutes?: number
          start_time: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          day_of_week?: number
          doctor_id?: string
          end_time?: string
          id?: string
          is_active?: boolean | null
          slot_duration_minutes?: number
          start_time?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_schedules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_schedules_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          created_at: string | null
          id: string
          license_number: string | null
          specialty: string | null
          staff_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          license_number?: string | null
          specialty?: string | null
          staff_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          license_number?: string | null
          specialty?: string | null
          staff_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      documents_pg: {
        Row: {
          embedding: string | null
          id: string
          metadata: Json | null
          text: string | null
        }
        Insert: {
          embedding?: string | null
          id?: string
          metadata?: Json | null
          text?: string | null
        }
        Update: {
          embedding?: string | null
          id?: string
          metadata?: Json | null
          text?: string | null
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          appointment_id: string
          channel: Database["public"]["Enums"]["reminder_channel"]
          clinic_id: string
          created_at: string | null
          delivered_at: string | null
          failed_reason: string | null
          id: string
          patient_id: string
          read_at: string | null
          reminder_type: Database["public"]["Enums"]["reminder_type"]
          response: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["reminder_status"]
          updated_at: string | null
        }
        Insert: {
          appointment_id: string
          channel?: Database["public"]["Enums"]["reminder_channel"]
          clinic_id: string
          created_at?: string | null
          delivered_at?: string | null
          failed_reason?: string | null
          id?: string
          patient_id: string
          read_at?: string | null
          reminder_type: Database["public"]["Enums"]["reminder_type"]
          response?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string
          channel?: Database["public"]["Enums"]["reminder_channel"]
          clinic_id?: string
          created_at?: string | null
          delivered_at?: string | null
          failed_reason?: string | null
          id?: string
          patient_id?: string
          read_at?: string | null
          reminder_type?: Database["public"]["Enums"]["reminder_type"]
          response?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinic_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_overrides: {
        Row: {
          clinic_id: string
          created_at: string | null
          doctor_id: string
          end_time: string | null
          id: string
          override_date: string
          override_type: Database["public"]["Enums"]["override_type"]
          reason: string | null
          start_time: string | null
          updated_at: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          doctor_id: string
          end_time?: string | null
          id?: string
          override_date: string
          override_type?: Database["public"]["Enums"]["override_type"]
          reason?: string | null
          start_time?: string | null
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          doctor_id?: string
          end_time?: string | null
          id?: string
          override_date?: string
          override_type?: Database["public"]["Enums"]["override_type"]
          reason?: string | null
          start_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_overrides_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_overrides_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          auth_user_id: string
          created_at: string | null
          email: string
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id: string
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_clinics: {
        Row: {
          clinic_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["staff_role"]
          staff_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role: Database["public"]["Enums"]["staff_role"]
          staff_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["staff_role"]
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_clinics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_clinics_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          clinic_id: string
          created_at: string | null
          doctor_id: string | null
          id: string
          notes: string | null
          offered_appointment_id: string | null
          offered_at: string | null
          patient_id: string
          preferred_date_end: string | null
          preferred_date_start: string | null
          preferred_time_end: string | null
          preferred_time_start: string | null
          status: Database["public"]["Enums"]["waitlist_status"]
          updated_at: string | null
          urgency: Database["public"]["Enums"]["waitlist_urgency"]
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          offered_appointment_id?: string | null
          offered_at?: string | null
          patient_id: string
          preferred_date_end?: string | null
          preferred_date_start?: string | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          status?: Database["public"]["Enums"]["waitlist_status"]
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["waitlist_urgency"]
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          offered_appointment_id?: string | null
          offered_at?: string | null
          patient_id?: string
          preferred_date_end?: string | null
          preferred_date_start?: string | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          status?: Database["public"]["Enums"]["waitlist_status"]
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["waitlist_urgency"]
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_offered_appointment_id_fkey"
            columns: ["offered_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinic_patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_available_slots: {
        Args: { p_clinic_id: string; p_date: string; p_doctor_id: string }
        Returns: {
          existing_appointment_id: string
          is_available: boolean
          slot_end: string
          slot_start: string
        }[]
      }
      get_user_clinic_ids: { Args: never; Returns: string[] }
      get_user_role: {
        Args: { p_clinic_id: string }
        Returns: Database["public"]["Enums"]["staff_role"]
      }
    }
    Enums: {
      appointment_modality: "in_person" | "virtual"
      appointment_source:
        | "web"
        | "phone"
        | "whatsapp"
        | "chatbot"
        | "walk_in"
        | "manual"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "arrived"
        | "in_progress"
        | "completed"
        | "no_show"
        | "cancelled_patient"
        | "cancelled_doctor"
        | "rescheduled"
      audit_action:
        | "created"
        | "confirmed"
        | "cancelled"
        | "rescheduled"
        | "status_changed"
        | "payment_changed"
        | "updated"
      blacklist_status: "none" | "warned" | "blacklisted"
      insurance_auth_status: "pending" | "approved" | "denied" | "not_required"
      override_type: "block" | "available"
      payment_status: "pending" | "paid" | "partial" | "waived"
      reminder_channel: "whatsapp" | "email" | "sms"
      reminder_status: "pending" | "sent" | "delivered" | "read" | "failed"
      reminder_type:
        | "confirmation_request"
        | "reminder_24h"
        | "reminder_sameday"
        | "post_consultation"
        | "custom"
      staff_role: "admin" | "doctor" | "secretary"
      waitlist_status:
        | "waiting"
        | "offered"
        | "booked"
        | "expired"
        | "cancelled"
      waitlist_urgency: "urgent" | "standard" | "flexible"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_modality: ["in_person", "virtual"],
      appointment_source: [
        "web",
        "phone",
        "whatsapp",
        "chatbot",
        "walk_in",
        "manual",
      ],
      appointment_status: [
        "scheduled",
        "confirmed",
        "arrived",
        "in_progress",
        "completed",
        "no_show",
        "cancelled_patient",
        "cancelled_doctor",
        "rescheduled",
      ],
      audit_action: [
        "created",
        "confirmed",
        "cancelled",
        "rescheduled",
        "status_changed",
        "payment_changed",
        "updated",
      ],
      blacklist_status: ["none", "warned", "blacklisted"],
      insurance_auth_status: ["pending", "approved", "denied", "not_required"],
      override_type: ["block", "available"],
      payment_status: ["pending", "paid", "partial", "waived"],
      reminder_channel: ["whatsapp", "email", "sms"],
      reminder_status: ["pending", "sent", "delivered", "read", "failed"],
      reminder_type: [
        "confirmation_request",
        "reminder_24h",
        "reminder_sameday",
        "post_consultation",
        "custom",
      ],
      staff_role: ["admin", "doctor", "secretary"],
      waitlist_status: ["waiting", "offered", "booked", "expired", "cancelled"],
      waitlist_urgency: ["urgent", "standard", "flexible"],
    },
  },
} as const
