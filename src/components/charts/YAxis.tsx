import { fnum } from '../../generator/format'

interface Props {
  max: number
  left: number
  right: number
  top: number
  bottom: number
}

/** 5 líneas de grilla (0, ¼, ½, ¾ y el máximo) con sus etiquetas a la izquierda. */
export function YAxis({ max, left, right, top, bottom }: Props) {
  const ticks = [0, 1, 2, 3, 4].map((k) => (max * k) / 4)
  return (
    <>
      {ticks.map((t) => {
        const y = bottom - (t / max) * (bottom - top)
        return (
          <g key={t}>
            <line x1={left} x2={right} y1={y} y2={y} className="grid" />
            <text x={left - 8} y={y + 4} textAnchor="end" className="axis">
              {fnum(t)}
            </text>
          </g>
        )
      })}
    </>
  )
}
