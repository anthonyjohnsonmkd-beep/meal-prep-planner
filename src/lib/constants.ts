import type { Category, MealType, MicroKey } from './types'

export const MICROS: { key: MicroKey; label: string; unit: string; target: number }[] = [
  { key: 'fiber', label: 'Fiber', unit: 'g', target: 28 },
  { key: 'sugar', label: 'Sugar', unit: 'g', target: 50 },
  { key: 'sodium', label: 'Sodium', unit: 'mg', target: 2300 },
  { key: 'potassium', label: 'Potassium', unit: 'mg', target: 3400 },
  { key: 'calcium', label: 'Calcium', unit: 'mg', target: 1000 },
  { key: 'iron', label: 'Iron', unit: 'mg', target: 18 },
  { key: 'vitc', label: 'Vit C', unit: 'mg', target: 90 },
  { key: 'vitd', label: 'Vit D', unit: 'µg', target: 15 },
]

export interface TypeInfo {
  id: MealType
  label: string
  one: string
  bg: string
  fg: string
  grad: string
  accent: string
}

export const TYPES: TypeInfo[] = [
  { id: 'breakfast', label: 'Breakfast', one: 'breakfast', bg: '#F6D186', fg: '#0F3D2E', grad: 'linear-gradient(140deg,#FFF6DC 0%,#F6D186 100%)', accent: '#C8702A' },
  { id: 'lunch', label: 'Lunch', one: 'lunch', bg: '#4C956C', fg: '#0F3D2E', grad: 'linear-gradient(140deg,#E3F3E8 0%,#8CC4A2 100%)', accent: '#4C956C' },
  { id: 'dinner', label: 'Dinner', one: 'dinner', bg: '#166534', fg: '#FFFFFF', grad: 'linear-gradient(140deg,#4C956C 0%,#166534 55%,#0F3D2E 100%)', accent: '#166534' },
  { id: 'snacks', label: 'Snacks', one: 'snack', bg: '#FDE3CC', fg: '#0F3D2E', grad: 'linear-gradient(140deg,#FFF1E6 0%,#F8BE90 100%)', accent: '#C8702A' },
]
export const typeInfo = (id: MealType) => TYPES.find((t) => t.id === id)!

export interface CatInfo {
  id: Category
  label: string
  bg: string
  fg: string
}

export const CATS: CatInfo[] = [
  { id: 'protein', label: 'Meat & fish', bg: '#F4A261', fg: '#0F3D2E' },
  { id: 'dairy', label: 'Dairy & eggs', bg: '#F6D186', fg: '#0F3D2E' },
  { id: 'grains', label: 'Grains & bread', bg: '#FDE3CC', fg: '#0F3D2E' },
  { id: 'produce', label: 'Fruit & veg', bg: '#A8D5BA', fg: '#0F3D2E' },
  { id: 'fats', label: 'Nuts, seeds & oils', bg: '#4C956C', fg: '#FFFFFF' },
  { id: 'other', label: 'Other', bg: '#E6F2EA', fg: '#0F3D2E' },
]
export const catInfo = (id: Category) => CATS.find((c) => c.id === id) ?? CATS[5]
