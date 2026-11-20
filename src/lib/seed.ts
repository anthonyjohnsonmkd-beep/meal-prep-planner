import type { Category, Data, Ingredient, Meal, MealType, ShopState, Unit } from './types'

type Row = [id: string, name: string, unit: Unit, cat: Category, kcal: number, p: number, c: number, f: number, micros: number[], extra?: Partial<Pick<Ingredient, 'yield' | 'pack'>>]

// All values are for the raw product, as on the package.
// Micros order: fiber g, sugar g, sodium mg, potassium mg, calcium mg, iron mg, vit C mg, vit D µg
const ROWS: Row[] = [
  ['egg', 'Egg (large)', 'piece', 'dairy', 72, 6.3, 0.4, 4.8, [0, 0.2, 71, 69, 28, 0.9, 0, 1.1], { pack: 12 }],
  ['cheese', 'Cheese slice (light)', 'piece', 'dairy', 50, 4.5, 0.5, 3.3, [0, 0.3, 180, 25, 150, 0.1, 0, 0.1]],
  ['oats', 'Oats', '100g', 'grains', 379, 13.2, 67.7, 6.5, [10.1, 1, 6, 362, 52, 4.3, 0, 0], { pack: 500 }],
  ['milk', 'Milk (semi-skimmed)', '100ml', 'dairy', 50, 3.4, 4.8, 1.8, [0, 4.8, 44, 150, 120, 0, 0, 1], { pack: 1000 }],
  ['banana', 'Banana', 'piece', 'produce', 105, 1.3, 27, 0.4, [3.1, 14.4, 1, 422, 6, 0.3, 10.3, 0]],
  ['chia', 'Chia seeds', '100g', 'fats', 486, 16.5, 42, 30.7, [34.4, 0, 16, 407, 631, 7.7, 1.6, 0]],
  ['yogurt', 'Greek yogurt 2%', '100g', 'dairy', 73, 10, 3.9, 2, [0, 3.6, 34, 141, 115, 0.1, 0, 0]],
  ['berries', 'Mixed berries', '100g', 'produce', 50, 0.9, 12, 0.3, [2.4, 7, 1, 100, 15, 0.4, 30, 0]],
  ['sourdough', 'Sourdough slice', 'piece', 'grains', 130, 5, 25, 0.8, [1.2, 1, 250, 60, 10, 1.4, 0, 0]],
  ['avocado', 'Avocado (half)', 'piece', 'produce', 120, 1.5, 6.4, 11, [5, 0.5, 5, 365, 9, 0.4, 7, 0]],
  ['whey', 'Whey protein scoop', 'piece', 'protein', 120, 24, 3, 1.5, [0, 2, 50, 160, 120, 0.5, 0, 0]],
  ['chicken', 'Chicken breast', '100g', 'protein', 120, 22.5, 0, 2.6, [0, 0, 45, 334, 5, 0.4, 0, 0.1], { yield: 0.75 }],
  ['quinoa', 'Quinoa', '100g', 'grains', 368, 14.1, 64.2, 6.1, [7, 0, 5, 563, 47, 4.6, 0, 0], { yield: 2.7, pack: 500 }],
  ['spinach', 'Spinach', '100g', 'produce', 23, 2.9, 3.6, 0.4, [2.2, 0.4, 79, 558, 99, 2.7, 28, 0]],
  ['oil', 'Olive oil (tbsp)', 'piece', 'fats', 119, 0, 0, 13.5, [0, 0, 0, 0, 0, 0.1, 0, 0]],
  ['salmon', 'Salmon', '100g', 'protein', 208, 20, 0, 13, [0, 0, 59, 363, 9, 0.3, 0, 11], { yield: 0.8 }],
  ['sweetpotato', 'Sweet potato', '100g', 'produce', 86, 1.6, 20, 0.1, [3, 4.2, 55, 337, 30, 0.6, 2.4, 0], { yield: 0.9 }],
  ['broccoli', 'Broccoli', '100g', 'produce', 35, 2.4, 7.2, 0.4, [3.3, 1.4, 41, 293, 40, 0.7, 65, 0]],
  ['apple', 'Apple', 'piece', 'produce', 95, 0.5, 25, 0.3, [4.4, 19, 2, 195, 11, 0.2, 8.4, 0]],
  ['almondbutter', 'Almond butter', '100g', 'fats', 614, 21, 19, 56, [10, 4.4, 7, 748, 347, 3.5, 0, 0]],
]

export const SEED_INGREDIENTS: Ingredient[] = ROWS.map(([id, name, unit, cat, kcal, p, c, f, m, extra]) => ({
  id, name, unit, cat, kcal, p, c, f,
  m: { fiber: m[0], sugar: m[1], sodium: m[2], potassium: m[3], calcium: m[4], iron: m[5], vitc: m[6], vitd: m[7] },
  ...extra,
}))

const meal = (id: string, name: string, type: MealType, items: [string, number, 'cooked'?][]): Meal => ({
  id, name, type, items: items.map(([ing, qty, cooked]) => (cooked ? { ing, qty, cooked: true } : { ing, qty })),
})

export const SEED_MEALS: Meal[] = [
  meal('omelette', 'Cheese omelette', 'breakfast', [['egg', 3], ['cheese', 3]]),
  meal('oats', 'Overnight oats with banana', 'breakfast', [['oats', 60], ['milk', 200], ['banana', 1], ['chia', 10]]),
  meal('yogurt', 'Greek yogurt with berries & oats', 'breakfast', [['yogurt', 200], ['berries', 80], ['oats', 30]]),
  meal('bowl', 'Chicken quinoa bowl', 'lunch', [['chicken', 150, 'cooked'], ['quinoa', 150, 'cooked'], ['spinach', 40], ['oil', 1]]),
  meal('salmon', 'Salmon, sweet potato & greens', 'dinner', [['salmon', 150], ['sweetpotato', 200], ['broccoli', 120]]),
  meal('applenut', 'Apple + almond butter', 'snacks', [['apple', 1], ['almondbutter', 15]]),
]

export const emptyShop = (): ShopState => ({ startOffset: 0, days: 7, checked: {}, have: {}, extras: [] })

export const freshData = (): Data => ({
  version: 2,
  ings: structuredClone(SEED_INGREDIENTS),
  meals: structuredClone(SEED_MEALS),
  plan: {},
  targets: { kcal: 2100, p: 150, c: 230, f: 70 },
  favs: ['egg', 'chicken', 'oats'],
  used: {},
  shop: emptyShop(),
})
