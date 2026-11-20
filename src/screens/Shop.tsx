import { Check, ChevronRight, Plus, Share, ShoppingBasket, X } from 'lucide-react'
import { useState } from 'react'
import { CatBadge, Nav, Page, Primary } from '../components/ui'
import { CATS } from '../lib/constants'
import { DOW, fromKey, shortDate, todayKey } from '../lib/dates'
import { amountText, shopAmount } from '../lib/nutrition'
import { buildShoppingList, listAsText, shopDays, type ShopLine } from '../lib/shopping'
import { useData } from '../lib/store'
import { useUI } from '../lib/ui'

const LENGTHS = [3, 5, 7, 10, 14]

/** "1.05 kg" or, with a pack size, "2 packs · 1 kg". */
export function lineAmount(l: ShopLine) {
  const amount = shopAmount(l.ing.unit, l.buy)
  if (!l.packs || !l.ing.pack) return l.ing.unit === 'piece' ? `× ${amount}` : amount
  return `${l.packs} ${l.packs === 1 ? 'pack' : 'packs'} · ${shopAmount(l.ing.unit, l.packs * l.ing.pack)}`
}

export function useShoppingList() {
  const ings = useData((s) => s.ings)
  const plan = useData((s) => s.plan)
  const shop = useData((s) => s.shop)
  const days = shopDays(todayKey(), shop.startOffset, shop.days)
  return { days, lines: buildShoppingList({ ings, plan, shop }, days), shop, plan }
}

