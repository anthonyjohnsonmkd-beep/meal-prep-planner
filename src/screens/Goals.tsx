import { Download, Upload } from 'lucide-react'
import { useRef } from 'react'
import { BackButton, Label, Page } from '../components/ui'
import { MICROS } from '../lib/constants'
import { todayKey } from '../lib/dates'
import { freshData } from '../lib/seed'
import { isValidData, migrate, snapshot, useData } from '../lib/store'
import type { Targets } from '../lib/types'
import { useUI } from '../lib/ui'

export default function Goals() {
  const targets = useData((s) => s.targets)
  const setTarget = useData((s) => s.setTarget)
  const replaceAll = useData((s) => s.replaceAll)
  const say = useUI((s) => s.say)
  const fileRef = useRef<HTMLInputElement>(null)

  const exportBackup = async () => {
    const json = JSON.stringify(snapshot(), null, 2)
    const name = `meal-prep-backup-${todayKey()}.json`
    const file = new File([json], name, { type: 'application/json' })
    // On iPhone the share sheet lets you save to Files or send it anywhere.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Meal Prep backup' })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      }
    }
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const importBackup = async (f: File) => {
    try {
      const data = JSON.parse(await f.text())
      if (!isValidData(data)) throw new Error('bad')
      if (!window.confirm('Replace everything in the app with this backup?')) return
      replaceAll(migrate({ ...freshData(), ...data }, data.version ?? 1))
      say('Backup restored')
    } catch {
      say("That file isn't a Meal Prep backup")
    }
  }

  const reset = () => {
    if (!window.confirm('Delete all your meals, ingredients and plans and start over with the examples?')) return
    replaceAll(freshData())
    say('Started fresh')
  }

  const row = (k: keyof Targets, label: string, unit: string, dot?: string) => (
    <label htmlFor={`target-${k}`} className="field rounded-[18px] soft border-2 px-4 py-3 flex items-center justify-between">
      <span className="flex items-center gap-2 text-[15px] font-bold">{dot && <span className="w-2.5 h-2.5 rounded-full" style={{ background: dot }} />}{label}</span>
      <span className="flex items-baseline gap-1">
        <input id={`target-${k}`} inputMode="numeric" className="w-20 text-right text-[20px] font-semibold" value={targets[k] || ''}
          onChange={(e) => setTarget(k, parseInt(e.target.value.replace(/\D/g, '') || '0', 10))} />
        <span className="text-[13px] opacity-50 font-semibold">{unit}</span>
      </span>
    </label>
  )

  return (
    <Page className="pb-16 slide">
      <header className="pt-safe px-5 pb-4">
        <div className="mb-3"><BackButton /></div>
        <p className="text-[14px] font-bold text-amber">Daily goals</p>
        <h1 className="text-[30px] font-medium tracking-[-0.02em]">Your targets</h1>
      </header>
      <main className="px-4 space-y-2">
        {row('kcal', 'Calories', 'kcal')}
        {row('p', 'Protein', 'g', '#166534')}
        {row('c', 'Carbs', 'g', '#F6D186')}
        {row('f', 'Fat', 'g', '#F4A261')}
        <div className="card p-4 !mt-4">
          <h2 className="text-[15px] font-bold mb-3">Micronutrient targets</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {MICROS.map((m) => (
              <div key={m.key} className="flex justify-between text-[13px]"><span className="opacity-60">{m.label}</span><span className="font-bold">{m.target} {m.unit}</span></div>
            ))}
          </div>
          <p className="text-[12px] opacity-60 mt-3">Standard adult reference values.</p>
        </div>

        <div className="pt-5"><Label>Backup</Label></div>
        <div className="card p-4 space-y-3">
          <p className="text-[13px] opacity-70">Your data lives only on this phone. Save a backup now and then, and before switching phones.</p>
          <div className="flex gap-2">
            <button type="button" className="tap flex-1 h-12 rounded-[16px] btn-dark text-[14px] font-bold flex items-center justify-center gap-2" onClick={exportBackup}><Upload size={17} />Save backup</button>
            <button type="button" className="tap flex-1 h-12 rounded-[16px] soft text-[14px] font-bold flex items-center justify-center gap-2" onClick={() => fileRef.current?.click()}><Download size={17} />Restore</button>
          </div>
          <input ref={fileRef} id="restore-file" type="file" accept="application/json,.json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importBackup(f); e.target.value = '' }} />
        </div>
        <button type="button" className="tap w-full h-12 !mt-4 rounded-[16px] soft text-[14px] font-semibold opacity-70" onClick={reset}>Delete all data and start over</button>
      </main>
    </Page>
  )
}
