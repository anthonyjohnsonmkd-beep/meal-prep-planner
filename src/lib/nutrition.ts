import { MICROS } from './constants'
import type { Ingredient, Item, Micros, Totals, Unit } from './types'

export const emptyMicros = (): Micros => ({ fiber: 0, sugar: 0, sodium: 0, potassium: 0, calcium: 0, iron: 0, vitc: 0, vitd: 0 })

/** How many "nutrition units" a quantity is: pieces count directly, grams/ml are per 100. */
export const factor = (unit: Unit, qty: number) => (unit === 'piece' ? qty : qty / 100)

export function totals(items: Item[], ings: Ingredient[]): Totals {
  const byId = new Map(ings.map((g) => [g.id, g]))
  const t: Totals = { kcal: 0, p: 0, c: 0, f: 0, m: emptyMicros() }
  for (const it of items) {
    const g = byId.get(it.ing)
    if (!g) continue
    const x = factor(g.unit, it.qty)
    t.kcal += g.kcal * x
    t.p += g.p * x
    t.c += g.c * x
    t.f += g.f * x
    for (const { key } of MICROS) t.m[key] += (g.m[key] || 0) * x
  }
  return t
}

export const macroKcal = (p: number, c: number, f: number) => p * 4 + c * 4 + f * 9

/**
 * Checks entered calories against protein×4 + carbs×4 + fat×9.
 * Flags a mismatch when off by more than 15 kcal or 15%, whichever is larger.
 */
export function kcalCheck(kcal: number | undefined, p: number, c: number, f: number) {
  const fromMacros = macroKcal(p, c, f)
  if (kcal === undefined || Number.isNaN(kcal) || (!p && !c && !f)) return { fromMacros, status: 'incomplete' as const }
  const bad = Math.abs(kcal - fromMacros) > Math.max(15, kcal * 0.15)
  return { fromMacros, status: bad ? ('mismatch' as const) : ('ok' as const) }
}

export const stepOf = (unit: Unit) => (unit === 'piece' ? 1 : 10)
export const defaultQty = (unit: Unit) => (unit === 'piece' ? 1 : 100)
export const unitSuffix = (unit: Unit) => (unit === 'piece' ? '' : unit === '100ml' ? ' ml' : ' g')
export const perText = (unit: Unit) => (unit === 'piece' ? 'piece' : unit === '100g' ? '100 g' : '100 ml')
export const qtyShort = (unit: Unit, q: number) => (unit === 'piece' ? String(q) : `${q}${unitSuffix(unit)}`)
export const qtyLong = (unit: Unit, q: number) => (unit === 'piece' ? `${q} ${q === 1 ? 'piece' : 'pieces'}` : `${q}${unitSuffix(unit)}`)

export const sameItems = (a: Item[], b: Item[]) =>
  a.length === b.length && a.every((x, i) => x.ing === b[i].ing && x.qty === b[i].qty)

export const r0 = (n: number) => Math.round(n).toLocaleString('en-US')
export const r1 = (n: number) => {
  if (Math.abs(n) >= 100) return r0(n)
  const v = Math.round(n * 10) / 10
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}
export const signed = (n: number) => {
  const v = Math.round(n)
  return (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toLocaleString('en-US')
}
