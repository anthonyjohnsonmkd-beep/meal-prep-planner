import { ChevronRight, Copy, Plus } from 'lucide-react'
import { BackButton, MacroChips, Nav, Page, TYPE_ICON } from '../components/ui'
import { TYPES, typeInfo } from '../lib/constants'
import { dayName, todayKey } from '../lib/dates'
import { r0, totals, unitSuffix } from '../lib/nutrition'
import { useData } from '../lib/store'
import { useUI } from '../lib/ui'

export default function Library({ adding }: { adding: boolean }) {
  const { libType, day, set, go } = useUI()
  const meals = useData((s) => s.meals)
  const ings = useData((s) => s.ings)
  const ty = typeInfo(libType)
  const Icon = TYPE_ICON[libType]
  const list = meals.filter((m) => m.type === libType)
  const dark = ty.fg === '#FFFFFF'
  const glassOn = dark ? 'rgba(255,255,255,.18)' : 'rgba(15,61,46,.08)'
  const today = todayKey()

  const newMeal = () => {
    set({ draft: { id: null, name: '', type: libType, items: [] } })
    go('builder')
  }
  const pick = (id: string) => {
    const m = meals.find((x) => x.id === id)!
    set({ sheet: { kind: 'confirm', mealId: id, items: structuredClone(m.items), days: [day < today ? today : day], adjustOpen: false } })
  }
  const edit = (id: string) => {
    set({ draft: structuredClone(meals.find((x) => x.id === id)!) })
    go('builder')
  }
  const duplicate = (id: string) => {
    const m = meals.find((x) => x.id === id)!
    set({ draft: { id: null, name: `${m.name} (copy)`, type: m.type, items: structuredClone(m.items), dupOf: m.name } })
    go('builder')
  }

  return (
    <div className={`${adding ? 'pb-10' : 'pb-36'} slide`}>
      <header className="relative overflow-hidden pt-safe px-4 pb-6 rounded-b-[32px]" style={{ background: ty.grad, color: ty.fg }}>
        <Page>
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full" style={{ background: ty.fg, opacity: 0.07 }} />
          {adding && (
            <div className="relative flex items-center justify-between mb-5">
              <BackButton />
              <span className="text-[13px] font-bold px-3 py-1.5 rounded-full" style={{ background: glassOn }}>Adding to {dayName(day)}</span>
            </div>
          )}
          <div className="relative flex items-center gap-3">
            <div className="w-14 h-14 rounded-[18px] flex items-center justify-center" style={{ background: glassOn }}><Icon size={28} strokeWidth={1.8} /></div>
            <div>
              <h1 className="text-[30px] font-normal tracking-tight leading-tight">{ty.label}</h1>
              <p className="text-[14px] font-semibold opacity-75">{list.length} saved {list.length === 1 ? 'meal' : 'meals'}</p>
            </div>
          </div>
          {!adding && (
            <div className="relative flex gap-2 mt-5 overflow-x-auto -mx-4 px-4">
              {TYPES.map((t) => (
                <button key={t.id} type="button" aria-pressed={t.id === libType}
                  className={`tap shrink-0 px-4 h-9 rounded-full text-[13px] font-bold ${t.id === libType ? 'btn-dark' : ''}`}
                  style={t.id === libType ? undefined : { background: glassOn }} onClick={() => set({ libType: t.id })}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </Page>
      </header>

      <Page>
        <main className="px-4 pt-4 space-y-3">
          <button type="button" className="tap w-full rounded-[22px] border-2 border-dashed border-forest-700/40 bg-white/60 p-4 flex items-center gap-3 text-left" onClick={newMeal}>
            <div className="w-12 h-12 rounded-[16px] btn-dark flex items-center justify-center shrink-0"><Plus size={24} /></div>
            <div className="flex-1">
              <div className="text-[16px] font-semibold">Create new {ty.one}</div>
              <div className="text-[13px] opacity-60">Build it from ingredients, save it for later</div>
            </div>
            <ChevronRight size={20} className="opacity-40" />
          </button>

          {list.map((m) => {
            const t = totals(m.items, ings)
            const summary = m.items.map((it) => {
              const g = ings.find((x) => x.id === it.ing)
              return g ? `${g.name} ${g.unit === 'piece' ? `×${it.qty}` : `${it.qty}${unitSuffix(g.unit)}`}` : ''
            }).join(' · ')
            return (
              <div key={m.id} className="card relative">
                <button type="button" className="tap w-full text-left p-4" onClick={() => (adding ? pick(m.id) : edit(m.id))}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[16px] font-bold">{m.name}</div>
                      <div className="text-[13px] opacity-60 mt-0.5 line-clamp-1">{summary}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[24px] font-normal leading-none">{r0(t.kcal)}</div>
                      <div className="text-[11px] opacity-60 mt-1">kcal</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <MacroChips t={t} />
                    {adding ? (
                      <span className="w-9 h-9 rounded-full tint text-forest-700 flex items-center justify-center"><Plus size={18} /></span>
                    ) : (
                      <span className="w-[96px]" />
                    )}
                  </div>
                </button>
                {!adding && (
                  <button type="button" className="tap absolute right-3 bottom-3 h-9 px-3 rounded-full soft text-[12px] font-bold flex items-center gap-1" onClick={() => duplicate(m.id)}>
                    <Copy size={14} />Duplicate
                  </button>
                )}
              </div>
            )
          })}
          {!list.length && <p className="text-center text-[14px] opacity-60 py-6">No saved {ty.label.toLowerCase()} yet. Create your first one above.</p>}
        </main>
      </Page>
      {!adding && <Nav />}
    </div>
  )
}
