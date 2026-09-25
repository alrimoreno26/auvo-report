import { Font, StyleSheet } from '@react-pdf/renderer'
import inter400 from '@fontsource/inter/files/inter-latin-400-normal.woff?url'
import inter500 from '@fontsource/inter/files/inter-latin-500-normal.woff?url'
import inter600 from '@fontsource/inter/files/inter-latin-600-normal.woff?url'
import inter700 from '@fontsource/inter/files/inter-latin-700-normal.woff?url'
import inter800 from '@fontsource/inter/files/inter-latin-800-normal.woff?url'

Font.register({
  family: 'Inter',
  fonts: [
    { src: inter400, fontWeight: 400 },
    { src: inter500, fontWeight: 500 },
    { src: inter600, fontWeight: 600 },
    { src: inter700, fontWeight: 700 },
    { src: inter800, fontWeight: 800 },
  ],
})
// Sin guiones automáticos: cortar nombres propios queda mal
Font.registerHyphenationCallback((word) => [word])

export const C = {
  gradA: '#7B39EC',
  gradMid: '#5B21B6',
  gradB: '#4E1E9A',
  p: '#5B21B6',
  p2: '#7C3AED',
  soft: '#DDD6FE',
  softer: '#EDE9FE',
  surface: '#F6F3FC',
  card: '#FFFFFF',
  ink: '#221D2E',
  ink2: '#5B5670',
  muted: '#8E88A3',
  line: '#E8E3F3',
  grid: '#EEEAF6',
  warn: '#B45309',
  warnBg: '#FEF1DA',
  ok: '#15803D',
  okBg: '#DCFCE7',
  bad: '#B91C1C',
  badBg: '#FEE2E2',
}

// A4 en puntos
export const PAGE = { width: 595.28, height: 841.89, margin: 36 }
export const CONTENT_W = PAGE.width - PAGE.margin * 2
export const GAP = 10
export const HALF_W = (CONTENT_W - GAP) / 2
export const CARD_PAD = 12
/** Ancho útil dentro de una tarjeta de ancho `width` (padding + borde) */
export const cardInner = (width: number) => width - CARD_PAD * 2 - 2

export const s = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: C.ink,
    backgroundColor: '#FFFFFF',
    paddingTop: 62,
    paddingBottom: 50,
    paddingHorizontal: PAGE.margin,
    // Sin lineHeight a nivel de página: react-pdf lo hereda como valor absoluto (descompagina
    // tablas) y hace desaparecer el número de página. Cada párrafo define el suyo.
  },
  row: { flexDirection: 'row', gap: GAP, flexShrink: 0 },
  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    padding: CARD_PAD,
    marginBottom: GAP,
    flexShrink: 0,
  },
  cardTitle: { fontSize: 9.5, fontWeight: 700, color: C.ink },
  cardSub: { fontSize: 7.5, lineHeight: 1.35, color: C.muted, marginTop: 1, marginBottom: 8 },
  muted: { color: C.muted },
})
