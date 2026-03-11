import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export interface MealRatingsResponse {
  kept: string[]
  discarded: string[]
  tweaked: { name: string; notes: string }[]
}

// ─── GET /api/meal-ratings ────────────────────────────────────────────────────
// Returns all of the current user's meal ratings, grouped by type.
// Called by the generate-plan route to inform the Claude prompt.

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('meal_ratings')
      .select('meal_name, rating_type, notes')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('meal-ratings fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const ratings = data ?? []

    const response: MealRatingsResponse = {
      kept:      ratings.filter(r => r.rating_type === 'keep').map(r => r.meal_name),
      discarded: ratings.filter(r => r.rating_type === 'discard').map(r => r.meal_name),
      tweaked:   ratings
        .filter(r => r.rating_type === 'tweak' && r.notes)
        .map(r => ({ name: r.meal_name, notes: r.notes! })),
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('meal-ratings error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
