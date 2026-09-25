// Arma el JSON del reporte (equivale a construir_html de generar_reporte.py, pero produce datos).
import type { Bar, BarChartData, Kpi, PillTone, Report, TableCell, TableData, Tone } from '../types/report'
import { DIAS, type Analysis, type Buckets } from './analyze'
import { fdate, fdist, fdur, fhoras, fnum, fpct, isNum, nowStamp, ratio, roundHalfEven } from './format'
import { insights } from './insights'

export interface BuildOptions {
  /** Nombre de la empresa en el encabezado */
  empresa: string
  /** Código de la cuenta (opcional) */
  codigo?: string
  /** Nombre del archivo de origen */
  fuente: string
  generatedAt?: Date
}

const COLORS = { primary: '#5B21B6', primary2: '#7C3AED', soft: '#DDD6FE' }

// ── helpers de celdas y barras
const num = (v: number, text = fnum(v)): TableCell => ({ text, sort: isNum(v) ? v : null })

const pillPct = (p: number, good = 0.9, mid = 0.75): TableCell => {
  if (!isNum(p)) return { text: '—', sort: null }
  const pill: PillTone = p >= good ? 'ok' : p >= mid ? 'warn' : 'bad'
  return { text: fpct(p), sort: p, pill }
}

const miniPct = (p: number): TableCell =>
  isNum(p) ? { text: fpct(p), sort: p, bar: roundHalfEven(Math.min(100, p * 100)) } : { text: '—', sort: null }

const truncate = (s: string) => (s.length <= 30 ? s : s.slice(0, 29) + '…')

function bars(
  items: [string, number][],
  opts: {
    fmt?: (v: number) => string
    tipExtra?: (label: string, v: number) => string
    tone?: (label: string, v: number, i: number) => Tone
    truncateLabels?: boolean
  } = {},
): Bar[] {
  const fmt = opts.fmt ?? ((v: number) => fnum(v))
  return items.map(([label, value], i) => ({
    label: opts.truncateLabels === false ? label : truncate(label),
    value,
    display: fmt(value),
    tip: `${label}: ${fmt(value)}` + (opts.tipExtra ? ` · ${opts.tipExtra(label, value)}` : ''),
    tone: opts.tone?.(label, value, i) ?? 'primary',
  }))
}

const chart = (title: string, subtitle: string, b: Bar[]): BarChartData => ({ title, subtitle, bars: b })

const kpi = (label: string, value: string, note: string, pct?: number): Kpi => ({
  label,
  value,
  note,
  progress: pct !== undefined && isNum(pct) ? roundHalfEven(Math.min(100, pct * 100)) : undefined,
})

const shareOf = (b: Buckets) => {
  const total = b.reduce((s, [, v]) => s + v, 0)
  return (_: string, v: number) => fpct(ratio(v, total), 1)
}

function stack(title: string, subtitle: string, parts: [string, number, string][]) {
  const tot = parts.reduce((s, [, v]) => s + v, 0) || 1
  return {
    title,
    subtitle,
    segments: parts.map(([label, value, color]) => ({ label, value, share: (100 * value) / tot, color })),
  }
}

