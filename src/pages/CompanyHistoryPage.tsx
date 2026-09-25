import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getCompanyHistory, type HistoryPoint } from '../api/reports'
import { AppBar } from '../components/layout/AppBar'
import { Sparkline } from '../components/charts/Sparkline'
import { formatMetric, metricDelta } from '../report/compare'
import { METRICS, type MetricKey } from '../report/metrics'

const GROUPS: { title: string; keys: MetricKey[] }[] = [
  { title: 'Volumen', keys: ['n', 'finN', 'pendN', 'tecnicos'] },
  { title: 'Ejecución', keys: ['tasaFin', 'puntual', 'durMed', 'respMed'] },
  { title: 'Calidad en campo', keys: ['ciRate', 'coRate', 'gpsRate', 'sinGeoRate', 'firmaRate', 'pendientesDoc'] },
]

/** Indicadores destacados arriba de la tabla */
const HIGHLIGHTS: MetricKey[] = ['tasaFin', 'puntual', 'ciRate', 'respMed']

const date = (iso: string) => iso.split('-').reverse().join('/')
/** "01/04 – 30/06/26" */
const shortPeriod = (p: HistoryPoint) => {
  const [y1, m1, d1] = p.period_start.split('-')
  const [y2, m2, d2] = p.period_end.split('-')
  return `${d1}/${m1}${y1 !== y2 ? `/${y1.slice(2)}` : ''} – ${d2}/${m2}/${y2.slice(2)}`
}

type State = { status: 'loading' } | { status: 'error' } | { status: 'ok'; points: HistoryPoint[] }

export function CompanyHistoryPage() {
  const { key } = useParams()
  const [result, setResult] = useState<{ key: string; state: State } | null>(null)
  const state: State = result && result.key === key ? result.state : { status: 'loading' }

  useEffect(() => {
    let cancelled = false
    getCompanyHistory(key!)
      .then((points) => !cancelled && setResult({ key: key!, state: { status: 'ok', points } }))
      .catch(() => !cancelled && setResult({ key: key!, state: { status: 'error' } }))
    return () => {
      cancelled = true
    }
  }, [key])

  const points = state.status === 'ok' ? state.points : []
  const company = points.at(-1)?.company
  const withMetrics = points.filter((p) => p.metrics)
  const missing = points.filter((p) => !p.metrics)
  const values = (k: MetricKey) => withMetrics.map((p) => p.metrics![k])

  return (
    <>
      <AppBar crumb={company ? `${company} · Evolución` : undefined} />
      <main className="wrap page history">
        <Link to="/" className="back-link">
          ← Reportes
        </Link>

        {state.status === 'loading' && <p className="muted">Cargando evolución…</p>}
        {state.status === 'error' && <p className="login-error">No se pudo cargar la evolución.</p>}
        {state.status === 'ok' && points.length === 0 && <p>No hay reportes de esta empresa.</p>}

        {state.status === 'ok' && points.length > 0 && (
          <>
            <h2>Evolución · {company}</h2>
            <p className="lead">
              {points.length} {points.length === 1 ? 'período' : 'períodos'} publicados, del {date(points[0].period_start)} al{' '}
              {date(points.at(-1)!.period_end)}. Cada variación compara con el período anterior.
            </p>

            {missing.length > 0 && (
              <div className="notice warn" role="status">
                <div>
                  {missing.length === 1 ? 'Este período se publicó' : 'Estos períodos se publicaron'} antes de que existiera el
                  historial y no {missing.length === 1 ? 'tiene' : 'tienen'} indicadores guardados:{' '}
                  {missing.map((p, i) => (
                    <span key={p.slug}>
                      {i > 0 && ', '}
                      <Link to={`/reportes/${p.slug}`}>{shortPeriod(p)}</Link>
                    </span>
                  ))}
                  . Para {missing.length === 1 ? 'incluirlo' : 'incluirlos'}, vuelva a publicar su Excel desde <b>Nuevo reporte</b> con
                  el mismo nombre de empresa.
                </div>
              </div>
            )}

            {withMetrics.length < 2 ? (
              <div className="card history-empty">
                <b>Todavía no hay evolución para mostrar</b>
                <p className="muted">
                  Se necesitan al menos dos períodos con indicadores. Cuando publique el próximo reporte de {company}, acá verá cómo
                  cambió cada indicador.
                </p>
              </div>
            ) : (
              <>
                <div className="history-highlights">
                  {HIGHLIGHTS.map((k) => {
                    const v = values(k)
                    const last = v.at(-1)
                    const delta = metricDelta(k, last, v.at(-2))
                    return (
                      <div key={k} className="card kpi">
                        <span>{METRICS[k].label}</span>
                        <b>{formatMetric(k, last)}</b>
                        {delta && (
                          <div className={`delta ${delta.tone}`}>
                            <span aria-hidden>{delta.arrow}</span> {delta.text}
                            {delta.arrow !== '=' && <em> vs. período anterior</em>}
                          </div>
                        )}
                        <Sparkline values={v} width={220} height={40} tone={delta?.tone} />
                      </div>
                    )
                  })}
                </div>

                <div className="card tbl">
                  <div className="table-scroll">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Indicador</th>
                          {withMetrics.map((p) => (
                            <th key={p.slug} className="num">
                              <Link to={`/reportes/${p.slug}`} title="Abrir el reporte de este período">
                                {shortPeriod(p)}
                              </Link>
                            </th>
                          ))}
                          <th className="num">Tendencia</th>
                        </tr>
                      </thead>
                      {GROUPS.map((g) => (
                        <tbody key={g.title}>
                          <tr className="history-group">
                            <td colSpan={withMetrics.length + 2}>{g.title}</td>
                          </tr>
                          {g.keys.map((k) => {
                            const v = values(k)
                            const lastDelta = metricDelta(k, v.at(-1), v.at(-2))
                            return (
                              <tr key={k}>
                                <td>{METRICS[k].label}</td>
                                {v.map((value, i) => {
                                  const d = i > 0 ? metricDelta(k, value, v[i - 1]) : null
                                  return (
                                    <td key={i} className="num">
                                      <div className="history-value">{formatMetric(k, value)}</div>
                                      {d && d.arrow !== '=' && (
                                        <div className={`history-delta ${d.tone}`}>
                                          {d.arrow} {d.text}
                                        </div>
                                      )}
                                    </td>
                                  )
                                })}
                                <td className="num">
                                  <Sparkline values={v} tone={lastDelta?.tone} />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      ))}
                    </table>
                  </div>
                </div>
                <p className="sub history-legend">
                  <span className="good">▲▼ verde: mejora</span> · <span className="bad">rojo: empeora</span> ·{' '}
                  <span className="neutral">gris: informativo</span>. Haga clic en un período para abrir su reporte.
                </p>
              </>
            )}
          </>
        )}
      </main>
    </>
  )
}
