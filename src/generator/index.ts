// Genera un reporte a partir del Excel "Informe de Tareas" (port de generar_reporte.py).
import type { Report } from '../types/report'
import { analyze } from './analyze'
import { buildReport } from './build'
import { prepare } from './prepare'
import { readTaskReport } from './read'

export interface GenerateOptions {
  empresa: string
  codigo?: string
  /** Minutos de tolerancia para considerar una visita puntual */
  tolerancia?: number
}

export interface GeneratedReport {
  report: Report
  company: string
  /** yyyy-mm-dd */
  periodStart: string
  periodEnd: string
  taskCount: number
  slug: string
}

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10)

function slugify(s: string) {
  return (
    s
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'tareas'
  )
}

/** Lee el archivo y detecta el período sin calcular el reporte (para la vista previa del formulario). */
export async function inspectFile(file: File) {
  const { rows, filters } = await readTaskReport(file)
  return { taskCount: rows.length, filters }
}

export async function generateReport(file: File, opts: GenerateOptions): Promise<GeneratedReport> {
  const { rows, filters } = await readTaskReport(file)
  if (!rows.length) throw new Error('El archivo no contiene tareas.')
  const tasks = prepare(rows)
  const R = analyze(tasks, filters, opts.tolerancia ?? 15)
  const report = buildReport(R, { empresa: opts.empresa, codigo: opts.codigo, fuente: file.name })
  const periodStart = iso(R.ini)
  const periodEnd = iso(R.fin)
  return {
    report,
    company: opts.empresa.trim(),
    periodStart,
    periodEnd,
    taskCount: R.n,
    // Mismo patrón que el nombre de archivo del script: Reporte_<empresa>_<inicio>_<fin>
    slug: `reporte-${slugify(opts.empresa)}-${periodStart.replace(/-/g, '')}-${periodEnd.replace(/-/g, '')}`,
  }
}

