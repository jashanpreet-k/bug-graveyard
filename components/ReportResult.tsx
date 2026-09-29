import Link from 'next/link'

import {MATCH_CANDIDATE, MATCH_DISMISSED, MATCH_NONE, MATCH_THRESHOLD} from '@/sanity/lib/detector'

// A public report's coroner draft and Zombie Detector result, for the report page's
// pending list and its "Your report" panel. The page screens the AI's text for
// profanity on the server before it gets here (`draft` and `reason` are null if not).

export interface ReportView {
  _id: string
  name: string | null
  language: string | null
  whatHappened: string | null
  submittedAt: string | null
  /** The coroner's draft epitaph, if it passed the check */
  draft: string | null
  /** The coroner wrote a draft that failed the check */
  draftHeld: boolean
  cause: string | null
  matchStatus: string | null
  matchScore: number | null
  /** The Agent Action's one-sentence reason, if it passed the check */
  reason: string | null
  signals: {_key: string; label: string | null; matched: boolean | null; detail: string | null; points: number | null}[]
  candidate: {name: string | null; slug: string | null; fixSummary: string | null; fixUrl: string | null} | null
}

export function ReportResult({report}: {report: ReportView}) {
  const examined = Boolean(report.draft || report.draftHeld || report.matchStatus)
  if (!examined) {
    return <p className="text-bone/70">🩺 The coroner is examining the body…</p>
  }
  return (
    <div className="flex flex-col gap-4">
      <Detector report={report} />
      <div>
        {report.draft ? (
          <>
            <p className="text-xs tracking-wide text-moss uppercase">Coroner’s draft · awaiting approval</p>
            <p className="mt-1 font-serif text-base text-bone italic">“{report.draft}”</p>
            {report.cause && <p className="mt-1 text-bone/70">Cause of death: {report.cause}</p>}
          </>
        ) : (
          <p className="text-bone/70">🩺 The coroner’s draft is waiting for review.</p>
        )}
      </div>
    </div>
  )
}

function Detector({report}: {report: ReportView}) {
  if (report.matchStatus === MATCH_CANDIDATE && report.candidate) {
    const {candidate} = report
    return (
      <div className="rounded-lg border border-[#cfe0ff]/35 bg-[#141b2c] p-3">
        <p className="font-medium text-[#dbe6ff]">
          ⚠️ Possible resurrection of{' '}
          {candidate.slug ? (
            <Link href={`/grave/${candidate.slug}`} className="underline underline-offset-4 hover:text-moss">
              {candidate.name}
            </Link>
          ) : (
            candidate.name
          )}
        </p>
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {report.signals.map((signal) => (
            <li key={signal._key} className="flex gap-2">
              <span aria-hidden className={signal.matched ? 'text-moss' : 'text-bone/45'}>
                {signal.matched ? '✓' : '✗'}
              </span>
              <span className="sr-only">{signal.matched ? 'Matched:' : 'Not matched:'}</span>
              <span className="text-bone/85">
                {signal.label} <span className="text-bone/60">({signal.detail})</span>
              </span>
              <span className="ml-auto text-bone/55">+{signal.points ?? 0}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-bone/80">
          Match score <strong className="text-bone">{report.matchScore}</strong> from {report.signals.length} signals (a
          possible resurrection needs {MATCH_THRESHOLD}).
        </p>
        {report.reason && <p className="mt-2 text-sm text-bone/80 italic">{report.reason}</p>}
        {candidate.fixSummary && (
          <p className="mt-2 text-sm text-bone/70">
            The previous fix: {candidate.fixSummary}
            {candidate.fixUrl && (
              <a href={candidate.fixUrl} rel="nofollow noopener" className="ml-2 text-moss underline underline-offset-4">
                See it ↗
              </a>
            )}
          </p>
        )}
        <p className="mt-2 text-sm text-[#dbe6ff]">The graveyard keeper will confirm it.</p>
      </div>
    )
  }
  if (report.matchStatus === MATCH_NONE) {
    return (
      <p className="text-sm text-bone/75">
        👻 No known ghosts, a brand new bug.{' '}
        <span className="text-bone/55">
          (The closest grave scored {report.matchScore ?? 0} from 4 signals; a possible resurrection needs {MATCH_THRESHOLD}.)
        </span>
      </p>
    )
  }
  if (report.matchStatus === MATCH_DISMISSED) {
    return <p className="text-sm text-bone/75">✖ Not a resurrection: the graveyard keeper says it’s a new bug.</p>
  }
  return null
}
