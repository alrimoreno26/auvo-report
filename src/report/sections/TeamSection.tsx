import { HBarChart } from '../../components/charts/HBarChart'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Grid } from '../../components/ui/Grid'
import { Section } from '../../components/layout/Section'
import type { Report } from '../../types/report'

export function TeamSection({ title, lead, byOwner, punctuality, table }: Report['team']) {
  return (
    <Section id="equipo" title={title} lead={lead}>
      <Grid>
        <Grid cols={2}>
          <Card title={byOwner.title} subtitle={byOwner.subtitle}>
            <HBarChart bars={byOwner.bars} />
          </Card>
          <Card title={punctuality.title} subtitle={punctuality.subtitle}>
            <HBarChart bars={punctuality.bars} />
          </Card>
        </Grid>
        <Card table>
          <DataTable {...table} />
        </Card>
      </Grid>
    </Section>
  )
}
