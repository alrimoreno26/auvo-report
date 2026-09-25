import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { listReports } from '../api/reports'
import { AppBar } from '../components/layout/AppBar'
import type { ReportSummary } from '../types/report'

const date = (iso: string) => iso.split('-').reverse().join('/')

export function ReportsPage() {
  const [reports, setReports] = useState<ReportSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listReports()
      .then(setReports)
      .catch(() => setError('No se pudieron cargar los reportes.'))
  }, [])

  return (
    <>
      <AppBar />
      <main className="wrap page">
        <h2>Reportes</h2>
        <p className="lead">Seleccione un reporte para ver el detalle.</p>
        {error && <p className="login-error">{error}</p>}
        {!reports && !error && <p className="muted">Cargando…</p>}
        {reports?.length === 0 && <p className="muted">Todavía no hay reportes cargados.</p>}
        <div className="report-list">
          {reports?.map((r) => (
            <Link key={r.id} to={`/reportes/${r.slug}`} className="report-item">
              <h4>{r.company}</h4>
              <p>
                {date(r.period_start)} – {date(r.period_end)}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}
