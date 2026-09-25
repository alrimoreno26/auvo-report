import { useEffect, useState } from 'react'
import { scrollToSection } from './scrollToSection'

interface Props {
  items: { id: string; label: string }[]
}

/** Pestañas fijas con resaltado de la sección visible y botón de impresión. */
export function SectionNav({ items }: Props) {
  const [active, setActive] = useState(items[0]?.id)

  useEffect(() => {
    function onScroll() {
      const y = scrollY + 80
      let current = items[0]?.id
      for (const { id } of items) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= y) current = id
      }
      setActive(current)
    }
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [items])

  return (
    <nav className="tabs">
      <div className="wrap">
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
        <button className="print" onClick={() => print()}>
          Imprimir / PDF
        </button>
      </div>
    </nav>
  )
}
