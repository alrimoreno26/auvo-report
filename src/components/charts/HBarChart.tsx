import type { Bar } from '../../types/report'
import { TONE_COLOR } from './scale'
import { fitText, labelColumnWidth } from './textFit'

interface Props {
  bars: Bar[]
  width?: number
  /** Ancho mínimo reservado para las etiquetas; crece según los nombres (hasta el 42% del gráfico) */
  labelWidth?: number
  rowHeight?: number
  barHeight?: number
  /** Texto cuando no hay datos */
  emptyText?: string
}

const LABEL_FONT = 12

/** Barras horizontales etiquetadas (ranking). */
export function HBarChart({ bars, width = 520, labelWidth = 140, rowHeight = 26, barHeight = 12, emptyText = 'Sin datos' }: Props) {
  if (!bars.length) return <p className="empty">{emptyText}</p>
  // Nombres largos (p. ej. responsables en mayúsculas): la columna se ensancha y, si aun así no entran,
  // se recortan con "…" (el nombre completo queda en el tooltip)
  const lw = labelColumnWidth(
    bars.map((b) => b.label),
    LABEL_FONT,
    Math.min(labelWidth, 90),
    Math.max(labelWidth, width * 0.42),
  )
  const x0 = lw + 10
  const maxBar = width - x0 - 70
  const max = Math.max(...bars.map((b) => b.value), 1)

  return (
    <svg viewBox={`0 0 ${width} ${bars.length * rowHeight + 6}`} className="chart" role="img">
      {bars.map((b, i) => {
        const y = 2 + i * rowHeight
        const w = Math.max(2, (b.value / max) * maxBar)
        const mid = y + rowHeight / 2 + 4
        return (
          <g key={`${i}-${b.label}`} className="hit" data-tip={b.tip ?? `${b.label}: ${b.display}`}>
            <rect x={0} y={y} width={width} height={rowHeight} fill="transparent" />
            <text x={lw} y={mid} textAnchor="end" className="lbl">
              {fitText(b.label, lw, LABEL_FONT)}
            </text>
            <rect x={x0} y={y + (rowHeight - barHeight) / 2 + 1} width={w} height={barHeight} rx={4} fill={TONE_COLOR[b.tone]} />
            <text x={x0 + w + 8} y={mid} className="val">
              {b.display}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
