import type { Tone } from '../../types/report'

export const TONE_COLOR: Record<Tone, string> = {
  primary: '#7C3AED',
  warn: '#B45309',
  caution: '#FBBF77',
  muted: '#C4B5FD',
}

/** Máximo "redondo" del eje y su paso, p. ej. 115 → { max: 120, step: 30 } */
export function niceScale(value: number, ticks = 4) {
  const raw = Math.max(value, 1) / ticks
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 3, 5, 10].map((m) => m * pow).find((s) => s >= raw)!
  return { max: step * ticks, step }
}

export const fmt = (n: number) => n.toLocaleString('es')
