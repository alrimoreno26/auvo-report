import { isLocalMode, supabase } from '../lib/supabase'
import type { Report, ReportSummary } from '../types/report'

// Solo se evalúa en desarrollo; en el build la rama desaparece junto con los JSON.
const localFiles = import.meta.env.DEV
  ? import.meta.glob<{ default: Report }>('/data/*.json')
  : {}

const slugOf = (path: string) =>
  path.split('/').pop()!.replace(/\.json$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')

async function localReports() {
  return Promise.all(
    Object.entries(localFiles).map(async ([path, load]) => ({ slug: slugOf(path), report: (await load()).default })),
  )
}

const isoDate = (d: string) => d.split('/').reverse().join('-')
const fact = (r: Report, label: string) => r.meta.facts.find((f) => f.label === label)?.value ?? ''

export async function listReports(): Promise<ReportSummary[]> {
  if (isLocalMode) {
    return (await localReports()).map(({ slug, report }) => {
      const [start, end] = fact(report, 'Período analizado').split('–').map((s) => isoDate(s.trim()))
      return { id: slug, slug, company: fact(report, 'Empresa'), period_start: start, period_end: end, created_at: '' }
    })
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
    return (await localReports()).find((r) => r.slug === slug)?.report ?? null
  }
  const { data, error } = await supabase!.from('reports').select('data').eq('slug', slug).maybeSingle()
  if (error) throw error
  return (data?.data as Report | undefined) ?? null
}
