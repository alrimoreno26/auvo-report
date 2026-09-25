import { Defs, Document, LinearGradient, Page, Rect, Stop, Svg, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { Report } from '../types/report'
import { PdfArea, PdfColumns, PdfHBar, PdfHeatmap, PdfWeekly } from './charts'
import { AlertItem, Card, KpiGrid, Rich, SectionTitle, StackBar, Table } from './components'
import { C, cardInner, CONTENT_W, GAP, HALF_W, PAGE, s } from './theme'
import { pdfText } from './text'

/** Filas por bloque en la tabla de tareas abiertas (cada bloque repite el encabezado).
 *  Un bloque no se parte: tiene que entrar en una página vacía o react-pdf comprime la hoja. */
const OPEN_ROWS_PER_BLOCK = 32
const THIRD_W = (CONTENT_W - GAP * 2) / 3
const TWO_THIRDS_W = CONTENT_W - GAP - THIRD_W

const fact = (r: Report, label: string) => r.meta.facts.find((f) => f.label === label)?.value ?? ''

function chunks<T>(xs: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < xs.length; i += size) out.push(xs.slice(i, i + size))
  return out.length ? out : [[]]
}

/** Mantiene juntos el título de una sección y su primer bloque (evita títulos huérfanos al pie). */
// flexShrink 0: sin esto, un bloque que no entra se comprime en lugar de pasar a la página siguiente
const Keep = ({ children }: { children: ReactNode }) => (
  <View wrap={false} style={{ flexShrink: 0 }}>
    {children}
  </View>
)

const Row = ({ children }: { children: ReactNode }) => <View style={[s.row, { flexShrink: 0 }]}>{children}</View>

function Cover({ report }: { report: Report }) {
  const { meta, index } = report
  return (
    <Page size="A4" style={{ fontFamily: 'Inter', color: '#FFFFFF', backgroundColor: C.gradMid }}>
      {/* Fondo degradado fuera del flujo (un Svg suelto ocupa lugar aunque sea absoluto) */}
      <View style={{ position: 'absolute', top: 0, left: 0, width: PAGE.width, height: PAGE.height }}>
        <Svg width={PAGE.width} height={PAGE.height}>
          <Defs>
            <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={C.gradA} />
              <Stop offset="0.55" stopColor={C.gradMid} />
              <Stop offset="1" stopColor={C.gradB} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={PAGE.width} height={PAGE.height} fill="url(#bg)" />
        </Svg>
      </View>

      <View style={{ paddingHorizontal: 52, paddingTop: 70 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <View style={{ width: 18, height: 18, borderRadius: 5, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 10, lineHeight: 1, fontWeight: 800, color: C.p }}>A</Text>
          </View>
          <Text style={{ fontSize: 10, fontWeight: 700 }}>Auvo Report</Text>
        </View>

        <Text style={{ marginTop: 150, fontSize: 9, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', opacity: 0.75 }}>
          {meta.eyebrow}
        </Text>
        {meta.title.map((line, i) => (
          <Text key={i} style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.12, marginTop: i === 0 ? 10 : 0 }}>
            {line}
          </Text>
        ))}
        <Text style={{ fontSize: 11, marginTop: 16, maxWidth: 400, opacity: 0.9, lineHeight: 1.5 }}>{pdfText(meta.description)}</Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 20,
            marginTop: 34,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.25)',
          }}
        >
          {meta.facts.map((f) => (
            <View key={f.label}>
              <Text style={{ fontSize: 6.5, letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.7 }}>{f.label}</Text>
              <Text style={{ fontSize: 10.5, fontWeight: 700, marginTop: 3 }}>{f.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Índice anclado al pie de la portada */}
      <View style={{ position: 'absolute', left: 52, right: 52, bottom: 52 }}>
        <Text style={{ fontSize: 7, letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.7, marginBottom: 8 }}>Contenido</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 }}>
          {index.items.map((item, i) => (
            <View key={item.id} style={{ width: '50%', flexDirection: 'row', gap: 8, paddingRight: 12 }}>
              <Text style={{ fontSize: 8.5, fontWeight: 800, opacity: 0.6, width: 14 }}>{String(i + 1).padStart(2, '0')}</Text>
              <Text style={{ fontSize: 8.5, fontWeight: 600 }}>{item.title}</Text>
            </View>
          ))}
        </View>
      </View>
    </Page>
  )
}

