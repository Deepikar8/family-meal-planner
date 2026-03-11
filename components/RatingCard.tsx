'use client'

import { useState } from 'react'

type RatingType = 'keep' | 'discard' | 'tweak'

interface ExistingRating {
  type: RatingType
  notes?: string | null
}

interface RatingCardProps {
  mealName: string
  existingRating?: ExistingRating | null
  onRating: (type: RatingType, notes?: string) => Promise<void>
}

const TWEAK_SUGGESTIONS = [
  'More spice', 'Less salt', 'More garlic', 'Cook longer',
  'Less sauce', 'More veggies', 'Needs less oil', 'Serve hotter',
]

export default function RatingCard({ mealName, existingRating, onRating }: RatingCardProps) {
  const [selected, setSelected]     = useState<RatingType | null>(existingRating?.type ?? null)
  const [tweakMode, setTweakMode]   = useState(false)
  const [notes, setNotes]           = useState(existingRating?.notes ?? '')
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(!!existingRating)

  async function handleRate(type: RatingType) {
    if (type === 'tweak') {
      // Open the tweak input first — don't save yet
      setSelected('tweak')
      setTweakMode(true)
      return
    }

    setSaving(true)
    try {
      await onRating(type)
      setSelected(type)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  async function saveTweak() {
    setSaving(true)
    try {
      await onRating('tweak', notes.trim() || undefined)
      setTweakMode(false)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  function cancelTweak() {
    setTweakMode(false)
    if (!existingRating) setSelected(null)
  }

  function addSuggestion(text: string) {
    setNotes(prev => prev ? `${prev}, ${text.toLowerCase()}` : text.toLowerCase())
  }

  // ── Compact "already rated" badge ────────────────────────────────────────────
  if (saved && !tweakMode) {
    const badge = {
      keep:    { label: 'Saved to favourites', icon: '👍', color: 'text-green-600 bg-green-50 border-green-200' },
      discard: { label: "Won't appear again",  icon: '👎', color: 'text-red-500 bg-red-50 border-red-200' },
      tweak:   { label: 'Tweaks saved',        icon: '✏️', color: 'text-orange-500 bg-orange-50 border-orange-200' },
    }[selected ?? 'keep']

    return (
      <div className={`mx-4 mb-4 flex items-center justify-between border rounded-xl px-3 py-2 ${badge.color}`}>
        <span className="text-xs font-medium flex items-center gap-1.5">
          {badge.icon} {badge.label}
        </span>
        <button
          onClick={() => { setSaved(false); setSelected(null); setTweakMode(false) }}
          className="text-xs opacity-50 hover:opacity-100 transition-opacity"
        >
          Change
        </button>
      </div>
    )
  }

  // ── Tweak mode — notes textarea ───────────────────────────────────────────────
  if (tweakMode) {
    return (
      <div className="mx-4 mb-4 border-t border-gray-100 pt-3 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          What would you change about {mealName}?
        </p>

        {/* Quick-add suggestion chips */}
        <div className="flex flex-wrap gap-1.5">
          {TWEAK_SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => addSuggestion(s)}
              className="text-xs text-gray-500 bg-gray-100 hover:bg-orange-50 hover:text-orange-500 rounded-full px-2.5 py-1 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. more spice, less salt, cook longer…"
          rows={2}
          className="w-full text-sm border border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 resize-none text-gray-700 placeholder-gray-300"
        />

        <div className="flex gap-2">
          <button
            onClick={saveTweak}
            disabled={saving}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl py-2 transition-all disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save tweaks'}
          </button>
          <button
            onClick={cancelTweak}
            className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ── Default — three rating buttons ───────────────────────────────────────────
  return (
    <div className="mx-4 mb-4 pt-3 border-t border-gray-100">
      <p className="text-xs text-gray-400 mb-2 text-center">How was dinner?</p>
      <div className="flex gap-2">

        {/* Keep */}
        <button
          onClick={() => handleRate('keep')}
          disabled={saving}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl py-2.5 border transition-all disabled:opacity-40
            ${selected === 'keep'
              ? 'bg-green-50 border-green-300 text-green-600'
              : 'border-gray-200 text-gray-400 hover:border-green-300 hover:text-green-600 hover:bg-green-50'
            }`}
        >
          👍 Keep
        </button>

        {/* Tweak */}
        <button
          onClick={() => handleRate('tweak')}
          disabled={saving}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl py-2.5 border transition-all disabled:opacity-40
            ${selected === 'tweak'
              ? 'bg-orange-50 border-orange-300 text-orange-500'
              : 'border-gray-200 text-gray-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50'
            }`}
        >
          ✏️ Tweak
        </button>

        {/* Discard */}
        <button
          onClick={() => handleRate('discard')}
          disabled={saving}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl py-2.5 border transition-all disabled:opacity-40
            ${selected === 'discard'
              ? 'bg-red-50 border-red-300 text-red-500'
              : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50'
            }`}
        >
          👎 Discard
        </button>

      </div>
    </div>
  )
}
