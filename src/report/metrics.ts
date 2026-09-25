// Indicadores numéricos que se guardan con cada reporte y se comparan entre períodos.
// Sin dependencias: lo usan la app, el generador y scripts/extract-report.mjs.

export type MetricKey =
  | 'n'
  | 'finN'
  | 'tasaFin'
  | 'pendN'
  | 'tecnicos'
  | 'ciRate'
  | 'puntual'
  | 'durMed'
  | 'respMed'
  | 'coRate'
  | 'gpsRate'
  | 'sinGeoRate'
  | 'firmaRate'
  | 'pendientesDoc'

export type Metrics = Partial<Record<MetricKey, number>>

export interface MetricDef {
  /** Nombre para la vista de evolución */
  label: string
  /** count: variación relativa (%) · pct (0–1): puntos porcentuales · minutes/hours: diferencia absoluta */
  format: 'count' | 'pct' | 'minutes' | 'hours'
  /** Qué dirección es una mejora (none = solo informativo) */
  better: 'up' | 'down' | 'none'
  /** Texto que acompaña la variación cuando el KPI muestra otro valor (p. ej. la tasa de una cantidad) */
  suffix?: string
}

export const METRICS: Record<MetricKey, MetricDef> = {
  n: { label: 'Tareas creadas', format: 'count', better: 'none' },
  finN: { label: 'Tareas finalizadas', format: 'count', better: 'none' },
  tasaFin: { label: 'Tasa de finalización', format: 'pct', better: 'up', suffix: 'en la tasa' },
  pendN: { label: 'Tareas abiertas', format: 'count', better: 'down' },
  tecnicos: { label: 'Responsables activos', format: 'count', better: 'none' },
  ciRate: { label: 'Check-in registrado', format: 'pct', better: 'up' },
  puntual: { label: 'Puntualidad', format: 'pct', better: 'up' },
  durMed: { label: 'Duración mediana', format: 'minutes', better: 'none' },
  respMed: { label: 'Tiempo de respuesta', format: 'hours', better: 'down' },
  coRate: { label: 'Check-out registrado', format: 'pct', better: 'up' },
  gpsRate: { label: 'Check-in con GPS', format: 'pct', better: 'up' },
  sinGeoRate: { label: 'Clientes sin coordenadas', format: 'pct', better: 'down' },
  firmaRate: { label: 'Firma del cliente', format: 'pct', better: 'up' },
  pendientesDoc: { label: 'Pendientes de evidencia', format: 'count', better: 'down' },
}

/** Qué indicador compara cada tarjeta KPI (por su etiqueta) */
export const KPI_METRIC: Record<string, MetricKey> = {
  'Tareas creadas': 'n',
  'Tareas finalizadas': 'tasaFin',
  'Tareas abiertas': 'pendN',
  'Responsables activos': 'tecnicos',
  'Check-in registrado': 'ciRate',
  Puntualidad: 'puntual',
  'Duración mediana': 'durMed',
  'Tiempo de respuesta': 'respMed',
  'Check-out registrado': 'coRate',
  'Check-in con GPS': 'gpsRate',
  'Clientes sin coordenadas': 'sinGeoRate',
  'Firma del cliente': 'firmaRate',
  'Pendientes de evidencia': 'pendientesDoc',
}

/** "Asesoría Técnica Global" → "asesoria-tecnica-global" (igual que la migración 0003) */
export function companyKey(company: string) {
  return company
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}
