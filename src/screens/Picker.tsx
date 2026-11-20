import { Check, ChevronRight, History, Package, PencilLine, Plus, ScanBarcode, Search, Star } from 'lucide-react'
import { useState } from 'react'
import { BackButton, Page } from '../components/ui'
import { blankIngDraft } from './IngForm'
import { amountText, defaultQty, perText, r0 } from '../lib/nutrition'
import { useData } from '../lib/store'
import type { Ingredient } from '../lib/types'
import { useUI } from '../lib/ui'

export default function Picker() {
  const { draft, set, go, back } = useUI()
  const ings = useData((s) => s.ings)
  const favs = useData((s) => s.favs)
  const used = useData((s) => s.used)
  const touch = useData((s) => s.touch)
  const [q, setQ] = useState('')
  if (!draft) return null
  const inMeal = new Set(draft.items.map((i) => i.ing))
  const query = q.trim().toLowerCase()
  const match = (g: Ingredient) => !query || g.name.toLowerCase().includes(query)

  const favList = ings.filter((g) => favs.includes(g.id)).sort((a, b) => a.name.localeCompare(b.name))
  const recent = ings.filter((g) => !favs.includes(g.id) && used[g.id]).sort((a, b) => used[b.id] - used[a.id]).slice(0, 5)
  const shown = new Set([...favList, ...recent].map((g) => g.id))
  const rest = ings.filter((g) => !shown.has(g.id)).sort((a, b) => a.name.localeCompare(b.name))
  const groups = [
    { title: 'Favourites', Icon: Star, list: favList.filter(match) },
    { title: 'Recently used', Icon: History, list: recent.filter(match) },
    { title: favList.length || recent.length ? 'All ingredients' : 'My ingredients', Icon: Package, list: rest.filter(match) },
  ].filter((g) => g.list.length)

  const pick = (g: Ingredient) => {
    if (!inMeal.has(g.id)) {
      set({ draft: { ...draft, items: [...draft.items, { ing: g.id, qty: defaultQty(g.unit) }] } })
      touch([g.id])
    }
    back()
  }
  const createNew = () => {
    set({ ingDraft: blankIngDraft('builder', q.trim()) })
    go('ingForm')
  }

  return (
    <Page className="pb-10 slide">
      <header className="pt-safe px-4 pb-3 bg-white/30 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-3 mb-4"><BackButton /><h1 className="text-[22px] font-semibold">Add ingredient</h1></div>
        <label className="field h-12 px-4 rounded-[16px] soft border-2 flex items-center gap-2">
          <Search size={18} className="opacity-40" />
          <span className="sr-only">Search ingredients</span>
          <input id="ing-search" className="w-full text-[15px]" placeholder="Search my ingredients" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </header>
      <main className="px-4 space-y-4">
        <button type="button" className="tap w-full h-12 rounded-[16px] btn-warm text-[15px] font-bold flex items-center justify-center gap-2" onClick={() => set({ scanner: { purpose: 'meal' } })}>
          <ScanBarcode size={19} />Scan a barcode
        </button>
        <button type="button" className="tap w-full rounded-[22px] btn-dark p-4 flex items-center gap-3 text-left" onClick={createNew}>
          <div className="w-12 h-12 rounded-[16px] btn-warm flex items-center justify-center shrink-0"><PencilLine size={22} /></div>
          <div className="flex-1">
            <div className="text-[16px] font-semibold">{q.trim() ? `Create “${q.trim()}”` : 'New ingredient'}</div>
            <div className="text-[13px] text-white/60">Saved to your pantry too</div>
          </div>
          <ChevronRight size={20} className="opacity-60" />
        </button>
        {groups.map(({ title, Icon, list }) => (
          <section key={title}>
            <h2 className="text-[13px] font-bold text-sage-500 px-1 mb-2 flex items-center gap-1.5"><Icon size={14} />{title}</h2>
            <div className="card divide-y divide-forest-900/5">
              {list.map((g) => {
                const has = inMeal.has(g.id)
                return (
                  <button key={g.id} type="button" className={`tap w-full flex items-center gap-3 px-4 py-3 text-left ${has ? 'opacity-40' : ''}`} onClick={() => pick(g)}>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold truncate flex items-center gap-1.5">
                        {favs.includes(g.id) && <Star size={13} className="text-apricot shrink-0" fill="#F4A261" />}{g.name}
                      </div>
                      <div className="text-[12px]"><span className={g.stock ? 'font-bold text-forest-700' : 'opacity-50'}>{g.stock ? `${amountText(g.unit, g.stock)} in stock` : 'None in stock'}</span><span className="opacity-60"> · {r0(g.kcal)} kcal per {perText(g.unit)}</span></div>
                    </div>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${has ? 'tint' : 'bg-mint-300'}`}>{has ? <Check size={16} /> : <Plus size={16} />}</span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
        {!groups.length && <p className="text-center text-[14px] opacity-60 py-4">No match. Create it as a new ingredient above.</p>}
      </main>
    </Page>
  )
}
