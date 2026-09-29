import Link from 'next/link'

import {GraveyardFilters} from '@/components/GraveyardFilters'
import {Tombstone} from '@/components/Tombstone'
import {diedAt, lookFor, stoneStyleFor} from '@/lib/graves'
import {sanityFetch} from '@/sanity/lib/live'
import {GRAVEYARD_FILTERS_QUERY, GRAVEYARD_QUERY} from '@/sanity/lib/queries'

export default async function GraveyardPage({searchParams}: PageProps<'/'>) {
  const {language, cause} = await searchParams
  const active = {language: first(language), cause: first(cause)}

  const [{data: bugs}, {data: filters}] = await Promise.all([
    sanityFetch({
      query: GRAVEYARD_QUERY,
      params: {language: active.language ?? null, cause: active.cause ?? null},
      stega: false,
    }),
    sanityFetch({query: GRAVEYARD_FILTERS_QUERY, stega: false}),
  ])

  const zombies = bugs.filter((bug) => bug.status === 'zombie').length
  const filtered = Boolean(active.language || active.cause)

  return (
    <>
      <h1 className="sr-only">Every grave in the Bug Graveyard</h1>
      <GraveyardFilters options={filters} active={active} />

      <p className="mt-8 text-sm text-bone/70" aria-live="polite">
        {bugs.length} {bugs.length === 1 ? 'grave' : 'graves'}
        {zombies > 0 && (
          <span className="text-moss">
            {' · '}
            {zombies} {zombies === 1 ? 'zombie' : 'zombies'} walking
          </span>
        )}
      </p>

      {bugs.length > 0 ? (
        <ul className="mt-8 grid grid-cols-1 items-end justify-items-center gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bugs.map((bug) => (
            <li key={bug._id} className="flex w-full justify-center">
              <Tombstone
                href={`/grave/${bug.slug}`}
                name={bug.name}
                epitaph={bug.epitaph}
                bornAt={bug.bornAt}
                diedAt={diedAt(bug)}
                language={bug.language}
                causeOfDeath={bug.causeOfDeath?.title}
                risenFrom={bug.previousLife?.name}
                look={lookFor(bug)}
                stone={stoneStyleFor(bug._id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-16 text-center text-bone/75">
          <p className="font-display text-3xl text-bone">Nothing buried here.</p>
          <p className="mt-2">
            {filtered ? 'No graves match these filters.' : 'No bugs have been laid to rest yet.'}
          </p>
          {filtered && (
            <Link href="/" scroll={false} className="mt-4 inline-block text-moss underline underline-offset-4">
              Show every grave
            </Link>
          )}
        </div>
      )}
    </>
  )
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
