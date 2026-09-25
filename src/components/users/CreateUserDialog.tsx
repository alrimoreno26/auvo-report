import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createUser, type AccessResult, type AppUser, type Role } from '../../api/users'
import { AccessLinkBox } from './AccessLinkBox'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (user: AppUser) => void
}

const EMPTY = { name: '', email: '', role: 'viewer' as Role }

const ROLES: { value: Role; title: string; description: string }[] = [
  { value: 'viewer', title: 'Lector', description: 'Consulta los reportes.' },
  { value: 'admin', title: 'Administrador', description: 'Consulta reportes y gestiona usuarios.' },
]

export function CreateUserDialog({ open, onClose, onCreated }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AccessResult | null>(null)

  useEffect(() => {
    const dialog = ref.current!
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function reset() {
    setForm(EMPTY)
    setError(null)
    setResult(null)
  }

  function close() {
    reset()
    onClose()
  }

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const r = await createUser({ ...form, email: form.email.trim(), name: form.name.trim() })
      setResult(r)
      onCreated(r.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="create-user-title"
      onCancel={(e) => {
        // Esc: cerrar mediante el estado para mantenerlo sincronizado
        e.preventDefault()
        close()
      }}
      onClick={(e) => {
        // Clic en el fondo (fuera del contenido) cierra, salvo mientras se envía
        if (e.target === ref.current && !submitting) close()
      }}
    >
      <div className="dialog-body">
        <button type="button" className="dialog-close" onClick={close} aria-label="Cerrar">
          ×
        </button>

        {result ? (
          <div className="dialog-success">
            <div className={`success-icon${result.emailSent ? '' : ' warn'}`} aria-hidden>
              {result.emailSent ? '✓' : '!'}
            </div>
            <h3 id="create-user-title">Usuario creado</h3>
            {result.emailSent ? (
              <p className="sub">
                Enviamos un correo a <b>{result.user.email}</b> con el enlace para crear su contraseña e ingresar.
              </p>
            ) : (
              <>
                <p className="sub">
                  No se pudo enviar el correo{result.emailError ? ` (${result.emailError})` : ''}. Comparta este enlace
                  con <b>{result.user.email}</b> para que cree su contraseña:
                </p>
                <AccessLinkBox link={result.link!} />
              </>
            )}
            <div className="dialog-actions">
              <button type="button" className="btn-secondary" onClick={reset}>
                Crear otro
              </button>
              <button type="button" className="btn-primary" onClick={close}>
                Listo
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <h3 id="create-user-title">Nuevo usuario</h3>
            <p className="sub">Le enviaremos un correo con sus datos y un enlace para crear su contraseña.</p>

            <div className="field">
              <label htmlFor="cu-name">
                Nombre <span className="optional">(opcional)</span>
              </label>
              <input
                id="cu-name"
                autoComplete="off"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Nombre y apellido"
              />
            </div>

            <div className="field">
              <label htmlFor="cu-email">Email</label>
              <input
                id="cu-email"
                type="email"
                autoComplete="off"
                required
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="nombre@empresa.com"
              />
            </div>

            <fieldset className="field">
              <legend>Rol</legend>
              <div className="role-options">
                {ROLES.map((r) => (
                  <label key={r.value} className={`role-option${form.role === r.value ? ' on' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={form.role === r.value}
                      onChange={() => set('role', r.value)}
                    />
                    <b>{r.title}</b>
                    <small>{r.description}</small>
                  </label>
                ))}
              </div>
            </fieldset>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <div className="dialog-actions">
              <button type="button" className="btn-secondary" onClick={close} disabled={submitting}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Creando…' : 'Crear y enviar acceso'}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  )
}
