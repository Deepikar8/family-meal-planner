import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST /api/finalize-plan
// Body: { finalized: boolean }
// Toggles the finalized state on the current week's meal plan.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { finalized } = await req.json()
  if (typeof finalized !== 'boolean') {
    return NextResponse.json({ error: 'finalized must be a boolean' }, { status: 400 })
  }

  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const weekStart = monday.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('meal_plans')
    .update({ finalized })
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .select('id')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'No plan found for this week' }, { status: 404 })
  return NextResponse.json({ finalized })
}
