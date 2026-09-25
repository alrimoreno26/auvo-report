#!/usr/bin/env node
// Convierte un reporte HTML generado (formato "Operación de Tareas") en el JSON
// que consume la app (ver src/types/report.ts).
//
// Uso: node scripts/extract-report.mjs <reporte.html> [salida.json]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { parse } from 'node-html-parser'
import { KPI_METRIC, companyKey } from '../src/report/metrics.ts'

const [input, output] = process.argv.slice(2)
if (!input) {
  console.error('Uso: node scripts/extract-report.mjs <reporte.html> [salida.json]')
  process.exit(1)
}

const root = parse(readFileSync(input, 'utf8'))

// ---------- helpers ----------
const text = (el) => (el ? el.text.replace(/\s+/g, ' ').trim() : '')
const num = (s) => {
  // "1.042" -> 1042 · "56%" -> 56 · "1,5%" -> 1.5
  const n = parseFloat(String(s).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isNaN(n) ? 0 : n
}
// <b>x</b> -> **x** para renderizar negritas sin HTML crudo
const rich = (el) =>
  el.innerHTML
    .replace(/<b>(.*?)<\/b>/g, '**$1**')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()

const TONES = { '#7C3AED': 'primary', '#B45309': 'warn', '#FBBF77': 'caution', '#C4B5FD': 'muted' }

const cardByTitle = (title) => {
  const h3 = root.querySelectorAll('h3').find((h) => text(h) === title)
  if (!h3) throw new Error(`No se encontró la tarjeta "${title}"`)
  return h3
}
const cardMeta = (h3) => {
  const sub = h3.nextElementSibling
  return { title: text(h3), subtitle: sub?.classList.contains('sub') ? text(sub) : undefined }
}
const svgAfter = (h3) => {
  let el = h3.nextElementSibling
  while (el && el.tagName !== 'SVG') el = el.nextElementSibling
  return el
}

// Barras horizontales y columnas comparten el patrón <g class="hit" data-tip>
const bars = (svg) =>
  svg.querySelectorAll('g.hit').map((g) => {
    const bar = g.querySelectorAll('rect').find((r) => r.getAttribute('rx'))
    const val = g.querySelector('text.val')
    const label = g.querySelector('text.lbl') ?? g.querySelector('text.axis')
    return {
      label: text(label),
      value: num(text(val)),
      display: text(val),
      tip: g.getAttribute('data-tip'),
      tone: TONES[bar?.getAttribute('fill')?.toUpperCase()] ?? 'primary',
    }
  })

const barChart = (title) => {
  const h3 = cardByTitle(title)
  return { ...cardMeta(h3), bars: bars(svgAfter(h3)) }
}

const stack = (title) => {
  const h3 = cardByTitle(title)
  let el = h3.nextElementSibling
  while (el && !el.classList.contains('stack')) el = el.nextElementSibling
  const legend = el.nextElementSibling
  const segments = el.querySelectorAll('.seg').map((s, i) => {
    const lg = legend.querySelectorAll('.lg')[i]
    const style = s.getAttribute('style')
    return {
      label: lg.childNodes.filter((n) => n.nodeType === 3).map((n) => n.text).join('').trim(),
      value: num(text(lg.querySelector('b'))),
      share: parseFloat(style.match(/width:([\d.]+)%/)[1]),
      color: style.match(/background:(#[0-9A-Fa-f]+)/)[1],
    }
  })
  return { ...cardMeta(h3), segments }
}

const table = (tableEl) => ({
  columns: tableEl.querySelectorAll('thead th').map((th) => ({
    label: text(th),
    numeric: th.classList.contains('num') || undefined,
  })),
  rows: tableEl.querySelectorAll('tbody tr').map((tr) => {
    const row = {
      cells: tr.querySelectorAll('td').map((td) => {
        const cell = {}
        const pill = td.querySelector('.pill')
        const mini = td.querySelector('.mini i')
        const a = td.querySelector('a')
        const em = td.querySelector('em')
        const v = td.getAttribute('data-v')
        cell.text = text(em ? parse(td.innerHTML.replace(/<em>.*?<\/em>/, '')) : td)
        if (v !== undefined) cell.sort = v === '' ? null : parseFloat(v)
        if (em) cell.note = text(em)
        if (pill) cell.pill = ['ok', 'warn', 'bad'].find((c) => pill.classList.contains(c))
        if (mini) cell.bar = parseFloat(mini.getAttribute('style').match(/width:([\d.]+)%/)[1])
        if (a) cell.href = a.getAttribute('href')
        if (td.classList.contains('pos')) cell.tone = 'pos'
        if (td.classList.contains('neg')) cell.tone = 'neg'
        return cell
      }),
    }
    if (tr.classList.contains('hl')) row.highlight = true
    return row
  }),
})

const kpis = (container) =>
  container.querySelectorAll('.kpi').map((k) => {
    const bar = k.querySelector('.bar i')
    const label = text(k.querySelector('span'))
    return {
      label,
      value: text(k.querySelector('b')),
      note: text(k.querySelector('small')) || undefined,
      progress: bar ? parseFloat(bar.getAttribute('style').match(/width:([\d.]+)%/)[1]) : undefined,
      metric: KPI_METRIC[label],
    }
  })

const section = (id) => {
  const s = root.querySelector(`section#${id}`)
  return { el: s, title: text(s.querySelector('h2')), lead: text(s.querySelector('p.lead')) }
}
const head = ({ title, lead }) => ({ title, lead })

// ---------- hero ----------
const hero = root.querySelector('header.hero')
const meta = {
  eyebrow: text(hero.querySelector('.eyebrow')),
  title: hero.querySelector('h1').innerHTML.split(/<br\s*\/?>/).map((t) => parse(t).text.trim()),
  description: text(hero.querySelector('p')),
  facts: hero.querySelectorAll('.meta > div').map((d) => ({
    label: text(d.querySelector('span')),
    value: text(d.querySelector('b')),
  })),
}

// ---------- índice ----------
const idx = section('indice')
const index = {
  ...head(idx),
  intro: rich(idx.el.querySelector('.intro')),
  items: idx.el.querySelectorAll('.idx a').map((a) => ({
    id: a.getAttribute('href').slice(1),
    title: text(a.querySelector('h4')),
    description: text(a.querySelector('p')),
    tags: a.querySelectorAll('li').map(text),
  })),
}

// ---------- resumen / atención ----------
const res = section('resumen')
const summary = { ...head(res), kpis: kpis(res.el) }

const att = section('atencion')
const alerts = {
  ...head(att),
  items: att.el.querySelectorAll('.alert').map((a) => ({
    tone: ['ok', 'warn', 'info'].find((c) => a.classList.contains(c)),
    tag: text(a.querySelector('.tag')),
    title: text(a.querySelector('h4')),
    text: text(a.querySelector('p')),
  })),
}

// ---------- evolución ----------
const evo = section('evolucion')
const weeklySvg = evo.el.querySelector('.legend-inline').nextElementSibling
const partialLabels = new Set(
  weeklySvg
    .querySelectorAll('rect[stroke-dasharray]')
    .map((r) => text(r.nextElementSibling)),
)
const weekly = weeklySvg.querySelectorAll('rect.hit').map((r) => {
  const [, label, created, finished] = r
    .getAttribute('data-tip')
    .match(/^(.+?) · Creadas: ([\d.]+) · Finalizadas: ([\d.]+)/)
  return { label, created: num(created), finished: num(finished), partial: partialLabels.has(label) || undefined }
})
const weeklyTableEl = evo.el.querySelector('table')
const weeklyNote = text(weeklyTableEl.parentNode.querySelector('p.sub'))

const dailyH3 = cardByTitle('Tareas por día programado')
const daily = {
  ...cardMeta(dailyH3),
  points: svgAfter(dailyH3)
    .querySelectorAll('[data-tip]')
    .map((c) => {
      const [, label, value] = c.getAttribute('data-tip').match(/^(.+?): ([\d.]+)/)
      return { label, value: num(value) }
    }),
}

const heatH3 = cardByTitle('Mapa de calor: día × hora programada')
const heatSvg = svgAfter(heatH3)
const heatCells = heatSvg.querySelectorAll('rect.hit').map((r) => {
  const [, day, hour, value] = r.getAttribute('data-tip').match(/^(\S+) (\d+):00 · ([\d.]+)/)
  return { day, hour: +hour, value: num(value) }
})
const days = [...new Set(heatCells.map((c) => c.day))]
const hours = [...new Set(heatCells.map((c) => c.hour))].sort((a, b) => a - b)
const heatmap = {
  ...cardMeta(heatH3),
  days,
  hours,
  values: days.map((d) => hours.map((h) => heatCells.find((c) => c.day === d && c.hour === h)?.value ?? 0)),
}

const evolution = {
  ...head(evo),
  weekly: { legend: evo.el.querySelectorAll('.legend-inline span').map(text), points: weekly },
  weeklyTable: { ...table(weeklyTableEl), note: weeklyNote || undefined },
  daily,
  heatmap,
  weekday: barChart('Tareas por día de la semana'),
}

// ---------- tipos ----------
const types = {
  ...head(section('tipos')),
  byType: barChart('Tareas por tipo'),
  priority: stack('Prioridad'),
  status: stack('Estado'),
  creators: barChart('¿Quién crea las tareas?'),
}

// ---------- equipo ----------
const eq = section('equipo')
const team = {
  ...head(eq),
  byOwner: barChart('Tareas por responsable'),
  punctuality: barChart('Puntualidad por responsable'),
  table: table(eq.el.querySelector('table')),
}

// ---------- clientes ----------
const cli = section('clientes')
const tableCard = (title) => {
  const h3 = cardByTitle(title)
  const card = h3.parentNode
  const notes = card.querySelectorAll('p.sub')
  return {
    ...cardMeta(h3),
    ...table(card.querySelector('table')),
    note: notes.length > 1 ? text(notes[notes.length - 1]) : undefined,
  }
}
const clients = {
  ...head(cli),
  byGroup: barChart('Tareas por grupo de clientes'),
  topLocations: barChart('Top 15 locales con más tareas'),
  groupTable: tableCard('Detalle por grupo de clientes'),
  equipment: tableCard('Equipos más atendidos'),
}

// ---------- calidad ----------
const cal = section('calidad')
const quality = {
  ...head(cal),
  kpis: kpis(cal.el),
  arrival: barChart('Llegada vs. horario programado'),
  duration: barChart('Duración de la visita'),
  response: barChart('Tiempo de respuesta'),
  distance: barChart('Distancia del check-in'),
  evidence: barChart('Evidencias pendientes'),
}

// ---------- abiertas ----------
const ab = section('abiertas')
const openTasks = {
  ...head(ab),
  searchPlaceholder: ab.el.querySelector('input.search').getAttribute('placeholder'),
  table: table(ab.el.querySelector('table')),
}

// ---------- footer ----------
const ft = root.querySelector('footer')
const footer = {
  title: text(ft.querySelector('b')),
  definitions: ft.querySelectorAll('dt').map((dt) => ({ term: text(dt), text: text(dt.nextElementSibling) })),
  note: text(ft.querySelector('p')),
}

// ---------- indicadores (desde los textos ya formateados: son valores redondeados) ----------
const fact = (label) => meta.facts.find((f) => f.label === label)?.value ?? ''
const pct = (s) => (/%/.test(s) ? num(s) / 100 : undefined)
// "1 h 14 min" → 74 · "27 min" → 27
const minutes = (s) => {
  const m = s.match(/^(?:(\d+) h)?\s*(?:(\d+) min)?$/)
  return m && (m[1] || m[2]) ? +(m[1] ?? 0) * 60 + +(m[2] ?? 0) : undefined
}
// "4,1 h" → 4.1 · "45 min" → 0.75 · "3,2 días" → 76.8
const hoursOf = (s) => {
  const n = parseFloat(s.replace(',', '.'))
  if (/días?$/.test(s)) return n * 24
  if (/ h$/.test(s)) return n
  if (/ min$/.test(s)) return n / 60
  return undefined
}
const kpiOf = (label) => [...summary.kpis, ...quality.kpis].find((k) => k.label === label)
const metricParsers = {
  n: () => num(fact('Tareas analizadas')),
  finN: () => num(kpiOf('Tareas finalizadas').value),
  tasaFin: () => pct(kpiOf('Tareas finalizadas').note.match(/([\d.,]+%)/)?.[1] ?? ''),
  pendN: () => num(kpiOf('Tareas abiertas').value),
  tecnicos: () => num(kpiOf('Responsables activos').value),
  ciRate: () => pct(kpiOf('Check-in registrado').value),
  puntual: () => pct(kpiOf('Puntualidad').value),
  durMed: () => minutes(kpiOf('Duración mediana').value),
  respMed: () => hoursOf(kpiOf('Tiempo de respuesta').value),
  coRate: () => pct(kpiOf('Check-out registrado').value),
  gpsRate: () => pct(kpiOf('Check-in con GPS').value),
  sinGeoRate: () => pct(kpiOf('Clientes sin coordenadas').value),
  firmaRate: () => pct(kpiOf('Firma del cliente').value),
  pendientesDoc: () => num(kpiOf('Pendientes de evidencia').value),
}
const metrics = {}
for (const [key, parseMetric] of Object.entries(metricParsers)) {
  try {
    const v = parseMetric()
    if (typeof v === 'number' && Number.isFinite(v)) metrics[key] = v
  } catch {
    // KPI ausente en este reporte: se omite
  }
}

const report = {
  version: 1,
  metrics,
  meta,
  index,
  summary,
  alerts,
  evolution,
  types,
  team,
  clients,
  quality,
  openTasks,
  footer,
}

const out = output ?? join('data', basename(input).replace(/\.html?$/i, '.json'))
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(report, null, 2))
console.log(`✓ ${out}`)

// SQL listo para pegar en el SQL Editor de Supabase (upsert por slug)
const isoDate = (d) => d.split('/').reverse().join('-')
const [periodStart, periodEnd] = fact('Período analizado').split('–').map((s) => isoDate(s.trim()))
const slug = basename(out, '.json').toLowerCase().replace(/[^a-z0-9]+/g, '-')
const q = (s) => `'${String(s).replace(/'/g, "''")}'`
// "91926 — Empresa" → "Empresa"
const company = fact('Empresa').replace(/^.*? — /, '')
const sql = `insert into public.reports (slug, company, company_key, period_start, period_end, data)
values (${q(slug)}, ${q(company)}, ${q(companyKey(company))}, ${q(periodStart)}, ${q(periodEnd)}, $json$${JSON.stringify(report)}$json$::jsonb)
on conflict (slug) do update set company = excluded.company, company_key = excluded.company_key,
  period_start = excluded.period_start, period_end = excluded.period_end, data = excluded.data;
`
const sqlOut = out.replace(/\.json$/, '.sql')
writeFileSync(sqlOut, sql)
console.log(`✓ ${sqlOut}`)
