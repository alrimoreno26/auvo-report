import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { reportExists, saveReport } from '../api/reports'
import { AppBar } from '../components/layout/AppBar'
import { FileDropzone } from '../components/upload/FileDropzone'
import { generateReport, inspectFile, type GeneratedReport } from '../generator'
import { ReportView } from '../report/ReportView'

const ACCEPT = '.xls,.xlsx,.html,.htm'
const date = (iso: string) => iso.split('-').reverse().join('/')

type FileInfo = { taskCount: number; period: string | null }

export function NewReportPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [info, setInfo] = useState<FileInfo | null>(null)
  const [empresa, setEmpresa] = useState('')
  const [codigo, setCodigo] = useState('')
  const [tolerancia, setTolerancia] = useState(15)

  const [busy, setBusy] = useState<'reading' | 'generating' | 'publishing' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GeneratedReport | null>(null)
  const [exists, setExists] = useState(false)

  async function onFile(f: File) {
    setFile(f)
    setInfo(null)
    setResult(null)
    setError(null)
    setBusy('reading')
    try {
      const { taskCount, filters } = await inspectFile(f)
      setInfo({ taskCount, period: filters.inicio && filters.fin ? `${filters.inicio} – ${filters.fin}` : null })
      if (!taskCount) setError('El archivo no contiene tareas.')
    } catch (err) {
      setFile(null)
      setError(err instanceof Error ? err.message : 'No se pudo leer el archivo.')
    } finally {
      setBusy(null)
    }
  }

  async function onGenerate(e: FormEvent) {
    e.preventDefault()
    if (!file) return
    setError(null)
    setBusy('generating')
    try {
      const r = await generateReport(file, { empresa, codigo, tolerancia })
      setResult(r)
      setExists(await reportExists(r.slug))
      requestAnimationFrame(() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el reporte.')
    } finally {
      setBusy(null)
    }
  }

  async function onPublish() {
    if (!result) return
    setError(null)
    setBusy('publishing')
    try {
      await saveReport({
        slug: result.slug,
        company: result.company,
        periodStart: result.periodStart,
        periodEnd: result.periodEnd,
        report: result.report,
      })
      navigate(`/reportes/${result.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar el reporte.')
      setBusy(null)
    }
  }

  const canGenerate = Boolean(file && info?.taskCount && empresa.trim()) && !busy

  return (
    <>
      <AppBar />
      <main className="wrap page">
        <Link to="/" className="back-link">
          ← Reportes
        </Link>
        <h2>Nuevo reporte</h2>
        <p className="lead">
          Suba el <b>Informe de Tareas</b> exportado de la plataforma. El archivo se procesa en su navegador; solo se guarda
          el reporte resultante.
        </p>

        <form className="upload-grid" onSubmit={onGenerate}>
          <div className="card upload-card">
            <h3>1. Archivo</h3>
            <p className="sub">El mismo Excel que usa el generador en Python.</p>
            <FileDropzone accept={ACCEPT} file={file} onFile={onFile} disabled={busy !== null} />
            {busy === 'reading' && <p className="muted upload-status">Leyendo archivo…</p>}
            {info && (
              <dl className="file-facts">
                <div>
                  <dt>Tareas</dt>
                  <dd>{info.taskCount.toLocaleString('es')}</dd>
                </div>
                <div>
                  <dt>Período</dt>
                  <dd>{info.period ?? 'Se toma de las fechas de las tareas'}</dd>
                </div>
              </dl>
            )}
          </div>

          <div className="card upload-card">
            <h3>2. Datos del reporte</h3>
            <p className="sub">Aparecen en el encabezado del reporte.</p>
            <div className="upload-fields">
              <div className="field">
                <label htmlFor="nr-empresa">Empresa</label>
                <input
                  id="nr-empresa"
                  required
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Asesoría Técnica Global"
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="nr-codigo">
                    Código de cuenta <span className="optional">(opcional)</span>
                  </label>
                  <input id="nr-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="91926" />
                </div>
                <div className="field">
                  <label htmlFor="nr-tol">Tolerancia de puntualidad</label>
                  <div className="input-suffix">
                    <input
                      id="nr-tol"
                      type="number"
                      min={0}
                      max={240}
                      value={tolerancia}
                      onChange={(e) => setTolerancia(Math.max(0, Number(e.target.value) || 0))}
                    />
                    <span>min</span>
                  </div>
                </div>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={!canGenerate}>
              {busy === 'generating' ? 'Generando…' : result ? 'Volver a generar' : 'Generar vista previa'}
            </button>
          </div>
        </form>

        {error && (
          <p className="login-error upload-error" role="alert">
            {error}
          </p>
        )}
      </main>

      {result && (
        <div id="preview" className="preview">
          <ReportView report={result.report} />
          <div className="preview-bar">
            <div className="wrap">
              <div className="preview-info">
                <span className="preview-tag">Vista previa</span>
                <b>{result.company}</b>
                <span className="muted">
                  {date(result.periodStart)} – {date(result.periodEnd)} · {result.taskCount.toLocaleString('es')} tareas
                </span>
              </div>
              {exists && <span className="preview-warn">Ya existe un reporte de esta empresa y período: se reemplazará.</span>}
              <div className="preview-actions">
                <button type="button" className="btn-secondary" onClick={() => setResult(null)} disabled={busy !== null}>
                  Descartar
                </button>
                <button type="button" className="btn-primary" onClick={onPublish} disabled={busy !== null}>
                  {busy === 'publishing' ? 'Publicando…' : exists ? 'Reemplazar reporte' : 'Publicar reporte'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
