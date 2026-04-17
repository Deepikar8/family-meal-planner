'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LandingPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function signInWithGoogle() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-10 text-center">

        {/* Logo mark */}
        <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center mb-8 shadow-lg">
          <span className="text-3xl">🍽️</span>
        </div>

        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-4">
          No more<br />&quot;what&apos;s for dinner?&quot;
        </h1>
        <p className="text-lg text-gray-500 max-w-xs leading-relaxed mb-10">
          Get a week of family dinners planned and a grocery list ready — in under 3 minutes.
        </p>

        {/* Sign in button */}
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full max-w-xs flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 font-semibold text-base shadow-sm hover:border-orange-400 hover:shadow-md active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <svg className="animate-spin w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
            </svg>
          )}
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        {error && (
          <p className="mt-4 text-sm text-red-500">{error}</p>
        )}

        <p className="mt-6 text-xs text-gray-400">
          Free to start · No credit card needed
        </p>
      </div>

      {/* Value props */}
      <div className="px-6 pb-12">
        <div className="max-w-xs mx-auto space-y-4">
          {[
            { icon: '⚡', title: '3-minute setup', desc: 'Tell us who\'s eating, we handle the rest' },
            { icon: '🛒', title: 'Grocery list included', desc: 'Send it to WhatsApp with one tap' },
            { icon: '🧠', title: 'Gets smarter every week', desc: 'Rate meals and your plans improve over time' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 text-xl">
                {item.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </main>
  )
}
