'use client'

import { useState } from 'react'
import type { MealDay } from '@/app/api/generate-plan/route'
import RatingCard from '@/components/RatingCard'

interface MealCardProps {
  meal: MealDay
  onSwap: () => void
  swapping: boolean
  existingRating?: { type: 'keep' | 'discard' | 'tweak'; notes?: string | null } | null
  locked?: boolean
}

export default function MealCard({ meal, onSwap, swapping, existingRating, locked }: MealCardProps) {
  const [expanded, setExpanded] = useState(false)

  async function handleRating(type: 'keep' | 'discard' | 'tweak', notes?: string) {
    const res = await fetch('/api/rate-meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal_name: meal.meal_name, rating_type: type, notes }),
    })
    if (!res.ok) throw new Error('Failed to save rating')
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm">

      {/* Card header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Emoji */}
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">
              {meal.emoji}
            </div>
            {/* Name + meta */}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-0.5">
                {meal.day}
              </p>
              <h3 className="font-bold text-gray-900 text-base leading-tight truncate">
                {meal.meal_name}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">⏱ {meal.cook_time_minutes} min</p>
            </div>
          </div>

          {/* Swap button — hidden when plan is locked */}
          {!locked && (
            <button
              onClick={onSwap}
              disabled={swapping}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-orange-500 border border-gray-200 hover:border-orange-300 rounded-xl px-3 py-2 transition-all disabled:opacity-40"
            >
              {swapping ? (
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span>↻</span>
              )}
              Try another
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          {meal.description}
        </p>

        {/* Sides suggestion */}
        {meal.sides_suggestion && (
          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            <span>🥗</span>
            <span>{meal.sides_suggestion}</span>
          </p>
        )}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium">{expanded ? 'Hide recipe' : 'View recipe'}</span>
        <span className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {/* Recipe detail */}
      {expanded && (
        <div className="px-4 pb-5 pt-1 border-t border-gray-100 bg-gray-50">

          {/* Ingredients */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 mt-3">
            Ingredients
          </p>
          <ul className="space-y-1 mb-4">
            {meal.ingredients.map((ing, i) => (
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
          <ol className="space-y-2">
            {meal.instructions.map((step, i) => (
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

      {/* Rating — always visible at the bottom of each card */}
      <RatingCard
        mealName={meal.meal_name}
        existingRating={existingRating}
        onRating={handleRating}
      />

    </div>
  )
}
