---
title: "Bug Graveyard: where fixed bugs are buried, and regressions rise as zombies"
published: true
tags: devchallenge, sanitychallenge, sanity, nextjs
cover_image: https://raw.githubusercontent.com/jashanpreet-k/bug-graveyard/main/docs/post/cover.png
---

*This is a submission for the [Sanity Challenge, Path Two: Vibe-Code Something Strange](https://dev.to/challenges/sanity-2026-09-16)*

![Sanity Studio in split pane: typing a new epitaph in the form updates the tombstone on the right, and switching the status to Zombie makes the stone crack and glow green](https://raw.githubusercontent.com/jashanpreet-k/bug-graveyard/main/docs/post/studio-live-tombstone.gif)

*The Studio in split pane: the form on the left, the live 🪦 Tombstone view on the right. (This is a throwaway test bug, deleted afterwards.)*

## What I Built

**Bug Graveyard** is a memorial site for the bugs we fixed.

Every fixed bug gets a tombstone with its dates, cause of death and an epitaph. Most of them stay dead. But some come back (a regression), and when they do, they **rise from their grave as a zombie**, linked to the life they had before. The old grave is left disturbed and empty.

A few of the residents:

> **The 0.1 + 0.2 invoice**: *"Owed ₹0.30000000000000004. Paid in full."*
>
> **Timezone bug in scheduler (Zombie #2)**: *"Every time zone. Every time."*
>
> **<<<<<<< HEAD in production**: *"Both versions were right. Neither survived."*

The graves are classic bugs that every developer has met at some point: off-by-one errors, `0.1 + 0.2`, the div that won't centre. They aren't a record of my own personal disasters, and their dates are made up but realistic.

The idea is one joke taken literally: a regression is a bug that came back from the dead, so here it comes back as a zombie. Most of the work went into modelling that lifecycle properly in Sanity, not just drawing tombstones.

## Demo

🪦 **Live site:** https://bug-graveyard.vercel.app

![The Bug Graveyard homepage: language and cause-of-death filters above rows of tombstones under a full moon, including two glowing green zombie stones and one knocked-over, empty grave](https://raw.githubusercontent.com/jashanpreet-k/bug-graveyard/main/docs/post/homepage.png)

The graveyard shows three kinds of stone:

- **Resting:** fixed, and it stayed fixed.
- **Disturbed:** knocked over, with a crossed-out R.I.P. and an empty hole. The bug rose again.
- **Zombie:** cracked, glowing green, "Risen" and "still walking".

You can filter the graves by language or cause of death. Click any stone to open its grave page: a death certificate (cause of death, severity, hours to kill, killed by) and its **past lives**. The timezone bug is on its third life, and each life starts on a real daylight-saving switch (30 March 2025, 26 October 2025 and 29 March 2026), because of course it does.

![The grave page of "Timezone bug in scheduler (Zombie #2)": a large glowing zombie tombstone, its death certificate, and a Past lives row showing the two earlier graves in its chain](https://raw.githubusercontent.com/jashanpreet-k/bug-graveyard/main/docs/post/grave-zombie-2.png)

The **Most Haunted** leaderboard ranks the deadliest bugs (by the hours it took to kill them), the languages with the most zombies, the most common causes of death and the most resurrected chain.

![The Most Haunted leaderboard: the most resurrected chain, the deadliest bugs, the most haunted languages and the most common causes of death](https://raw.githubusercontent.com/jashanpreet-k/bug-graveyard/main/docs/post/leaderboard.png)

### Inside the Studio

This is where most of the Sanity work lives.

**1. A bug's life, as custom document actions.** A bug moves through `💀 suspected dead → 🩹 fix merged → 🪦 buried`. Three custom document actions drive it, and they sit right after Publish in the document's "…" menu:

- **🩹 Mark fix merged** sets the status and stamps today's date (in UTC) as the fix date.
- **🪦 Declare buried** stays disabled until the fix has held for **7 days**. Until then its label is a countdown like *"Can bury in 4 days"*.
- **🧟 Report resurrection** asks *"Are you sure? This bug will rise from its grave."*, then creates a new, already published zombie linked to the old grave, and opens it so you can write its epitaph.

![The Studio's "…" menu on a bug whose fix merged 3 days ago: "Mark fix merged" and "Can bury in 4 days" are disabled, "Report resurrection" is available, followed by Duplicate and Delete](https://raw.githubusercontent.com/jashanpreet-k/bug-graveyard/main/docs/post/studio-lifecycle-actions.png)

*A (temporary) bug whose fix merged 3 days ago: it can't be buried yet, but it can still come back.*

**2. A live Tombstone view.** Every bug opens with two tabs, "Editor" and "🪦 Tombstone". The Tombstone tab renders the *same* React component the website uses. In split pane the stone updates on every keystroke, with an epitaph counter (140 characters max).

**3. A graveyard sidebar:** 🪦 All graves, 🧟 Zombies, 💀 Suspected dead, 🩹 Fix merged and ⚰️ Buried, then Languages and Causes of death.

## Code

💻 **Repository:** https://github.com/jashanpreet-k/bug-graveyard

Where to look:

- `sanity/actions/lifecycle.tsx`: the three document actions
- `sanity/schemaTypes/bug.ts`: the bug schema
- `sanity/lib/queries.ts`: every GROQ query, typed with Sanity TypeGen
- `sanity/components/TombstoneView.tsx` and `components/Tombstone.tsx`: the Studio view and the stone it shares with the site
- `apps/morgue/`: the Morgue, an App SDK app (see below)
- `NOTES.md`: the phase-by-phase build log this post is based on

## My Build Process

I built Bug Graveyard with **Claude Code** (in VS Code), one phase at a time: setup, schema, homepage, grave page, first deploy, lifecycle actions, the Studio view, the leaderboard and importer, content, and a polish pass. For each phase I wrote the brief, tested the result in the browser, and decided what to keep or change. Claude Code wrote most of the code, ran the builds, tests and deploys, and added an entry to a build log (`NOTES.md`) at the end of every phase.

**Stack:** Next.js 16 (App Router, TypeScript, Tailwind CSS v4), Sanity Studio v5 embedded at `/studio`, `next-sanity`, deployed on Vercel.

### The prompts that worked

Short phase briefs with explicit rules and a test step. Here's part of the Phase 5 brief, for the lifecycle actions:

> 2\. "🪦 Declare buried": enabled only when status = fix-merged AND at least 7 days have passed since fixMergedAt. When disabled, the label/title says how many days are left (e.g. "Can bury in 4 days"). Sets status = buried and buriedAt = today, then publishes.
>
> Rules:
> - Use dates in UTC like the rest of the app.
> - Handle drafts correctly (act on the published doc, don't leave stray drafts).
> - Make the 7-day rule a single constant so I can mention it in the write-up.
>
> Test it end to end with temporary test bugs (delete them after) …

Claude Code tested that phase against a production build, with headless Chrome clicking the real Studio buttons: 34 checks across five temporary bugs, which were all deleted afterwards. It also went beyond the brief in a couple of places, and I kept those changes. My brief said each action should "then publish". Instead, the actions write straight to the published document in one change guarded by its revision, and they're disabled while the bug has unpublished edits, because that draft would later overwrite the new status. And "Mark fix merged" also works on a zombie, so a zombie can start a lifecycle of its own.

### The one that didn't

Before the polish pass, I asked Claude Code to look through the other projects on my Mac for bugs I'd really fixed, so that a few graves could be real. It found no bug-fix commits to use. So I dropped that and kept the classic bugs.

### Where it got stuck, and how we course-corrected

Most of these only showed up in a production build or on the live site, not in `npm run dev`.

- **Publishing didn't reach the site.** In a production build, publishing from the Studio didn't update the site, and an open tab stayed one change behind. There were two causes. The Studio route had no `<SanityLive />` to clear the cache, and in production next-sanity revalidates with the `'max'` cache profile, which serves the stale page one more time. The fix: `<SanityLive />` in the Studio layout too, plus a custom action that calls `updateTag`, which expires the cache immediately. `npm run dev` hid both problems.
- **The first Vercel deploy failed** with `No Output Directory named "dist" found`. The Vercel project had been created with the "Other" framework preset. A `vercel.json` that sets `"framework": "nextjs"` fixed it.
- **Scripts silently skipped drafts.** With this API version, a query that doesn't name a perspective gets `published`, so a cleanup script would never have found `drafts.*` documents. Scripts that need drafts now ask for `raw`.
- **"Report resurrection" flickered disabled.** Its "has this grave already risen?" check restarted every time the document changed, and it blocked the button while it ran. Now the button is only disabled once a zombie is known to exist, and it checks again when you confirm.
- **The site's CSS leaked into the Studio.** The root 404 page imported the site's global CSS, and a root not-found page's styles load on every route, so Tailwind ended up inside `/studio`. A scoped CSS module fixed it.
- **The build prerendered deleted bugs.** `generateStaticParams` read the slug list from Next's local fetch cache, which still held old test bugs. It now fetches the slugs with `cache: 'no-store'`.

Two traps we avoided on purpose:

- **The timezone bug could have had a timezone bug.** Sanity `date` fields are plain strings like `"2026-03-29"`, with no timezone. Formatting them in the visitor's timezone would make every bug die a day early for anyone west of Greenwich, including on the timezone bug's own tombstone. So every date is formatted in UTC.
- **A dot in a document ID makes it private.** Sanity treats a dotted ID as a private path (that's how `drafts.` works), so a public dataset won't serve `language.typescript` without a token. The seed used dashed IDs like `language-typescript` from the start. A quick test while writing this post confirmed it: a published document with a dotted ID didn't appear in a public query.

### Reaching past the Studio: Workflows

I also asked Claude Code to find out, in a 3-hour time box, whether Sanity Workflows could run this lifecycle. It can model it. On a separate branch ([`explore/workflows`](https://github.com/jashanpreet-k/bug-graveyard/tree/explore/workflows)), the lifecycle is two workflow definitions (one for a bug and one for a zombie), and "Declare buried" is gated by a GROQ requirement instead of a timer:

```groq
dateTime($now) >= dateTime($fields.fixMergedAt) + 604800 // 7 days, in seconds
```

`npx sanity-workflows deploy --check` passes for both definitions, and 4 tests pass against the real engine running in memory with a controlled clock. Burial is refused until exactly 7 days have passed.

I didn't merge it. Workflows is in early access (0.35), its Studio plugin needs Studio 6 while this project runs Studio 5, and effects need a runtime I'd have to run myself. A proper integration also means deciding whether the workflow or the bug's own `status` field is the source of truth, which Claude Code estimated at 1.5 to 2 days. The live site still runs on the document actions.

### Reaching past the Studio: the App SDK

After publishing this post, I had Claude Code build **the Morgue**: a small App SDK app that runs in the Sanity Dashboard. It shows every bug that isn't resting yet in four live columns: suspected dead, walking, waiting and ready to bury. Each card has the same three lifecycle actions as the Studio, with the same rules, because both import the same `sanity/lib/lifecycle.ts`.

![The Morgue in the Sanity Dashboard: clicking "Mark fix merged" moves a card from Suspected dead to Waiting, then "Report resurrection" raises a zombie that appears in the Walking column](https://raw.githubusercontent.com/jashanpreet-k/bug-graveyard/main/docs/post/morgue-live.gif)

*The Morgue running locally in the Sanity Dashboard, with temporary test bugs that were deleted afterwards. No refresh anywhere: the cards move as the documents change.*

- **Everything is live.** Each column is a `useDocuments` list with a GROQ filter, and each card reads its fields with `useDocumentProjection`.
- **The buttons are the Studio's actions, rebuilt with the App SDK.** They use `useApplyDocumentActions` with `editDocument` and `createDocument` on `liveEdit` handles, which write straight to the published bug like the Studio's actions do. They also wait while a bug has unpublished Studio changes.
- **Tested in the real Dashboard:** 18 checks on temporary test bugs, all deleted afterwards.
- **One surprise:** the Sanity CLI looks for a Studio config in every parent folder before it looks for an app config. Inside this repo, whose root holds the embedded Studio's config, `sanity build` built the site's Studio instead. The app's npm scripts now run the CLI from a mirror folder outside the repo.

The code is in [`apps/morgue`](https://github.com/jashanpreet-k/bug-graveyard/tree/main/apps/morgue). I haven't deployed it: an App SDK app only opens for members of the project's organization, so for judges the GIF and the code are what's visible.

## Sanity Project Details

- **Project ID:** `rzjmw6lg`
- **Dataset:** `production` (public). Try it: [every bug, as JSON](https://rzjmw6lg.api.sanity.io/v2026-09-28/data/query/production?query=*%5B_type%20%3D%3D%20%22bug%22%5D%20%7C%20order%28bornAt%20asc%29%20%7Bname%2C%20status%2C%20epitaph%7D)

There are three document types: `bug`, `language` and `causeOfDeath`.

### The schema: zombies are documents, not checkboxes

The central decision: **a zombie is a whole new `bug` document that points to its previous life.** It isn't a status flag on the old one.

```ts
// sanity/schemaTypes/bug.ts (simplified)
defineField({
  name: 'status',
  type: 'string',
  options: {list: ['suspected-dead', 'fix-merged', 'buried', 'zombie']},
}),
defineField({
  name: 'previousLife',
  type: 'reference',
  to: [{type: 'bug'}],
  hidden: ({document}) => document?.status !== 'zombie',
}),
defineField({name: 'timesResurrected', type: 'number', readOnly: true}),
```

Why:

- **Every death keeps its own history.** A zombie gets fixed and buried again, so it needs its own dates and its own epitaph.
- **Zombies of zombies work for free.** A chain is just references pointing backwards.
- **"Disturbed" isn't stored anywhere.** GROQ works it out by asking whether any bug points at this one:

```groq
*[_type == "bug"]{
  ...,
  "disturbed": count(*[_type == "bug" && previousLife._ref == ^._id]) > 0
}
```

- **Languages and causes of death are references**, so filters and the leaderboard count them reliably. The whole leaderboard is **one GROQ query**.
- **The fix date, the burial date and the resurrection counter are read-only in the Studio.** There, only the lifecycle actions set them, so they record what actually happened rather than what someone typed. (`readOnly` only applies to the Studio: the importer script sets historical dates from a file.)

### How document actions work

Every button at the bottom of a Sanity document (Publish, Delete…) is a *document action*, and you can add your own. An action is a small React component: Sanity passes it the document's current state and it returns a button (label, disabled, tooltip, onHandle, optional confirm dialog). You register actions in `sanity.config.ts`. Because an action is a component, it re-renders whenever the document changes, which is how "Can bury in 4 days" stays up to date without any extra code. Actions run in the browser as the signed-in editor, with their permissions, so there's no API token in the code.

### Live everywhere

`sanityFetch` plus `<SanityLive />` push Studio edits to open tabs in about 3 seconds. A signed Sanity **webhook** refreshes the cached site when nobody has it open (about 6 seconds).

## Agent Session

This is the Claude Code session behind this build, with secrets redacted. The embed shows the Phase 5 slice, where the lifecycle document actions were built and tested. The [full session](https://dev.to/agent_sessions/building-bug-graveyard-nextjs-sanity-with-claude-code-5ivb1b) has every phase.

{% agent_session building-bug-graveyard-nextjs-sanity-with-claude-code-5ivb1b 358..398 %}

## What I learned

- **Document actions go a long way.** They're just React components that re-render with the document, so a live countdown like "Can bury in 4 days" needs no refresh logic. And they run as the signed-in editor, so there's no token in the code.
- **Test against a production build from day one.** `npm run dev` hid both live-update bugs. I'd also connect Vercel to GitHub at the start: I never added the login connection, so every deploy was a manual `vercel deploy --prod`.
- **The App SDK reuses the Studio's ideas outside the Studio.** Handles, projections and document actions, all live, in a plain React app. Sharing one rules file kept the Studio and the Morgue from drifting apart.
- **Workflows can model this lifecycle,** and the in-memory test engine makes a rule like "7 days" easy to test by moving the clock. But a real integration needs Studio 6 and a runtime, so for now it stays an experiment.
- **Directing an agent works best in small phases,** each with a clear brief, a test and a build-log entry. That log is also what this post was fact-checked against.

Thanks for reading. May your bugs rest in peace. 🪦
