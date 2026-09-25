import { HBarChart } from '../../components/charts/HBarChart'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Grid } from '../../components/ui/Grid'
import { Section } from '../../components/layout/Section'
import type { Report } from '../../types/report'

export function ClientsSection({ title, lead, byGroup, topLocations, groupTable, equipment }: Report['clients']) {
  return (
    <Section id="clientes" title={title} lead={lead}>
      <Grid>
        <Grid cols={2}>
          <Card title={byGroup.title} subtitle={byGroup.subtitle}>
            <HBarChart bars={byGroup.bars} labelWidth={160} />
          </Card>
          <Card title={topLocations.title} subtitle={topLocations.subtitle}>
            <HBarChart bars={topLocations.bars} labelWidth={180} rowHeight={24} barHeight={10} />
          </Card>
        </Grid>
        <Grid cols={3}>
          <Card title={groupTable.title} subtitle={groupTable.subtitle} span2 table>
            <DataTable columns={groupTable.columns} rows={groupTable.rows} />
          </Card>
          <Card title={equipment.title} subtitle={equipment.subtitle} table>
            <DataTable columns={equipment.columns} rows={equipment.rows} />
            {equipment.note && (
              <p className="sub" style={{ marginTop: 10 }}>
                {equipment.note}
              </p>
            )}
          </Card>
        </Grid>
      </Grid>
    </Section>
  )
}
