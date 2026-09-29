import {defineBlueprint, defineDocumentFunction, defineRobotToken, defineScheduledFunction} from '@sanity/blueprints'

// Sanity resources managed as code: the two Sanity Functions in ./functions.
// Deploy with `npx sanity@latest blueprints deploy`.

const PROJECT_ID = 'rzjmw6lg'
const DATASET = 'production'

export default defineBlueprint({
  resources: [
    // The gravedigger's own token. Scheduled functions don't get one automatically;
    // this one can edit this project and nothing else.
    defineRobotToken({
      name: 'gravedigger-token',
      label: 'Gravedigger (Sanity Function)',
      memberships: [{resourceType: 'project', resourceId: PROJECT_ID, roleNames: ['editor']}],
    }),

    // Once a day, bury every bug whose fix has held for 7 days.
    // Daily is the most often a scheduled function can run on the Free plan.
    defineScheduledFunction({
      name: 'gravedigger',
      event: {expression: '15 0 * * *'},
      timezone: 'UTC',
      robotToken: '$.resources.gravedigger-token.token',
      timeout: 60,
    }),

    // When a new bug is published as suspected dead with no epitaph, draft a
    // coroner's report for a person to accept. Drafts don't trigger it.
    defineDocumentFunction({
      name: 'coroner',
      event: {
        on: ['create'],
        filter:
          '_type == "bug" && status == "suspected-dead" && (!defined(epitaph) || epitaph == "") && !defined(coronerStatus)',
        projection: '{_id, name, "language": language->name}',
        resource: {type: 'dataset', id: `${PROJECT_ID}.${DATASET}`},
      },
      timeout: 60,
    }),
  ],
})
