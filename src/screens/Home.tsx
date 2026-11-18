import { ChevronDown, ChevronUp, Plus, Sparkles, Target, Utensils } from 'lucide-react'
import { useState } from 'react'
import { GRAD, IconButton, MacroBar, MacroChips, MicroGrid, Nav, Page, TypeBadge } from '../components/ui'
import { TYPES } from '../lib/constants'
import { DOW, MON, dayName, fromKey, todayKey } from '../lib/dates'
import { r0, sameItems, totals } from '../lib/nutrition'
import { useData } from '../lib/store'
import { useUI } from '../lib/ui'

function Ring({ value, target }: { value: number; target: number }) {
  const C = 2 * Math.PI * 52
  const pct = Math.min(1, value / Math.max(1, target))
  const over = value > target
  return (
    <div className="relative w-[132px] h-[132px] shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#A8D5BA" /><stop offset=".55" stopColor="#4C956C" /><stop offset="1" stopColor="#166534" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(15,61,46,.07)" strokeWidth="10" />
        {value > 0 && (
          <circle cx="60" cy="60" r="52" fill="none" stroke={over ? '#E76F51' : 'url(#ring)'} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)' }} />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[42px] font-light tracking-tight leading-none">{r0(value)}</span>
        <span className="text-[12px] opacity-55 mt-1">of {r0(target)} kcal</span>
      </div>
    </div>
  )
}

export default function Home() {
  const { day, set, go } = useUI()
  const plan = useData((s) => s.plan)
  const ings = useData((s) => s.ings)
  const targets = useData((s) => s.targets)
  const [microsOpen, setMicrosOpen] = useState(false)
  const today = todayKey()
  const entries = plan[day] ?? []
  const t = totals(entries.flatMap((e) => e.items), ings)
  const left = targets.kcal - t.kcal
  const d = fromKey(day)
  const hour = new Date().getHours()
  const hello = day !== today ? dayName(day, today) : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const openEntry = (id: string) => {
    set({ edit: { day, id, updateMeal: false } })
    go('entry')
  }

  return (
    <Page className="pb-36 fade">
      <header className="pt-safe px-5 pb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[14px] font-bold text-amber">{hello}</p>
          <h1 className="text-[30px] font-medium tracking-[-0.02em] leading-tight">
            {day === today ? DOW[d.getDay()] : dayName(day, today)}, {d.getDate()} {MON[d.getMonth()].slice(0, 3)}
          </h1>
        </div>
        <div className="flex gap-2">
          {day !== today && (
            <button type="button" className="tap h-11 px-4 rounded-full soft text-[13px] font-bold" onClick={() => set({ day: today })}>Today</button>
          )}
          <IconButton label="Goals and settings" onClick={() => go('goals')}><Target size={19} /></IconButton>
        </div>
      </header>

      <main className="px-4 space-y-4">
        <section className="relative overflow-hidden rounded-[30px] hero p-5">
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-mint-300/60 blur-3xl" />
          <div className="absolute -left-10 -bottom-12 w-32 h-32 rounded-full bg-apricot/30 blur-3xl" />
          <div className="relative flex items-center gap-5">
            <Ring value={t.kcal} target={targets.kcal} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] opacity-55">{left >= 0 ? 'Left to eat' : 'Over target'}</div>
              <div className={`text-[30px] font-normal leading-tight tracking-tight ${left >= 0 ? 'text-[#D9822B]' : 'text-coral'}`}>
                {r0(Math.abs(left))}<span className="text-[14px] font-semibold opacity-60 text-forest-900"> kcal</span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold bg-white/60 rounded-full px-2.5 py-1">
                <Utensils size={13} />{entries.length} {entries.length === 1 ? 'meal' : 'meals'} logged
              </div>
            </div>
          </div>
          <div className="relative grid gap-3 mt-5">
            <MacroBar label="Protein" value={t.p} target={targets.p} gradient={GRAD.p} />
            <MacroBar label="Carbs" value={t.c} target={targets.c} gradient={GRAD.c} />
            <MacroBar label="Fat" value={t.f} target={targets.f} gradient={GRAD.f} />
          </div>
          <button type="button" aria-expanded={microsOpen} className="tap relative w-full mt-4 pt-3 border-t border-forest-900/10 flex items-center justify-between text-[13px] font-semibold opacity-80"
            onClick={() => setMicrosOpen((o) => !o)}>
            <span className="flex items-center gap-2"><Sparkles size={16} />Micronutrients</span>
            {microsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {microsOpen && <div className="relative mt-3 fade"><MicroGrid t={t} /></div>}
        </section>

        <button type="button" className="tap w-full h-16 rounded-[22px] btn-warm text-[18px] font-semibold flex items-center justify-center gap-3" onClick={() => set({ sheet: { kind: 'type' } })}>
          <span className="w-9 h-9 rounded-full btn-dark flex items-center justify-center"><Plus size={20} /></span>Add a meal
        </button>

        <section>
          <div className="flex items-baseline justify-between px-1 mb-2">
            <h2 className="text-[18px] font-semibold">{day === today ? "Today's meals" : 'Meals'}</h2>
            {entries.length > 0 && <span className="text-[13px] opacity-60">Tap to adjust</span>}
          </div>
          {entries.length ? (
            <div className="space-y-2.5">
              {TYPES.flatMap((ty) =>
                entries.filter((e) => e.type === ty.id).map((e) => {
                  const et = totals(e.items, ings)
                  const edited = !sameItems(e.items, e.base)
                  return (
                    <button key={e.id} type="button" className="tap card w-full text-left p-3.5 flex items-center gap-3 slide" onClick={() => openEntry(e.id)}>
                      <TypeBadge type={e.type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: ty.accent }}>{ty.label}</span>
                          {edited && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-peach text-[#B5561F]">EDITED</span>}
                        </div>
                        <div className="text-[15px] font-bold truncate mt-0.5">{e.name}</div>
                        <div className="mt-1.5"><MacroChips t={et} /></div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[22px] font-normal leading-none">{r0(et.kcal)}</div>
                        <div className="text-[11px] opacity-60 mt-1">kcal</div>
                      </div>
                    </button>
                  )
                }),
              )}
            </div>
          ) : (
            <div className="rounded-[22px] border-2 border-dashed border-mint-300 p-6 text-center">
              <div className="flex justify-center -space-x-2 mb-3">
                {TYPES.map((ty) => <div key={ty.id} className="ring-4 ring-[#F4FAF6] rounded-[14px]"><TypeBadge type={ty.id} size={40} icon={20} /></div>)}
              </div>
              <div className="text-[16px] font-bold">Nothing logged yet</div>
              <div className="text-[14px] opacity-60 mt-1">{hour < 11 && day === today ? 'Start the day with breakfast.' : 'Tap “Add a meal” to log your first one.'}</div>
            </div>
          )}
        </section>
      </main>
      <Nav />
    </Page>
  )
}
