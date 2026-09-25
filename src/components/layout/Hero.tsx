import { Fragment } from 'react'
import type { Report } from '../../types/report'

export function Hero({ eyebrow, title, description, facts }: Report['meta']) {
  return (
    <header className="hero">
      <div className="wrap">
        <div className="eyebrow">{eyebrow}</div>
        <h1>
          {title.map((line, i) => (
            <Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </h1>
        <p>{description}</p>
        <div className="meta">
          {facts.map((f) => (
            <div key={f.label}>
              <span>{f.label}</span>
              <b>{f.value}</b>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}
