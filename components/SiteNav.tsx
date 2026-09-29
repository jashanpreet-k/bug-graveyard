'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

const LINKS = [
  {href: '/', label: 'Graveyard', active: (path: string) => path === '/' || path.startsWith('/grave/')},
  {href: '/leaderboard', label: 'Most Haunted', active: (path: string) => path.startsWith('/leaderboard')},
]

export function SiteNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Site">
      <ul className="flex flex-wrap gap-2">
        {LINKS.map((link) => {
          const active = link.active(pathname)
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`inline-block rounded-full border px-4 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss ${
                  active
                    ? 'border-bone bg-bone text-night'
                    : 'border-bone/20 bg-night/40 text-bone/85 hover:border-bone/50 hover:text-bone'
                }`}
              >
                {link.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
