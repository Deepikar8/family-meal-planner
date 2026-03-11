import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Ingredient } from '@/app/api/generate-plan/route'

export const dynamic = 'force-dynamic'

// Vercel free tier default is 10s — URL fetch + Claude extraction needs up to 60s
export const maxDuration = 60

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImportedRecipe {
  id: string
  source_url: string
  imported_at: string
  meal_name: string
  description: string
  cook_time_minutes: number
  emoji: string
  sides_suggestion: string
  ingredients: Ingredient[]
  instructions: string[]
}

// ─── POST /api/import-recipe ──────────────────────────────────────────────────
// Body: { url: string }
// Returns: { recipe: ImportedRecipe }

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { url } = body as { url: string }

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Please enter a valid URL (starting with https://)' }, { status: 400 })
    }

    // ── 1. Fetch page content server-side (avoids CORS) ──────────────────────

    let html: string
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })
      clearTimeout(timeout)

      if (!response.ok) {
        return NextResponse.json(
          { error: `Could not reach that URL (status ${response.status}). Check the link and try again.` },
          { status: 422 }
        )
      }

      const fullHtml = await response.text()
      // Truncate to ~60KB to stay within Claude's context limits
      html = fullHtml.slice(0, 60000)
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : ''
      if (msg.includes('abort') || msg.includes('timeout')) {
        return NextResponse.json({ error: 'That page took too long to load. Try a different URL.' }, { status: 422 })
      }
      return NextResponse.json({ error: 'Could not reach that URL. Check the link and try again.' }, { status: 422 })
    }

    // ── 2. Extract recipe via Claude ─────────────────────────────────────────

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Extract the recipe from this web page HTML and return it as JSON.

If the page does NOT contain a clear recipe, return exactly: { "error": "No recipe found on this page" }

Otherwise return ONLY valid JSON in this exact format — no markdown, no explanation:

{
  "meal_name": "Recipe name",
  "description": "One appetising sentence describing the dish",
  "cook_time_minutes": 30,
  "emoji": "🍝",
  "sides_suggestion": "Serve with steamed rice and a green salad",
  "ingredients": [
    { "name": "chicken breast", "amount": "2", "category": "protein" }
  ],
  "instructions": [
    "Step 1...",
    "Step 2..."
  ]
}

Rules:
- Each ingredient's category must be one of: "produce", "protein", "dairy", "pantry", or "spices"
- cook_time_minutes should be total time (prep + cook); use 30 if not stated
- If sides_suggestion is not in the recipe, invent a sensible pairing
- Simplify instructions to clear, numbered steps — remove filler text
- Combine prep + cook time into a single integer
- Choose an emoji that fits the dish

HTML:
${html}`,
        },
      ],
    })

    const textBlock = message.content?.find(b => b.type === 'text')
    let raw = textBlock && 'text' in textBlock ? textBlock.text.trim() : ''

    // Strip code fences
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) raw = fenceMatch[1].trim()

    // Extract JSON object if Claude prepended any text
    if (!raw.startsWith('{')) {
      const start = raw.indexOf('{')
      const end   = raw.lastIndexOf('}')
      if (start !== -1 && end !== -1) raw = raw.slice(start, end + 1)
    }

    let extracted: Record<string, unknown>
    try {
      extracted = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: "Couldn't parse the recipe. Try a different URL." }, { status: 422 })
    }

    if (extracted.error) {
      return NextResponse.json({ error: "Couldn't find a recipe on that page. Try a direct link to a recipe." }, { status: 422 })
    }

    // ── 3. Save to saved_recipes ──────────────────────────────────────────────

    const { data: saved, error: saveErr } = await supabase
      .from('saved_recipes')
      .upsert(
        {
          user_id:            user.id,
          source_url:         url,
          meal_name:          String(extracted.meal_name ?? 'Imported Recipe'),
          description:        String(extracted.description ?? ''),
          cook_time_minutes:  Number(extracted.cook_time_minutes ?? 30),
          emoji:              String(extracted.emoji ?? '🍽️'),
          sides_suggestion:   String(extracted.sides_suggestion ?? ''),
          ingredients:        extracted.ingredients ?? [],
          instructions:       extracted.instructions ?? [],
        },
        { onConflict: 'user_id,source_url' }
      )
      .select()
      .single()

    if (saveErr || !saved) {
      console.error('save error:', saveErr)
      return NextResponse.json({ error: 'Failed to save the recipe. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ recipe: saved as ImportedRecipe })
  } catch (err) {
    console.error('import-recipe error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// ─── PATCH /api/import-recipe ─────────────────────────────────────────────────
// Body: { recipe_id: string, day: string }
// Adds a saved recipe to the current week's meal plan on the given day.

export async function PATCH(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { recipe_id, day } = await request.json() as { recipe_id: string; day: string }

    if (!recipe_id || !day) {
      return NextResponse.json({ error: 'recipe_id and day are required' }, { status: 400 })
    }

    // Fetch the saved recipe
    const { data: recipe } = await supabase
      .from('saved_recipes')
      .select('*')
      .eq('id', recipe_id)
      .eq('user_id', user.id)
      .single()

    if (!recipe) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })

    // Fetch the current week's plan
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
    const weekStart = monday.toISOString().split('T')[0]

    const { data: planRow } = await supabase
      .from('meal_plans')
      .select('plan, share_token')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .single()

    if (!planRow) return NextResponse.json({ error: 'No plan found for this week' }, { status: 404 })

    // Replace the meal for the given day
    const updatedPlan = (planRow.plan as Record<string, unknown>[]).map((meal) =>
      meal.day === day
        ? {
            day,
            meal_name:          recipe.meal_name,
            description:        recipe.description,
            cook_time_minutes:  recipe.cook_time_minutes,
            emoji:              recipe.emoji,
            sides_suggestion:   recipe.sides_suggestion,
            ingredients:        recipe.ingredients,
            instructions:       recipe.instructions,
          }
        : meal
    )

    const { error: updateErr } = await supabase
      .from('meal_plans')
      .update({ plan: updatedPlan })
      .eq('user_id', user.id)
      .eq('week_start', weekStart)

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    return NextResponse.json({ plan: updatedPlan })
  } catch (err) {
    console.error('import-recipe PATCH error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
