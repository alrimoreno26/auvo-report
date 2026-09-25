/**
 * La fuente embebida (Inter latin) no incluye algunos símbolos del reporte:
 * se reemplazan por texto equivalente para que no aparezcan cuadros vacíos.
 */
export function pdfText(s: string) {
  return s
    .replace(/≤\s*/g, 'hasta ')
    .replace(/\s*→\s*/g, ' a ')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]️?/gu, '')
    .trim()
}
