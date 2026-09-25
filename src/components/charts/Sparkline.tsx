interface Props {
  /** Un valor por período (undefined = sin dato en ese período) */
  values: (number | undefined)[]
  width?: number
  height?: number
  /** Color del último punto (según si el último cambio fue mejora o no) */
  tone?: 'good' | 'bad' | 'neutral'
}

const TONE = { good: '#15803D', bad: '#B91C1C', neutral: '#7C3AED' }

/** Minigráfico de tendencia; los períodos sin dato cortan la línea. */
export function Sparkline({ values, width = 96, height = 28, tone = 'neutral' }: Props) {
  const defined = values.filter((v): v is number => v !== undefined)
  if (defined.length < 2) return <span className="muted">—</span>
  const min = Math.min(...defined)
  const max = Math.max(...defined)
  const pad = 3
  const x = (i: number) => pad + (i * (width - pad * 2)) / Math.max(values.length - 1, 1)
  const y = (v: number) => (max === min ? height / 2 : pad + ((max - v) * (height - pad * 2)) / (max - min))

  // Tramos continuos (un período sin dato corta la línea)
  const segments: string[] = []
  let current: string[] = []
  values.forEach((v, i) => {
    if (v === undefined) {
      if (current.length > 1) segments.push(current.join(' '))
      current = []
    } else current.push(`${x(i)},${y(v)}`)
  })
  if (current.length > 1) segments.push(current.join(' '))

  const lastIndex = values.map((v, i) => (v === undefined ? -1 : i)).filter((i) => i >= 0).pop()!
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="sparkline" aria-hidden>
      {segments.map((pts, i) => (
        <polyline key={i} points={pts} fill="none" stroke="#C4B5FD" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {values.map((v, i) =>
        v === undefined ? null : (
          <circle key={i} cx={x(i)} cy={y(v)} r={i === lastIndex ? 3 : 1.8} fill={i === lastIndex ? TONE[tone] : '#A78BFA'} />
        ),
      )}
    </svg>
  )
}