export function buildReport(R: Analysis, opts: BuildOptions): Report {
  const empresa = opts.empresa.trim()
  const codigo = opts.codigo?.trim()
  const stamp = nowStamp(opts.generatedAt)
  const wk = R.semanas
  const n = R.n
  const tol = R.tolerancia
  const periodo = `${fdate(R.ini, true)} – ${fdate(R.fin, true)}`

  // ── Encabezado
  const meta: Report['meta'] = {
    eyebrow: 'Reporte de Customer Success',
    title: empresa ? ['Operación de Tareas', empresa] : ['Informe de Operación', 'de Tareas'],
    description:
      'Un retrato de cómo el equipo usó la plataforma en el período: volumen, cumplimiento, calidad de la ejecución en campo y dónde podemos ayudar a destrabar aún más valor.',
    facts: [
      ...(empresa ? [{ label: 'Empresa', value: `${codigo ? codigo + ' — ' : ''}${empresa}` }] : []),
      { label: 'Período analizado', value: periodo },
      { label: 'Tareas analizadas', value: fnum(n) },
      { label: 'Generado', value: `${stamp.date} ${stamp.time}` },
    ],
  }

  // ── Índice
  const index: Report['index'] = {
    title: 'Contenido del reporte',
    lead: 'Qué encontrará en este documento. Haga clic en cualquier sección para ir directamente a ella.',
    intro:
      `Este reporte resume la operación ${empresa ? `de **${empresa}** ` : ''}registrada en la plataforma entre el ` +
      `**${fdate(R.ini, true)}** y el **${fdate(R.fin, true)}**: **${fnum(n)} tareas** analizadas. ` +
      'Todos los datos provienen del Informe de Tareas exportado; al final se incluyen las definiciones de cada indicador.',
    items: [
      { id: 'resumen', title: 'Resumen del período', description: 'Los 8 indicadores clave de la operación en un vistazo.',
        tags: ['Tareas creadas y finalizadas', 'Tareas abiertas', 'Responsables activos', 'Check-in', 'Puntualidad', 'Duración en sitio', 'Tiempo de respuesta'] },
      { id: 'atencion', title: 'Puntos de atención', description: 'Hallazgos automáticos para conversar juntos: lo que funciona bien y dónde hay oportunidad de mejora.',
        tags: ['Tendencia de volumen', 'Ejecución', 'Adopción en campo', 'Calidad de datos', 'Carga de trabajo', 'Recurrencia'] },
      { id: 'evolucion', title: 'Uso semana a semana', description: `Cómo se comportó el volumen de tareas en las ${wk.length} semanas del período y cuándo trabaja el equipo.`,
        tags: ['Creadas vs. finalizadas', 'Variación semanal', 'Tendencia diaria', 'Mapa de calor día × hora', 'Día de la semana'] },
      { id: 'tipos', title: 'Tipos de tarea y prioridad', description: 'Qué servicios concentran la operación, con qué urgencia llegan y quién las registra.',
        tags: ['Tareas por tipo', 'Prioridad', 'Estado', 'Origen de creación'] },
      { id: 'equipo', title: 'Equipo técnico', description: `Desempeño de los ${R.tecnicos} responsables: carga, cumplimiento y puntualidad, con tabla ordenable.`,
        tags: ['Tareas por responsable', 'Puntualidad', '% finalización', '% check-in', 'Retraso y duración'] },
      { id: 'clientes', title: 'Clientes y locales', description: `Dónde se concentra la demanda: ${fnum(R.clientes)} locales en ${R.cadenas} grupos de clientes.`,
        tags: ['Grupos de clientes', 'Top 15 locales', 'Tiempo de respuesta por grupo', 'Equipos más atendidos', 'Tickets'] },
      { id: 'calidad', title: 'Calidad de la ejecución en campo', description: 'Qué tan trazadas quedan las visitas y cómo se cumplen los horarios.',
        tags: ['Check-out', 'GPS', 'Firma del cliente', 'Llegada vs. agenda', 'Duración', 'Evidencias pendientes'] },
      { id: 'abiertas', title: 'Tareas abiertas', description: `Detalle de las ${R.pendN} tareas sin finalizar, con antigüedad, buscador y enlace a cada orden de servicio.`,
        tags: ['Antigüedad', 'Responsable', 'Cliente', 'Estado de check-in'] },
    ],
  }

  // ── Resumen
  const summary: Report['summary'] = {
    title: 'Resumen del período',
    lead: `Los indicadores clave de los ${R.dias} días analizados (${wk.length} semanas), directo del Informe de Tareas.`,
    kpis: [
      kpi('Tareas creadas', fnum(n), `promedio de ${fnum(R.promDia, 1)} por día`),
      kpi('Tareas finalizadas', fnum(R.finN), `tasa de finalización de ${fpct(R.tasaFin, 1)}`, R.tasaFin),
      kpi('Tareas abiertas', fnum(R.pendN), `${R.nfVencidas} con más de 2 días de atraso`),
      kpi('Responsables activos', fnum(R.tecnicos), `atendiendo ${fnum(R.clientes)} locales de ${R.cadenas} grupos`),
      kpi('Check-in registrado', fpct(R.ciRate), 'de las tareas finalizadas', R.ciRate),
      kpi('Puntualidad', fpct(R.puntual), `llegada con ≤ ${tol} min de retraso`, R.puntual),
      kpi('Duración mediana', fdur(R.durMed), `en sitio · P75 ${fdur(R.durP75)}`),
      kpi('Tiempo de respuesta', fhoras(R.respMed), 'mediana del registro al check-in'),
    ],
  }

  const alerts: Report['alerts'] = {
    title: 'Puntos de atención',
    lead: 'Separamos algunos puntos que vale la pena conversar juntos para aprovechar aún más la plataforma.',
    items: insights(R),
  }

  // ── Evolución
  const avgWeek = wk.length ? wk.reduce((s, w) => s + w.n, 0) / wk.length : 0
  const weeklyTable: TableData & { note?: string } = {
    columns: [
      { label: 'Semana' }, { label: 'Tareas', numeric: true }, { label: 'Variación', numeric: true },
      { label: 'Finalizadas', numeric: true }, { label: '% Fin.', numeric: true }, { label: 'Resp. activos', numeric: true },
      { label: 'Locales', numeric: true }, { label: 'Puntualidad', numeric: true },
    ],
    rows: wk.map((w) => {
      const v = w.variacion
      const variacion: TableCell = isNum(v)
        ? { text: (v > 0 ? '+' : '') + fpct(v, 1), sort: v, tone: v > 0 ? 'pos' : v < 0 ? 'neg' : undefined }
        : { text: '—', sort: null }
      const pctFin = ratio(w.finN, w.n)
      return {
        highlight: w.n < 0.5 * avgWeek || undefined,
        cells: [
          { text: w.rango, note: w.parcial ? '(parcial)' : undefined },
          num(w.n),
          variacion,
          num(w.finN),
          { text: fpct(pctFin), sort: isNum(pctFin) ? pctFin : null },
          num(w.tec, `${w.tec} de ${R.tecnicos}`),
          num(w.cli),
          { text: fpct(w.puntual), sort: isNum(w.puntual) ? w.puntual : null },
        ],
      }
    }),
    note: 'Filas resaltadas: semanas con menos de la mitad del volumen promedio.',
  }
  const evolution: Report['evolution'] = {
    title: 'Uso semana a semana',
    lead: `Cómo varió el volumen de tareas a lo largo de las ${wk.length} semanas y cuántas se cerraron en la plataforma.`,
    weekly: {
      legend: ['Tareas creadas', 'Tareas finalizadas'],
      points: wk.map((w, i) => ({
        label: w.label,
        created: w.n,
        finished: w.finN,
        partial: (i === wk.length - 1 && w.parcial) || undefined,
      })),
    },
    weeklyTable,
    daily: {
      title: 'Tareas por día programado',
      subtitle: 'Volumen diario en el período',
      points: R.diario.map(([label, value]) => ({ label, value })),
    },
    heatmap: {
      title: 'Mapa de calor: día × hora programada',
      subtitle: 'Dónde se concentra la agenda del equipo',
      days: DIAS,
      hours: R.heat.horas,
      values: R.heat.values,
    },
    weekday: chart('Tareas por día de la semana', 'Según fecha programada', bars(R.porDiaSem)),
  }

  // ── Tipos y prioridad
  const pctTotal = (_: string, v: number) => fpct(v / n, 1) + ' del total'
  const prioColor: Record<string, string> = { Alta: COLORS.primary, Media: '#A78BFA', Baja: '#DDD6FE' }
  const types: Report['types'] = {
    title: 'Tipos de tarea y prioridad',
    lead: 'Qué tipo de servicio concentra la operación y con qué urgencia llega.',
    byType: chart('Tareas por tipo', `${R.tipos.length} tipos de tarea en uso`, bars(R.tipos, { tipExtra: pctTotal })),
    priority: stack(
      'Prioridad',
      `${fpct(R.prioridadAlta)} de las tareas llegan con prioridad alta`,
      R.prioridades.map(([k, v]) => [k, v, prioColor[k] ?? '#C4B5FD']),
    ),
    status: stack('Estado', 'Finalizadas vs. abiertas', [
      ['Finalizadas', R.finN, COLORS.primary2],
      ['Abiertas', R.pendN, '#FBBF77'],
    ]),
    creators: chart('¿Quién crea las tareas?', 'Usuario de origen ("Tarea de")', bars(R.creador.slice(0, 8))),
  }

  // ── Equipo técnico
  const punt = R.tec.filter((t) => isNum(t.puntual) && t.n >= 10).sort((a, b) => b.puntual - a.puntual)
  const team: Report['team'] = {
    title: 'Equipo técnico',
    lead: 'Distribución de carga y calidad de ejecución por responsable. Haga clic en los encabezados para ordenar.',
    byOwner: chart('Tareas por responsable', 'Carga de trabajo en el período',
      bars(R.tec.slice(0, 15).map((t) => [t.resp, t.n]), { tipExtra: pctTotal })),
    punctuality: chart(
      'Puntualidad por responsable',
      `% de llegadas con ≤ ${tol} min de retraso · mín. 10 tareas · en naranja, por debajo del promedio (${fpct(R.puntual)})`,
      bars(punt.slice(0, 15).map((t) => [t.resp, t.puntual]), {
        fmt: (v) => fpct(v),
        tone: (_, v) => (v < R.puntual - 0.05 ? 'warn' : 'primary'),
      }),
    ),
    table: {
      columns: [
        { label: 'Responsable' }, { label: 'Tareas', numeric: true }, { label: '% total', numeric: true },
        { label: '% Finaliz.', numeric: true }, { label: 'Abiertas', numeric: true }, { label: '% Check-in', numeric: true },
        { label: 'Puntualidad', numeric: true }, { label: 'Retraso med.', numeric: true }, { label: 'Duración med.', numeric: true },
        { label: 'Locales', numeric: true }, { label: 'Pend. doc.', numeric: true },
      ],
      rows: R.tec.map((t) => ({
        cells: [
          { text: t.resp },
          num(t.n),
          { text: fpct(t.share, 1), sort: t.share },
          pillPct(t.fin),
          num(t.pend),
          pillPct(t.ci),
          miniPct(t.puntual),
          num(t.ret, fdur(t.ret)),
          num(t.dur, fdur(t.dur)),
          num(t.cli),
          num(t.doc),
        ],
      })),
    },
  }

  // ── Clientes y locales
  const eqRows = R.equiposRecurrentes.slice(0, 12)
  const clients: Report['clients'] = {
    title: 'Clientes y locales',
    lead: `${fnum(R.clientes)} locales atendidos, agrupados en ${R.cadenas} grupos de clientes. ${R.localesRecurrentes} locales recibieron 5 visitas o más.`,
    byGroup: chart('Tareas por grupo de clientes', 'Agrupado por cadena principal',
      bars(R.cad.slice(0, 12).map((c) => [c.cadena, c.n]), { tipExtra: pctTotal })),
    topLocations: chart('Top 15 locales con más tareas', 'Locales con mayor demanda de servicio', bars(R.topClientes)),
    groupTable: {
      title: 'Detalle por grupo de clientes',
      subtitle: 'Tiempo de respuesta = mediana entre el registro y el check-in',
      columns: [
        { label: 'Grupo' }, { label: 'Tareas', numeric: true }, { label: 'Locales', numeric: true },
        { label: '% Finaliz.', numeric: true }, { label: '% Prior. alta', numeric: true },
        { label: 'T. respuesta', numeric: true }, { label: 'Duración med.', numeric: true },
      ],
      rows: R.cad.map((c) => ({
        cells: [
          { text: c.cadena },
          num(c.n),
          num(c.loc),
          pillPct(c.fin),
          { text: fpct(c.alta), sort: isNum(c.alta) ? c.alta : null },
          num(c.resp, fhoras(c.resp)),
          num(c.dur, fdur(c.dur)),
        ],
      })),
    },
    equipment: {
      title: 'Equipos más atendidos',
      subtitle: `${R.equiposRecurrentes.length} equipos con 3+ visitas · ${fnum(R.equiposTotal)} equipos registrados`,
      columns: [{ label: 'Equipo' }, { label: 'Visitas', numeric: true }],
      rows: eqRows.map(([k, v]) => ({ cells: [{ text: k }, num(v)] })),
      note: `${fnum(R.tickets)} tickets únicos · ${fnum(R.ticketsMulti)} con más de una tarea · ${R.reincidentes} marcadas como «Reincidente»`,
    },
  }

  // ── Calidad en campo
  const desvioTone = (label: string): Tone => {
    if (label.startsWith(`${tol}`)) return 'caution'
    if (label.includes('tarde') && !label.startsWith('0')) return 'warn'
    return 'primary'
  }
  const quality: Report['quality'] = {
    title: 'Calidad de la ejecución en campo',
    lead: 'Qué tan trazadas quedan las visitas: check-in/out, puntualidad frente a la agenda, tiempos en sitio y evidencias.',
    kpis: [
      kpi('Check-out registrado', fpct(R.coRate), 'de las tareas finalizadas', R.coRate),
      kpi('Check-in con GPS', fpct(R.gpsRate), `distancia mediana ${fdist(R.distMed)}`, R.gpsRate),
      kpi('Clientes sin coordenadas', fpct(R.sinGeoRate), `${fnum(R.sinGeo)} tareas`),
      kpi('Firma del cliente', fpct(R.firmaRate, 1), 'tareas con firma digital', R.firmaRate),
      kpi('Pendientes de evidencia', fnum(R.pendientesDoc), 'tareas con foto / documento pendiente'),
    ],
    arrival: chart('Llegada vs. horario programado', 'Diferencia entre el check-in y la hora agendada · en naranja, fuera de tolerancia',
      bars(R.desvioBuckets, { tipExtra: shareOf(R.desvioBuckets), tone: desvioTone, truncateLabels: false })),
    duration: chart('Duración de la visita', 'Tiempo entre check-in y check-out · en naranja, valores atípicos',
      bars(R.durBuckets, {
        tipExtra: shareOf(R.durBuckets),
        tone: (_, __, i) => (i === 0 ? 'caution' : i === R.durBuckets.length - 1 ? 'warn' : 'primary'),
        truncateLabels: false,
      })),
    response: chart('Tiempo de respuesta', 'Desde el registro de la tarea hasta el check-in',
      bars(R.respBuckets, { tipExtra: shareOf(R.respBuckets), truncateLabels: false })),
    distance: chart('Distancia del check-in', 'Valor reportado por la plataforma entre el check-in y la dirección de la tarea',
      bars(R.distBuckets, { tone: (_, __, i) => (i === 5 ? 'muted' : 'primary'), truncateLabels: false })),
    evidence: chart('Evidencias pendientes', 'Qué falta completar en las tareas', bars(R.pendDoc.slice(0, 8))),
  }

  // ── Tareas abiertas
  const openTasks: Report['openTasks'] = {
    title: 'Tareas abiertas',
    lead: `${R.pendN} tareas sin finalizar al cierre del período · ${R.nfVencidas} con más de 2 días desde la fecha programada · ${R.nfSinCi} sin check-in.`,
    searchPlaceholder: 'Buscar por responsable, cliente, tipo…',
    table: {
      columns: [
        { label: 'Código' }, { label: 'Fecha' }, { label: 'Antigüedad', numeric: true }, { label: 'Responsable' },
        { label: 'Cliente' }, { label: 'Tipo' }, { label: 'Prioridad' }, { label: 'Check-in' },
      ],
      rows: R.nf.map((t) => {
        const pill: PillTone = t.dias > 7 ? 'bad' : t.dias > 2 ? 'warn' : 'ok'
        return {
          cells: [
            { text: t.codigo, href: t.os ?? undefined },
            t.fecha === null ? { text: '—', sort: null } : { text: fdate(t.fecha, true), sort: t.fecha / 1000 },
            { text: `${isNum(t.dias) ? t.dias : '—'} d`, sort: isNum(t.dias) ? t.dias : null, pill },
            { text: t.resp },
            { text: t.cliente },
            { text: t.tipo },
            { text: t.prioridad },
            { text: t.checkin !== null ? 'Sí' : 'No' },
          ],
        }
      }),
    },
  }

  // ── Pie
  const footer: Report['footer'] = {
    title: 'Definiciones y metodología',
    definitions: [
      { term: 'Fuente', text: `${opts.fuente} · ${fnum(n)} tareas` },
      { term: 'Tasa de finalización', text: 'Tareas con «Finalizada = Sí» sobre el total de tareas del período.' },
      { term: 'Check-in / check-out', text: '% de tareas finalizadas que tienen fecha y hora de check-in / check-out registradas.' },
      { term: 'Puntualidad', text: `Visitas cuyo check-in ocurrió antes o hasta ${tol} min después de la hora programada (campos «Retraso» y «Avanzando»).` },
      { term: 'Duración', text: 'Campo «Duración» (check-in → check-out). Se reporta la mediana para no distorsionar con check-outs olvidados.' },
      { term: 'Tiempo de respuesta', text: 'Diferencia entre la fecha de registro de la tarea y el check-in.' },
      { term: 'Semanas', text: 'De lunes a domingo; la primera y la última pueden ser parciales.' },
    ],
    note: `Reporte generado automáticamente el ${stamp.date} a las ${stamp.time}.`,
  }

  return { version: 1, meta, index, summary, alerts, evolution, types, team, clients, quality, openTasks, footer }
}
