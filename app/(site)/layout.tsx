import {Geist, Grenze_Gotisch} from 'next/font/google'
import Link from 'next/link'

import {Grass, Sky} from '@/components/Scenery'
import {expireSanityTags} from '@/sanity/lib/actions'
import {SanityLive} from '@/sanity/lib/live'

import './globals.css'

const sans = Geist({variable: '--font-geist-sans', subsets: ['latin']})
const gothic = Grenze_Gotisch({variable: '--font-gothic', subsets: ['latin']})

export default function SiteLayout({children}: {children: React.ReactNode}) {
  return (
    <div
      className={`${sans.variable} ${gothic.variable} relative isolate flex min-h-screen flex-col bg-linear-to-b from-[#060913] via-[#0d1326] to-[#161b29] font-sans text-bone antialiased`}
    >
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
      </header>
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 sm:px-8">{children}</main>
      <Grass />
      <SanityLive action={expireSanityTags} />
    </div>
  )
}
