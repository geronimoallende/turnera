# Database Migration

## Running Migrations

```bash
# Push all pending migrations to Supabase
npx supabase db push --project-ref nzozdrakzqhvvmdgkqjh

# Check migration status
npx supabase migration list --project-ref nzozdrakzqhvvmdgkqjh
```

## Creating a New Migration

```bash
# Generate a new migration file
npx supabase migration new <migration_name>

# Edit the file in supabase/migrations/
# Then push
npx supabase db push
```

## Regenerate TypeScript Types

After any schema change:
```bash
npx tsx tools/scripts/generate-types.ts
# or directly:
npx supabase gen types typescript --project-id nzozdrakzqhvvmdgkqjh > src/lib/types/database.ts
```

## Rollback

Supabase migrations are forward-only. To "undo" a migration:
1. Create a new migration that reverses the changes
2. Push the new migration
