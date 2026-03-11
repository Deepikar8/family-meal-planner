/**
 * seed-recipe-library.ts
 *
 * Generates a curated library of family-friendly recipes via Claude
 * and inserts them into the `curated_recipes` Supabase table.
 *
 * Run once:
 *   npx tsx scripts/seed-recipe-library.ts
 *
 * Requires: ANTHROPIC_API_KEY and NEXT_PUBLIC_SUPABASE_URL and
 *           SUPABASE_SERVICE_ROLE_KEY in your .env.local
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── Recipe categories to generate ───────────────────────────────────────────

const BATCHES = [
  { cuisine: 'Italian',        count: 8,  kidFriendly: true  },
  { cuisine: 'Asian',          count: 8,  kidFriendly: true  },
  { cuisine: 'Mexican',        count: 6,  kidFriendly: true  },
  { cuisine: 'Middle Eastern', count: 6,  kidFriendly: false },
  { cuisine: 'American',       count: 8,  kidFriendly: true  },
  { cuisine: 'Mediterranean',  count: 6,  kidFriendly: false },
  { cuisine: 'Indian',         count: 6,  kidFriendly: false },
  { cuisine: 'Japanese',       count: 6,  kidFriendly: true  },
]

// ─── Generate a batch of recipes ─────────────────────────────────────────────

async function generateBatch(cuisine: string, count: number, kidFriendly: boolean) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `Generate ${count} ${cuisine} dinner recipes${kidFriendly ? ' suitable for families with young children' : ' for adults or adventurous eaters'}.

Each recipe should:
- Take 20–45 minutes on a weeknight
- Use practical, easy-to-find ingredients
- Have clear numbered instructions

Return ONLY valid JSON — no markdown, no explanation:

{
  "recipes": [
    {
      "meal_name": "...",
      "description": "One appetising sentence",
      "cook_time_minutes": 30,
      "emoji": "🍝",
      "cuisine": "${cuisine}",
      "kid_friendly": ${kidFriendly},
      "sides_suggestion": "Serve with...",
      "ingredients": [
        { "name": "...", "amount": "...", "category": "produce|protein|dairy|pantry|spices" }
      ],
      "instructions": ["Step 1...", "Step 2..."]
    }
  ]
}`,
      },
    ],
  })

  const textBlock = message.content?.find(b => b.type === 'text')
  let raw = textBlock && 'text' in textBlock ? textBlock.text.trim() : ''

  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) raw = fenceMatch[1].trim()
  if (!raw.startsWith('{')) {
    const start = raw.indexOf('{'); const end = raw.lastIndexOf('}')
    if (start !== -1 && end !== -1) raw = raw.slice(start, end + 1)
  }

  const parsed = JSON.parse(raw)
  return parsed.recipes as Record<string, unknown>[]
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🍽️  Seeding curated recipe library...\n')

  let total = 0

  for (const batch of BATCHES) {
    process.stdout.write(`  Generating ${batch.count} ${batch.cuisine} recipes...`)
    try {
      const recipes = await generateBatch(batch.cuisine, batch.count, batch.kidFriendly)

      const { error } = await supabase
        .from('curated_recipes')
        .upsert(
          recipes.map(r => ({
            meal_name:         r.meal_name,
            description:       r.description,
            cook_time_minutes: r.cook_time_minutes,
            emoji:             r.emoji,
            cuisine:           r.cuisine ?? batch.cuisine,
            kid_friendly:      r.kid_friendly ?? batch.kidFriendly,
            sides_suggestion:  r.sides_suggestion,
            ingredients:       r.ingredients,
            instructions:      r.instructions,
          })),
          { onConflict: 'meal_name' }
        )

      if (error) throw error
      total += recipes.length
      console.log(` ✓ (${recipes.length} recipes)`)
    } catch (err) {
      console.log(` ✗ Error: ${err instanceof Error ? err.message : err}`)
    }

    // Brief pause between batches to avoid rate limits
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log(`\n✅ Done! ${total} recipes added to curated_recipes table.`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
