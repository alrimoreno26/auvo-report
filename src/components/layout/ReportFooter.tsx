import type { Report } from '../../types/report'

export function ReportFooter({ title, definitions, note }: Report['footer']) {
  return (
    <footer>
      <b>{title}</b>
      <dl>
        {definitions.map((d) => (
          <div key={d.term} className="def">
            <dt>{d.term}</dt>
            <dd>{d.text}</dd>
          </div>
        ))}
      </dl>
      <p className="footer-note">{note}</p>
    </footer>
  )
}
