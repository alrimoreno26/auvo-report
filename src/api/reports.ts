import type { Task } from '../generator/prepare'
import { isLocalMode, supabase } from '../lib/supabase'
import type { Comparison } from '../report/compare'
import { companyKey, type Metrics } from '../report/metrics'
import type { Report, ReportSummary } from '../types/report'

// Solo se evalúa en desarrollo; en el build la rama desaparece junto con los JSON.
const localFiles = import.meta.env.DEV
  ? import.meta.glob<{ default: Report }>('/data/*.json')
  : {}

// Modo local: reportes publicados desde "Nuevo reporte" (en memoria, se pierden al recargar)
const localPublished = new Map<string, { summary: ReportSummary; report: Report }>()

const slugOf = (path: string) =>
  path.split('/').pop()!.replace(/\.json$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')

const isoDate = (d: string) => d.split('/').reverse().join('-')
const date = (iso: string) => iso.split('-').reverse().join('/')
const fact = (r: Report, label: string) => r.meta.facts.find((f) => f.label === label)?.value ?? ''

async function localReports() {
  const files = await Promise.all(
    Object.entries(localFiles).map(async ([path, load]) => {
      const slug = slugOf(path)
      const report = (await load()).default
      const [start, end] = fact(report, 'Período analizado').split('–').map((s) => isoDate(s.trim()))
      // "91926 — Empresa" → "Empresa"
      const company = fact(report, 'Empresa').replace(/^.*? — /, '')
      const summary: ReportSummary = {
        id: slug,
        slug,
        company,
        company_key: companyKey(company),
        period_start: start,
        period_end: end,
        created_at: '',
      }
      return { summary, report }
    }),
  )
  const bySlug = new Map(files.map((f) => [f.summary.slug, f]))
  for (const [slug, entry] of localPublished) bySlug.set(slug, entry)
  return [...bySlug.values()]
}

export async function listReports(): Promise<ReportSummary[]> {
  if (isLocalMode) {
    return (await localReports()).map((r) => r.summary).sort((a, b) => b.period_end.localeCompare(a.period_end))
  }
  const { data, error } = await supabase!
    .from('reports')
    .select('id, slug, company, company_key, period_start, period_end, created_at')
    .order('period_end', { ascending: false })
  if (error) throw error
  return data
}

export interface LoadedReport {
  report: Report
  summary: ReportSummary
}

export async function getReport(slug: string): Promise<LoadedReport | null> {
  if (isLocalMode) {
    return (await localReports()).find((r) => r.summary.slug === slug) ?? null
  }
  const { data, error } = await supabase!
    .from('reports')
    .select('id, slug, company, company_key, period_start, period_end, created_at, data')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const { data: report, ...summary } = data
  return { report: report as Report, summary }
}

/**
 * Reporte anterior de la misma empresa (el último que empieza antes que este), para comparar KPIs.
 * Solo trae sus indicadores, no el reporte completo. null si no hay o si es un reporte sin indicadores.
 */
export async function getPreviousComparison(key: string, periodStart: string, excludeSlug?: string): Promise<Comparison | null> {
  let prev: { period_start: string; period_end: string; metrics?: Metrics | null } | undefined
  if (isLocalMode) {
    const candidates = (await localReports())
      .filter((r) => r.summary.company_key === key && r.summary.period_start < periodStart && r.summary.slug !== excludeSlug)
      .sort((a, b) => b.summary.period_start.localeCompare(a.summary.period_start))
    prev = candidates[0] && { ...candidates[0].summary, metrics: candidates[0].report.metrics }
  } else {
    let q = supabase!
      .from('reports')
      .select('period_start, period_end, metrics:data->metrics')
      .eq('company_key', key)
      .lt('period_start', periodStart)
      .order('period_start', { ascending: false })
      .limit(1)
    if (excludeSlug) q = q.neq('slug', excludeSlug)
    const { data, error } = await q
    if (error) throw error
    prev = data?.[0] as typeof prev
  }
  if (!prev?.metrics) return null
  return { period: `${date(prev.period_start)} – ${date(prev.period_end)}`, metrics: prev.metrics }
}

export async function reportExists(slug: string): Promise<boolean> {
  if (isLocalMode) return (await localReports()).some((r) => r.summary.slug === slug)
  const { count, error } = await supabase!.from('reports').select('id', { count: 'exact', head: true }).eq('slug', slug)
  if (error) throw error
  return (count ?? 0) > 0
}

export interface NewReport {
  slug: string
  company: string
  companyKey: string
  periodStart: string
  periodEnd: string
  report: Report
  /** Tareas normalizadas del Excel: se guardan como historial */
  tasks: Task[]
}

const permissionHint = 'Sin permiso para publicar. ¿Ejecutó las migraciones 0002 y 0003 y su usuario es administrador?'
const isoDay = (ms: number | null) => (ms === null ? null : new Date(ms).toISOString().slice(0, 10))

/** Publica un reporte y sus tareas; si ya existe uno con el mismo slug, lo reemplaza. Requiere rol admin (RLS). */
export async function saveReport(r: NewReport): Promise<void> {
  if (isLocalMode) {
    localPublished.set(r.slug, {
      summary: {
        id: r.slug,
        slug: r.slug,
        company: r.company,
        company_key: r.companyKey,
        period_start: r.periodStart,
        period_end: r.periodEnd,
        created_at: new Date().toISOString(),
      },
      report: r.report,
    })
    return
  }

  const { data, error } = await supabase!
    .from('reports')
    .upsert(
      {
        slug: r.slug,
        company: r.company,
        company_key: r.companyKey,
        period_start: r.periodStart,
        period_end: r.periodEnd,
        data: r.report,
      },
      { onConflict: 'slug' },
    )
    .select('id')
    .single()
  if (error) throw new Error(error.code === '42501' ? permissionHint : error.message)

  // Historial de tareas: se reemplaza completo (al volver a publicar el mismo período)
  const reportId = data.id as string
  const { error: delError } = await supabase!.from('report_tasks').delete().eq('report_id', reportId)
  if (delError) throw new Error(`El reporte se publicó, pero no se pudo guardar el historial de tareas: ${delError.message}`)

  // Un código duplicado en el Excel rompería la clave primaria: se conserva la última aparición
  const unique = [...new Map(r.tasks.map((t) => [t.codigo, t])).values()]
  const rows = unique.map((t) => ({
    report_id: reportId,
    codigo: t.codigo,
    fecha: isoDay(t.fecha),
    responsable: t.resp,
    cliente: t.cliente,
    cadena: t.cadena,
    tipo: t.tipo,
    prioridad: t.prioridad,
    finalizada: t.finalizada,
    data: t,
  }))
  for (let i = 0; i < rows.length; i += 500) {
    const { error: insError } = await supabase!.from('report_tasks').insert(rows.slice(i, i + 500))
    if (insError) throw new Error(`El reporte se publicó, pero no se pudo guardar el historial de tareas: ${insError.message}`)
  }
}
