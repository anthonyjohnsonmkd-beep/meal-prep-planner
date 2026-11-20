import { lazy, Suspense, useEffect, useState } from 'react'
import { Toast } from './components/ui'
import { todayKey } from './lib/dates'
import { useData } from './lib/store'
import { currentScreen, useUI } from './lib/ui'
import Builder from './screens/Builder'
import EntryEdit from './screens/EntryEdit'
import Goals from './screens/Goals'
import Home from './screens/Home'
import IngForm from './screens/IngForm'
import Library from './screens/Library'
import Pantry from './screens/Pantry'
import Picker from './screens/Picker'
import { ConfirmSheet, ShopItemSheet, TypeSheet } from './screens/Sheets'
import FoodSearch from './screens/FoodSearch'
import Restock from './screens/Restock'
import Shop from './screens/Shop'
import Week from './screens/Week'

// The barcode reader is large, so it only loads when the scanner is opened.
const Scanner = lazy(() => import('./components/Scanner'))

function useHydrated() {
  const [ok, setOk] = useState(useData.persist.hasHydrated())
  useEffect(() => {
    const off = useData.persist.onFinishHydration(() => setOk(true))
    setOk(useData.persist.hasHydrated())
    // Ask the browser not to evict our data under storage pressure.
    navigator.storage?.persist?.().catch(() => {})
    return off
  }, [])
  return ok
}

/** When the app is reopened on a new day, jump to that day. */
function useDayRollover() {
  useEffect(() => {
    let last = todayKey()
    const check = () => {
      const now = todayKey()
      if (document.visibilityState === 'visible' && now !== last) {
        if (useUI.getState().day === last) useUI.setState({ day: now })
        last = now
      }
    }
    document.addEventListener('visibilitychange', check)
    return () => document.removeEventListener('visibilitychange', check)
  }, [])
}

export default function App() {
  const ready = useHydrated()
  useDayRollover()
  const screen = useUI(currentScreen)
  const sheet = useUI((s) => s.sheet)
  const scanner = useUI((s) => s.scanner)
  if (!ready) return <div className="min-h-screen" aria-busy="true" />

  const view = {
    home: <Home />,
    week: <Week />,
    library: <Library adding={false} />,
    libraryAdd: <Library adding />,
    pantry: <Pantry />,
    shop: <Shop />,
    restock: <Restock />,
    foodSearch: <FoodSearch />,
    goals: <Goals />,
    builder: <Builder />,
    picker: <Picker />,
    ingForm: <IngForm />,
    entry: <EntryEdit />,
  }[screen]

  return (
    <>
      {view}
      {sheet?.kind === 'type' && <TypeSheet />}
      {sheet?.kind === 'confirm' && <ConfirmSheet />}
      {sheet?.kind === 'shopItem' && <ShopItemSheet />}
      {scanner && (
        <Suspense fallback={<div className="fixed inset-0 z-[70] bg-[#0b1f17]" aria-busy="true" />}>
          <Scanner />
        </Suspense>
      )}
      <Toast />
    </>
  )
}
