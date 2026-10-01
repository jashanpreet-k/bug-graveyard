import {useEffect, useState} from 'react'
import {type DocumentActionComponent, type SanityDocument, useClient} from 'sanity'

import {apiVersion} from '../env'
import {MATCH_CANDIDATE, MATCH_CONFIRMED, MATCH_DISMISSED} from '../lib/detector'
import {slugify, todayUTC, zombieName} from '../lib/lifecycle'
import {EXAMPLE_REFUSAL, REPORT_APPROVED, REPORT_PENDING} from '../lib/publicReport'
import {blockedBecause, RISEN_QUERY, uniqueSlug, useRun} from './lifecycle'

// What a person does with the Zombie Detector's suggestion on a new bug. The
// detector never links bugs itself; these two actions are the only way a
// resurrectionCandidate becomes a previousLife, or goes away.

type SuspectBug = SanityDocument & {
  name?: string
  matchStatus?: string
  matchScore?: number
  resurrectionCandidate?: {_ref: string}
  language?: {_ref: string}
  causeOfDeath?: {_ref: string}
  bornAt?: string
  publicReport?: {status?: string}
  isExample?: boolean
}

type Candidate = {
  _id: string
  name: string | null
  status: string | null
  timesResurrected: number | null
  language: {_ref: string} | null
  causeOfDeath: {_ref: string} | null
  risenAs: string | null
}

const CANDIDATE_QUERY = `*[_id == $id][0]{
  _id, name, status, timesResurrected, language, causeOfDeath,
  "risenAs": *[_type == "bug" && previousLife._ref == ^._id][0].name
}`

// The candidate grave, and whether it has risen already (checked again on confirm)
function useCandidate(id: string | undefined) {
  const client = useClient({apiVersion})
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  useEffect(() => {
    if (!id) return
    let active = true
    client
      .fetch<Candidate | null>(CANDIDATE_QUERY, {id}, {perspective: 'published'})
      .then((value) => active && setCandidate(value))
      .catch(() => active && setCandidate(null))
    return () => {
      active = false
    }
  }, [client, id])
  return candidate
}

// "🧟 Confirm resurrection": the new bug becomes the candidate grave's zombie, with
// the same rules as "Report resurrection" (the name, the count along the chain, a
// grave only rises once). A pending public report joins the graveyard with it. The
// report page's examples are refused: they're deleted after an hour.
export const ConfirmResurrectionAction: DocumentActionComponent = (props) => {
  const client = useClient({apiVersion})
  const {busy, run, errorDialog} = useRun(props.onComplete)
  const [confirming, setConfirming] = useState(false)
  const bug = props.published as SuspectBug | null
  const candidate = useCandidate(bug?.resurrectionCandidate?._ref)

  if (bug?.matchStatus !== MATCH_CANDIDATE || !bug.resurrectionCandidate) return null
  const blocked = bug.isExample ? EXAMPLE_REFUSAL : blockedBecause(props)
  const dead = candidate?.status === 'fix-merged' || candidate?.status === 'buried'
  const number = (candidate?.timesResurrected ?? 0) + 1
  const newName = candidate?.name ? zombieName(candidate.name, number) : null

  function confirm() {
    setConfirming(false)
    run(async () => {
      if (!bug || !candidate || !newName) return
      if (bug.isExample) throw new Error(EXAMPLE_REFUSAL)
      // Checked again here: another zombie may have risen from that grave meanwhile
      const already = await client.fetch<string | null>(RISEN_QUERY, {id: candidate._id}, {perspective: 'raw'})
      if (already) throw new Error(`“${candidate.name}” already rose as “${already}”. A grave only rises once.`)
      await client
        .patch(bug._id)
        .ifRevisionId(bug._rev)
        .set({
          name: newName,
          slug: {_type: 'slug', current: await uniqueSlug(client, slugify(newName))},
          status: 'zombie',
          previousLife: {_type: 'reference', _ref: candidate._id},
          timesResurrected: number,
          matchStatus: MATCH_CONFIRMED,
          ...(!bug.bornAt && {bornAt: todayUTC()}),
          ...(!bug.language && candidate.language && {language: {_type: 'reference', _ref: candidate.language._ref}}),
          ...(!bug.causeOfDeath && candidate.causeOfDeath && {causeOfDeath: {_type: 'reference', _ref: candidate.causeOfDeath._ref}}),
          ...(bug.publicReport?.status === REPORT_PENDING && {'publicReport.status': REPORT_APPROVED}),
        })
        .commit()
    })
  }

  return {
    label: busy ? 'Confirming…' : '🧟 Confirm resurrection',
    tone: 'critical',
    disabled: busy || Boolean(blocked) || !candidate || !dead || Boolean(candidate?.risenAs),
    title:
      blocked ??
      (!candidate
        ? 'Looking up the grave…'
        : candidate.risenAs
          ? `“${candidate.name}” already rose as “${candidate.risenAs}”. A grave only rises once.`
          : !dead
            ? `“${candidate.name}” isn’t dead, so it can’t rise again`
            : `Makes this bug “${newName}”, rising from “${candidate.name}”`),
    onHandle: () => setConfirming(true),
    dialog: confirming
      ? {
          type: 'confirm',
          tone: 'critical',
          message: (
            <div>
              <p>
                Confirm that this is “{candidate?.name}” coming back? It becomes “{newName}”, a walking zombie
                {bug.publicReport?.status === REPORT_PENDING ? ', and joins the graveyard' : ''}.
              </p>
              <p>Match score {bug.matchScore ?? '?'} from 4 signals.</p>
            </div>
          ),
          confirmButtonText: 'It rose again',
          onConfirm: confirm,
          onCancel: () => {
            setConfirming(false)
            props.onComplete()
          },
        }
      : errorDialog,
  }
}
ConfirmResurrectionAction.displayName = 'ConfirmResurrectionAction'

// "✖ Dismiss: it's a new bug": clears the candidate, so the grave stops being
// haunted. The signals stay, as a record of what the detector saw.
export const DismissResurrectionAction: DocumentActionComponent = (props) => {
  const client = useClient({apiVersion})
  const {busy, run, errorDialog} = useRun(props.onComplete)
  const [confirming, setConfirming] = useState(false)
  const bug = props.published as SuspectBug | null

  if (bug?.matchStatus !== MATCH_CANDIDATE) return null
  const blocked = blockedBecause(props)

  function dismiss() {
    setConfirming(false)
    run(async () => {
      if (!bug) return
      await client.patch(bug._id).ifRevisionId(bug._rev).set({matchStatus: MATCH_DISMISSED}).unset(['resurrectionCandidate']).commit()
    })
  }

  return {
    label: busy ? 'Dismissing…' : '✖ Dismiss: it’s a new bug',
    disabled: busy || Boolean(blocked),
    title: blocked ?? 'Not a resurrection: clears the suggestion, so the old grave stops being haunted',
    onHandle: () => setConfirming(true),
    dialog: confirming
      ? {
          type: 'confirm',
          message: 'Dismiss the suggestion? This stays a new bug, and the old grave stops being haunted.',
          confirmButtonText: 'Dismiss',
          onConfirm: dismiss,
          onCancel: () => {
            setConfirming(false)
            props.onComplete()
          },
        }
      : errorDialog,
  }
}
DismissResurrectionAction.displayName = 'DismissResurrectionAction'
