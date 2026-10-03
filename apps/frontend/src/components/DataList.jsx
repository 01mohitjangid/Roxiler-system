import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconTile } from '@/components/IconTile'
import { StoreBackdrop } from '@/components/StoreBackdrop'

const hueOf = (i) => (i * 137.508 + 140) % 360

export function DataList({ columns, rows, sort, onSort, empty = 'Nothing found.', icon, emptyArt }) {
  const [titleCol, ...others] = columns
  const subtitle = others.find((c) => c.placement === 'subtitle')
  const footer = others.find((c) => c.placement === 'footer')
  const fields = others.filter((c) => !c.placement)
  const value = (c, row) => (c.render ? c.render(row) : (row[c.key] ?? '—'))

  return (
    <div className="grid gap-4">
      {emptyArt && rows?.length === 0 && <StoreBackdrop />}
      <SortBar columns={columns.filter((c) => c.sortable !== false)} sort={sort} onSort={onSort} />

      {rows === null ? (
        <ul role="status" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <span className="sr-only">Loading…</span>
          {[0, 1, 2].map((i) => (
            <li key={i} className="grid gap-4 rounded-xl border bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                <div className="size-10 animate-pulse rounded-lg bg-muted" />
                <div className="grid flex-1 gap-2">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <div role="status" className="grid place-items-center gap-3 rounded-xl border border-dashed bg-card px-6 py-12 text-center">
          <IconTile icon={Inbox} className="size-12" iconClassName="size-6" />
          <p className="text-sm text-muted-foreground">{empty}</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row, i) => {
            const hue = hueOf(i)
            return (
              <li
                key={row.id}
                className="page-enter group/card relative flex flex-col overflow-hidden rounded-xl border bg-card p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ backgroundColor: `oklch(var(--tile-bar-l) var(--tile-bar-c) ${hue})` }}
                />
                <div className="flex items-center gap-3">
                  {icon && (
                    <IconTile icon={icon} hue={hue} className="transition duration-200 group-hover/card:scale-105" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{value(titleCol, row)}</p>
                    {subtitle && (
                      <p className="truncate text-sm text-muted-foreground" title={String(row[subtitle.key] ?? '')}>
                        {value(subtitle, row)}
                      </p>
                    )}
                  </div>
                </div>
                {fields.length > 0 && (
                  <dl className="mt-4 grid gap-2 text-sm">
                    {fields.filter((c) => !c.show || c.show(row)).map((c) => (
                      <div key={c.key} className="flex items-center justify-between gap-3">
                        <dt className="shrink-0 text-muted-foreground">{c.label}</dt>
                        <dd className="min-w-0 truncate text-right font-medium" title={c.render ? undefined : String(row[c.key] ?? '')}>
                          {value(c, row)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                {footer && (
                  <div className="mt-auto pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                      <span className="text-sm text-muted-foreground">{footer.label}</span>
                      {value(footer, row)}
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function SortBar({ columns, sort, onSort }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Sort by">
      <span className="text-sm text-muted-foreground">Sort by</span>
      {columns.map((c) => {
        const active = sort.sort === c.key
        const Icon = !active ? ArrowUpDown : sort.order === 'asc' ? ArrowUp : ArrowDown
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onSort(c.key)}
            aria-pressed={active}
            aria-label={`Sort by ${c.label}${active ? (sort.order === 'asc' ? ', ascending' : ', descending') : ''}`}
            className={cn(
              'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {c.label}
            <Icon className={cn('size-3.5', !active && 'opacity-60')} aria-hidden />
          </button>
        )
      })}
    </div>
  )
}
