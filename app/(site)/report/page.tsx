import type {Metadata} from 'next'

import {ReportResult, type ReportView} from '@/components/ReportResult'
import {openGraph} from '@/lib/metadata'
import {isProfane} from '@/lib/moderation'
import {CORONER_SKIPPED} from '@/sanity/lib/coroner'
import {sanityFetch} from '@/sanity/lib/live'
import {REPORT_PAGE_QUERY} from '@/sanity/lib/queries'
import {REPORTS_PER_DAY, REPORTS_PER_IP_PER_DAY} from '@/sanity/lib/publicReport'
import type {REPORT_PAGE_QUERY_RESULT} from '@/sanity/types'

import {ReportForm} from './ReportForm'

const description =
  'Report a bug you fixed. An AI coroner drafts its epitaph, the Zombie Detector checks whether it’s an old bug coming back, and it joins the graveyard once approved.'

export const metadata: Metadata = {
  title: 'Report a dead bug',
  description,
  openGraph: openGraph('Report a dead bug · Bug Graveyard', description),
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'})

// The AI's text is public before anyone approves it, so it's screened here first
function toView(
  report: REPORT_PAGE_QUERY_RESULT['pending'][number] | REPORT_PAGE_QUERY_RESULT['examples'][number],
): ReportView {
  const draft = report.coronerEpitaph
  return {
    _id: report._id,
    name: report.name,
    language: report.language,
    whatHappened: report.whatHappened,
    submittedAt: report.submittedAt,
    isExample: report.isExample,
    aiSkipped: report.coronerStatus === CORONER_SKIPPED,
    draft: draft && !isProfane(draft) ? draft : null,
    draftHeld: Boolean(draft && isProfane(draft)),
    cause: report.coronerCause,
    matchStatus: report.matchStatus,
    matchScore: report.matchScore,
    reason: report.matchReason && !isProfane(report.matchReason) ? report.matchReason : null,
    signals: report.matchSignals ?? [],
    candidate: report.candidate,
  }
}

export default async function ReportPage() {
  const {data} = await sanityFetch({query: REPORT_PAGE_QUERY, stega: false})
  const reports = data.pending.map(toView)
  const examples = data.examples.map(toView)

  return (
    <>
      <h1 className="font-display text-4xl text-bone sm:text-5xl">Report a dead bug</h1>
      <p className="mt-2 max-w-3xl text-bone/75">
        Fixed a bug worth remembering? Report it here. Within seconds the coroner (an AI running in a Sanity Function)
        drafts its epitaph, and the Zombie Detector checks the graveyard’s history: is this an old bug coming back? A
        person approves it before it joins the graveyard.
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <section aria-label="Report form">
          <ReportForm
            languages={data.languages.map((l) => ({_id: l._id, name: l.name}))}
            components={(data.components ?? []).filter((c): c is string => typeof c === 'string').sort()}
            reports={reports}
            examples={examples}
          />
          <p className="mt-3 text-xs text-bone/55">
            A report costs the graveyard one AI credit, or two when it looks like a resurrection, so the coroner examines{' '}
            {REPORTS_PER_IP_PER_DAY} reports per visitor and {REPORTS_PER_DAY} in total a day, examples included. After
            that, “Try an example” still works without AI: the detector’s signals and score need none. Reports and the AI’s
            drafts are public, so please leave out anything private.
          </p>
        </section>

        <section aria-labelledby="awaiting">
          <h2 id="awaiting" className="font-display text-3xl text-bone">
            Awaiting the coroner’s approval
          </h2>
          <p className="mt-1 text-sm text-bone/65">Not in the graveyard yet. The AI only drafts; a person decides.</p>
          {reports.length === 0 ? (
            <p className="mt-6 text-bone/60 italic">No bodies waiting. A quiet night.</p>
          ) : (
            <ul className="mt-5 flex flex-col gap-4">
              {reports.map((report) => (
                <li key={report._id}>
                  <article className="rounded-xl border border-bone/15 bg-night/50 p-4">
                    <header className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-display text-xl text-bone">{report.name}</h3>
                      <p className="text-xs text-bone/55">
                        {[report.language, report.submittedAt && dateFormat.format(Date.parse(report.submittedAt))]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </header>
                    {report.whatHappened && <p className="mt-2 text-sm text-bone/80">{report.whatHappened}</p>}
                    <div className="mt-3 rounded-lg border border-moss/25 bg-[#0f1a16] p-3 text-sm">
                      <ReportResult report={report} />
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
