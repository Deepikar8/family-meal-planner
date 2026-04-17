// Supabase Edge Function — runs every Saturday at 9am UTC
// Schedule: 0 9 * * 6
//
// Deploy:  supabase functions deploy cron-weekend-nudge
// Schedule: supabase functions schedule cron-weekend-nudge --cron "0 9 * * 6"

Deno.serve(async () => {
  const appUrl = Deno.env.get('APP_URL') ?? 'https://famdinners.app'
  const cronSecret = Deno.env.get('CRON_SECRET') ?? ''

  const res = await fetch(`${appUrl}/api/emails/weekend-nudge`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cronSecret}` },
  })

  const body = await res.json()
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  })
})
