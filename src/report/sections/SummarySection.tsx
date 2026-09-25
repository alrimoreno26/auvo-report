import { Grid } from '../../components/ui/Grid'
import { KpiCard } from '../../components/ui/KpiCard'
import { Section } from '../../components/layout/Section'
import type { Report } from '../../types/report'

export function SummarySection({ title, lead, kpis }: Report['summary']) {
  return (
    <Section id="resumen" title={title} lead={lead}>
      <Grid cols={4}>
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </Grid>
    </Section>
  )
}
