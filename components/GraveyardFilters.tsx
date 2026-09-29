import Link from 'next/link'
import type {CSSProperties, ReactNode} from 'react'

import type {GRAVEYARD_FILTERS_QUERY_RESULT} from '@/sanity/types'

type Active = {language?: string; cause?: string}

// Filters are plain links that set ?language= and ?cause=, so they work without
// JavaScript and every filtered view has a shareable URL.
export function GraveyardFilters({
  options,
  active,
}: {
  options: GRAVEYARD_FILTERS_QUERY_RESULT
  active: Active
}) {
  // Hide empty options, unless the URL already selects one.
  const languages = options.languages.filter((l) => l.count > 0 || l.name === active.language)
  const causes = options.causes.filter((c) => c.count > 0 || c.title === active.cause)

  return (
    <nav aria-label="Filter graves" className="flex flex-col gap-3">
      <FilterRow label="Language">
        <Chip href={hrefWith(active, {language: undefined})} active={!active.language}>
          All
        </Chip>
        {languages.map((language) => (
          <Chip
            key={language.name}
            href={hrefWith(active, {language: language.name})}
            active={active.language === language.name}
            count={language.count}
          >
            <span
              className="size-2 rounded-full bg-(--dot)"
              style={{'--dot': language.color ?? '#9ca3af'} as CSSProperties}
              aria-hidden
            />
            {language.name}
          </Chip>
        ))}
      </FilterRow>
      <FilterRow label="Cause of death">
        <Chip href={hrefWith(active, {cause: undefined})} active={!active.cause}>
          All
        </Chip>
        {causes.map((cause) => (
          <Chip
            key={cause.title}
            href={hrefWith(active, {cause: cause.title})}
            active={active.cause === cause.title}
            count={cause.count}
          >
            {cause.title}
          </Chip>
        ))}
      </FilterRow>
    </nav>
  )
}

function FilterRow({label, children}: {label: string; children: ReactNode}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4">
      <span className="w-40 shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-bone/60">
        {label}
      </span>
      <ul className="flex flex-wrap gap-2">{children}</ul>
    </div>
  )
}

function Chip({
  href,
  active,
  count,
  children,
}: {
  href: string
  active: boolean
  count?: number
  children: ReactNode
}) {
  return (
    <li>
      <Link
        href={href}
        scroll={false}
        aria-current={active ? 'true' : undefined}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss ${
          active
            ? 'border-bone bg-bone text-night'
            : 'border-bone/20 bg-night/40 text-bone/85 hover:border-bone/50 hover:text-bone'
        }`}
      >
        {children}
        {count !== undefined && <span className="text-xs opacity-75">{count}</span>}
      </Link>
    </li>
  )
}

function hrefWith(active: Active, change: Active) {
  const next = {...active, ...change}
  const params = new URLSearchParams()
  if (next.language) params.set('language', next.language)
  if (next.cause) params.set('cause', next.cause)
  const query = params.toString()
  return query ? `/?${query}` : '/'
}
