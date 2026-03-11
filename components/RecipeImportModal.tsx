'use client'

import { useState, useEffect, useRef } from 'react'
import type { ImportedRecipe } from '@/app/api/import-recipe/route'
import type { LibraryRecipe } from '@/app/api/recipe-library/route'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const CUISINES = ['All', 'Italian', 'Asian', 'Mexican', 'Middle Eastern', 'American', 'Mediterranean', 'Indian', 'Japanese']

type Tab = 'import' | 'library' | 'mine'

interface RecipeImportModalProps {
  onClose: () => void
  onAddToPlan: (updatedPlan: unknown[]) => void
}

// ─── Bulk import state per URL ────────────────────────────────────────────────

interface UrlStatus {
  url: string
  status: 'pending' | 'loading' | 'done' | 'error'
  recipe?: ImportedRecipe
  error?: string
}

// ─── Day picker sheet ─────────────────────────────────────────────────────────

function DayPicker({
  recipe,
  onPick,
  onBack,
  error,
}: {
  recipe: { id?: string; meal_name: string; emoji: string }
  onPick: (day: string) => Promise<void>
  onBack: () => void
  error: string | null
}) {
  const [addingDay, setAddingDay] = useState<string | null>(null)

  return (
    <div className="space-y-3 mt-2">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl flex-shrink-0">
          {recipe.emoji}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm leading-tight">{recipe.meal_name}</p>
          <p className="text-xs text-gray-400">Which night should we cook this?</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600 mb-2">{error}</div>
      )}

      {DAYS.map(day => (
        <button
          key={day}
          onClick={async () => {
            setAddingDay(day)
            await onPick(day)
            setAddingDay(null)
          }}
          disabled={!!addingDay}
          className="w-full flex items-center justify-between bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 rounded-2xl px-4 py-3.5 transition-all disabled:opacity-50 group"
        >
          <span className="font-semibold text-gray-700 group-hover:text-orange-600 text-sm">{day}</span>
          {addingDay === day
            ? <div className="w-4 h-4 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin" />
            : <span className="text-gray-300 group-hover:text-orange-400">→</span>
          }
        </button>
      ))}

      <button onClick={onBack} className="w-full text-sm text-gray-400 hover:text-gray-600 py-2">← Back</button>
    </div>
  )
}

// ─── Recipe card (compact, for library browsing) ──────────────────────────────

