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
  /** When it was declared buried, as "YYYY-MM-DD". */
  buriedAt?: string
  /**
   * For a regression: the `key` of the entry this bug is a zombie of. That entry
   * must be fix-merged or buried, and each grave can only rise once.
   */
  risesFrom?: string
}
