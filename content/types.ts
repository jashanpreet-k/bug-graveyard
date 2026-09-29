import type {BugStatus} from '../sanity/lib/statuses'

/**
 * One bug in content/graves.ts. Only `key`, `name`, `language`, `cause` and
 * `status` are required; leave out anything you don't know.
 */
export type GraveEntry = {
  /**
   * A stable ID: lowercase words joined by hyphens, e.g. "stale-cache". It becomes
   * the document ID ("grave-stale-cache") and the page address (/grave/stale-cache),
   * so don't change it after importing.
   */
  key: string
  /** What the bug will be remembered as. */
  name: string
  /** A language's name as it appears in the Studio, e.g. "TypeScript". */
  language: string
  /** A cause of death's title as it appears in the Studio, e.g. "Off-by-one". */
  cause: string
  /** "suspected-dead", "fix-merged", "buried" or "zombie" (a zombie needs `risesFrom`). */
  status: BugStatus
  /** Where it lived, in a word or two: "scheduler", "checkout", "auth". */
  component?: string
  /** What people saw while it was alive. The Zombie Detector compares its words. */
  symptoms?: string
  /** How it was fixed, in one line. */
  fixSummary?: string
  /** The pull request or commit that fixed it (http or https). */
  fixUrl?: string
  severity?: 'low' | 'medium' | 'critical'
  /** The words on the tombstone, 140 characters at most. */
  epitaph?: string
  /** Who fixed it: a name or @github handle. */
  killedBy?: string
  hoursToKill?: number
  /** When the bug was introduced, as "YYYY-MM-DD". */
  bornAt?: string
  /** When its fix merged, as "YYYY-MM-DD". */
  fixMergedAt?: string
  /** When it was declared buried, as "YYYY-MM-DD": at least 7 days after fixMergedAt. */
  buriedAt?: string
  /**
   * For a regression: the `key` of the entry this bug is a zombie of. That entry
   * must be fix-merged or buried, each grave can only rise once, and the zombie's
   * bornAt can't be before that entry's fixMergedAt.
   */
  risesFrom?: string
}
