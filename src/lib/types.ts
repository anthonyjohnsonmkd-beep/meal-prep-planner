export type Unit = 'piece' | '100g' | '100ml'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks'
export type Category = 'protein' | 'dairy' | 'grains' | 'produce' | 'fats' | 'other'
export type MicroKey = 'fiber' | 'sugar' | 'sodium' | 'potassium' | 'calcium' | 'iron' | 'vitc' | 'vitd'

export type Micros = Record<MicroKey, number>

/** Nutrition values are per 1 piece, per 100 g or per 100 ml depending on `unit`. */
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
}

/** qty is a count for `piece`, otherwise grams or millilitres. */
export interface Item {
  ing: string
  qty: number
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
}

export interface Targets {
  kcal: number
  p: number
  c: number
  f: number
}

export interface Data {
  version: 1
  ings: Ingredient[]
  meals: Meal[]
  plan: Record<string, Entry[]>
  targets: Targets
  favs: string[]
  used: Record<string, number>
}

export interface Totals {
  kcal: number
  p: number
  c: number
  f: number
  m: Micros
}
