import { Loader2, Search } from 'lucide-react'
import { useState } from 'react'
import { BackButton, Page } from '../components/ui'
import { FoodFactsError, searchFoods, type FoodMatch } from '../lib/foodfacts'
import { perText, r0, r1 } from '../lib/nutrition'
import { useUI } from '../lib/ui'
import { draftFromMatch } from './scan'

export default function FoodSearch() {
  const { ingDraft, set, back, say } = useUI()
  const [q, setQ] = useState(ingDraft?.name ?? '')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [results, setResults] = useState<FoodMatch[]>([])

  const run = async () => {
    const term = q.trim()
    if (term.length < 2) return
    setState('loading')
    try {
      setResults(await searchFoods(term))
      setState('done')
    } catch (e) {
      const kind = e instanceof FoodFactsError ? e.kind : 'unavailable'
      setError(kind === 'offline' ? "You're offline. Search needs an internet connection." : "The food database's search isn't responding right now. Try again later, scan the barcode, or enter it from the label.")
      setState('error')
    }
  }

  const pick = (m: FoodMatch) => {
    if (!ingDraft) return back()
    set({ ingDraft: draftFromMatch(m, ingDraft) })
    back()
    say('Filled in. Check the values against the label, then save')
  }

  return (
    <Page className="pb-10 slide">
      <header className="pt-safe px-4 pb-3 bg-white/30 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-3 mb-1"><BackButton /><h1 className="text-[22px] font-semibold">Search food database</h1></div>
        <p className="text-[13px] opacity-60 mb-3 px-1">From Open Food Facts, a free public database. Values are per 100 g or 100 ml.</p>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run() }}>
          <label className="field flex-1 h-12 px-4 rounded-[16px] soft border-2 flex items-center gap-2">
            <Search size={18} className="opacity-40" /><span className="sr-only">Food name</span>
            <input id="food-search" autoFocus enterKeyHint="search" className="w-full text-[15px]" placeholder="e.g. Fage Greek yogurt" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <button type="submit" disabled={q.trim().length < 2 || state === 'loading'} className="tap h-12 px-5 rounded-[16px] btn-dark text-[15px] font-bold disabled:opacity-40">Search</button>
        </form>
      </header>
      <main className="px-4 space-y-3">
        {state === 'loading' && <p className="flex items-center justify-center gap-2 py-8 opacity-70"><Loader2 size={18} className="animate-spin" />Searching…</p>}
        {state === 'error' && <div className="rounded-[18px] bg-peach px-4 py-3 text-[14px]">{error}</div>}
        {state === 'done' && !results.length && <p className="text-center opacity-60 py-8">Nothing found. Try fewer words, or the brand name.</p>}
        {results.length > 0 && (
          <div className="card divide-y divide-forest-900/5">
            {results.map((m) => (
              <button key={m.barcode} type="button" className="tap w-full text-left px-4 py-3" onClick={() => pick(m)}>
                <div className="text-[15px] font-semibold">{m.name}</div>
                <div className="text-[12px] opacity-60 mt-0.5">
                  {r0(m.kcal ?? 0)} kcal per {perText(m.unit)} · P {r1(m.p ?? 0)} · C {r1(m.c ?? 0)} · F {r1(m.f ?? 0)}{m.pack ? ` · pack ${m.pack}${m.unit === '100ml' ? ' ml' : ' g'}` : ''}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </Page>
  )
}
