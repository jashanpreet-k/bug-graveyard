import type {CSSProperties} from 'react'

import styles from './Tombstone.module.css'

// Styled with a CSS module rather than Tailwind so the same component renders
// correctly inside Sanity Studio, which doesn't load the site's Tailwind CSS.

export type TombstoneLook = 'resting' | 'disturbed' | 'zombie'

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
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

// Sanity dates are "YYYY-MM-DD", which JavaScript reads as UTC midnight. Format
// them in UTC too, or anyone west of Greenwich sees every bug die a day early.
function formatDate(date?: string | null) {
  return date ? dateFormat.format(new Date(date)) : null
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
}: TombstoneProps) {
  const born = formatDate(bornAt) ?? '?'
  const died = formatDate(diedAt) ?? (look === 'zombie' ? 'still walking' : '?')

  return (
    <article className={styles.plot} data-look={look}>
      <div className={styles.stone}>
        {look === 'zombie' && <Cracks />}
        <p className={styles.kicker}>
          {look === 'zombie' ? 'Risen' : look === 'disturbed' ? <s>R.I.P.</s> : 'R.I.P.'}
        </p>
        <h2 className={styles.name}>{name}</h2>
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
