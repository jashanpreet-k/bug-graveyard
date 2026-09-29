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

/**
 * Reports the whole site accepts per day (UTC). Each report costs one AI credit when
 * the coroner drafts its epitaph, so this keeps a month at most 25 × 31 = 775 credits
 * (plus a rare retry), under the 1,000 free credits a month.
 */
export const REPORTS_PER_DAY = 25
/** Reports one visitor (by IP address) can send per day (UTC). */
export const REPORTS_PER_IP_PER_DAY = 3
