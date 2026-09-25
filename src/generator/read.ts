// Lectura del "Informe de Tareas" (equivale a leer_excel de generar_reporte.py).
// El export de la plataforma es un HTML con extensión .xls; también se aceptan .xls/.xlsx reales.
import type { WorkBook } from 'xlsx'

export type Row = Record<string, string | null>

export interface Filters {
  /** dd/mm/yyyy */
  inicio?: string
  fin?: string
}

export interface ParsedSheet {
  rows: Row[]
  filters: Filters
}

type Grid = unknown[][]

const clean = (s: string) => s.replace(/\s+/g, ' ').trim()
const pad = (n: number) => String(n).padStart(2, '0')

/** Tablas de un HTML como grillas de texto, expandiendo colspan (como pandas.read_html). */
export function htmlTables(html: string): (string | null)[][][] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return [...doc.querySelectorAll('table')].map((table) =>
    [...table.querySelectorAll('tr')].map((tr) =>
      [...tr.querySelectorAll('th,td')].flatMap((cell) => {
        const text = clean(cell.textContent ?? '')
        const span = Number(cell.getAttribute('colspan')) || 1
        return Array<string | null>(span).fill(text || null)
      }),
    ),
  )
}

function findFilters(text: string): Filters {
  const f: Filters = {}
  const ini = text.match(/Fecha de inicio\s*:\s*(\d{2}\/\d{2}\/\d{4})/)
  if (ini) f.inicio = ini[1]
  const fin = text.match(/Fecha finalizaci(?:&#243;|ó|.)n\s*:\s*(\d{2}\/\d{2}\/\d{4})/)
  if (fin) f.fin = fin[1]
  return f
}

// Columnas con fecha, hora o duración: en un libro de Excel pueden venir tipadas en lugar de como texto
const DATE_COLS = new Set(['Fecha', 'Fecha check-in', 'Fecha check-out'])
const DATETIME_COLS = new Set(['Fecha de registro de la tarea', 'Recibo', 'Visualización'])
const TIME_COLS = new Set(['Hora', 'Hora check-in', 'Hora check-out'])
const DURATION_COLS = new Set(['Duración', 'Retraso', 'Avanzando'])

const EXCEL_EPOCH = Date.UTC(1899, 11, 30)
const DAY_MS = 86_400_000

/** Fracción de día (0,479 → 11:30) como "HH:MM" o "HH:MM:SS"; las horas pueden superar 24 */
function clock(days: number, seconds: boolean) {
  const secs = Math.round(days * 86_400)
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return seconds ? `${pad(h)}:${pad(m)}:${pad(secs % 60)}` : `${pad(h)}:${pad(m)}`
}

function dateText(ms: number, withTime: boolean) {
  // Excel guarda fecha+hora como decimal: 11:10 puede volver como 11:09:59.999
  const v = new Date(Math.round(ms / 60_000) * 60_000)
  const date = `${pad(v.getUTCDate())}/${pad(v.getUTCMonth() + 1)}/${v.getUTCFullYear()}`
  return withTime ? `${date} ${pad(v.getUTCHours())}:${pad(v.getUTCMinutes())}` : date
}

/** Valor de una celda → texto con los formatos que espera el generador (dd/mm/yyyy, HH:MM, HH:MM:SS). */
function cellText(v: unknown, column: string): string | null {
  if (v === null || v === undefined || v === '') return null
  const isTime = TIME_COLS.has(column)
  const isDuration = DURATION_COLS.has(column)

  if (v instanceof Date) {
    const days = (v.getTime() - EXCEL_EPOCH) / DAY_MS
    // Horas y duraciones puras llegan como fechas cercanas a la época de Excel (1899-12-30)
    if (isTime || isDuration || v.getUTCFullYear() < 1900) return clock(days, isDuration)
    const hasTime = v.getUTCHours() !== 0 || v.getUTCMinutes() !== 0
    return dateText(v.getTime(), DATETIME_COLS.has(column) || (!DATE_COLS.has(column) && hasTime))
  }

  if (typeof v === 'number') {
    if (isTime || isDuration) return clock(v, isDuration)
    // Número de serie de Excel en una columna de fecha (46204 = 01/07/2026)
    if ((DATE_COLS.has(column) || DATETIME_COLS.has(column)) && v > 20000 && v < 80000) {
      return dateText(EXCEL_EPOCH + v * DAY_MS, DATETIME_COLS.has(column))
    }
    return String(v)
  }

  return clean(String(v)) || null
}

/** A partir de la fila con "Código": encabezados + filas cuyo Código es numérico. */
function toRows(grid: Grid): { rows: Row[]; headerIndex: number } {
  const text = (c: unknown) => String(c ?? '').trim()
  const headerIndex = grid.findIndex((r) => r.some((c) => text(c) === 'Código'))
  if (headerIndex < 0) throw new Error('No se encontró la columna «Código». ¿Es un Informe de Tareas?')
  const header = grid[headerIndex].map(text)
  const rows: Row[] = []
  for (const r of grid.slice(headerIndex + 1)) {
    const row: Row = {}
    header.forEach((h, i) => {
      if (h && !(h in row)) row[h] = cellText(r[i], h)
    })
    const code = row['Código']
    if (code !== null && code !== undefined && code.trim() !== '' && !Number.isNaN(Number(code))) rows.push(row)
  }
  return { rows, headerIndex }
}

async function readWorkbook(buf: ArrayBuffer): Promise<WorkBook> {
  const XLSX = await import('xlsx')
  return XLSX.read(buf, { type: 'array', cellDates: true, UTC: true })
}

export async function readTaskReport(file: Blob): Promise<ParsedSheet> {
  const buf = await file.arrayBuffer()
  const head = new TextDecoder('latin1').decode(buf.slice(0, 2048)).toLowerCase()

  if (/<table|<meta|<style|<html/.test(head)) {
    const html = new TextDecoder('utf-8').decode(buf)
    const tables = htmlTables(html)
    if (!tables.length) throw new Error('El archivo no contiene tablas.')
    const largest = tables.reduce((a, b) => (b.length > a.length ? b : a))
    return { rows: toRows(largest).rows, filters: findFilters(html) }
  }

  const XLSX = await import('xlsx')
  const wb = await readWorkbook(buf)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const grid: Grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: null, blankrows: false })
  const { rows, headerIndex } = toRows(grid)
  const above = grid
    .slice(0, headerIndex)
    .flat()
    .filter((c) => c !== null && c !== '')
    .map(String)
    .join('\n')
  return { rows, filters: findFilters(above) }
}
