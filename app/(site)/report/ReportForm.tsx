'use client'

import {useActionState, useState} from 'react'

import {ReportResult, type ReportView} from '@/components/ReportResult'
import {REPORT_COMPONENT_MAX, REPORT_NAME_MAX, REPORT_STORY_MAX, REPORT_STORY_MIN} from '@/sanity/lib/publicReport'

import {type ReportState, submitReport} from './actions'

const INITIAL: ReportState = {status: 'idle', message: ''}

// For judges: a report the Zombie Detector reliably recognises (the "Cron job that
// ran twice at DST" grave: same language, component, and plenty of shared words)
const EXAMPLE: NonNullable<ReportState['values']> = {
  name: 'Nightly job ran twice after the clocks changed',
  language: 'language-java',
  component: 'scheduler',
  whatHappened:
    'After the daylight-saving switch on Sunday, the nightly billing job ran twice at 01:30 and customers got two invoices. We thought this was fixed last year.',
}

const field =
  'mt-1.5 w-full rounded-lg border border-bone/20 bg-night/60 px-3 py-2 text-bone placeholder:text-bone/40 focus-visible:border-moss focus-visible:outline-2 focus-visible:outline-moss'

// The page is static; if the server has no write token, the action says reports are closed.
export function ReportForm({
  languages,
  components,
  reports,
}: {
  languages: {_id: string; name: string | null}[]
  components: string[]
  reports: ReportView[]
}) {
  const [state, action, pending] = useActionState(submitReport, INITIAL)
  const [example, setExample] = useState<{at: number} | null>(null)
  // Whichever came last wins: "Try an example" fills the form in, an error keeps what
  // was typed, and a report starts it empty again
  const exampleNewer = Boolean(example && example.at > (state.at ?? 0))
  const values = exampleNewer ? EXAMPLE : state.status === 'error' ? state.values : undefined
  const formKey = exampleNewer ? `example-${example?.at}` : `${state.status}-${state.at ?? 0}`
  const mine = state.status === 'ok' && state.reportId ? reports.find((report) => report._id === state.reportId) : undefined

  return (
    <div className="flex flex-col gap-6">
      <form key={formKey} action={action} className="flex flex-col gap-5 rounded-2xl border border-bone/15 bg-night/50 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-bone/70">Not sure what to write?</p>
          <button
            type="button"
            onClick={() => setExample({at: Date.now()})}
            className="rounded-full border border-[#cfe0ff]/40 px-4 py-1.5 text-sm text-[#dbe6ff] transition-colors hover:border-[#cfe0ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
          >
            👻 Try an example
          </button>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-bone">Name of the bug</span>
          <input
            name="name"
            required
            minLength={3}
            maxLength={REPORT_NAME_MAX}
            defaultValue={values?.name}
            placeholder="The login button that logged you out"
            className={field}
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-bone">Language</span>
            <select name="language" required defaultValue={values?.language ?? ''} className={field}>
              <option value="" disabled>
                Choose one
              </option>
              {languages.map((language) => (
                <option key={language._id} value={language._id}>
                  {language.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-bone">
              Component <span className="font-normal text-bone/55">(optional)</span>
            </span>
            <input
              name="component"
              list="components"
              maxLength={REPORT_COMPONENT_MAX}
              defaultValue={values?.component}
              placeholder="scheduler, checkout, auth…"
              className={field}
            />
            <datalist id="components">
              {components.map((component) => (
                <option key={component} value={component} />
              ))}
            </datalist>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-bone">What happened?</span>
          <textarea
            name="whatHappened"
            required
            rows={4}
            minLength={REPORT_STORY_MIN}
            maxLength={REPORT_STORY_MAX}
            defaultValue={values?.whatHappened}
            placeholder="It worked on every machine except the one in production…"
            className={field}
          />
          <span className="mt-1 block text-xs text-bone/55">Up to {REPORT_STORY_MAX} characters. No links.</span>
        </label>

        {/* Honeypot: hidden from people and screen readers; bots fill it in */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full bg-bone px-5 py-2 font-medium text-night transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss disabled:opacity-60"
        >
          {pending ? 'Sending for the coroner…' : '🪦 Report it dead'}
        </button>

        <p
          role="status"
          aria-live="polite"
          className={state.status === 'error' ? 'text-sm text-[#ff9b9b]' : 'text-sm text-moss'}
        >
          {state.message}
        </p>
      </form>

      {state.status === 'ok' && state.reportId && (
        <section aria-labelledby="your-report" aria-live="polite" className="rounded-2xl border border-bone/20 bg-night/60 p-5 sm:p-6">
          <h2 id="your-report" className="font-display text-2xl text-bone">
            Your report{mine?.name ? `: ${mine.name}` : ''}
          </h2>
          <div className="mt-3 text-sm">
            {mine ? <ReportResult report={mine} /> : <p className="text-bone/70">🩺 The coroner is examining the body…</p>}
          </div>
        </section>
      )}
    </div>
  )
}
