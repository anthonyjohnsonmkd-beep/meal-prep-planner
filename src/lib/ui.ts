import { create } from 'zustand'
import { todayKey } from './dates'
import type { Category, Item, MealType, MicroKey, Unit } from './types'

export type Tab = 'home' | 'week' | 'library' | 'pantry' | 'shop'
export type ScreenName = Tab | 'goals' | 'libraryAdd' | 'builder' | 'picker' | 'ingForm' | 'entry' | 'restock' | 'foodSearch'

export interface MealDraft {
  id: string | null
  name: string
  type: MealType
  items: Item[]
  dupOf?: string
  fromEntry?: { day: string; id: string }
}

export interface IngDraft {
  ctx: 'builder' | 'pantry'
  editId?: string
  name: string
  unit: Unit
  cat: Category
  kcal: string
  p: string
  c: string
  f: string
  micros: Partial<Record<MicroKey, string>>
  amount: number
  /** Cooked grams per 100 g raw, as typed. */
  yieldPct: string
  pack: string
  low: boolean
  stock: string
  lowAt: string
  barcode?: string
  /** Filled from the food database: show a "check against the label" note. */
  fromDb?: boolean
  /** After saving, go back to the "I bought…" screen and add this amount. */
  thenRestock?: boolean
}

export type Sheet =
  | null
  | { kind: 'type' }
  | { kind: 'confirm'; mealId: string; items: Item[]; days: string[]; adjustOpen: boolean }
  | { kind: 'shopItem'; ing: string }

interface UI {
  stack: ScreenName[]
  day: string
  libType: MealType
  draft: MealDraft | null
  ingDraft: IngDraft | null
  edit: { day: string; id: string; updateMeal: boolean } | null
  /** Waiting for a cooked-weight ratio before switching this ingredient to cooked. */
  pendingCook: { ing: string; target: 'draft' | 'entry' } | null
  sheet: Sheet
  /** Camera scanner overlay and what the scanned code is for. */
  scanner: { purpose: 'pantry' | 'meal' | 'restock' | 'form' } | null
  /** Amounts picked on the "I bought…" screen, kept while scanning or creating ingredients. */
  restockAdds: Record<string, number>
  toast: { id: number; text: string } | null
  go: (s: ScreenName) => void
  back: () => void
  tab: (t: Tab) => void
  set: (p: Partial<UI>) => void
  say: (text: string) => void
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

export const useUI = create<UI>()((set, get) => ({
  stack: ['home'],
  day: todayKey(),
  libType: 'breakfast',
  draft: null,
  ingDraft: null,
  edit: null,
  pendingCook: null,
  sheet: null,
  scanner: null,
  restockAdds: {},
  toast: null,
  go: (s) => {
    set({ stack: [...get().stack, s] })
    window.scrollTo(0, 0)
  },
  back: () => {
    const st = get().stack
    set({ stack: st.length > 1 ? st.slice(0, -1) : st })
    window.scrollTo(0, 0)
  },
  tab: (t) => {
    set({ stack: [t], sheet: null })
    window.scrollTo(0, 0)
  },
  set: (p) => set(p),
  say: (text) => {
    clearTimeout(toastTimer)
    set({ toast: { id: Date.now(), text } })
    toastTimer = setTimeout(() => set({ toast: null }), 2600)
  },
}))

export const currentScreen = (s: { stack: ScreenName[] }) => s.stack[s.stack.length - 1]
