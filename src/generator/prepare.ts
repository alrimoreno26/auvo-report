// Normalización de cada fila del Excel (equivale a preparar de generar_reporte.py).
// Las fechas se manejan como milisegundos UTC "ingenuos" (sin zona horaria), igual que pandas.
import type { Row } from './read'

export interface Task {
  codigo: string
  registro: number | null
  /** Día programado (medianoche) */
  fecha: number | null
  hora: number | null
  tipo: string
  creador: string
  resp: string
  cliente: string
  cadena: string
  prioridad: string
  finalizada: boolean
  checkin: number | null
  checkout: number | null
  distIn: number | null
  duracion: number | null
  retraso: number | null
  avance: number | null
  /** Minutos respecto al horario programado (+ tarde / − antes) */
  desvio: number | null
  firma: boolean
  pendientes: string | null
  reincidente: boolean
  equipo: string | null
  ticket: string | null
  sinGeo: boolean
  os: string | null
  /** Horas desde el registro hasta el check-in */
  respH: number | null
}

const get = (r: Row, name: string) => {
  const v = r[name]
  return v === undefined || v === null || v.trim() === '' ? null : v.trim()
}

/** "dd/mm/yyyy" o "dd/mm/yyyy HH:MM[:SS]" → ms UTC */
export function parseDate(s: string | null, withTime: boolean): number | null {
  if (!s) return null
  const m = withTime
    ? s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::\d{2})?$/)
    : s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const [, d, mo, y, h = '0', mi = '0'] = m
  const t = Date.UTC(+y, +mo - 1, +d, +h, +mi)
  // Descarta fechas imposibles (31/02 → 03/03)
  return new Date(t).getUTCDate() === +d ? t : null
}

const dateTime = (date: string | null, time: string | null) => (date && time ? parseDate(`${date} ${time}`, true) : null)

/** "HH:MM:SS" (HH puede ser > 24) → minutos */
export function toMinutes(v: string | null): number | null {
  const m = v?.match(/^(-?\d+):(\d{1,2})(?::(\d{1,2}))?$/)
  if (!m) return null
  return +m[1] * 60 + +m[2] + +(m[3] ?? 0) / 60
}

/** "2.250.820,00" | "4500" | "4.500" → número; negativo (-100 = sin GPS) → null */
export function toNumber(v: string | null): number | null {
  if (!v) return null
  let s = v
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '')
  const x = Number(s)
  if (s === '' || Number.isNaN(x)) return null
  return x < 0 ? null : x
}

const yes = (v: string | null) => ['sí', 'si', 'yes', 'true'].includes((v ?? '').toLowerCase())

function groupTokens(g: string | null): string[] {
  if (!g) return []
  return g
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.match(/^(?:Á|A)rea\s*\d*\s*-\s*(.+)$/i)?.[1].trim() ?? p)
}

/** Grupo principal de cada fila: el token más frecuente del export.
 *  'GTA, Área 1 - GTA, Super del Barrio' → 'GTA' · 'TACO BELL GT, Area 8 - Tacobell' → 'TACO BELL GT' */
function clientChains(groups: (string | null)[]): string[] {
  const tokens = groups.map(groupTokens)
  const freq = new Map<string, number>()
  for (const ts of tokens) for (const t of new Set(ts)) freq.set(t, (freq.get(t) ?? 0) + 1)
  return tokens.map((ts) => {
    if (!ts.length) return 'Sin grupo'
    // max() de Python: el primero con mayor (frecuencia, longitud)
    let best = ts[0]
    for (const t of ts) {
      const [fb, ft] = [freq.get(best)!, freq.get(t)!]
      if (ft > fb || (ft === fb && t.length > best.length)) best = t
    }
    return best
  })
}

export function prepare(rows: Row[]): Task[] {
  const chains = clientChains(rows.map((r) => get(r, 'Grupo de clientes')))

  return rows.map((r, i) => {
    const fechaTxt = get(r, 'Fecha')
    const horaTxt = get(r, 'Hora')
    const registro = parseDate(get(r, 'Fecha de registro de la tarea'), true)
    const checkin = dateTime(get(r, 'Fecha check-in'), get(r, 'Hora check-in'))
    const retraso = toMinutes(get(r, 'Retraso'))
    const avance = toMinutes(get(r, 'Avanzando'))
    const hora = horaTxt ? Number(horaTxt.slice(0, 2)) : NaN
    const lat = Number(get(r, 'Latitud')?.replace(',', '.'))
    const os = get(r, 'OS Digital')

    return {
      codigo: get(r, 'Código') ?? '',
      registro,
      fecha: parseDate(fechaTxt, false),
      hora: Number.isNaN(hora) ? null : hora,
      tipo: get(r, 'Tipo de tarea') ?? 'Sin tipo',
      creador: get(r, 'Tarea de') ?? '—',
      resp: get(r, 'Responsable') ?? 'Sin responsable',
      cliente: get(r, 'Cliente') ?? 'Sin cliente',
      cadena: chains[i],
      prioridad: get(r, 'Prioridad') ?? 'Sin prioridad',
      finalizada: yes(get(r, 'Finalizada')),
      checkin,
      checkout: dateTime(get(r, 'Fecha check-out'), get(r, 'Hora check-out')),
      distIn: toNumber(get(r, 'Distancia del check-in')),
      duracion: toMinutes(get(r, 'Duración')),
      retraso,
      avance,
      desvio: retraso ?? (avance === null ? null : -avance),
      firma: ['sí', 'si'].includes((get(r, 'Firma') ?? '').toLowerCase()),
      pendientes: get(r, 'Pendientes'),
      reincidente: /reincid/i.test(get(r, 'Palabras Claves') ?? ''),
      equipo: get(r, 'Equipos'),
      ticket: get(r, 'Ticket'),
      sinGeo: Number.isNaN(lat) || lat === 0,
      os: os?.startsWith('http') ? os : null,
      respH: checkin !== null && registro !== null ? (checkin - registro) / 3_600_000 : null,
    }
  })
}
