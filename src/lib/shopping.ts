import { addDays } from './dates'
import { isLow, rawQty } from './nutrition'
import type { Data, Ingredient } from './types'

export interface ShopSource {
  day: string
  meal: string
  raw: number
}

export interface ShopLine {
  ing: Ingredient
  /** Raw amount the planned (not yet eaten) meals use. */
  need: number
  /** Raw amount in stock at home. */
  have: number
  /** What to buy: need minus have, never below zero. Running-low items with no plan need 1 pack/unit. */
  buy: number
  /** Packs to buy when a pack size is set. */
  packs?: number
  sources: ShopSource[]
  low: boolean
  /** Ticked off and still covers what's needed. */
  done: boolean
  /** Ticked off earlier, but more is needed now. */
  more: number
}

export const shopDays = (today: string, startOffset: number, days: number) =>
  Array.from({ length: days }, (_, i) => addDays(today, startOffset + i))

/** Everything to buy for the given days, from the planned meals plus running-low items. */
export function buildShoppingList(data: Pick<Data, 'ings' | 'plan' | 'shop'>, days: string[]): ShopLine[] {
  const byId = new Map(data.ings.map((g) => [g.id, g]))
  const acc = new Map<string, { need: number; sources: ShopSource[] }>()

  for (const day of days) {
    for (const e of data.plan[day] ?? []) {
      // Eaten meals were already taken off stock.
      if (e.eaten) continue
      for (const it of e.items) {
        const g = byId.get(it.ing)
        if (!g || it.qty <= 0) continue
        const raw = rawQty(g, it)
        const a = acc.get(g.id) ?? { need: 0, sources: [] }
        a.need += raw
        a.sources.push({ day, meal: e.name, raw })
        acc.set(g.id, a)
      }
    }
  }
  for (const g of data.ings) if (isLow(g) && !acc.has(g.id)) acc.set(g.id, { need: 0, sources: [] })

  const lines: ShopLine[] = []
  for (const [id, { need, sources }] of acc) {
    const g = byId.get(id)!
    const have = g.stock ?? 0
    const low = isLow(g)
    let buy = Math.max(0, need - have)
    // Running low and nothing else to buy: get one pack (or one unit / 100 g).
    if (low && buy === 0) buy = g.pack ?? (g.unit === 'piece' ? 1 : 100)
    if (buy <= 0) continue
    const packs = g.pack ? Math.ceil(buy / g.pack - 1e-9) : undefined
    const checkedAt = data.shop.checked[id]
    const done = checkedAt !== undefined && checkedAt + 1e-9 >= buy
    const more = checkedAt !== undefined && !done ? buy - checkedAt : 0
    lines.push({ ing: g, need, have, buy, packs, sources, low, done, more })
  }
  return lines.sort((a, b) => a.ing.name.localeCompare(b.ing.name))
}

export function listAsText(lines: ShopLine[], extras: Data['shop']['extras'], fmt: (l: ShopLine) => string, title: string) {
  const open = lines.filter((l) => !l.done)
  const rows = [
    title,
    '',
    ...open.map((l) => `• ${l.ing.name}: ${fmt(l)}`),
    ...extras.filter((x) => !x.done).map((x) => `• ${x.name}`),
  ]
  return rows.join('\n')
}
