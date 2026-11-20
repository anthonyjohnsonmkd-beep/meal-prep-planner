import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { Loader2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useUI } from '../lib/ui'
import { validBarcode } from '../lib/foodfacts'
import { handleBarcode } from '../screens/scan'

const FORMATS = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]

export default function Scanner() {
  const scanner = useUI((s) => s.scanner)
  const set = useUI((s) => s.set)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'starting' | 'scanning' | 'looking' | 'denied' | 'nocamera'>('starting')
  const [manual, setManual] = useState('')
  const busy = useRef(false)
  const close = () => set({ scanner: null })

  const submit = async (code: string) => {
    if (busy.current || !scanner) return
    busy.current = true
    setStatus('looking')
    await handleBarcode(code, scanner.purpose)
  }

  useEffect(() => {
    if (!scanner || !videoRef.current) return
    busy.current = false
    setStatus('starting')
    setManual('')
    let controls: IScannerControls | undefined
    let cancelled = false
    const hints = new Map([[DecodeHintType.POSSIBLE_FORMATS, FORMATS]])
    const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 })
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('nocamera')
      return
    }
    reader
      .decodeFromConstraints({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } } }, videoRef.current, (result) => {
        const code = result?.getText()
        if (code && validBarcode(code)) {
          controls?.stop()
          submit(code)
        }
      })
      .then((c) => {
        if (cancelled) c.stop()
        else {
          controls = c
          setStatus((s) => (s === 'starting' ? 'scanning' : s))
        }
      })
      .catch((e: Error) => setStatus(e.name === 'NotAllowedError' ? 'denied' : 'nocamera'))
    return () => {
      cancelled = true
      controls?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanner])

  if (!scanner) return null
  const typed = manual.replace(/\D/g, '')

  return (
    <div role="dialog" aria-modal="true" aria-label="Scan a barcode" className="fixed inset-0 z-[70] bg-[#0b1f17] text-white flex flex-col fade">
      <div className="flex items-center justify-between px-4 pb-3" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
        <h2 className="text-[18px] font-semibold">Scan a barcode</h2>
        <button type="button" aria-label="Close scanner" className="tap w-11 h-11 rounded-full bg-white/15 flex items-center justify-center" onClick={close}><X size={20} /></button>
      </div>

      <div className="relative flex-1 min-h-0 overflow-hidden">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline autoPlay />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[78%] max-w-[340px] aspect-[16/10] rounded-[22px] border-[3px] border-apricot/90 shadow-[0_0_0_2000px_rgba(11,31,23,.55)]" />
        </div>
        <div className="absolute left-0 right-0 bottom-6 flex justify-center px-6 text-center">
          <div className="rounded-full bg-black/45 px-4 py-2 text-[14px] font-semibold flex items-center gap-2">
            {status === 'starting' && 'Starting camera…'}
            {status === 'scanning' && 'Point at the barcode on the package'}
            {status === 'looking' && <><Loader2 size={16} className="animate-spin" />Looking it up…</>}
            {status === 'denied' && 'Camera access is off. Allow it in Settings → Safari → Camera, or type the number below'}
            {status === 'nocamera' && "Can't open the camera here. Type the number below"}
          </div>
        </div>
      </div>

      <form className="px-4 pt-4 flex gap-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
        onSubmit={(e) => { e.preventDefault(); if (typed.length >= 8) submit(typed) }}>
        <label htmlFor="manual-code" className="sr-only">Barcode number</label>
        <input id="manual-code" inputMode="numeric" autoComplete="off" placeholder="Or type the number under the barcode"
          className="flex-1 h-12 rounded-[14px] bg-white/12 border border-white/20 px-4 text-[15px] placeholder:text-white/45"
          value={manual} onChange={(e) => setManual(e.target.value)} />
        <button type="submit" disabled={typed.length < 8 || status === 'looking'} className="tap h-12 px-5 rounded-[14px] btn-warm text-[15px] font-bold disabled:opacity-40">Find</button>
      </form>
    </div>
  )
}
