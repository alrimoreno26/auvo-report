import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { scrollToSection } from './scrollToSection'

interface Props {
  items: { id: string; label: string }[]
  /** Ruta del enlace "volver" (se muestra al inicio de las pestañas) */
  backTo?: string
  onDownloadPdf?: () => Promise<void>
}

/** Pestañas fijas con resaltado de la sección visible, enlace para volver y descarga del PDF. */
export function SectionNav({ items, backTo, onDownloadPdf }: Props) {
  const [active, setActive] = useState(items[0]?.id)
  const [pdfState, setPdfState] = useState<'idle' | 'working' | 'error'>('idle')

  useEffect(() => {
    function onScroll() {
      const y = scrollY + 80
      let current = items[0]?.id
      for (const { id } of items) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top + scrollY <= y) current = id
      }
      setActive(current)
    }
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [items])

  async function download() {
    if (!onDownloadPdf || pdfState === 'working') return
    setPdfState('working')
    try {
      await onDownloadPdf()
      setPdfState('idle')
    } catch (err) {
      console.error(err)
      setPdfState('error')
    }
  }

  return (
    <nav className="tabs">
      <div className="wrap">
        {backTo && (
          <Link to={backTo} className="tabs-back" title="Volver a todos los reportes">
            <span aria-hidden>←</span> Reportes
          </Link>
        )}
        {items.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className={id === active ? 'on' : undefined}
            onClick={(e) => {
              e.preventDefault()
              scrollToSection(id)
            }}
          >
            {label}
          </a>
        ))}
        {onDownloadPdf && (
          <button className="print" onClick={download} disabled={pdfState === 'working'} aria-live="polite">
            {pdfState === 'working' ? (
              <>
                <span className="spinner" aria-hidden /> Generando PDF…
              </>
            ) : pdfState === 'error' ? (
              'Reintentar PDF'
            ) : (
              <>
                <span aria-hidden>↓</span> Descargar PDF
              </>
            )}
          </button>
        )}
      </div>
    </nav>
  )
}
