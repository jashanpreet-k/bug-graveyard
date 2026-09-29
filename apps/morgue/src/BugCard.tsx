import {useState} from 'react'
import {
  createDocument,
  createDocumentHandle,
  type DocumentHandle,
  editDocument,
  useApplyDocumentActions,
  useClient,
  useDocumentProjection,
} from '@sanity/sdk-react'

import {daysUntilBurial, slugify, todayUTC, zombieName} from '../../../sanity/lib/lifecycle'
import type {BoardFacts} from './facts'

const API_VERSION = '2026-09-28'

type SanityClient = ReturnType<typeof useClient>
const SITE = 'https://bug-graveyard.vercel.app'

type BugStatus = 'suspected-dead' | 'fix-merged' | 'buried' | 'zombie'

interface Bug {
  name: string | null
  status: BugStatus | null
  bornAt: string | null
  fixMergedAt: string | null
  epitaph: string | null
  slug: string | null
  timesResurrected: number | null
  languageRef: string | null
  languageName: string | null
  languageColor: string | null
  causeRef: string | null
  causeTitle: string | null
  previousLife: string | null
}

const PROJECTION = `{
  name, status, bornAt, fixMergedAt, epitaph, timesResurrected,
  "slug": slug.current,
  "languageRef": language._ref,
  "languageName": language->name,
  "languageColor": language->color,
  "causeRef": causeOfDeath._ref,
  "causeTitle": causeOfDeath->title,
  "previousLife": previousLife->name
}`

// Dates are "YYYY-MM-DD" in UTC, shown in UTC like on the site
const dateFormat = new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'})
const formatDate = (date: string | null) => (date ? dateFormat.format(Date.parse(date)) : '?')

const studioUrl = (id: string) => `${SITE}/studio/intent/edit/id=${id};type=bug`

export function BugCard({handle, today, facts}: {handle: DocumentHandle; today: string; facts: BoardFacts}) {
  const {data: bug} = useDocumentProjection<Bug>({...handle, projection: PROJECTION})
  if (!bug) return null

  const id = handle.documentId
  const daysLeft = bug.status === 'fix-merged' && bug.fixMergedAt ? daysUntilBurial(bug.fixMergedAt, today) : null

  return (
    <article className="card" data-status={bug.status ?? undefined}>
      <h3>{bug.name ?? 'Unnamed bug'}</h3>
      <p className="badges">
        {bug.languageName && (
          <span className="badge">
            <span className="dot" style={{background: bug.languageColor ?? undefined}} aria-hidden />
            {bug.languageName}
          </span>
        )}
        {bug.causeTitle && <span className="badge badge--cause">{bug.causeTitle}</span>}
      </p>
      <p className="dates">{lifeLine(bug, daysLeft)}</p>
      {bug.previousLife && <p className="rose-from">Rose from “{bug.previousLife}”</p>}
      {bug.epitaph && <p className="epitaph">“{bug.epitaph}”</p>}
      <LifecycleButtons id={id} bug={bug} daysLeft={daysLeft} facts={facts} />
      <p className="links">
        <a href={studioUrl(id)} target="_blank" rel="noreferrer">
          Open in Studio ↗
        </a>
        {bug.slug && (
          <a href={`${SITE}/grave/${bug.slug}`} target="_blank" rel="noreferrer">
            Grave ↗
          </a>
        )}
      </p>
    </article>
  )
}

function lifeLine(bug: Bug, daysLeft: number | null) {
  switch (bug.status) {
    case 'zombie':
      return `Risen ${formatDate(bug.bornAt)} – still walking`
    case 'fix-merged':
      return `Fix merged ${formatDate(bug.fixMergedAt)} · ${
        daysLeft === null ? 'no fix date' : daysLeft === 0 ? 'ready to bury' : `can bury in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`
      }`
    default:
      return `Born ${formatDate(bug.bornAt)}`
  }
}

// A grave only rises once; its zombie carries on the chain (as in the Studio)
const RISEN_QUERY = '*[_type == "bug" && previousLife._ref == $id][0].name'

// "timezone-bug-zombie-2", or "…-2-2" if a bug already uses that slug (as in the Studio)
async function uniqueSlug(client: SanityClient, base: string) {
  for (let attempt = 1; ; attempt++) {
    const candidate = attempt === 1 ? base : `${base}-${attempt}`
    const taken = await client.fetch<boolean>('count(*[_type == "bug" && slug.current == $slug]) > 0', {slug: candidate}, {perspective: 'raw'})
    if (!taken) return candidate
  }
}

