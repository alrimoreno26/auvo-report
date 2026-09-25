import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { deleteUser, listUsers, resendAccess, setUserDisabled, type AccessResult, type AppUser } from '../api/users'
import { useAuth } from '../auth/context'
import { AppBar } from '../components/layout/AppBar'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { AccessLinkBox } from '../components/users/AccessLinkBox'
import { CreateUserDialog } from '../components/users/CreateUserDialog'
import { UsersTable, type UserAction } from '../components/users/UsersTable'

type Notice =
  | { kind: 'ok' | 'warn'; result: AccessResult }
  | { kind: 'info' | 'error'; message: string }

type Confirm = { action: 'disable' | 'delete'; user: AppUser } | null

const label = (u: AppUser) => u.name ?? u.email

export function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<AppUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [lastCreated, setLastCreated] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [confirm, setConfirm] = useState<Confirm>(null)

  useEffect(() => {
    listUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios.'))
  }, [])

  const replace = (u: AppUser) => setUsers((list) => list?.map((x) => (x.id === u.id ? u : x)) ?? null)
  const errorText = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback)

  /** Ejecuta una acción de fila mostrando el indicador de carga en esa fila. */
  async function run(u: AppUser, fn: () => Promise<void>, fallback: string) {
    setBusyId(u.id)
    setNotice(null)
    try {
      await fn()
    } catch (err) {
      setNotice({ kind: 'error', message: errorText(err, fallback) })
    } finally {
      setBusyId(null)
    }
  }

  function onAction(action: UserAction, u: AppUser) {
    if (action === 'resend') {
      run(u, async () => {
        const result = await resendAccess(u.id)
        setNotice({ kind: result.emailSent ? 'ok' : 'warn', result })
      }, 'No se pudo reenviar el acceso.')
    } else if (action === 'enable') {
      run(u, async () => {
        replace(await setUserDisabled(u.id, false))
        setNotice({ kind: 'info', message: `${label(u)} puede volver a ingresar.` })
      }, 'No se pudo habilitar el usuario.')
    } else {
      // Deshabilitar y eliminar piden confirmación
      setConfirm({ action, user: u })
    }
  }

  async function onConfirm() {
    if (!confirm) return
    const { action, user: u } = confirm
    if (action === 'disable') {
      replace(await setUserDisabled(u.id, true))
      setNotice({ kind: 'info', message: `Se deshabilitó el acceso de ${label(u)}: ya no puede iniciar sesión.` })
    } else {
      await deleteUser(u.id)
      setUsers((list) => list?.filter((x) => x.id !== u.id) ?? null)
      setNotice({ kind: 'info', message: `Se eliminó la cuenta de ${u.email}.` })
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sorted = [...(users ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))
    return q ? sorted.filter((u) => `${u.name ?? ''} ${u.email}`.toLowerCase().includes(q)) : sorted
  }, [users, query])

  const admins = users?.filter((u) => u.role === 'admin' && !u.disabled).length ?? 0
  const disabled = users?.filter((u) => u.disabled).length ?? 0

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
              {users &&
                ` ${users.length} en total · ${admins} ${admins === 1 ? 'administrador' : 'administradores'}` +
                  (disabled ? ` · ${disabled} ${disabled === 1 ? 'deshabilitado' : 'deshabilitados'}` : '') +
                  '.'}
            </p>
          </div>
          <button className="btn-primary" onClick={() => setDialogOpen(true)}>
            + Nuevo usuario
          </button>
        </div>

        {notice && (
          <div className={`notice ${notice.kind === 'info' ? 'ok' : notice.kind}`} role="status">
            <div>
              {notice.kind === 'ok' && (
                <>
                  Enviamos un nuevo enlace de acceso a <b>{notice.result.user.email}</b>.
                </>
              )}
              {notice.kind === 'warn' && (
                <>
                  No se pudo enviar el correo{notice.result.emailError ? ` (${notice.result.emailError})` : ''}. Comparta este
                  enlace con <b>{notice.result.user.email}</b>:
                  <AccessLinkBox link={notice.result.link!} />
                </>
              )}
              {(notice.kind === 'info' || notice.kind === 'error') && notice.message}
            </div>
            <button className="notice-close" onClick={() => setNotice(null)} aria-label="Cerrar aviso">
              ×
            </button>
          </div>
        )}

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
            <UsersTable users={visible} currentEmail={user?.email} highlightId={lastCreated} busyId={busyId} onAction={onAction} />
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

      <ConfirmDialog
        open={confirm?.action === 'disable'}
        title="Deshabilitar usuario"
        confirmLabel="Deshabilitar"
        onConfirm={onConfirm}
        onClose={() => setConfirm(null)}
      >
        {confirm && (
          <>
            <p>
              <b>{label(confirm.user)}</b> ({confirm.user.email}) no podrá iniciar sesión. Su cuenta y su rol se conservan y
              puede volver a habilitarla cuando quiera.
            </p>
            <p className="muted">Si tiene una sesión abierta, se cierra como máximo en una hora.</p>
          </>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm?.action === 'delete'}
        title="Eliminar usuario"
        confirmLabel="Eliminar definitivamente"
        danger
        requireText={confirm?.user.email}
        onConfirm={onConfirm}
        onClose={() => setConfirm(null)}
      >
        {confirm && (
          <p>
            Se eliminará la cuenta de <b>{label(confirm.user)}</b> de forma permanente. Esta acción no se puede deshacer: para
            volver a darle acceso habrá que crearla de nuevo.
          </p>
        )}
      </ConfirmDialog>
    </>
  )
}
