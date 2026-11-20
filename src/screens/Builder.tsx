import { Copy, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { BackButton, CookToggle, Footer, IconButton, Label, Page, Primary, Stepper, TYPE_ICON } from '../components/ui'
import { draftFromIngredient } from './IngForm'
import { TYPES, typeInfo } from '../lib/constants'
import { dayName, todayKey } from '../lib/dates'
import { canCook, qtyShort, r0, r1, stepOf, totals } from '../lib/nutrition'
import { useData } from '../lib/store'
import { useUI } from '../lib/ui'

export default function Builder() {
  const { draft, day, set, go, back, tab, say } = useUI()
  const ings = useData((s) => s.ings)
  const meals = useData((s) => s.meals)
  const saveMeal = useData((s) => s.saveMeal)
  const deleteMeal = useData((s) => s.deleteMeal)
  const addEntries = useData((s) => s.addEntries)
  const linkEntryToMeal = useData((s) => s.linkEntryToMeal)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (draft?.dupOf || draft?.fromEntry) nameRef.current?.select()
  }, [draft?.dupOf, draft?.fromEntry])

  if (!draft) return null
  const t = totals(draft.items, ings)
  const ty = typeInfo(draft.type)
  const update = (p: Partial<typeof draft>) => set({ draft: { ...draft, ...p } })

  const save = (addToday: boolean) => {
    if (!draft.name.trim()) return say('Name your meal first')
    if (!draft.items.some((i) => i.qty > 0)) return say('Add at least one ingredient')
    const isNew = !draft.id
    const id = saveMeal(draft)
    const saved = useData.getState().meals.find((m) => m.id === id)!
    set({ libType: draft.type })
    if (draft.fromEntry) {
      linkEntryToMeal(draft.fromEntry.day, draft.fromEntry.id, saved)
      set({ draft: null, edit: null })
      useUI.setState((st) => ({ stack: st.stack.slice(0, -2) }))
      return say(`Saved as “${saved.name}” and used for this day`)
    }
    if (addToday) {
      const k = day < todayKey() ? todayKey() : day
      addEntries([k], saved, saved.items)
      set({ draft: null, day: k })
      tab('home')
      return say(`Saved to ${ty.label} and added to ${dayName(k)}`)
    }
    set({ draft: null })
    back()
    say(isNew ? `Saved to your ${ty.label} library` : 'Saved meal updated')
  }

  const duplicate = () => {
    const src = meals.find((m) => m.id === draft.id) ?? draft
    set({ draft: { id: null, name: `${src.name} (copy)`, type: src.type, items: structuredClone(src.items), dupOf: src.name } })
  }

  const remove = () => {
    if (!draft.id || !window.confirm('Delete this saved meal? Days that already use it keep their copy.')) return
    deleteMeal(draft.id)
    set({ draft: null })
    back()
    say('Saved meal deleted')
  }

  return (
    <Page className="pb-56 slide">
      <header className="pt-safe px-4 pb-2 flex items-center justify-between gap-2">
        <BackButton close />
        <span className="text-[15px] font-bold">{draft.id ? 'Edit saved meal' : `New ${ty.one}`}</span>
        {draft.id ? (
          <div className="flex gap-2">
            <button type="button" className="tap h-11 px-3.5 rounded-full soft flex items-center gap-1.5 text-[13px] font-bold" onClick={duplicate}><Copy size={16} />Duplicate</button>
            <IconButton label="Delete saved meal" onClick={remove}><Trash2 size={18} /></IconButton>
          </div>
        ) : <span className="w-11" />}
      </header>

      {draft.dupOf && (
        <div className="mx-4 mt-2 rounded-[16px] bg-peach px-4 py-3 text-[13px] flex gap-2.5">
          <Copy size={16} className="text-amber shrink-0 mt-0.5" />
          <span>Copy of <b>{draft.dupOf}</b>. Rename it and change what you need. The original stays as it is.</span>
        </div>
      )}
      {draft.fromEntry && (
        <div className="mx-4 mt-2 rounded-[16px] bg-peach px-4 py-3 text-[13px] flex gap-2.5">
          <Sparkles size={16} className="text-amber shrink-0 mt-0.5" />
          <span>New meal from this day's version. Give it a name you'll recognise, like “Omelette (4 eggs)”.</span>
        </div>
      )}

      <main className="px-4 space-y-5 pt-3">
        <section>
          <Label>1 · Name your meal</Label>
          <label className="field mt-2 h-14 px-4 rounded-[18px] soft border-2 flex items-center">
            <span className="sr-only">Meal name</span>
            <input ref={nameRef} id="meal-name" className="w-full text-[18px] font-semibold placeholder:text-forest-900/30" placeholder="e.g. Cheese omelette"
              value={draft.name} onChange={(e) => update({ name: e.target.value })} />
          </label>
          <div className="flex gap-2 mt-3 overflow-x-auto">
            {TYPES.map((x) => {
              const Icon = TYPE_ICON[x.id]
              const on = draft.type === x.id
              return (
                <button key={x.id} type="button" aria-pressed={on} className={`tap shrink-0 h-9 pl-1.5 pr-3.5 rounded-full text-[13px] font-bold flex items-center gap-1.5 ${on ? 'btn-dark' : 'soft'}`}
                  onClick={() => update({ type: x.id })}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: x.grad, color: x.fg }}><Icon size={13} /></span>{x.label}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <div className="flex justify-between items-baseline"><Label>2 · Add ingredients</Label><span className="text-[12px] opacity-60">{draft.items.length} added</span></div>
          <div className="space-y-2 mt-2">
            {draft.items.map((it, ix) => {
              const g = ings.find((x) => x.id === it.ing)
              if (!g) return null
              const x = totals([it], ings)
              return (
                <div key={it.ing} className="card p-3 flex items-center gap-3 slide">
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold truncate">{g.name}</div>
                    <div className="text-[12px] opacity-60">{r0(x.kcal)} kcal · P {r1(x.p)} · C {r1(x.c)} · F {r1(x.f)}</div>
                    {canCook(g) && (
                      <CookToggle cooked={!!it.cooked} onChange={(cooked) => {
                        if (cooked && !g.yield) {
                          set({ ingDraft: draftFromIngredient(g), pendingCook: { ing: g.id, target: 'draft' } })
                          go('ingForm')
                          return say(`Set how much ${g.name} weighs cooked first`)
                        }
                        update({ items: draft.items.map((y, i) => (i === ix ? { ...y, cooked: cooked || undefined } : y)) })
                      }} />
                    )}
                  </div>
                  <Stepper label={g.name} value={qtyShort(g.unit, it.qty)} onChange={(d) => {
                    const items = draft.items.map((y, i) => (i === ix ? { ...y, qty: Math.max(0, y.qty + d * stepOf(g.unit)) } : y)).filter((y) => y.qty > 0)
                    update({ items })
                  }} />
                </div>
              )
            })}
          </div>
          <button type="button" className="tap w-full mt-2 h-14 rounded-[18px] border-2 border-dashed border-forest-700/40 text-forest-700 text-[15px] font-bold flex items-center justify-center gap-2"
            onClick={() => go('picker')}>
            <Plus size={20} />{draft.items.length ? 'Add another ingredient' : 'Add ingredient'}
          </button>
        </section>
      </main>

      <Footer>
        <div className="rounded-[20px] hero px-4 py-3 flex items-center justify-between">
          <div><span className="text-[26px] font-light">{r0(t.kcal)}</span><span className="text-[13px] opacity-60"> kcal total</span></div>
          <div className="flex gap-3 text-[12px]">
            <span><span className="opacity-60">P</span> <b>{r0(t.p)}</b></span>
            <span><span className="opacity-60">C</span> <b>{r0(t.c)}</b></span>
            <span><span className="opacity-60">F</span> <b>{r0(t.f)}</b></span>
          </div>
        </div>
        {draft.id || draft.fromEntry ? (
          <Primary onClick={() => save(false)}>{draft.fromEntry ? 'Save new meal' : 'Save changes'}</Primary>
        ) : (
          <div className="flex gap-2">
            <button type="button" className="tap flex-1 h-14 rounded-[18px] tint text-[15px] font-bold" onClick={() => save(false)}>Save to {ty.label}</button>
            <button type="button" className="tap flex-1 h-14 rounded-[18px] btn-dark text-[15px] font-bold" onClick={() => save(true)}>Save &amp; add {dayName(day < todayKey() ? todayKey() : day).toLowerCase() === 'today' ? 'today' : `to ${dayName(day)}`}</button>
          </div>
        )}
      </Footer>
    </Page>
  )
}
