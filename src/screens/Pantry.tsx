import { PackagePlus, Plus, Search, Star } from 'lucide-react'
import { useState } from 'react'
import { CAT_ICON, CatBadge, MacroChips, Nav, Page } from '../components/ui'
import { CATS } from '../lib/constants'
import { amountText, isLow, perText, r0 } from '../lib/nutrition'
import { usedIn, useData } from '../lib/store'
import type { Category, Ingredient } from '../lib/types'
import { useUI } from '../lib/ui'
import { blankIngDraft, draftFromIngredient } from './IngForm'

type Filter = 'all' | 'fav' | Category

export default function Pantry() {
  const { set, go, say } = useUI()
  const ings = useData((s) => s.ings)
  const meals = useData((s) => s.meals)
  const favs = useData((s) => s.favs)
  const toggleFav = useData((s) => s.toggleFav)
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const sorted = [...ings].sort((a, b) => a.name.localeCompare(b.name)).filter((g) => !query || g.name.toLowerCase().includes(query))
  const groups: { label: string; list: Ingredient[] }[] =
    filter === 'fav'
      ? [{ label: 'Favourites', list: sorted.filter((g) => favs.includes(g.id)) }]
      : CATS.filter((c) => filter === 'all' || c.id === filter).map((c) => ({ label: c.label, list: sorted.filter((g) => g.cat === c.id) }))
  const visible = groups.filter((g) => g.list.length)

  const addNew = () => {
    set({ ingDraft: blankIngDraft('pantry', '', filter !== 'all' && filter !== 'fav' ? filter : 'other') })
    go('ingForm')
  }
  const edit = (g: Ingredient) => {
    set({ ingDraft: draftFromIngredient(g) })
    go('ingForm')
  }
  const fav = (id: string) => {
    const was = favs.includes(id)
    toggleFav(id)
    say(was ? 'Removed from favourites' : 'Added to favourites. It shows first when building meals')
  }
  const chip = (on: boolean) => `tap shrink-0 h-9 rounded-full text-[13px] font-bold flex items-center gap-1.5 ${on ? 'btn-dark' : 'soft'}`

  return (
    <Page className="pb-36 fade">
      <header className="pt-safe px-5 pb-3">
        <p className="text-[14px] font-bold text-amber">Pantry</p>
        <h1 className="text-[30px] font-medium tracking-[-0.02em] leading-tight">My ingredients</h1>
        <p className="text-[14px] opacity-60 mt-0.5">{ings.length} ingredients · build your meals from these</p>
      </header>
      <main className="px-4 space-y-4">
        <div className="flex gap-2">
          <button type="button" className="tap flex-1 h-14 rounded-[20px] btn-warm text-[16px] font-semibold flex items-center justify-center gap-2" onClick={() => go('restock')}>
            <PackagePlus size={20} />I bought…
          </button>
          <button type="button" className="tap flex-1 h-14 rounded-[20px] soft text-[15px] font-semibold flex items-center justify-center gap-2" onClick={addNew}>
            <Plus size={18} />New ingredient
          </button>
        </div>
        <label className="field h-12 px-4 rounded-[16px] soft border-2 flex items-center gap-2">
          <Search size={18} className="opacity-40" /><span className="sr-only">Search pantry</span>
          <input id="pantry-search" className="w-full text-[15px]" placeholder="Search pantry" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4">
          <button type="button" aria-pressed={filter === 'all'} className={`${chip(filter === 'all')} px-4`} onClick={() => setFilter('all')}>All · {ings.length}</button>
          <button type="button" aria-pressed={filter === 'fav'} className={`${chip(filter === 'fav')} pl-2.5 pr-3.5`} onClick={() => setFilter('fav')}>
            <Star size={15} className="text-apricot" fill="#F4A261" />Favourites · {ings.filter((g) => favs.includes(g.id)).length}
          </button>
          {CATS.map((c) => {
            const Icon = CAT_ICON[c.id]
            return (
              <button key={c.id} type="button" aria-pressed={filter === c.id} className={`${chip(filter === c.id)} pl-1.5 pr-3.5`} onClick={() => setFilter(c.id)}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: c.bg, color: c.fg }}><Icon size={13} /></span>
                {c.label} · {ings.filter((g) => g.cat === c.id).length}
              </button>
            )
          })}
        </div>
        {visible.map(({ label, list }) => (
          <section key={label}>
            <h2 className="text-[13px] font-bold text-sage-500 px-1 mb-2">{label}</h2>
            <div className="card divide-y divide-forest-900/5">
              {list.map((g) => {
                const n = usedIn(meals, g.id).length
                const isFav = favs.includes(g.id)
                return (
                  <div key={g.id} className="flex items-center">
                    <button type="button" className="tap flex-1 min-w-0 flex items-center gap-3 pl-3.5 py-3 text-left" onClick={() => edit(g)}>
                      <CatBadge cat={g.cat} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-bold truncate flex items-center gap-1.5">{g.name}{isLow(g) && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-peach text-[#B5561F] shrink-0">LOW</span>}</div>
                        <div className="text-[12px] mt-0.5"><span className={g.stock ? 'font-bold text-forest-700' : 'opacity-50'}>{g.stock ? `${amountText(g.unit, g.stock)} in stock` : 'None in stock'}</span><span className="opacity-60"> · {r0(g.kcal)} kcal / {perText(g.unit)}{n ? ` · in ${n} ${n === 1 ? 'meal' : 'meals'}` : ''}</span></div>
                        <div className="mt-1.5"><MacroChips t={g} small decimals /></div>
                      </div>
                    </button>
                    <button type="button" aria-label={isFav ? `Remove ${g.name} from favourites` : `Add ${g.name} to favourites`} aria-pressed={isFav}
                      className="tap w-12 h-12 flex items-center justify-center shrink-0" onClick={() => fav(g.id)}>
                      <Star size={20} style={{ color: isFav ? '#F4A261' : 'rgba(15,61,46,.25)' }} fill={isFav ? '#F4A261' : 'none'} />
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
        {!visible.length && (
          <p className="text-center opacity-60 py-8">{query ? 'No match. Add it as a new ingredient above.' : filter === 'fav' ? 'No favourites yet. Tap the star on an ingredient.' : 'Nothing in this category yet.'}</p>
        )}
        <p className="text-center text-[13px] opacity-50 pt-1">Tap an ingredient to edit it or correct its stock. Tap ☆ to pin it to the top when building meals.</p>
      </main>
      <Nav />
    </Page>
  )
}
