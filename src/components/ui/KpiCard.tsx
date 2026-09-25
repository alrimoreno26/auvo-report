import type { Kpi } from '../../types/report'

export function KpiCard({ label, value, note, progress }: Kpi) {
  return (
    <div className="card kpi">
      <span>{label}</span>
      <b>{value}</b>
      {note && <small>{note}</small>}
      {progress !== undefined && (
        <div className="bar">
          <i style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  )
}
