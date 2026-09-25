import { fmt, niceMax } from './scale'
import { YAxis } from './YAxis'

const W = 900
const L = 40
const R = 884
const TOP = 14
const BASE = 190

interface Props {
  points: { label: string; value: number }[]
  /** Cada cuántos puntos se muestra una etiqueta en el eje X (por defecto ~12 etiquetas) */
  labelEvery?: number
  unit?: string
}

/** Serie temporal con área rellena (volumen diario). */
export function AreaChart({ points, labelEvery, unit = 'tareas' }: Props) {
  if (!points.length) return <p className="empty">Sin datos</p>
  const every = labelEvery ?? Math.max(1, Math.floor(points.length / 12))
  const max = niceMax(Math.max(...points.map((p) => p.value)))
  const dx = (R - L) / Math.max(points.length - 1, 1)
  const x = (i: number) => L + i * dx
  const y = (v: number) => BASE - (v / max) * (BASE - TOP)
  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} 220`} className="chart" role="img">
      <YAxis max={max} left={L} right={R} top={TOP} bottom={BASE} />
      <polygon points={`${L},${BASE} ${line} ${R},${BASE}`} fill="#7C3AED" opacity={0.1} />
      <polyline fill="none" stroke="#7C3AED" strokeWidth={2} strokeLinejoin="round" points={line} />
      {points.map((p, i) =>
        i % every === 0 ? (
          <text key={p.label} x={x(i)} y={212} textAnchor="middle" className="axis">
            {p.label}
          </text>
        ) : null,
      )}
      {points.map((p, i) => (
        <g key={p.label} className="hit dot-hit" data-tip={`${p.label}: ${fmt(p.value)} ${unit}`}>
          <rect x={x(i) - dx / 2} y={TOP} width={dx} height={BASE - TOP} fill="transparent" />
          <circle cx={x(i)} cy={y(p.value)} r={3.5} fill="#7C3AED" stroke="#fff" strokeWidth={1.5} className="dot" />
        </g>
      ))}
    </svg>
  )
}
