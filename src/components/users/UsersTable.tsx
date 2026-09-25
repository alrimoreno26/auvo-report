import type { AppUser } from '../../api/users'
import { RowMenu, type MenuAction } from '../ui/RowMenu'

export type UserAction = 'resend' | 'disable' | 'enable' | 'delete'

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
  /** Id del usuario con una acción en curso */
  busyId?: string | null
  onAction: (action: UserAction, user: AppUser) => void
}

export function UsersTable({ users, currentEmail, highlightId, busyId, onAction }: Props) {
  function actionsFor(u: AppUser): MenuAction[] {
    // Sobre la propia cuenta no se ofrecen acciones (la función también lo impide)
    if (u.email === currentEmail) return []
    const list: MenuAction[] = []
    if (!u.disabled && !u.last_sign_in_at) list.push({ label: 'Reenviar acceso', onSelect: () => onAction('resend', u) })
    list.push(
      u.disabled
        ? { label: 'Habilitar', onSelect: () => onAction('enable', u) }
        : { label: 'Deshabilitar', onSelect: () => onAction('disable', u) },
    )
    list.push({ label: 'Eliminar', danger: true, onSelect: () => onAction('delete', u) })
    return list
  }

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
          <tr
            key={u.id}
            className={[u.id === highlightId && 'row-new', u.disabled && 'row-disabled'].filter(Boolean).join(' ') || undefined}
          >
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
              {u.disabled ? (
                <span className="status disabled" title="No puede iniciar sesión">
                  Deshabilitado
                </span>
              ) : u.last_sign_in_at ? (
                <span className="status active">Activo</span>
              ) : (
                <span className="status pending" title="Aún no creó su contraseña">
                  Pendiente
                </span>
              )}
            </td>
            <td className="actions">
              {busyId === u.id ? (
                <span className="spinner dark" aria-label="Procesando" />
              ) : (
                <RowMenu label={`Acciones para ${u.email}`} actions={actionsFor(u)} />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
