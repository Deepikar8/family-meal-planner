import { createAdminClient } from '@/lib/supabase/admin'
import { DAY_OFFSET, addDaysToDateString, escIcalText, icalFloatingDateTime } from '@/lib/calendar/ics'
import type { MealDay } from '@/app/api/generate-plan/route'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  // Look up user by calendar_token
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('calendar_token', token)
    .single()

  if (!profile) {
    return new Response('Calendar not found', { status: 404 })
  }

  // Get their most recent meal plan
  const { data: mealPlan } = await supabase
    .from('meal_plans')
    .select('plan, week_start')
    .eq('user_id', profile.id)
    .order('week_start', { ascending: false })
    .limit(1)
    .single()

  if (!mealPlan?.plan) {
    return new Response('No meal plan found', { status: 404 })
  }

  const meals = mealPlan.plan as MealDay[]

  // Build floating local-time VEVENT blocks — dinner at 6:30pm, 1 hour.
  // Calendar clients render floating DTSTART/DTEND values in the subscriber's local timezone.
  const events = meals.map((meal) => {
    const offset = DAY_OFFSET[meal.day] ?? 0
    const mealDate = addDaysToDateString(mealPlan.week_start, offset)

    const uid = `fam-dinners-${mealPlan.week_start}-${meal.day.toLowerCase()}@famdinners`
    const summary = `${meal.emoji} ${meal.meal_name}`
    const desc = [
      meal.description,
      `Cook time: ${meal.cook_time_minutes} mins`,
      meal.sides_suggestion ? `Sides: ${meal.sides_suggestion}` : '',
    ].filter(Boolean).join('\\n\\n')

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${icalFloatingDateTime(mealDate, 18, 30)}`,
      `DTEND:${icalFloatingDateTime(mealDate, 19, 30)}`,
      `SUMMARY:${escIcalText(summary)}`,
      `DESCRIPTION:${escIcalText(desc)}`,
      'END:VEVENT',
    ].join('\r\n')
  })

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fam Dinners//Family Meal Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Fam Dinners 🍽️',
    'X-WR-CALDESC:Your weekly dinner plan',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="fam-dinners.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
