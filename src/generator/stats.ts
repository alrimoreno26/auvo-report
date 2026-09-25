// Equivalentes mínimos de las operaciones de pandas que usa el generador.
import { isNum } from './format'

const valid = (xs: (number | null)[]) => xs.filter(isNum)

/** Series.median(): ignora NaN */
export function median(xs: (number | null)[]) {
  const s = valid(xs).sort((a, b) => a - b)
  if (!s.length) return NaN
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Series.quantile(q) con interpolación lineal (default de pandas) */
export function quantile(xs: (number | null)[], q: number) {
  const s = valid(xs).sort((a, b) => a - b)
  if (!s.length) return NaN
  const pos = (s.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return s[lo] + (s[hi] - s[lo]) * (pos - lo)
}

/** Series.value_counts(): [valor, cantidad] de mayor a menor; empates por primera aparición */
export function valueCounts<T>(xs: (T | null | undefined)[]): [T, number][] {
  const counts = new Map<T, number>()
  for (const x of xs) if (x !== null && x !== undefined) counts.set(x, (counts.get(x) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

/** Series.nunique() */
export const nunique = <T>(xs: (T | null | undefined)[]) => new Set(xs.filter((x) => x !== null && x !== undefined)).size

/** DataFrame.groupby(key): grupos en orden de clave (como pandas, que ordena por defecto) */
export function groupBy<T>(rows: T[], key: (r: T) => string): [string, T[]][] {
  const map = new Map<string, T[]>()
  for (const r of rows) {
    const k = key(r)
    const g = map.get(k)
    if (g) g.push(r)
    else map.set(k, [r])
  }
  return [...map.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
}

export const count = <T>(rows: T[], pred: (r: T) => boolean) => rows.reduce((n, r) => n + (pred(r) ? 1 : 0), 0)
