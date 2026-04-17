import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { MealDay } from '../generate-plan/route'

export const dynamic = 'force-dynamic'

// Vercel free tier default is 10s — Claude swap needs up to 60s
export const maxDuration = 60

// ─── POST /api/swap-meal ──────────────────────────────────────────────────────
// Body: { day: string, current_plan: MealDay[] }
// Returns: { meal: MealDay } — a single replacement meal for that day

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
    }

    const { day, current_plan } = await request.json() as {
      day: string
      current_plan: MealDay[]
    }

    // Load profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('family_members, dietary_restrictions, dislikes')
      .eq('id', user.id)
      .single()

    const members = (profile?.family_members || []) as { name: string; type: string }[]
    const hasKids = members.some((m) => m.type === 'kid')
    const restrictions: string[] = profile?.dietary_restrictions || []
    const dislikes: string[] = profile?.dislikes || []

    // Tell Claude what meals are already in the plan so it doesn't repeat them
    const existingMeals = current_plan.map((m) => m.meal_name).join(', ')

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: 'You are a family meal planning assistant. You respond ONLY with valid JSON — no prose, no markdown, no explanation before or after the JSON object. Your entire response must be a single valid JSON object that can be parsed with JSON.parse().',
      messages: [
        {
          role: 'user',
          content: `Suggest a single alternative dinner for ${day} for a family with these constraints:
${hasKids ? '- Kid-friendly meals only' : '- Adults only'}
${restrictions.length ? `- Dietary restrictions: ${restrictions.join(', ')}` : ''}
${dislikes.length ? `- Avoid: ${dislikes.join(', ')}` : ''}
- Do NOT suggest any of these (already in the plan): ${existingMeals}
- Should take 20–45 minutes to cook

Respond with this exact JSON structure for a single meal:

{
  "day": "${day}",
  "meal_name": "...",
  "description": "One sentence, appetising description",
  "cook_time_minutes": 30,
  "emoji": "🍜",
  "sides_suggestion": "Serve with steamed rice and a simple green salad",
  "ingredients": [
    { "name": "...", "amount": "...", "category": "produce" }
  ],
  "instructions": ["Step 1 ...", "Step 2 ..."]
}`,
        },
      ],
    })

    const textBlock = message.content?.find((b) => b.type === 'text')
    const rawText = textBlock && 'text' in textBlock ? textBlock.text : ''

    if (!rawText) {
      console.error('Claude returned no text for swap:', JSON.stringify(message.content))
      return NextResponse.json({ error: 'Claude returned no content' }, { status: 500 })
    }

    // Extract JSON — strip any markdown fences or surrounding prose
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    const raw = jsonMatch ? jsonMatch[0] : rawText.trim()

    let meal: MealDay
    try {
      meal = JSON.parse(raw)
    } catch {
      console.error('Failed to parse swap meal response:', raw?.slice(0, 500))
      return NextResponse.json({ error: 'Failed to parse meal — please try again' }, { status: 500 })
    }

    // Update the saved plan in Supabase
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
    const weekStart = monday.toISOString().split('T')[0]

    const { data: existing } = await supabase
      .from('meal_plans')
      .select('plan')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .single()

    if (existing) {
      const updatedPlan = (existing.plan as MealDay[]).map((m: MealDay) =>
        m.day === day ? meal : m
      )
      await supabase
        .from('meal_plans')
        .update({ plan: updatedPlan, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
    }

    return NextResponse.json({ meal })

  } catch (err) {
    console.error('swap-meal error:', err)
    let errMsg = 'Unknown error'
    if (err instanceof Error) {
      errMsg = err.message
      if ('status' in err) errMsg += ` (status: ${(err as { status?: number }).status})`
    }
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
