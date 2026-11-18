import {
  Apple, ArrowLeft, BookOpen, Carrot, ChartColumn, Drumstick, Egg, House, Minus, MoonStar, Nut, Package, Plus, Sun, Sunrise, Wheat, X,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { MICROS, catInfo, typeInfo } from '../lib/constants'
import { r0, r1 } from '../lib/nutrition'
import type { Category, MealType, Totals } from '../lib/types'
import { currentScreen, useUI, type Tab } from '../lib/ui'

export const TYPE_ICON: Record<MealType, LucideIcon> = { breakfast: Sunrise, lunch: Sun, dinner: MoonStar, snacks: Apple }
export const CAT_ICON: Record<Category, LucideIcon> = { protein: Drumstick, dairy: Egg, grains: Wheat, produce: Carrot, fats: Nut, other: Package }

export function TypeBadge({ type, size = 44, icon = 22 }: { type: MealType; size?: number; icon?: number }) {
  const t = typeInfo(type)
  const Icon = TYPE_ICON[type]
  return (
    <div className="rounded-[14px] flex items-center justify-center shrink-0" style={{ width: size, height: size, background: t.grad, color: t.fg }}>
      <Icon size={icon} strokeWidth={1.8} />
    </div>
  )
}

export function CatBadge({ cat, size = 40 }: { cat: Category; size?: number }) {
  const c = catInfo(cat)
  const Icon = CAT_ICON[cat]
  return (
    <div className="rounded-[12px] flex items-center justify-center shrink-0" style={{ width: size, height: size, background: c.bg, color: c.fg }}>
      <Icon size={size * 0.45} strokeWidth={1.8} />
    </div>
  )
}

const CHIP = {
  p: { background: 'rgba(22,101,52,.12)', color: '#166534' },
  c: { background: 'rgba(246,209,134,.55)', color: '#7A5200' },
  f: { background: 'rgba(244,162,97,.28)', color: '#A4501A' },
}
export function MacroChips({ t, small, decimals }: { t: { p: number; c: number; f: number }; small?: boolean; decimals?: boolean }) {
  const fmt = decimals ? r1 : r0
  const cls = `${small ? 'text-[11px] px-1.5' : 'text-[12px] px-2'} font-semibold py-0.5 rounded-full`
  return (
    <div className="flex gap-1.5 flex-wrap">
      <span className={cls} style={CHIP.p}>P {fmt(t.p)}</span>
      <span className={cls} style={CHIP.c}>C {fmt(t.c)}</span>
      <span className={cls} style={CHIP.f}>F {fmt(t.f)}</span>
    </div>
  )
}

export function Stepper({ value, onChange, highlight, label }: { value: string; onChange: (d: -1 | 1) => void; highlight?: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1 rounded-[14px] p-1 shrink-0 ${highlight ? 'bg-peach' : 'tint'}`}>
      <button type="button" aria-label={`Less ${label}`} className="tap w-9 h-9 rounded-[11px] bg-white flex items-center justify-center" onClick={() => onChange(-1)}>
        <Minus size={16} />
      </button>
      <span className="min-w-[52px] text-center text-[14px] font-bold" aria-live="polite">{value}</span>
      <button type="button" aria-label={`More ${label}`} className="tap w-9 h-9 rounded-[11px] bg-white flex items-center justify-center" onClick={() => onChange(1)}>
        <Plus size={16} />
      </button>
    </div>
  )
}

export function IconButton({ onClick, label, children }: { onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} className="tap w-11 h-11 rounded-full soft flex items-center justify-center shrink-0" onClick={onClick}>
      {children}
    </button>
  )
}

export function BackButton({ close }: { close?: boolean }) {
  const back = useUI((s) => s.back)
  return (
    <IconButton onClick={back} label={close ? 'Close' : 'Back'}>
      {close ? <X size={20} /> : <ArrowLeft size={20} />}
    </IconButton>
  )
}

export function Primary({ children, onClick, disabled, className = '' }: { children: ReactNode; onClick: () => void; disabled?: boolean; className?: string }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className={`tap w-full h-14 rounded-[18px] btn-dark text-[16px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40 ${className}`}>
      {children}
    </button>
  )
}

export function Footer({ children }: { children: ReactNode }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 px-4 pt-3 pb-safe bg-white/45 backdrop-blur-2xl border-t border-white/70 z-30 space-y-2">
      <div className="max-w-[560px] mx-auto space-y-2">{children}</div>
    </div>
  )
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="text-[13px] font-bold text-sage-500 px-1">{children}</div>
}

export function MicroGrid({ t, base }: { t: Totals; base?: Totals | null }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {MICROS.map(({ key, label, unit, target }) => (
        <div key={key} className="rounded-[14px] px-3 py-2.5 bg-white/60">
          <div className="flex justify-between items-baseline">
            <span className="text-[12px] opacity-60">{label}</span>
            <span className="text-[13px] font-bold">{r1(t.m[key])}<span className="font-medium opacity-70"> {unit}</span></span>
          </div>
          <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(15,61,46,.07)' }}>
            <div className="bar h-full rounded-full" style={{ width: `${Math.min(100, (t.m[key] / target) * 100)}%`, background: 'linear-gradient(90deg,#A8D5BA,#4C956C)' }} />
          </div>
          {base && Math.abs(base.m[key] - t.m[key]) > 0.05 && <div className="text-[11px] opacity-60 mt-1">was {r1(base.m[key])}</div>}
        </div>
      ))}
    </div>
  )
}

export function MacroBar({ label, value, target, gradient }: { label: string; value: number; target: number; gradient: string }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-[13px] opacity-60">{label}</span>
        <span className="text-[14px] font-bold">{r0(value)}<span className="opacity-50 font-medium"> / {target} g</span></span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(15,61,46,.07)' }}>
        <div className="bar h-full rounded-full" style={{ width: `${Math.min(100, (value / Math.max(1, target)) * 100)}%`, background: gradient }} />
      </div>
    </div>
  )
}
export const GRAD = {
  p: 'linear-gradient(90deg,#A8D5BA,#166534)',
  c: 'linear-gradient(90deg,#FBEBC4,#F6D186)',
  f: 'linear-gradient(90deg,#FDE3CC,#F4A261)',
}

const NAV: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'home', label: 'Today', Icon: House },
  { id: 'week', label: 'Week', Icon: ChartColumn },
  { id: 'library', label: 'Meals', Icon: BookOpen },
  { id: 'pantry', label: 'Pantry', Icon: Carrot },
]
export function Nav() {
  const active = useUI((s) => currentScreen(s))
  const tab = useUI((s) => s.tab)
  return (
    <nav className="fixed left-4 right-4 bottom-safe z-30">
      <div className="glass rounded-[30px] py-2 px-2 flex justify-around items-center max-w-[560px] mx-auto">
        {NAV.map(({ id, label, Icon }) => {
          const on = id === active
          return (
            <button key={id} type="button" aria-current={on ? 'page' : undefined} className={`tap flex flex-col items-center gap-0.5 w-16 ${on ? '' : 'opacity-50'}`} onClick={() => tab(id)}>
              <div className={`w-14 h-8 rounded-full flex items-center justify-center ${on ? 'btn-dark' : ''}`}><Icon size={20} strokeWidth={1.8} /></div>
              <span className="text-[11px] font-semibold">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export function Toast() {
  const toast = useUI((s) => s.toast)
  if (!toast) return null
  return (
    <div key={toast.id} role="status" className="fixed left-4 right-4 z-[60] toast-in pointer-events-none" style={{ top: 'calc(env(safe-area-inset-top) + 10px)' }}>
      <div className="glass rounded-[18px] px-4 py-3.5 text-[14px] font-semibold max-w-[560px] mx-auto">{toast.text}</div>
    </div>
  )
}

export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`max-w-[560px] mx-auto ${className}`}>{children}</div>
}
