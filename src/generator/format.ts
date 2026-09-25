// Formatos numéricos equivalentes a los de generar_reporte.py (fnum, fpct, fdur, fhoras, fdist, fdate).

export const isNum = (x: number | null | undefined): x is number => x !== null && x !== undefined && !Number.isNaN(x)

/** Redondeo "bancario" (mitad al par), como round() y format() de Python. */
export function roundHalfEven(x: number, dec = 0) {
  const f = 10 ** dec
  const m = x * f
  const r = Math.round(m)
  // Solo los empates exactos difieren de Math.round (que redondea hacia +∞)
  if (Math.abs(m % 1) === 0.5) return (r % 2 === 0 ? r : r - 1) / f
  return r / f
}

/** 1234.5 → "1.234,5" (miles con punto, decimales con coma) */
export function fnum(x: number | null | undefined, dec = 0) {
  if (!isNum(x)) return '—'
  const v = roundHalfEven(x, dec)
  const [int, frac] = Math.abs(v).toFixed(dec).split('.')
  const sign = v < 0 && Number(Math.abs(v).toFixed(dec)) !== 0 ? '-' : ''
  return sign + int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (frac ? ',' + frac : '')
}

export const fpct = (x: number | null | undefined, dec = 0) => (isNum(x) ? fnum(x * 100, dec) + '%' : '—')

/** minutos → "27 min" · "2 h 05 min" */
export function fdur(mins: number | null | undefined) {
  if (!isNum(mins)) return '—'
  if (Math.abs(mins) < 60) return `${roundHalfEven(mins)} min`
  let h = Math.floor(Math.abs(mins) / 60)
  let m = roundHalfEven(Math.abs(mins) - h * 60)
  if (m === 60) {
    h += 1
    m = 0
  }
  return `${mins < 0 ? '-' : ''}${h} h ${String(m).padStart(2, '0')} min`
}

/** horas → "45 min" · "4,1 h" · "3,2 días" */
export function fhoras(h: number | null | undefined) {
  if (!isNum(h)) return '—'
  if (h < 1) return `${roundHalfEven(h * 60)} min`
  if (h < 48) return fnum(h, 1) + ' h'
  return fnum(h / 24, 1) + ' días'
}

/** metros → "850 m" · "5,0 km" */
export function fdist(m: number | null | undefined) {
  if (!isNum(m)) return '—'
  return m < 1000 ? `${fnum(m)} m` : `${fnum(m / 1000, 1)} km`
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Día UTC (ms) → "08/07" o "08/07/2026" */
export function fdate(ms: number, year = false) {
  const d = new Date(ms)
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}` + (year ? `/${d.getUTCFullYear()}` : '')
}

/** Fecha y hora local actual → "25/09/2026 09:18" */
export function nowStamp(date = new Date()) {
  return {
    date: `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  }
}

export const ratio = (a: number, b: number) => (b ? a / b : NaN)
