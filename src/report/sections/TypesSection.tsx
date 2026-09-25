import { HBarChart } from '../../components/charts/HBarChart'
import { StackBar } from '../../components/charts/StackBar'
import { Card } from '../../components/ui/Card'
import { Grid } from '../../components/ui/Grid'
import { Section } from '../../components/layout/Section'
import type { Report, StackData } from '../../types/report'

function StackBlock({ title, subtitle, segments, first }: StackData & { first?: boolean }) {
  return (
    <>
      <h3 style={first ? undefined : { marginTop: 22 }}>{title}</h3>
      {subtitle && <p className="sub">{subtitle}</p>}
      <StackBar segments={segments} />
    </>
  )
}

export function TypesSection({ title, lead, byType, priority, status, creators }: Report['types']) {
  return (
    <Section id="tipos" title={title} lead={lead}>
      <Grid cols={2}>
        <Card title={byType.title} subtitle={byType.subtitle}>
          <HBarChart bars={byType.bars} width={560} labelWidth={240} rowHeight={30} barHeight={16} />
        </Card>
        <Card>
          <StackBlock {...priority} first />
          <StackBlock {...status} />
          <h3 style={{ marginTop: 22 }}>{creators.title}</h3>
          {creators.subtitle && <p className="sub">{creators.subtitle}</p>}
          <HBarChart bars={creators.bars} width={480} />
        </Card>
      </Grid>
    </Section>
  )
}
