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

5. **Connect WhatsApp via YCloud BSP**
   - Set up clinic's WhatsApp number in YCloud
   - Save `whatsapp_number` and BSP credentials in `clinics` table
   - Update `whatsapp_status` to `'connected'`

6. **Sync clinic data for RAG**
   - Trigger embedding sync: `POST https://ai.turnera.app/internal/embeddings/sync` with clinic_id
   - Add clinic FAQs via admin panel (services, insurance, preparation instructions)

7. **Configure business hours**
   - Admin logs in → Settings → Business Hours

7. **Test**
   - Admin logs in, verifies dashboard
   - Secretary creates a test patient and appointment
   - Doctor views their calendar
