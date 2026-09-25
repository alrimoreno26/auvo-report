import { NavLink } from 'react-router'
import { useAuth } from '../../auth/context'
import { isLocalMode } from '../../lib/supabase'

interface Props {
  /** Página actual dentro de Reportes (breadcrumb): Reportes / <crumb> */
  crumb?: string
}

export function AppBar({ crumb }: Props = {}) {
  const { user, signOut } = useAuth()

  return (
    <div className="appbar">
      <div className="wrap">
        <NavLink to="/" className="brand">
          <span className="brand-mark">A</span> Auvo Report
        </NavLink>
        {crumb && (
          <nav className="crumbs" aria-label="Ruta de navegación">
            <NavLink to="/" end>
              Reportes
            </NavLink>
            <span aria-hidden>/</span>
            <b aria-current="page">{crumb}</b>
          </nav>
        )}
        {isLocalMode && <span className="local-badge">Modo local</span>}
        {user && (
          <div className="appbar-user">
            {user.isAdmin && (
              <NavLink to="/usuarios" className="appbar-link">
                Usuarios
              </NavLink>
            )}
            <span>{user.email}</span>
            <button className="btn-ghost" onClick={() => signOut()}>
              Salir
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
