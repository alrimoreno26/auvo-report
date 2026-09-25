import type { AppUser } from '../../api/users'

const dateFmt = new Intl.DateTimeFormat('es', { day: '2-digit', month: '2-digit', year: 'numeric' })
const relFmt = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

function relative(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return relFmt.format(Math.round(diff / secs), unit)
  }
  return 'recién'
}

const initials = (u: AppUser) =>
  (u.name || u.email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')

interface Props {
  users: AppUser[]
  currentEmail?: string
  highlightId?: string | null
  /** Id del usuario al que se le está reenviando el acceso */
  resendingId?: string | null
  onResend: (user: AppUser) => void
}

export function UsersTable({ users, currentEmail, highlightId, resendingId, onResend }: Props) {
  return (
    <table className="users-table">
      <thead>
        <tr>
          <th>Usuario</th>
          <th>Rol</th>
          <th>Creado</th>
          <th>Último acceso</th>
          <th>Estado</th>
          <th aria-label="Acciones" />
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id} className={u.id === highlightId ? 'row-new' : undefined}>
            <td>
              <div className="user-cell">
                <span className="avatar" aria-hidden>
                  {initials(u)}
                </span>
                <div>
                  <b>
                    {u.name ?? u.email}
                    {u.email === currentEmail && <span className="you">Usted</span>}
                  </b>
                  {u.name && <small>{u.email}</small>}
                </div>
              </div>
            </td>
            <td>
              <span className={`pill ${u.role === 'admin' ? 'role-admin' : 'role-viewer'}`}>
                {u.role === 'admin' ? 'Administrador' : 'Lector'}
              </span>
            </td>
            <td className="nowrap">{dateFmt.format(new Date(u.created_at))}</td>
            <td className="nowrap">
              {u.last_sign_in_at ? relative(u.last_sign_in_at) : <span className="muted">Nunca</span>}
            </td>
            <td>
              {/* Sin ningún ingreso: todavía no creó su contraseña */}
              {u.last_sign_in_at ? (
                <span className="status active">Activo</span>
              ) : (
                <span className="status pending" title="Aún no creó su contraseña">
                  Pendiente
                </span>
              )}
            </td>
            <td className="actions">
              {!u.last_sign_in_at && (
                <button className="btn-ghost" onClick={() => onResend(u)} disabled={resendingId === u.id}>
                  {resendingId === u.id ? 'Enviando…' : 'Reenviar acceso'}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
