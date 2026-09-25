import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  /** Estilo rojo para acciones destructivas */
  danger?: boolean
  /** Si se indica, hay que escribir este texto para habilitar la confirmación */
  requireText?: string
  onConfirm: () => Promise<void>
  onClose: () => void
}

/** Diálogo de confirmación; muestra el error si la acción falla y se cierra solo si sale bien. */
export function ConfirmDialog({ open, title, children, confirmLabel, danger, requireText, onConfirm, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = ref.current!
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function close() {
    if (busy) return
    setTyped('')
    setError(null)
    onClose()
  }

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
      setTyped('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La operación no se pudo completar.')
    } finally {
      setBusy(false)
    }
  }

  const blocked = requireText !== undefined && typed.trim().toLowerCase() !== requireText.toLowerCase()

  return (
    <dialog
      ref={ref}
      className="dialog confirm-dialog"
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
      onClick={(e) => {
        if (e.target === ref.current) close()
      }}
    >
      <div className="dialog-body">
        <h3 id="confirm-title">{title}</h3>
        <div className="confirm-text">{children}</div>
        {requireText !== undefined && (
          <div className="field">
            <label htmlFor="confirm-input">
              Escriba <b>{requireText}</b> para confirmar
            </label>
            <input
              id="confirm-input"
              autoComplete="off"
              spellCheck={false}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !blocked && !busy) confirm()
              }}
            />
          </div>
        )}
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="btn-secondary" onClick={close} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={confirm}
            disabled={blocked || busy}
          >
            {busy ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
