// Variación de un KPI respecto del período anterior (misma empresa).
import { fdur, fhoras, fnum, isNum } from '../generator/format'
import type { Kpi } from '../types/report'
import { METRICS, type Metrics } from './metrics'

export interface Comparison {
  /** Período anterior, p. ej. "01/04/2026 – 30/06/2026" */
  period: string
  metrics: Metrics
}

export interface Delta {
  /** "+6,2 pp" · "−12%" · "−8 min" */
  text: string
  arrow: '▲' | '▼' | '='
  /** good/bad según la dirección que es mejora; neutral si es informativo o no cambió */
  tone: 'good' | 'bad' | 'neutral'
  suffix?: string
}

const sign = (x: number) => (x > 0 ? '+' : x < 0 ? '−' : '')

/** null si no hay dato para comparar (reportes antiguos o KPI sin indicador asociado). */
export function kpiDelta(kpi: Kpi, current: Metrics | undefined, previous: Comparison | null | undefined): Delta | null {
  if (!kpi.metric || !current || !previous) return null
  const cur = current[kpi.metric]
  const prev = previous.metrics[kpi.metric]
  if (!isNum(cur) || !isNum(prev)) return null

  const def = METRICS[kpi.metric]
  const diff = cur - prev
  let text: string
  let flat: boolean

  switch (def.format) {
    case 'pct': {
      const pp = diff * 100
      flat = Math.abs(pp) < 0.5
      text = `${sign(pp)}${fnum(Math.abs(pp), Math.abs(pp) < 10 ? 1 : 0)} pp`
      break
    }
    case 'count': {
      if (prev === 0) {
        flat = cur === 0
        text = `${sign(diff)}${fnum(Math.abs(diff))}`
      } else {
        const rel = (diff / prev) * 100
        flat = Math.abs(rel) < 1
        text = `${sign(rel)}${fnum(Math.abs(rel), Math.abs(rel) < 10 ? 1 : 0)}%`
      }
      break
    }
    case 'minutes':
      flat = Math.abs(diff) < 1
      text = `${sign(diff)}${fdur(Math.abs(diff))}`
      break
    case 'hours':
      flat = Math.abs(diff) < 0.05
      text = `${sign(diff)}${fhoras(Math.abs(diff))}`
      break
  }

  if (flat) return { text: 'sin cambios', arrow: '=', tone: 'neutral' }
  const improved = def.better === 'up' ? diff > 0 : def.better === 'down' ? diff < 0 : null
  return {
    text,
    arrow: diff > 0 ? '▲' : '▼',
    tone: improved === null ? 'neutral' : improved ? 'good' : 'bad',
    suffix: def.suffix,
  }
}
