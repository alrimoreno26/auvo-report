import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createUser, type AppUser, type Role } from '../../api/users'
import { PasswordField } from './PasswordField'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (user: AppUser) => void
}

const EMPTY = { name: '', email: '', password: '', role: 'viewer' as Role }

const ROLES: { value: Role; title: string; description: string }[] = [
  { value: 'viewer', title: 'Lector', description: 'Consulta los reportes.' },
  { value: 'admin', title: 'Administrador', description: 'Consulta reportes y gestiona usuarios.' },
]

export function CreateUserDialog({ open, onClose, onCreated }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const dialog = ref.current!
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function reset() {
    setForm(EMPTY)
    setError(null)
    setCreated(null)
    setCopied(false)
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
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    setSubmitting(true)
    try {
      const user = await createUser({ ...form, email: form.email.trim(), name: form.name.trim() })
      setCreated({ email: user.email, password: form.password })
      onCreated(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario.')
    } finally {
      setSubmitting(false)
    }
  }

  async function copyCredentials() {
    if (!created) return
    const url = `${location.origin}/login`
    await navigator.clipboard.writeText(`Acceso a Auvo Report\n${url}\nEmail: ${created.email}\nContraseña: ${created.password}`)
    setCopied(true)
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

        {created ? (
          <div className="dialog-success">
            <div className="success-icon" aria-hidden>
              ✓
            </div>
            <h3 id="create-user-title">Usuario creado</h3>
            <p className="sub">
              Comparta estas credenciales por un canal seguro. La contraseña no se volverá a mostrar.
            </p>
            <dl className="credentials">
              <dt>Email</dt>
              <dd>{created.email}</dd>
              <dt>Contraseña</dt>
              <dd>
                <code>{created.password}</code>
              </dd>
            </dl>
            <div className="dialog-actions">
              <button type="button" className="btn-secondary" onClick={reset}>
                Crear otro
              </button>
              <button type="button" className="btn-primary" onClick={copyCredentials}>
                {copied ? '✓ Copiado' : 'Copiar credenciales'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate={false}>
            <h3 id="create-user-title">Nuevo usuario</h3>
            <p className="sub">El usuario podrá ingresar de inmediato con estas credenciales.</p>

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

            <PasswordField value={form.password} onChange={(v) => set('password', v)} />

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
                {submitting ? 'Creando…' : 'Crear usuario'}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  )
}
