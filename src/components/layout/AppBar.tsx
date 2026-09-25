import { Link } from 'react-router'
import { useAuth } from '../../auth/context'
import { isLocalMode } from '../../lib/supabase'

export function AppBar() {
  const { user, signOut } = useAuth()

  return (
    <div className="appbar">
      <div className="wrap">
        <Link to="/" className="brand">
          <span className="brand-mark">A</span> Auvo Report
        </Link>
        {isLocalMode && <span className="local-badge">Modo local</span>}
        {user && (
          <div className="appbar-user">
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
