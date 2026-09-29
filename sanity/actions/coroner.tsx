import {useEffect, useState} from 'react'
import {type DocumentActionComponent, type SanityDocument, useClient} from 'sanity'

import {apiVersion} from '../env'
import {CORONER_ACCEPTED, CORONER_AWAITING} from '../lib/coroner'
import {blockedBecause, useRun} from './lifecycle'

// "✅ Accept coroner's report": the only way the coroner's AI suggestion reaches a
// bug's real epitaph and cause of death. A person reads the suggestion in the confirm
// dialog, and accepting copies it over. Like the lifecycle actions, it changes the
// published bug in one revision-guarded mutation, so it waits while there's a draft.

type ReportedBug = SanityDocument & {
  coronerStatus?: string
  coronerEpitaph?: string
  coronerCause?: {_ref: string}
}

export const AcceptCoronerReportAction: DocumentActionComponent = (props) => {
  const client = useClient({apiVersion})
  const {busy, run, errorDialog} = useRun(props.onComplete)
  const [confirming, setConfirming] = useState(false)
  const bug = props.published as ReportedBug | null
  const causeTitle = useCauseTitle(bug?.coronerCause?._ref)

  // Only bugs with a report waiting get the action
  if (bug?.coronerStatus !== CORONER_AWAITING) return null

  const blocked = blockedBecause(props)
  const epitaph = bug.coronerEpitaph?.trim()

  function accept() {
    setConfirming(false)
    run(async () => {
      if (!bug || !epitaph) return
      await client
        .patch(bug._id)
        .ifRevisionId(bug._rev)
        .set({
          epitaph,
          ...(bug.coronerCause && {causeOfDeath: {_type: 'reference', _ref: bug.coronerCause._ref}}),
          coronerStatus: CORONER_ACCEPTED,
        })
        .commit()
    })
  }

  return {
    label: busy ? 'Accepting…' : '✅ Accept coroner’s report',
    tone: 'positive',
    disabled: busy || Boolean(blocked) || !epitaph,
    title: blocked ?? (epitaph ? `Suggested epitaph: “${epitaph}”` : 'The report has no epitaph'),
    onHandle: () => setConfirming(true),
    dialog: confirming
      ? {
          type: 'confirm',
          tone: 'positive',
          message: (
            <div>
              <p>Accept the coroner’s report? It replaces this bug’s epitaph and cause of death.</p>
              <p>
                <strong>Epitaph:</strong> “{epitaph}”
              </p>
              <p>
                <strong>Cause of death:</strong> {bug.coronerCause ? (causeTitle ?? '…') : 'no suggestion (unchanged)'}
              </p>
            </div>
          ),
          confirmButtonText: 'Accept',
          onConfirm: accept,
          onCancel: () => {
            setConfirming(false)
            props.onComplete()
          },
        }
      : errorDialog,
  }
}
AcceptCoronerReportAction.displayName = 'AcceptCoronerReportAction'

// The title of the suggested cause of death, for the confirm dialog
function useCauseTitle(id: string | undefined) {
  const client = useClient({apiVersion})
  const [title, setTitle] = useState<string | null>(null)
  useEffect(() => {
    if (!id) return
    let active = true
    client
      .fetch<string | null>('*[_id == $id][0].title', {id})
      .then((value) => active && setTitle(value))
      .catch(() => active && setTitle(null))
    return () => {
      active = false
    }
  }, [client, id])
  return title
}
