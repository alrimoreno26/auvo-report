import { useState } from 'react'

/** Enlace de acceso con botón para copiarlo (cuando el correo no se pudo enviar). */
export function AccessLinkBox({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="access-link">
      <code title={link}>{link}</code>
      <button
        type="button"
        className="btn-secondary"
        onClick={async () => {
          await navigator.clipboard.writeText(link)
          setCopied(true)
        }}
      >
        {copied ? '✓ Copiado' : 'Copiar'}
      </button>
    </div>
  )
}
