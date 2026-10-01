import type {DefaultDocumentNodeResolver, StructureBuilder, StructureResolver} from 'sanity/structure'

import {TombstoneView} from './components/TombstoneView'
import {apiVersion} from './env'
import type {BugStatus} from './lib/statuses'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Graveyard')
    .items([
      S.documentTypeListItem('bug').title('All graves').icon(() => '🪦'),
      pendingReports(S),
      possibleResurrections(S),
      bugsWithStatus(S, 'zombie', 'Zombies', '🧟'),
      bugsWithStatus(S, 'suspected-dead', 'Suspected dead', '💀'),
      bugsWithStatus(S, 'fix-merged', 'Fix merged', '🩹'),
      bugsWithStatus(S, 'buried', 'Buried', '⚰️'),
      S.divider(),
      S.documentTypeListItem('language').title('Languages'),
      S.documentTypeListItem('causeOfDeath').title('Causes of death'),
    ])

// Only "Suspected dead" offers "create": a new bug always starts there, and the
// other statuses are reached through the lifecycle actions. The report page's
// examples stay out of these lists (they clear themselves); "All graves" has them.
function bugsWithStatus(S: StructureBuilder, status: BugStatus, title: string, icon: string) {
  return S.listItem()
    .id(status)
    .title(title)
    .icon(() => icon)
    .child(
      S.documentList()
        .id(status)
        .title(title)
        .schemaType('bug')
        .apiVersion(apiVersion)
        .filter('_type == "bug" && status == $status && isExample != true')
        .params({status})
        .defaultOrdering([{field: '_updatedAt', direction: 'desc'}])
        .initialValueTemplates(status === 'suspected-dead' ? [S.initialValueTemplateItem('bug')] : []),
    )
}

// Bugs reported on the site that are still waiting to be approved
function pendingReports(S: StructureBuilder) {
  return S.listItem()
    .id('public-reports')
    .title('Public reports')
    .icon(() => '🗳️')
    .child(
      S.documentList()
        .id('public-reports')
        .title('Public reports (pending)')
        .schemaType('bug')
        .apiVersion(apiVersion)
        .filter('_type == "bug" && publicReport.status == "pending" && isExample != true')
        .defaultOrdering([{field: '_createdAt', direction: 'desc'}])
        .initialValueTemplates([]),
    )
}

// New bugs the Zombie Detector flagged: confirm or dismiss them
function possibleResurrections(S: StructureBuilder) {
  return S.listItem()
    .id('possible-resurrections')
    .title('Possible resurrections')
    .icon(() => '👻')
    .child(
      S.documentList()
        .id('possible-resurrections')
        .title('Possible resurrections')
        .schemaType('bug')
        .apiVersion(apiVersion)
        .filter('_type == "bug" && matchStatus == "candidate" && isExample != true')
        .defaultOrdering([{field: '_createdAt', direction: 'desc'}])
        .initialValueTemplates([]),
    )
}

// Bugs open with two tabs: the form, and a live preview of their tombstone.
export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) =>
  schemaType === 'bug'
    ? S.document().views([
        S.view.form().title('Editor'),
        S.view.component(TombstoneView).title('🪦 Tombstone').id('tombstone'),
      ])
    : S.document()
