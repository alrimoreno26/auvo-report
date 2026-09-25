import { AreaChart } from '../../components/charts/AreaChart'
import { ColumnChart } from '../../components/charts/ColumnChart'
import { Heatmap } from '../../components/charts/Heatmap'
import { WeeklyChart } from '../../components/charts/WeeklyChart'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Grid } from '../../components/ui/Grid'
import { Section } from '../../components/layout/Section'
import type { Report } from '../../types/report'

export function EvolutionSection({ title, lead, weekly, weeklyTable, daily, heatmap, weekday }: Report['evolution']) {
  return (
    <Section id="evolucion" title={title} lead={lead}>
      <Grid>
        <Card>
          <WeeklyChart {...weekly} />
        </Card>
        <Card table>
          <DataTable {...weeklyTable} />
          {weeklyTable.note && (
            <p className="sub" style={{ margin: '8px 0 0' }}>
              {weeklyTable.note}
            </p>
          )}
        </Card>
        <Card title={daily.title} subtitle={daily.subtitle}>
          <AreaChart points={daily.points} />
        </Card>
        <Grid cols={3}>
          <Card title={heatmap.title} subtitle={heatmap.subtitle} span2>
            <Heatmap {...heatmap} />
          </Card>
          <Card title={weekday.title} subtitle={weekday.subtitle}>
            <ColumnChart bars={weekday.bars} width={360} />
          </Card>
        </Grid>
      </Grid>
    </Section>
  )
}
