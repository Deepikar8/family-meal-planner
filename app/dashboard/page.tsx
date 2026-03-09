'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import MealCard from '@/components/MealCard'
import GroceryList from '@/components/GroceryList'
import type { MealDay } from '@/app/api/generate-plan/route'

type View = 'plan' | 'grocery'

export default function DashboardPage() {
  const supabase = createClient()

  const [plan, setPlan]               = useState<MealDay[] | null>(null)
  const [shareToken, setShareToken]   = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)
  const [generating, setGenerating]   = useState(false)
  const [swappingDay, setSwappingDay] = useState<string | null>(null)
  const [view, setView]               = useState<View>('plan')
  const [userName, setUserName]       = useState('')
  const [error, setError]             = useState<string | null>(null)
  const [shareToast, setShareToast]   = useState(false)
  const [shareUrl, setShareUrl]       = useState<string | null>(null)

  // ── Load existing plan on mount ──────────────────────────────────────────────
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

      const { data } = await supabase
        .from('meal_plans')
        .select('plan, share_token')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .single()

      if (data?.plan) setPlan(data.plan as MealDay[])
      if (data?.share_token) setShareToken(data.share_token)
      setLoading(false)
    }
    load()
  }, [])

  // ── Generate a full week plan ────────────────────────────────────────────────
  async function generatePlan() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/generate-plan', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setPlan(data.plan)
      setShareToken(data.share_token)
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
    } catch {
      setError('Swap failed. Please try again.')
    } finally {
      setSwappingDay(null)
    }
  }

  // ── Share plan ───────────────────────────────────────────────────────────────
  async function sharePlan() {
    if (!shareToken) return
    const url = `${window.location.origin}/plan/${shareToken}`

    try {
      if (navigator.share) {
        // Native share sheet (mobile) — AbortError means user cancelled, ignore it
        await navigator.share({
          title: "This week's dinners",
          text: "Here's our dinner plan for the week 🍽️",
          url,
        })
      } else {
        // Desktop fallback: copy to clipboard
        await navigator.clipboard.writeText(url)
        setShareToast(true)
        setTimeout(() => setShareToast(false), 2500)
      }
    } catch (err) {
      // AbortError = user dismissed native share dialog — treat as no-op
      if (err instanceof Error && err.name === 'AbortError') return
      // Clipboard blocked (e.g. HTTP, permissions) — show the link directly
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

      {/* Share link fallback — shown when clipboard is unavailable */}
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

          {/* Share button — only shown when plan exists */}
          {plan && !generating && (
            <button
              onClick={sharePlan}
              className="flex items-center gap-1.5 text-sm font-semibold text-orange-500 border-2 border-orange-200 hover:border-orange-400 rounded-xl px-3 py-2 transition-all active:scale-95"
            >
              <span>↗</span> Share
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 py-5 space-y-3 pb-36">

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
              Claude is choosing 5 meals your family will actually want to eat.
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
              Generate my dinner plan →
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
          />
        ))}
      </div>

      {/* Sticky bottom bar */}
      {plan && !generating && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 py-4 bg-white border-t border-gray-100">
          <button
            onClick={() => setView('grocery')}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-4 rounded-2xl shadow-lg transition-all text-base mb-2"
          >
            🛒 Get grocery list
          </button>
          <button
            onClick={generatePlan}
            disabled={generating}
            className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors disabled:opacity-40"
          >
            ↻ Generate a new plan
          </button>
        </div>
      )}

    </main>
  )
}
