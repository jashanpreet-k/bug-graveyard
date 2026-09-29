import type {Metadata} from 'next'
import Link from 'next/link'
import type {ReactNode} from 'react'

import {LifeChain} from '@/components/LifeChain'
import {RankedBars} from '@/components/RankedBars'
import {diedAt, lookFor, pastLivesOf} from '@/lib/graves'
import {openGraph} from '@/lib/metadata'
import {sanityFetch} from '@/sanity/lib/live'
import {LEADERBOARD_QUERY} from '@/sanity/lib/queries'
import type {LEADERBOARD_QUERY_RESULT} from '@/sanity/types'

const description = 'The deadliest bugs, the most haunted languages, and the bug that keeps coming back.'

export const metadata: Metadata = {
  title: 'Most Haunted',
  description,
  openGraph: openGraph('Most Haunted · Bug Graveyard', description),
}

export default async function LeaderboardPage() {
  const {data} = await sanityFetch({query: LEADERBOARD_QUERY, stega: false})
  const {deadliest, hauntedLanguages, causes, mostResurrected} = data

  return (
    <>
      <h1 className="font-display text-4xl text-bone sm:text-5xl">Most Haunted</h1>
      <p className="mt-2 text-bone/70">The bugs that fought hardest, and the ones that wouldn’t stay dead.</p>

      <div className="mt-10 flex flex-col gap-6">
        {/* Full width, so a whole resurrection chain fits on one line. */}
        <Board id="resurrected" title="Most resurrected" subtitle="The bug that keeps coming back">
          {mostResurrected ? (
            <MostResurrected bug={mostResurrected} />
          ) : (
            <Empty>Nothing has come back from the dead. Yet.</Empty>
          )}
        </Board>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Board id="deadliest" title="Deadliest bugs" subtitle="Top 5 by hours it took to kill them">
              {deadliest.length > 0 ? (
                <RankedBars
                  numbered
                  color="var(--color-ghost)"
                  items={deadliest.map((bug) => ({
                    key: bug.slug,
                    label: bug.name,
                    href: `/grave/${bug.slug}`,
                    value: bug.hoursToKill ?? 0,
                    valueLabel: plural(bug.hoursToKill ?? 0, 'hour'),
                    marker: bug.language?.color,
                  }))}
                />
              ) : (
                <Empty>No bug has a kill time yet.</Empty>
              )}
            </Board>

            {/* Stretches so both columns end level. */}
            <Board id="haunted" title="Most haunted languages" subtitle="Zombies per language: every bug that came back" grow>
              {hauntedLanguages.length > 0 ? (
                <RankedBars
                  compact
                  color="var(--color-zombie)"
                  items={hauntedLanguages.map((language) => ({
                    key: language.name,
                    label: language.name,
                    href: `/?language=${encodeURIComponent(language.name)}`,
                    value: language.zombies,
                    valueLabel: plural(language.zombies, 'zombie'),
                    marker: language.color,
                  }))}
                />
              ) : (
                <Empty>No zombies yet. Everything stayed dead.</Empty>
              )}
            </Board>
          </div>

          <Board id="causes" title="Most common causes of death" subtitle="Bugs per cause of death">
            {causes.length > 0 ? (
              <RankedBars
                compact
                color="var(--color-ghost)"
                items={causes.map((cause) => ({
                  key: cause.title,
                  label: cause.title,
                  href: `/?cause=${encodeURIComponent(cause.title)}`,
                  value: cause.bugs,
                  valueLabel: plural(cause.bugs, 'bug'),
                }))}
              />
            ) : (
              <Empty>Nothing has died yet.</Empty>
            )}
          </Board>
        </div>
      </div>
    </>
  )
}

function MostResurrected({bug}: {bug: NonNullable<LEADERBOARD_QUERY_RESULT['mostResurrected']>}) {
  const {lives, hasOlderLives} = pastLivesOf(bug)
  const times = bug.timesResurrected ?? 0

  return (
    <>
      <p className="text-bone/80">
        <Link href={`/grave/${bug.slug}`} className="text-bone underline underline-offset-4 hover:text-moss">
          {bug.name}
        </Link>{' '}
        has risen {times === 1 ? 'once' : `${times} times`}.
      </p>
      <div className="mt-6">
        <LifeChain
          lives={[
            ...lives.map((life) => ({...life, diedAt: diedAt(life), look: lookFor({status: life.status, disturbed: true})})),
            {...bug, diedAt: diedAt(bug), look: lookFor({status: bug.status})},
          ]}
          hasOlderLives={hasOlderLives}
        />
      </div>
    </>
  )
}

function Board({
  id,
  title,
  subtitle,
  grow = false,
  children,
}: {
  id: string
  title: string
  subtitle: string
  grow?: boolean
  children: ReactNode
}) {
  return (
    <section
      aria-labelledby={id}
      className={`rounded-2xl border border-bone/10 bg-crypt p-5 sm:p-6 ${grow ? 'flex-1' : ''}`}
    >
      <h2 id={id} className="font-display text-2xl text-bone sm:text-3xl">
        {title}
      </h2>
      <p className="mt-1 mb-4 text-sm text-bone/60">{subtitle}</p>
      {children}
    </section>
  )
}

function Empty({children}: {children: ReactNode}) {
  return <p className="py-6 text-center italic text-bone/60">{children}</p>
}

function plural(count: number, word: string) {
  return `${count} ${count === 1 ? word : `${word}s`}`
}
