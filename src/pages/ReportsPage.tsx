import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { listReports } from '../api/reports'
import { useAuth } from '../auth/context'
import { AppBar } from '../components/layout/AppBar'
import { companyKey } from '../report/metrics'
import type { ReportSummary } from '../types/report'

const date = (iso: string) => iso.split('-').reverse().join('/')

interface CompanyGroup {
  key: string
  /** Nombre tal como figura en el período más reciente */
  company: string
  /** Del más reciente al más antiguo */
  reports: ReportSummary[]
}

/** Agrupa los reportes por empresa (misma clave aunque el nombre varíe en mayúsculas o acentos). */
function groupByCompany(reports: ReportSummary[]): CompanyGroup[] {
  const groups = new Map<string, ReportSummary[]>()
  for (const r of reports) {
    const key = r.company_key ?? companyKey(r.company)
    groups.set(key, [...(groups.get(key) ?? []), r])
  }
  return [...groups.entries()]
    .map(([key, list]) => {
      const sorted = [...list].sort((a, b) => b.period_start.localeCompare(a.period_start))
      return { key, company: sorted[0].company, reports: sorted }
    })
    .sort((a, b) => a.company.localeCompare(b.company, 'es'))
}

export function ReportsPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState<ReportSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listReports()
      .then(setReports)
      .catch(() => setError('No se pudieron cargar los reportes.'))
  }, [])

  const groups = useMemo(() => groupByCompany(reports ?? []), [reports])

  return (
    <>
      <AppBar />
      <main className="wrap page">
        <div className="page-head">
          <div>
            <h2>Reportes</h2>
            <p className="lead">
              Seleccione un período para ver el reporte, o la evolución de la empresa para comparar todos sus períodos.
            </p>
          </div>
          {user?.isAdmin && (
            <Link to="/reportes/nuevo" className="btn-primary">
              + Nuevo reporte
            </Link>
          )}
        </div>
        {error && <p className="login-error">{error}</p>}
        {!reports && !error && <p className="muted">Cargando…</p>}
        {reports?.length === 0 && <p className="muted">Todavía no hay reportes cargados.</p>}
        <div className="company-list">
          {groups.map((g) => (
            <div key={g.key} className="company-card">
              <div className="company-head">
                <h4>{g.company}</h4>
                <span className="muted">
                  {g.reports.length} {g.reports.length === 1 ? 'período' : 'períodos'}
                </span>
              </div>
              <ul className="company-periods">
                {g.reports.map((r, i) => (
                  <li key={r.id}>
                    <Link to={`/reportes/${r.slug}`}>
                      <span>
                        {date(r.period_start)} – {date(r.period_end)}
                      </span>
                      {i === 0 && <span className="latest">Último</span>}
                      <span className="chev" aria-hidden>
                        ›
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to={`/empresas/${g.key}`} className="company-history">
                Ver evolución <span aria-hidden>→</span>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
