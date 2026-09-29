import type {ReactNode} from 'react'

import {Tombstone, type TombstoneLook} from './Tombstone'

export type ChainLife = {
  slug: string
  name: string
  epitaph: string | null
  bornAt: string | null
  diedAt: string | null
  look: TombstoneLook
}

// A bug's lives as a row of small linked tombstones joined by arrows, oldest
// first. "…and older lives" leads when the chain goes back further than shown,
// and `end` (e.g. "this grave") closes it.
export function LifeChain({
  lives,
  hasOlderLives,
  end,
}: {
  lives: ChainLife[]
  hasOlderLives: boolean
  end?: ReactNode
}) {
  return (
    <ol className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap">
      {hasOlderLives && <li className="text-sm italic text-bone/60">…and older lives</li>}
      {lives.map((life, index) => (
        <li key={life.slug} className="flex flex-col items-center gap-4 sm:flex-row">
          {(hasOlderLives || index > 0) && <Arrow />}
          <Tombstone
            size="mini"
            headingLevel={3}
            href={`/grave/${life.slug}`}
            name={life.name}
            epitaph={life.epitaph}
            bornAt={life.bornAt}
            diedAt={life.diedAt}
            look={life.look}
          />
        </li>
      ))}
      {end && (
        <li className="flex flex-col items-center gap-4 sm:flex-row">
          <Arrow />
          <span className="text-sm text-bone/70">{end}</span>
        </li>
      )}
    </ol>
  )
}

function Arrow() {
  return (
    <span aria-hidden className="text-2xl text-bone/40">
      <span className="sm:hidden">↓</span>
      <span className="hidden sm:inline">→</span>
    </span>
  )
}
