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
  const [calendarToken, setCalendarToken]   = useState<string | null>(null)
  const [calendarToast, setCalendarToast]   = useState(false)
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

      const [planRes, profileRes] = await Promise.all([
        supabase
          .from('meal_plans')
          .select('plan, share_token, finalized')
          .eq('user_id', user.id)
          .eq('week_start', weekStart)
          .single(),
        supabase
          .from('profiles')
          .select('calendar_token')
          .eq('id', user.id)
          .single(),
        refreshRatings(),
      ])

      if (planRes.data?.plan) setPlan(planRes.data.plan as MealDay[])
      if (planRes.data?.share_token) setShareToken(planRes.data.share_token)
      if (planRes.data?.finalized) setFinalized(planRes.data.finalized)
      if (profileRes.data?.calendar_token) setCalendarToken(profileRes.data.calendar_token)

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
      if (data.calendar_token) setCalendarToken(data.calendar_token)
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
  function sharePlan() {
    if (!shareToken) return
    const url = `${window.location.origin}/plan/${shareToken}`
    setShareUrl(url)
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

      {calendarToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg">
          Calendar link copied! Paste it into Google/Apple Calendar 📅
        </div>
      )}

      {/* Share sheet */}
      {shareUrl && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-8"
          onClick={() => setShareUrl(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <p className="text-base font-bold text-gray-900 mb-1">Share this week&apos;s dinners</p>
            <p className="text-xs text-gray-400 mb-4">Send the plan to your family so they know what&apos;s cooking.</p>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent("Here's our dinner plan for the week 🍽️ " + shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShareUrl(null)}
              className="w-full flex items-center gap-3 bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95 text-white font-bold py-3.5 px-4 rounded-2xl transition-all mb-2"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Share via WhatsApp
            </a>

            {/* Copy link */}
            <button
              onClick={async () => {
                try { await navigator.clipboard.writeText(shareUrl) } catch {}
                setShareToast(true)
                setShareUrl(null)
                setTimeout(() => setShareToast(false), 2500)
              }}
              className="w-full flex items-center gap-3 border-2 border-gray-200 hover:border-orange-300 hover:text-orange-500 text-gray-700 font-semibold py-3.5 px-4 rounded-2xl transition-all active:scale-95 mb-3"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              Copy link
            </button>

            <button onClick={() => setShareUrl(null)}
              className="w-full text-sm text-gray-400 py-1">
              Cancel
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
                  <span>📖</span> I&apos;ll choose
                </button>
              )}
              {calendarToken && (
                <button
                  onClick={async () => {
                    const url = `${window.location.origin}/api/calendar/${calendarToken}`
                    try { await navigator.clipboard.writeText(url) } catch {}
                    setCalendarToast(true)
                    setTimeout(() => setCalendarToast(false), 3000)
                  }}
                  className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 border-2 border-gray-200 hover:border-orange-300 hover:text-orange-500 rounded-xl px-3 py-2 transition-all active:scale-95"
                >
                  <span>📅</span>
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
              We&apos;ll pick 5 dinners tailored to your family — ready in about 20 seconds.
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