function PageChrome({ report }: { report: Report }) {
  const company = report.meta.title.slice(1).join(' ') || report.meta.title.join(' ')
  return (
    <>
      <View
        fixed
        style={{
          position: 'absolute',
          top: 24,
          left: PAGE.margin,
          right: PAGE.margin,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 7,
          borderBottomWidth: 1,
          borderBottomColor: C.line,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: C.p, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 6.5, lineHeight: 1, fontWeight: 800, color: '#FFFFFF' }}>A</Text>
          </View>
          <Text style={{ fontSize: 7.5, fontWeight: 700, color: C.ink }}>{report.meta.title[0]}</Text>
          <Text style={{ fontSize: 7.5, color: C.muted }}>· {company}</Text>
        </View>
        <Text style={{ fontSize: 7.5, color: C.muted }}>{fact(report, 'Período analizado')}</Text>
      </View>
      <Text fixed style={{ position: 'absolute', bottom: 22, left: PAGE.margin, fontSize: 7, color: C.muted }}>
        {report.meta.eyebrow} · Generado {fact(report, 'Generado')}
      </Text>
      {/* Número de página: se recalcula en cada hoja. Con ancho/alto fijos y sin lineHeight propio
          ni heredado (react-pdf lo descarta o falla en documentos largos) */}
      <Text
        fixed
        style={{ position: 'absolute', bottom: 20, right: PAGE.margin, width: 90, height: 12, fontSize: 7, color: C.muted, textAlign: 'right' }}
        render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
      />
    </>
  )
}

function Legend({ items }: { items: [string, string][] }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 6 }}>
      {items.map(([color, label]) => (
        <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: color }} />
          <Text style={{ fontSize: 7.5, color: C.ink2 }}>{label}</Text>
        </View>
      ))}
    </View>
  )
}

const Note = ({ children }: { children: string }) => (
  <Text style={[s.cardSub, { marginTop: 6, marginBottom: 0 }]}>{pdfText(children)}</Text>
)

