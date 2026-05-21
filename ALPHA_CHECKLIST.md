# Alpha Launch Checklist

Use this before sharing the app with a small private alpha group.

## Deployment

- [ ] Code deployed from the latest `main`.
- [ ] `npm run build` passes in the deployment environment.
- [ ] Supabase migration applied: `supabase/migrations/20260521000000_current_app_schema.sql`.
- [ ] Curated recipe library seeded with `npx tsx scripts/seed-recipe-library.ts`.

## Environment

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `RESEND_API_KEY`
- [ ] `CRON_SECRET`
- [ ] `NEXT_PUBLIC_APP_URL`

## Auth

- [ ] Google OAuth provider enabled in Supabase.
- [ ] Local callback URL configured if testing locally.
- [ ] Production callback URL configured.
- [ ] Fresh Google account can sign in and complete onboarding.

## Email And Cron

- [ ] Resend sender domain verified, or cron reminders intentionally disabled.
- [ ] Vercel cron routes are deployed.
- [ ] Manual cron call without `Authorization: Bearer <CRON_SECRET>` returns `401`.
- [ ] Manual cron call with the secret returns `200`.

## Core Flow Smoke Test

- [ ] Generate a 5-day plan.
- [ ] Swap a meal and confirm it persists after reload.
- [ ] Open grocery list and export to WhatsApp.
- [ ] Finalise plan and confirm edit controls disappear.
- [ ] Unlock plan and confirm edit controls return.
- [ ] Share plan link opens while logged out.
- [ ] Shared grocery list check-off works.
- [ ] Calendar URL returns an `.ics` file with 6:30pm floating local dinner times.
- [ ] Rate a meal as Keep/Discard/Tweak and confirm the badge persists.
- [ ] Import a recipe URL and add it to a day.
- [ ] Browse curated recipes and add one to a day.

## Cost And Safety Guardrails

- [ ] Alpha group limited to 5-10 trusted users.
- [ ] Anthropic usage dashboard checked during testing.
- [ ] Resend usage checked during testing.
- [ ] Testers told this is an alpha and data may be reset.
- [ ] No public marketing traffic pointed at the app yet.

## Known Before Wider Beta

- [ ] Add per-user AI rate limits.
- [ ] Add usage/error logging for AI endpoints.
- [ ] Add lightweight privacy/terms copy.
- [ ] Move Next `middleware.ts` to the newer `proxy` convention.
- [ ] Resolve remaining moderate dependency advisories when upstream packages allow it.
