import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getReport } from '../api/reports'
import { AppBar } from '../components/layout/AppBar'
import { ReportView } from '../report/ReportView'
import type { Report } from '../types/report'

type State = { status: 'loading' } | { status: 'error' | 'missing' } | { status: 'ok'; report: Report }

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
      .then((report) => done(report ? { status: 'ok', report } : { status: 'missing' }))
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
      <AppBar />
      {state.status === 'ok' ? (
        <ReportView report={state.report} />
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
