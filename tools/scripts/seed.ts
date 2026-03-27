/**
 * Seed script: populates the database with sample data for development.
 *
 * Creates:
 * - 1 clinic ("Clinica Demo")
 * - 5 sample patients with clinic_patients links
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

  // 2. Create patients
  console.log('Creating patients...')
  const patientsData = [
    {
      first_name: 'Juan',
      last_name: 'García',
      dni: '20345678',
      date_of_birth: '1985-03-15',
      gender: 'male',
      phone: '+5411-1111-1111',
      email: 'juan.garcia@email.com',
      whatsapp_phone: '+5411-1111-1111',
    },
    {
      first_name: 'María',
      last_name: 'López',
      dni: '27654321',
      date_of_birth: '1990-07-22',
      gender: 'female',
      phone: '+5411-2222-2222',
      email: 'maria.lopez@email.com',
      whatsapp_phone: '+5411-2222-2222',
    },
    {
      first_name: 'Carlos',
      last_name: 'Pérez',
      dni: '30111222',
      date_of_birth: '1978-11-03',
      gender: 'male',
      phone: '+5411-3333-3333',
      email: 'carlos.perez@email.com',
      whatsapp_phone: '+5411-3333-3333',
    },
    {
      first_name: 'Ana',
      last_name: 'Martínez',
      dni: '35222333',
      date_of_birth: '1995-01-10',
      gender: 'female',
      phone: '+5411-4444-4444',
      email: 'ana.martinez@email.com',
      whatsapp_phone: '+5411-4444-4444',
    },
    {
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
    },
  ]

  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .upsert(patientsData, { onConflict: 'dni' })
    .select()

  if (patientsError) {
    console.error('Error creating patients:', patientsError.message)
    process.exit(1)
  }

  for (const p of patients) {
    console.log(`  ✓ Patient: ${p.first_name} ${p.last_name} (DNI: ${p.dni})`)
  }

  // 3. Link patients to clinic with per-clinic metadata
  console.log('\nLinking patients to clinic...')
  const clinicPatientsData = patients.map((patient, i) => ({
    clinic_id: clinic.id,
    patient_id: patient.id,
    insurance_provider: ['OSDE', 'Swiss Medical', 'OSDE', 'Particular', 'Galeno'][i],
    insurance_plan: ['OSDE 310', 'SMG 20', 'OSDE 210', null, 'Galeno Azul'][i],
    patient_type: ['regular', 'regular', 'regular', 'new', 'regular'][i],
    frequency: ['habitual', 'sporadic', 'habitual', 'first_time', 'habitual'][i],
    // Roberto has 2 no-shows and a warning
    no_show_count: i === 4 ? 2 : 0,
    blacklist_status: (i === 4 ? 'warned' : 'none') as 'warned' | 'none',
    tags: i === 4 ? ['late_arrivals'] : [],
  }))

  const { error: linkError } = await supabase
    .from('clinic_patients')
    .upsert(clinicPatientsData, { onConflict: 'clinic_id,patient_id' })

  if (linkError) {
    console.error('Error linking patients:', linkError.message)
    process.exit(1)
  }
  console.log(`  ✓ Linked ${patients.length} patients to ${clinic.name}`)

  console.log('\n✅ Seed complete!')
  console.log(`\nClinic ID: ${clinic.id}`)
  console.log('Use this ID with create-user.ts to add staff members.')
}

seed().catch(console.error)
