import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// ─── POST /api/import-recipe/from-library ─────────────────────────────────────
// Copies a curated library recipe into the user's saved_recipes table,
// then returns the saved record (with its id) so the caller can PATCH the plan.

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { recipe } = await request.json()

    const { data, error } = await supabase
      .from('saved_recipes')
      .upsert(
        {
          user_id:            user.id,
          source_url:         `library://${recipe.id}`,
          meal_name:          recipe.meal_name,
          description:        recipe.description,
          cook_time_minutes:  recipe.cook_time_minutes,
          emoji:              recipe.emoji,
          sides_suggestion:   recipe.sides_suggestion ?? '',
          ingredients:        recipe.ingredients,
          instructions:       recipe.instructions,
        },
        { onConflict: 'user_id,source_url' }
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch (err) {
    console.error('from-library error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
