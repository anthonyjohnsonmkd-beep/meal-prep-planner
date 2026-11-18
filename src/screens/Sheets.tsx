import { Check, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { MacroChips, Primary, Stepper, TYPE_ICON, TypeBadge } from '../components/ui'
import { TYPES, typeInfo } from '../lib/constants'
import { DOW, dayName, fromKey, todayKey, weekOf } from '../lib/dates'
import { qtyLong, qtyShort, r0, sameItems, signed, stepOf, totals } from '../lib/nutrition'
import { useData } from '../lib/store'
import { useUI } from '../lib/ui'

function SheetFrame({ children, onClose, label }: { children: ReactNode; onClose: () => void; label: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <>
      <div className="fixed inset-0 z-40 bg-forest-900/30 backdrop-blur-[2px] fade" onClick={onClose} />
      <section role="dialog" aria-modal="true" aria-label={label}
        className="sheet fixed left-0 right-0 bottom-0 z-50 rounded-t-[30px] glass px-4 pt-2 pb-safe max-h-[90vh] overflow-y-auto">
        <div className="max-w-[560px] mx-auto">
          <div className="w-10 h-1 rounded-full bg-forest-900/15 mx-auto mb-4" />
          {children}
        </div>
      </section>
    </>
  )
}

export function TypeSheet() {
  const { day, set, go } = useUI()
  const meals = useData((s) => s.meals)
  const close = () => set({ sheet: null })
  return (
    <SheetFrame onClose={close} label="Choose a meal type">
      <h2 className="text-[22px] font-semibold px-1">What are you adding?</h2>
      <p className="text-[14px] opacity-60 px-1 mb-4">{dayName(day)} · pick a meal type</p>
      <div className="grid grid-cols-2 gap-3">
        {TYPES.map((ty) => {
          const Icon = TYPE_ICON[ty.id]
          const n = meals.filter((m) => m.type === ty.id).length
          const dark = ty.fg === '#FFFFFF'
          return (
            <button key={ty.id} type="button" className="tap relative overflow-hidden rounded-[24px] p-4 h-[132px] text-left flex flex-col justify-between"
              style={{ background: ty.grad, color: ty.fg }}
              onClick={() => { set({ sheet: null, libType: ty.id }); go('libraryAdd') }}>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full" style={{ background: ty.fg, opacity: 0.08 }} />
              <div className="w-11 h-11 rounded-[14px] flex items-center justify-center" style={{ background: dark ? 'rgba(255,255,255,.18)' : 'rgba(15,61,46,.08)' }}>
                <Icon size={24} strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-[19px] font-semibold">{ty.label}</div>
                <div className="text-[12px] font-semibold opacity-75">{n} saved</div>
              </div>
            </button>
          )
        })}
      </div>
    </SheetFrame>
  )
}

export function ConfirmSheet() {
  const { day, sheet, set, tab, say } = useUI()
  const meals = useData((s) => s.meals)
  const ings = useData((s) => s.ings)
  const addEntries = useData((s) => s.addEntries)
  if (sheet?.kind !== 'confirm') return null
  const meal = meals.find((m) => m.id === sheet.mealId)
  if (!meal) return null
  const today = todayKey()
  const ty = typeInfo(meal.type)
  const t = totals(sheet.items, ings)
  const base = totals(meal.items, ings)
  const edited = !sameItems(sheet.items, meal.items)
  const week = weekOf(day)
  const n = sheet.days.length
  const update = (p: Partial<typeof sheet>) => set({ sheet: { ...sheet, ...p } })
  const close = () => set({ sheet: null })

  const confirm = () => {
    if (!n) return
    addEntries(sheet.days, meal, sheet.items)
    const show = sheet.days.includes(day) ? day : sheet.days.includes(today) ? today : sheet.days[0]
    set({ sheet: null, day: show })
    tab('home')
    say(n === 1 ? `${meal.name} added` : `${meal.name} added to ${n} days`)
  }

  return (
    <SheetFrame onClose={close} label={`Add ${meal.name}`}>
      <div className="flex items-center gap-3 mb-4">
        <TypeBadge type={meal.type} size={48} icon={24} />
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold uppercase tracking-wide" style={{ color: ty.accent }}>{ty.label}</div>
          <h2 className="text-[20px] font-semibold leading-tight">{meal.name}</h2>
        </div>
      </div>

      <div className="rounded-[24px] hero p-4 flex items-center justify-between mb-3">
        <div>
          <div className="text-[38px] font-light tracking-tight leading-none">{r0(t.kcal)}<span className="text-[14px] font-semibold opacity-60"> kcal</span></div>
          <div className={`text-[12px] font-semibold mt-1 ${edited ? 'text-[#D9822B]' : 'opacity-60'}`}>{edited ? `${signed(t.kcal - base.kcal)} kcal vs saved` : 'Saved recipe'}</div>
        </div>
        <MacroChips t={t} />
      </div>

      <div className="card p-1 mb-3">
        <button type="button" aria-expanded={sheet.adjustOpen} className="tap w-full flex items-center justify-between px-3 py-3" onClick={() => update({ adjustOpen: !sheet.adjustOpen })}>
          <span className="flex items-center gap-2 text-[15px] font-bold"><SlidersHorizontal size={18} className="text-sage-500" />Adjust amounts for this time</span>
          {sheet.adjustOpen ? <ChevronUp size={18} className="opacity-50" /> : <ChevronDown size={18} className="opacity-50" />}
        </button>
        {sheet.adjustOpen && (
          <div className="px-3 pb-2 divide-y divide-forest-900/5 fade">
            {sheet.items.map((it, ix) => {
              const g = ings.find((x) => x.id === it.ing)
              if (!g) return null
              const saved = meal.items.find((x) => x.ing === it.ing)?.qty
              const changed = saved !== it.qty
              return (
                <div key={it.ing} className="flex items-center justify-between py-2.5 gap-2">
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold truncate">{g.name}</div>
                    <div className={`text-[12px] ${changed ? 'text-amber font-semibold' : 'opacity-50'}`}>{changed && saved !== undefined ? `Saved: ${qtyLong(g.unit, saved)}` : 'As saved'}</div>
                  </div>
                  <Stepper label={g.name} value={qtyShort(g.unit, it.qty)} highlight={changed}
                    onChange={(d) => update({ items: sheet.items.map((x, i) => (i === ix ? { ...x, qty: Math.max(0, x.qty + d * stepOf(g.unit)) } : x)) })} />
                </div>
              )
            })}
            <p className="text-[12px] opacity-60 py-2">Only this time. Your saved meal stays the same.</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-baseline px-1 mb-2">
        <h3 className="text-[15px] font-bold">Add to</h3>
        <button type="button" className="tap text-[13px] font-bold text-forest-700" onClick={() => update({ days: week.filter((k) => k >= today) })}>Prep rest of week</button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 mb-5">
        {week.map((k) => {
          const on = sheet.days.includes(k)
          const d = fromKey(k)
          return (
            <button key={k} type="button" aria-pressed={on}
              className={`tap h-14 rounded-[14px] flex flex-col items-center justify-center ${on ? 'btn-dark' : 'soft'} ${k < today && !on ? 'opacity-40' : ''}`}
              onClick={() => update({ days: on ? sheet.days.filter((x) => x !== k) : [...sheet.days, k] })}>
              <span className={`text-[10px] font-bold ${on ? 'text-apricot' : 'opacity-60'}`}>{k === today ? 'TODAY' : DOW[d.getDay()].slice(0, 3).toUpperCase()}</span>
              <span className="text-[16px] font-semibold">{d.getDate()}</span>
            </button>
          )
        })}
      </div>
      <Primary onClick={confirm} disabled={!n}>
        {n ? <><Check size={20} />{n === 1 ? `Add to ${dayName(sheet.days[0])}` : `Add to ${n} days`}</> : 'Pick a day'}
      </Primary>
    </SheetFrame>
  )
}
