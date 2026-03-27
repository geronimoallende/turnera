# New Clinic Onboarding

## Steps

1. **Create clinic record**
   ```bash
   npx tsx tools/scripts/create-clinic.ts --name "Clinica Salud" --address "Av. Corrientes 1234" --phone "+5411..." --email "admin@clinicasalud.com"
   ```

2. **Create admin user**
   ```bash
   npx tsx tools/scripts/create-user.ts --email admin@clinicasalud.com --role admin --clinic <clinic_id>
   ```

3. **Create doctor users**
   ```bash
   npx tsx tools/scripts/create-user.ts --email dr.martinez@clinicasalud.com --role doctor --clinic <clinic_id> --specialty "Cardiology" --license "MN12345"
   ```

4. **Create secretary user**
   ```bash
   npx tsx tools/scripts/create-user.ts --email secretaria@clinicasalud.com --role secretary --clinic <clinic_id>
   ```

5. **Set up n8n workflows** (per-clinic)
   - Duplicate CB-6 template workflow in n8n
   - Update webhook URL and WhatsApp number
   - Save webhook URL to `clinics.n8n_webhook_url`

6. **Configure business hours**
   - Admin logs in → Settings → Business Hours

7. **Test**
   - Admin logs in, verifies dashboard
   - Secretary creates a test patient and appointment
   - Doctor views their calendar
