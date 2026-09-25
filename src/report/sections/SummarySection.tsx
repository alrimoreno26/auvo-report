import { Link } from 'react-router'
import { Grid } from '../../components/ui/Grid'
import { KpiCard } from '../../components/ui/KpiCard'
import { Section } from '../../components/layout/Section'
import { useComparison } from '../comparisonContext'
import type { Report } from '../../types/report'

export function SummarySection({ title, lead, kpis }: Report['summary']) {
  const { metrics, comparison } = useComparison()
  return (
    <Section id="resumen" title={title} lead={lead}>
      {metrics && comparison && (
        <p className="compare-note">
          <span className="compare-dot" aria-hidden />
          Las variaciones comparan con el período anterior: <b>{comparison.period}</b>
          {comparison.historyUrl && (
            <Link to={comparison.historyUrl} className="compare-history">
              Ver evolución →
            </Link>
          )}
          <span className="compare-legend">
            <i className="good">▲ mejora</i> <i className="bad">▼ empeora</i> <i className="neutral">informativo</i>
          </span>
        </p>
      )}
      <Grid cols={4}>
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </Grid>
    </Section>
  )
}
