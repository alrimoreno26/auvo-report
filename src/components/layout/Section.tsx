import type { ReactNode } from 'react'

interface Props {
  id: string
  title: string
  lead?: string
  /** Clases extra del panel contenedor (p. ej. "alerts") */
  panelClass?: string
  children: ReactNode
}

export function Section({ id, title, lead, panelClass, children }: Props) {
  return (
    <section id={id}>
      <h2>{title}</h2>
      {lead && <p className="lead">{lead}</p>}
      <div className={panelClass ? `panel ${panelClass}` : 'panel'}>{children}</div>
    </section>
  )
}
