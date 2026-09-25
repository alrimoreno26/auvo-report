import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { createUser } from '../api/users'
import { AppBar } from '../components/layout/AppBar'

const EMPTY = { email: '', password: '', confirm: '', isAdmin: false }

export function CreateUserPage() {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setCreated(null)
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden.')

    setSubmitting(true)
    try {
      const user = await createUser({ email: form.email.trim(), password: form.password, isAdmin: form.isAdmin })
      setCreated(user.email)
      setForm(EMPTY)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <AppBar />
      <main className="wrap page">
        <Link to="/" className="back-link">
          ← Reportes
        </Link>
        <h2>Crear usuario</h2>
        <p className="lead">El usuario podrá ingresar de inmediato con el email y la contraseña que defina aquí.</p>

        <form className="form-card" onSubmit={onSubmit}>
          <label>
            Email
            <input
              type="email"
              autoComplete="off"
              required
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
            />
            <small>Mínimo 8 caracteres.</small>
          </label>
          <label>
            Confirmar contraseña
            <input
              type="password"
              autoComplete="new-password"
              required
              value={form.confirm}
              onChange={(e) => set('confirm', e.target.value)}
            />
          </label>
          <label className="check">
            <input type="checkbox" checked={form.isAdmin} onChange={(e) => set('isAdmin', e.target.checked)} />
            <span>
              Administrador
              <small>Puede crear otros usuarios.</small>
            </span>
          </label>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}
          {created && (
            <p className="form-success" role="status">
              Usuario <b>{created}</b> creado.
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Creando…' : 'Crear usuario'}
          </button>
        </form>
      </main>
    </>
  )
}
