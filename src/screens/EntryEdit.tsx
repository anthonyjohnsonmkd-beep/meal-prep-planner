import { ChevronDown, ChevronUp, Copy, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { BackButton, CookToggle, Footer, IconButton, Label, MicroGrid, Page, Primary, Stepper, TypeBadge } from '../components/ui'
import { draftFromIngredient } from './IngForm'
import { typeInfo } from '../lib/constants'
import { dayName } from '../lib/dates'
import { canCook, defaultQty, qtyLong, qtyShort, r0, sameItems, signed, stepOf, totals } from '../lib/nutrition'
import { useData } from '../lib/store'
import { useUI } from '../lib/ui'

export default function EntryEdit() {
  const { edit, set, go, back, say } = useUI()
  const plan = useData((s) => s.plan)
  const ings = useData((s) => s.ings)
  const meals = useData((s) => s.meals)
  const { setEntryItems, removeEntry, commitEntry } = useData.getState()
  const [microsOpen, setMicrosOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  if (!edit) return null
  const e = plan[edit.day]?.find((x) => x.id === edit.id)
  if (!e) return null
  const t = totals(e.items, ings)
  const b = totals(e.base, ings)
  const edited = !sameItems(e.items, e.base)
  const ty = typeInfo(e.type)
  const meal = meals.find((m) => m.id === e.mealId)
  const inEntry = new Set(e.items.map((i) => i.ing))
  const savedItem = (ing: string) => e.base.find((x) => x.ing === ing)

  const save = () => {
    commitEntry(edit.day, e.id, edit.updateMeal && !!meal)
    back()
    say(edit.updateMeal && meal ? 'Saved, and your saved meal was updated' : `Saved for ${dayName(edit.day).toLowerCase() === 'today' ? 'today' : dayName(edit.day)} only`)
  }
  const remove = () => {
    removeEntry(edit.day, e.id)
    back()
    say('Removed')
  }
  const saveAsNew = () => {
    set({ draft: { id: null, name: `${e.name} (variation)`, type: e.type, items: structuredClone(e.items.filter((i) => i.qty > 0)), fromEntry: { day: edit.day, id: e.id } } })
    go('builder')
  }
  const diff = [[t.kcal - b.kcal, ' kcal'], [t.p - b.p, ' g protein'], [t.f - b.f, ' g fat'], [t.c - b.c, ' g carbs']] as const

  return (
    <Page className="pb-56 slide">
      <header className="pt-safe px-4 pb-2 flex items-center justify-between">
        <BackButton />
        <span className="text-[13px] font-semibold opacity-60">{dayName(edit.day)} · {ty.label}</span>
        <IconButton label="Remove from this day" onClick={remove}><Trash2 size={18} /></IconButton>
      </header>
      <main className="px-4 space-y-4 pt-2">
        <div className="flex items-center gap-3">
          <TypeBadge type={e.type} size={52} icon={26} />
          <div>
            <h1 className="text-[26px] font-light leading-tight">{e.name}</h1>
            <p className="text-[13px] opacity-60">{edited ? 'Edited for this day only' : 'Same as your saved meal'}</p>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[26px] hero p-4">
          <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-mint-300/60 blur-3xl" />
          <div className="relative flex items-end justify-between gap-2">
            <div>
              <div className="text-[46px] font-light tracking-tight leading-none">{r0(t.kcal)}<span className="text-[14px] font-semibold opacity-60"> kcal</span></div>
              {edited && (
                <div className="text-[13px] text-[#D9822B] font-semibold mt-1.5">
                  {diff.filter(([v], i) => i === 0 || Math.round(v) !== 0).map(([v, u]) => signed(v) + u).join(' · ')}
                </div>
              )}
            </div>
            {edited && (
              <button type="button" className="tap h-9 px-3 rounded-full bg-white/70 text-[13px] font-bold flex items-center gap-1.5 shrink-0"
                onClick={() => { setEntryItems(edit.day, e.id, structuredClone(e.base)); say('Back to your saved meal') }}>
                <RotateCcw size={14} />Reset
              </button>
            )}
          </div>
          <div className="relative grid grid-cols-3 gap-2 mt-4">
            {([['Protein', 'p', '#A8D5BA'], ['Carbs', 'c', '#F6D186'], ['Fat', 'f', '#F4A261']] as const).map(([l, k, c]) => (
              <div key={k} className="rounded-[14px] bg-white/60 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[11px] opacity-60"><span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />{l}</div>
                <div className="text-[17px] font-semibold">{r0(t[k])} g</div>
                {edited && Math.round(t[k]) !== Math.round(b[k]) && <div className="text-[11px] opacity-50">was {r0(b[k])}</div>}
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-2">
            <Label>Ingredients</Label>
            <button type="button" className="tap text-[13px] font-bold text-forest-700 flex items-center gap-1" onClick={() => setAddOpen((o) => !o)}>
              <Plus size={15} />{addOpen ? 'Done' : 'Add'}
            </button>
          </div>
          <div className="space-y-2">
            {e.items.map((it, ix) => {
              const g = ings.find((x) => x.id === it.ing)
              if (!g) return null
              const saved = savedItem(it.ing)
              const q = saved?.qty
              const changed = !saved || saved.qty !== it.qty || !!saved.cooked !== !!it.cooked
              return (
                <div key={it.ing} className="card p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold truncate">{g.name}</div>
                    <div className={`text-[12px] ${changed ? 'text-amber font-bold' : 'opacity-50'}`}>
                      {q === undefined ? 'Added this day' : changed ? `Saved: ${qtyLong(g.unit, q)}${saved?.cooked ? ' cooked' : canCook(g) ? ' raw' : ''}` : 'As saved'}
                    </div>
                    {canCook(g) && (
                      <CookToggle cooked={!!it.cooked} onChange={(cooked) => {
                        if (cooked && !g.yield) {
                          set({ ingDraft: draftFromIngredient(g), pendingCook: { ing: g.id, target: 'entry' } })
                          go('ingForm')
                          return say(`Set how much ${g.name} weighs cooked first`)
                        }
                        setEntryItems(edit.day, e.id, e.items.map((x, i) => (i === ix ? { ...x, cooked: cooked || undefined } : x)))
                      }} />
                    )}
                  </div>
                  <Stepper label={g.name} value={qtyShort(g.unit, it.qty)} highlight={changed}
                    onChange={(d) => setEntryItems(edit.day, e.id, e.items.map((x, i) => (i === ix ? { ...x, qty: Math.max(0, x.qty + d * stepOf(g.unit)) } : x)))} />
                </div>
              )
            })}
          </div>
          {addOpen && (
            <div className="flex flex-wrap gap-2 mt-3 fade">
              {ings.filter((g) => !inEntry.has(g.id)).sort((a, b2) => a.name.localeCompare(b2.name)).map((g) => (
                <button key={g.id} type="button" className="tap h-8 px-3 rounded-full soft text-[13px] flex items-center gap-1"
                  onClick={() => setEntryItems(edit.day, e.id, [...e.items, { ing: g.id, qty: defaultQty(g.unit) }])}>
                  <Plus size={14} />{g.name}
                </button>
              ))}
            </div>
          )}
        </section>

        <section>
          <button type="button" aria-expanded={microsOpen} className="tap w-full flex items-center justify-between px-1 py-2" onClick={() => setMicrosOpen((o) => !o)}>
            <span className="text-[13px] font-bold text-sage-500">Micronutrients</span>
            {microsOpen ? <ChevronUp size={18} className="opacity-50" /> : <ChevronDown size={18} className="opacity-50" />}
          </button>
          {microsOpen && <div className="fade"><MicroGrid t={t} base={edited ? b : null} /></div>}
        </section>
      </main>

      <Footer>
        {meal && edited && (
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-[14px] font-semibold">Also update my saved meal</span>
            <button type="button" role="switch" aria-checked={edit.updateMeal}
              className={`tap w-12 h-7 rounded-full relative ${edit.updateMeal ? 'bg-forest-700' : 'tint border border-forest-900/10'}`}
              onClick={() => set({ edit: { ...edit, updateMeal: !edit.updateMeal } })}>
              <span className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all" style={{ left: edit.updateMeal ? 22 : 2 }} />
            </button>
          </div>
        )}
        <Primary onClick={save}>Save for {dayName(edit.day)}</Primary>
        {edited && (
          <button type="button" className="tap w-full h-10 text-[14px] font-bold text-forest-700 flex items-center justify-center gap-1.5" onClick={saveAsNew}>
            <Copy size={16} />Save as a new meal instead
          </button>
        )}
      </Footer>
    </Page>
  )
}
