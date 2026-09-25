import { Link, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { AlertTone, Kpi, PillTone, StackSegment, TableData } from '../types/report'
import { C, GAP, s } from './theme'
import { fnum } from '../generator/format'
import { pdfText } from './text'

type Style = Record<string, string | number>

export function SectionTitle({ n, title, lead }: { n: number; title: string; lead?: string }) {
  return (
    // Para no dejarlo solo al pie de una página, el documento lo agrupa con su primer bloque (Keep)
    <View style={{ marginTop: 6, marginBottom: 10, flexShrink: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <Text style={{ fontSize: 8, lineHeight: 1.6, fontWeight: 800, color: C.p2 }}>{String(n).padStart(2, '0')}</Text>
        <Text style={{ fontSize: 14, lineHeight: 1.25, fontWeight: 800, color: C.p }}>{title}</Text>
      </View>
      {lead && <Text style={{ fontSize: 8.5, lineHeight: 1.4, color: C.ink2, marginTop: 3, maxWidth: 440 }}>{pdfText(lead)}</Text>}
    </View>
  )
}

interface CardProps {
  title?: string
  subtitle?: string
  width?: number | string
  children: ReactNode
  /** Permitir que la tarjeta se divida entre páginas (tablas largas) */
  breakable?: boolean
  style?: Style
}

export function Card({ title, subtitle, width, children, breakable, style }: CardProps) {
  return (
    <View wrap={Boolean(breakable)} style={[s.card, width !== undefined ? { width } : {}, style ?? {}]}>
      {title && <Text style={s.cardTitle}>{pdfText(title)}</Text>}
      {subtitle ? <Text style={s.cardSub}>{pdfText(subtitle)}</Text> : title ? <View style={{ height: 8 }} /> : null}
      {children}
    </View>
  )
}

/** Negritas con **texto** */
export function Rich({ text, style }: { text: string; style?: Style }) {
  return (
    <Text style={style}>
      {pdfText(text)
        .split(/\*\*(.+?)\*\*/g)
        .map((part, i) =>
          i % 2 ? (
            <Text key={i} style={{ fontWeight: 700, color: C.ink }}>
              {part}
            </Text>
          ) : (
            part
          ),
        )}
    </Text>
  )
}

export function KpiGrid({ kpis, cols }: { kpis: Kpi[]; cols: number }) {
  const rows: Kpi[][] = []
  for (let i = 0; i < kpis.length; i += cols) rows.push(kpis.slice(i, i + cols))
  return (
    <View wrap={false} style={{ flexShrink: 0 }}>
      {rows.map((r, i) => (
        <View key={i} style={[s.row, { marginBottom: GAP }]}>
          {r.map((k) => (
            <View key={k.label} style={[s.card, { flex: 1, marginBottom: 0, paddingVertical: 10 }]}>
              <Text style={{ fontSize: 6.5, fontWeight: 700, letterSpacing: 0.6, color: C.ink2, textTransform: 'uppercase' }}>
                {pdfText(k.label)}
              </Text>
              <Text style={{ fontSize: cols > 4 ? 16 : 19, lineHeight: 1.2, fontWeight: 800, marginTop: 4, color: C.ink }}>{k.value}</Text>
              {k.note && <Text style={{ fontSize: 7, lineHeight: 1.35, color: C.muted, marginTop: 1 }}>{pdfText(k.note)}</Text>}
              {k.progress !== undefined && (
                <View style={{ height: 3.5, backgroundColor: C.surface, borderRadius: 2, marginTop: 7 }}>
                  <View style={{ width: `${k.progress}%`, height: 3.5, backgroundColor: C.p2, borderRadius: 2 }} />
                </View>
              )}
            </View>
          ))}
          {/* Completa la última fila para que las tarjetas mantengan su ancho */}
          {Array.from({ length: cols - r.length }, (_, j) => (
            <View key={`f${j}`} style={{ flex: 1 }} />
          ))}
        </View>
      ))}
    </View>
  )
}

const ALERT: Record<AlertTone, { border: string; bg: string; fg: string }> = {
  ok: { border: C.ok, bg: C.okBg, fg: C.ok },
  warn: { border: C.warn, bg: C.warnBg, fg: C.warn },
  info: { border: C.p2, bg: C.softer, fg: C.p },
}

export function AlertItem({ tone, tag, title, text }: { tone: AlertTone; tag: string; title: string; text: string }) {
  const t = ALERT[tone]
  return (
    <View
      wrap={false}
      style={{
        flexShrink: 0,
        flexDirection: 'row',
        gap: 10,
        borderWidth: 1,
        borderColor: C.line,
        borderLeftWidth: 3,
        borderLeftColor: t.border,
        borderRadius: 6,
        padding: 9,
        marginBottom: 6,
      }}
    >
      <View style={{ width: 74 }}>
        <Text
          style={{
            alignSelf: 'flex-start',
            fontSize: 6,
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: t.fg,
            backgroundColor: t.bg,
            borderRadius: 6,
            paddingVertical: 2,
            paddingHorizontal: 6,
          }}
        >
          {tag}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 9, lineHeight: 1.3, fontWeight: 700 }}>{pdfText(title)}</Text>
        <Text style={{ fontSize: 8, lineHeight: 1.4, color: C.ink2, marginTop: 1.5 }}>{pdfText(text)}</Text>
      </View>
    </View>
  )
}

export function StackBar({ segments }: { segments: StackSegment[] }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', height: 12, borderRadius: 4, overflow: 'hidden', gap: 1.5 }}>
        {segments
          .filter((sg) => sg.share > 0)
          .map((sg) => (
            <View key={sg.label} style={{ width: `${sg.share}%`, backgroundColor: sg.color }} />
          ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
        {segments.map((sg) => (
          <View key={sg.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: sg.color }} />
            <Text style={{ fontSize: 7.5, color: C.ink2 }}>
              {sg.label} <Text style={{ fontWeight: 700, color: C.ink }}>{fnum(sg.value)}</Text>{' '}
              <Text style={{ color: C.muted }}>{Math.round(sg.share)}%</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const PILL: Record<PillTone, { bg: string; fg: string }> = {
  ok: { bg: C.okBg, fg: C.ok },
  warn: { bg: C.warnBg, fg: C.warn },
  bad: { bg: C.badBg, fg: C.bad },
}

interface TableProps extends TableData {
  /** Ancho total de la tabla en puntos */
  width: number
  /** Peso relativo de cada columna (por defecto la primera es más ancha) */
  widths?: number[]
  fontSize?: number
}

/** Ancho medio de un carácter de Inter (proporción del tamaño de fuente), para recortar sin medir */
const CHAR_W = 0.56
const CELL_PAD = 4

/** Recorta el texto con "…" para que entre en una línea del ancho dado. */
function fit(text: string, width: number, fontSize: number, factor = CHAR_W) {
  const max = Math.max(3, Math.floor((width - CELL_PAD * 2) / (fontSize * factor)))
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + '…'
}

/**
 * Tabla con encabezado; las filas no se cortan entre páginas.
 * Cada celda ocupa una sola línea: react-pdf calcula mal la altura de las celdas con varias
 * líneas y eso descompagina el documento (filas encimadas o páginas comprimidas).
 */
export function Table({ columns, rows, width, widths, fontSize = 7.5 }: TableProps) {
  const w = widths ?? columns.map((_, i) => (i === 0 ? 2.2 : 1))
  const total = w.reduce((a, b) => a + b, 0)
  // Anchos explícitos en puntos: con anchos flexibles react-pdf mide el texto con otro ancho
  // que el que usa al dibujarlo, y las filas de varias líneas se enciman o descompaginan.
  const colW = (i: number) => (width * w[i]) / total
  // Interlineado propio: si no, las celdas heredan el de la página (9 pt × 1,4) y cada fila mide ~25 pt
  const lh = { lineHeight: 1.25 }
  const cellBox = (i: number): Style => ({
    width: colW(i),
    flexShrink: 0,
    paddingVertical: 3.5,
    paddingHorizontal: CELL_PAD,
  })
  const align = (i: number) => (columns[i]?.numeric ? 'right' : 'left')
  return (
    <View>
      {/* Alto fijo con lugar para dos líneas: los nombres de columna se ven completos
          sin depender de la medición de texto de varias líneas */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 20, borderBottomWidth: 1, borderBottomColor: C.line }}>
        {columns.map((c, i) => (
          <View key={i} style={[cellBox(i), { paddingVertical: 3 }]}>
            <Text style={{ lineHeight: 1.15, fontSize: 5.6, fontWeight: 700, letterSpacing: 0.2, color: C.ink2, textTransform: 'uppercase', textAlign: align(i) }}>
              {c.label}
            </Text>
          </View>
        ))}
      </View>
      {rows.map((row, r) => (
        <View
          key={r}
          wrap={false}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomWidth: 0.5,
            borderBottomColor: '#F1EEF8',
            backgroundColor: row.highlight ? '#FEF6E7' : r % 2 ? '#FCFBFE' : undefined,
          }}
        >
          {row.cells.map((cell, i) => {
            const color = cell.tone === 'pos' ? C.ok : cell.tone === 'neg' ? C.warn : C.ink
            let content: ReactNode
            if (cell.pill || cell.bar !== undefined) {
              // Píldora o mini barra: contenido corto en fila, alineado según la columna
              content = (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: columns[i]?.numeric ? 'flex-end' : 'flex-start' }}>
                  {cell.bar !== undefined && (
                    <View style={{ width: 26, height: 3.5, backgroundColor: C.grid, borderRadius: 2 }}>
                      <View style={{ width: `${cell.bar}%`, height: 3.5, backgroundColor: C.p2, borderRadius: 2 }} />
                    </View>
                  )}
                  {cell.pill ? (
                    <Text
                      style={{
                        ...lh,
                        fontSize: fontSize - 0.5,
                        fontWeight: 600,
                        color: PILL[cell.pill].fg,
                        backgroundColor: PILL[cell.pill].bg,
                        borderRadius: 6,
                        paddingVertical: 0.5,
                        paddingHorizontal: 5,
                      }}
                    >
                      {cell.text}
                    </Text>
                  ) : (
                    <Text style={{ ...lh, fontSize, color }}>{cell.text}</Text>
                  )}
                </View>
              )
            } else if (cell.href) {
              content = (
                <Link src={cell.href} style={{ ...lh, fontSize, color: C.p2, textDecoration: 'none', textAlign: align(i) }}>
                  {fit(cell.text, colW(i), fontSize)}
                </Link>
              )
            } else {
              content = (
                <Text style={{ ...lh, fontSize, color, textAlign: align(i) }}>
                  {fit(cell.note ? `${cell.text} ${cell.note}` : cell.text, colW(i), fontSize) === (cell.note ? `${cell.text} ${cell.note}` : cell.text) ? (
                    <>
                      {cell.text}
                      {cell.note && <Text style={{ color: C.muted }}> {cell.note}</Text>}
                    </>
                  ) : (
                    fit(cell.text, colW(i), fontSize)
                  )}
                </Text>
              )
            }
            return (
              <View key={i} style={cellBox(i)}>
                {content}
              </View>
            )
          })}
        </View>
      ))}
      {rows.length === 0 && <Text style={{ fontSize, color: C.muted, paddingVertical: 6 }}>Sin datos</Text>}
    </View>
  )
}

