// The coroner's report: an AI suggestion for a new bug's epitaph and cause of death,
// written by the `coroner` Sanity Function into separate fields. It only reaches the
// real fields when a person accepts it in the Studio.

/** The report is waiting for a person to accept it. */
export const CORONER_AWAITING = 'awaiting approval'
/** A person accepted the report, which copied it into the real fields. */
export const CORONER_ACCEPTED = 'accepted'
/** No AI today: the daily AI budget was used, so only the Zombie Detector ran (examples only). */
export const CORONER_SKIPPED = 'skipped'

export const CORONER_STATUSES = [
  {title: '⏳ Awaiting approval', value: CORONER_AWAITING},
  {title: '✅ Accepted', value: CORONER_ACCEPTED},
  {title: '💤 Skipped: the daily AI budget was used', value: CORONER_SKIPPED},
] as const
