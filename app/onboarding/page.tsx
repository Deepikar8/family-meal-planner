'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type MemberType = 'adult' | 'kid'

interface FamilyMember {
  id: string
  name: string
  type: MemberType
}

type Step = 'household' | 'restrictions' | 'dislikes' | 'saving'

// ─── Data ─────────────────────────────────────────────────────────────────────

const DIETARY_OPTIONS = [
  { id: 'nut-free',     label: 'Nut-Free',     emoji: '🥜' },
  { id: 'gluten-free',  label: 'Gluten-Free',  emoji: '🌾' },
  { id: 'dairy-free',   label: 'Dairy-Free',   emoji: '🥛' },
  { id: 'vegetarian',   label: 'Vegetarian',   emoji: '🥦' },
  { id: 'vegan',        label: 'Vegan',        emoji: '🌱' },
  { id: 'halal',        label: 'Halal',        emoji: '☪️'  },
  { id: 'kosher',       label: 'Kosher',       emoji: '✡️'  },
  { id: 'no-seafood',   label: 'No Seafood',   emoji: '🐟' },
  { id: 'no-pork',      label: 'No Pork',      emoji: '🐷' },
  { id: 'low-carb',     label: 'Low-Carb',     emoji: '🥩' },
]

const DISLIKE_SUGGESTIONS = [
  'Mushrooms', 'Spicy food', 'Shellfish', 'Broccoli',
  'Onions', 'Tomatoes', 'Peppers', 'Liver',
  'Lamb', 'Eggplant', 'Brussels sprouts', 'Cilantro',
]

