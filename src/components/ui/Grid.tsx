import type { ReactNode } from 'react'

export function Grid({ cols, children }: { cols?: 2 | 3 | 4 | 5; children: ReactNode }) {
  return <div className={cols ? `grid g${cols}` : 'grid'}>{children}</div>
}
