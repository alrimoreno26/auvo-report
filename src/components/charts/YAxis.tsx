interface Props {
  max: number
  step: number
  left: number
  right: number
  top: number
  bottom: number
}

/** Líneas de grilla horizontales con sus etiquetas a la izquierda. */
export function YAxis({ max, step, left, right, top, bottom }: Props) {
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step)
  return (
    <>
      {ticks.map((t) => {
        const y = bottom - (t / max) * (bottom - top)
        return (
          <g key={t}>
            <line x1={left} x2={right} y1={y} y2={y} className="grid" />
            <text x={left - 8} y={y + 4} textAnchor="end" className="axis">
              {t.toLocaleString('es')}
            </text>
          </g>
        )
      })}
    </>
  )
}
