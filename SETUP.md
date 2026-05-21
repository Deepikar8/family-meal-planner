# Setup Guide — Family Meal Planner

This app is a mobile-first Next.js/Supabase PWA for weekly family dinner planning.

## 1. Install Dependencies

```bash
npm install
```

## 2. Create Supabase Project

1. Create a project at [supabase.com](https://supabase.com).
2. Copy these values from **Project Settings → API**:
   - Project URL
   - anon public key
   - service_role key

The service-role key is server-only. It is required for public shared plan links and calendar feeds.

## 3. Configure Google Auth

In Google Cloud, create an OAuth 2.0 Web application client.

Add this Google authorized redirect URI:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

In Supabase **Authentication → Providers**, enable Google and paste the client ID/secret.

In Supabase **Authentication → URL Configuration**, add redirect URLs:

```text
http://localhost:3000/auth/callback
https://YOUR_DEPLOYED_DOMAIN/auth/callback
```

## 4. Apply Database Schema

Run the checked-in migration in Supabase SQL Editor:

```sql
-- paste the contents of:
-- supabase/migrations/20260521000000_current_app_schema.sql
```

Or, if using the Supabase CLI:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The migration creates:

- `profiles`
- `meal_plans`
- `meal_ratings`
- `saved_recipes`
- `curated_recipes`
- indexes, uniqueness constraints, and RLS policies

## 5. Environment Variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-api03-...
RESEND_API_KEY=re_...
CRON_SECRET=generate-a-long-random-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For deployed environments, set `NEXT_PUBLIC_APP_URL` to the production URL.

## 6. Seed Curated Recipes

After applying the schema and setting env vars:

```bash
npx tsx scripts/seed-recipe-library.ts
```

This populates `curated_recipes`, which powers the Browse tab and will later support curated-first planning.

## 7. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 8. Required Production Settings

Before sharing with testers:

- Add the deployed `/auth/callback` URL to Supabase redirect URLs.
- Add all env vars in Vercel or your hosting provider.
- Set `CRON_SECRET`; Vercel cron routes require `Authorization: Bearer <CRON_SECRET>`.
- Verify Resend sender domain before enabling reminder emails.
- Run the curated recipe seed script against production.

## Smoke Test

Use a fresh Google account and verify:

1. Sign in.
2. Complete onboarding.
3. Generate a weekly plan.
4. Swap one meal.
5. Open grocery list.
6. Finalise plan.
7. Copy/share plan link and open it logged out.
8. Copy calendar URL and inspect the `.ics`.
9. Rate one meal.
10. Import one recipe URL and add it to a day.
