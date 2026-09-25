import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/context'
import { isLocalMode } from '../lib/supabase'

const MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Email o contraseña incorrectos.',
  'Email not confirmed': 'Debe confirmar su email antes de ingresar.',
  'User is banned': 'Su acceso está deshabilitado. Contacte a su administrador.',
}

export function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={from} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(MESSAGES[msg] ?? 'No se pudo iniciar sesión. Intente de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login">
      <div className="login-side">
        <div className="login-side-inner">
          <div className="eyebrow">Reportes de Customer Success</div>
          <h1>Auvo Report</h1>
          <p>Indicadores de operación, cumplimiento y calidad de la ejecución en campo de cada cliente.</p>
        </div>
      </div>
      <div className="login-main">
        <form className="login-card" onSubmit={onSubmit}>
          <h2>Iniciar sesión</h2>
          <p className="sub">Ingrese con la cuenta que le fue asignada.</p>
          {isLocalMode && (
            <p className="login-hint">Modo local: Supabase no está configurado, cualquier email y contraseña funcionan.</p>
          )}
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
