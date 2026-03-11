import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/finalize-plan
// Body: { finalized: boolean }
// Toggles the finalized state on the current week's meal plan.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { finalized } = await req.json()

  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const weekStart = monday.toISOString().split('T')[0]

  const { error } = await supabase
    .from('meal_plans')
    .update({ finalized })
    .eq('user_id', user.id)
    .eq('week_start', weekStart)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ finalized })
}
