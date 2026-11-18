const pad = (n: number) => String(n).padStart(2, '0')

export const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** Local calendar date as YYYY-MM-DD. */
export const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const fromKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const todayKey = () => keyOf(new Date())

export const addDays = (k: string, n: number) => {
  const d = fromKey(k)
  d.setDate(d.getDate() + n)
  return keyOf(d)
}

/** Monday-first week containing the given day. */
export const weekOf = (k: string) => {
  const d = fromKey(k)
  const offset = (d.getDay() + 6) % 7
  return Array.from({ length: 7 }, (_, i) => addDays(k, i - offset))
}

export const dayName = (k: string, today = todayKey()) => (k === today ? 'Today' : DOW[fromKey(k).getDay()])
export const shortDate = (k: string) => {
  const d = fromKey(k)
  return `${d.getDate()} ${MON[d.getMonth()].slice(0, 3)}`
}
