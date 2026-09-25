import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from './context'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="screen-center muted">Cargando…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
