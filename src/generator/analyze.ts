// Cálculo de indicadores (equivale a analizar de generar_reporte.py).
import { fdate, isNum, ratio } from './format'
import type { Task } from './prepare'
import { parseDate } from './prepare'
import type { Filters } from './read'
import { count, groupBy, median, nunique, quantile, valueCounts } from './stats'

const DAY = 86_400_000
export const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/** Lunes = 0 … Domingo = 6 (como pandas .weekday) */
const weekday = (ms: number) => (new Date(ms).getUTCDay() + 6) % 7

export interface Week {
  ini: number
  fin: number
  label: string
  rango: string
  n: number
  finN: number
  tec: number
  cli: number
  parcial: boolean
  puntual: number
  variacion: number
}

export interface TechStats {
  resp: string
  n: number
  share: number
  fin: number
  pend: number
  ci: number
  dur: number
  puntual: number
  ret: number
  cli: number
  firma: number
  doc: number
}

export interface ChainStats {
  cadena: string
  n: number
  loc: number
  fin: number
  alta: number
  dur: number
  resp: number
}

export type Buckets = [string, number][]

const punctualRate = (ts: Task[], tol: number) => {
  const dv = ts.map((t) => t.desvio).filter(isNum)
  return ratio(dv.filter((v) => v <= tol).length, dv.length)
}

function buckets(values: (number | null)[], cuts: [number, number][], labels: string[]): Buckets {
  const s = values.filter(isNum)
  return cuts.map(([a, b], i) => [labels[i], s.filter((v) => v >= a && v < b).length])
}

