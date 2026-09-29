// The rules of a bug's life, used by the Studio's lifecycle actions and by the Morgue
// App SDK app (apps/morgue).
// Dates are "YYYY-MM-DD" strings in UTC, like everywhere else in the app.

/** How long a fix must hold, in days, before its bug can be declared buried. */
export const BURIAL_WAIT_DAYS = 7

const DAY_MS = 24 * 60 * 60 * 1000

/** Today's date in UTC, the way Sanity stores dates: "YYYY-MM-DD". */
export function todayUTC(now = new Date()) {
  return now.toISOString().slice(0, 10)
}

/** Whole days from one "YYYY-MM-DD" date to another. Both parse as UTC midnight. */
export function daysBetween(from: string, to: string) {
  return Math.floor((Date.parse(to) - Date.parse(from)) / DAY_MS)
}

/** Days left before a bug whose fix merged on `fixMergedAt` can be buried; 0 means now. */
export function daysUntilBurial(fixMergedAt: string, today = todayUTC()) {
  return Math.max(0, BURIAL_WAIT_DAYS - daysBetween(fixMergedAt, today))
}

/** "Timezone bug (Zombie #1)" → "Timezone bug (Zombie #2)": zombies keep the original name. */
export function zombieName(name: string, number: number) {
  return `${name.replace(/\s*\(Zombie #\d+\)$/, '')} (Zombie #${number})`
}

/** A URL-safe slug: "Timezone bug (Zombie #2)" → "timezone-bug-zombie-2". */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}
