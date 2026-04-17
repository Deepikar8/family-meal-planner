'use client'

import { useState } from 'react'
import type { MealDay, Ingredient } from '@/app/api/generate-plan/route'

interface GroceryListProps {
  plan: MealDay[]
  onClose: () => void
}

const CATEGORY_CONFIG = {
  produce:  { label: '🥦 Produce',  order: 1 },
  protein:  { label: '🥩 Protein',  order: 2 },
  dairy:    { label: '🥛 Dairy',    order: 3 },
  pantry:   { label: '🥫 Pantry',   order: 4 },
  spices:   { label: '🧂 Spices & Sauces', order: 5 },
}

type Category = keyof typeof CATEGORY_CONFIG

export default function GroceryList({ plan, onClose }: GroceryListProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  // Merge all ingredients from all meals, combining duplicates by name
  const mergedMap = new Map<string, Ingredient>()
  plan.forEach(meal => {
    meal.ingredients.forEach(ing => {
      const key = ing.name.toLowerCase()
      if (!mergedMap.has(key)) {
        mergedMap.set(key, { ...ing })
      }
    })
  })

  // Group by category
  const grouped = new Map<Category, Ingredient[]>()
  for (const cat of Object.keys(CATEGORY_CONFIG) as Category[]) {
    grouped.set(cat, [])
  }
  mergedMap.forEach(ing => {
    const cat = (ing.category in CATEGORY_CONFIG ? ing.category : 'pantry') as Category
    grouped.get(cat)!.push(ing)
  })

  const totalItems = mergedMap.size
  const checkedCount = checked.size
  const remaining = totalItems - checkedCount

  function toggleItem(key: string) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Build the WhatsApp text
  function buildWhatsAppText(): string {
    const lines = ['🛒 *This week\'s grocery list*\n']
    for (const [cat, items] of Array.from(grouped.entries())) {
      if (!items.length) continue
      lines.push(`*${CATEGORY_CONFIG[cat].label}*`)
      items.forEach(i => lines.push(`• ${i.amount} ${i.name}`))
      lines.push('')
    }
    lines.push('_Planned with Fam Dinners_ 🍽️')
    return lines.join('\n')
  }

  function shareToWhatsApp() {
    const text = encodeURIComponent(buildWhatsAppText())
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Grocery list</h2>
          <p className="text-xs text-gray-400">
            {remaining === 0
              ? '✓ All done!'
              : `${remaining} of ${totalItems} items remaining`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
        >
          ✕
        </button>
      </div>

      {/* All done state */}
      {remaining === 0 && totalItems > 0 && (
        <div className="px-5 pt-4">
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <p className="text-sm font-semibold text-green-700">You&apos;ve got everything — happy cooking!</p>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 pb-32">
        {(Object.keys(CATEGORY_CONFIG) as Category[])
          .filter(cat => (grouped.get(cat) || []).length > 0)
          .map(cat => (
            <div key={cat}>
              <p className="text-sm font-semibold text-gray-500 mb-2">
                {CATEGORY_CONFIG[cat].label}
              </p>
              <ul className="space-y-1">
                {grouped.get(cat)!.map((ing) => {
                  const key = ing.name.toLowerCase()
                  const isChecked = checked.has(key)
                  return (
                    <li key={key}>
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                      >
                        {/* Checkbox */}
                        <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300'
                        }`}>
                          {isChecked && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        {/* Item text */}
                        <span className={`text-sm transition-all ${
                          isChecked ? 'line-through text-gray-300' : 'text-gray-800'
                        }`}>
                          <span className={`font-medium ${isChecked ? 'text-gray-300' : ''}`}>
                            {ing.amount}
                          </span>{' '}
                          {ing.name}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
      </div>

      {/* WhatsApp button — sticky at bottom */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-5 bg-white border-t border-gray-100 max-w-md mx-auto">
        <button
          onClick={shareToWhatsApp}
          className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold text-base py-4 rounded-2xl shadow-lg transition-all"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Send to WhatsApp
        </button>
      </div>
    </div>
  )
}
