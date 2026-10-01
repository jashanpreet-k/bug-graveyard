// Public bug reports from the site's "Report a dead bug" page. A report is a
// published bug with `publicReport.status: "pending"`: the coroner drafts its
// epitaph, the report page shows it as awaiting approval, and it only joins the
// graveyard once someone approves it in the Studio.

export const REPORT_PENDING = 'pending'
export const REPORT_APPROVED = 'approved'

export const REPORT_STATUSES = [
  {title: '⏳ Pending approval', value: REPORT_PENDING},
  {title: '✅ Approved', value: REPORT_APPROVED},
] as const

/** Longest bug name a report can have. */
export const REPORT_NAME_MAX = 80
/** Longest "what happened" a report can have. */
export const REPORT_STORY_MAX = 500
/** Shortest "what happened" a report can have. */
export const REPORT_STORY_MIN = 10

/** Longest component a report can name, e.g. "scheduler". */
export const REPORT_COMPONENT_MAX = 40

/**
 * The daily AI budget: reports the coroner examines per day (UTC), examples included.
 * A report costs one AI credit for the coroner's draft, plus one more when the Zombie
 * Detector finds a possible resurrection and an Agent Action explains it. At most
 * 2 × 15 × 31 = 930 credits a month (plus a rare retry), under the 1,000 free credits.
 * Once it's used, real reports are turned away and examples skip the AI.
 */
export const REPORTS_PER_DAY = 15
/** Reports one visitor (by IP address) can have examined per day (UTC), examples included. */
export const REPORTS_PER_IP_PER_DAY = 3

/**
 * The report page's "Try an example" report, for judges: one the Zombie Detector
 * reliably recognises (the "Cron job that ran twice at DST" grave: same language,
 * component, and plenty of shared words). A report with exactly these values is an
 * example: it's marked `isExample`, stays out of the public list, can't join the
 * graveyard or rise, and is deleted after EXAMPLE_LIFETIME_SECONDS.
 */
export const EXAMPLE_REPORT = {
  name: 'Nightly job ran twice after the clocks changed',
  language: 'language-java',
  component: 'scheduler',
  whatHappened:
    'After the daylight-saving switch on Sunday, the nightly billing job ran twice at 01:30 and customers got two invoices. We thought this was fixed last year.',
} as const

export function isExampleReport(values: {name: string; language: string; component: string; whatHappened: string}) {
  return (Object.keys(EXAMPLE_REPORT) as (keyof typeof EXAMPLE_REPORT)[]).every((key) => values[key] === EXAMPLE_REPORT[key])
}

/** How long an example report lives: it haunts its grave for this long, then it's deleted. */
export const EXAMPLE_LIFETIME_SECONDS = 3600 // one hour (a literal: Sanity TypeGen reads it into the queries)

/**
 * Examples one visitor, and the whole site, can send per day (UTC). Within the AI
 * budget above an example is examined like any report; beyond it, it gets the
 * Zombie Detector alone, which needs no AI. These caps only stop floods.
 */
export const EXAMPLES_PER_IP_PER_DAY = 10
export const EXAMPLES_PER_DAY = 200

/** Example reports older than their lifetime ($cutoff: an ISO date-time), drafts included. */
export const EXPIRED_EXAMPLES_QUERY = `*[_type == "bug" && isExample == true && coalesce(publicReport.submittedAt, _createdAt) < $cutoff]`

/** The $cutoff for EXPIRED_EXAMPLES_QUERY. */
export function exampleCutoff(now = new Date()) {
  return new Date(now.getTime() - EXAMPLE_LIFETIME_SECONDS * 1000).toISOString()
}

/** Why the Studio's actions refuse an example report. */
export const EXAMPLE_REFUSAL = 'An example report can’t join the graveyard or rise: it’s deleted automatically after an hour.'
