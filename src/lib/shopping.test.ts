import { describe, expect, it } from 'vitest'
import { shopAmount, rawQty, totals } from './nutrition'
import { emptyShop, SEED_INGREDIENTS } from './seed'
import { buildShoppingList, shopDays } from './shopping'
import type { Data, Entry } from './types'

const entry = (name: string, items: Entry['items']): Entry => ({ id: name, type: 'lunch', name, items, base: items })
const data = (plan: Data['plan'], shop = emptyShop(), ings = SEED_INGREDIENTS): Pick<Data, 'ings' | 'plan' | 'shop'> => ({ ings, plan, shop })
const chicken = SEED_INGREDIENTS.find((g) => g.id === 'chicken')!

describe('cooked to raw', () => {
  it('converts cooked grams back to raw with the yield', () => {
    expect(rawQty(chicken, { qty: 150, cooked: true })).toBeCloseTo(200)
    expect(rawQty(chicken, { qty: 150 })).toBe(150)
  })
  it('uses raw nutrition for cooked amounts', () => {
    // 150 g cooked chicken = 200 g raw at 120 kcal / 100 g
    expect(totals([{ ing: 'chicken', qty: 150, cooked: true }], SEED_INGREDIENTS).kcal).toBeCloseTo(240)
  })
  it('ignores the cooked flag for pieces', () => {
    expect(rawQty({ unit: 'piece', yield: 0.5 }, { qty: 3, cooked: true })).toBe(3)
  })
})

describe('buildShoppingList', () => {
  const days = shopDays('2026-11-20', 0, 7)

  it('adds up raw amounts across days and meals', () => {
    const plan = {
      '2026-11-20': [entry('Bowl', [{ ing: 'chicken', qty: 150, cooked: true }]), entry('Omelette', [{ ing: 'egg', qty: 3 }])],
      '2026-11-21': [entry('Bowl', [{ ing: 'chicken', qty: 150, cooked: true }]), entry('Omelette', [{ ing: 'egg', qty: 4 }])],
    }
    const lines = buildShoppingList(data(plan), days)
    const c = lines.find((l) => l.ing.id === 'chicken')!
    expect(c.need).toBeCloseTo(400)
    expect(c.sources).toHaveLength(2)
    const e = lines.find((l) => l.ing.id === 'egg')!
    expect(e.buy).toBe(7)
    expect(e.packs).toBe(1)
  })

  it('skips days outside the range', () => {
    const lines = buildShoppingList(data({ '2026-11-30': [entry('X', [{ ing: 'egg', qty: 3 }])] }), days)
    expect(lines).toHaveLength(0)
  })

  const withStock = (id: string, stock: number, extra = {}) => SEED_INGREDIENTS.map((g) => (g.id === id ? { ...g, stock, ...extra } : g))

  it('subtracts what is in stock', () => {
    const plan = { '2026-11-20': [entry('O', [{ ing: 'egg', qty: 6 }])] }
    expect(buildShoppingList(data(plan, emptyShop(), withStock('egg', 5)), days)[0].buy).toBe(1)
    expect(buildShoppingList(data(plan, emptyShop(), withStock('egg', 6)), days)).toHaveLength(0)
  })

  it('skips meals already eaten', () => {
    const plan = { '2026-11-20': [{ ...entry('O', [{ ing: 'egg', qty: 6 }]), eaten: true }] }
    expect(buildShoppingList(data(plan), days)).toHaveLength(0)
  })

  it('adds items that dropped below their warning level', () => {
    const lines = buildShoppingList(data({}, emptyShop(), withStock('egg', 4, { lowAt: 6 })), days)
    expect(lines[0].ing.id).toBe('egg')
    expect(lines[0].buy).toBe(12)
  })

  it('adds running-low items even when nothing is planned', () => {
    const ings = SEED_INGREDIENTS.map((g) => (g.id === 'milk' ? { ...g, low: true } : g))
    const lines = buildShoppingList(data({}, emptyShop(), ings), days)
    expect(lines).toHaveLength(1)
    expect(lines[0].buy).toBe(1000)
    expect(lines[0].low).toBe(true)
  })

  it('un-ticks an item when more is needed after ticking', () => {
    const plan = { '2026-11-20': [entry('O', [{ ing: 'egg', qty: 9 }])] }
    const ticked = buildShoppingList(data(plan, { ...emptyShop(), checked: { egg: 9 } }), days)
    expect(ticked[0].done).toBe(true)
    const grown = buildShoppingList(data(plan, { ...emptyShop(), checked: { egg: 6 } }), days)
    expect(grown[0].done).toBe(false)
    expect(grown[0].more).toBe(3)
  })
})

describe('shopAmount', () => {
  it('formats grams, kilos and litres', () => {
    expect(shopAmount('100g', 333.3)).toBe('340 g')
    expect(shopAmount('100g', 1050)).toBe('1.05 kg')
    expect(shopAmount('100g', 2000)).toBe('2 kg')
    expect(shopAmount('100ml', 1400)).toBe('1.4 L')
    expect(shopAmount('piece', 6.2)).toBe('7')
  })
})

describe('migrate v1 → v2', () => {
  it('turns old cooked examples into raw + cooked items with the same calories', async () => {
    const { migrate } = await import('./store')
    const oldChicken = { ...chicken, name: 'Chicken breast (cooked)', kcal: 165, p: 31, c: 0, f: 3.6, yield: undefined }
    const oldItems = [{ ing: 'chicken', qty: 150 }]
    const before = totals(oldItems, [oldChicken])
    const v1 = { version: 1, ings: [oldChicken], meals: [{ id: 'm', name: 'Bowl', type: 'lunch', items: oldItems }], plan: { '2026-11-19': [entry('Bowl', oldItems)] }, targets: { kcal: 2000, p: 1, c: 1, f: 1 }, favs: [], used: {} } as unknown as Data
    const v2 = migrate(v1, 1)
    expect(v2.shop).toBeDefined()
    expect(v2.meals[0].items[0].cooked).toBe(true)
    expect(v2.plan['2026-11-19'][0].base[0].cooked).toBe(true)
    const after = totals(v2.meals[0].items, v2.ings)
    expect(Math.abs(after.kcal - before.kcal) / before.kcal).toBeLessThan(0.1)
  })
})

describe('canMake', () => {
  it('counts portions from stock and lists what is short', async () => {
    const { canMake } = await import('./nutrition')
    const ings = SEED_INGREDIENTS.map((g) => (g.id === 'egg' ? { ...g, stock: 7 } : g.id === 'cheese' ? { ...g, stock: 10 } : g))
    const omelette = [{ ing: 'egg', qty: 3 }, { ing: 'cheese', qty: 3 }]
    expect(canMake(omelette, ings).times).toBe(2)
    const bowl = [{ ing: 'chicken', qty: 150, cooked: true }]
    const r = canMake(bowl, ings)
    expect(r.times).toBe(0)
    expect(r.short[0].missing).toBeCloseTo(200)
  })
})
