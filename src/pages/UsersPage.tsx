import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { listUsers, type AppUser } from '../api/users'
import { useAuth } from '../auth/context'
import { AppBar } from '../components/layout/AppBar'
import { CreateUserDialog } from '../components/users/CreateUserDialog'
import { UsersTable } from '../components/users/UsersTable'

export function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<AppUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [lastCreated, setLastCreated] = useState<string | null>(null)

  useEffect(() => {
    listUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios.'))
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sorted = [...(users ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))
    return q ? sorted.filter((u) => `${u.name ?? ''} ${u.email}`.toLowerCase().includes(q)) : sorted
  }, [users, query])

  const admins = users?.filter((u) => u.role === 'admin').length ?? 0

  return (
    <>
      <AppBar />
      <main className="wrap page">
        <Link to="/" className="back-link">
          ← Reportes
        </Link>
        <div className="page-head">
          <div>
            <h2>Usuarios</h2>
            <p className="lead">
              Personas con acceso a los reportes.
              {users && ` ${users.length} en total · ${admins} ${admins === 1 ? 'administrador' : 'administradores'}.`}
            </p>
          </div>
          <button className="btn-primary" onClick={() => setDialogOpen(true)}>
            + Nuevo usuario
          </button>
        </div>

        <div className="card tbl">
          <div className="table-toolbar">
            <input
              className="search"
              type="search"
              placeholder="Buscar por nombre o email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          {!users && !error && <p className="muted table-state">Cargando usuarios…</p>}
          {users && visible.length === 0 && (
            <p className="muted table-state">{query ? 'Ningún usuario coincide con la búsqueda.' : 'Todavía no hay usuarios.'}</p>
          )}
          {users && visible.length > 0 && (
            <UsersTable users={visible} currentEmail={user?.email} highlightId={lastCreated} />
          )}
        </div>
      </main>

      <CreateUserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(u) => {
          setUsers((list) => [u, ...(list ?? [])])
          setLastCreated(u.id)
        }}
      />
    </>
  )
}
