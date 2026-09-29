'use client'

import {useActionState} from 'react'

import {REPORT_NAME_MAX, REPORT_STORY_MAX, REPORT_STORY_MIN} from '@/sanity/lib/publicReport'

import {type ReportState, submitReport} from './actions'

const INITIAL: ReportState = {status: 'idle', message: ''}

const field =
  'mt-1.5 w-full rounded-lg border border-bone/20 bg-night/60 px-3 py-2 text-bone placeholder:text-bone/40 focus-visible:border-moss focus-visible:outline-2 focus-visible:outline-moss'

// The page is static; if the server has no write token, the action says reports are closed.
export function ReportForm({languages}: {languages: {_id: string; name: string | null}[]}) {
  const [state, action, pending] = useActionState(submitReport, INITIAL)
  // After a successful report the form starts empty; after an error it keeps what was typed
  const values = state.status === 'error' ? state.values : undefined
  const formKey = state.status === 'ok' ? `sent-${state.sentAt}` : 'form'

  return (
    <form key={formKey} action={action} className="flex flex-col gap-5 rounded-2xl border border-bone/15 bg-night/50 p-5 sm:p-6">
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
  )
}
