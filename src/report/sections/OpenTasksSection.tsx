import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Section } from '../../components/layout/Section'
import type { Report } from '../../types/report'

export function OpenTasksSection({ title, lead, searchPlaceholder, table }: Report['openTasks']) {
  return (
    <Section id="abiertas" title={title} lead={lead}>
      <Card table>
        <DataTable {...table} searchPlaceholder={searchPlaceholder} />
      </Card>
    </Section>
  )
}
