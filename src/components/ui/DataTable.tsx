import { useMemo, useState, type ReactNode } from 'react'
import type { TableCell, TableData } from '../../types/report'

interface Props extends TableData {
  /** Muestra un buscador que filtra por el texto de cualquier celda */
  searchPlaceholder?: string
}

type Sort = { col: number; asc: boolean } | null

const rowText = (cells: TableCell[]) => cells.map((c) => c.text).join(' ').toLowerCase()

function compare(a: TableCell, b: TableCell) {
  if (a.sort !== undefined && b.sort !== undefined) {
    // sin dato se ordena al final/principio (evita NaN de -Infinity - -Infinity)
    return (a.sort ?? -1e18) - (b.sort ?? -1e18)
  }
  return a.text.localeCompare(b.text, 'es')
}

function Cell({ cell }: { cell: TableCell }) {
  let content: ReactNode = cell.text
  if (cell.href) {
    content = (
      <a href={cell.href} target="_blank" rel="noopener noreferrer">
        {cell.text}
      </a>
    )
  }
  if (cell.pill) content = <span className={`pill ${cell.pill}`}>{content}</span>
  return (
    <>
      {cell.bar !== undefined && (
        <span className="mini">
          <i style={{ width: `${cell.bar}%` }} />
        </span>
      )}
      {content}
      {cell.note && <em> {cell.note}</em>}
    </>
  )
}

export function DataTable({ columns, rows, searchPlaceholder }: Props) {
  const [sort, setSort] = useState<Sort>(null)
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q ? rows.filter((r) => rowText(r.cells).includes(q)) : rows
    if (!sort) return filtered
    return [...filtered].sort((a, b) => {
      const d = compare(a.cells[sort.col], b.cells[sort.col])
      return sort.asc ? d : -d
    })
  }, [rows, sort, query])

  function toggle(col: number) {
    setSort((s) => (s?.col === col ? { col, asc: !s.asc } : { col, asc: true }))
  }

  return (
    <>
      {searchPlaceholder && (
        <input
          className="search"
          type="search"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}
      <table>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th
                key={i}
                className={c.numeric ? 'num' : undefined}
                onClick={() => toggle(i)}
                aria-sort={sort?.col === i ? (sort.asc ? 'ascending' : 'descending') : undefined}
              >
                {c.label}
                {sort?.col === i && <span className="sort-ind">{sort.asc ? ' ▲' : ' ▼'}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, r) => (
            <tr key={r} className={row.highlight ? 'hl' : undefined}>
              {row.cells.map((cell, i) => (
                <td key={i} className={[columns[i]?.numeric && 'num', cell.tone].filter(Boolean).join(' ') || undefined}>
                  <Cell cell={cell} />
                </td>
              ))}
            </tr>
          ))}
          {visible.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="empty">
                Sin resultados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  )
}
