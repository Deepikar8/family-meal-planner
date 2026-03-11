import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export interface LibraryRecipe {
  id: string
  meal_name: string
  description: string
  cook_time_minutes: number
  emoji: string
  cuisine: string
  kid_friendly: boolean
  sides_suggestion: string
  ingredients: { name: string; amount: string; category: string }[]
  instructions: string[]
}

// ─── GET /api/recipe-library ──────────────────────────────────────────────────
// Returns curated recipes, optionally filtered by cuisine or kid_friendly.
// Also returns the user's personal saved recipes (URL imports).

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const cuisine     = searchParams.get('cuisine')     // optional filter
    const kidFriendly = searchParams.get('kid_friendly') // optional filter: 'true'
    const search      = searchParams.get('q')?.toLowerCase() // optional text search
    const tab         = searchParams.get('tab') ?? 'curated' // 'curated' | 'mine'

    if (tab === 'mine') {
      // Return the user's personal imported recipes
      const { data, error } = await supabase
        .from('saved_recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('imported_at', { ascending: false })
        .limit(100)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ recipes: data ?? [] })
    }

    // Curated library
    let query = supabase
      .from('curated_recipes')
      .select('*')
      .order('meal_name', { ascending: true })
      .limit(200)

    if (cuisine)     query = query.eq('cuisine', cuisine)
    if (kidFriendly) query = query.eq('kid_friendly', true)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    let recipes = (data ?? []) as LibraryRecipe[]

    // Client-side text search (simpler than setting up full-text search in Supabase)
    if (search) {
      recipes = recipes.filter(r =>
        r.meal_name.toLowerCase().includes(search) ||
        r.description.toLowerCase().includes(search) ||
        r.cuisine.toLowerCase().includes(search)
      )
    }

    return NextResponse.json({ recipes })
  } catch (err) {
    console.error('recipe-library error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
