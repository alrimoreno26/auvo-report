import { useEffect, useRef } from 'react'

/** Tooltip único que sigue al cursor sobre cualquier elemento con `data-tip`. */
export function Tooltip() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tip = ref.current!
    function onMove(e: MouseEvent) {
      const target = (e.target as Element).closest?.('[data-tip]')
      if (!target) {
        tip.style.opacity = '0'
        return
      }
      tip.textContent = target.getAttribute('data-tip')
      tip.style.opacity = '1'
      let x = e.clientX + 14
      let y = e.clientY + 14
      if (x + tip.offsetWidth > innerWidth - 8) x = e.clientX - tip.offsetWidth - 14
      if (y + tip.offsetHeight > innerHeight - 8) y = e.clientY - tip.offsetHeight - 14
      tip.style.left = `${x}px`
      tip.style.top = `${y}px`
    }
    const hide = () => {
      tip.style.opacity = '0'
    }
    document.addEventListener('mousemove', onMove)
    addEventListener('scroll', hide, { passive: true })
    return () => {
      document.removeEventListener('mousemove', onMove)
      removeEventListener('scroll', hide)
    }
  }, [])

  return <div ref={ref} className="tip" />
}
