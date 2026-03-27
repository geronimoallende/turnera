# Realtime Setup

## Enabled Tables

| Table | Events | Purpose |
|-------|--------|---------|
| `appointments` | INSERT, UPDATE, DELETE | Calendar updates across tabs/users |
| `waitlist` | INSERT, UPDATE | Waitlist changes notification |

## How It Works

1. Supabase Realtime is enabled on the tables above
2. The frontend subscribes filtered by `clinic_id` via `RealtimeProvider`
3. When an appointment is created/updated/deleted, all connected clients for that clinic receive the change
4. The calendar and dashboard auto-refresh without polling

## Frontend Subscription Example

```typescript
// In RealtimeProvider
const channel = supabase
  .channel(`clinic-${clinicId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'appointments',
    filter: `clinic_id=eq.${clinicId}`
  }, (payload) => {
    // Update local state / invalidate React Query cache
  })
  .subscribe()
```

## RLS and Realtime

Realtime respects RLS policies. Users only receive events for rows they have SELECT access to. Since all policies filter by `clinic_id = ANY(get_user_clinic_ids())`, users only see their clinic's events.
