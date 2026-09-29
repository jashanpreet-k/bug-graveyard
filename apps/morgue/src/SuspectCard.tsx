import {type DocumentHandle, useDocumentProjection} from '@sanity/sdk-react'

import {MATCH_THRESHOLD} from '../../../sanity/lib/detector'

// A new bug that might be an old one coming back: which grave, the Zombie Detector's
// signals and match score, and a link to decide in the Studio.

const SITE = 'https://bug-graveyard.vercel.app'

interface Suspect {
  name: string | null
  matchScore: number | null
  matchReason: string | null
  signals: {_key: string; label: string | null; matched: boolean | null; detail: string | null; points: number | null}[] | null
  candidate: {name: string | null; slug: string | null} | null
  publicReport: string | null
}

const PROJECTION = `{
  name, matchScore, matchReason,
  "signals": matchSignals[]{_key, label, matched, detail, points},
  "candidate": resurrectionCandidate->{name, "slug": slug.current},
  "publicReport": publicReport.status
}`

export function SuspectCard({handle}: {handle: DocumentHandle}) {
  const {data: bug} = useDocumentProjection<Suspect>({...handle, projection: PROJECTION})
  if (!bug) return null
  return (
    <article className="card card--suspect">
      <h3>{bug.name ?? 'Unnamed bug'}</h3>
      <p className="suspect-of">
        might be{' '}
        {bug.candidate?.slug ? (
          <a href={`${SITE}/grave/${bug.candidate.slug}`} target="_blank" rel="noreferrer">
            {bug.candidate.name}
          </a>
        ) : (
          bug.candidate?.name
        )}{' '}
        coming back
      </p>
      <ul className="signals">
        {(bug.signals ?? []).map((signal) => (
          <li key={signal._key}>
            <span aria-hidden>{signal.matched ? '✓' : '✗'}</span> {signal.label}
            <span className="signal-detail"> ({signal.detail})</span>
          </li>
        ))}
      </ul>
      <p className="dates">
        Match score <strong>{bug.matchScore}</strong> from {bug.signals?.length ?? 0} signals (needs {MATCH_THRESHOLD})
      </p>
      {bug.matchReason && <p className="epitaph">{bug.matchReason}</p>}
      {bug.publicReport === 'pending' && <p className="note">🗳️ Reported on the site, awaiting approval</p>}
      <p className="links">
        <a href={`${SITE}/studio/intent/edit/id=${handle.documentId};type=bug`} target="_blank" rel="noreferrer">
          Confirm or dismiss in the Studio ↗
        </a>
      </p>
    </article>
  )
}
