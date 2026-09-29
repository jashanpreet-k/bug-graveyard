import type {Metadata} from 'next'

import {openGraph} from '@/lib/metadata'
import {isProfane} from '@/lib/moderation'
import {sanityFetch} from '@/sanity/lib/live'
import {REPORT_PAGE_QUERY} from '@/sanity/lib/queries'
import {REPORTS_PER_DAY, REPORTS_PER_IP_PER_DAY} from '@/sanity/lib/publicReport'
import type {REPORT_PAGE_QUERY_RESULT} from '@/sanity/types'

import {ReportForm} from './ReportForm'

const description = 'Report a bug you fixed. An AI coroner drafts its epitaph, and it joins the graveyard once approved.'

export const metadata: Metadata = {
  title: 'Report a dead bug',
  description,
  openGraph: openGraph('Report a dead bug · Bug Graveyard', description),
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'})

export default async function ReportPage() {
  const {data} = await sanityFetch({query: REPORT_PAGE_QUERY, stega: false})

  return (
    <>
      <h1 className="font-display text-4xl text-bone sm:text-5xl">Report a dead bug</h1>
      <p className="mt-2 max-w-2xl text-bone/75">
        Fixed a bug worth remembering? Report it here. The coroner (an AI running in a Sanity Function) drafts its
        epitaph within seconds, and the bug joins the graveyard once a person has approved it.
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <section aria-label="Report form">
          <ReportForm languages={data.languages.map((l) => ({_id: l._id, name: l.name}))} />
          <p className="mt-3 text-xs text-bone/55">
            Each report costs the graveyard one AI credit, so it takes {REPORTS_PER_IP_PER_DAY} reports per visitor and{' '}
            {REPORTS_PER_DAY} in total a day. Reports and the coroner’s drafts are public, so please leave out anything
            private.
          </p>
        </section>

        <section aria-labelledby="awaiting">
          <h2 id="awaiting" className="font-display text-3xl text-bone">
            Awaiting the coroner’s approval
          </h2>
          <p className="mt-1 text-sm text-bone/65">
            Not in the graveyard yet. The AI only drafts; a person decides.
          </p>
          {data.pending.length === 0 ? (
            <p className="mt-6 text-bone/60 italic">No bodies waiting. A quiet night.</p>
          ) : (
            <ul className="mt-5 flex flex-col gap-4">
              {data.pending.map((report) => (
                <li key={report._id}>
                  <PendingReport report={report} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}

type Pending = REPORT_PAGE_QUERY_RESULT['pending'][number]

function PendingReport({report}: {report: Pending}) {
  const draft = report.coronerEpitaph
  return (
    <article className="rounded-xl border border-bone/15 bg-night/50 p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-xl text-bone">{report.name}</h3>
        <p className="text-xs text-bone/55">
          {[report.language, report.submittedAt && dateFormat.format(Date.parse(report.submittedAt))].filter(Boolean).join(' · ')}
        </p>
      </header>
      {report.whatHappened && <p className="mt-2 text-sm text-bone/80">{report.whatHappened}</p>}
      <div className="mt-3 rounded-lg border border-moss/25 bg-[#0f1a16] p-3 text-sm">
        {!draft ? (
          <p className="text-bone/70">🩺 The coroner is examining the body…</p>
        ) : isProfane(draft) ? (
          <p className="text-bone/70">🩺 The coroner’s draft is waiting for review.</p>
        ) : (
          <>
            <p className="text-xs tracking-wide text-moss uppercase">Coroner’s draft · awaiting approval</p>
            <p className="mt-1 font-serif text-base text-bone italic">“{draft}”</p>
            {report.coronerCause && <p className="mt-1 text-bone/70">Cause of death: {report.coronerCause}</p>}
          </>
        )}
      </div>
    </article>
  )
}
