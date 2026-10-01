import {useState} from 'react'
import {type DocumentActionComponent, type SanityDocument, useClient} from 'sanity'

import {apiVersion} from '../env'
import {CORONER_AWAITING} from '../lib/coroner'
import {EXAMPLE_REFUSAL, REPORT_APPROVED, REPORT_PENDING} from '../lib/publicReport'
import {blockedBecause, useRun} from './lifecycle'

// "🗳️ Approve public report": lets a bug reported on the site into the graveyard as
// it is. Usually "Accept coroner's report" does this; this one covers a report the
// coroner hasn't drafted (for example when the month's AI credits have run out), so
// it only shows when no coroner's report is waiting.

type ReportedBug = SanityDocument & {
  coronerStatus?: string
  publicReport?: {status?: string}
  isExample?: boolean
}

export const ApprovePublicReportAction: DocumentActionComponent = (props) => {
  const client = useClient({apiVersion})
  const {busy, run, errorDialog} = useRun(props.onComplete)
  const [confirming, setConfirming] = useState(false)
  const bug = props.published as ReportedBug | null

  if (bug?.publicReport?.status !== REPORT_PENDING || bug.coronerStatus === CORONER_AWAITING) return null
  // The report page's examples never join the graveyard
  const blocked = bug.isExample ? EXAMPLE_REFUSAL : blockedBecause(props)

  function approve() {
    setConfirming(false)
    run(async () => {
      if (!bug) return
      await client.patch(bug._id).ifRevisionId(bug._rev).set({'publicReport.status': REPORT_APPROVED}).commit()
    })
  }

  return {
    label: busy ? 'Approving…' : '🗳️ Approve public report',
    tone: 'positive',
    disabled: busy || Boolean(blocked),
    title: blocked ?? 'Lets this reported bug into the graveyard as it is',
    onHandle: () => setConfirming(true),
    dialog: confirming
      ? {
          type: 'confirm',
          tone: 'positive',
          message: 'Approve this report as it is? The bug joins the graveyard with its current epitaph and cause of death.',
          confirmButtonText: 'Approve',
          onConfirm: approve,
          onCancel: () => {
            setConfirming(false)
            props.onComplete()
          },
        }
      : errorDialog,
  }
}
ApprovePublicReportAction.displayName = 'ApprovePublicReportAction'
