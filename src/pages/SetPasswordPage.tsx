import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../auth/context'
import { PasswordField } from '../components/users/PasswordField'
import { passwordStrength } from '../components/users/password'
import { isLocalMode, supabase } from '../lib/supabase'

type Status = 'idle' | 'saving' | 'expired'

/**
 * Destino del enlace del correo de acceso: /crear-contrasena?token_hash=…&type=recovery
 * El enlace se valida recién al enviar el formulario (no al abrir la página), así los
 * antivirus de correo que "visitan" los enlaces no lo consumen antes que la persona.
 */
export function SetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const tokenHash = params.get('token_hash')
  const type = params.get('type') === 'invite' ? 'invite' : 'recovery'

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (passwordStrength(password) < 2) return setError('Elija una contraseña más segura: combine mayúsculas, números o símbolos.')
    if (password !== confirm) return setError('Las contraseñas no coinciden.')

    setStatus('saving')
    try {
      if (isLocalMode) {
        await signIn(decodeURIComponent(tokenHash!.replace(/^local-/, '')), password)
      } else {
        const { error: otpError } = await supabase!.auth.verifyOtp({ token_hash: tokenHash!, type })
        if (otpError) {
          setStatus('expired')
          return
        }
        const { error: updateError } = await supabase!.auth.updateUser({ password })
        if (updateError) throw updateError
      }
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la contraseña.')
      setStatus('idle')
    }
  }

  const invalid = !tokenHash

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
        {invalid || status === 'expired' ? (
          <div className="login-card">
            <div className="success-icon warn" aria-hidden>
              !
            </div>
            <h2>{invalid ? 'Enlace no válido' : 'El enlace venció'}</h2>
            <p className="sub">
              {invalid
                ? 'El enlace está incompleto. Ábralo directamente desde el correo que recibió.'
                : 'Este enlace ya se usó o venció. Solicite a su administrador que le reenvíe el acceso.'}
            </p>
            <Link to="/login" className="btn-secondary center">
              Ir a iniciar sesión
            </Link>
          </div>
        ) : (
          <form className="login-card" onSubmit={onSubmit}>
            <h2>Cree su contraseña</h2>
            <p className="sub">La usará junto con su email para ingresar a Auvo Report.</p>
            <PasswordField value={password} onChange={setPassword} />
            <div className="field">
              <label htmlFor="sp-confirm">Repita la contraseña</label>
              <input
                id="sp-confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="btn-primary" disabled={status === 'saving'}>
              {status === 'saving' ? 'Guardando…' : 'Guardar e ingresar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
