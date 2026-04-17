import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import type { MealDay } from '@/app/api/generate-plan/route'

export const dynamic = 'force-dynamic'

// Called by a cron job Mon–Fri at 7am
// POST /api/emails/daily-reminder
// Requires header: Authorization: Bearer <CRON_SECRET>

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export async function POST(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  const supabase = createAdminClient()
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Work out which day of the week it is and the current week_start (Monday)
  const today = new Date()
  const todayName = DAY_NAMES[today.getDay()] // e.g. "Tuesday"

  // Skip weekends
  if (today.getDay() === 0 || today.getDay() === 6) {
    return NextResponse.json({ skipped: 'weekend' })
  }

  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const weekStart = monday.toISOString().split('T')[0]

  // Get all finalized plans for this week
  const { data: plans } = await supabase
    .from('meal_plans')
    .select('user_id, plan')
    .eq('week_start', weekStart)
    .eq('finalized', true)

  if (!plans?.length) {
    return NextResponse.json({ sent: 0 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://famdinners.app'

  const results = await Promise.allSettled(
    plans.map(async (planRow) => {
      const meals = planRow.plan as MealDay[]
      const todaysMeal = meals.find(m => m.day === todayName)
      if (!todaysMeal) return // No meal planned for today

      const { data: { user } } = await supabase.auth.admin.getUserById(planRow.user_id)
      if (!user?.email) return

      const name = user.user_metadata?.full_name?.split(' ')[0] || ''

      await resend.emails.send({
        from: 'Fam Dinners <onboarding@resend.dev>',
        to: user.email,
        subject: `Tonight: ${todaysMeal.emoji} ${todaysMeal.meal_name}`,
        html: dailyReminderHtml({ name, meal: todaysMeal, appUrl }),
      })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent })
}

function dailyReminderHtml({ name, meal, appUrl }: { name: string; meal: MealDay; appUrl: string }) {
  const greeting = name ? `Hey ${name}` : 'Hey'
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#f97316;padding:32px 32px 24px;text-align:center;">
      <div style="font-size:56px;margin-bottom:8px;">${meal.emoji}</div>
      <p style="color:rgba(255,255,255,0.85);margin:0 0 4px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Tonight's dinner</p>
      <h1 style="color:white;margin:0;font-size:22px;font-weight:800;">${meal.meal_name}</h1>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="color:#111827;font-size:16px;margin:0 0 12px;">${greeting} 👋</p>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px;">
        ${meal.description}
      </p>

      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 16px;margin-bottom:24px;">
        <p style="color:#9a3412;font-size:13px;font-weight:700;margin:0 0 4px;">⏱ Cook time</p>
        <p style="color:#c2410c;font-size:15px;font-weight:600;margin:0;">${meal.cook_time_minutes} minutes</p>
      </div>

      ${meal.sides_suggestion ? `
      <div style="margin-bottom:24px;">
        <p style="color:#374151;font-size:13px;font-weight:700;margin:0 0 4px;">🥗 Suggested sides</p>
        <p style="color:#6b7280;font-size:14px;margin:0;">${meal.sides_suggestion}</p>
      </div>` : ''}

      <a href="${appUrl}/dashboard" style="display:block;background:#f97316;color:white;text-align:center;padding:14px 24px;border-radius:12px;font-weight:700;font-size:15px;text-decoration:none;">
        View full recipe →
      </a>
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
