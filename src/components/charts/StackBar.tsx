import type { StackSegment } from '../../types/report'
import { fmt } from './scale'

/** Barra apilada 100% con leyenda. */
export function StackBar({ segments }: { segments: StackSegment[] }) {
  return (
    <>
      <div className="stack">
        {segments.map((s) => (
          <span
            key={s.label}
            className="seg hit"
            data-tip={`${s.label}: ${fmt(s.value)} (${Math.round(s.share)}%)`}
            style={{ width: `${s.share}%`, background: s.color }}
          />
        ))}
      </div>
      <div className="legend">
        {segments.map((s) => (
          <span key={s.label}>
            <i style={{ background: s.color }} />
            {s.label} <b>{fmt(s.value)}</b> <em>{Math.round(s.share)}%</em>
          </span>
        ))}
      </div>
    </>
  )
}
