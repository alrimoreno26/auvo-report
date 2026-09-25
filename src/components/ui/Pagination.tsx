import { fnum } from '../../generator/format'

const PAGE_SIZES = [10, 25, 50, 0] as const // 0 = todas

interface Props {
  page: number
  pageSize: number
  total: number
  onPage: (page: number) => void
  onPageSize: (size: number) => void
}

/** Números de página a mostrar: primera, última y las vecinas de la actual, con "…" en los saltos. */
function pageList(current: number, pages: number): (number | '…')[] {
  const wanted = new Set([1, pages, current - 1, current, current + 1].filter((p) => p >= 1 && p <= pages))
  const sorted = [...wanted].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(p - sorted[i - 1] === 2 ? p - 1 : '…')
    out.push(p)
  })
  return out
}

export function Pagination({ page, pageSize, total, onPage, onPageSize }: Props) {
  const pages = pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1
  const from = total ? (pageSize ? (page - 1) * pageSize + 1 : 1) : 0
  const to = pageSize ? Math.min(page * pageSize, total) : total

  return (
    <div className="pagination">
      <span className="pagination-info">
        Mostrando <b>{fnum(from)}</b>–<b>{fnum(to)}</b> de <b>{fnum(total)}</b>
      </span>

      <label className="pagination-size">
        Filas
        <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}>
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s || 'Todas'}
            </option>
          ))}
        </select>
      </label>

      {pages > 1 && (
        <nav className="pagination-pages" aria-label="Paginación">
          <button type="button" onClick={() => onPage(page - 1)} disabled={page === 1} aria-label="Página anterior">
            ‹
          </button>
          {pageList(page, pages).map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="pagination-gap">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={p === page ? 'on' : undefined}
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onPage(p)}
              >
                {p}
              </button>
            ),
          )}
          <button type="button" onClick={() => onPage(page + 1)} disabled={page === pages} aria-label="Página siguiente">
            ›
          </button>
        </nav>
      )}
    </div>
  )
}