export function ReportDocument({ report }: { report: Report }) {
  const { summary, alerts, evolution: ev, types, team, clients, quality, openTasks, footer, index } = report
  const half = cardInner(HALF_W)
  const full = cardInner(CONTENT_W)
  const company = report.meta.title.slice(1).join(' ')
  const openBlocks = chunks(openTasks.table.rows, OPEN_ROWS_PER_BLOCK)

  return (
    <Document
      title={report.meta.title.join(' · ')}
      author="Auvo Report"
      subject={`${report.meta.eyebrow} · ${fact(report, 'Período analizado')}`}
      creator="Auvo Report"
      producer="Auvo Report"
      language="es"
    >
      <Cover report={report} />

      <Page size="A4" style={s.page}>
        <PageChrome report={report} />

        {/* Introducción */}
        <View style={[s.card, { backgroundColor: C.surface, borderColor: C.surface }]}>
          <Rich text={index.intro} style={{ fontSize: 8.5, color: C.ink2, lineHeight: 1.5 }} />
        </View>

        {/* 01 Resumen */}
        <Keep>
          <SectionTitle n={1} title={summary.title} lead={summary.lead} />
          <KpiGrid kpis={summary.kpis} cols={4} />
        </Keep>

        {/* 02 Puntos de atención */}
        <Keep>
          <SectionTitle n={2} title={alerts.title} lead={alerts.lead} />
          {alerts.items[0] && <AlertItem {...alerts.items[0]} />}
        </Keep>
        {alerts.items.slice(1).map((a) => (
          <AlertItem key={a.title} {...a} />
        ))}

        {/* 03 Evolución */}
        <Keep>
          <SectionTitle n={3} title={ev.title} lead={ev.lead} />
          <Card>
            <Legend items={[[C.soft, ev.weekly.legend[0]], [C.p2, ev.weekly.legend[1]]]} />
            <PdfWeekly points={ev.weekly.points} width={full} />
          </Card>
        </Keep>
        <Card>
          <Table width={full} {...ev.weeklyTable} widths={[1.9, 0.8, 0.9, 0.9, 0.7, 1, 0.8, 0.9]} />
          {ev.weeklyTable.note && <Note>{ev.weeklyTable.note}</Note>}
        </Card>
        <Card title={ev.daily.title} subtitle={ev.daily.subtitle}>
          <PdfArea points={ev.daily.points} width={full} />
        </Card>
        <Keep>
          <Row>
            <Card title={ev.heatmap.title} subtitle={ev.heatmap.subtitle} width={TWO_THIRDS_W}>
              <PdfHeatmap {...ev.heatmap} width={cardInner(TWO_THIRDS_W)} />
            </Card>
            <Card title={ev.weekday.title} subtitle={ev.weekday.subtitle} width={THIRD_W}>
              <PdfColumns bars={ev.weekday.bars} width={cardInner(THIRD_W)} height={106} />
            </Card>
          </Row>
        </Keep>

        {/* 04 Tipos y prioridad */}
        <Keep>
          <SectionTitle n={4} title={types.title} lead={types.lead} />
          <Row>
            <Card title={types.byType.title} subtitle={types.byType.subtitle} width={HALF_W}>
              <PdfHBar bars={types.byType.bars} width={half} labelWidth={140} rowHeight={17} />
            </Card>
            <Card width={HALF_W}>
              <Text style={s.cardTitle}>{types.priority.title}</Text>
              <Text style={s.cardSub}>{pdfText(types.priority.subtitle ?? '')}</Text>
              <StackBar segments={types.priority.segments} />
              <Text style={[s.cardTitle, { marginTop: 12 }]}>{types.status.title}</Text>
              <Text style={s.cardSub}>{pdfText(types.status.subtitle ?? '')}</Text>
              <StackBar segments={types.status.segments} />
              <Text style={[s.cardTitle, { marginTop: 12 }]}>{types.creators.title}</Text>
              <Text style={s.cardSub}>{pdfText(types.creators.subtitle ?? '')}</Text>
              <PdfHBar bars={types.creators.bars} width={half} labelWidth={80} rowHeight={14} />
            </Card>
          </Row>
        </Keep>

        {/* 05 Equipo técnico */}
        <Keep>
          <SectionTitle n={5} title={team.title} lead={team.lead.replace(' Haga clic en los encabezados para ordenar.', '')} />
          <Row>
            <Card title={team.byOwner.title} subtitle={team.byOwner.subtitle} width={HALF_W}>
              <PdfHBar bars={team.byOwner.bars} width={half} labelWidth={80} rowHeight={14} />
            </Card>
            <Card title={team.punctuality.title} subtitle={team.punctuality.subtitle} width={HALF_W}>
              <PdfHBar bars={team.punctuality.bars} width={half} labelWidth={80} rowHeight={14} />
            </Card>
          </Row>
        </Keep>
        <Card>
          <Table width={full} {...team.table} fontSize={7} widths={[1.7, 0.7, 0.8, 0.9, 0.8, 0.9, 1.2, 1, 1, 0.7, 0.8]} />
        </Card>

        {/* 06 Clientes y locales */}
        <Keep>
          <SectionTitle n={6} title={clients.title} lead={clients.lead} />
          <Row>
            <Card title={clients.byGroup.title} subtitle={clients.byGroup.subtitle} width={HALF_W}>
              <PdfHBar bars={clients.byGroup.bars} width={half} labelWidth={86} rowHeight={15} />
            </Card>
            <Card title={clients.topLocations.title} subtitle={clients.topLocations.subtitle} width={HALF_W}>
              <PdfHBar bars={clients.topLocations.bars} width={half} labelWidth={96} rowHeight={13} />
            </Card>
          </Row>
        </Keep>
        <Card title={clients.groupTable.title} subtitle={clients.groupTable.subtitle}>
          <Table width={full} columns={clients.groupTable.columns} rows={clients.groupTable.rows} widths={[1.8, 0.8, 0.8, 0.9, 0.9, 1, 1]} />
        </Card>
        <Card title={clients.equipment.title} subtitle={clients.equipment.subtitle}>
          <Table width={full} columns={clients.equipment.columns} rows={clients.equipment.rows} widths={[4, 1]} />
          {clients.equipment.note && <Note>{clients.equipment.note}</Note>}
        </Card>

        {/* 07 Calidad en campo */}
        <Keep>
          <SectionTitle n={7} title={quality.title} lead={quality.lead} />
          <KpiGrid kpis={quality.kpis} cols={5} />
        </Keep>
        {[
          [quality.arrival, quality.duration],
          [quality.response, quality.distance],
        ].map((pair, i) => (
          <Keep key={i}>
            <Row>
              {pair.map((c) => (
                <Card key={c.title} title={c.title} subtitle={c.subtitle} width={HALF_W}>
                  <PdfColumns bars={c.bars} width={half} />
                </Card>
              ))}
            </Row>
          </Keep>
        ))}
        <Card title={quality.evidence.title} subtitle={quality.evidence.subtitle}>
          {quality.evidence.bars.length ? (
            <PdfHBar bars={quality.evidence.bars} width={full} labelWidth={170} rowHeight={15} />
          ) : (
            <Text style={{ fontSize: 8, color: C.muted }}>Sin pendientes registrados</Text>
          )}
        </Card>

        {/* 08 Tareas abiertas: bloques con encabezado propio; el primero va junto al título */}
        {openBlocks.map((rows, i) => (
          <Keep key={i}>
            {i === 0 && <SectionTitle n={8} title={openTasks.title} lead={openTasks.lead} />}
            <Card>
              <Table width={full}
                columns={openTasks.table.columns}
                rows={rows}
                fontSize={6.8}
                widths={[0.85, 1.12, 1.05, 1.3, 2, 2.45, 0.9, 0.9]}
              />
              {openBlocks.length > 1 && (
                <Note>
                  {`Tareas ${i * OPEN_ROWS_PER_BLOCK + 1}–${i * OPEN_ROWS_PER_BLOCK + rows.length} de ${openTasks.table.rows.length}`}
                </Note>
              )}
            </Card>
          </Keep>
        ))}

        {/* Metodología */}
        <Keep>
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 10, fontWeight: 800, color: C.p, marginBottom: 6 }}>{footer.title}</Text>
            {footer.definitions.map((d) => (
              <View key={d.term} style={{ flexDirection: 'row', gap: 10, marginBottom: 3 }}>
                <Text style={{ width: 110, fontSize: 7.5, fontWeight: 700, color: C.ink2 }}>{d.term}</Text>
                <Text style={{ flex: 1, fontSize: 7.5, lineHeight: 1.4, color: C.muted }}>{pdfText(d.text)}</Text>
              </View>
            ))}
            <Text style={{ fontSize: 7, color: C.muted, marginTop: 8 }}>
              {pdfText(footer.note)}
              {company ? ` · ${company}` : ''}
            </Text>
          </View>
        </Keep>
      </Page>
    </Document>
  )
}
