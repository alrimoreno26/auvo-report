// Gráficos vectoriales para el PDF, dibujados a su tamaño final en puntos (sin escalar fuentes).
import { Circle, G, Line, Polygon, Polyline, Rect, Svg, Text } from '@react-pdf/renderer'
import { niceMax, TONE_COLOR } from '../components/charts/scale'
import { fnum } from '../generator/format'
import type { Bar } from '../types/report'
import { C } from './theme'

const FONT = { fontFamily: 'Inter', fontSize: 6.5 }
const VAL = { fontFamily: 'Inter', fontSize: 6.8, fontWeight: 700 }

const Label = ({ x, y, children, anchor = 'start', fill = C.muted, style = FONT }: {
  x: number
  y: number
  children: string
  anchor?: 'start' | 'middle' | 'end'
  fill?: string
  style?: Record<string, string | number>
}) => (
  <Text x={x} y={y} fill={fill} textAnchor={anchor} style={style}>
    {children}
  </Text>
)

function YGrid({ max, left, right, top, bottom }: { max: number; left: number; right: number; top: number; bottom: number }) {
  return (
    <G>
      {[0, 1, 2, 3, 4].map((k) => {
        const v = (max * k) / 4
        const y = bottom - (v / max) * (bottom - top)
        return (
          <G key={k}>
            <Line x1={left} x2={right} y1={y} y2={y} stroke={C.grid} strokeWidth={0.6} />
            <Label x={left - 5} y={y + 2.2} anchor="end">
              {fnum(v)}
            </Label>
          </G>
        )
      })}
    </G>
  )
}

/** Recorta una etiqueta para que entre en `width` puntos (estimación por ancho medio de carácter). */
function fitLabel(label: string, width: number, fontSize = 6.5) {
  const max = Math.max(4, Math.floor(width / (fontSize * 0.5)))
  return label.length <= max ? label : label.slice(0, max - 1).trimEnd() + '…'
}

/** Barras horizontales (ranking). */
export function PdfHBar({ bars, width, labelWidth = 92, rowHeight = 15 }: { bars: Bar[]; width: number; labelWidth?: number; rowHeight?: number }) {
  if (!bars.length) return <Svg style={{ flexShrink: 0 }} width={width} height={14}><Label x={0} y={9}>Sin datos</Label></Svg>
  const x0 = labelWidth + 6
  const maxBar = width - x0 - 34
  const max = Math.max(...bars.map((b) => b.value), 1)
  const barH = Math.min(8, rowHeight - 6)
  return (
    <Svg style={{ flexShrink: 0 }} width={width} height={bars.length * rowHeight + 2}>
      {bars.map((b, i) => {
        const y = i * rowHeight + 1
        const w = Math.max(1.5, (b.value / max) * maxBar)
        const mid = y + rowHeight / 2 + 2.2
        return (
          <G key={b.label}>
            <Label x={labelWidth} y={mid} anchor="end" fill={C.ink2}>
              {fitLabel(b.label, labelWidth)}
            </Label>
            <Rect x={x0} y={y + (rowHeight - barH) / 2} width={w} height={barH} rx={2} fill={TONE_COLOR[b.tone]} />
            <Label x={x0 + w + 4} y={mid} fill={C.ink} style={VAL}>
              {b.display}
            </Label>
          </G>
        )
      })}
    </Svg>
  )
}

/** Parte una etiqueta en dos líneas si no entra en el ancho disponible (por el espacio más central). */
function splitLabel(label: string, width: number, fontSize = 6.5): string[] {
  if (label.length * fontSize * 0.52 <= width || !label.includes(' ')) return [label]
  const spaces = [...label.matchAll(/ /g)].map((m) => m.index!)
  const mid = label.length / 2
  const at = spaces.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a))
  return [label.slice(0, at), label.slice(at + 1)]
}

/** Columnas verticales (distribuciones). */
export function PdfColumns({ bars, width, height = 120 }: { bars: Bar[]; width: number; height?: number }) {
  if (!bars.length) return <Svg style={{ flexShrink: 0 }} width={width} height={14}><Label x={0} y={9}>Sin datos</Label></Svg>
  const top = 14
  const base = height - 24
  const slot = width / bars.length
  const bw = Math.min(28, slot * 0.6)
  const max = Math.max(...bars.map((b) => b.value), 1)
  return (
    <Svg style={{ flexShrink: 0 }} width={width} height={height}>
      <Line x1={0} x2={width} y1={base} y2={base} stroke={C.grid} strokeWidth={0.6} />
      {bars.map((b, i) => {
        const cx = slot * i + slot / 2
        const h = Math.max(1.5, (b.value / max) * (base - top))
        return (
          <G key={b.label}>
            <Rect x={cx - bw / 2} y={base - h} width={bw} height={h} rx={2} fill={TONE_COLOR[b.tone]} />
            <Label x={cx} y={base - h - 3.5} anchor="middle" fill={C.ink} style={VAL}>
              {b.display}
            </Label>
            {splitLabel(b.label, slot - 3).map((line, j) => (
              <Label key={j} x={cx} y={base + 10 + j * 7.5} anchor="middle">
                {line}
              </Label>
            ))}
          </G>
        )
      })}
    </Svg>
  )
}