export function analyze(tasks: Task[], filters: Filters, tolerancia: number) {
  const n = tasks.length
  const fechas = tasks.map((t) => t.fecha).filter(isNum)
  const ini = parseDate(filters.inicio ?? null, false) ?? Math.min(...fechas)
  const fin = parseDate(filters.fin ?? null, false) ?? Math.max(...fechas)
  if (!Number.isFinite(ini) || !Number.isFinite(fin)) throw new Error('No se pudo determinar el período del informe.')

  const finN = count(tasks, (t) => t.finalizada)
  const finished = tasks.filter((t) => t.finalizada)
  const dur = tasks.map((t) => t.duracion).filter(isNum)
  const dias = Math.max(1, Math.round((fin - ini) / DAY) + 1)
  const respPos = tasks.map((t) => t.respH).filter((h): h is number => isNum(h) && h >= 0)

  const R = {
    ini,
    fin,
    n,
    finN,
    pendN: n - finN,
    tasaFin: ratio(finN, n),
    tecnicos: nunique(tasks.map((t) => t.resp)),
    clientes: nunique(tasks.map((t) => t.cliente)),
    cadenas: nunique(tasks.map((t) => t.cadena)),
    dias,
    promDia: n / dias,
    ciRate: ratio(count(finished, (t) => t.checkin !== null), finished.length),
    coRate: ratio(count(finished, (t) => t.checkout !== null), finished.length),
    durMed: median(dur),
    durP75: quantile(dur, 0.75),
    durLargas: dur.filter((v) => v > 8 * 60).length,
    durCortas: dur.filter((v) => v < 5).length,
    puntual: punctualRate(tasks, tolerancia),
    retrasoMed: median(tasks.map((t) => t.retraso)),
    respMed: median(respPos),
    firmaRate: ratio(count(tasks, (t) => t.firma), n),
    sinGeo: count(tasks, (t) => t.sinGeo),
    sinGeoRate: ratio(count(tasks, (t) => t.sinGeo), n),
    gpsRate: ratio(count(tasks, (t) => t.distIn !== null), count(tasks, (t) => t.checkin !== null)),
    distMed: median(tasks.map((t) => t.distIn)),
    pendientesDoc: count(tasks, (t) => t.pendientes !== null),
    reincidentes: count(tasks, (t) => t.reincidente),
    prioridadAlta: ratio(count(tasks, (t) => t.prioridad === 'Alta'), n),
    tolerancia,
  }

  // ── Semanas (lunes a domingo)
  const semanas: Week[] = []
  for (let s = ini - weekday(ini) * DAY; s <= fin; s += 7 * DAY) {
    const sub = tasks.filter((t) => t.fecha !== null && t.fecha - weekday(t.fecha) * DAY === s)
    const e = Math.min(s + 6 * DAY, fin)
    const from = Math.max(s, ini)
    semanas.push({
      ini: s,
      fin: e,
      label: fdate(from),
      rango: `${fdate(from)} – ${fdate(e)}`,
      n: sub.length,
      finN: count(sub, (t) => t.finalizada),
      tec: nunique(sub.map((t) => t.resp)),
      cli: nunique(sub.map((t) => t.cliente)),
      parcial: Math.round((e - from) / DAY) < 6,
      puntual: punctualRate(sub, tolerancia),
      variacion: NaN,
    })
  }
  semanas.forEach((w, i) => {
    if (i > 0) w.variacion = ratio(w.n - semanas[i - 1].n, semanas[i - 1].n)
  })

  // ── Diario, día × hora, día de la semana
  const perDay = new Map<number, number>()
  for (const t of tasks) if (t.fecha !== null) perDay.set(t.fecha, (perDay.get(t.fecha) ?? 0) + 1)
  const diario: [string, number][] = []
  for (let d = ini; d <= fin; d += DAY) diario.push([fdate(d), perDay.get(d) ?? 0])

  const horas = Array.from({ length: 15 }, (_, i) => i + 6)
  const heat = DIAS.map(() => horas.map(() => 0))
  for (const t of tasks) {
    if (t.fecha === null || t.hora === null) continue
    const h = Math.min(Math.max(t.hora, horas[0]), horas[horas.length - 1])
    heat[weekday(t.fecha)][horas.indexOf(Math.trunc(h))]++
  }
  const porDiaSem: [string, number][] = DIAS.map((d, i) => [
    d,
    count(tasks, (t) => t.fecha !== null && weekday(t.fecha) === i),
  ])

  // ── Técnicos
  const tec: TechStats[] = groupBy(tasks, (t) => t.resp)
    .map(([resp, g]) => {
      const gf = g.filter((t) => t.finalizada)
      return {
        resp,
        n: g.length,
        share: g.length / n,
        fin: ratio(gf.length, g.length),
        pend: count(g, (t) => !t.finalizada),
        ci: ratio(count(gf, (t) => t.checkin !== null), gf.length),
        dur: median(g.map((t) => t.duracion)),
        puntual: punctualRate(g, tolerancia),
        ret: median(g.map((t) => t.retraso)),
        cli: nunique(g.map((t) => t.cliente)),
        firma: ratio(count(g, (t) => t.firma), g.length),
        doc: count(g, (t) => t.pendientes !== null),
      }
    })
    .sort((a, b) => b.n - a.n)

  // ── Cadenas de clientes
  const cad: ChainStats[] = groupBy(tasks, (t) => t.cadena)
    .map(([cadena, g]) => ({
      cadena,
      n: g.length,
      loc: nunique(g.map((t) => t.cliente)),
      fin: ratio(count(g, (t) => t.finalizada), g.length),
      alta: ratio(count(g, (t) => t.prioridad === 'Alta'), g.length),
      dur: median(g.map((t) => t.duracion)),
      resp: median(g.map((t) => t.respH).filter((h): h is number => isNum(h) && h >= 0)),
    }))
    .sort((a, b) => b.n - a.n)

  // ── Recurrencia
  const eqc = valueCounts(tasks.map((t) => t.equipo))
  const locc = valueCounts(tasks.map((t) => t.cliente))
  const tkc = valueCounts(tasks.map((t) => t.ticket))

  // ── Distribuciones
  const durBuckets = buckets(
    tasks.map((t) => t.duracion),
    [[0, 5], [5, 30], [30, 60], [60, 120], [120, 240], [240, 480], [480, 1e9]],
    ['< 5 min', '5–30 min', '30–60 min', '1–2 h', '2–4 h', '4–8 h', '> 8 h'],
  )
  const desvioBuckets = buckets(
    tasks.map((t) => t.desvio),
    [[-1e9, -60], [-60, 0], [0, tolerancia + 1e-9], [tolerancia + 1e-9, 60], [60, 180], [180, 1e9]],
    ['> 1 h antes', '< 1 h antes', `0–${tolerancia} min tarde`, `${tolerancia}–60 min`, '1–3 h tarde', '> 3 h tarde'],
  )
  const distBuckets = buckets(
    tasks.map((t) => t.distIn),
    [[0, 200], [200, 1000], [1000, 5000], [5000, 20000], [20000, 1e12]],
    ['< 200 m', '200 m–1 km', '1–5 km', '5–20 km', '> 20 km'],
  )
  distBuckets.push(['Sin GPS', count(tasks, (t) => t.checkin !== null && t.distIn === null)])
  const respBuckets = buckets(
    tasks.map((t) => t.respH),
    [[0, 4], [4, 24], [24, 72], [72, 168], [168, 1e9]],
    ['< 4 h', '4–24 h', '1–3 días', '3–7 días', '> 7 días'],
  )

  // ── Evidencias pendientes ("Foto, Firma" → una entrada por ítem)
  const pendDoc = valueCounts(
    tasks.flatMap((t) => (t.pendientes ? t.pendientes.split(',').map((p) => p.trim()) : [])),
  )

  // ── Tareas no finalizadas (ordenadas por fecha, sin fecha al final)
  const nf = tasks
    .filter((t) => !t.finalizada)
    .map((t) => ({ ...t, dias: t.fecha === null ? NaN : Math.floor((fin - t.fecha) / DAY) }))
    .sort((a, b) => (a.fecha ?? Infinity) - (b.fecha ?? Infinity))

  return {
    ...R,
    semanas,
    diario,
    heat: { values: heat, horas },
    porDiaSem,
    tipos: valueCounts(tasks.map((t) => t.tipo)),
    prioridades: valueCounts(tasks.map((t) => t.prioridad)),
    creador: valueCounts(tasks.map((t) => t.creador)),
    topClientes: locc.slice(0, 15),
    tec,
    cad,
    equiposRecurrentes: eqc.filter(([, c]) => c >= 3),
    equiposTotal: eqc.length,
    localesRecurrentes: locc.filter(([, c]) => c >= 5).length,
    tickets: tkc.length,
    ticketsMulti: tkc.filter(([, c]) => c > 1).length,
    durBuckets,
    desvioBuckets,
    distBuckets,
    respBuckets,
    pendDoc,
    nf,
    nfVencidas: count(nf, (t) => t.dias > 2),
    nfSinCi: count(nf, (t) => t.checkin === null),
  }
}

export type Analysis = ReturnType<typeof analyze>
