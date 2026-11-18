import { del, get, set } from 'idb-keyval'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { freshData } from './seed'
import type { Data, Entry, Ingredient, Item, Meal, MealType, Targets } from './types'

const idbStorage: StateStorage = {
  getItem: async (name) => (await get<string>(name)) ?? null,
  setItem: async (name, value) => set(name, value),
  removeItem: async (name) => del(name),
}

export const uid = () => (crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10))

interface Actions {
  addEntries: (days: string[], meal: Meal, items: Item[]) => void
  setEntryItems: (day: string, id: string, items: Item[]) => void
  removeEntry: (day: string, id: string) => void
  /** Save an edited entry; optionally copy its items back into the saved meal. */
  commitEntry: (day: string, id: string, updateMeal: boolean) => void
  linkEntryToMeal: (day: string, id: string, meal: Meal) => void
  saveMeal: (meal: Omit<Meal, 'id'> & { id?: string | null }) => string
  deleteMeal: (id: string) => void
  saveIngredient: (vals: Omit<Ingredient, 'id'>, id?: string) => string
  deleteIngredient: (id: string) => void
  toggleFav: (id: string) => void
  touch: (ids: string[]) => void
  setTarget: (key: keyof Targets, value: number) => void
  replaceAll: (data: Data) => void
}

export type Store = Data & Actions

export const useData = create<Store>()(
  persist(
    immer((setState) => ({
      ...freshData(),
      addEntries: (days, meal, items) =>
        setState((s) => {
          const clean = items.filter((i) => i.qty > 0)
          for (const k of days) {
            const e: Entry = { id: uid(), mealId: meal.id, type: meal.type, name: meal.name, items: structuredClone(clean), base: structuredClone(meal.items) }
            ;(s.plan[k] ??= []).push(e)
          }
        }),
      setEntryItems: (day, id, items) =>
        setState((s) => {
          const e = s.plan[day]?.find((x) => x.id === id)
          if (e) e.items = items
        }),
      removeEntry: (day, id) =>
        setState((s) => {
          s.plan[day] = (s.plan[day] ?? []).filter((x) => x.id !== id)
        }),
      commitEntry: (day, id, updateMeal) =>
        setState((s) => {
          const e = s.plan[day]?.find((x) => x.id === id)
          if (!e) return
          e.items = e.items.filter((i) => i.qty > 0)
          if (updateMeal) {
            const m = s.meals.find((x) => x.id === e.mealId)
            if (m) {
              m.items = structuredClone(e.items)
              e.base = structuredClone(e.items)
            }
          }
        }),
      linkEntryToMeal: (day, id, meal) =>
        setState((s) => {
          const e = s.plan[day]?.find((x) => x.id === id)
          if (!e) return
          e.mealId = meal.id
          e.name = meal.name
          e.items = structuredClone(meal.items)
          e.base = structuredClone(meal.items)
        }),
      saveMeal: (meal) => {
        const id = meal.id || uid()
        setState((s) => {
          const clean: Meal = { id, name: meal.name.trim(), type: meal.type, items: meal.items.filter((i) => i.qty > 0) }
          const i = s.meals.findIndex((m) => m.id === id)
          if (i >= 0) s.meals[i] = clean
          else s.meals.unshift(clean)
          const t = Date.now()
          clean.items.forEach((it, n) => (s.used[it.ing] = t + n))
        })
        return id
      },
      deleteMeal: (id) =>
        setState((s) => {
          s.meals = s.meals.filter((m) => m.id !== id)
        }),
      saveIngredient: (vals, id) => {
        const newId = id ?? uid()
        setState((s) => {
          const existing = s.ings.find((g) => g.id === newId)
          if (existing) Object.assign(existing, vals)
          else {
            s.ings.push({ id: newId, ...vals })
            s.used[newId] = Date.now()
          }
        })
        return newId
      },
      deleteIngredient: (id) =>
        setState((s) => {
          s.ings = s.ings.filter((g) => g.id !== id)
          s.favs = s.favs.filter((f) => f !== id)
        }),
      toggleFav: (id) =>
        setState((s) => {
          s.favs = s.favs.includes(id) ? s.favs.filter((f) => f !== id) : [...s.favs, id]
        }),
      touch: (ids) =>
        setState((s) => {
          const t = Date.now()
          ids.forEach((id, n) => (s.used[id] = t + n))
        }),
      setTarget: (key, value) =>
        setState((s) => {
          s.targets[key] = Math.max(0, value)
        }),
      replaceAll: (data) => setState(() => ({ ...data })),
    })),
    {
      name: 'meal-prep-planner',
      storage: createJSONStorage(() => idbStorage),
      version: 1,
      partialize: (s): Data => ({ version: 1, ings: s.ings, meals: s.meals, plan: s.plan, targets: s.targets, favs: s.favs, used: s.used }),
    },
  ),
)

/** Plain data snapshot for export. */
export const snapshot = (): Data => {
  const s = useData.getState()
  return { version: 1, ings: s.ings, meals: s.meals, plan: s.plan, targets: s.targets, favs: s.favs, used: s.used }
}

export function isValidData(x: unknown): x is Data {
  const d = x as Data
  return !!d && Array.isArray(d.ings) && Array.isArray(d.meals) && typeof d.plan === 'object' && !!d.targets
}

export const usedIn = (meals: Meal[], ingId: string) => meals.filter((m) => m.items.some((i) => i.ing === ingId))
export const mealsOfType = (meals: Meal[], t: MealType) => meals.filter((m) => m.type === t)
