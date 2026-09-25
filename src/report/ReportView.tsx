import { Hero } from '../components/layout/Hero'
import { ReportFooter } from '../components/layout/ReportFooter'
import { SectionNav } from '../components/layout/SectionNav'
import { Tooltip } from '../components/ui/Tooltip'
import { downloadReportPdf } from '../pdf/download'
import type { Report } from '../types/report'
import type { Comparison } from './compare'
import { ComparisonContext } from './comparisonContext'
import { AlertsSection } from './sections/AlertsSection'
import { ClientsSection } from './sections/ClientsSection'
import { EvolutionSection } from './sections/EvolutionSection'
import { IndexSection } from './sections/IndexSection'
import { OpenTasksSection } from './sections/OpenTasksSection'
import { QualitySection } from './sections/QualitySection'
import { SummarySection } from './sections/SummarySection'
import { TeamSection } from './sections/TeamSection'
import { TypesSection } from './sections/TypesSection'

const NAV = [
  { id: 'indice', label: 'Índice' },
  { id: 'resumen', label: 'Resumen' },
  { id: 'atencion', label: 'Puntos de atención' },
  { id: 'evolucion', label: 'Evolución' },
  { id: 'tipos', label: 'Tipos y prioridad' },
  { id: 'equipo', label: 'Equipo técnico' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'calidad', label: 'Calidad en campo' },
  { id: 'abiertas', label: 'Tareas abiertas' },
]

interface Props {
  report: Report
  /** Ruta para volver (p. ej. al listado de reportes) */
  backTo?: string
  /** Período anterior de la misma empresa: los KPI muestran la variación */
  comparison?: Comparison | null
}

export function ReportView({ report, backTo, comparison }: Props) {
  return (
    <ComparisonContext.Provider value={{ metrics: report.metrics, comparison }}>
    <div className="report">
      <Hero {...report.meta} />
      <SectionNav items={NAV} backTo={backTo} onDownloadPdf={() => downloadReportPdf(report, comparison)} />
      <main className="wrap">
        <IndexSection {...report.index} />
        <SummarySection {...report.summary} />
        <AlertsSection {...report.alerts} />
        <EvolutionSection {...report.evolution} />
        <TypesSection {...report.types} />
        <TeamSection {...report.team} />
        <ClientsSection {...report.clients} />
        <QualitySection {...report.quality} />
        <OpenTasksSection {...report.openTasks} />
        <ReportFooter {...report.footer} />
      </main>
      <Tooltip />
    </div>
    </ComparisonContext.Provider>
  )
}