const STEPS: Step[] = ['household', 'restrictions', 'dislikes', 'saving']
const STEP_LABELS = ['Your family', 'Dietary needs', 'Dislikes']

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep]             = useState<Step>('household')
  const [members, setMembers]       = useState<FamilyMember[]>([
    { id: '1', name: '', type: 'adult' },
  ])
  const [restrictions, setRestrictions] = useState<string[]>([])
  const [dislikes, setDislikes]     = useState<string[]>([])
  const [customDislike, setCustomDislike] = useState('')
  const [saving, setSaving]         = useState(false)

  const currentStepIndex = STEPS.indexOf(step)

  // ── Household helpers ──────────────────────────────────────────────────────

  function addMember() {
    setMembers(prev => [...prev, { id: Date.now().toString(), name: '', type: 'adult' }])
  }

  function removeMember(id: string) {
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  function updateMember(id: string, field: keyof FamilyMember, value: string) {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  // ── Restrictions helpers ───────────────────────────────────────────────────

  function toggleRestriction(id: string) {
    setRestrictions(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  // ── Dislikes helpers ───────────────────────────────────────────────────────

  function toggleDislike(item: string) {
    setDislikes(prev =>
      prev.includes(item) ? prev.filter(d => d !== item) : [...prev, item]
    )
  }

  function addCustomDislike() {
    const val = customDislike.trim()
    if (val && !dislikes.includes(val)) {
      setDislikes(prev => [...prev, val])
    }
    setCustomDislike('')
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  function goNext() {
    if (step === 'household')    setStep('restrictions')
    if (step === 'restrictions') setStep('dislikes')
    if (step === 'dislikes')     handleSave()
  }

  function goBack() {
    if (step === 'restrictions') setStep('household')
    if (step === 'dislikes')     setStep('restrictions')
  }

  // ── Save to Supabase ───────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true)
    setStep('saving')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    // Upsert the profile with household data
    await supabase.from('profiles').upsert({
      id: user.id,
      family_members: members.filter(m => m.name.trim()),
      dietary_restrictions: restrictions,
      dislikes,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    })

    // Small pause so the "generating" animation feels real
    await new Promise(r => setTimeout(r, 2200))
    router.push('/dashboard')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-white flex flex-col max-w-md mx-auto px-6">

      {/* Header */}
      {step !== 'saving' && (
        <div className="pt-12 pb-6">
          {/* Progress dots */}
          <div className="flex items-center gap-2 mb-6">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`h-2 rounded-full transition-all duration-300 ${
                  i < currentStepIndex  ? 'w-6 bg-orange-500' :
                  i === currentStepIndex ? 'w-8 bg-orange-500' :
                  'w-6 bg-gray-200'
                }`} />
              </div>
            ))}
            <span className="ml-2 text-xs text-gray-400 font-medium">
              {currentStepIndex + 1} of {STEP_LABELS.length}
            </span>
          </div>

          {/* Back button */}
          {currentStepIndex > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4 tap-highlight-none"
            >
              ← Back
            </button>
          )}
        </div>
      )}

      {/* ── Step: Household ─────────────────────────────────────────────────── */}
      {step === 'household' && (
        <div className="flex-1 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Who's eating?</h2>
          <p className="text-gray-500 mb-8 text-sm">Add everyone in your household. You can always change this later.</p>

          <div className="space-y-3 mb-6">
            {members.map((member, index) => (
              <div key={member.id} className="flex items-center gap-3">
                {/* Name input */}
                <input
                  type="text"
                  placeholder={index === 0 ? 'Your name' : `Person ${index + 1}`}
                  value={member.name}
                  onChange={e => updateMember(member.id, 'name', e.target.value)}
                  className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-orange-400 transition-colors"
                />

                {/* Adult / Kid toggle */}
                <div className="flex rounded-xl border-2 border-gray-200 overflow-hidden">
                  {(['adult', 'kid'] as MemberType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => updateMember(member.id, 'type', type)}
                      className={`px-3 py-3 text-xs font-semibold capitalize transition-colors tap-highlight-none ${
                        member.type === type
                          ? 'bg-orange-500 text-white'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {type === 'adult' ? '🧑 Adult' : '🧒 Kid'}
                    </button>
                  ))}
                </div>

                {/* Remove (only show if more than 1 member) */}
                {members.length > 1 && (
                  <button
                    onClick={() => removeMember(member.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors tap-highlight-none"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add person */}
          {members.length < 8 && (
            <button
              onClick={addMember}
              className="flex items-center gap-2 text-orange-500 font-semibold text-sm mb-auto tap-highlight-none hover:text-orange-600"
            >
              <span className="w-7 h-7 rounded-full border-2 border-orange-400 flex items-center justify-center text-lg leading-none">+</span>
              Add another person
            </button>
          )}

          <div className="mt-auto pt-8 pb-8">
            <NextButton onClick={goNext} disabled={!members.some(m => m.name.trim())} />
          </div>
        </div>
      )}

      {/* ── Step: Restrictions ──────────────────────────────────────────────── */}
      {step === 'restrictions' && (
        <div className="flex-1 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Any dietary needs?</h2>
          <p className="text-gray-500 mb-8 text-sm">Select all that apply. We'll make sure every dinner works for your family.</p>

          <div className="grid grid-cols-2 gap-3 mb-auto">
            {DIETARY_OPTIONS.map(opt => {
              const selected = restrictions.includes(opt.id)
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleRestriction(opt.id)}
                  className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-all tap-highlight-none active:scale-95 ${
                    selected
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className={`text-sm font-semibold ${selected ? 'text-orange-700' : 'text-gray-700'}`}>
                    {opt.label}
                  </span>
                  {selected && (
                    <span className="ml-auto text-orange-500 text-sm">✓</span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="pt-6 pb-8 space-y-3">
            <NextButton onClick={goNext} label="Looks good →" />
            <SkipButton onClick={goNext} />
          </div>
        </div>
      )}

      {/* ── Step: Dislikes ──────────────────────────────────────────────────── */}
      {step === 'dislikes' && (
        <div className="flex-1 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Anything they won't eat?</h2>
          <p className="text-gray-500 mb-6 text-sm">Optional — we'll keep these off the menu.</p>

          {/* Suggestions */}
          <div className="flex flex-wrap gap-2 mb-6">
            {DISLIKE_SUGGESTIONS.map(item => {
              const selected = dislikes.includes(item)
              return (
                <button
                  key={item}
                  onClick={() => toggleDislike(item)}
                  className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all tap-highlight-none active:scale-95 ${
                    selected
                      ? 'border-orange-500 bg-orange-500 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {selected ? '✓ ' : ''}{item}
                </button>
              )
            })}
          </div>

          {/* Custom input */}
          <div className="flex gap-2 mb-auto">
            <input
              type="text"
              placeholder="Add your own…"
              value={customDislike}
              onChange={e => setCustomDislike(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomDislike()}
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors"
            />
            <button
              onClick={addCustomDislike}
              disabled={!customDislike.trim()}
              className="px-4 py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40 tap-highlight-none"
            >
              Add
            </button>
          </div>

          {/* Custom dislikes chips */}
          {dislikes.filter(d => !DISLIKE_SUGGESTIONS.includes(d)).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {dislikes.filter(d => !DISLIKE_SUGGESTIONS.includes(d)).map(item => (
                <button
                  key={item}
                  onClick={() => toggleDislike(item)}
                  className="px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-medium tap-highlight-none"
                >
                  ✓ {item}
                </button>
              ))}
            </div>
          )}

          <div className="pt-8 pb-8 space-y-3">
            <NextButton
              onClick={goNext}
              label={saving ? 'Building your plan…' : 'Generate my dinner plan →'}
              disabled={saving}
            />
            <SkipButton onClick={goNext} label="Skip — generate my plan" />
          </div>
        </div>
      )}

      {/* ── Step: Saving / Generating ───────────────────────────────────────── */}
      {step === 'saving' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center pb-16">
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-6 animate-pulse">
            <span className="text-4xl">🍽️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Building your first<br />dinner plan…
          </h2>
          <p className="text-gray-500 text-sm max-w-xs">
            We're picking 5 dinners your family will actually want to eat. This only takes a moment.
          </p>
          <div className="flex gap-2 mt-8">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-orange-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

    </main>
  )
}

// ─── Small shared components ───────────────────────────────────────────────────

function NextButton({
  onClick, label = 'Continue →', disabled = false
}: { onClick: () => void; label?: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-4 bg-orange-500 text-white font-bold text-base rounded-2xl shadow-sm hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed tap-highlight-none"
    >
      {label}
    </button>
  )
}

function SkipButton({
  onClick, label = 'Skip for now'
}: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 text-gray-400 text-sm font-medium hover:text-gray-600 tap-highlight-none"
    >
      {label}
    </button>
  )
}