interface WeekPoint {
  label: string
  created: number
  finished: number
  partial?: boolean
}

/** Creadas (barras) vs. finalizadas (línea) por semana. */
export function PdfWeekly({ points, width, height = 150 }: { points: WeekPoint[]; width: number; height?: number }) {
  if (!points.length) return null
  const L = 26
  const R = width - 4
  const top = 8
  const base = height - 24
  const max = niceMax(Math.max(...points.map((p) => Math.max(p.created, p.finished))))
  const slot = (R - L) / points.length
  const bw = Math.min(24, slot * 0.62)
  const y = (v: number) => base - (v / max) * (base - top)
  const cx = (i: number) => L + slot * (i + 0.5)
  return (
    <Svg style={{ flexShrink: 0 }} width={width} height={height}>
      <YGrid max={max} left={L} right={R} top={top} bottom={base} />
      {points.map((p, i) => (
        <G key={p.label}>
          <Rect
            x={cx(i) - bw / 2}
            y={y(p.created)}
            width={bw}
            height={base - y(p.created)}
            rx={2}
            fill={C.soft}
            {...(p.partial ? { stroke: '#A78BFA', strokeWidth: 0.8, strokeDasharray: '2 1.5' } : {})}
          />
          <Label x={cx(i)} y={base + 9} anchor="middle">
            {p.label}
          </Label>
          {p.partial && (
            <Label x={cx(i)} y={base + 17} anchor="middle" style={{ ...FONT, fontSize: 5.5 }}>
              (parcial)
            </Label>
          )}
        </G>
      ))}
      <Polyline
        points={points.map((p, i) => `${cx(i)},${y(p.finished)}`).join(' ')}
        stroke={C.p2}
        strokeWidth={1.4}
        fill="none"
      />
      {points.map((p, i) => (
        <Circle key={p.label} cx={cx(i)} cy={y(p.finished)} r={2.4} fill={C.p2} stroke="#FFFFFF" strokeWidth={1} />
      ))}
    </Svg>
  )
}

/** Serie diaria con área. */
export function PdfArea({ points, width, height = 110 }: { points: { label: string; value: number }[]; width: number; height?: number }) {
  if (!points.length) return null
  const L = 26
  const R = width - 4
  const top = 6
  const base = height - 14
  const max = niceMax(Math.max(...points.map((p) => p.value)))
  const dx = (R - L) / Math.max(points.length - 1, 1)
  const x = (i: number) => L + i * dx
  const y = (v: number) => base - (v / max) * (base - top)
  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')
  const every = Math.max(1, Math.floor(points.length / 12))
  return (
    <Svg style={{ flexShrink: 0 }} width={width} height={height}>
      <YGrid max={max} left={L} right={R} top={top} bottom={base} />
      <Polygon points={`${L},${base} ${line} ${R},${base}`} fill={C.p2} fillOpacity={0.1} />
      <Polyline points={line} stroke={C.p2} strokeWidth={1.2} fill="none" />
      {points.map((p, i) =>
        i % every === 0 ? (
          <Label key={p.label} x={x(i)} y={base + 10} anchor="middle">
            {p.label}
          </Label>
        ) : null,
      )}
    </Svg>
  )
}

const SEQ = ['#E1D5FB', '#C9B3F6', '#AE8BF0', '#9263E8', '#7B39EC', '#6528D0', '#4E1E9A']

/** Mapa de calor día × hora. */
export function PdfHeatmap({ days, hours, values, width }: { days: string[]; hours: number[]; values: number[][]; width: number }) {
  const X0 = 24
  const top = 12
  const gap = 1.5
  const cw = (width - X0) / hours.length - gap
  const ch = 13
  const max = Math.max(...values.flat(), 1)
  return (
    <Svg style={{ flexShrink: 0 }} width={width} height={top + days.length * (ch + gap) + 2}>
      {hours.map((h, j) => (
        <Label key={h} x={X0 + j * (cw + gap) + cw / 2} y={8} anchor="middle">
          {`${h}h`}
        </Label>
      ))}
      {days.map((d, i) => {
        const y = top + i * (ch + gap)
        return (
          <G key={d}>
            <Label x={X0 - 5} y={y + ch / 2 + 2.2} anchor="end">
              {d}
            </Label>
            {hours.map((h, j) => {
              const v = values[i][j]
              const t = v / max
              const level = v === 0 ? -1 : Math.min(SEQ.length - 1, Math.floor((SEQ.length - 1) * t))
              const x = X0 + j * (cw + gap)
              return (
                <G key={h}>
                  <Rect x={x} y={y} width={cw} height={ch} rx={2} fill={level < 0 ? '#FAF8FE' : SEQ[level]} />
                  {t >= 0.35 && (
                    <Label x={x + cw / 2} y={y + ch / 2 + 2.2} anchor="middle" fill={level >= 3 ? '#FFFFFF' : C.ink} style={VAL}>
                      {String(v)}
                    </Label>
                  )}
                </G>
              )
            })}
          </G>
        )
      })}
    </Svg>
  )
}
