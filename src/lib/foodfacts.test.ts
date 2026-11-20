import { afterEach, describe, expect, it, vi } from 'vitest'
import skyr from './fixtures/off-skyr.json'
import twix from './fixtures/off-twix.json'
import { FoodFactsError, guessCategory, lookupBarcode, toMatch, validBarcode, type OffProduct } from './foodfacts'
import { kcalCheck } from './nutrition'

describe('toMatch (real Open Food Facts data)', () => {
  it('maps a dairy product per 100 g with pack size and units', () => {
    const m = toMatch(skyr.product as OffProduct)!
    expect(m.name).toBe('Skyr (Danone)')
    expect(m.unit).toBe('100g')
    expect(m.cat).toBe('dairy')
    expect(m.kcal).toBe(57)
    expect(m.pack).toBe(140)
    expect(m.micros.sodium).toBe(35) // 0.035 g -> 35 mg
    expect(m.barcode).toBe('3033490004743')
  })
  it('ignores implausible pack sizes and converts minerals to mg', () => {
    const m = toMatch(twix.product as OffProduct)!
    expect(m.pack).toBeUndefined() // "1 g" on a frozen bar is bad data
    expect(m.micros.calcium).toBe(80)
    expect(m.kcal).toBe(281)
  })
  it('produces values that pass the calorie check', () => {
    const m = toMatch(skyr.product as OffProduct)!
    expect(kcalCheck(m.kcal, m.p!, m.c!, m.f!).status).toBe('ok')
  })
  it('falls back to kJ and to salt when kcal and sodium are missing', () => {
    const m = toMatch({ code: '1', product_name: 'Test', nutriments: { 'energy-kj_100g': 418.4, salt_100g: 1 } })!
    expect(m.kcal).toBe(100)
    expect(m.micros.sodium).toBe(400)
  })
  it('detects liquids', () => {
    expect(toMatch({ code: '1', product_name: 'Milk', quantity: '1 l', product_quantity: 1, product_quantity_unit: 'l' })!.unit).toBe('100ml')
    expect(toMatch({ code: '1', product_name: 'Milk', quantity: '1 l', product_quantity: 1, product_quantity_unit: 'l' })!.pack).toBe(1000)
  })
  it('rejects products without a name', () => {
    expect(toMatch({ code: '1' })).toBeNull()
  })
})

describe('guessCategory', () => {
  it('maps common categories', () => {
    expect(guessCategory(['en:meats', 'en:poultries', 'en:chickens'])).toBe('protein')
    expect(guessCategory(['en:plant-based-foods', 'en:cereals-and-potatoes', 'en:breads'])).toBe('grains')
    expect(guessCategory(['en:fruits'])).toBe('produce')
    expect(guessCategory(['en:snacks'])).toBe('other')
  })
})

describe('lookupBarcode', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('returns the product', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(skyr))))
    expect((await lookupBarcode('3033490004743')).name).toBe('Skyr (Danone)')
  })
  it('reports unknown barcodes as not found', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ status: 0 }))))
    await expect(lookupBarcode('123')).rejects.toMatchObject({ kind: 'notfound' })
  })
  it('reports server errors as unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })))
    await expect(lookupBarcode('123')).rejects.toBeInstanceOf(FoodFactsError)
  })
})

describe('validBarcode', () => {
  it('accepts real EAN-13, EAN-8 and UPC-A codes', () => {
    expect(validBarcode('3033490004743')).toBe(true)
    expect(validBarcode('5000159484695')).toBe(true)
    expect(validBarcode('96385074')).toBe(true)
    expect(validBarcode('036000291452')).toBe(true)
  })
  it('rejects misreads', () => {
    expect(validBarcode('3033490004744')).toBe(false)
    expect(validBarcode('12345')).toBe(false)
  })
})
