import { fmt, niceScale } from './scale'
import { YAxis } from './YAxis'

interface Point {
  label: string
  created: number
  finished: number
  partial?: boolean
}

const W = 900
const L = 40
const R = 884
const TOP = 16
const BASE = 256

/** Barras de tareas creadas + línea de finalizadas, por semana. */
export function WeeklyChart({ points, legend }: { points: Point[]; legend: string[] }) {
  const { max, step } = niceScale(Math.max(...points.map((p) => Math.max(p.created, p.finished))))
  const slot = (R - L) / points.length
  const y = (v: number) => BASE - (v / max) * (BASE - TOP)
  const cx = (i: number) => L + slot * (i + 0.5)

  return (
    <>
      <div className="legend-inline">
        <span>
          <i style={{ background: '#DDD6FE' }} />
          {legend[0]}
        </span>
        <span>
          <i style={{ background: '#7C3AED' }} />
          {legend[1]}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} 300`} className="chart" role="img">
        <YAxis max={max} step={step} left={L} right={R} top={TOP} bottom={BASE} />
        {points.map((p, i) => (
          <g key={p.label}>
            <rect
              x={cx(i) - slot * 0.31}
              y={y(p.created)}
              width={slot * 0.62}
              height={BASE - y(p.created)}
              rx={4}
              fill="#DDD6FE"
              {...(p.partial && { stroke: '#A78BFA', strokeDasharray: '4 3' })}
            />
            <text x={cx(i)} y={274} textAnchor="middle" className="axis">
              {p.label}
            </text>
            {p.partial && (
              <text x={cx(i)} y={288} textAnchor="middle" className="axis small">
                (parcial)
              </text>
            )}
          </g>
        ))}
        <polyline
          fill="none"
          stroke="#7C3AED"
          strokeWidth={2.2}
          strokeLinejoin="round"
          points={points.map((p, i) => `${cx(i)},${y(p.finished)}`).join(' ')}
        />
        {points.map((p, i) => (
          <circle key={p.label} cx={cx(i)} cy={y(p.finished)} r={4.5} fill="#7C3AED" stroke="#fff" strokeWidth={2} />
        ))}
        {points.map((p, i) => (
          <rect
            key={p.label}
            className="hit"
            data-tip={`${p.label} · Creadas: ${fmt(p.created)} · Finalizadas: ${fmt(p.finished)}`}
            x={L + slot * i}
            y={TOP}
            width={slot}
            height={BASE - TOP}
            fill="transparent"
          />
        ))}
      </svg>
    </>
  )
}
