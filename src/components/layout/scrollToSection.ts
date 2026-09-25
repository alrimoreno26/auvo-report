/** Desplazamiento suave a una sección sin agregar el ancla al historial. */
export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
