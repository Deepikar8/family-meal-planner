'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import MealCard from '@/components/MealCard'
import GroceryList from '@/components/GroceryList'
import RecipeImportModal from '@/components/RecipeImportModal'
import type { MealDay } from '@/app/api/generate-plan/route'
import type { MealRatingsResponse } from '@/app/api/meal-ratings/route'

type View = 'plan' | 'grocery'
type RatingMap = Record<string, { type: 'keep' | 'discard' | 'tweak'; notes?: string | null }>

export default function DashboardPage() {
  const supabase = createClient()

  const [plan, setPlan]                     = useState<MealDay[] | null>(null)
  const [shareToken, setShareToken]         = useState<string | null>(null)
  const [finalized, setFinalized]           = useState(false)
  const [loading, setLoading]               = useState(true)
  const [generating, setGenerating]         = useState(false)
  const [swappingDay, setSwappingDay]       = useState<string | null>(null)
  const [view, setView]                     = useState<View>('plan')
  const [userName, setUserName]             = useState('')
  const [error, setError]                   = useState<string | null>(null)
  const [shareToast, setShareToast]         = useState(false)
  const [shareUrl, setShareUrl]             = useState<string | null>(null)
  const [ratings, setRatings]               = useState<RatingMap>({})
  const [importOpen, setImportOpen]         = useState(false)
  const [confirmStartOver, setConfirmStartOver] = useState(false)

  // ── Ratings helper — fetch and rebuild the lookup map ────────────────────────
  async function refreshRatings() {
    const res = await fetch('/api/meal-ratings')
    if (!res.ok) return
    const data: MealRatingsResponse = await res.json()
    const map: RatingMap = {}
    data.kept.forEach(name => { map[name] = { type: 'keep' } })
    data.discarded.forEach(name => { map[name] = { type: 'discard' } })
    data.tweaked.forEach(({ name, notes }) => { map[name] = { type: 'tweak', notes } })
    setRatings(map)
  }

  // ── Load existing plan + ratings on mount ────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const name = user.user_metadata?.full_name?.split(' ')[0] || ''
      setUserName(name)

      const today = new Date()
      const monday = new Date(today)
      monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
      const weekStart = monday.toISOString().split('T')[0]

      const [planRes] = await Promise.all([
        supabase
          .from('meal_plans')
          .select('plan, share_token, finalized')
          .eq('user_id', user.id)
          .eq('week_start', weekStart)
          .single(),
        refreshRatings(),
      ])

      if (planRes.data?.plan) setPlan(planRes.data.plan as MealDay[])
      if (planRes.data?.share_token) setShareToken(planRes.data.share_token)
      if (planRes.data?.finalized) setFinalized(planRes.data.finalized)

      setLoading(false)
    }
    load()
  }, [])

  // ── Generate a full week plan ────────────────────────────────────────────────
  async function generatePlan() {
    setGenerating(true)
    setFinalized(false)
    setError(null)
    setConfirmStartOver(false)
    try {
      const res = await fetch('/api/generate-plan', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setPlan(data.plan)
      setShareToken(data.share_token)
      await refreshRatings()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // ── Swap a single meal ───────────────────────────────────────────────────────
  async function swapMeal(day: string) {
    if (!plan) return
    setSwappingDay(day)
    setError(null)
    try {
      const res = await fetch('/api/swap-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, current_plan: plan }),
      })
      if (!res.ok) throw new Error()
      const { meal } = await res.json()
      setPlan(prev => prev!.map(m => m.day === day ? meal : m))
      await refreshRatings()
    } catch {
      setError('Swap failed. Please try again.')
    } finally {
      setSwappingDay(null)
    }
  }

  // ── Toggle finalized state ────────────────────────────────────────────────────
  async function toggleFinalize(value: boolean) {
    setFinalized(value)
    await fetch('/api/finalize-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ finalized: value }),
    })
  }

  // ── Share plan ───────────────────────────────────────────────────────────────
  async function sharePlan() {
    if (!shareToken) return
    const url = `${window.location.origin}/plan/${shareToken}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: "This week's dinners",
          text: "Here's our dinner plan for the week 🍽️",
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        setShareToast(true)
        setTimeout(() => setShareToast(false), 2500)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setShareUrl(url)
    }
  }

  // ── Grocery list overlay ─────────────────────────────────────────────────────
  if (view === 'grocery' && plan) {
    return <GroceryList plan={plan} onClose={() => setView('plan')} />
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">

      {/* Copied-to-clipboard toast */}
      {shareToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg">
          Link copied! Send it to your family 🎉
        </div>
      )}

      {/* Share link fallback */}
      {shareUrl && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-8"
          onClick={() => setShareUrl(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <p className="text-sm font-semibold text-gray-900 mb-1">Share this link with your family</p>
            <p className="text-xs text-gray-400 mb-3">Copy and send it via WhatsApp, iMessage, or email.</p>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-4">
              <span className="text-xs text-gray-600 flex-1 truncate">{shareUrl}</span>
              <button
                onClick={async () => {
                  try { await navigator.clipboard.writeText(shareUrl) } catch {}
                  setShareToast(true)
                  setShareUrl(null)
                  setTimeout(() => setShareToast(false), 2500)
                }}
                className="text-xs font-bold text-orange-500 flex-shrink-0"
              >
                Copy
              </button>
            </div>
            <button onClick={() => setShareUrl(null)}
              className="w-full text-sm text-gray-400 py-1">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Start over confirmation dialog */}
      {confirmStartOver && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-8"
          onClick={() => setConfirmStartOver(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <p className="text-base font-bold text-gray-900 mb-1">Start over?</p>
            <p className="text-sm text-gray-500 mb-5">
              This will replace your current plan with a new set of meals. Any swaps or imports you made will be lost.
            </p>
            <button
              onClick={generatePlan}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl transition-all active:scale-95 mb-2"
            >
              Yes, start over
            </button>
            <button
              onClick={() => setConfirmStartOver(false)}
              className="w-full text-sm text-gray-400 py-2"
            >
              Keep my current plan
            </button>
          </div>
        </div>
      )}

      {/* Recipe import modal */}
      {importOpen && (
        <RecipeImportModal
          onClose={() => setImportOpen(false)}
          onAddToPlan={async (updatedPlan) => { setPlan(updatedPlan as MealDay[]); await refreshRatings() }}
        />
      )}

      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">
              {userName ? `Hey ${userName} 👋` : "This week's dinners"}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {plan ? 'Your dinner plan for this week' : "Let's plan your dinners"}
            </p>
          </div>

          {/* Header action buttons */}
          {plan && !generating && (
            <div className="flex items-center gap-2">
              {/* Only show "I'll choose" when not locked */}
              {!finalized && (
                <button
                  onClick={() => setImportOpen(true)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 border-2 border-gray-200 hover:border-orange-300 hover:text-orange-500 rounded-xl px-3 py-2 transition-all active:scale-95"
                >
                  <span>📖</span> I'll choose
                </button>
              )}
              <button
                onClick={sharePlan}
                className="flex items-center gap-1.5 text-sm font-semibold text-orange-500 border-2 border-orange-200 hover:border-orange-400 rounded-xl px-3 py-2 transition-all active:scale-95"
              >
                <span>↗</span> Share
              </button>
            </div>
          )}
        </div>

        {/* Locked banner */}
        {finalized && plan && (
          <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
            <span className="text-green-500 text-base">✓</span>
            <p className="text-sm font-semibold text-green-700 flex-1">
              Week locked — share the link so your family can shop
            </p>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 py-5 space-y-3 pb-44">

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <div className="w-10 h-10 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin mb-4" />
            <p className="text-gray-400 text-sm">Loading your plan…</p>
          </div>
        )}

        {/* Generating */}
        {!loading && generating && (
          <div className="flex flex-col items-center justify-center pt-16 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-5 animate-pulse">
              <span className="text-3xl">🍽️</span>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Picking your dinners…</h2>
            <p className="text-gray-400 text-sm max-w-xs">
              Choosing 5 meals your family will actually want to eat.
            </p>
            <div className="flex gap-2 mt-6">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-orange-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !generating && !plan && (
          <div className="flex flex-col items-center justify-center pt-16 text-center px-4">
            <div className="text-5xl mb-5">🗓️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to plan this week?</h2>
            <p className="text-gray-500 text-sm max-w-xs mb-8">
              We'll pick 5 dinners tailored to your family — ready in about 20 seconds.
            </p>
            <button
              onClick={generatePlan}
              className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold px-8 py-4 rounded-2xl shadow-lg transition-all text-base"
            >
              ✨ AI, plan my week →
            </button>
          </div>
        )}

        {/* Meal cards */}
        {!loading && !generating && plan && plan.map(meal => (
          <MealCard
            key={meal.day}
            meal={meal}
            onSwap={() => swapMeal(meal.day)}
            swapping={swappingDay === meal.day}
            existingRating={ratings[meal.meal_name] ?? null}
            locked={finalized}
          />
        ))}
      </div>

      {/* Sticky bottom bar */}
      {plan && !generating && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 py-4 bg-white border-t border-gray-100">
          {finalized ? (
            /* ── Locked state ─────────────────────────────────────── */
            <>
              <button
                onClick={sharePlan}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-4 rounded-2xl shadow-lg transition-all text-base mb-2"
              >
                ↗ Share with family
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView('grocery')}
                  className="flex-1 flex items-center justify-center gap-1.5 border-2 border-gray-200 text-gray-600 font-semibold py-3 rounded-2xl text-sm hover:border-orange-300 hover:text-orange-500 transition-all active:scale-95"
                >
                  🛒 Grocery list
                </button>
                <button
                  onClick={() => toggleFinalize(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 border-2 border-gray-200 text-gray-400 font-semibold py-3 rounded-2xl text-sm hover:border-gray-300 hover:text-gray-600 transition-all active:scale-95"
                >
                  🔓 Unlock to edit
                </button>
              </div>
            </>
          ) : (
            /* ── Editing state ────────────────────────────────────── */
            <>
              <button
                onClick={() => setView('grocery')}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-4 rounded-2xl shadow-lg transition-all text-base mb-2"
              >
                🛒 Get grocery list
              </button>
              <button
                onClick={() => toggleFinalize(true)}
                className="w-full flex items-center justify-center gap-2 border-2 border-green-400 text-green-600 font-bold py-3 rounded-2xl text-sm hover:bg-green-50 transition-all active:scale-95 mb-1"
              >
                ✓ Finalise this week
              </button>
              <button
                onClick={() => setConfirmStartOver(true)}
                disabled={generating}
                className="w-full text-sm text-gray-400 hover:text-gray-600 py-1.5 transition-colors disabled:opacity-40"
              >
                ↻ Start over
              </button>
            </>
          )}
        </div>
      )}

    </main>
  )
}
