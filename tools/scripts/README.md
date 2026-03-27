# Tools & Scripts

## Usage

All scripts require the `.env.local` file with Supabase credentials.

### seed.ts
Populate the database with sample data for development.
```bash
npx tsx tools/scripts/seed.ts
```
Creates: 1 clinic, 3 doctors, 50 patients, 200 appointments across 30 days.

### create-user.ts
Create a staff user without manual DB access.
```bash
npx tsx tools/scripts/create-user.ts --email doc@clinic.com --role doctor --clinic <clinic_id> --specialty "Cardiology" --license "MN12345"
```

### create-clinic.ts
Onboard a new clinic tenant.
```bash
npx tsx tools/scripts/create-clinic.ts --name "Clinica Salud" --address "Av. Corrientes 1234"
```

### reset-db.ts
Reset dev database to clean state (drops all turnera tables and re-runs migrations).
```bash
npx tsx tools/scripts/reset-db.ts
```
**WARNING**: Destructive. Dev only.

### generate-types.ts
Regenerate Supabase TypeScript types from the database schema.
```bash
npx tsx tools/scripts/generate-types.ts
```
