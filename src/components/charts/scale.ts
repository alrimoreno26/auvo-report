import type { Tone } from '../../types/report'

export const TONE_COLOR: Record<Tone, string> = {
  primary: '#7C3AED',
  warn: '#B45309',
  caution: '#FBBF77',
  muted: '#C4B5FD',
}

/** Máximo "redondo" del eje (nice_max del generador): 115 → 120 · 35 → 40 */
export function niceMax(v: number) {
  if (v <= 0) return 1
  const e = 10 ** Math.floor(Math.log10(v))
  const f = v / e
  return ([1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((n) => f <= n) ?? 10) * e
}

export const fmt = (n: number) => n.toLocaleString('es')
