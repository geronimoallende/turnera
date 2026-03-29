/**
 * Seed script: populates the database with sample data for development.
 *
 * Creates:
 * - 1 clinic ("Clinica Demo")
 * - 5 sample patients (directly in clinic_patients)
 *
 * Run: npx tsx tools/scripts/seed.ts
 *
 * NOTE: Staff/doctors are created via create-user.ts because they need
 * Supabase Auth accounts (email/password).
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load .env.local from project root
dotenv.config({ path: resolve(__dirname, '../../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// Admin client (bypasses RLS) — needed because there's no logged-in user
const supabase = createClient(supabaseUrl, serviceRoleKey)

async function seed() {
  console.log('🌱 Seeding database...\n')

  // 1. Create clinic
  console.log('Creating clinic...')
  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .upsert({
      name: 'Clinica Demo',
      slug: 'clinica-demo',
      address: 'Av. Corrientes 1234, CABA',
      phone: '+5411-4444-5555',
      email: 'info@clinicademo.com',
      timezone: 'America/Argentina/Buenos_Aires',
      business_hours: {
        mon: { start: '08:00', end: '20:00' },
        tue: { start: '08:00', end: '20:00' },
        wed: { start: '08:00', end: '20:00' },
        thu: { start: '08:00', end: '20:00' },
        fri: { start: '08:00', end: '18:00' },
        sat: { start: '09:00', end: '13:00' },
        sun: null,
      },
      cancellation_policy_hours: 24,
      cancellation_fee_amount: 2000,
    }, { onConflict: 'slug' })
    .select()
    .single()

  if (clinicError) {
    console.error('Error creating clinic:', clinicError.message)
    process.exit(1)
  }
  console.log(`  ✓ Clinic: ${clinic.name} (${clinic.id})\n`)

  // 2. Create patients (directly in clinic_patients — no separate patients table)
  console.log('Creating patients...')
  const clinicPatientsData = [
    {
      clinic_id: clinic.id,
      first_name: 'Juan',
      last_name: 'García',
      dni: '20345678',
      date_of_birth: '1985-03-15',
      gender: 'male',
      phone: '+5411-1111-1111',
      email: 'juan.garcia@email.com',
      whatsapp_phone: '+5411-1111-1111',
      insurance_provider: 'OSDE',
      insurance_plan: 'OSDE 310',
      patient_type: 'regular',
      frequency: 'habitual',
    },
    {
      clinic_id: clinic.id,
      first_name: 'María',
      last_name: 'López',
      dni: '27654321',
      date_of_birth: '1990-07-22',
      gender: 'female',
      phone: '+5411-2222-2222',
      email: 'maria.lopez@email.com',
      whatsapp_phone: '+5411-2222-2222',
      insurance_provider: 'Swiss Medical',
      insurance_plan: 'SMG 20',
      patient_type: 'regular',
      frequency: 'sporadic',
    },
    {
      clinic_id: clinic.id,
      first_name: 'Carlos',
      last_name: 'Pérez',
      dni: '30111222',
      date_of_birth: '1978-11-03',
      gender: 'male',
      phone: '+5411-3333-3333',
      email: 'carlos.perez@email.com',
      whatsapp_phone: '+5411-3333-3333',
      insurance_provider: 'OSDE',
      insurance_plan: 'OSDE 210',
      patient_type: 'regular',
      frequency: 'habitual',
    },
    {
      clinic_id: clinic.id,
      first_name: 'Ana',
      last_name: 'Martínez',
      dni: '35222333',
      date_of_birth: '1995-01-10',
      gender: 'female',
      phone: '+5411-4444-4444',
      email: 'ana.martinez@email.com',
      whatsapp_phone: '+5411-4444-4444',
      insurance_provider: 'Particular',
      insurance_plan: null,
      patient_type: 'new',
      frequency: 'first_time',
    },
    {
      clinic_id: clinic.id,
      first_name: 'Roberto',
      last_name: 'Fernández',
      dni: '18999888',
      date_of_birth: '1965-09-28',
      gender: 'male',
      phone: '+5411-5555-5555',
      email: 'roberto.fernandez@email.com',
      whatsapp_phone: '+5411-5555-5555',
      blood_type: 'A+',
      allergies: 'Penicillin',
      insurance_provider: 'Galeno',
      insurance_plan: 'Galeno Azul',
      patient_type: 'regular',
      frequency: 'habitual',
      no_show_count: 2,
      blacklist_status: 'warned' as const,
      tags: ['late_arrivals'],
    },
  ]

  const { data: patients, error: patientsError } = await supabase
    .from('clinic_patients')
    .upsert(clinicPatientsData, { onConflict: 'clinic_id,dni' })
    .select()

  if (patientsError) {
    console.error('Error creating patients:', patientsError.message)
    process.exit(1)
  }

  for (const p of patients) {
    console.log(`  ✓ Patient: ${p.first_name} ${p.last_name} (DNI: ${p.dni})`)
  }
  console.log(`  → ${patients.length} patients linked to ${clinic.name}`)

  console.log('\n✅ Seed complete!')
  console.log(`\nClinic ID: ${clinic.id}`)
  console.log('Use this ID with create-user.ts to add staff members.')
}

seed().catch(console.error)
