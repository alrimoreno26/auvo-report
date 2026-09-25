import { isLocalMode, supabase } from '../lib/supabase'
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
const fact = (r: Report, label: string) => r.meta.facts.find((f) => f.label === label)?.value ?? ''

async function localReports() {
  const files = await Promise.all(
    Object.entries(localFiles).map(async ([path, load]) => {
      const slug = slugOf(path)
      const report = (await load()).default
      const [start, end] = fact(report, 'Período analizado').split('–').map((s) => isoDate(s.trim()))
      const summary: ReportSummary = {
        id: slug,
        slug,
        company: fact(report, 'Empresa'),
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
    .select('id, slug, company, period_start, period_end, created_at')
    .order('period_end', { ascending: false })
  if (error) throw error
  return data
}

export async function getReport(slug: string): Promise<Report | null> {
  if (isLocalMode) {
    return (await localReports()).find((r) => r.summary.slug === slug)?.report ?? null
  }
  const { data, error } = await supabase!.from('reports').select('data').eq('slug', slug).maybeSingle()
  if (error) throw error
  return (data?.data as Report | undefined) ?? null
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
  periodStart: string
  periodEnd: string
  report: Report
}

/** Publica un reporte; si ya existe uno con el mismo slug, lo reemplaza. Requiere rol admin (RLS). */
export async function saveReport(r: NewReport): Promise<void> {
  if (isLocalMode) {
    localPublished.set(r.slug, {
      summary: {
        id: r.slug,
        slug: r.slug,
        company: r.company,
        period_start: r.periodStart,
        period_end: r.periodEnd,
        created_at: new Date().toISOString(),
      },
      report: r.report,
    })
    return
  }
  const { error } = await supabase!.from('reports').upsert(
    { slug: r.slug, company: r.company, period_start: r.periodStart, period_end: r.periodEnd, data: r.report },
    { onConflict: 'slug' },
  )
  if (error) {
    if (error.code === '42501') throw new Error('Sin permiso para publicar. ¿Ejecutó la migración 0002 y su usuario es administrador?')
    throw new Error(error.message)
  }
}
