import type { Report } from '../types/report'

/** Nombre de archivo: Reporte_<Empresa>_<inicio>_<fin>.pdf (como el generador en Python). */
export function pdfFileName(report: Report) {
  const company = report.meta.title.slice(1).join(' ') || 'Tareas'
  const period = report.meta.facts.find((f) => f.label === 'Período analizado')?.value ?? ''
  const [ini, fin] = period.split('–').map((d) => d.trim().split('/').reverse().join(''))
  const slug = company
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
  return `Reporte_${slug || 'Tareas'}${ini ? `_${ini}` : ''}${fin ? `_${fin}` : ''}.pdf`
}

/** Genera el PDF en el navegador. La librería se carga solo al usarla. */
export async function renderReportPdf(report: Report): Promise<Blob> {
  const [{ pdf }, { ReportDocument }] = await Promise.all([import('@react-pdf/renderer'), import('./ReportDocument')])
  // pdf() espera el elemento <Document>: ReportDocument no usa hooks, se invoca directamente
  return pdf(ReportDocument({ report })).toBlob()
}

/** Genera el PDF y lo descarga con el nombre Reporte_<Empresa>_<inicio>_<fin>.pdf */
export async function downloadReportPdf(report: Report) {
  const blob = await renderReportPdf(report)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = pdfFileName(report)
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
