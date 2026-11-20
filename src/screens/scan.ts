import { FoodFactsError, lookupBarcode, type FoodMatch } from '../lib/foodfacts'
import { amountText, defaultQty } from '../lib/nutrition'
import { useData } from '../lib/store'
import type { Ingredient } from '../lib/types'
import { useUI, type IngDraft } from '../lib/ui'
import { blankIngDraft, draftFromIngredient } from './IngForm'

/** One "unit" to add when a product is scanned in "I bought…": a pack, or 1 piece / 100 g. */
export const restockStep = (g: Pick<Ingredient, 'pack' | 'unit'>) => g.pack ?? (g.unit === 'piece' ? 1 : 100)

export function draftFromMatch(m: FoodMatch, base: IngDraft): IngDraft {
  const s = (v: number | undefined) => (v === undefined ? '' : String(v))
  return {
    ...base,
    name: m.name,
    unit: m.unit,
    cat: m.cat,
    kcal: s(m.kcal),
    p: s(m.p),
    c: s(m.c),
    f: s(m.f),
    micros: Object.fromEntries(Object.entries(m.micros).map(([k, v]) => [k, s(v)])),
    pack: s(m.pack),
    barcode: m.barcode,
    fromDb: true,
    amount: m.unit === 'piece' ? 1 : base.amount && base.unit === m.unit ? base.amount : 100,
  }
}

const MESSAGES: Record<FoodFactsError['kind'], string> = {
  notfound: "Not in the food database. Enter it from the label once and the next scan will find it",
  offline: "You're offline. Enter it from the label instead",
  unavailable: "The food database isn't responding. Enter it from the label instead",
}

/**
 * Handle a scanned barcode depending on where the scan started.
 * Known barcodes are found in the pantry first, so they work offline.
 */
export async function handleBarcode(code: string, purpose: 'pantry' | 'meal' | 'restock' | 'form') {
  const ui = useUI.getState()
  const data = useData.getState()
  const known = data.ings.find((g) => g.barcode === code)

  if (known) {
    ui.set({ scanner: null })
    if (purpose === 'restock') {
      const step = restockStep(known)
      ui.set({ restockAdds: { ...ui.restockAdds, [known.id]: (ui.restockAdds[known.id] ?? 0) + step } })
      return ui.say(`${known.name} +${amountText(known.unit, step)}`)
    }
    if (purpose === 'meal' && ui.draft) {
      if (!ui.draft.items.some((i) => i.ing === known.id)) {
        ui.set({ draft: { ...ui.draft, items: [...ui.draft.items, { ing: known.id, qty: defaultQty(known.unit) }] } })
        data.touch([known.id])
      }
      ui.back()
      return ui.say(`${known.name} added`)
    }
    if (purpose === 'form') return ui.say(`Already in your pantry as ${known.name}`)
    ui.set({ ingDraft: draftFromIngredient(known) })
    ui.go('ingForm')
    return ui.say('Already in your pantry')
  }

  const base: IngDraft =
    purpose === 'form' && ui.ingDraft
      ? ui.ingDraft
      : purpose === 'meal'
        ? blankIngDraft('builder')
        : { ...blankIngDraft('pantry'), thenRestock: purpose === 'restock' }

  let next: IngDraft
  try {
    const m = await lookupBarcode(code)
    next = draftFromMatch(m, base)
    ui.say('Found it. Check the values against the label, then save')
  } catch (e) {
    next = { ...base, barcode: code }
    ui.say(MESSAGES[e instanceof FoodFactsError ? e.kind : 'unavailable'])
  }
  useUI.getState().set({ scanner: null, ingDraft: next })
  if (purpose !== 'form') useUI.getState().go('ingForm')
}
