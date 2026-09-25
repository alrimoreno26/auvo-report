import type { ReactNode } from 'react'

interface Props {
  title?: string
  subtitle?: string
  span2?: boolean
  /** Contenedor con scroll horizontal para tablas */
  table?: boolean
  children: ReactNode
}

export function Card({ title, subtitle, span2, table, children }: Props) {
  const cls = ['card', span2 && 'span2', table && 'tbl'].filter(Boolean).join(' ')
  return (
    <div className={cls}>
      {title && <h3>{title}</h3>}
      {subtitle && <p className="sub">{subtitle}</p>}
      {children}
    </div>
  )
}
