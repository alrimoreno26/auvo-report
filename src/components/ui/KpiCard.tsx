import { kpiDelta } from '../../report/compare'
import { useComparison } from '../../report/comparisonContext'
import type { Kpi } from '../../types/report'

export function KpiCard(kpi: Kpi) {
  const { label, value, note, progress } = kpi
  const { metrics, comparison } = useComparison()
  const delta = kpiDelta(kpi, metrics, comparison)

  return (
    <div className="card kpi">
      <span>{label}</span>
      <b>{value}</b>
      {note && <small>{note}</small>}
      {delta && (
        <div className={`delta ${delta.tone}`} title={`Comparado con ${comparison!.period}`}>
          <span aria-hidden>{delta.arrow}</span> {delta.text}
          {delta.suffix && <em> {delta.suffix}</em>}
        </div>
      )}
      {progress !== undefined && (
        <div className="bar">
          <i style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  )
}
