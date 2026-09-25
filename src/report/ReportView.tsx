import { Hero } from '../components/layout/Hero'
import { ReportFooter } from '../components/layout/ReportFooter'
import { SectionNav } from '../components/layout/SectionNav'
import { Tooltip } from '../components/ui/Tooltip'
import type { Report } from '../types/report'
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

export function ReportView({ report }: { report: Report }) {
  return (
    <div className="report">
      <Hero {...report.meta} />
      <SectionNav items={NAV} />
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
  )
}
