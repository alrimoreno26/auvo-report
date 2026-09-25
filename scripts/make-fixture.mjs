#!/usr/bin/env node
// Genera un "Informe de Tareas" sintético con el formato del export de la plataforma
// (HTML con extensión .xls) y los valores esperados de los indicadores principales,
// calculados de forma independiente del generador, para validarlo.
//
// Uso: node scripts/make-fixture.mjs [salida.xls]   (por defecto data/fixtures/informe_tareas_prueba.xls)
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const out = process.argv[2] ?? 'data/fixtures/informe_tareas_prueba.xls'

// PRNG determinista (mulberry32) para que el archivo sea siempre el mismo
let seed = 42
const rand = () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pick = (xs) => xs[Math.floor(rand() * xs.length)]
const weighted = (pairs) => {
  const total = pairs.reduce((s, [, w]) => s + w, 0)
  let r = rand() * total
  for (const [v, w] of pairs) if ((r -= w) < 0) return v
  return pairs[pairs.length - 1][0]
}

const pad = (n) => String(n).padStart(2, '0')
const DAY = 86_400_000
const fmtDate = (ms) => {
  const d = new Date(ms)
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`
}
const fmtTime = (ms) => {
  const d = new Date(ms)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}
const fmtDur = (mins) => {
  const s = Math.round(mins * 60)
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}
const fmtDist = (m) => (m < 0 ? '-100' : Math.round(m).toLocaleString('de-DE'))

const INI = Date.UTC(2026, 6, 1) // 01/07/2026
const FIN = Date.UTC(2026, 8, 24) // 24/09/2026
const TOL = 15

const RESP = [
  ['Demetrio P', 8], ['Alberto Lopez', 4], ['Jerardino', 4], ['Dimas Suruy', 3], ['Felix García', 2],
  ['Fernando', 2], ['Emerson Reyes', 1], ['Eliseo Hernandez', 1], ['Luis A', 1], ['David', 1],
]
const TIPOS = [
  ['ATG - Diagnóstico / Reparación', 57], ['TERC - Diagnostico / Reparacion Refrigeración', 30],
  ['ATG - Diagnóstico/Reparación refrigeración', 8], ['TERC - Diagnóstico/Reparación', 3], ['Mantenimiento Varios TB', 2],
]
const GRUPOS = [
  ['TACO BELL GT, Area 8 - Tacobell', 'TB', 35], ['GTA, Área 1 - GTA, Super del Barrio', 'GTA', 28],
  ['PIZZA HUT GT', 'PH', 18], ['', 'Local', 17], ['SUMA', 'SUMA', 2],
]
const CREADORES = [['Admin Principal', 85], ['Cristopher Tumax', 14], ['Soporte ODOO', 1]]

const rows = []
const expected = { n: 0, finalizadas: 0, conCheckinFinalizadas: 0, desvios: 0, puntuales: 0, firmas: 0 }

for (let i = 0; i < 480; i++) {
  const fecha = INI + Math.floor(rand() * ((FIN - INI) / DAY + 1)) * DAY
  const hora = weighted([[7, 1], [8, 4], [9, 6], [10, 8], [11, 6], [12, 4], [13, 3], [14, 4], [15, 3], [16, 2], [17, 1], [19, 1]])
  const programada = fecha + hora * 3_600_000 + pick([0, 0, 30]) * 60_000
  const registro = programada - Math.floor(rand() * 72) * 3_600_000 - 20 * 60_000
  const finalizada = rand() < 0.93 || fecha < FIN - 20 * DAY
  const conCheckin = finalizada ? rand() < 0.95 : rand() < 0.2
  // desvío: mayoría llega tarde, algunos antes
  const desvio = weighted([[-90, 1], [-30, 1], [8, 1], [40, 2], [120, 3], [260, 2]]) + Math.round(rand() * 20 - 10)
  const checkin = conCheckin ? programada + desvio * 60_000 : null
  const dur = conCheckin ? weighted([[3, 0.4], [18, 2.5], [45, 1.7], [90, 1.7], [180, 1], [360, 0.7], [700, 1.5]]) + Math.round(rand() * 8) : null
  const conCheckout = conCheckin && rand() < 0.97
  const checkout = conCheckout ? checkin + dur * 60_000 : null
  const gps = conCheckin && rand() < 0.65
  const dist = gps ? weighted([[500, 1], [3000, 9], [9000, 5], [40000, 6]]) * (0.5 + rand()) : -1
  const [grupo, prefijo] = weighted(GRUPOS.map((g) => [g, g[2]]))
  const cliente = `${prefijo} ${pick(['Zona 1', 'Zona 4', 'Fraijanes', 'Naranjo', 'Oakland', 'Cayala', 'Miraflores', 'Portales', 'Pradera', 'Interplaza'])}`
  const firma = rand() < 0.015
  const pendientes = rand() < 0.055 ? pick(['Foto', 'Foto', 'Foto', 'Check - list Refrigeración', 'Repuesto ATG', 'Foto, Reporte de gastos']) : ''
  const equipo = rand() < 0.5 ? `${prefijo}${pad(Math.floor(rand() * 40))}-04-0${1 + Math.floor(rand() * 2)} - Panera` : ''
  const retraso = conCheckin && desvio > 0 ? fmtDur(desvio) : ''
  const avanzando = conCheckin && desvio <= 0 ? fmtDur(-desvio) : ''

  expected.n++
  if (finalizada) {
    expected.finalizadas++
    if (conCheckin) expected.conCheckinFinalizadas++
  }
  if (conCheckin) {
    expected.desvios++
    if (desvio <= TOL) expected.puntuales++
  }
  if (firma) expected.firmas++

  rows.push([
    String(4600000 + i * 131),
    `${fmtDate(registro)} ${fmtTime(registro)}`,
    fmtDate(fecha),
    fmtTime(programada),
    weighted(TIPOS),
    weighted(CREADORES),
    weighted(RESP),
    cliente,
    grupo,
    weighted([['Alta', 68], ['Media', 31], ['Baja', 1]]),
    finalizada ? 'Sí' : 'No',
    checkin ? fmtDate(checkin) : '',
    checkin ? fmtTime(checkin) : '',
    checkout ? fmtDate(checkout) : '',
    checkout ? fmtTime(checkout) : '',
    conCheckin ? fmtDist(dist) : '',
    conCheckout ? fmtDist(dist) : '',
    conCheckin && conCheckout ? fmtDur(dur) : '',
    retraso,
    avanzando,
    firma ? 'Sí' : 'No',
    pendientes,
    rand() < 0.01 ? 'Reincidente' : '',
    equipo,
    rand() < 0.7 ? `TK-${1000 + Math.floor(rand() * 360)}` : '',
    rand() < 0.74 ? (14.5 + rand()).toFixed(6) : '0',
    `https://2workers.me//informacoes/tarefa/fixture-${i}`,
  ])
}

