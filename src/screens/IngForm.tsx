import { Check, CircleCheck, CookingPot, Database, Info, ScanBarcode, ShoppingBasket, Trash2, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { BackButton, CAT_ICON, Footer, IconButton, Label, Page, Primary, Stepper } from '../components/ui'
import { CATS, MICROS } from '../lib/constants'
import { kcalCheck, r0, YIELD_PRESETS } from '../lib/nutrition'
import { usedIn, useData } from '../lib/store'
import type { Category, Ingredient, Item, MicroKey, Unit } from '../lib/types'
import { useUI, type IngDraft } from '../lib/ui'

export const emptyMicrosDraft = (): IngDraft['micros'] => ({})

export const blankIngDraft = (ctx: IngDraft['ctx'], name = '', cat: Category = 'other'): IngDraft => ({
  ctx, name, unit: 'piece', cat, kcal: '', p: '', c: '', f: '', micros: emptyMicrosDraft(), amount: 1, yieldPct: '', pack: '', low: false, stock: '', lowAt: '',
})

export const draftFromIngredient = (g: Ingredient): IngDraft => ({
  ctx: 'pantry', editId: g.id, name: g.name, unit: g.unit, cat: g.cat,
  kcal: String(g.kcal), p: String(g.p), c: String(g.c), f: String(g.f),
  micros: Object.fromEntries(MICROS.map(({ key }) => [key, g.m[key] ? String(g.m[key]) : ''])),
  amount: g.unit === 'piece' ? 1 : 100,
  yieldPct: g.yield ? String(Math.round(g.yield * 100)) : '',
  pack: g.pack ? String(g.pack) : '',
  low: !!g.low,
  stock: g.stock ? String(Math.round(g.stock * 10) / 10) : '',
  lowAt: g.lowAt !== undefined ? String(g.lowAt) : '',
})

const num = (s: string | undefined) => {
  const v = parseFloat((s ?? '').replace(',', '.'))
  return Number.isFinite(v) ? v : 0
}

function NumField({ id, label, unit, value, onChange, dot }: { id: string; label: string; unit: string; value: string; onChange: (v: string) => void; dot?: string }) {
  return (
    <label htmlFor={id} className="field block rounded-[16px] soft border-2 px-3 py-2.5">
      {dot ? (
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: dot }} /><span className="text-[12px] font-bold">{label}</span></span>
      ) : (
        <span className="text-[12px] font-semibold opacity-60">{label}</span>
      )}
      <span className="flex items-baseline gap-1 mt-0.5">
        <input id={id} inputMode="decimal" className="w-full text-[18px] font-semibold placeholder:text-forest-900/20" placeholder="0" value={value} onChange={(e) => onChange(e.target.value)} />
        <span className="text-[12px] font-semibold opacity-50">{unit}</span>
      </span>
    </label>
  )
}

function MacroHint({ d }: { d: IngDraft }) {
  const res = kcalCheck(d.kcal === '' ? undefined : num(d.kcal), num(d.p), num(d.c), num(d.f))
  if (res.status === 'incomplete')
    return <p className="text-[12px] opacity-60 mt-2 px-1 flex items-center gap-1.5"><Info size={14} />Enter calories and macros. We'll check they match.</p>
  if (res.status === 'ok')
    return <p className="text-[12px] mt-2 px-1 flex items-center gap-1.5 text-forest-700 font-semibold"><CircleCheck size={14} />Looks right. Macros add up to {r0(res.fromMacros)} kcal.</p>
  return (
    <div role="alert" className="mt-2 rounded-[14px] bg-peach px-3 py-2.5 text-[12px] flex gap-2">
      <TriangleAlert size={16} className="text-amber shrink-0 mt-0.5" />
      <span><b>Calories don't match the macros.</b> Protein ×4 + carbs ×4 + fat ×9 = {r0(res.fromMacros)} kcal, but you entered {r0(num(d.kcal))}. Check the label for a typo. Fiber or alcohol can explain a small gap.</span>
    </div>
  )
}

