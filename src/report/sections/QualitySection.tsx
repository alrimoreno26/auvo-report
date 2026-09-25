import { ColumnChart } from '../../components/charts/ColumnChart'
import { HBarChart } from '../../components/charts/HBarChart'
import { Card } from '../../components/ui/Card'
import { Grid } from '../../components/ui/Grid'
import { KpiCard } from '../../components/ui/KpiCard'
import { Section } from '../../components/layout/Section'
import type { Report } from '../../types/report'

export function QualitySection({ title, lead, kpis, arrival, duration, response, distance, evidence }: Report['quality']) {
  return (
    <Section id="calidad" title={title} lead={lead}>
      <Grid>
        <Grid cols={5}>
          {kpis.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </Grid>
        <Grid cols={2}>
          {[arrival, duration, response, distance].map((c) => (
            <Card key={c.title} title={c.title} subtitle={c.subtitle}>
              <ColumnChart bars={c.bars} />
            </Card>
          ))}
        </Grid>
        <Card title={evidence.title} subtitle={evidence.subtitle}>
          <HBarChart
            bars={evidence.bars}
            width={1080}
            labelWidth={290}
            rowHeight={28}
            barHeight={14}
            emptyText="Sin pendientes registrados 🎉"
          />
        </Card>
      </Grid>
    </Section>
  )
}
