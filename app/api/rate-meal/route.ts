import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type RatingType = 'keep' | 'discard' | 'tweak'

// ─── POST /api/rate-meal ──────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { meal_name, rating_type, notes } = body as {
      meal_name: string
      rating_type: RatingType
      notes?: string
    }

    if (!meal_name || typeof meal_name !== 'string') {
      return NextResponse.json({ error: 'meal_name is required' }, { status: 400 })
    }

    if (!['keep', 'discard', 'tweak'].includes(rating_type)) {
      return NextResponse.json({ error: 'rating_type must be keep, discard, or tweak' }, { status: 400 })
    }

    // UPSERT — if the user has rated this meal before, overwrite it
    const { error } = await supabase.from('meal_ratings').upsert(
      {
        user_id: user.id,
        meal_name: meal_name.trim(),
        rating_type,
        notes: notes?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,meal_name' }
    )

    if (error) {
      console.error('rate-meal upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('rate-meal error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
