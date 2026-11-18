import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton, Nav, Page, TYPE_ICON } from '../components/ui'
import { TYPES } from '../lib/constants'
import { DOW, addDays, fromKey, shortDate, todayKey, weekOf } from '../lib/dates'
import { r0, totals } from '../lib/nutrition'
import { useData } from '../lib/store'
import { useUI } from '../lib/ui'

export default function Week() {
  const { day, set, tab } = useUI()
  const plan = useData((s) => s.plan)
  const ings = useData((s) => s.ings)
  const targets = useData((s) => s.targets)
  const today = todayKey()
  const week = weekOf(day)
  const tots = week.map((k) => totals((plan[k] ?? []).flatMap((e) => e.items), ings))
  const max = Math.max(targets.kcal * 1.2, ...tots.map((t) => t.kcal))
  const H = 120
  const logged = tots.filter((t, i) => week[i] <= today && t.kcal > 0)
  const avg = (f: (t: (typeof tots)[number]) => number) => (logged.length ? logged.reduce((a, t) => a + f(t), 0) / logged.length : 0)
  const open = (k: string) => {
    set({ day: k })
    tab('home')
  }

  return (
    <Page className="pb-36 fade">
      <header className="pt-safe px-5 pb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[14px] font-bold text-amber">{week.includes(today) ? 'This week' : 'Week'}</p>
          <h1 className="text-[30px] font-medium tracking-[-0.02em] leading-tight">{shortDate(week[0])} – {shortDate(week[6])}</h1>
        </div>
        <div className="flex gap-2">
          <IconButton label="Previous week" onClick={() => set({ day: addDays(day, -7) })}><ChevronLeft size={18} /></IconButton>
          <IconButton label="Next week" onClick={() => set({ day: addDays(day, 7) })}><ChevronRight size={18} /></IconButton>
        </div>
      </header>
      <main className="px-4 space-y-4">
        <section className="relative overflow-hidden rounded-[30px] hero p-5">
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-mint-300/60 blur-3xl" />
          <div className="relative flex justify-between">
            <div>
              <div className="text-[13px] opacity-55">Daily average{logged.length ? ` · ${logged.length} ${logged.length === 1 ? 'day' : 'days'} logged` : ''}</div>
              <div className="text-[42px] font-light tracking-tight leading-tight">{r0(avg((t) => t.kcal))}<span className="text-[14px] font-semibold opacity-50"> / {r0(targets.kcal)}</span></div>
            </div>
            <div className="text-right">
              <div className="text-[13px] opacity-55">Protein avg</div>
              <div className="text-[22px] font-semibold text-[#D9822B]">{r0(avg((t) => t.p))} g</div>
            </div>
          </div>
          <div className="relative mt-4" style={{ height: H + 26 }} role="img" aria-label="Calories per day this week">
            <div className="absolute left-0 right-0 border-t-2 border-dashed border-forest-900/15" style={{ bottom: (targets.kcal / max) * H + 22 }} />
            <div className="absolute left-0 right-0 bottom-[22px] flex items-end gap-2" style={{ height: H }}>
              {week.map((k, i) => (
                <button key={k} type="button" aria-label={`${DOW[fromKey(k).getDay()]}: ${r0(tots[i].kcal)} kcal`} className="tap flex-1 h-full flex items-end justify-center" onClick={() => open(k)}>
                  <div className="bar w-full max-w-[30px] rounded-[10px]" style={{
                    height: Math.max(6, (tots[i].kcal / max) * H),
                    background: k === today ? 'linear-gradient(180deg,#F6D186,#F4A261)' : k < today ? 'linear-gradient(180deg,#A8D5BA,#4C956C)' : 'rgba(15,61,46,.08)',
                  }} />
                </button>
              ))}
            </div>
            <div className="absolute left-0 right-0 bottom-0 flex gap-2">
              {week.map((k) => <span key={k} className={`flex-1 text-center text-[11px] font-bold ${k === today ? 'text-[#D9822B]' : 'opacity-50'}`}>{DOW[fromKey(k).getDay()][0]}</span>)}
            </div>
          </div>
        </section>

        <section className="space-y-2">
          {week.map((k, i) => {
            const d = fromKey(k)
            const es = plan[k] ?? []
            return (
              <button key={k} type="button" className={`tap card w-full p-3.5 flex items-center gap-3 text-left ${k === today ? 'ring-2 ring-apricot' : ''}`} onClick={() => open(k)}>
                <div className={`w-12 h-12 rounded-[14px] flex flex-col items-center justify-center shrink-0 ${k === today ? 'btn-dark' : 'tint'}`}>
                  <span className="text-[10px] font-bold opacity-70">{DOW[d.getDay()].slice(0, 3).toUpperCase()}</span>
                  <span className="text-[17px] font-semibold leading-none">{d.getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex gap-1">
                    {TYPES.map((ty) => {
                      const Icon = TYPE_ICON[ty.id]
                      const has = es.some((e) => e.type === ty.id)
                      return (
                        <span key={ty.id} className="w-6 h-6 rounded-[8px] flex items-center justify-center"
                          style={has ? { background: ty.grad, color: ty.fg } : { border: '1.5px dashed rgba(15,61,46,.2)', color: 'rgba(15,61,46,.25)' }}>
                          <Icon size={12} />
                        </span>
                      )
                    })}
                  </div>
                  <div className="text-[12px] opacity-60 mt-1">{es.length ? `${es.length} ${es.length === 1 ? 'meal' : 'meals'} · P ${r0(tots[i].p)} g` : 'Nothing planned'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[20px] font-normal">{r0(tots[i].kcal)}</div>
                  <div className="text-[11px] opacity-60">kcal</div>
                </div>
              </button>
            )
          })}
        </section>
      </main>
      <Nav />
    </Page>
  )
}
