import Link from 'next/link'

export type RankedItem = {
  key: string
  label: string
  href: string
  value: number
  /** The value as words, printed at the bar's tip, e.g. "14 hours". */
  valueLabel: string
  /** A small identity dot beside the label, e.g. a language's colour. */
  marker?: string | null
}

// A ranked list with one bar per row. It's a single series, so the heading names
// it (no legend), every value is printed at its bar's tip (nothing hides behind
// hover), and each row links somewhere useful. Bars follow the chart specs: thin,
// rounded at the data end, square at the baseline.
export function RankedBars({items, color, numbered = false}: {items: RankedItem[]; color: string; numbered?: boolean}) {
  const max = Math.max(...items.map((item) => item.value), 1)

  return (
    <ol className="flex flex-col">
      {items.map((item, index) => (
        <li key={item.key}>
          <Link
            href={item.href}
            className="flex gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-bone/5 focus-visible:outline-2 focus-visible:outline-moss"
          >
            {numbered && <span className="w-4 shrink-0 text-right text-sm text-bone/50">{index + 1}</span>}
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="flex items-center gap-2 text-bone">
                {item.marker && (
                  <span className="size-2 shrink-0 rounded-full" style={{background: item.marker}} aria-hidden />
                )}
                <span className="truncate">{item.label}</span>
              </span>
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-2.5 rounded-r-[4px]"
                  style={{background: color, width: `calc((100% - 5rem) * ${item.value / max})`}}
                />
                <span className="whitespace-nowrap text-sm text-bone/75">{item.valueLabel}</span>
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
