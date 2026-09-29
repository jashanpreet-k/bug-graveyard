import Link from 'next/link'

import {Grass, Sky} from '@/components/Scenery'
import {SiteNav} from '@/components/SiteNav'
import {expireSanityTags} from '@/sanity/lib/actions'
import {REPO_URL} from '@/lib/metadata'
import {SanityLive} from '@/sanity/lib/live'

import './globals.css'

export default function SiteLayout({children}: {children: React.ReactNode}) {
  return (
    <div
      className="relative isolate flex min-h-screen flex-col bg-linear-to-b from-[#060913] via-[#0d1326] to-[#161b29] font-sans text-bone antialiased"
    >
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-bone px-4 py-2 text-night focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Sky />
      <header className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-14 pb-8 sm:px-8">
        <Link href="/" className="inline-block focus-visible:outline-2 focus-visible:outline-moss">
          {/* Not a heading: each page's own <h1> says what the page is about. */}
          <span className="block font-display text-5xl font-bold tracking-wide text-bone drop-shadow-[0_2px_12px_rgb(0_0_0/0.8)] sm:text-7xl">
            Bug Graveyard
          </span>
        </Link>
        <p className="mt-3 max-w-xl text-base text-bone/75 sm:text-lg">
          Here lie the bugs we fixed. Most of them stayed dead.
        </p>
        <div className="mt-6">
          <SiteNav />
        </div>
      </header>
      <main id="main" className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 sm:px-8">
        {children}
      </main>
      <footer className="relative z-10 mx-auto mt-16 w-full max-w-7xl px-4 text-sm text-bone/70 sm:px-8">
        Built with Next.js + Sanity for the DEV Sanity Challenge ·{' '}
        <a href={REPO_URL} className="text-bone underline underline-offset-4 hover:text-moss">
          Source on GitHub
        </a>
      </footer>
      <Grass />
      <SanityLive action={expireSanityTags} />
    </div>
  )
}
