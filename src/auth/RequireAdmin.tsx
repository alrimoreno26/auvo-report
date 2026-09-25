import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from './context'

/** Usar dentro de <RequireAuth>: redirige al inicio si el usuario no es administrador. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user?.isAdmin) return <Navigate to="/" replace />
  return children
}
