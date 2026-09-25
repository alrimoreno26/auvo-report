import { useId, useState } from 'react'
import { generatePassword, passwordStrength, STRENGTH_LABELS } from './password'

interface Props {
  value: string
  onChange: (value: string) => void
}

/** Campo de contraseña con mostrar/ocultar, generador e indicador de seguridad. */
export function PasswordField({ value, onChange }: Props) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const score = passwordStrength(value)

  return (
    <div className="field">
      <div className="field-head">
        <label htmlFor={id}>Contraseña</label>
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            onChange(generatePassword())
            setVisible(true)
          }}
        >
          Generar segura
        </button>
      </div>
      <div className="input-group">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          required
          minLength={8}
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="input-addon"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      <div className={`strength s${score}`} aria-live="polite">
        <div className="strength-bars">
          {[1, 2, 3, 4].map((n) => (
            <i key={n} className={n <= score ? 'on' : undefined} />
          ))}
        </div>
        <span>{value ? STRENGTH_LABELS[score] : 'Mínimo 8 caracteres'}</span>
      </div>
    </div>
  )
}
