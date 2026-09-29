import {useEffect, useState} from 'react'
import {
  type DocumentActionComponent,
  type DocumentActionDialogProps,
  type DocumentActionProps,
  type SanityClient,
  type SanityDocument,
  useClient,
  useDocumentStore,
} from 'sanity'
import {useRouter} from 'sanity/router'

import {apiVersion} from '../env'
import {BURIAL_WAIT_DAYS, daysUntilBurial, slugify, todayUTC, zombieName} from '../lib/lifecycle'
import type {BugStatus} from '../lib/statuses'

// Document actions that move a bug through its life:
// suspected dead (or zombie) → fix merged → buried → risen again as a zombie.

type Bug = SanityDocument & {
  name?: string
  status?: BugStatus
  fixMergedAt?: string
  timesResurrected?: number
  language?: {_ref: string}
  causeOfDeath?: {_ref: string}
}

// The actions change the published bug directly, in one mutation, so they never
// leave a draft behind. That only works while the published version is all
// there is: unpublished edits would later overwrite the new status.
export function blockedBecause({published, draft, version}: DocumentActionProps) {
  if (version) return 'Lifecycle actions work on the published bug, not on a release version'
  if (!published) return 'Publish this bug first'
  if (draft) return 'Publish or discard your changes first'
  return null
}

