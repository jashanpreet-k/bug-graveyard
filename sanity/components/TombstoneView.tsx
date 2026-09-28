import {useEffect, useState} from 'react'
import {getPublishedId, useDocumentPreviewStore, useDocumentStore} from 'sanity'
import type {UserViewComponent} from 'sanity/structure'

import {Grass} from '../../components/Scenery'
import {Tombstone} from '../../components/Tombstone'
import {diedAt, lookFor} from '../../lib/graves'
import {EPITAPH_MAX_LENGTH} from '../schemaTypes/bug'
import styles from './TombstoneView.module.css'

// The "🪦 Tombstone" tab on bug documents: the site's own Tombstone component,
// drawn from whatever the editor shows (the draft if there is one, otherwise the
// published bug), so it changes as you type.

type Ref = {_ref?: string}

type DisplayedBug = {
  name?: string
  status?: string
  epitaph?: string
  bornAt?: string
  fixMergedAt?: string
  buriedAt?: string
  language?: Ref
  causeOfDeath?: Ref
  previousLife?: Ref
}

type References = {
  language: {name: string; color: string | null} | null
  causeOfDeath: string | null
  previousLife: string | null
  disturbed: boolean
}

// Whether a zombie rose from this grave, which makes the stone look dug up.
const DISTURBED_QUERY = 'count(*[_type == "bug" && previousLife._ref == $id]) > 0'

const LANGUAGE_PATHS = ['name', 'color']
const TITLE_PATH = ['title']
const NAME_PATH = ['name']

export const TombstoneView: UserViewComponent = ({document, documentId}) => {
  const bug = document.displayed as DisplayedBug
  const references = useReferences(getPublishedId(documentId), bug)
  const length = bug.epitaph?.length ?? 0
  const tooLong = length - EPITAPH_MAX_LENGTH

  return (
    <div className={styles.night}>
      <div className={styles.stars} aria-hidden />
      <div className={styles.moon} aria-hidden />
      <div className={styles.stage}>
        <Tombstone
          size="large"
          name={bug.name || 'Unnamed bug'}
          epitaph={bug.epitaph}
          bornAt={bug.bornAt}
          diedAt={diedAt({buriedAt: bug.buriedAt ?? null, fixMergedAt: bug.fixMergedAt ?? null})}
          language={references.language}
          causeOfDeath={references.causeOfDeath}
          risenFrom={references.previousLife}
          look={lookFor({status: bug.status ?? 'suspected-dead', disturbed: references.disturbed})}
        />
        <p className={tooLong > 0 ? styles.tooLong : styles.counter} aria-live="polite">
          Epitaph: {length} / {EPITAPH_MAX_LENGTH}
          {tooLong > 0 && ` · ${tooLong} too long`}
        </p>
      </div>
      <Grass />
    </div>
  )
}

// Resolves what the stone needs from other documents, live: the language badge,
// the cause of death, the grave a zombie rose from, and whether one rose from it.
function useReferences(id: string, bug: DisplayedBug): References {
  const language = useFields<{name?: string; color?: string}>(bug.language?._ref, LANGUAGE_PATHS)
  const cause = useFields<{title?: string}>(bug.causeOfDeath?._ref, TITLE_PATH)
  const previousLife = useFields<{name?: string}>(bug.previousLife?._ref, NAME_PATH)
  const disturbed = useDisturbed(id)

  return {
    language: language?.name ? {name: language.name, color: language.color ?? null} : null,
    causeOfDeath: cause?.title ?? null,
    previousLife: previousLife?.name ?? null,
    disturbed,
  }
}

// Fields of a referenced document, through the Studio's preview store: the same
// cached, live source the Studio uses for its own reference previews.
function useFields<T>(ref: string | undefined, paths: string[]) {
  const previewStore = useDocumentPreviewStore()
  const [state, setState] = useState<{ref: string; value: T | null} | null>(null)

  useEffect(() => {
    if (!ref) return
    const subscription = previewStore
      .observePaths({_ref: ref}, paths)
      .subscribe((value) => setState({ref, value: value as T | null}))
    return () => subscription.unsubscribe()
  }, [previewStore, ref, paths])

  // Ignore a value that belongs to a reference the editor has since changed.
  return ref && state?.ref === ref ? state.value : null
}

function useDisturbed(id: string) {
  const documentStore = useDocumentStore()
  const [disturbed, setDisturbed] = useState(false)

  useEffect(() => {
    const subscription = documentStore
      .listenQuery(DISTURBED_QUERY, {id}, {perspective: 'published'})
      .subscribe((result: boolean) => setDisturbed(result))
    return () => subscription.unsubscribe()
  }, [documentStore, id])

  return disturbed
}
