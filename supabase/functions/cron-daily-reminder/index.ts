// Supabase Edge Function — runs Mon–Fri at 7am UTC
// Schedule: 0 7 * * 1-5
//
// Deploy:  supabase functions deploy cron-daily-reminder
// Schedule: supabase functions schedule cron-daily-reminder --cron "0 7 * * 1-5"

Deno.serve(async () => {
  const appUrl = Deno.env.get('APP_URL') ?? 'https://famdinners.app'
  const cronSecret = Deno.env.get('CRON_SECRET') ?? ''

  const res = await fetch(`${appUrl}/api/emails/daily-reminder`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cronSecret}` },
  })

  const body = await res.json()
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  })
})
