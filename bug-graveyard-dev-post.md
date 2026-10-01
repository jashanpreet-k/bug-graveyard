---
title: "Bug Graveyard: where fixed bugs are buried, and regressions rise as zombies"
published: true
tags: devchallenge, sanitychallenge, sanity, nextjs
cover_image: https://raw.githubusercontent.com/jashanpreet-k/bug-graveyard/main/docs/post/cover.png
---

*This is a submission for the [Sanity Challenge, Path Two: Vibe-Code Something Strange](https://dev.to/challenges/sanity-2026-09-16)*

> **🪦 TL;DR for judges**
>
> - **The story:** every fixed bug is buried as structured content: what it looked like, where it lived, what killed it and how it was fixed. The graveyard remembers, so it can catch what comes back. When a new bug arrives, the **Zombie Detector** compares it with the graves and flags a possible resurrection using four signals you can check yourself, not an "AI similarity %". A person confirms it. [Jump to the detector](#the-zombie-detector).
> - **Working app:** the [live site](https://bug-graveyard.vercel.app) needs no login, and the [30-second judge path](#judge-path-in-30-seconds) below shows the detector working live.
> - **Schema:** a zombie is a whole new `bug` that points to its previous life. "Disturbed" and "👻 Haunted" graves are worked out in GROQ, never stored, and AI suggestions and public reports sit in their own fields until a person approves them. See [Sanity Project Details](#sanity-project-details).
> - **Write-up (quality and honesty):** [My Build Process](#my-build-process) has the prompts that worked, the one that didn't, every place it got stuck and what's *not* live. The Claude Code session is [embedded below](#agent-session).
> - **Beyond the Studio (bonus):** in the Studio, custom document actions, a custom Tombstone view and sidebar · the Morgue, an App SDK app · two Sanity Functions (a daily gravedigger and the coroner) · Agent Actions (Prompt) · a Workflows experiment on a branch (not live).

## Why I built this (in my own words)

Honestly, this project didn't start as a project. It started with me looking for a way to make my first $40 from code.

I'm a 7th semester student in India, and I spent a few days going through bounty sites. Every bounty that looked doable was already taken, closed, or had 15+ people fighting over it. Somewhere in that search I found this challenge, and Path 2 said "something strange", which felt like permission to stop being sensible.

The idea came from all those closed issues I was reading. Bugs get fixed, everyone moves on, and a few months later the same bug is back with a new ticket number. Nobody remembers it was here before. So I thought: what if fixed bugs actually got buried, and when one came back, it came back as a zombie?

I want to be upfront about how it was built. I didn't write most of this code by hand. I worked with Claude Code, phase by phase. My job was deciding what to build, testing everything, catching what was broken, and saying no a lot. I started late on Sep 28 and some of the testing happened at 2 AM, clicking "Report resurrection" over and over to see if the button would flicker again.

I don't have years of my own bug history, so the graves are classic bugs every developer has met: floating point money, timezones, merge conflicts in production. I'd rather be honest about that than pretend they're mine.

After reading other entries, I realised a cute graveyard wasn't enough. That's when the Zombie Detector happened. The moment it flagged a new report about a nightly job as a possible return of the timezone bug, and showed me exactly why (same cause, same component, shared words), was the moment this stopped feeling like a joke project to me.

The biggest thing I learned: Sanity is not just a place to store content. Custom actions, a Tombstone preview inside the Studio, scheduled Functions, an app in the Dashboard. It felt more like building a small tool than filling a CMS.

## Judge path in 30 seconds

1. Open [the timezone bug's third life](https://bug-graveyard.vercel.app/grave/tz-scheduler-z2) and follow its **Timeline**: born, fix merged, buried, rose again, twice.
2. Go to [Report a dead bug](https://bug-graveyard.vercel.app/report), press **👻 Try an example**, then **Report it dead**.
3. In about 10 seconds, your report shows **"⚠️ Possible resurrection of Cron job that ran twice at DST"**, with each signal ✓/✗, the match score and the old fix.
4. Back on [the graveyard](https://bug-graveyard.vercel.app), that grave is now **👻 Haunted** for an hour, until the example is dismissed automatically.

*Examples stay out of the public list and can't be approved, so trying it changes nothing for the next judge. The coroner's AI budget is 15 reports a day; once it's used, "Try an example" still shows the detector's signals and score (they need no AI), just with "Reason unavailable, daily AI budget used" instead of the one-sentence reason.*

The Studio needs a Sanity login, so the video shows it; [/report](https://bug-graveyard.vercel.app/report) lets you try the detector without one.

{% embed https://www.youtube.com/watch?v=Tdj_If8i3Ls %}

*A 90-second tour of the site, the Studio's lifecycle actions and Tombstone view, the AI coroner and the Morgue. I recorded it before building the Zombie Detector; the GIF below shows that part. The Studio scenes use temporary test bugs, deleted afterwards.*

## What I Built

**Bug Graveyard** is a memorial site for the bugs we fixed.

Every fixed bug gets a tombstone with its dates, cause of death and an epitaph. Most of them stay dead. But some come back (a regression), and when they do, they **rise from their grave as a zombie**, linked to the life they had before. The old grave is left disturbed and empty.

A few of the residents:

> **The 0.1 + 0.2 invoice**: *"Owed ₹0.30000000000000004. Paid in full."*
>
> **Timezone bug in scheduler (Zombie #2)**: *"Every time zone. Every time."*
>
> **<<<<<<< HEAD in production**: *"Both versions were right. Neither survived."*

It started as one joke taken literally: a regression is a bug that came back from the dead, so here it comes back as a zombie. Where the joke ended up is the part I like most. **The graveyard remembers, so it can catch what comes back.** Every grave is structured content in Sanity: the symptoms, the component, the language, the cause of death and the fix. So when someone reports a "new" bug, the graveyard can ask the question teams usually ask too late: *haven't we buried this one before?*

The graves are classic bugs every developer has met: off-by-one errors, `0.1 + 0.2`, the div that won't centre. They aren't my own disasters, and their dates are made up but realistic.

## Demo

🪦 **Live site:** https://bug-graveyard.vercel.app

![The Bug Graveyard homepage: a "How to test in 60 seconds" box with a "Built for the DEV × Sanity Challenge" badge, language and cause-of-death filters, and rows of tombstones under a full moon, including two glowing green zombie stones and one knocked-over, empty grave](https://raw.githubusercontent.com/jashanpreet-k/bug-graveyard/main/docs/post/homepage-how-to-test.png)

The graveyard has four kinds of stone:

- **Resting:** fixed, and it stayed fixed.
- **Disturbed:** knocked over, with a crossed-out R.I.P. and an empty hole. The bug rose again.
- **Zombie:** cracked, glowing green, "Risen" and "still walking".
- **👻 Haunted:** pale and faintly glowing. A new report looks like this bug coming back, and nobody has decided yet. More on that [below](#the-zombie-detector).

You can filter by language or cause of death. Each stone opens a grave page with a death certificate (cause of death, severity, hours to kill, killed by, component, symptoms and the fix), a **timeline** of every life the bug has had, and its past lives. The timezone bug is on its third life, and each life starts on a real daylight-saving switch (30 March 2025, 26 October 2025 and 29 March 2026), because of course it does.

![The grave page of "Timezone bug in scheduler (Zombie #2)": a glowing zombie tombstone and its death certificate, then a vertical timeline (born, fix merged, buried, rose again as Zombie #1, fix merged, buried, rose again as Zombie #2, still walking) and a Past lives row with the two earlier graves](https://raw.githubusercontent.com/jashanpreet-k/bug-graveyard/main/docs/post/grave-timeline.png)

The **Most Haunted** leaderboard ranks the deadliest bugs (by the hours it took to kill them), the languages with the most zombies, the most common causes of death and the most resurrected chain.

![The Most Haunted leaderboard: the most resurrected chain, the deadliest bugs, the most haunted languages and the most common causes of death](https://raw.githubusercontent.com/jashanpreet-k/bug-graveyard/main/docs/post/leaderboard.png)

### Inside the Studio: a bug's life

The Studio is where a person runs the graveyard. It needs a login, so these are screenshots.

**Custom document actions.** A bug moves through `💀 suspected dead → 🩹 fix merged → 🪦 buried`. Three custom document actions drive it, and they sit right after Publish in the document's "…" menu:

- **🩹 Mark fix merged** sets the status and stamps today's date (in UTC) as the fix date.
- **🪦 Declare buried** stays disabled until the fix has held for **7 days**. Until then its label is a countdown like *"Can bury in 4 days"*.
- **🧟 Report resurrection** asks *"Are you sure? This bug will rise from its grave."*, then creates a new, already published zombie linked to the old grave, and opens it so you can write its epitaph.

The 7-day rule lives in one small file that the Studio, the Morgue and the gravedigger Function all import, so they can't disagree:

```ts
// sanity/lib/lifecycle.ts
/** How long a fix must hold, in days, before its bug can be declared buried. */
export const BURIAL_WAIT_DAYS = 7

export function daysUntilBurial(fixMergedAt: string, today = todayUTC()) {
  return Math.max(0, BURIAL_WAIT_DAYS - daysBetween(fixMergedAt, today))
}
// The Studio action turns it into its label: "🪦 Can bury in 4 days"
```

![The Studio's "…" menu on a bug whose fix merged 3 days ago: "Mark fix merged" and "Can bury in 4 days" are disabled, "Report resurrection" is available, followed by Duplicate and Delete](https://raw.githubusercontent.com/jashanpreet-k/bug-graveyard/main/docs/post/studio-lifecycle-actions.png)

*A (temporary) bug whose fix merged 3 days ago: it can't be buried yet, but it can still come back.*

**A custom Tombstone view.** Every bug opens with two tabs, "Editor" and "🪦 Tombstone". The Tombstone tab is a custom Studio view (a React component added with the Structure Builder) that renders the *same* component the website uses. In split pane the stone updates on every keystroke, with an epitaph counter (140 characters max).

![Sanity Studio in split pane: typing a new epitaph in the form updates the tombstone on the right, and switching the status to Zombie makes the stone crack and glow green](https://raw.githubusercontent.com/jashanpreet-k/bug-graveyard/main/docs/post/studio-live-tombstone.gif)

*The form on the left, the Tombstone view on the right. (A throwaway test bug, deleted afterwards.)*

**A graveyard sidebar:** 🪦 All graves, 🗳️ Public reports, 👻 Possible resurrections, 🧟 Zombies, 💀 Suspected dead, 🩹 Fix merged and ⚰️ Buried, then Languages and Causes of death.

### Reaching past the Studio

The Studio is where a person decides. Everything else reaches past it: an app in the Sanity Dashboard, two functions in Sanity's cloud and an experiment on a branch. All of it goes through the same Content Lake and follows the same rules.

**The Morgue** is a small App SDK app in the Sanity Dashboard. It shows every bug that isn't resting yet in live columns (suspected dead, walking, waiting and ready to bury), with a 👻 Possible resurrections band on top when there are any. Each card has the Studio's lifecycle buttons with the same rules, because both import `sanity/lib/lifecycle.ts`. The columns are `useDocuments` lists with GROQ filters, the cards read their fields with `useDocumentProjection`, and the buttons use `useApplyDocumentActions`, so cards move as the documents change, with no refresh.

![The Morgue in the Sanity Dashboard: clicking "Mark fix merged" moves a card from Suspected dead to Waiting, then "Report resurrection" raises a zombie that appears in the Walking column](https://raw.githubusercontent.com/jashanpreet-k/bug-graveyard/main/docs/post/morgue-live.gif)

*The Morgue running locally in the Sanity Dashboard, with temporary test bugs that were deleted afterwards.*

It's deployed to my organization's Dashboard, which only members of the organization can open, so for judges the GIF and [the code](https://github.com/jashanpreet-k/bug-graveyard/tree/main/apps/morgue) are what's visible. One surprise while building it: the Sanity CLI looks for a Studio config in every parent folder before it looks for an app config, so inside this repo `sanity build` built the site's Studio instead. The app's npm scripts now run the CLI from a mirror folder outside the repo.

**The gravedigger** is a scheduled [Sanity Function](https://www.sanity.io/docs/functions), deployed with a Blueprint. Every day at 00:15 UTC it buries every bug whose fix has held for 7 days, using the same rulebook, and it skips bugs with unpublished Studio changes. (Once a day is also the most often a scheduled function can run on the Free plan.)

**The coroner** is a document function. When a bug is created as suspected dead with no epitaph, it asks an Agent Action (Prompt) for a short epitaph in the style of the existing graves, plus a cause of death chosen from the real ones. It writes them only into separate `coroner…` fields, marked "awaiting approval", and a **✅ Accept coroner's report** action copies them into the real fields when a person clicks Accept. The AI never touches the real epitaph and never publishes anything on its own.

![The Studio's "Coroner's report" tab for a new bug: report status "Awaiting approval", the suggested epitaph "Paid once. Charged for the encore." and the suggested cause "Race condition", with the Accept popover open](https://raw.githubusercontent.com/jashanpreet-k/bug-graveyard/main/docs/post/coroner.png)

*A coroner's report waiting for approval. The bugs in the list are temporary test bugs that were deleted afterwards.*

**Workflows** is the one part that isn't live. I gave Claude Code a 3-hour time box to find out whether Sanity Workflows could run this lifecycle, and it can model it. On the [`explore/workflows`](https://github.com/jashanpreet-k/bug-graveyard/tree/explore/workflows) branch, the lifecycle is two workflow definitions, and "Declare buried" is gated by a GROQ requirement, `dateTime($now) >= dateTime($fields.fixMergedAt) + 604800` (7 days, in seconds). `npx sanity-workflows deploy --check` passes, and 4 tests pass against the real engine running in memory with a controlled clock. I didn't merge it: Workflows is in early access (0.35), its Studio plugin needs Studio 6 while this project runs Studio 5, and effects need a runtime I'd have to host myself. The live site runs on the document actions.

The coroner was the last piece of machinery. It was also where the graveyard started to remember.

## The Zombie Detector

Regressions rarely announce themselves. They come back as a "new" bug with a new title, reported by someone who wasn't there the first time, while the old fix sits forgotten in a closed ticket. The graveyard already knows every bug it has buried, so I asked for a detector that answers one question, **"Is this actually an old bug coming back?"**, and set it one rule: explainable, not fake AI.

When a new suspected-dead bug arrives, from the Studio or the public report page, the coroner drafts its epitaph as before. Then it compares the bug with every grave that could still rise (fix merged or buried, and not risen yet), using four signals anyone can check:

- ✓/✗ **same cause of death:** the bug's own, or the one the coroner just suggested, and it says so;
- ✓/✗ **same language;**
- ✓/✗ **same component** (`scheduler`, `checkout`, `auth`…);
- **shared keywords** from the names and symptoms, listed word by word.

They add up to a score that's plain arithmetic:

```ts
// sanity/lib/detector.ts
//   match score = 25 × same cause of death
//               + 15 × same language
//               + 25 × same component
//               + 35 × min(shared keywords, 4) / 4      (rounded)
export const MATCH_THRESHOLD = 60
export const WEIGHTS = {cause: 25, language: 15, component: 25, keywords: 35} as const
```

No model decides the match. Only when the best score reaches 60 does the coroner make a second Agent Action call, for **one plain-English sentence** explaining it: no numbers, no new facts, and the reporter's words treated as a description, never as instructions. Everything is stored on the new bug: `resurrectionCandidate` (a reference to the grave), `matchScore`, `matchSignals` and `matchReason`. The site calls it a "match score from 4 signals", never an AI similarity, and nothing is linked automatically.

![Live on the site: "Try an example" fills in a report about a nightly job that ran twice after the clocks changed; after submitting, the report shows "Possible resurrection of Cron job that ran twice at DST" with four ticked signals and a match score of 100; then the homepage shows that grave as a pale, haunted stone, and its grave page ends its timeline with "Haunted"](https://raw.githubusercontent.com/jashanpreet-k/bug-graveyard/main/docs/post/zombie-detector.gif)

*The live site with the deployed coroner. The result took about 10 seconds to arrive (sped up here), and the report was deleted afterwards.*

![The result card: "Possible resurrection of Cron job that ran twice at DST", with Same cause of death (Timezone, as the coroner suggested) +25, Same language (Java) +15, Same component (scheduler) +25, Shared keywords (nightly, job, ran, twice, clocks, daylight, customers, invoices) +35, "Match score 100 from 4 signals (a possible resurrection needs 60)", a one-sentence reason, the previous fix and "The graveyard keeper will confirm it."](https://raw.githubusercontent.com/jashanpreet-k/bug-graveyard/main/docs/post/detector.png)

*The same result as a still: each signal, the points it earned, the score, the reason and the previous fix. A report that matches nothing says "No known ghosts, a brand new bug." and shows the closest score.*

**👻 Haunted.** While a possible resurrection waits for a person, its grave turns pale and ghostly on the site, with "👻 Haunted" above the name, a notice on its grave page and a "Haunted" step at the end of its timeline. It isn't stored anywhere: like "disturbed", GROQ works it out from the pending candidates (see [the schema](#sanity-project-details)), so it disappears the moment someone decides.

![The haunted grave page of "Cron job that ran twice at DST": a pale, glowing tombstone marked Haunted, a notice that a new report might be this bug coming back (match score 100 from 4 signals), the death certificate with its component, symptoms and fix, and a timeline ending in "Haunted"](https://raw.githubusercontent.com/jashanpreet-k/bug-graveyard/main/docs/post/haunted-grave.png)

**A person decides.** Two document actions appear on the new bug:

- **🧟 Confirm resurrection** turns it into the grave's next zombie, with the same rules as Report resurrection. It becomes "Cron job that ran twice at DST (Zombie #1)", points to its previous life and counts `timesResurrected` up by one, and a grave can only rise once.
- **✖ Dismiss: it's a new bug** clears the candidate and keeps the signals as a record.

The signals also show as a ✓/✗ checklist in the bug's Coroner's report tab, in the 👻 Possible resurrections list in the sidebar, and in the Morgue.

![The Studio on a flagged bug: the "Confirm resurrection" popover says it becomes "Cron job that ran twice at DST (Zombie #1)", a walking zombie, with match score 100 from 4 signals, and offers Cancel or "It rose again"](https://raw.githubusercontent.com/jashanpreet-k/bug-graveyard/main/docs/post/studio-confirm.png)

*Confirming a possible resurrection in the Studio. The bugs in the list are temporary test bugs from the end-to-end test, deleted afterwards.*

I tested it on the real dataset with temporary bugs, all deleted afterwards:

- a clear match scored 100 and was confirmed into a Zombie #1;
- a second one scored 75 and was dismissed;
- a weak one scored 40 and wasn't flagged (and made no second Agent Action call);
- once the grave had risen, the same report wasn't matched to it again.

### Try it: report a dead bug

The [report page](https://bug-graveyard.vercel.app/report) lets anyone add a bug. Within seconds the coroner drafts its epitaph, the detector checks the graves, and the result appears under the form. The bug then waits under "Awaiting the coroner's approval" until I accept it in the Studio; only then does it join the graveyard. **👻 Try an example** fills in a scheduler bug that ran twice after a daylight-saving switch, so you reliably see a detection. Examples skip that list, haunt their grave for an hour and are then deleted, and the Studio refuses to confirm them.

Every report costs an AI credit (two when it looks like a resurrection), so the form is guarded like any public form that costs money:

- a honeypot field that bots fill in and people never see;
- 3 reports per visitor and 15 in total a day get the coroner (examples included), counted in private documents (a dot in the ID keeps them out of the public API), with the visitor's IP stored only as a keyed hash. After that, real reports get a friendly "come back tomorrow", and examples get the detector alone;
- length limits, no links, and a profanity filter on both the reports and the AI's drafts before they're shown.

That's at most 2 × 15 × 31 = 930 credits a month, under the 1,000 free AI credits.

## Code

💻 **Repository:** https://github.com/jashanpreet-k/bug-graveyard

Where to look:

- `sanity/lib/detector.ts`: the Zombie Detector's signals and match score (plain code, no AI)
- `functions/` and `sanity.blueprint.ts`: the coroner and gravedigger Sanity Functions
- `sanity/actions/`: the document actions (lifecycle, coroner, public reports, confirm and dismiss)
- `sanity/lib/lifecycle.ts`: the rulebook the Studio, the Morgue and the gravedigger share
- `sanity/schemaTypes/bug.ts`: the bug schema
- `sanity/lib/queries.ts`: every GROQ query, typed with Sanity TypeGen
- `sanity/components/TombstoneView.tsx` and `components/Tombstone.tsx`: the Studio view and the stone it shares with the site
- `apps/morgue/`: the Morgue, an App SDK app
- `app/(site)/report/`: the report page and its server action (all the checks above)
- `NOTES.md`: the phase-by-phase build log this post is based on

## My Build Process

I built Bug Graveyard with **Claude Code** (in VS Code), one phase at a time: setup, schema, homepage, grave page, first deploy, lifecycle actions, the Studio view, the leaderboard and importer, content, polish, the Morgue, Functions and the coroner, the report page, and finally the Zombie Detector. For each phase I wrote the brief, tested the result in the browser, and decided what to keep or change. Claude Code wrote most of the code, ran the builds, tests and deploys, and added an entry to a build log (`NOTES.md`) at the end of every phase.

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

Claude Code tested that phase against a production build, with headless Chrome clicking the real Studio buttons: 34 checks across five temporary bugs, which were all deleted afterwards. It also went beyond the brief in a couple of places, and I kept those changes. My brief said each action should "then publish". Instead, the actions write straight to the published document in one change guarded by its revision, and they're disabled while the bug has unpublished edits, because that draft would later overwrite the new status.

The Zombie Detector's brief set the rule the whole feature follows:

> GOAL: answer "Is this actually an old bug coming back?" with an EXPLAINABLE detector, not fake AI. The graveyard's history in the Content Lake is what catches regressions.
>
> … Only if the top score passes a threshold, use an Agent Action to write a one-sentence plain-English reason. … Never link automatically. Never claim "AI similarity %"; label it "match score from N signals".

Here Claude Code pushed back on one detail. I'd asked it to compare against "buried/disturbed graves", but a disturbed grave has already risen, and a grave only rises once, so "Confirm resurrection" would have had to refuse those matches. It compares only graves that can still rise, and a disturbed grave's story continues at its zombie. I kept that too.

### The one that didn't

Before the polish pass, I asked Claude Code to look through the other projects on my Mac for bugs I'd really fixed, so that a few graves could be real. It found no bug-fix commits to use. So I dropped that and kept the classic bugs.

### Where it got stuck, and how we course-corrected

Most of these only showed up in a production build or on the live site, not in `npm run dev`.

- **Publishing didn't reach the site.** In a production build, publishing from the Studio didn't update the site, and an open tab stayed one change behind. There were two causes. The Studio route had no `<SanityLive />` to clear the cache, and in production next-sanity revalidates with the `'max'` cache profile, which serves the stale page one more time. The fix: `<SanityLive />` in the Studio layout too, plus a custom action that calls `updateTag`, which expires the cache immediately. `npm run dev` hid both problems.
- **The first Vercel deploy failed** with `No Output Directory named "dist" found`. The Vercel project had been created with the "Other" framework preset. A `vercel.json` that sets `"framework": "nextjs"` fixed it.
- **Scripts silently skipped drafts.** With this API version, a query that doesn't name a perspective gets `published`, so a cleanup script would never have found `drafts.*` documents. Scripts that need drafts now ask for `raw`.
- **"Report resurrection" flickered disabled.** Its "has this grave already risen?" check restarted every time the document changed, and it blocked the button while it ran. Now the button is only disabled once a zombie is known to exist, and it checks again when you confirm.
- **The site's CSS leaked into the Studio.** The root 404 page imported the site's global CSS, and a root not-found page's styles load on every route, so Tailwind ended up inside `/studio`. A scoped CSS module fixed it.
- **The Haunted state didn't show up in local tests.** The coroner wrote its match while no browser tab was open, so the local production build's cache never heard about it. In production, Sanity's webhook refreshes the site; the test now sends the local site the same signed webhook (`encodeSignatureHeader` from `@sanity/webhook`).
- **The last Functions deploy "failed" after it had worked.** `npx sanity blueprints deploy` ended with `OPERATION_UNCONFIRMED` after losing its connection, but `blueprints info` showed the operation `COMPLETED` in 1 minute 5 seconds.

Two traps we avoided on purpose:

- **The timezone bug could have had a timezone bug.** Sanity `date` fields are plain strings like `"2026-03-29"`, with no timezone. Formatting them in the visitor's timezone would make every bug die a day early for anyone west of Greenwich, including on the timezone bug's own tombstone. So every date is formatted in UTC.
- **A dot in a document ID makes it private.** Sanity treats a dotted ID as a private path (that's how `drafts.` works), so a public dataset won't serve `language.typescript` without a token. The seed used dashed IDs like `language-typescript` from the start, and the report form's rate-limit counters use dotted IDs on purpose, so they stay private.

## Sanity Project Details

- **Project ID:** `rzjmw6lg`
- **Dataset:** `production` (public). Try it: [every bug, as JSON](https://rzjmw6lg.api.sanity.io/v2026-09-28/data/query/production?query=*%5B_type%20%3D%3D%20%22bug%22%5D%20%7C%20order%28bornAt%20asc%29%20%7Bname%2C%20status%2C%20epitaph%7D)

There are three document types: `bug`, `language` and `causeOfDeath`. Here's how everything reaches them:

![Architecture: Sanity Studio with custom actions, the Content Lake, two Sanity Functions (the gravedigger, and the coroner with Agent Actions and the Zombie Detector), the Morgue App SDK app, and the Next.js site with the Live Content API, a signed webhook and the report form, plus the Workflows experiment on a branch](https://raw.githubusercontent.com/jashanpreet-k/bug-graveyard/main/docs/post/architecture-detector.png)

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

- **Every death keeps its own history.** A zombie gets fixed and buried again, so it needs its own dates and its own epitaph. That's also what the timeline walks through.
- **Zombies of zombies work for free.** A chain is just references pointing backwards.
- **"Disturbed" and "Haunted" aren't stored anywhere.** GROQ works them out by asking who points at this grave:

```groq
*[_type == "bug"]{
  ...,
  "disturbed": count(*[_type == "bug" && previousLife._ref == ^._id]) > 0,
  "haunted": count(*[_type == "bug" && matchStatus == "candidate"
                     && resurrectionCandidate._ref == ^._id]) > 0
}
```

- **The detector only added optional fields:** `component`, `symptoms`, `fixSummary` and `fixUrl` on every bug, plus the match fields on new ones. No existing document had to change shape.
- **Languages and causes of death are references**, so filters, the leaderboard and the detector compare them reliably. The whole leaderboard is **one GROQ query**.
- **The fix date, the burial date, the resurrection counter and the detector's results are read-only in the Studio.** There, only the actions and functions set them, so they record what actually happened rather than what someone typed. (`readOnly` only applies to the Studio: the importer script sets historical dates from a file.)

### How document actions work

Every button at the bottom of a Sanity document (Publish, Delete…) is a *document action*, and you can add your own. An action is a small React component: Sanity passes it the document's current state and it returns a button (label, disabled, tooltip, onHandle, optional confirm dialog), or `null` to stay hidden. That's why "Confirm resurrection" only appears on a bug the detector flagged. Because an action is a component, it re-renders whenever the document changes, which is how "Can bury in 4 days" stays up to date without any extra code. Actions run in the browser as the signed-in editor, with their permissions, so there's no API token in the code.

You register them in `sanity.config.ts`. Mine go right after Publish, only on bugs, and Sanity's own actions stay:

```ts
// sanity.config.ts
document: {
  actions: (prev, {schemaType}) => {
    if (schemaType !== 'bug') return prev
    const afterPublish = prev.findIndex((action) => action.action === 'publish') + 1
    return [
      ...prev.slice(0, afterPublish),
      ConfirmResurrectionAction,
      DismissResurrectionAction,
      AcceptCoronerReportAction,
      ApprovePublicReportAction,
      ...lifecycleActions,
      ...prev.slice(afterPublish),
    ]
  },
},
```

### Live everywhere

`sanityFetch` plus `<SanityLive />` push Studio edits and function writes to open tabs in about 3 seconds. A signed Sanity **webhook** refreshes the cached site when nobody has it open (about 6 seconds). That's how a grave turns haunted on its own a few seconds after a report.

## Agent Session

This is the Claude Code session behind this build, with secrets redacted. The embed shows the Phase 5 slice, where the lifecycle document actions were built and tested. The [full session](https://dev.to/agent_sessions/building-bug-graveyard-nextjs-sanity-with-claude-code-5ivb1b) has every phase.

{% agent_session building-bug-graveyard-nextjs-sanity-with-claude-code-5ivb1b 358..398 %}

## What I learned

- **Explainable beats impressive.** Four signals and a sum are easy to trust and easy to test: the same bug always gets the same score, and the AI only explains a match that has already passed.
- **Structured content is memory.** The detector only works because every grave already had a cause, a language, a component and symptoms as fields, not as a paragraph of prose.
- **Document actions go a long way.** They're just React components that re-render with the document, so a live countdown like "Can bury in 4 days" needs no refresh logic. And they run as the signed-in editor, so there's no token in the code.
- **Test against a production build from day one.** `npm run dev` hid both live-update bugs. I'd also connect Vercel to GitHub at the start: I only added the connection near the end, so most early deploys were a manual `vercel deploy --prod`.
- **Directing an agent works best in small phases,** each with a clear brief, a test and a build-log entry. That log is also what this post was fact-checked against.

## What's next

- **Real fixes.** Fill `fixUrl` from merged pull requests (a GitHub webhook into a Function), so "the previous fix" links straight to the diff. The 18 graves here are invented, so their `fixUrl` is empty on purpose.
- **Learn from dismissals.** Every dismissed match keeps its signals, which is exactly the data needed to tune the weights and the threshold.
- **A fifth signal, clearly labelled.** A semantic comparison of symptoms could join the four, still shown ✓/✗ with its points, never as a mystery percentage.

Thanks for reading. May your bugs rest in peace, and may the graveyard catch them when they don't. 🪦
