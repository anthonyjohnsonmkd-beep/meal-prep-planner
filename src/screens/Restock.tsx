import { Check, History, Minus, Package, Plus, ScanBarcode, Search, Star } from 'lucide-react'
import { useState } from 'react'
import { BackButton, CatBadge, Footer, Page, Primary } from '../components/ui'
import { amountText } from '../lib/nutrition'
import { useData } from '../lib/store'
import type { Ingredient } from '../lib/types'
import { useUI } from '../lib/ui'

/** One tap adds a pack, or 1 piece / 100 g / 100 ml when no pack size is set. */
const stepFor = (g: Ingredient) => g.pack ?? (g.unit === 'piece' ? 1 : 100)
const unitLabel = (g: Ingredient) => (g.unit === 'piece' ? '' : g.unit === '100ml' ? 'ml' : 'g')

export default function Restock() {
  const { back, say } = useUI()
  const ings = useData((s) => s.ings)
  const favs = useData((s) => s.favs)
  const used = useData((s) => s.used)
  const addStock = useData((s) => s.addStock)
  const [q, setQ] = useState('')
  const adds = useUI((s) => s.restockAdds)
  const set = useUI((s) => s.set)
  const query = q.trim().toLowerCase()
  const match = (g: Ingredient) => !query || g.name.toLowerCase().includes(query)
  const picked = Object.entries(adds).filter(([, v]) => v > 0)

  const favList = ings.filter((g) => favs.includes(g.id)).sort((a, b) => a.name.localeCompare(b.name))
  const recent = ings.filter((g) => !favs.includes(g.id) && used[g.id]).sort((a, b) => used[b.id] - used[a.id]).slice(0, 5)
  const shown = new Set([...favList, ...recent].map((g) => g.id))
  const rest = ings.filter((g) => !shown.has(g.id)).sort((a, b) => a.name.localeCompare(b.name))
  const groups = [
    { title: 'Favourites', Icon: Star, list: favList.filter(match) },
    { title: 'Recently used', Icon: History, list: recent.filter(match) },
    { title: favList.length || recent.length ? 'All ingredients' : 'My ingredients', Icon: Package, list: rest.filter(match) },
  ].filter((g) => g.list.length)

  const change = (g: Ingredient, v: number) => set({ restockAdds: { ...useUI.getState().restockAdds, [g.id]: Math.max(0, v) } })
  const save = () => {
    if (!picked.length) return say('Add at least one thing you bought')
    addStock(Object.fromEntries(picked))
    set({ restockAdds: {} })
    back()
    say(`Added ${picked.length} ${picked.length === 1 ? 'item' : 'items'} to your stock`)
  }

  return (
    <Page className="pb-36 slide">
      <header className="pt-safe px-4 pb-3 bg-white/30 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-3 mb-1">
          <BackButton close /><h1 className="text-[22px] font-semibold flex-1">I bought…</h1>
          <button type="button" className="tap h-11 px-4 rounded-full btn-warm text-[14px] font-bold flex items-center gap-1.5" onClick={() => set({ scanner: { purpose: 'restock' } })}>
            <ScanBarcode size={18} />Scan
          </button>
        </div>
        <p className="text-[13px] opacity-60 mb-3 px-1">Scan each product, or tap + for one pack, or type the amount.</p>
        <label className="field h-12 px-4 rounded-[16px] soft border-2 flex items-center gap-2">
          <Search size={18} className="opacity-40" /><span className="sr-only">Search ingredients</span>
          <input id="restock-search" className="w-full text-[15px]" placeholder="Search my ingredients" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </header>
      <main className="px-4 space-y-4">
        {groups.map(({ title, Icon, list }) => (
          <section key={title}>
            <h2 className="text-[13px] font-bold text-sage-500 px-1 mb-2 flex items-center gap-1.5"><Icon size={14} />{title}</h2>
            <div className="card divide-y divide-forest-900/5">
              {list.map((g) => {
                const v = adds[g.id] ?? 0
                const step = stepFor(g)
                return (
                  <div key={g.id} className={`flex items-center gap-3 px-3.5 py-3 ${v > 0 ? 'bg-peach/40' : ''}`}>
                    <CatBadge cat={g.cat} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-bold truncate">{g.name}</div>
                      <div className="text-[12px] opacity-60">
                        {g.stock ? `${amountText(g.unit, g.stock)} in stock` : 'None in stock'}
                        {g.pack ? ` · pack ${amountText(g.unit, g.pack)}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-[14px] p-1 tint shrink-0">
                      <button type="button" aria-label={`Less ${g.name}`} className="tap w-9 h-9 rounded-[11px] bg-white flex items-center justify-center disabled:opacity-30"
                        disabled={!v} onClick={() => change(g, v - step)}><Minus size={16} /></button>
                      <label className="flex items-baseline justify-center w-[68px]">
                        <span className="sr-only">Amount of {g.name} bought</span>
                        <input inputMode="decimal" className={`${unitLabel(g) ? 'w-11 text-right' : 'w-full text-center'} text-[14px] font-bold`} placeholder="0"
                          value={v ? String(v) : ''} onChange={(e) => change(g, parseFloat(e.target.value.replace(',', '.')) || 0)} />
                        {unitLabel(g) && <span className="text-[11px] opacity-50 ml-0.5">{unitLabel(g)}</span>}
                      </label>
                      <button type="button" aria-label={`More ${g.name}`} className="tap w-9 h-9 rounded-[11px] bg-white flex items-center justify-center" onClick={() => change(g, v + step)}><Plus size={16} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
        {!groups.length && <p className="text-center text-[14px] opacity-60 py-6">Not in your pantry yet. Add it in Pantry first.</p>}
      </main>
      <Footer>
        <Primary onClick={save} disabled={!picked.length}>
          <Check size={20} />{picked.length ? `Add ${picked.length} ${picked.length === 1 ? 'item' : 'items'} to stock` : 'Pick what you bought'}
        </Primary>
      </Footer>
    </Page>
  )
}
