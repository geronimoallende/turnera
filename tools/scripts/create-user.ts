/**
 * Create a staff user without entering the Supabase dashboard.
 *
 * This script:
 * 1. Creates a Supabase Auth user (email/password login)
 * 2. Creates a staff record (name, email)
 * 3. Links staff to a clinic with a role (admin/secretary/doctor)
 * 4. If role=doctor, also creates a doctors record (specialty, license)
 *
 * Usage:
 *   npx tsx tools/scripts/create-user.ts \
 *     --email admin@demo.com \
 *     --password demo1234 \
 *     --first-name "Geronimo" \
 *     --last-name "Allende" \
 *     --role admin \
 *     --clinic <clinic_id>
 *
 * For doctors, add:
 *     --specialty "Cardiology" \
 *     --license "MN12345"
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

// Parse CLI arguments
function getArg(name: string, required = true): string {
  const index = process.argv.indexOf(`--${name}`)
  if (index === -1 || index + 1 >= process.argv.length) {
    if (required) {
      console.error(`Missing required argument: --${name}`)
      process.exit(1)
    }
    return ''
  }
  return process.argv[index + 1]
}

async function createUser() {
  const email = getArg('email')
  const password = getArg('password')
  const firstName = getArg('first-name')
  const lastName = getArg('last-name')
  const role = getArg('role') as 'admin' | 'doctor' | 'secretary'
  const clinicId = getArg('clinic')
  const specialty = getArg('specialty', false)
  const license = getArg('license', false)

  if (!['admin', 'doctor', 'secretary'].includes(role)) {
    console.error('Role must be admin, doctor, or secretary')
    process.exit(1)
  }

  console.log(`\nCreating ${role}: ${firstName} ${lastName} (${email})...\n`)

  // 1. Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification
  })

  if (authError) {
    console.error('Auth error:', authError.message)
    process.exit(1)
  }
  console.log(`  ✓ Auth user created (${authData.user.id})`)

  // 2. Create staff record
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .insert({
      auth_user_id: authData.user.id,
      first_name: firstName,
      last_name: lastName,
      email,
    })
    .select()
    .single()

  if (staffError) {
    console.error('Staff error:', staffError.message)
    process.exit(1)
  }
  console.log(`  ✓ Staff record created (${staff.id})`)

  // 3. Link staff to clinic with role
  const { error: linkError } = await supabase
    .from('staff_clinics')
    .insert({
      staff_id: staff.id,
      clinic_id: clinicId,
      role,
    })

  if (linkError) {
    console.error('Link error:', linkError.message)
    process.exit(1)
  }
  console.log(`  ✓ Linked to clinic as ${role}`)

  // 4. If doctor, create doctor record + clinic settings
  if (role === 'doctor') {
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .insert({
        staff_id: staff.id,
        specialty: specialty || null,
        license_number: license || null,
      })
      .select()
      .single()

    if (doctorError) {
      console.error('Doctor error:', doctorError.message)
      process.exit(1)
    }
    console.log(`  ✓ Doctor record created (${doctor.id})`)

    // Create default clinic settings for this doctor
    const { error: settingsError } = await supabase
      .from('doctor_clinic_settings')
      .insert({
        doctor_id: doctor.id,
        clinic_id: clinicId,
        default_slot_duration_minutes: 30,
        max_daily_appointments: 20,
        consultation_fee: 5000,
      })

    if (settingsError) {
      console.error('Settings error:', settingsError.message)
      process.exit(1)
    }
    console.log(`  ✓ Doctor clinic settings created`)
  }

  console.log(`\n✅ User created successfully!`)
  console.log(`   Email: ${email}`)
  console.log(`   Password: ${password}`)
  console.log(`   Role: ${role}`)
  console.log(`   Staff ID: ${staff.id}`)
}

createUser().catch(console.error)
