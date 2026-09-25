import { NavLink } from 'react-router'
import { useAuth } from '../../auth/context'
import { isLocalMode } from '../../lib/supabase'

export function AppBar() {
  const { user, signOut } = useAuth()

  return (
    <div className="appbar">
      <div className="wrap">
        <NavLink to="/" className="brand">
          <span className="brand-mark">A</span> Auvo Report
        </NavLink>
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
