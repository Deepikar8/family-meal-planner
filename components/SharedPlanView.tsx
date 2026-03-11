'use client'

import { useState } from 'react'
import type { MealDay, Ingredient } from '@/app/api/generate-plan/route'

interface Props {
  plan: MealDay[]
  weekLabel: string
}

const CATEGORY_CONFIG = {
  produce:  { label: '🥦 Produce' },
  protein:  { label: '🥩 Protein' },
  dairy:    { label: '🥛 Dairy' },
  pantry:   { label: '🥫 Pantry' },
  spices:   { label: '🧂 Spices & Sauces' },
}
type Category = keyof typeof CATEGORY_CONFIG

type Tab = 'meals' | 'grocery'

export default function SharedPlanView({ plan, weekLabel }: Props) {
  const [tab, setTab]               = useState<Tab>('meals')
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [checked, setChecked]       = useState<Set<string>>(new Set())

  // ── Build merged grocery list ─────────────────────────────────────────────
  const mergedMap = new Map<string, Ingredient>()
  plan.forEach(meal => {
    meal.ingredients.forEach(ing => {
      const key = ing.name.toLowerCase()
      if (!mergedMap.has(key)) mergedMap.set(key, { ...ing })
    })
  })

  const grouped = new Map<Category, Ingredient[]>()
  for (const cat of Object.keys(CATEGORY_CONFIG) as Category[]) {
    grouped.set(cat, [])
  }
  mergedMap.forEach(ing => {
    const cat = (ing.category in CATEGORY_CONFIG ? ing.category : 'pantry') as Category
    grouped.get(cat)!.push(ing)
  })

  const totalItems = mergedMap.size
  const remaining  = totalItems - checked.size

  function toggleItem(key: string) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <main className="min-h-screen bg-gray-50 max-w-md mx-auto">

      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-lg shadow-sm">
            🍽️
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900 leading-tight">This week's dinners</h1>
            <p className="text-xs text-gray-400">Week of {weekLabel}</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3 bg-orange-50 rounded-xl px-3 py-2">
          👀 Shared with you — tap any meal to see the full recipe
        </p>

        {/* Tab bar */}
        <div className="flex gap-1 mt-4 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setTab('meals')}
            className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${
              tab === 'meals'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            🍽️ Meals
          </button>
          <button
            onClick={() => setTab('grocery')}
            className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${
              tab === 'grocery'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            🛒 Grocery list
            {remaining > 0 && (
              <span className="ml-1.5 text-xs bg-orange-500 text-white rounded-full px-1.5 py-0.5">
                {remaining}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Meals tab ─────────────────────────────────────────────────────── */}
      {tab === 'meals' && (
        <div className="px-4 py-4 space-y-3 pb-16">
          {plan.map((meal) => {
            const isExpanded = expandedDay === meal.day

            return (
              <div key={meal.day} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm">

                {/* Card header */}
                <button
                  onClick={() => setExpandedDay(isExpanded ? null : meal.day)}
                  className="w-full px-4 pt-4 pb-3 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">
                      {meal.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-0.5">
                        {meal.day}
                      </p>
                      <h3 className="font-bold text-gray-900 text-base leading-tight">
                        {meal.meal_name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">⏱ {meal.cook_time_minutes} min</p>
                    </div>
                    <span className={`text-gray-300 text-lg mt-1 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mt-2 leading-relaxed text-left">
                    {meal.description}
                  </p>

                  {meal.sides_suggestion && (
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1 text-left">
                      <span>🥗</span>
                      <span>{meal.sides_suggestion}</span>
                    </p>
                  )}
                </button>

                {/* Expanded recipe */}
                {isExpanded && (
                  <div className="px-4 pb-5 pt-2 border-t border-gray-100 bg-gray-50">

                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2">
                      Ingredients
                    </p>
                    <ul className="space-y-1.5 mb-4">
                      {meal.ingredients.map((ing: Ingredient, i: number) => (
                        <li key={i} className="flex items-baseline gap-2 text-sm">
                          <span className="text-orange-400 flex-shrink-0">•</span>
                          <span className="text-gray-700">
                            <span className="font-medium">{ing.amount}</span> {ing.name}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Instructions
                    </p>
                    <ol className="space-y-2.5">
                      {meal.instructions.map((step: string, i: number) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-gray-700 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Grocery tab ─────────────────────────────────────────────────────── */}
      {tab === 'grocery' && (
        <div className="px-4 py-4 pb-16">

          {/* Progress header */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-600">
              {remaining === 0 ? '✓ All done!' : `${remaining} of ${totalItems} items remaining`}
            </p>
            {checked.size > 0 && (
              <button
                onClick={() => setChecked(new Set())}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Clear all
              </button>
            )}
          </div>

          {/* All done celebration */}
          {remaining === 0 && totalItems > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
              <span className="text-2xl">🎉</span>
              <p className="text-sm font-semibold text-green-700">You've got everything — happy cooking!</p>
            </div>
          )}

          {/* Grouped items */}
          <div className="space-y-5">
            {(Object.keys(CATEGORY_CONFIG) as Category[])
              .filter(cat => (grouped.get(cat) || []).length > 0)
              .map(cat => (
                <div key={cat}>
                  <p className="text-sm font-semibold text-gray-500 mb-1">
                    {CATEGORY_CONFIG[cat].label}
                  </p>
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {grouped.get(cat)!.map((ing, i) => {
                      const key = ing.name.toLowerCase()
                      const isChecked = checked.has(key)
                      const isLast = i === grouped.get(cat)!.length - 1
                      return (
                        <button
                          key={key}
                          onClick={() => toggleItem(key)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 ${
                            !isLast ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isChecked ? 'bg-green-500 border-green-500' : 'border-gray-300'
                          }`}>
                            {isChecked && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          {/* Item */}
                          <span className={`text-sm transition-all ${
                            isChecked ? 'line-through text-gray-300' : 'text-gray-800'
                          }`}>
                            <span className={`font-medium ${isChecked ? 'text-gray-300' : ''}`}>
                              {ing.amount}
                            </span>{' '}
                            {ing.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pb-10 pt-2">
        <p className="text-xs text-gray-300">Made with Fam Dinners 🍽️</p>
      </div>
    </main>
  )
}
