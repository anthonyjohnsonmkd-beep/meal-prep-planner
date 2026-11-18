import { describe, expect, it } from 'vitest'
import { addDays, weekOf } from './dates'
import { kcalCheck, sameItems, signed, totals } from './nutrition'
import { SEED_INGREDIENTS } from './seed'

describe('totals', () => {
  it('counts pieces directly', () => {
    const t = totals([{ ing: 'egg', qty: 3 }, { ing: 'cheese', qty: 3 }], SEED_INGREDIENTS)
    expect(Math.round(t.kcal)).toBe(366)
    expect(Math.round(t.p)).toBe(32)
    expect(Math.round(t.m.sodium)).toBe(753)
  })
  it('scales grams and ml per 100', () => {
    const t = totals([{ ing: 'chicken', qty: 150 }, { ing: 'milk', qty: 200 }], SEED_INGREDIENTS)
    expect(t.kcal).toBeCloseTo(165 * 1.5 + 50 * 2)
  })
  it('ignores unknown ingredients', () => {
    expect(totals([{ ing: 'nope', qty: 2 }], SEED_INGREDIENTS).kcal).toBe(0)
  })
})

describe('kcalCheck', () => {
  it('accepts values that match the macros', () => {
    expect(kcalCheck(72, 6.3, 0.4, 4.8).status).toBe('ok')
  })
  it('flags a typo', () => {
    const r = kcalCheck(120, 20, 22, 8)
    expect(r.status).toBe('mismatch')
    expect(r.fromMacros).toBe(240)
  })
  it('waits until macros are entered', () => {
    expect(kcalCheck(100, 0, 0, 0).status).toBe('incomplete')
    expect(kcalCheck(undefined, 5, 5, 5).status).toBe('incomplete')
  })
  it('allows a small absolute gap on low-calorie foods', () => {
    expect(kcalCheck(23, 2.9, 3.6, 0.4).status).toBe('ok')
  })
})

describe('helpers', () => {
  it('formats signed differences', () => {
    expect(signed(72.4)).toBe('+72')
    expect(signed(-50)).toBe('−50')
  })
  it('compares item lists', () => {
    expect(sameItems([{ ing: 'a', qty: 1 }], [{ ing: 'a', qty: 1 }])).toBe(true)
    expect(sameItems([{ ing: 'a', qty: 1 }], [{ ing: 'a', qty: 2 }])).toBe(false)
  })
  it('builds Monday-first weeks', () => {
    const w = weekOf('2026-11-18') // a Wednesday
    expect(w[0]).toBe('2026-11-16')
    expect(w[6]).toBe('2026-11-22')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })
})
