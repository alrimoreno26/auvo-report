import type { Bar } from '../../types/report'
import { TONE_COLOR } from './scale'

const BASE = 200
const TOP = 26

/** Columnas verticales (distribuciones e histogramas). */
export function ColumnChart({ bars, width = 520 }: { bars: Bar[]; width?: number }) {
  if (!bars.length) return <p className="empty">Sin datos</p>
  const slot = (width - 24) / bars.length
  const bw = Math.min(54, slot * 0.6)
  const max = Math.max(...bars.map((b) => b.value), 1)

  return (
    <svg viewBox={`0 0 ${width} 240`} className="chart" role="img">
      <line x1={12} x2={width - 12} y1={BASE} y2={BASE} className="grid" />
      {bars.map((b, i) => {
        const x = 12 + i * slot
        const cx = x + slot / 2
        const h = Math.max((b.value / max) * (BASE - TOP), 2)
        return (
          <g key={b.label} className="hit" data-tip={b.tip ?? `${b.label}: ${b.display}`}>
            <rect x={x} y={TOP} width={slot} height={BASE - TOP} fill="transparent" />
            <rect x={cx - bw / 2} y={BASE - h} width={bw} height={h} rx={4} fill={TONE_COLOR[b.tone]} />
            <text x={cx} y={BASE - h - 7} textAnchor="middle" className="val">
              {b.display}
            </text>
            <text x={cx} y={218} textAnchor="middle" className="axis">
              {b.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
