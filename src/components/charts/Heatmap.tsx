import { fmt } from './scale'

interface Props {
  days: string[]
  hours: number[]
  /** values[día][hora] */
  values: number[][]
}

const PALETTE = ['#E1D5FB', '#C9B3F6', '#AE8BF0', '#9263E8', '#7B39EC', '#6528D0', '#4E1E9A']
const X0 = 45
const Y0 = 23
const CW = 37.2
const CH = 26
const GAP = 2

/** Mapa de calor día × hora. */
export function Heatmap({ days, hours, values }: Props) {
  const max = Math.max(...values.flat(), 1)
  const width = X0 + hours.length * (CW + GAP) + 4
  const height = Y0 + days.length * (CH + GAP) + 7

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart" role="img">
      {hours.map((h, j) => (
        <text key={h} x={X0 + j * (CW + GAP) + CW / 2} y={15} textAnchor="middle" className="axis">
          {h}h
        </text>
      ))}
      {days.map((d, i) => {
        const y = Y0 + i * (CH + GAP)
        return (
          <g key={d}>
            <text x={36} y={y + 17} textAnchor="end" className="axis">
              {d}
            </text>
            {hours.map((h, j) => {
              const v = values[i][j]
              const t = v / max
              // Misma rampa que el generador: SEQ[1 + int(6·v/max)], sin usar el tono más claro
              const level = v === 0 ? -1 : Math.min(PALETTE.length - 1, Math.floor((PALETTE.length - 1) * t))
              const x = X0 + j * (CW + GAP)
              return (
                <g key={h}>
                  <rect
                    className="hit"
                    data-tip={`${d} ${h}:00 · ${fmt(v)} tareas`}
                    x={x}
                    y={y}
                    width={CW}
                    height={CH}
                    rx={4}
                    fill={level < 0 ? '#FAF8FE' : PALETTE[level]}
                  />
                  {t >= 0.35 && (
                    <text
                      x={x + CW / 2}
                      y={y + 17}
                      textAnchor="middle"
                      className="cell"
                      fill={level >= 3 ? '#fff' : '#221D2E'}
                      pointerEvents="none"
                    >
                      {v}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}
