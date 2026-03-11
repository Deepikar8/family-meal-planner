import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Vercel free tier default is 10s — Claude plan generation needs up to 60s
export const maxDuration = 60

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Ingredient {
  name: string
  amount: string
  category: 'produce' | 'protein' | 'dairy' | 'pantry' | 'spices'
}

export interface MealDay {
  day: string
  meal_name: string
  description: string
  cook_time_minutes: number
  emoji: string
  sides_suggestion: string  // e.g. "Serve with steamed rice and a green salad"
  ingredients: Ingredient[]
  instructions: string[]
}

export interface MealPlan {
  plan: MealDay[]
}

// ─── POST /api/generate-plan ──────────────────────────────────────────────────

export async function POST() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
    }

    // Load the user's household profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('family_members, dietary_restrictions, dislikes')
    .eq('id', user.id)
    .single()

  // Build a readable profile summary for the prompt
  const members = (profile?.family_members || []) as { name: string; type: string }[]
  const adults = members.filter((m) => m.type === 'adult').map((m) => m.name)
  const kids   = members.filter((m) => m.type === 'kid').map((m) => m.name)
  const restrictions: string[] = profile?.dietary_restrictions || []
  const dislikes: string[] = profile?.dislikes || []

  const familySummary = [
    adults.length ? `Adults: ${adults.join(', ')}` : null,
    kids.length   ? `Kids: ${kids.join(', ')}` : null,
    restrictions.length ? `Dietary restrictions: ${restrictions.join(', ')}` : null,
    dislikes.length     ? `Foods to avoid: ${dislikes.join(', ')}` : null,
  ].filter(Boolean).join('\n')

  const hasKids = kids.length > 0

  // Load past meal ratings to inform the plan
  let ratingContext = ''
  try {
    const { data: ratingRows } = await supabase
      .from('meal_ratings')
      .select('meal_name, rating_type, notes')
      .eq('user_id', user.id)

    if (ratingRows && ratingRows.length > 0) {
      const kept      = ratingRows.filter(r => r.rating_type === 'keep').map(r => r.meal_name)
      const discarded = ratingRows.filter(r => r.rating_type === 'discard').map(r => r.meal_name)
      const tweaked   = ratingRows.filter(r => r.rating_type === 'tweak')

      const lines: string[] = []
      if (kept.length)      lines.push(`Meals this family loved — try to include similar dishes: ${kept.join(', ')}`)
      if (discarded.length) lines.push(`Meals this family disliked — NEVER suggest these again: ${discarded.join(', ')}`)
      if (tweaked.length) {
        lines.push('Meals they liked but want adjusted:')
        tweaked.forEach(r => lines.push(`  - ${r.meal_name}${r.notes ? ` (note: ${r.notes})` : ''}`))
      }

      if (lines.length) {
        ratingContext = '\nFAMILY MEAL HISTORY:\n' + lines.join('\n') + '\n'
      }
    }
  } catch {
    // Non-fatal — proceed without rating context if the table doesn't exist yet
  }

  // ── Call Claude ─────────────────────────────────────────────────────────────

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Claude Sonnet 4.6 (claude-3-5-sonnet was deprecated Feb 2026)
  const model = 'claude-sonnet-4-6'

  const message = await anthropic.messages.create({
    model,
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: `You are a family meal planning assistant. Generate a 5-dinner weekly plan (Monday to Friday) for this family:

${familySummary || 'A typical family of 4.'}
${ratingContext}
Rules:
- Each dinner should take 20–45 minutes to cook on a weeknight
${hasKids ? '- Meals must be kid-friendly — familiar flavours, nothing too spicy or complex' : '- Adults only, so you can be more adventurous'}
- Vary cuisines across the week (e.g. Italian, Asian, Mexican, Middle Eastern, comfort food)
- Keep ingredient lists practical — nothing exotic or hard to find
- Each ingredient must have a category: "produce", "protein", "dairy", "pantry", or "spices"
- Do NOT repeat main proteins across the 5 days
- Instructions should be clear and numbered, written for a home cook
- For sides_suggestion: recommend 1–2 simple sides that complement the main (e.g. "Serve with steamed rice and a cucumber salad"). Keep it to one short sentence — no ingredients or instructions needed for sides.

Return ONLY valid JSON in this exact format — no markdown, no explanation:

{
  "plan": [
    {
      "day": "Monday",
      "meal_name": "...",
      "description": "One sentence, appetising description",
      "cook_time_minutes": 30,
      "emoji": "🍝",
      "sides_suggestion": "Serve with steamed rice and a simple green salad",
      "ingredients": [
        { "name": "...", "amount": "...", "category": "produce" }
      ],
      "instructions": [
        "Step 1 ...",
        "Step 2 ..."
      ]
    }
  ]
}`,
      },
    ],
  })

  // ── Parse response ───────────────────────────────────────────────────────────

  const textBlock = message.content?.find((b) => b.type === 'text')
  let raw = textBlock && 'text' in textBlock ? textBlock.text.trim() : ''
  if (!raw) {
    console.error('Claude returned no text content:', JSON.stringify(message.content))
    return NextResponse.json({ error: 'Claude returned no content' }, { status: 500 })
  }

  // 1. Strip markdown code fences if present (```json ... ```)
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) raw = fenceMatch[1].trim()

  // 2. Extract the outermost { ... } — handles preamble, trailing text, or partial fences
  const start = raw.indexOf('{')
  const end   = raw.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    raw = raw.slice(start, end + 1)
  }

  // 3. Log the stop reason — if Claude hit max_tokens the JSON will be truncated
  const stopReason = message.stop_reason
  if (stopReason !== 'end_turn') {
    console.error(`Claude stopped with reason "${stopReason}" — response may be truncated`)
  }

  let mealPlan: MealPlan
  try {
    mealPlan = JSON.parse(raw)
  } catch (parseErr) {
    console.error('Failed to parse Claude response. Stop reason:', stopReason)
    console.error('Raw response (first 1000 chars):', raw?.slice(0, 1000))
    return NextResponse.json(
      { error: `Failed to parse meal plan (stop_reason: ${stopReason})` },
      { status: 500 }
    )
  }

  if (!mealPlan?.plan || !Array.isArray(mealPlan.plan)) {
    console.error('Invalid plan structure:', JSON.stringify(mealPlan)?.slice(0, 500))
    return NextResponse.json({ error: 'Invalid meal plan structure' }, { status: 500 })
  }

  // ── Save to Supabase ─────────────────────────────────────────────────────────

  // Get the Monday of the current week
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const weekStart = monday.toISOString().split('T')[0]

  // Keep existing share_token if regenerating — so shared links don't break
  const { data: existingPlan } = await supabase
    .from('meal_plans')
    .select('share_token')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .single()

  const shareToken = existingPlan?.share_token ?? crypto.randomUUID()

  const { error: upsertError } = await supabase.from('meal_plans').upsert(
    {
      user_id: user.id,
      week_start: weekStart,
      plan: mealPlan.plan,
      share_token: shareToken,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,week_start' }
  )

  if (upsertError) {
    console.error('Supabase upsert error:', upsertError)
    return NextResponse.json(
      { error: `Failed to save plan: ${upsertError.message}` },
      { status: 500 }
    )
  }

    return NextResponse.json({ ...mealPlan, share_token: shareToken })
  } catch (err) {
    console.error('generate-plan error:', err)
    let errMsg = 'Unknown error'
    if (err instanceof Error) {
      errMsg = err.message
      // Anthropic API errors often have extra detail
      if ('status' in err) errMsg += ` (status: ${(err as { status?: number }).status})`
    }
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    )
  }
}
