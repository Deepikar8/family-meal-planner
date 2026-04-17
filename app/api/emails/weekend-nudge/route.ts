import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Called by a cron job every Saturday at 9am
// POST /api/emails/weekend-nudge
// Requires header: Authorization: Bearer <CRON_SECRET>

export async function POST(req: Request) {
  // Protect the route — only the cron job should call this
  // Allow Vercel Cron (sends CRON_SECRET as header) or manual curl trigger
  const auth = req.headers.get('authorization')
  const vercelCron = req.headers.get('x-vercel-cron-signature')
  if (!vercelCron && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  const supabase = createAdminClient()
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Get all users who have completed onboarding
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('onboarding_complete', true)

  if (!profiles?.length) {
    return NextResponse.json({ sent: 0 })
  }

  // Get their emails from auth.users
  const results = await Promise.allSettled(
    profiles.map(async (profile) => {
      const { data: { user } } = await supabase.auth.admin.getUserById(profile.id)
      if (!user?.email) return

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://famdinners.app'

      await resend.emails.send({
        from: 'Fam Dinners <onboarding@resend.dev>',
        to: user.email,
        subject: "Ready to plan next week's dinners? 🍽️",
        html: weekendNudgeHtml({ name: user.user_metadata?.full_name?.split(' ')[0] || '', appUrl }),
      })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent })
}

function weekendNudgeHtml({ name, appUrl }: { name: string; appUrl: string }) {
  const greeting = name ? `Hey ${name}` : 'Hey'
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#f97316;padding:32px 32px 24px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">🍽️</div>
      <h1 style="color:white;margin:0;font-size:22px;font-weight:800;">Plan next week's dinners</h1>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="color:#111827;font-size:16px;margin:0 0 16px;">${greeting} 👋</p>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
        The weekend is a great time to sort out next week's dinners — before the Monday chaos kicks in.
        It only takes 30 seconds to get your plan ready.
      </p>

      <a href="${appUrl}/dashboard" style="display:block;background:#f97316;color:white;text-align:center;padding:16px 24px;border-radius:12px;font-weight:700;font-size:16px;text-decoration:none;margin-bottom:24px;">
        ✨ Plan next week →
      </a>

      <div style="border-top:1px solid #f3f4f6;padding-top:20px;">
        <p style="color:#9ca3af;font-size:13px;margin:0 0 8px;">What you'll get:</p>
        <p style="color:#6b7280;font-size:14px;margin:0 0 6px;">🗓️ &nbsp;5 dinners tailored to your family</p>
        <p style="color:#6b7280;font-size:14px;margin:0 0 6px;">🛒 &nbsp;A grocery list ready to go</p>
        <p style="color:#6b7280;font-size:14px;margin:0;">↗ &nbsp;Shareable with your family in one tap</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
      <p style="color:#d1d5db;font-size:12px;margin:0;text-align:center;">
        Fam Dinners · <a href="${appUrl}" style="color:#d1d5db;">famdinners.app</a>
      </p>
    </div>
  </div>
</body>
</html>`
}
