import { createContext, useContext } from 'react'
import type { Metrics } from './metrics'
import type { Comparison } from './compare'

/** Indicadores del reporte actual y del período anterior (si existe), para las variaciones de los KPI. */
export interface ComparisonState {
  metrics?: Metrics
  comparison?: Comparison | null
}

export const ComparisonContext = createContext<ComparisonState>({})
export const useComparison = () => useContext(ComparisonContext)
