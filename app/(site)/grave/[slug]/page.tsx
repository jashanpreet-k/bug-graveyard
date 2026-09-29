import type {Metadata} from 'next'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {cache, type ReactNode} from 'react'

import {LifeChain} from '@/components/LifeChain'
import {Tombstone} from '@/components/Tombstone'
import {diedAt, formatDate, lookFor, pastLivesOf, statusLabel} from '@/lib/graves'
import {sanityFetch} from '@/sanity/lib/live'
import {GRAVE_QUERY, GRAVE_SLUGS_QUERY} from '@/sanity/lib/queries'

// Shared by generateMetadata and the page, so a request fetches the grave once.
const getGrave = cache(async (slug: string) => {
  const {data} = await sanityFetch({query: GRAVE_QUERY, params: {slug}, stega: false})
  return data
})

export async function generateStaticParams() {
  const {data} = await sanityFetch({query: GRAVE_SLUGS_QUERY, perspective: 'published', stega: false})
  return data
}

export async function generateMetadata({params}: PageProps<'/grave/[slug]'>): Promise<Metadata> {
  const grave = await getGrave((await params).slug)
  if (!grave) return {title: 'This grave is empty'}
  return {title: `RIP ${grave.name}`, description: grave.epitaph ?? undefined}
}

export default async function GravePage({params}: PageProps<'/grave/[slug]'>) {
  const grave = await getGrave((await params).slug)
  if (!grave) notFound()

  const {lives: pastLives, hasOlderLives} = pastLivesOf(grave)

  return (
    <>
      <Link href="/" className="text-sm text-bone/70 underline-offset-4 hover:text-bone hover:underline">
        ← All graves
      </Link>

      <div className="mt-8 grid items-start justify-items-center gap-12 lg:grid-cols-[24rem_1fr] lg:justify-items-stretch">
        <Tombstone
          size="large"
          headingLevel={1}
          name={grave.name}
          epitaph={grave.epitaph}
          bornAt={grave.bornAt}
          diedAt={diedAt(grave)}
          language={grave.language}
          causeOfDeath={grave.causeOfDeath?.title}
          risenFrom={grave.previousLife?.name}
          look={lookFor({status: grave.status, disturbed: grave.risen.length > 0})}
        />

        <section aria-labelledby="certificate" className="w-full max-w-2xl">
          <h2 id="certificate" className="font-display text-3xl text-bone">
            Death certificate
          </h2>
          <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <Detail label="Status">{statusLabel(grave.status)}</Detail>
            <Detail label="Cause of death">
              {grave.causeOfDeath?.title ?? 'Unknown'}
              {grave.causeOfDeath?.description && (
                <span className="mt-1 block text-sm text-bone/65">{grave.causeOfDeath.description}</span>
              )}
            </Detail>
            <Detail label="Severity">{grave.severity ? capitalize(grave.severity) : 'Unknown'}</Detail>
            <Detail label="Hours to kill">
              {grave.hoursToKill != null
                ? `${grave.hoursToKill} ${grave.hoursToKill === 1 ? 'hour' : 'hours'}`
                : 'Unknown'}
            </Detail>
            <Detail label="Killed by">
              {grave.killedBy ?? (grave.status === 'zombie' ? 'Nobody yet' : 'Unknown')}
            </Detail>
            <Detail label="Language">{grave.language?.name ?? 'Unknown'}</Detail>
            <Detail label="Born">{formatDate(grave.bornAt) ?? 'Unknown'}</Detail>
            <Detail label="Fix merged">{formatDate(grave.fixMergedAt) ?? 'Not yet'}</Detail>
            <Detail label="Buried">{formatDate(grave.buriedAt) ?? 'Not yet'}</Detail>
            {(grave.timesResurrected ?? 0) > 0 && (
              <Detail label="Times resurrected">{grave.timesResurrected}</Detail>
            )}
          </dl>
        </section>
      </div>

      {pastLives.length > 0 && (
        <section aria-labelledby="past-lives" className="mt-20">
          <h2 id="past-lives" className="font-display text-3xl text-bone">
            Past lives
          </h2>
          <p className="mt-2 text-bone/70">This bug has died before. Oldest first.</p>
          <div className="mt-8">
            <LifeChain
              lives={pastLives.map((life) => ({
                ...life,
                diedAt: diedAt(life),
                look: lookFor({status: life.status, disturbed: true}),
              }))}
              hasOlderLives={hasOlderLives}
              end="this grave"
            />
          </div>
        </section>
      )}

      {grave.risen.length > 0 && (
        <section aria-labelledby="risen" className="mt-20">
          <h2 id="risen" className="font-display text-3xl text-moss">
            Risen from this grave
          </h2>
          <p className="mt-2 text-bone/70">
            {grave.risen.length === 1 ? 'It came back.' : `It came back ${grave.risen.length} times.`}
          </p>
          <ul className="mt-8 flex flex-wrap justify-center gap-8 sm:justify-start">
            {grave.risen.map((zombie) => (
              <li key={zombie.slug}>
                <Tombstone
                  size="mini"
                  headingLevel={3}
                  href={`/grave/${zombie.slug}`}
                  name={zombie.name}
                  epitaph={zombie.epitaph}
                  bornAt={zombie.bornAt}
                  diedAt={diedAt(zombie)}
                  look={lookFor(zombie)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

function Detail({label, children}: {label: string; children: ReactNode}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-bone/60">{label}</dt>
      <dd className="mt-1 text-lg text-bone">{children}</dd>
    </div>
  )
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
