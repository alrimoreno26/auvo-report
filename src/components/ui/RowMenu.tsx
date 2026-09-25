import { useEffect, useRef, useState } from 'react'

export interface MenuAction {
  label: string
  onSelect: () => void
  /** Acción destructiva (se muestra en rojo) */
  danger?: boolean
  disabled?: boolean
}

const MENU_W = 180

/**
 * Menú "⋯" con acciones de una fila. Se cierra al elegir, con Esc, al hacer clic fuera o al desplazarse.
 * Se posiciona con `fixed` para no quedar recortado por contenedores con scroll (como las tablas).
 */
export function RowMenu({ actions, label }: { actions: MenuAction[]; label: string }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const open = pos !== null
  const setOpen = (value: boolean) => {
    if (!value) return setPos(null)
    const r = ref.current!.getBoundingClientRect()
    const height = actions.length * 36 + 12
    // Abre hacia arriba si no entra debajo
    const top = r.bottom + 4 + height > innerHeight ? r.top - 4 - height : r.bottom + 4
    setPos({ top, left: Math.max(8, r.right - MENU_W) })
  }

  useEffect(() => {
    if (!open) return
    const close = () => setPos(null)
    addEventListener('scroll', close, true)
    addEventListener('resize', close)
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      removeEventListener('scroll', close, true)
      removeEventListener('resize', close)
    }
  }, [open])

  if (!actions.length) return null

  return (
    <div className="row-menu" ref={ref}>
      <button
        type="button"
        className="row-menu-trigger"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        ⋯
      </button>
      {open && (
        <div className="row-menu-list" role="menu" style={{ top: pos.top, left: pos.left, width: MENU_W }}>
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              className={a.danger ? 'danger' : undefined}
              disabled={a.disabled}
              onClick={() => {
                setOpen(false)
                a.onSelect()
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
