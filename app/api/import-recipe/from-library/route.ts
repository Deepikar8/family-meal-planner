import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// ─── POST /api/import-recipe/from-library ─────────────────────────────────────
// Copies a curated library recipe into the user's saved_recipes table,
// then returns the saved record (with its id) so the caller can PATCH the plan.

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { recipe, recipe_id } = await request.json()
    const recipeId = recipe_id ?? recipe?.id

    if (!recipeId || typeof recipeId !== 'string') {
      return NextResponse.json({ error: 'recipe_id is required' }, { status: 400 })
    }

    const { data: curatedRecipe, error: recipeErr } = await supabase
      .from('curated_recipes')
      .select('*')
      .eq('id', recipeId)
      .single()

    if (recipeErr || !curatedRecipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('saved_recipes')
      .upsert(
        {
          user_id:            user.id,
          source_url:         `library://${curatedRecipe.id}`,
          meal_name:          curatedRecipe.meal_name,
          description:        curatedRecipe.description,
          cook_time_minutes:  curatedRecipe.cook_time_minutes,
          emoji:              curatedRecipe.emoji,
          sides_suggestion:   curatedRecipe.sides_suggestion ?? '',
          ingredients:        curatedRecipe.ingredients,
          instructions:       curatedRecipe.instructions,
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
