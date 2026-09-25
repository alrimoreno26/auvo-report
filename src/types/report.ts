// Estructura del JSON de un reporte (generado por scripts/extract-report.mjs).

export type Tone = 'primary' | 'warn' | 'caution' | 'muted'
export type AlertTone = 'ok' | 'warn' | 'info'
export type PillTone = 'ok' | 'warn' | 'bad'

export interface SectionHead {
  title: string
  lead: string
}

export interface CardHead {
  title: string
  subtitle?: string
}

export interface Kpi {
  label: string
  value: string
  note?: string
  /** 0–100, dibuja la barra de progreso */
  progress?: number
}

export interface Bar {
  label: string
  value: number
  display: string
  tip?: string
  tone: Tone
}

export interface BarChartData extends CardHead {
  bars: Bar[]
}

export interface StackSegment {
  label: string
  value: number
  /** 0–100 */
  share: number
  color: string
}

export interface StackData extends CardHead {
  segments: StackSegment[]
}

export interface TableCell {
  text: string
  /** Valor para ordenar; null = sin dato */
  sort?: number | null
  note?: string
  pill?: PillTone
  /** 0–100, mini barra antes del texto */
  bar?: number
  href?: string
  tone?: 'pos' | 'neg'
}

export interface TableData {
  columns: { label: string; numeric?: boolean }[]
  rows: { cells: TableCell[]; highlight?: boolean }[]
}

export interface Report {
  version: 1
  meta: {
    eyebrow: string
    title: string[]
    description: string
    facts: { label: string; value: string }[]
  }
  index: SectionHead & {
    /** Texto con **negritas** */
    intro: string
    items: { id: string; title: string; description: string; tags: string[] }[]
  }
  summary: SectionHead & { kpis: Kpi[] }
  alerts: SectionHead & {
    items: { tone: AlertTone; tag: string; title: string; text: string }[]
  }
  evolution: SectionHead & {
    weekly: {
      legend: string[]
      points: { label: string; created: number; finished: number; partial?: boolean }[]
    }
    weeklyTable: TableData & { note?: string }
    daily: CardHead & { points: { label: string; value: number }[] }
    heatmap: CardHead & { days: string[]; hours: number[]; values: number[][] }
    weekday: BarChartData
  }
  types: SectionHead & {
    byType: BarChartData
    priority: StackData
    status: StackData
    creators: BarChartData
  }
  team: SectionHead & {
    byOwner: BarChartData
    punctuality: BarChartData
    table: TableData
  }
  clients: SectionHead & {
    byGroup: BarChartData
    topLocations: BarChartData
    groupTable: CardHead & TableData & { note?: string }
    equipment: CardHead & TableData & { note?: string }
  }
  quality: SectionHead & {
    kpis: Kpi[]
    arrival: BarChartData
    duration: BarChartData
    response: BarChartData
    distance: BarChartData
    evidence: BarChartData
  }
  openTasks: SectionHead & {
    searchPlaceholder: string
    table: TableData
  }
  footer: {
    title: string
    definitions: { term: string; text: string }[]
    note: string
  }
}

/** Fila de la tabla `reports` en Supabase (sin el JSON completo). */
export interface ReportSummary {
  id: string
  slug: string
  company: string
  period_start: string
  period_end: string
  created_at: string
}
