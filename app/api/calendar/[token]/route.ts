import { createAdminClient } from '@/lib/supabase/admin'
import type { MealDay } from '@/app/api/generate-plan/route'

export const dynamic = 'force-dynamic'

const DAY_OFFSET: Record<string, number> = {
  Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3,
  Friday: 4, Saturday: 5, Sunday: 6,
}

// Format a Date as iCal UTC timestamp: 20240415T183000Z
function icalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

// Escape special chars in iCal text fields
function esc(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const supabase = createAdminClient()

  // Look up user by calendar_token
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('calendar_token', params.token)
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
  const weekStart = new Date(mealPlan.week_start + 'T00:00:00Z')

  // Build VEVENT blocks — dinner at 6:30pm, 1 hour
  const events = meals.map((meal) => {
    const offset = DAY_OFFSET[meal.day] ?? 0
    const start = new Date(weekStart)
    start.setUTCDate(start.getUTCDate() + offset)
    start.setUTCHours(18, 30, 0, 0)

    const end = new Date(start)
    end.setUTCHours(19, 30, 0, 0)

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
      `DTSTART:${icalDate(start)}`,
      `DTEND:${icalDate(end)}`,
      `SUMMARY:${esc(summary)}`,
      `DESCRIPTION:${esc(desc)}`,
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
    'X-WR-TIMEZONE:UTC',
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
