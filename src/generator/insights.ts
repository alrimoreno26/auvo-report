// Hallazgos automáticos (equivale a insights de generar_reporte.py).
import type { AlertTone } from '../types/report'
import type { Analysis } from './analyze'
import { fdur, fnum, fpct, isNum, ratio } from './format'

export interface Insight {
  tone: AlertTone
  tag: string
  title: string
  text: string
}

export function insights(R: Analysis): Insight[] {
  const out: Insight[] = []
  const add = (tone: AlertTone, tag: string, title: string, text: string) => out.push({ tone, tag, title, text })

  const full = R.semanas.filter((w) => !w.parcial)
  const wk = full.length ? full : R.semanas
  if (wk.length >= 6) {
    const ult = wk.slice(-3).reduce((s, w) => s + w.n, 0) / 3
    const prev = wk.slice(0, -3).reduce((s, w) => s + w.n, 0) / Math.max(1, wk.length - 3)
    const v = ratio(ult - prev, prev)
    // max() de Python: la primera semana con el mayor volumen
    const pico = wk.reduce((a, b) => (b.n > a.n ? b : a))
    if (v >= 0.15) {
      add('ok', 'Tendencia', 'El volumen de tareas viene creciendo',
        `Las últimas 3 semanas completas promediaron ${fnum(ult)} tareas/semana, ${fpct(v)} por encima del promedio anterior (${fnum(prev)}). El pico fue la semana ${pico.rango} con ${pico.n} tareas.`)
    } else if (v <= -0.15) {
      add('warn', 'Tendencia', 'El volumen de tareas bajó en las últimas semanas',
        `Las últimas 3 semanas completas promediaron ${fnum(ult)} tareas/semana, ${fpct(Math.abs(v))} por debajo del promedio anterior (${fnum(prev)}). Vale la pena entender junto al equipo qué cambió.`)
    } else {
      add('ok', 'Estable', 'Volumen de operación estable',
        `Las últimas 3 semanas completas promediaron ${fnum(ult)} tareas/semana, en línea con el promedio del período (${fnum(prev)}). Pico: ${pico.rango} con ${pico.n} tareas.`)
    }
  }

  if (R.tasaFin >= 0.9) {
    add('ok', 'Ejecución', `${fpct(R.tasaFin)} de las tareas finalizadas`,
      `${fnum(R.finN)} de ${fnum(R.n)} tareas se cerraron en la plataforma. Quedan ${R.pendN} abiertas, ${R.nfVencidas} de ellas con más de 2 días desde la fecha programada.`)
  } else {
    add('warn', 'Ejecución', `Tasa de finalización de ${fpct(R.tasaFin)}`,
      `Quedan ${R.pendN} tareas sin finalizar (${R.nfVencidas} con más de 2 días de atraso). Revisar si se ejecutaron y no se cerraron en la app.`)
  }

  // NaN < 0.95 es falso en Python y en JS: sin tareas finalizadas cae en la rama "ok", igual que el original
  if (R.ciRate < 0.95) {
    add('warn', 'Adopción', `Check-in registrado en ${fpct(R.ciRate)} de las tareas finalizadas`,
      'El resto se cerró sin check-in, lo que impide medir duración y puntualidad. Reforzar con el equipo el flujo check-in → check-out en campo.')
  } else {
    add('ok', 'Adopción', `Check-in en ${fpct(R.ciRate)} de las tareas finalizadas`,
      'Excelente disciplina del equipo en campo: casi todas las visitas quedan trazadas con check-in.')
  }

  if (isNum(R.puntual)) {
    add(R.puntual >= 0.7 ? 'ok' : 'warn', 'Puntualidad', `${fpct(R.puntual)} de las visitas llegan a tiempo`,
      `Considerando una tolerancia de ${R.tolerancia} min sobre el horario programado. Cuando hay retraso, la mediana es de ${fdur(R.retrasoMed)}.`)
  }

  if (R.sinGeoRate > 0.1) {
    add('warn', 'Datos', `${fpct(R.sinGeoRate)} de las tareas sin coordenadas del cliente`,
      `${fnum(R.sinGeo)} tareas tienen clientes sin latitud/longitud. Georreferenciar esos locales habilita la validación de distancia del check-in y rutas más eficientes.`)
  }

  if (R.durLargas >= 5) {
    add('warn', 'Calidad', `${R.durLargas} visitas con duración mayor a 8 h`,
      `Suelen indicar check-out olvidado y distorsionan los tiempos de atención. También hay ${R.durCortas} visitas de menos de 5 min (check-in/out consecutivos).`)
  }

  const top = R.tec[0]
  if (top && top.share > 0.2) {
    add('info', 'Carga', `${top.resp} concentra ${fpct(top.share)} de las tareas`,
      `${fnum(top.n)} tareas en el período. Conviene revisar la distribución de carga entre los ${R.tecnicos} responsables.`)
  }

  if (R.equiposRecurrentes.length) {
    const [e0, c0] = R.equiposRecurrentes[0]
    add('info', 'Recurrencia', `${R.equiposRecurrentes.length} equipos atendidos 3 veces o más`,
      `El más recurrente es «${e0}» con ${c0} visitas. Oportunidad para planes de mantenimiento preventivo.`)
  }

  if (R.firmaRate < 0.2) {
    add('info', 'Oportunidad', `Firma digital usada en ${fpct(R.firmaRate, 1)} de las tareas`,
      'Activar la firma del cliente al cierre aporta evidencia de conformidad del servicio y reduce reclamos.')
  }

  return out
}