// Runs an action's work, reporting failures in a dialog instead of failing silently.
export function useRun(onComplete: () => void) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(work: () => Promise<void>) {
    setBusy(true)
    try {
      await work()
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const errorDialog: DocumentActionDialogProps | null = error
    ? {type: 'dialog', header: 'That didn’t work', content: error, onClose: () => setError(null)}
    : null

  return {busy, run, errorDialog}
}

export const MarkFixMergedAction: DocumentActionComponent = (props) => {
  const client = useClient({apiVersion})
  const {busy, run, errorDialog} = useRun(props.onComplete)
  const bug = props.published as Bug | null
  const blocked = blockedBecause(props)
  // A walking zombie gets fixed the same way, which is how zombies of zombies happen.
  const allowed = bug?.status === 'suspected-dead' || bug?.status === 'zombie'

  return {
    label: busy ? 'Marking fix merged…' : '🩹 Mark fix merged',
    disabled: busy || Boolean(blocked) || !allowed,
    title:
      blocked ??
      (allowed
        ? 'Sets the status to “Fix merged” and the fix date to today (UTC)'
        : 'Only a suspected-dead bug or a walking zombie can have its fix merged'),
    onHandle: () =>
      run(async () => {
        if (!bug) return
        await client
          .patch(bug._id)
          .ifRevisionId(bug._rev)
          .set({status: 'fix-merged', fixMergedAt: todayUTC()})
          .commit()
      }),
    dialog: errorDialog,
  }
}
MarkFixMergedAction.displayName = 'MarkFixMergedAction'

export const DeclareBuriedAction: DocumentActionComponent = (props) => {
  const client = useClient({apiVersion})
  const {busy, run, errorDialog} = useRun(props.onComplete)
  const bug = props.published as Bug | null
  const blocked = blockedBecause(props)
  const fixMerged = bug?.status === 'fix-merged'
  const daysLeft = fixMerged && bug.fixMergedAt ? daysUntilBurial(bug.fixMergedAt) : null
  const waiting = daysLeft !== null && daysLeft > 0

  return {
    label: busy
      ? 'Burying…'
      : waiting
        ? `🪦 Can bury in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`
        : '🪦 Declare buried',
    disabled: busy || Boolean(blocked) || daysLeft === null || waiting,
    title:
      blocked ??
      (!fixMerged
        ? 'Only a bug whose fix has merged can be buried'
        : daysLeft === null
          ? 'This bug has no fix-merged date, so the wait can’t be counted'
          : waiting
            ? `A fix must hold for ${BURIAL_WAIT_DAYS} days before burial: ${daysLeft} to go`
            : 'Sets the status to “Buried” and the burial date to today (UTC)'),
    onHandle: () =>
      run(async () => {
        if (!bug) return
        await client
          .patch(bug._id)
          .ifRevisionId(bug._rev)
          .set({status: 'buried', buriedAt: todayUTC()})
          .commit()
      }),
    dialog: errorDialog,
  }
}
DeclareBuriedAction.displayName = 'DeclareBuriedAction'

export const ReportResurrectionAction: DocumentActionComponent = (props) => {
  const client = useClient({apiVersion})
  const router = useRouter()
  const {busy, run, errorDialog} = useRun(props.onComplete)
  const [confirming, setConfirming] = useState(false)
  const bug = props.published as Bug | null
  const blocked = blockedBecause(props)
  const dead = bug?.status === 'fix-merged' || bug?.status === 'buried'
  const risen = useRisenZombie(bug?._id)

  function resurrect() {
    setConfirming(false)
    run(async () => {
      if (!bug) return
      // Checked again here: the live check can lag, or a zombie may just have risen elsewhere.
      const already = await client.fetch<string | null>(RISEN_QUERY, {id: bug._id}, {perspective: 'raw'})
      if (already) throw new Error(`It already rose as “${already}”. Report the next resurrection on that grave.`)
      const number = (bug.timesResurrected ?? 0) + 1
      const name = zombieName(bug.name ?? 'Unnamed bug', number)
      const zombie = {
        _id: crypto.randomUUID(),
        _type: 'bug',
        name,
        slug: {_type: 'slug', current: await uniqueSlug(client, slugify(name))},
        status: 'zombie',
        bornAt: todayUTC(),
        previousLife: {_type: 'reference', _ref: bug._id},
        timesResurrected: number,
        ...(bug.language && {language: {_type: 'reference', _ref: bug.language._ref}}),
        ...(bug.causeOfDeath && {causeOfDeath: {_type: 'reference', _ref: bug.causeOfDeath._ref}}),
      }
      await client.create(zombie)
      // Open the zombie so its epitaph can be written.
      router.navigateIntent('edit', {id: zombie._id, type: 'bug'})
    })
  }

  return {
    label: busy ? 'Rising…' : '🧟 Report resurrection',
    tone: 'critical',
    disabled: busy || Boolean(blocked) || !dead || Boolean(risen),
    title:
      blocked ??
      (!dead
        ? 'Only a bug whose fix has merged, or that is buried, can come back'
        : risen
          ? `It already rose as “${risen}”. Report the next resurrection on that grave.`
          : 'Creates a zombie of this bug and opens it'),
    onHandle: () => setConfirming(true),
    dialog: confirming
      ? {
          type: 'confirm',
          tone: 'critical',
          message: 'Are you sure? This bug will rise from its grave.',
          confirmButtonText: 'Let it rise',
          onConfirm: resurrect,
          onCancel: () => {
            setConfirming(false)
            props.onComplete()
          },
        }
      : errorDialog,
  }
}
ReportResurrectionAction.displayName = 'ReportResurrectionAction'

export const lifecycleActions = [MarkFixMergedAction, DeclareBuriedAction, ReportResurrectionAction]

// A grave only rises once: its zombie carries on the chain, so the next
// resurrection is reported on the zombie's grave.
export const RISEN_QUERY = '*[_type == "bug" && previousLife._ref == $id][0].name'

// The name of the zombie that already rose from this grave, kept up to date;
// null if none has (or while the first check is still running).
function useRisenZombie(publishedId: string | undefined) {
  const documentStore = useDocumentStore()
  const [risen, setRisen] = useState<string | null>(null)

  useEffect(() => {
    if (!publishedId) return
    const subscription = documentStore
      .listenQuery(RISEN_QUERY, {id: publishedId}, {perspective: 'published'})
      .subscribe((name: string | null) => setRisen(name ?? null))
    return () => subscription.unsubscribe()
  }, [documentStore, publishedId])

  return risen
}

// "timezone-bug-zombie-2", or "…-2-2" if a bug already uses that slug.
export async function uniqueSlug(client: SanityClient, base: string) {
  for (let attempt = 1; ; attempt++) {
    const candidate = attempt === 1 ? base : `${base}-${attempt}`
    const taken = await client.fetch<boolean>(
      'count(*[_type == "bug" && slug.current == $slug]) > 0',
      {slug: candidate},
      {perspective: 'raw'},
    )
    if (!taken) return candidate
  }
}
