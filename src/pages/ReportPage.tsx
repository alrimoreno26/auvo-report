import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getPreviousComparison, getReport } from '../api/reports'
import { AppBar } from '../components/layout/AppBar'
import { ReportView } from '../report/ReportView'
import type { Comparison } from '../report/compare'
import { companyKey } from '../report/metrics'
import type { Report } from '../types/report'

const company = (r: Report) => r.meta.title.slice(1).join(' ') || r.meta.title.join(' ')

type State =
  | { status: 'loading' }
  | { status: 'error' | 'missing' }
  | { status: 'ok'; report: Report; comparison: Comparison | null }

export function ReportPage() {
  const { slug } = useParams()
  // El resultado se guarda junto al slug que lo pidió: si cambia el slug, vuelve a "loading"
  const [result, setResult] = useState<{ slug: string; state: State } | null>(null)
  const state: State = result && result.slug === slug ? result.state : { status: 'loading' }
  const title = state.status === 'ok' ? state.report.meta.title.join(' · ') : null

  useEffect(() => {
    let cancelled = false
    const done = (s: State) => !cancelled && setResult({ slug: slug!, state: s })
    getReport(slug!)
      .then(async (loaded) => {
        if (!loaded) return done({ status: 'missing' })
        const { report, summary } = loaded
        // La comparación es opcional: si falla, el reporte se muestra igual
        const key = summary.company_key ?? companyKey(summary.company)
        const previous = await getPreviousComparison(key, summary.period_start, summary.slug).catch(() => null)
        const comparison = previous && { ...previous, historyUrl: `/empresas/${key}` }
        done({ status: 'ok', report, comparison })
      })
      .catch(() => done({ status: 'error' }))
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    if (title) document.title = title
    return () => {
      document.title = 'Auvo Report'
    }
  }, [title])

  return (
    <>
      <AppBar crumb={state.status === 'ok' ? company(state.report) : undefined} />
      {state.status === 'ok' ? (
        <ReportView report={state.report} comparison={state.comparison} backTo="/" />
      ) : (
        <main className="wrap page">
          {state.status === 'loading' && <p className="muted">Cargando reporte…</p>}
          {state.status === 'missing' && <p>No se encontró el reporte.</p>}
          {state.status === 'error' && <p className="login-error">No se pudo cargar el reporte.</p>}
          {state.status !== 'loading' && <Link to="/">← Volver a los reportes</Link>}
        </main>
      )}
    </>
  )
}
