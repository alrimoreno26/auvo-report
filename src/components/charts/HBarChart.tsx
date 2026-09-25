import type { Bar } from '../../types/report'
import { TONE_COLOR } from './scale'

interface Props {
  bars: Bar[]
  width?: number
  /** Ancho reservado para las etiquetas a la izquierda */
  labelWidth?: number
  rowHeight?: number
  barHeight?: number
}

/** Barras horizontales etiquetadas (ranking). */
export function HBarChart({ bars, width = 520, labelWidth = 140, rowHeight = 26, barHeight = 12 }: Props) {
  const x0 = labelWidth + 10
  const maxBar = width - x0 - 70
  const max = Math.max(...bars.map((b) => b.value), 1)

  return (
    <svg viewBox={`0 0 ${width} ${bars.length * rowHeight + 6}`} className="chart" role="img">
      {bars.map((b, i) => {
        const y = 2 + i * rowHeight
        const w = (b.value / max) * maxBar
        const mid = y + rowHeight / 2 + 4
        return (
          <g key={b.label} className="hit" data-tip={b.tip ?? `${b.label}: ${b.display}`}>
            <rect x={0} y={y} width={width} height={rowHeight} fill="transparent" />
            <text x={labelWidth} y={mid} textAnchor="end" className="lbl">
              {b.label}
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