export default function Shop() {
  const { set, go, say } = useUI()
  const { days, lines, shop, plan } = useShoppingList()
  const { setShop, tick, addExtra, toggleExtra, removeExtra, finishShopping } = useData.getState()
  const [extra, setExtra] = useState('')
  const mealCount = days.reduce((n, k) => n + (plan[k]?.length ?? 0), 0)
  const open = lines.filter((l) => !l.done)
  const basket = lines.filter((l) => l.done)
  const extrasOpen = shop.extras.filter((x) => !x.done)
  const extrasDone = shop.extras.filter((x) => x.done)
  const total = lines.length + shop.extras.length
  const doneCount = basket.length + extrasDone.length
  const range = `${DOW[fromKey(days[0]).getDay()].slice(0, 3)} ${shortDate(days[0])} – ${DOW[fromKey(days[days.length - 1]).getDay()].slice(0, 3)} ${shortDate(days[days.length - 1])}`

  const share = async () => {
    const text = listAsText(lines, shop.extras, lineAmount, `Shopping list · ${range}`)
    try {
      if (navigator.share) await navigator.share({ text })
      else {
        await navigator.clipboard.writeText(text)
        say('List copied')
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') say("Couldn't share the list")
    }
  }

  const finish = () => {
    if (!doneCount) return say('Tick off what you bought first')
    if (!window.confirm('Finish shopping? What you ticked is added to your stock and the list is cleared.')) return
    finishShopping(Object.fromEntries(basket.map((l) => [l.ing.id, l.packs && l.ing.pack ? l.packs * l.ing.pack : l.buy])))
    say('Shopping done. Your stock is updated')
  }

  const addExtraItem = () => {
    const n = extra.trim()
    if (!n) return
    addExtra(n)
    setExtra('')
  }

  const row = (l: ShopLine) => (
    <div key={l.ing.id}>{rowInner(l)}</div>
  )
  const rowInner = (l: ShopLine) => (
    <div className="flex items-center">
      <button type="button" role="checkbox" aria-checked={l.done} aria-label={`${l.ing.name}, ${lineAmount(l)}`}
        className="tap w-14 h-14 flex items-center justify-center shrink-0"
        onClick={() => tick(l.ing.id, l.done ? null : l.buy)}>
        <span className={`w-7 h-7 rounded-full flex items-center justify-center ${l.done ? 'btn-dark' : 'border-2 border-forest-900/25 bg-white/60'}`}>
          {l.done && <Check size={16} />}
        </span>
      </button>
      <button type="button" className="tap flex-1 min-w-0 flex items-center gap-2 py-3 pr-3 text-left" onClick={() => set({ sheet: { kind: 'shopItem', ing: l.ing.id } })}>
        <div className="flex-1 min-w-0">
          <div className={`text-[15px] font-bold truncate ${l.done ? 'line-through opacity-50' : ''}`}>{l.ing.name}</div>
          <div className="text-[12px] mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
            {l.more > 0 && <span className="font-bold text-[#B5561F]">+{shopAmount(l.ing.unit, l.more)} more needed</span>}
            {l.low && <span className="font-bold text-[#B5561F]">Running low</span>}
            {l.sources.length > 0 && <span className="opacity-55">{l.sources.length} {l.sources.length === 1 ? 'meal' : 'meals'}</span>}
            {l.have > 0 && <span className="opacity-55">{amountText(l.ing.unit, l.have)} in stock</span>}
          </div>
        </div>
        <div className={`text-[16px] font-semibold text-right shrink-0 ${l.done ? 'opacity-40' : ''}`}>{lineAmount(l)}</div>
        <ChevronRight size={16} className="opacity-25 shrink-0" />
      </button>
    </div>
  )

  return (
    <Page className="pb-44 fade">
      <header className="pt-safe px-5 pb-3">
        <p className="text-[14px] font-bold text-amber">Shop</p>
        <h1 className="text-[30px] font-medium tracking-[-0.02em] leading-tight">Shopping list</h1>
        <p className="text-[14px] opacity-60 mt-0.5">{range} · {mealCount} planned {mealCount === 1 ? 'meal' : 'meals'}</p>
      </header>
      <main className="px-4 space-y-4">
        <section className="card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-bold opacity-70">Starting</span>
            <div className="flex p-1 tint rounded-[14px]" role="radiogroup" aria-label="Starting">
              {([[0, 'Today'], [1, 'Tomorrow']] as const).map(([v, l]) => (
                <button key={v} type="button" role="radio" aria-checked={shop.startOffset === v}
                  className={`tap px-4 py-1.5 rounded-[10px] text-[13px] font-bold ${shop.startOffset === v ? 'btn-dark' : 'opacity-60'}`}
                  onClick={() => setShop({ startOffset: v })}>{l}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-bold opacity-70">Covering</span>
            <div className="flex gap-1.5" role="radiogroup" aria-label="Number of days">
              {LENGTHS.map((n) => (
                <button key={n} type="button" role="radio" aria-checked={shop.days === n}
                  className={`tap w-11 h-9 rounded-[12px] text-[13px] font-bold ${shop.days === n ? 'btn-dark' : 'soft'}`}
                  onClick={() => setShop({ days: n })}>{n}d</button>
              ))}
            </div>
          </div>
          {total > 0 && (
            <div>
              <div className="flex justify-between text-[12px] font-semibold mb-1.5"><span className="opacity-60">In the basket</span><span>{doneCount} of {total}</span></div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(15,61,46,.07)' }}>
                <div className="bar h-full rounded-full" style={{ width: `${(doneCount / total) * 100}%`, background: 'linear-gradient(90deg,#F6D186,#F4A261)' }} />
              </div>
            </div>
          )}
        </section>

        {!lines.length && !shop.extras.length && (
          <div className="rounded-[22px] border-2 border-dashed border-mint-300 p-6 text-center">
            <div className="w-12 h-12 rounded-[16px] btn-warm flex items-center justify-center mx-auto mb-3"><ShoppingBasket size={24} /></div>
            <div className="text-[16px] font-bold">Nothing to buy yet</div>
            <div className="text-[14px] opacity-60 mt-1">Plan meals for these days and whatever your stock doesn't cover appears here, already added up.</div>
            <button type="button" className="tap mt-4 h-11 px-5 rounded-full soft text-[14px] font-bold inline-flex items-center gap-2" onClick={() => { set({ restockAdds: {} }); go('restock') }}>
              <Plus size={16} />Bought without a list? Add to stock
            </button>
          </div>
        )}

        {CATS.map((c) => {
          const list = open.filter((l) => l.ing.cat === c.id)
          if (!list.length) return null
          return (
            <section key={c.id}>
              <h2 className="text-[13px] font-bold text-sage-500 px-1 mb-2 flex items-center gap-2"><CatBadge cat={c.id} size={22} />{c.label}</h2>
              <div className="card divide-y divide-forest-900/5">{list.map(row)}</div>
            </section>
          )
        })}

        <section>
          <h2 className="text-[13px] font-bold text-sage-500 px-1 mb-2">Other things</h2>
          <div className="card divide-y divide-forest-900/5">
            {extrasOpen.map((x) => (
              <div key={x.id} className="flex items-center">
                <button type="button" role="checkbox" aria-checked={false} aria-label={x.name} className="tap w-14 h-12 flex items-center justify-center shrink-0" onClick={() => toggleExtra(x.id)}>
                  <span className="w-7 h-7 rounded-full border-2 border-forest-900/25 bg-white/60" />
                </button>
                <span className="flex-1 text-[15px] font-semibold">{x.name}</span>
                <button type="button" aria-label={`Remove ${x.name}`} className="tap w-12 h-12 flex items-center justify-center opacity-40" onClick={() => removeExtra(x.id)}><X size={16} /></button>
              </div>
            ))}
            <form className="flex items-center gap-2 pl-4 pr-2 py-2" onSubmit={(e) => { e.preventDefault(); addExtraItem() }}>
              <label htmlFor="shop-extra" className="sr-only">Add something else</label>
              <input id="shop-extra" className="flex-1 text-[15px] py-2" placeholder="Add something else, e.g. foil" value={extra} onChange={(e) => setExtra(e.target.value)} enterKeyHint="done" />
              <button type="submit" aria-label="Add" className="tap w-9 h-9 rounded-full bg-mint-300 flex items-center justify-center"><Plus size={18} /></button>
            </form>
          </div>
        </section>

        {(basket.length > 0 || extrasDone.length > 0) && (
          <section>
            <h2 className="text-[13px] font-bold text-sage-500 px-1 mb-2">In the basket</h2>
            <div className="card divide-y divide-forest-900/5">
              {basket.map(row)}
              {extrasDone.map((x) => (
                <div key={x.id} className="flex items-center">
                  <button type="button" role="checkbox" aria-checked aria-label={x.name} className="tap w-14 h-12 flex items-center justify-center shrink-0" onClick={() => toggleExtra(x.id)}>
                    <span className="w-7 h-7 rounded-full btn-dark flex items-center justify-center"><Check size={16} /></span>
                  </button>
                  <span className="flex-1 text-[15px] font-semibold line-through opacity-50">{x.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {total > 0 && (
          <div className="flex gap-2 pt-2">
            <button type="button" className="tap flex-1 h-12 rounded-[16px] soft text-[14px] font-bold flex items-center justify-center gap-2" onClick={share}><Share size={17} />Share list</button>
            <div className="flex-1"><Primary onClick={finish} className="!h-12 !rounded-[16px] !text-[14px]"><Check size={18} />Finish shopping</Primary></div>
          </div>
        )}
      </main>
      <Nav />
    </Page>
  )
}
