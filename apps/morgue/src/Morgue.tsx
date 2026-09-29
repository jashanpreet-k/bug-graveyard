import {Suspense, useEffect, useState} from 'react'
import {useDocuments} from '@sanity/sdk-react'

import {BURIAL_WAIT_DAYS, burialCutoff, todayUTC} from '../../../sanity/lib/lifecycle'
import {BugCard} from './BugCard'
import {type BoardFacts, useBoardFacts} from './facts'

// The Morgue: every bug that isn't resting yet, in the order it moves through its
// life, with the Studio's lifecycle actions one click away on each card.

interface Column {
  id: string
  emoji: string
  title: string
  hint: string
  empty: string
  /** GROQ filter on published bugs; `$cutoff` is the last fix date that has held long enough */
  filter: string
}

const COLUMNS: Column[] = [
  {
    id: 'suspected',
    emoji: '💀',
    title: 'Suspected dead',
    hint: 'Probably fixed. Probably.',
    empty: 'No suspects.',
    filter: 'status == "suspected-dead"',
  },
  {
    id: 'walking',
    emoji: '🧟',
    title: 'Walking',
    hint: 'Rose from the grave, still walking.',
    empty: 'No zombies. For now.',
    filter: 'status == "zombie"',
  },
  {
    id: 'waiting',
    emoji: '🩹',
    title: 'Waiting',
    hint: `Fix merged less than ${BURIAL_WAIT_DAYS} days ago.`,
    empty: 'No fixes on probation.',
    filter: 'status == "fix-merged" && (!defined(fixMergedAt) || fixMergedAt > $cutoff)',
  },
  {
    id: 'ready',
    emoji: '🪦',
    title: 'Ready to bury',
    hint: `The fix has held for ${BURIAL_WAIT_DAYS} days.`,
    empty: 'Nothing to bury today.',
    filter: 'status == "fix-merged" && fixMergedAt <= $cutoff',
  },
]

// Today's UTC date, moving on at midnight UTC while the Morgue stays open.
function useToday() {
  const [today, setToday] = useState(todayUTC)
  useEffect(() => {
    const timer = setInterval(() => setToday(todayUTC()), 60_000)
    return () => clearInterval(timer)
  }, [])
  return today
}

export function Morgue() {
  const today = useToday()

  return (
    <main className="morgue">
      <header className="morgue-header">
        <div>
          <h1>The Morgue</h1>
          <p className="tagline">
            Every bug that isn’t resting yet, live from the Content Lake. The same rules as
            the Studio: a fix must hold for {BURIAL_WAIT_DAYS} days before burial.
          </p>
        </div>
        <Suspense fallback={null}>
          <BuriedCount />
        </Suspense>
      </header>
      <Suspense fallback={<p className="loading">Opening the drawers…</p>}>
        <Board today={today} />
      </Suspense>
    </main>
  )
}

function BuriedCount() {
  const {count} = useDocuments({
    documentType: 'bug',
    filter: 'status == "buried"',
    perspective: 'published',
    batchSize: 1,
  })
  return (
    <p className="buried-count">
      <strong>{count}</strong> buried
      <br />
      and resting
    </p>
  )
}

function Board({today}: {today: string}) {
  const facts = useBoardFacts()
  const cutoff = burialCutoff(today)

  return (
    <div className="board">
      {COLUMNS.map((column) => (
        <section key={column.id} className="column" data-column={column.id} aria-labelledby={`col-${column.id}`}>
          <Suspense fallback={<ColumnHeading column={column} />}>
            <ColumnCards column={column} cutoff={cutoff} today={today} facts={facts} />
          </Suspense>
        </section>
      ))}
    </div>
  )
}

function ColumnHeading({column, count}: {column: Column; count?: number}) {
  return (
    <header className="column-header">
      <h2 id={`col-${column.id}`}>
        <span aria-hidden>{column.emoji}</span> {column.title}
      </h2>
      {count !== undefined && <span className="count">{count}</span>}
      <p className="hint">{column.hint}</p>
    </header>
  )
}

function ColumnCards({column, cutoff, today, facts}: {column: Column; cutoff: string; today: string; facts: BoardFacts}) {
  const {data, count, hasMore, loadMore, isPending} = useDocuments({
    documentType: 'bug',
    filter: column.filter,
    params: column.filter.includes('$cutoff') ? {cutoff} : {},
    perspective: 'published',
    orderings: [{field: '_updatedAt', direction: 'desc'}],
    batchSize: 20,
  })

  return (
    <>
      <ColumnHeading column={column} count={count} />
      {data.length === 0 ? (
        <p className="empty">{column.empty}</p>
      ) : (
        <ul className="cards">
          {data.map((handle) => (
            <li key={handle.documentId}>
              <Suspense fallback={<div className="card card--loading" />}>
                <BugCard handle={handle} today={today} facts={facts} />
              </Suspense>
            </li>
          ))}
        </ul>
      )}
      {hasMore && (
        <button type="button" className="more" onClick={loadMore} disabled={isPending}>
          {isPending ? 'Loading…' : 'Show more'}
        </button>
      )}
    </>
  )
}
