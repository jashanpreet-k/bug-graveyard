import Link from 'next/link'
import type {CSSProperties} from 'react'

import {formatDate, type StoneStyle} from '@/lib/graves'

import styles from './Tombstone.module.css'

// Styled with a CSS module rather than Tailwind so the same component renders
// correctly inside Sanity Studio, which doesn't load the site's Tailwind CSS.

export type TombstoneLook = 'resting' | 'disturbed' | 'zombie' | 'haunted'

export type TombstoneSize = 'mini' | 'regular' | 'large'

export type TombstoneProps = {
  name: string
  epitaph?: string | null
  bornAt?: string | null
  diedAt?: string | null
  language?: {name: string; color?: string | null} | null
  causeOfDeath?: string | null
  /** For a zombie: the name of the grave it rose from. */
  risenFrom?: string | null
  look?: TombstoneLook
  size?: TombstoneSize
  /** Makes the whole stone a link, e.g. to the grave's own page. */
  href?: string
  /** Use 1 when this stone is what the page is about. */
  headingLevel?: 1 | 2 | 3
  /** Shape, size and tilt for a regular stone; see stoneStyleFor. */
  stone?: StoneStyle
}

export function Tombstone({
  name,
  epitaph,
  bornAt,
  diedAt,
  language,
  causeOfDeath,
  risenFrom,
  look = 'resting',
  size = 'regular',
  href,
  headingLevel = 2,
  stone,
}: TombstoneProps) {
  const Heading = `h${headingLevel}` as const
  const born = formatDate(bornAt) ?? '?'
  const died = formatDate(diedAt) ?? (look === 'zombie' ? 'still walking' : '?')

  // Only resting stones lean: a disturbed one is already knocked over, a zombie stands tall.
  const variety = stone && {
    '--stone-height': `${19 + stone.height}rem`,
    '--stone-width': `${stone.width}rem`,
    '--stone-tilt': `${look === 'resting' ? stone.tilt : 0}deg`,
  }

  return (
    <article
      className={styles.plot}
      data-look={look}
      data-size={size}
      data-shape={stone?.shape}
      style={variety as CSSProperties | undefined}
    >
      <div className={styles.stone}>
        {look === 'zombie' && <Cracks />}
        <p className={styles.kicker}>
          {look === 'zombie' ? 'Risen' : look === 'disturbed' ? <s>R.I.P.</s> : look === 'haunted' ? '👻 Haunted' : 'R.I.P.'}
        </p>
        <Heading className={styles.name}>
          {href ? (
            <Link href={href} className={styles.link}>
              {name}
            </Link>
          ) : (
            name
          )}
        </Heading>
        <p className={styles.dates}>
          <time dateTime={bornAt ?? undefined}>{born}</time>
          {' – '}
          <time dateTime={diedAt ?? undefined}>{died}</time>
        </p>
        {epitaph && <p className={styles.epitaph}>“{epitaph}”</p>}
        {(language || causeOfDeath) && (
          <p className={styles.meta}>
            {language && (
              <span
                className={styles.language}
                style={{'--language-color': language.color ?? '#9ca3af'} as CSSProperties}
              >
                {language.name}
              </span>
            )}
            {causeOfDeath && <span className={styles.cause}>{causeOfDeath}</span>}
          </p>
        )}
      </div>
      <div className={styles.mound} aria-hidden />
      {look === 'disturbed' && <p className={styles.caption}>The grave is empty. It rose again.</p>}
      {look === 'haunted' && <p className={styles.caption}>Haunted: a new bug might be this one coming back.</p>}
      {look === 'zombie' && risenFrom && (
        <p className={styles.caption}>Rose from “{risenFrom}”</p>
      )}
    </article>
  )
}

function Cracks() {
  return (
    <svg className={styles.cracks} viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden>
      <path d="M73 3 L69 12 L76 19 L71 29" />
      <path d="M69 12 L63 15" />
      <path d="M100 96 L92 100 L95 107 L87 113" />
      <path d="M0 106 L9 103 L14 111 L24 108" />
    </svg>
  )
}