const header = [
  'Código', 'Fecha de registro de la tarea', 'Fecha', 'Hora', 'Tipo de tarea', 'Tarea de', 'Responsable', 'Cliente',
  'Grupo de clientes', 'Prioridad', 'Finalizada', 'Fecha check-in', 'Hora check-in', 'Fecha check-out', 'Hora check-out',
  'Distancia del check-in', 'Distancia del check-out', 'Duración', 'Retraso', 'Avanzando', 'Firma', 'Pendientes',
  'Palabras Claves', 'Equipos', 'Ticket', 'Latitud', 'OS Digital',
]

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const html = `<html><head><meta charset="utf-8"><style>td{mso-number-format:"\\@"}</style></head><body>
<table><tr><td>Informe de Tareas</td></tr><tr><td>Fecha de inicio: ${fmtDate(INI)}</td></tr><tr><td>Fecha finalizaci&#243;n: ${fmtDate(FIN)}</td></tr></table>
<table><thead><tr>${header.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>
${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('\n')}
</tbody></table></body></html>`

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, html)

const summary = {
  tareas: expected.n,
  finalizadas: expected.finalizadas,
  tasaFinalizacion: expected.finalizadas / expected.n,
  checkinSobreFinalizadas: expected.conCheckinFinalizadas / expected.finalizadas,
  puntualidad: expected.puntuales / expected.desvios,
  firma: expected.firmas / expected.n,
}
writeFileSync(out.replace(/\.xls$/, '.expected.json'), JSON.stringify(summary, null, 2))
console.log(`✓ ${out} (${rows.length} tareas)`)
console.log(summary)
