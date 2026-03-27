# Deploy to Vercel

## Prerequisites
- GitHub repo connected to Vercel
- Environment variables set in Vercel dashboard

## Process
1. Commit changes to `main` branch
2. Push to GitHub: `git push origin main`
3. Vercel auto-deploys on push
4. Check deployment status at vercel.com dashboard

## Environment Variables (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=https://nzozdrakzqhvvmdgkqjh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

## Database Migrations
Migrations are NOT auto-deployed. Run manually:
```bash
npx supabase db push --project-ref nzozdrakzqhvvmdgkqjh
```
