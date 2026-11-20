import type { Category, MicroKey, Unit } from './types'

/**
 * Open Food Facts: a free, open food database (https://world.openfoodfacts.org).
 * Values are per 100 g or 100 ml of the product as sold, which matches how
 * ingredients are stored here (raw, as on the package).
 */
const FIELDS = 'code,product_name,product_name_en,brands,quantity,product_quantity,product_quantity_unit,nutrition_data_per,categories_tags,nutriments'

export interface OffProduct {
  code: string
  product_name?: string
  product_name_en?: string
  brands?: string | string[]
  quantity?: string
  product_quantity?: number | string
  product_quantity_unit?: string
  categories_tags?: string[]
  nutriments?: Record<string, number | string | undefined>
}

export interface FoodMatch {
  barcode: string
  name: string
  unit: Unit
  cat: Category
  kcal?: number
  p?: number
  c?: number
  f?: number
  micros: Partial<Record<MicroKey, number>>
  pack?: number
}

export class FoodFactsError extends Error {
  kind: 'offline' | 'unavailable' | 'notfound'
  constructor(kind: 'offline' | 'unavailable' | 'notfound') {
    super(kind)
    this.kind = kind
  }
}

async function getJson(url: string, timeoutMs = 10000) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new FoodFactsError('offline')
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new FoodFactsError(res.status === 404 ? 'notfound' : 'unavailable')
    return await res.json()
  } catch (e) {
    if (e instanceof FoodFactsError) throw e
    throw new FoodFactsError(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'unavailable')
  } finally {
    clearTimeout(timer)
  }
}

export async function lookupBarcode(code: string): Promise<FoodMatch> {
  const clean = code.replace(/\D/g, '')
  const j = await getJson(`https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=${FIELDS}`)
  if (!j || j.status !== 1 || !j.product) throw new FoodFactsError('notfound')
  const m = toMatch({ ...j.product, code: j.product.code ?? clean })
  if (!m) throw new FoodFactsError('notfound')
  return m
}

export async function searchFoods(q: string): Promise<FoodMatch[]> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20&fields=${FIELDS}`
  const j = await getJson(url, 12000)
  return ((j?.products ?? []) as OffProduct[]).map(toMatch).filter((m): m is FoodMatch => !!m && m.kcal !== undefined)
}

const num = (v: unknown) => {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? n : undefined
}
const round = (n: number | undefined, d = 1) => (n === undefined ? undefined : Math.round(n * 10 ** d) / 10 ** d)

/** Turn an Open Food Facts product into ingredient values. Returns null when there's no usable name. */
export function toMatch(p: OffProduct): FoodMatch | null {
  const brand = Array.isArray(p.brands) ? p.brands[0] : p.brands?.split(',')[0]?.trim()
  const raw = (p.product_name_en || p.product_name || '').trim()
  // Some products are entered in ALL CAPS; make them readable.
  const base = raw === raw.toUpperCase() && /[A-Z]/.test(raw) ? raw.charAt(0) + raw.slice(1).toLowerCase() : raw
  if (!base) return null
  const name = brand && !base.toLowerCase().includes(brand.toLowerCase()) ? `${base} (${brand})` : base
  const n = p.nutriments ?? {}
  const qUnit = (p.product_quantity_unit ?? '').toLowerCase()
  const unit: Unit = qUnit === 'ml' || qUnit === 'l' || /\b\d+(\.\d+)?\s*(ml|l|cl)\b/i.test(p.quantity ?? '') ? '100ml' : '100g'

  let kcal = num(n['energy-kcal_100g'])
  if (kcal === undefined) {
    const kj = num(n['energy-kj_100g']) ?? num(n['energy_100g'])
    if (kj !== undefined) kcal = kj / 4.184
  }
  // Nutriments come in grams; the app uses mg for minerals and vitamin C, µg for vitamin D.
  const g = (k: string, scale = 1, d = 1) => round(num(n[`${k}_100g`]) !== undefined ? num(n[`${k}_100g`])! * scale : undefined, d)
  const micros: FoodMatch['micros'] = {}
  const set = (k: MicroKey, v: number | undefined) => { if (v !== undefined) micros[k] = v }
  set('fiber', g('fiber'))
  set('sugar', g('sugars'))
  set('sodium', g('sodium', 1000, 0) ?? round(num(n['salt_100g']) !== undefined ? (num(n['salt_100g'])! / 2.5) * 1000 : undefined, 0))
  set('potassium', g('potassium', 1000, 0))
  set('calcium', g('calcium', 1000, 0))
  set('iron', g('iron', 1000, 1))
  set('vitc', g('vitamin-c', 1000, 1))
  set('vitd', g('vitamin-d', 1e6, 1))

  let pack = num(p.product_quantity)
  if (pack !== undefined && (qUnit === 'kg' || qUnit === 'l')) pack *= 1000
  if (pack !== undefined && (pack < 5 || pack > 20000)) pack = undefined

  return {
    barcode: p.code,
    name,
    unit,
    cat: guessCategory(p.categories_tags ?? []),
    kcal: round(kcal, 0),
    p: g('proteins'),
    c: g('carbohydrates'),
    f: g('fat'),
    micros,
    pack: pack !== undefined ? Math.round(pack) : undefined,
  }
}

export function guessCategory(tags: string[]): Category {
  const t = tags.join(' ')
  if (/meats|poultry|fishes|seafood|chicken|beef|pork|sausages|hams/.test(t)) return 'protein'
  if (/dairies|dairy|milks|yogurts|cheeses|eggs|creams/.test(t)) return 'dairy'
  if (/nuts|seeds|oils|fats|butters|nut-butters/.test(t)) return 'fats'
  // Grains before produce: Open Food Facts files bread under "cereals-and-potatoes".
  if (/breads|pastas|rices|grains|flours|breakfast-cereals|oats|cereals/.test(t)) return 'grains'
  if (/fruits|vegetables|legumes|salads|potatoes/.test(t)) return 'produce'
  return 'other'
}

/** Valid EAN-8 / EAN-13 / UPC-A check digit. Filters out misreads from the camera. */
export function validBarcode(code: string) {
  if (!/^\d{8}$|^\d{12,13}$/.test(code)) return false
  const digits = code.split('').map(Number)
  const check = digits.pop()!
  const sum = digits.reverse().reduce((a, d, i) => a + d * (i % 2 === 0 ? 3 : 1), 0)
  return (10 - (sum % 10)) % 10 === check
}
