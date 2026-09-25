import { RichText } from '../../components/ui/RichText'
import { Section } from '../../components/layout/Section'
import { scrollToSection } from '../../components/layout/scrollToSection'
import type { Report } from '../../types/report'

export function IndexSection({ title, lead, intro, items }: Report['index']) {
  return (
    <Section id="indice" title={title} lead={lead}>
      <div className="intro">
        <RichText text={intro} />
      </div>
      <div className="idx">
        {items.map((item, i) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault()
              scrollToSection(item.id)
            }}
          >
            <span className="n">{String(i + 1).padStart(2, '0')}</span>
            <h4>{item.title}</h4>
            <p>{item.description}</p>
            <ul>
              {item.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </a>
        ))}
      </div>
    </Section>
  )
}
