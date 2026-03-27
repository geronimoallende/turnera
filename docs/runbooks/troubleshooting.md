# Troubleshooting

## Common Issues

### "Permission denied" on queries
- **Cause**: RLS policy blocking the query
- **Check**: Is the user linked to the clinic via `staff_clinics`? Is `is_active = true`?
- **Debug**: Run query with `service_role` key to bypass RLS and confirm data exists

### Doctor can't change payment status
- **Expected behavior**: Only admin/secretary can change `payment_status`
- **Enforced by**: `check_payment_update()` trigger on `appointments`

### Patient appears twice
- **Cause**: Created with different DNI or DNI was empty
- **Fix**: Merge patient records manually. Update appointments to point to the correct patient_id.

### Appointment overlap error
- **Cause**: `check_appointment_overlap()` trigger prevents double-booking
- **If intentional**: Set `is_overbooking = true` on the appointment

### Realtime not updating
- **Check**: Is Realtime enabled on the table? (`014_enable_realtime.sql`)
- **Check**: Is the subscription filtering by the correct `clinic_id`?
- **Check**: Browser console for WebSocket errors

### n8n webhook returns 401
- **Check**: Is the `x-webhook-secret` header correct?
- **Check**: Is the clinic's `n8n_webhook_url` correctly set?