function LibraryCard({
  recipe,
  onSelect,
}: {
  recipe: LibraryRecipe | ImportedRecipe
  onSelect: (r: LibraryRecipe | ImportedRecipe) => void
}) {
  const r = recipe as LibraryRecipe
  return (
    <button
      onClick={() => onSelect(recipe)}
      className="w-full text-left bg-white border border-gray-100 rounded-2xl p-3 hover:border-orange-200 hover:bg-orange-50/30 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl flex-shrink-0">
          {recipe.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{recipe.meal_name}</p>
          <p className="text-xs text-gray-400 truncate">{recipe.description}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-300">⏱ {recipe.cook_time_minutes} min</span>
            {r.cuisine && <span className="text-xs text-gray-300">· {r.cuisine}</span>}
            {r.kid_friendly && <span className="text-xs text-green-400">· 👶 Kid-friendly</span>}
          </div>
        </div>
        <span className="text-gray-200 group-hover:text-orange-300 flex-shrink-0">→</span>
      </div>
    </button>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function RecipeImportModal({ onClose, onAddToPlan }: RecipeImportModalProps) {
  const [tab, setTab]               = useState<Tab>('import')
  const [urlInput, setUrlInput]     = useState('')
  const [urlStatuses, setUrlStatuses] = useState<UrlStatus[]>([])
  const [importing, setImporting]   = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  // Library state
  const [libraryRecipes, setLibraryRecipes] = useState<LibraryRecipe[]>([])
  const [mineRecipes, setMineRecipes]       = useState<ImportedRecipe[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [search, setSearch]         = useState('')
  const [cuisine, setCuisine]       = useState('All')
  const [kidOnly, setKidOnly]       = useState(false)

  // Day picker
  const [dayPickerRecipe, setDayPickerRecipe] = useState<LibraryRecipe | ImportedRecipe | null>(null)
  const [dayPickerError, setDayPickerError]   = useState<string | null>(null)

  const importingRef = useRef(false)

  // ── Load library when tab switches ─────────────────────────────────────────

  useEffect(() => {
    if (tab === 'library' && libraryRecipes.length === 0) loadLibrary()
    if (tab === 'mine' && mineRecipes.length === 0) loadMine()
  }, [tab])

  async function loadLibrary() {
    setLibraryLoading(true)
    try {
      const res = await fetch('/api/recipe-library?tab=curated')
      if (res.ok) {
        const data = await res.json()
        setLibraryRecipes(data.recipes)
      }
    } finally {
      setLibraryLoading(false)
    }
  }

  async function loadMine() {
    setLibraryLoading(true)
    try {
      const res = await fetch('/api/recipe-library?tab=mine')
      if (res.ok) {
        const data = await res.json()
        setMineRecipes(data.recipes)
      }
    } finally {
      setLibraryLoading(false)
    }
  }

  // ── Bulk import ─────────────────────────────────────────────────────────────

  async function handleBulkImport() {
    const lines = urlInput.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'))
    if (!lines.length) {
      setImportError('Please enter at least one URL starting with http(s)://')
      return
    }
    if (lines.length > 10) {
      setImportError('Maximum 10 URLs at a time.')
      return
    }

    setImportError(null)
    setUrlStatuses(lines.map(url => ({ url, status: 'pending' })))
    setImporting(true)
    importingRef.current = true

    for (let i = 0; i < lines.length; i++) {
      if (!importingRef.current) break

      const url = lines[i]
      setUrlStatuses(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'loading' } : s))

      try {
        const res = await fetch('/api/import-recipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })
        const data = await res.json()

        if (res.ok) {
          setUrlStatuses(prev => prev.map((s, idx) =>
            idx === i ? { ...s, status: 'done', recipe: data.recipe } : s
          ))
          // Refresh "mine" tab if it was already loaded
          if (mineRecipes.length > 0) {
            setMineRecipes(prev => [data.recipe, ...prev.filter(r => r.source_url !== url)])
          }
        } else {
          setUrlStatuses(prev => prev.map((s, idx) =>
            idx === i ? { ...s, status: 'error', error: data.error ?? 'Failed' } : s
          ))
        }
      } catch {
        setUrlStatuses(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'error', error: 'Network error' } : s
        ))
      }
    }

    setImporting(false)
    importingRef.current = false
  }

  // ── Add to plan (for any recipe — curated or imported) ──────────────────────

  async function handleAddToPlan(day: string) {
    if (!dayPickerRecipe) return
    setDayPickerError(null)

    // For curated recipes: we need to save it first, then use the saved ID
    // For imported recipes: they already have an ID in saved_recipes
    let recipeId: string

    if ('source_url' in dayPickerRecipe) {
      // It's an ImportedRecipe — already saved
      recipeId = dayPickerRecipe.id
    } else {
      // It's a LibraryRecipe — save it to saved_recipes first, then add to plan
      const saveRes = await fetch('/api/import-recipe/from-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe: dayPickerRecipe }),
      })
      if (!saveRes.ok) {
        const d = await saveRes.json()
        setDayPickerError(d.error ?? 'Failed to save recipe')
        return
      }
      const saved = await saveRes.json()
      recipeId = saved.id
    }

    const res = await fetch('/api/import-recipe', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipe_id: recipeId, day }),
    })
    const data = await res.json()

    if (!res.ok) {
      setDayPickerError(data.error ?? 'Failed to add to plan')
      return
    }

    onAddToPlan(data.plan)
    onClose()
  }

  // ── Filtered library results ────────────────────────────────────────────────

  const filtered = libraryRecipes.filter(r => {
    if (cuisine !== 'All' && r.cuisine !== cuisine) return false
    if (kidOnly && !r.kid_friendly) return false
    if (search && !r.meal_name.toLowerCase().includes(search.toLowerCase()) &&
        !r.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // ── Day picker view ────────────────────────────────────────────────────────

  if (dayPickerRecipe) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
        <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[85vh] overflow-y-auto pb-8"
          onClick={e => e.stopPropagation()}>
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>
          <div className="px-5 pb-8">
            <div className="flex items-center justify-between py-4">
              <h2 className="text-lg font-extrabold text-gray-900">Add to plan</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">✕</button>
            </div>
            <DayPicker
              recipe={dayPickerRecipe}
              onPick={handleAddToPlan}
              onBack={() => { setDayPickerRecipe(null); setDayPickerError(null) }}
              error={dayPickerError}
            />
          </div>
        </div>
      </div>
    )
  }

  // ── Main modal ─────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-gray-900">Choose your own</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200">✕</button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {([
              { key: 'import',  label: '🔗 Import URL' },
              { key: 'library', label: '📖 Browse' },
              { key: 'mine',    label: '⭐ My recipes' },
            ] as { key: Tab; label: string }[]).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${
                  tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8">

          {/* ── Tab: Import URL ── */}
          {tab === 'import' && (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-gray-400">Paste up to 10 recipe URLs, one per line. They'll all be imported and saved to your library.</p>

              {importError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600">{importError}</div>
              )}

              {/* URL statuses */}
              {urlStatuses.length > 0 && (
                <div className="space-y-2">
                  {urlStatuses.map((s, i) => (
                    <div key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border text-xs
                      ${s.status === 'done'    ? 'bg-green-50 border-green-200' :
                        s.status === 'error'   ? 'bg-red-50 border-red-200' :
                        s.status === 'loading' ? 'bg-orange-50 border-orange-200' :
                        'bg-gray-50 border-gray-200'}`}>
                      <span className="flex-shrink-0">
                        {s.status === 'done'    ? '✅' :
                         s.status === 'error'   ? '❌' :
                         s.status === 'loading' ? <span className="inline-block w-3.5 h-3.5 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin" /> :
                         '⏳'}
                      </span>
                      <div className="flex-1 min-w-0">
                        {s.status === 'done' && s.recipe
                          ? <span className="font-medium text-green-700">{s.recipe.emoji} {s.recipe.meal_name}</span>
                          : s.status === 'error'
                          ? <span className="text-red-600">{s.error}</span>
                          : <span className="text-gray-500 truncate block">{s.url}</span>
                        }
                      </div>
                      {s.status === 'done' && s.recipe && (
                        <button
                          onClick={() => setDayPickerRecipe(s.recipe!)}
                          className="text-xs font-semibold text-orange-500 flex-shrink-0"
                        >
                          Add to plan
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Input */}
              {!importing && (
                <>
                  <textarea
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder={`https://www.bbcgoodfood.com/recipes/...\nhttps://www.allrecipes.com/recipe/...\nhttps://cooking.nytimes.com/recipes/...`}
                    rows={5}
                    className="w-full text-sm border border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-3 text-gray-700 placeholder-gray-300 resize-none font-mono"
                    autoFocus
                  />
                  <button
                    onClick={handleBulkImport}
                    disabled={!urlInput.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-4 rounded-2xl shadow transition-all disabled:opacity-40"
                  >
                    📥 Import recipes
                  </button>
                  <p className="text-center text-xs text-gray-300">Works with BBC Good Food, AllRecipes, NYT Cooking, and most food blogs</p>
                </>
              )}

              {importing && (
                <button
                  onClick={() => { importingRef.current = false; setImporting(false) }}
                  className="w-full text-sm text-gray-400 border border-gray-200 rounded-xl py-3 hover:text-red-500 hover:border-red-200 transition-all"
                >
                  Cancel import
                </button>
              )}
            </div>
          )}

          {/* ── Tab: Browse curated library ── */}
          {tab === 'library' && (
            <div className="pt-2 space-y-3">
              {/* Search + filters */}
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search recipes…"
                className="w-full text-sm border border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2.5 text-gray-700 placeholder-gray-300"
              />

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-1 overflow-x-auto pb-1 flex-1">
                  {CUISINES.map(c => (
                    <button
                      key={c}
                      onClick={() => setCuisine(c)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 transition-all
                        ${cuisine === c ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setKidOnly(!kidOnly)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 transition-all
                    ${kidOnly ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  👶 Kids
                </button>
              </div>

              {libraryLoading && (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                </div>
              )}

              {!libraryLoading && filtered.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">
                  {libraryRecipes.length === 0
                    ? 'No recipes yet — run the seeder script to populate the library.'
                    : 'No recipes match your search.'}
                </div>
              )}

              {!libraryLoading && filtered.map(r => (
                <LibraryCard key={r.id} recipe={r} onSelect={setDayPickerRecipe} />
              ))}
            </div>
          )}

          {/* ── Tab: My imported recipes ── */}
          {tab === 'mine' && (
            <div className="pt-2 space-y-3">
              {libraryLoading && (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                </div>
              )}

              {!libraryLoading && mineRecipes.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">
                  No imported recipes yet. Use the Import URL tab to save your first recipe.
                </div>
              )}

              {!libraryLoading && mineRecipes.map(r => (
                <LibraryCard key={r.id} recipe={r} onSelect={setDayPickerRecipe} />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
