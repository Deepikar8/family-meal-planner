'use client'

import { useState } from 'react'
import type { MealDay, Ingredient } from '@/app/api/generate-plan/route'

interface Props {
  plan: MealDay[]
  weekLabel: string
}

export default function SharedPlanView({ plan, weekLabel }: Props) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  return (
    <main className="min-h-screen bg-gray-50 max-w-md mx-auto">

      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100">
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
      </div>

      {/* Meal list */}
      <div className="px-4 py-4 space-y-3 pb-16">
        {plan.map((meal) => {
          const isExpanded = expandedDay === meal.day

          return (
            <div key={meal.day} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm">

              {/* Card header — always visible */}
              <button
                onClick={() => setExpandedDay(isExpanded ? null : meal.day)}
                className="w-full px-4 pt-4 pb-3 text-left"
              >
                <div className="flex items-start gap-3">
                  {/* Emoji */}
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

                  {/* Expand chevron */}
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

                  {/* Ingredients */}
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

                  {/* Instructions */}
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

      {/* Footer */}
      <div className="text-center pb-10 pt-2">
        <p className="text-xs text-gray-300">Made with Fam Dinners 🍽️</p>
      </div>
    </main>
  )
}