// The Studio's three lifecycle actions, with the same rules. They write straight to
// the published bug (`liveEdit`), so, like in the Studio, they wait while the bug has
// unpublished Studio changes that would later overwrite them.
function LifecycleButtons({id, bug, daysLeft, facts}: {id: string; bug: Bug; daysLeft: number | null; facts: BoardFacts}) {
  const apply = useApplyDocumentActions()
  const client = useClient({apiVersion: API_VERSION})
  const [busy, setBusy] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newZombie, setNewZombie] = useState<string | null>(null)

  const blocked = facts.unpublished.has(id)
  const risenAs = facts.risenAs.get(id)
  const published = createDocumentHandle({documentId: id, documentType: 'bug', liveEdit: true})

  async function run(label: string, work: () => Promise<void>) {
    setBusy(label)
    setError(null)
    try {
      await work()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  const setStatus = (label: string, fields: Record<string, string>) =>
    run(label, async () => {
      const result = await apply(editDocument(published, {set: fields}))
      await result.submitted()
    })

  const resurrect = () => {
    setConfirming(false)
    run('Rising…', async () => {
      // Checked again here: the live facts can lag, or a zombie may just have risen elsewhere
      const already = await client.fetch<string | null>(RISEN_QUERY, {id}, {perspective: 'raw'})
      if (already) throw new Error(`It already rose as “${already}”. Report the next resurrection on that grave.`)
      const number = (bug.timesResurrected ?? 0) + 1
      const name = zombieName(bug.name ?? 'Unnamed bug', number)
      const zombieId = crypto.randomUUID()
      const result = await apply(
        createDocument(createDocumentHandle({documentId: zombieId, documentType: 'bug', liveEdit: true}), {
          name,
          slug: {_type: 'slug', current: await uniqueSlug(client, slugify(name))},
          status: 'zombie',
          bornAt: todayUTC(),
          previousLife: {_type: 'reference', _ref: id},
          timesResurrected: number,
          ...(bug.languageRef && {language: {_type: 'reference', _ref: bug.languageRef}}),
          ...(bug.causeRef && {causeOfDeath: {_type: 'reference', _ref: bug.causeRef}}),
        }),
      )
      await result.submitted()
      setNewZombie(zombieId)
    })
  }

  if (confirming) {
    return (
      <div className="confirm" role="alertdialog" aria-label="Report resurrection">
        <p>Are you sure? This bug will rise from its grave.</p>
        <div className="buttons">
          <button type="button" className="btn btn--critical" onClick={resurrect}>
            Let it rise
          </button>
          <button type="button" className="btn" onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  const fixMerged = bug.status === 'fix-merged'
  const waiting = daysLeft === null || daysLeft > 0

  return (
    <div className="actions">
      {blocked && <p className="blocked">Has unpublished changes in the Studio. Publish or discard them first.</p>}
      <div className="buttons">
        {(bug.status === 'suspected-dead' || bug.status === 'zombie') && (
          <button
            type="button"
            className="btn"
            disabled={Boolean(busy) || blocked}
            onClick={() => setStatus('Marking…', {status: 'fix-merged', fixMergedAt: todayUTC()})}
          >
            {busy === 'Marking…' ? busy : '🩹 Mark fix merged'}
          </button>
        )}
        {fixMerged && (
          <button
            type="button"
            className="btn btn--primary"
            disabled={Boolean(busy) || blocked || waiting}
            title={waiting ? 'A fix must hold for 7 days before burial' : 'Sets the status to “Buried” and the burial date to today (UTC)'}
            onClick={() => setStatus('Burying…', {status: 'buried', buriedAt: todayUTC()})}
          >
            {busy === 'Burying…' ? busy : waiting && daysLeft !== null ? `🪦 Can bury in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}` : '🪦 Declare buried'}
          </button>
        )}
        {(fixMerged || bug.status === 'buried') && (
          <button
            type="button"
            className="btn btn--critical"
            disabled={Boolean(busy) || blocked || Boolean(risenAs)}
            title={risenAs ? `It already rose as “${risenAs}”. Report the next resurrection on that grave.` : 'Creates a zombie of this bug'}
            onClick={() => setConfirming(true)}
          >
            {busy === 'Rising…' ? busy : '🧟 Report resurrection'}
          </button>
        )}
      </div>
      {risenAs && !newZombie && <p className="note">Already rose as “{risenAs}”.</p>}
      {newZombie && (
        <p className="note note--risen">
          It rose.{' '}
          <a href={studioUrl(newZombie)} target="_blank" rel="noreferrer">
            Write its epitaph in the Studio ↗
          </a>
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
