// Medición aproximada de texto (Inter) para ajustar etiquetas de gráficos sin acceso al DOM,
// así sirve igual en la web (SVG) y en el PDF.

/** Ancho relativo al tamaño de fuente, por tipo de carácter (valores medidos sobre Inter). */
function charWidth(c: string) {
  if (c === ' ') return 0.28
  if (/[.,:;'’|!iIl]/.test(c)) return 0.3
  if (/[MWmw]/.test(c)) return 0.86
  if (/[A-ZÁÉÍÓÚÑÜ]/.test(c)) return 0.68
  if (/[0-9]/.test(c)) return 0.6
  return 0.55
}

/** Ancho estimado en px/pt de `text` con la fuente dada. */
export function textWidth(text: string, fontSize: number) {
  let w = 0
  for (const c of text) w += charWidth(c)
  return w * fontSize
}

/** Recorta con "…" para que el texto entre en `maxWidth`. */
export function fitText(text: string, maxWidth: number, fontSize: number) {
  if (textWidth(text, fontSize) <= maxWidth) return text
  const ellipsis = textWidth('…', fontSize)
  let out = ''
  let w = 0
  for (const c of text) {
    const cw = charWidth(c) * fontSize
    if (w + cw + ellipsis > maxWidth) break
    out += c
    w += cw
  }
  return out.trimEnd() + '…'
}

/**
 * Ancho de la columna de etiquetas de un gráfico de barras horizontales: el que necesita la
 * etiqueta más larga, entre un mínimo y un máximo (para no dejar las barras sin espacio).
 */
export function labelColumnWidth(labels: string[], fontSize: number, min: number, max: number) {
  const need = Math.max(0, ...labels.map((l) => textWidth(l, fontSize))) + 2
  return Math.round(Math.min(Math.max(need, min), max))
}
