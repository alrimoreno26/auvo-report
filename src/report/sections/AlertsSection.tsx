import { AlertItem } from '../../components/ui/AlertItem'
import { Section } from '../../components/layout/Section'
import type { Report } from '../../types/report'

export function AlertsSection({ title, lead, items }: Report['alerts']) {
  return (
    <Section id="atencion" title={title} lead={lead} panelClass="alerts">
      {items.map((a) => (
        <AlertItem key={a.title} {...a} />
      ))}
    </Section>
  )
}