export default function IngForm() {
  const { ingDraft: d, draft, set, go, back, say } = useUI()
  const meals = useData((s) => s.meals)
  const saveIngredient = useData((s) => s.saveIngredient)
  const deleteIngredient = useData((s) => s.deleteIngredient)
  const [confirmMismatch, setConfirmMismatch] = useState(false)
  if (!d) return null
  const edit = !!d.editId
  const inMeal = d.ctx === 'builder'
  const used = edit ? usedIn(meals, d.editId!) : []
  const locked = used.length > 0
  const per = d.unit === 'piece' ? '1 piece' : d.unit === '100g' ? '100 g' : '100 ml'
  const update = (p: Partial<IngDraft>) => {
    setConfirmMismatch(false)
    set({ ingDraft: { ...d, ...p } })
  }
  const setUnit = (u: Unit) => {
    if (locked) return say('Unit is locked while saved meals use this ingredient')
    update({ unit: u, amount: u === 'piece' ? 1 : 100 })
  }

  const save = () => {
    if (!d.name.trim()) return say('Give the ingredient a name')
    if (d.kcal.trim() === '') return say('Enter the calories')
    const check = kcalCheck(num(d.kcal), num(d.p), num(d.c), num(d.f))
    if (check.status === 'mismatch' && !confirmMismatch) {
      setConfirmMismatch(true)
      return say("Calories and macros don't match. Tap save again to keep them as entered")
    }
    const vals: Omit<Ingredient, 'id'> = {
      name: d.name.trim(), unit: d.unit, cat: d.cat, kcal: num(d.kcal), p: num(d.p), c: num(d.c), f: num(d.f),
      m: Object.fromEntries(MICROS.map(({ key }) => [key, num(d.micros[key])])) as Ingredient['m'],
      yield: d.unit !== 'piece' && num(d.yieldPct) > 0 ? num(d.yieldPct) / 100 : undefined,
      pack: num(d.pack) > 0 ? num(d.pack) : undefined,
      low: d.low || undefined,
      stock: num(d.stock) > 0 ? num(d.stock) : undefined,
      lowAt: d.lowAt.trim() !== '' && num(d.lowAt) > 0 ? num(d.lowAt) : undefined,
      barcode: d.barcode || undefined,
    }
    const id = saveIngredient(vals, d.editId)
    if (inMeal && draft) {
      set({ ingDraft: null, draft: { ...draft, items: [...draft.items, { ing: id, qty: d.amount }] } })
      useUI.setState((s) => ({ stack: s.stack.slice(0, -2) }))
      return say(`${vals.name} added to your meal and pantry`)
    }
    // Coming from a Raw/Cooked switch: now that the ratio is set, switch that ingredient to cooked.
    const pending = useUI.getState().pendingCook
    if (pending && pending.ing === id) {
      set({ pendingCook: null })
      if (vals.yield) {
        const mark = (items: Item[]) => items.map((x) => (x.ing === id ? { ...x, cooked: true } : x))
        const ui = useUI.getState()
        if (pending.target === 'draft' && ui.draft) set({ draft: { ...ui.draft, items: mark(ui.draft.items) } })
        if (pending.target === 'entry' && ui.edit) {
          const e = useData.getState().plan[ui.edit.day]?.find((x) => x.id === ui.edit!.id)
          if (e) useData.getState().setEntryItems(ui.edit.day, e.id, mark(e.items))
        }
      }
    }
    if (d.thenRestock && !edit) {
      // Scanned in "I bought…": go back there with one pack of the new product added.
      const ui = useUI.getState()
      const step = vals.pack ?? (vals.unit === 'piece' ? 1 : 100)
      set({ ingDraft: null, restockAdds: { ...ui.restockAdds, [id]: (ui.restockAdds[id] ?? 0) + step } })
      back()
      return say(`${vals.name} saved and added to what you bought`)
    }
    set({ ingDraft: null })
    back()
    say(pending && vals.yield ? `Saved. ${vals.name} is now weighed cooked` : edit ? `${vals.name} updated` : `${vals.name} added to your pantry`)
  }

  const remove = () => {
    if (locked) return say(`Used in ${used.length} saved ${used.length === 1 ? 'meal' : 'meals'}. Remove it there first`)
    if (!window.confirm('Delete this ingredient from your pantry?')) return
    deleteIngredient(d.editId!)
    set({ ingDraft: null })
    back()
    say('Removed from pantry')
  }

  return (
    <Page className="pb-36 slide">
      <header className="pt-safe px-4 pb-3 flex items-center gap-3">
        <BackButton />
        <h1 className="text-[22px] font-semibold flex-1">{edit ? 'Edit ingredient' : 'New ingredient'}</h1>
        {edit && <IconButton label="Delete ingredient" onClick={remove}><Trash2 size={18} /></IconButton>}
      </header>
      <main className="px-4 space-y-5">
        {!edit && (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="tap h-12 rounded-[16px] btn-dark text-[14px] font-bold flex items-center justify-center gap-2" onClick={() => set({ scanner: { purpose: 'form' } })}>
              <ScanBarcode size={18} />Scan barcode
            </button>
            <button type="button" className="tap h-12 rounded-[16px] soft text-[14px] font-bold flex items-center justify-center gap-2" onClick={() => go('foodSearch')}>
              <Database size={17} />Search database
            </button>
          </div>
        )}
        {d.fromDb && (
          <div className="rounded-[18px] bg-mint-100 px-4 py-3 text-[13px] flex gap-2.5">
            <Database size={16} className="text-forest-700 shrink-0 mt-0.5" />
            <span>Filled in from <b>Open Food Facts</b>. Database entries can have mistakes, so check them against the label before saving.</span>
          </div>
        )}
        {d.barcode && !d.fromDb && (
          <div className="rounded-[18px] bg-peach px-4 py-3 text-[13px] flex gap-2.5">
            <ScanBarcode size={16} className="text-amber shrink-0 mt-0.5" />
            <span>Barcode {d.barcode} saved. Enter the values from the label and the next scan will find it.</span>
          </div>
        )}
        {locked && (
          <div className="rounded-[18px] bg-peach px-4 py-3 text-[13px] flex gap-2.5">
            <Info size={18} className="text-amber shrink-0 mt-0.5" />
            <span>Used in <b>{used.slice(0, 3).map((m) => m.name).join(', ')}{used.length > 3 ? ` +${used.length - 3} more` : ''}</b>. Changing values updates those meals' totals.</span>
          </div>
        )}
        <section>
          <Label>Ingredient</Label>
          <label htmlFor="ing-name" className="field mt-2 h-14 px-4 rounded-[18px] soft border-2 flex items-center">
            <span className="sr-only">Name</span>
            <input id="ing-name" className="w-full text-[18px] font-semibold placeholder:text-forest-900/30" placeholder="e.g. Egg (large)" value={d.name} onChange={(e) => update({ name: e.target.value })} />
          </label>
          <div className={`mt-3 flex p-1 tint rounded-[16px] ${locked ? 'opacity-50' : ''}`} role="radiogroup" aria-label="Measured by">
            {([['piece', 'By piece'], ['100g', 'By grams'], ['100ml', 'By ml']] as const).map(([u, l]) => (
              <button key={u} type="button" role="radio" aria-checked={d.unit === u} className={`tap flex-1 py-2.5 text-[14px] font-bold rounded-[12px] ${d.unit === u ? 'btn-dark' : 'opacity-60'}`} onClick={() => setUnit(u)}>{l}</button>
            ))}
          </div>
          {locked && <p className="text-[12px] opacity-60 mt-1.5 px-1">Unit is locked because saved meals use this ingredient.</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            {CATS.map((c) => {
              const Icon = CAT_ICON[c.id]
              const on = d.cat === c.id
              return (
                <button key={c.id} type="button" aria-pressed={on} className={`tap h-9 pl-1.5 pr-3 rounded-full text-[12px] font-bold flex items-center gap-1.5 ${on ? 'btn-dark' : 'soft'}`} onClick={() => update({ cat: c.id })}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: c.bg, color: c.fg }}><Icon size={13} /></span>{c.label}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <Label>Nutrition per {per} raw <span className="font-medium opacity-70">· as on the package</span></Label>
          <div className="mt-2 space-y-2">
            <NumField id="ing-kcal" label="Calories" unit="kcal" value={d.kcal} onChange={(v) => update({ kcal: v })} />
            <div className="grid grid-cols-3 gap-2">
              <NumField id="ing-p" label="Protein" unit="g" dot="#166534" value={d.p} onChange={(v) => update({ p: v })} />
              <NumField id="ing-c" label="Carbs" unit="g" dot="#F6D186" value={d.c} onChange={(v) => update({ c: v })} />
              <NumField id="ing-f" label="Fat" unit="g" dot="#F4A261" value={d.f} onChange={(v) => update({ f: v })} />
            </div>
          </div>
          <MacroHint d={d} />
        </section>

        <section>
          <Label>Micronutrients per {per} <span className="font-medium opacity-70">· optional</span></Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {MICROS.map(({ key, label, unit }) => (
              <NumField key={key} id={`ing-m-${key}`} label={label} unit={unit} value={d.micros[key] ?? ''}
                onChange={(v) => update({ micros: { ...d.micros, [key as MicroKey]: v } })} />
            ))}
          </div>
        </section>

        {d.unit !== 'piece' && (
          <section>
            <Label>Cooking <span className="font-medium opacity-70">· optional</span></Label>
            <div className="card p-4 mt-2 space-y-3">
              <div className="flex items-center gap-3">
                <CookingPot size={20} className="text-sage-500 shrink-0" />
                <label htmlFor="ing-yield" className="flex-1 text-[14px] font-semibold flex items-center gap-2 flex-wrap">
                  100 {d.unit === '100ml' ? 'ml' : 'g'} raw weighs
                  <span className="field inline-flex items-baseline gap-1 rounded-[12px] soft border-2 px-2 py-1">
                    <input id="ing-yield" inputMode="numeric" className="w-14 text-[16px] font-semibold text-center" placeholder="—" value={d.yieldPct}
                      onChange={(e) => update({ yieldPct: e.target.value.replace(/[^0-9.,]/g, '') })} />
                    <span className="text-[12px] opacity-50">{d.unit === '100ml' ? 'ml' : 'g'}</span>
                  </span>
                  cooked
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {YIELD_PRESETS.map((p) => {
                  const v = String(Math.round(p.value * 100))
                  return (
                    <button key={p.label} type="button" aria-pressed={d.yieldPct === v} onClick={() => update({ yieldPct: v })}
                      className={`tap h-8 px-3 rounded-full text-[12px] font-semibold ${d.yieldPct === v ? 'btn-dark' : 'soft'}`}>
                      {p.label} {v} g
                    </button>
                  )
                })}
              </div>
              <p className="text-[12px] opacity-60">Lets you weigh it cooked in a meal. The app converts it back to raw for nutrition and the shopping list.</p>
            </div>
          </section>
        )}

        <section>
          <Label>Stock <span className="font-medium opacity-70">· what you have at home</span></Label>
          <div className="card p-4 mt-2 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <NumField id="ing-stock" label="In stock now" unit={d.unit === 'piece' ? 'pcs' : d.unit === '100ml' ? 'ml' : 'g'} value={d.stock} onChange={(v) => update({ stock: v })} />
              <NumField id="ing-lowat" label="Warn me below" unit={d.unit === 'piece' ? 'pcs' : d.unit === '100ml' ? 'ml' : 'g'} value={d.lowAt} onChange={(v) => update({ lowAt: v })} />
            </div>
            <p className="text-[12px] opacity-60">Stock goes down when you tick a meal as eaten, and up when you finish shopping. Below the warning level it goes on the shopping list.</p>
          </div>
        </section>

        <section>
          <Label>Shopping <span className="font-medium opacity-70">· optional</span></Label>
          <div className="card p-4 mt-2 space-y-3">
            <div className="flex items-center gap-3">
              <ShoppingBasket size={20} className="text-sage-500 shrink-0" />
              <label htmlFor="ing-pack" className="flex-1 text-[14px] font-semibold flex items-center gap-2 flex-wrap">
                Comes in packs of
                <span className="field inline-flex items-baseline gap-1 rounded-[12px] soft border-2 px-2 py-1">
                  <input id="ing-pack" inputMode="numeric" className="w-16 text-[16px] font-semibold text-center" placeholder="—" value={d.pack}
                    onChange={(e) => update({ pack: e.target.value.replace(/[^0-9.,]/g, '') })} />
                  <span className="text-[12px] opacity-50">{d.unit === 'piece' ? 'pieces' : d.unit === '100ml' ? 'ml' : 'g'}</span>
                </span>
              </label>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <div>
                <div className="text-[14px] font-semibold">Running low</div>
                <div className="text-[12px] opacity-60">Puts it on the shopping list even if no meal needs it</div>
              </div>
              <button type="button" role="switch" aria-checked={d.low} aria-label="Running low"
                className={`tap w-12 h-7 rounded-full relative shrink-0 ${d.low ? 'bg-apricot' : 'tint border border-forest-900/10'}`}
                onClick={() => update({ low: !d.low })}>
                <span className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all" style={{ left: d.low ? 22 : 2 }} />
              </button>
            </div>
          </div>
        </section>

        {inMeal && (
          <section className="card p-4 flex items-center justify-between gap-3">
            <div><div className="text-[15px] font-bold">Amount in this meal</div><div className="text-[12px] opacity-60">You can change it later</div></div>
            <Stepper label="amount" value={d.unit === 'piece' ? String(d.amount) : `${d.amount}${d.unit === '100ml' ? ' ml' : ' g'}`}
              onChange={(dir) => update({ amount: Math.max(d.unit === 'piece' ? 1 : 10, d.amount + dir * (d.unit === 'piece' ? 1 : 10)) })} />
          </section>
        )}
      </main>
      <Footer>
        <Primary onClick={save}><Check size={20} />{inMeal ? 'Save & add to meal' : edit ? 'Save changes' : 'Save to pantry'}</Primary>
      </Footer>
    </Page>
  )
}
