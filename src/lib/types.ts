export type Unit = 'piece' | '100g' | '100ml'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks'
export type Category = 'protein' | 'dairy' | 'grains' | 'produce' | 'fats' | 'other'
export type MicroKey = 'fiber' | 'sugar' | 'sodium' | 'potassium' | 'calcium' | 'iron' | 'vitc' | 'vitd'

export type Micros = Record<MicroKey, number>

/**
 * Nutrition values are for the raw product (as on the package),
 * per 1 piece, per 100 g or per 100 ml depending on `unit`.
 */
export interface Ingredient {
  id: string
  name: string
  unit: Unit
  cat: Category
  kcal: number
  p: number
  c: number
  f: number
  m: Micros
  /** Cooked weight per 1 unit of raw weight (chicken ≈ 0.75, rice ≈ 2.5). Only for grams/ml. */
  yield?: number
  /** Pack size in the ingredient's unit (pieces, g or ml), for the shopping list. */
  pack?: number
  /** Marked as running low: always goes on the shopping list. */
  low?: boolean
  /** Raw amount at home, in the ingredient's unit (pieces, g or ml). */
  stock?: number
  /** Put it on the shopping list when stock drops below this. */
  lowAt?: number
  /** Product barcode (EAN/UPC), so scanning it again finds this ingredient. */
  barcode?: string
}

/** qty is a count for `piece`, otherwise grams or millilitres, weighed raw unless `cooked`. */
export interface Item {
  ing: string
  qty: number
  cooked?: boolean
}

/** A saved recipe in the library. */
export interface Meal {
  id: string
  name: string
  type: MealType
  items: Item[]
}

/** A meal placed on a day. `base` is what it looked like when added, so edits can be compared and reset. */
export interface Entry {
  id: string
  mealId?: string
  type: MealType
  name: string
  items: Item[]
  base: Item[]
  /** Ticked as eaten: its raw amounts have been taken off stock. */
  eaten?: boolean
}

export interface Targets {
  kcal: number
  p: number
  c: number
  f: number
}

export interface ShopState {
  /** First shopping day offset from today: 0 = today, 1 = tomorrow. */
  startOffset: 0 | 1
  /** Number of days the shop covers. */
  days: number
  /** Ingredient id -> raw amount that was in the basket when ticked. */
  checked: Record<string, number>
  /** Ingredient id -> raw amount already at home. */
  have: Record<string, number>
  extras: { id: string; name: string; done: boolean }[]
}

export interface Data {
  version: 2
  ings: Ingredient[]
  meals: Meal[]
  plan: Record<string, Entry[]>
  targets: Targets
  favs: string[]
  used: Record<string, number>
  shop: ShopState
}

export interface Totals {
  kcal: number
  p: number
  c: number
  f: number
  m: Micros
}
