# Bug Graveyard — build log

Build log for my DEV Sanity Challenge entry (Path 2: vibe-code something strange).
Bug Graveyard is a site where developers bury bugs they fixed. Each bug gets a
tombstone, and if it comes back it rises as a zombie linked to its old grave.

Stack: Next.js 16 (App Router, TypeScript, Tailwind v4) + Sanity, with the Studio
embedded at `/studio`. Deploying on Vercel.

A new entry is added at the end of every phase.

---

## Phase 1: Next.js + Sanity setup (2026-09-29)

### What I asked for

- A short phase-by-phase plan for 5 days, a folder structure, and a proposed Sanity
  schema. No code yet.
- Then the setup itself: create the Next.js app (App Router, TypeScript, Tailwind,
  ESLint), initialise Sanity with the Studio embedded at `/studio`, put the project
  ID and dataset in a gitignored `.env.local`, add `http://localhost:3000` as a CORS
  origin, and make the first git commit.
- Halfway through I asked Claude to do the interactive Sanity steps itself instead
  of walking me through them.

### What was built

First commit: `f59e00d`, "Scaffold Next.js app with embedded Sanity Studio".

Next.js scaffold (`create-next-app`, Next 16.3.6, React 19.2):
- `package.json`, `package-lock.json`: dependencies and scripts
- `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`: config
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `app/favicon.ico`: starter app
- `public/*.svg`: starter images (to delete later)
- `AGENTS.md`, `CLAUDE.md`: notes that Next 16 generates for AI coding agents

Sanity (`sanity init`, which added `sanity` 5.31 and `next-sanity` 13.3):
- `app/studio/[[...tool]]/page.tsx`: shows the Studio at `/studio` and every page under it
- `sanity.config.ts`: Studio config (base path, project, dataset, schema, plugins)
- `sanity.cli.ts`: tells `npx sanity …` commands which project and dataset to use
- `sanity/env.ts`: reads the project ID, dataset and API version from env vars
- `sanity/lib/client.ts`: the client the site uses to query content
- `sanity/lib/image.ts`: `urlFor()`, which builds image URLs
- `sanity/lib/live.ts`: `sanityFetch` and `<SanityLive />` for live content updates
- `sanity/schemaTypes/index.ts`: the list of content types (empty so far)
- `sanity/structure.ts`: the Studio sidebar layout (default so far)
- `.env.local`: project ID `rzjmw6lg`, dataset `production` (gitignored, not committed)

In my Sanity account:
- A new organization, a new project `bug-graveyard` (`rzjmw6lg`) and a public
  `production` dataset
- CORS origins `http://localhost:3000` and `http://localhost:3333`, both allowing
  credentials

Build log:
- `NOTES.md`: this file
- `CLAUDE.md`: added the rule to append an entry here at the end of every phase

### What went wrong and how we fixed it

The build never broke. All the problems were in the setup steps.

- **Sanity login can't run from an AI agent's shell as-is.** `sanity login` asks
  which login provider to use in an interactive terminal. Fix: running
  `sanity login --provider google` skips that question. It opened the Google
  sign-in in my browser, I approved it, and the CLI picked up the token.
- **A new account has no organization.** Creating a project without prompts needs
  `--organization <id>`, but `sanity organizations list` said "No organizations
  found". Fix: `sanity organizations create --name "…"`, then passing that ID to
  `sanity init`.
- **Two tools wanted to make the first commit.** `create-next-app` makes its own
  git repo and commit by default. Fix: `--disable-git` on `create-next-app` and
  `--no-git` on `sanity init`, so one first commit holds both setups.
- **I couldn't check CORS credentials from the CLI.** `sanity cors list` shows only
  the origins, not whether credentials are allowed, and it has no `--json` flag.
  Fix: `sanity api projects/<id>/cors --global` returns the raw JSON, which showed
  `allowCredentials: true`.
- **`npm audit` reports 9 vulnerabilities (4 high).** They all come from packages
  Sanity's command-line tool depends on (`adm-zip`, `js-yaml`, `uuid`, …), not from
  the site's own code. npm's only "fix" is a major-version downgrade of `sanity` and
  `next-sanity`. Not fixed; left as is on purpose.

### Sanity notes for the write-up

- **`sanity init` knows about Next.js.** It detected the Next app and did the
  embedding itself: config files, the `/studio` route, env vars with the
  `NEXT_PUBLIC_` prefix, and the npm installs. It also added `localhost:3000` as a
  CORS origin with credentials, which my plan had listed as a manual step.
- **The Studio is just a React component in the app.** `<NextStudio config={config} />`
  sits in an ordinary Next.js route and is built as a static page. It ships to
  Vercel with the site, with no separate hosting.
- **The whole setup can run without prompts.** Every `sanity init` question has a
  flag (`--project-name`, `--dataset-default`, `--nextjs-embed-studio`,
  `--nextjs-append-env`, `--template clean`, …). The only step that needs a person
  is approving the login in the browser. Good for AI agents and CI.
- **The CLI can call the API directly.** `sanity api <endpoint>` makes logged-in
  HTTP requests, which is handy when a CLI command doesn't show a detail you need.
- **Live updates are included from the start.** `sanity/lib/live.ts` already sets up
  `defineLive` (the Live Content API), so Studio edits can show on the site without
  webhooks or redeploys.
- **The API is versioned by date.** `apiVersion` defaulted to the day I set it up
  (`2026-09-28`), which pins how the API behaves.
- **The dataset is public for reading.** Anyone can read published documents, but
  drafts and writes still need a token. That suits a public graveyard and lets
  submitted bugs wait as drafts until I approve them.
- **`init` installed `sanity@5` even though npm's newest is 6.x.** The CLI asked for
  that major version by name. Find out why before writing it up.
- *Not Sanity, but fun for a vibe-coding post:* Next 16's scaffold includes an
  `AGENTS.md` that starts with "This is NOT the Next.js you know" and tells AI agents
  to read the bundled docs before writing code.

---

## Phase 2: Sanity schema and seed script (2026-09-29)

### What I asked for

- Three schema types: `language` (name, hex colour), `causeOfDeath` (title,
  description), and `bug`. A bug has a status that goes suspected-dead → fix-merged
  → buried (or zombie), references to its language, its cause of death and its
  previous life, an epitaph of at most 140 characters, read-only dates and a
  resurrection counter.
- A description on every field, the fields grouped into "The Bug", "The Death" and
  "Afterlife", and a list preview with an emoji per status (💀 🩹 🪦 🧟).
- A seed script for 5 languages (with brand colours) and 6 causes of death, how to
  run it, and how to create a write token safely and keep it out of git.
- Then, all done by Claude: run the seed, and write a re-runnable script that
  creates 3 published test bugs with IDs starting `test-bug-`. Two are graves (a
  checkout null pointer in TypeScript, a scheduler timezone bug in Python) and one
  is a zombie that rose from the timezone bug. Check with GROQ that every reference
  resolves, update this entry, and commit Phases 1 and 2.

### What was built

- `sanity/schemaTypes/language.ts`: name and a hex colour checked with a regex
- `sanity/schemaTypes/causeOfDeath.ts`: title and description
- `sanity/schemaTypes/bug.ts`: the bug document, with 3 field groups, a status list
  with emoji, a "previous life" field that only shows for zombies, and the list preview
- `sanity/schemaTypes/index.ts`: registers the three types
- `scripts/seed.ts`: creates 5 languages and 6 causes of death in one transaction;
  safe to re-run
- `scripts/seed-test-bugs.ts`: creates the 3 test bugs; `-- --delete` removes them,
  and any Studio drafts of them, in one transaction
- `NOTES.md`: this entry

Now in the `production` dataset: 11 seeded documents and 3 published test bugs. The
zombie's fix date, burial date, killer and hours are left empty on purpose, because
it's still walking. They get filled in once it's fixed and buried again.

### What went wrong and how we fixed it

- **TypeScript rejected the seed script.** `tx.createIfNotExists(doc)` guessed its
  type from the first document (a language), so it complained that the causes of
  death were "missing the following properties … name, color". Fix: give the list
  one shared type, `Array<{_id: string; _type: string} & Record<string, unknown>>`.
- **Would `sanity exec` read `.env.local`?** The seed imports `sanity/env`, which
  throws if the env vars are missing. A throwaway read-only script showed that it
  does read them, finds project `rzjmw6lg`, and has no token unless you pass
  `--with-user-token`.
- **The seed ran without problems, and re-running is safe.** I ran it myself: all
  11 documents share the `_createdAt` 2026-09-28T19:08:42Z because they came from
  one transaction. Claude's second run printed "skipped (exists)" for all 11.
- **`path("test-bug-*")` matched nothing.** The first check query returned `[]` and
  a count of 0, even though looking up the zombie by its exact `_id` worked. GROQ's
  `path()` wildcards only match whole dot-separated segments (as in `drafts.**`), not
  the start of an ID. That meant `--delete` would have quietly deleted nothing. Fix:
  `string::startsWith(_id, "test-bug-")`. Then `--delete` was run for real (3
  deleted, and "nothing to delete" the second time), and the bugs were recreated.
- **Still open: the read-only fields.** `fixMergedAt`, `buriedAt` and
  `timesResurrected` can't be edited in the Studio, and nothing updates them when the
  status changes. For now only scripts can set them, which is how the test bugs got
  theirs. That needs automation in a later phase.

### Sanity notes for the write-up

- **The schema is TypeScript in the repo.** The Studio's forms are generated from it
  and it's versioned with git. `npx sanity schemas validate` checks it from the
  terminal: 0 errors, 0 warnings.
- **Field groups become tabs in the Studio**, and one field can sit in several of
  them. `status` shows under both "The Death" and "Afterlife".
- **Fields can appear and disappear.** With `hidden: ({document}) =>
  document?.status !== 'zombie'`, "Previous life" only shows once a bug is marked as
  a zombie, and it updates while you edit.
- **Reference pickers take a GROQ filter.** The "Previous life" picker uses
  `!(_id in [$id, $draftId])` so a bug can't be its own previous life. A draft is a
  separate document whose ID starts with `drafts.`, so both IDs have to be excluded.
- **Previews can read through references.** `select: {language: 'language.name'}`
  gets the name from the linked language document, so the list shows
  "🪦 Buried · TypeScript".
- **A dot in a document ID makes it private.** Sanity treats a dotted ID as a
  private path (that's how `drafts.` works), and a public dataset won't serve it
  without a token. So the seed uses IDs like `language-typescript`.
- **`sanity exec` runs a TypeScript script with your CLI login.** Add
  `--with-user-token` and there's no API token to create, no ts-node and no dotenv;
  it loads `.env.local` itself.
- **Validation lives in the schema:** a regex for the hex colour, `max(140)` for the
  epitaph, `min(0).integer()` for the counter. The Studio shows these errors inline
  as you type.
- **`readOnly` only affects the Studio; the API ignores it.** The test-bug script
  wrote `fixMergedAt`, `buriedAt` and `timesResurrected` through the API with no
  complaint.
- **A document without a `drafts.` prefix is published straight away.** Anyone can
  read it: a plain `curl` to the public API with no token returned all 3 test bugs
  with their references followed.
- **Looking up zombies from their grave takes one line of GROQ.**
  `*[_type == "bug" && previousLife._ref == ^._id]` run from a grave returns the
  zombies that rose from it, so the "disturbed grave" look needs no extra field.
- **References are checked when the whole transaction commits**, so the grave and its
  zombie can be created together. Sanity won't delete a document that another one
  still references, so `--delete` removes all the test bugs in one transaction.
- **`path()` wildcards match whole ID segments, not prefixes.** Use
  `string::startsWith` to find IDs by prefix.

---

## Phase 3: The graveyard homepage (2026-09-29)

### What I asked for

- A public homepage at `/` that looks like a dark, spooky graveyard: a night
  gradient, faint fog, and grass along the bottom. Each bug is a tombstone with a
  rounded top showing its name, birth and death dates, epitaph and a language colour
  badge. There are three looks: resting (buried), disturbed (the grave is empty
  because the bug rose) and zombie (cracked, with a green glow).
- The site pages in an `app/(site)` route group with their own layout, so `/studio`
  doesn't get the graveyard styling.
- GROQ queries in `sanity/lib/queries.ts` that return every bug with its language
  (name, colour), its cause of death, and whether its grave has been disturbed.
- `sanityFetch` with `<SanityLive />`, so edits in the Studio appear without a redeploy.
- Filters by language and by cause of death. One column on phones, 3–4 on desktop.
  A gothic display font through `next/font`. A reusable `Tombstone.tsx` that can be
  used inside the Studio later.
- Run the build and lint, add this entry, and commit.

### What was built

- `app/(site)/layout.tsx`: the site's own layout, with the fonts (Grenze Gotisch
  and Geist), the night gradient, moon, stars and fog, the header, the grass and
  `<SanityLive />`
- `app/(site)/page.tsx`: the graveyard. Reads `?language=` and `?cause=`, fetches
  the bugs and filter options, and picks each stone's look (moved from `app/page.tsx`)
- `app/(site)/globals.css`: Tailwind plus three theme colours (night, bone, moss),
  loaded only by the site (moved from `app/globals.css`)
- `app/layout.tsx`: cut down to a bare `<html>`/`<body>`, shared with the Studio
- `app/studio/layout.tsx`: adds `<SanityLive />` to the Studio (see below)
- `components/Tombstone.tsx` and `Tombstone.module.css`: the reusable tombstone;
  the look is set by a `data-look` attribute, and the CSS module keeps it working
  inside the Studio
- `components/GraveyardFilters.tsx`: the language and cause-of-death chips, as plain links
- `components/Scenery.tsx` and `Scenery.module.css`: moon, stars, drifting fog and
  generated grass
- `sanity/lib/queries.ts`: `GRAVEYARD_QUERY` and `GRAVEYARD_FILTERS_QUERY`
- `sanity/lib/actions.ts`: the `expireSanityTags` server action used by `<SanityLive />`
- `sanity/types.ts` and `sanity/extract.json`: generated by Sanity TypeGen
- `sanity.cli.ts` and `package.json`: TypeGen settings and an `npm run typegen` script
- Deleted `public/*.svg`, the starter logos

### What went wrong and how we fixed it

- **Studio edits never reached the site in production.** I tested with `next start`
  and a temporary published bug: the homepage kept saying "3 graves" after a fourth
  was published. `sanityFetch` caches results forever (`revalidate: false`), and only
  `<SanityLive />` in an open browser tab clears that cache. The Studio page didn't
  have one, so publishing from `/studio` with no site tab open changed nothing. Fix:
  add `<SanityLive />` to `app/studio/layout.tsx` too. Retest: with only the Studio
  open, the homepage showed the new bug 1.8s after publishing.
- **An open site tab stayed one change behind.** The server logged `<SanityLive />
  revalidated tags … with cache profile "max"`, but the open tab still showed 4 graves
  after 25s. In production, next-sanity calls `revalidateTag(tag, 'max')`, which
  serves the old page once more while it rebuilds, so the tab's refresh got stale
  content. Fix: a custom `action` that calls `updateTag`, which expires the cache
  immediately (Next 16 only allows it in server actions). It checks the incoming
  tags with next-sanity's `parseTags` first. Retest: the open tab updated in 3.0s
  without reloading.
- **`npm run dev` hides both problems,** because in dev mode next-sanity uses
  `updateTag`. Only a production build (`next start`) shows them.
- **Still open: edits made while nothing is open.** A change made while neither the
  site nor the Studio is open, such as from a seed script, still waits for the next
  change someone sees live. The fix is a Sanity webhook that calls a revalidation
  route, once the site is on Vercel.
- **Resting stones had `class="… undefined"`.** `styles[look]` looked for a `.resting`
  class the CSS module never defined. Fix: a `data-look` attribute instead.
- **A crack ran through the word "Zombie".** Fix: the cracks moved to the edges of the
  stone, and the text is drawn above them.
- **The moon covered the tagline on phones.** Fix: a smaller moon in the corner on
  screens narrower than 640px.
- **The mobile screenshot looked cut off, but nothing was wrong.** Chrome's
  `--window-size=390` can't go below Chrome's minimum window width (about 500px), so
  it drew a 500px page and cropped it. Real phone emulation through the DevTools
  protocol measured `scrollWidth` 390 against `innerWidth` 390: no overflow.
- **Stale route types.** After `app/page.tsx` moved, `tsc` failed with
  `Cannot find module '../../app/page.js'` from `.next/types/validator.ts`.
  `npx next typegen` regenerates them.

### Sanity notes for the write-up

- **TypeGen types the queries.** `npm run typegen` runs `sanity schemas extract` and
  then `sanity typegen generate`. It finds every `defineQuery` and writes
  `sanity/types.ts`, so `sanityFetch({query: GRAVEYARD_QUERY})` returns typed data with
  no hand-written types. `status` came out as
  `"buried" | "fix-merged" | "suspected-dead" | "zombie"` straight from the schema's
  option list, and `enforceRequiredFields` makes required fields non-nullable.
- **A disturbed grave takes one GROQ subquery:**
  `"disturbed": count(*[_type == "bug" && previousLife._ref == ^._id]) > 0`.
- **Optional filters are GROQ parameters:**
  `(!defined($language) || language->name == $language)`, with `null` passed to skip
  one. Every parameter must be passed, because leaving one out is a query error.
- **How Live works.** `sanityFetch` makes two requests. The first, uncached, gets the
  query's *sync tags*; the second is cached forever under those tags.
  `<SanityLive />` keeps a connection open to Sanity's Live Content API, and when
  content changes it receives the affected tags and calls a server action to clear
  them. So the cache only refreshes if a browser is connected at the moment of the
  change, which is why the Studio has one too.
- **Live needs CORS.** The browser connects to Sanity directly, so every origin the
  site runs on needs a CORS entry. The Vercel URL will need one. The end-to-end test
  ran on port 3333 because `sanity init` had already allowed it.
- **next-sanity 13 has two modes:** one with Next's Cache Components (`'use cache'`,
  `cacheLife`) and one without. `sanity init` set up the simpler one without.
- **Sanity `date` fields are plain strings** like `"2026-03-29"`, with no timezone.
  Formatting them in the visitor's timezone would make every bug die a day early for
  anyone west of Greenwich, which would put a timezone bug on the timezone bug's own
  tombstone. They're formatted with `timeZone: 'UTC'`.
- **One component for the site and the Studio.** The Studio is also React, so
  `Tombstone.tsx` can render inside a Studio preview later. It uses a CSS module
  instead of Tailwind because the Studio doesn't load the site's CSS.
- *Not Sanity:* Next.js doesn't unload global CSS on client-side navigation, so the
  site must never use `<Link>` to go to `/studio`; a plain `<a>` does a full page load.

---

## Phase 4: The single grave page (2026-09-29)

### What I asked for

- A page for each grave at `/grave/[slug]`, inside the `(site)` group. A GROQ query by
  slug that returns every bug field, the language, the cause of death, the previous
  life chain up to 3 levels deep (name, slug, epitaph, dates, status), and every zombie
  that rose from this bug.
- A big tombstone at the top (the same component), then the details: cause of death,
  hours to kill, severity, killed by, and the born, fix merged and buried dates.
- A "Past lives" section showing the chain of previous graves as small tombstones,
  oldest first, each linking to its own page, with "…and older lives" when the chain
  goes back more than 3 levels. A "Risen from this grave" section when zombies came
  from it.
- Every tombstone on the homepage links to its grave page.
- `generateStaticParams`, and `generateMetadata` with the title "RIP <name>" and the
  epitaph as the description.
- A custom not-found page for unknown slugs: "This grave is empty."
- Use `sanityFetch` so live updates keep working. Build, lint and type-check, then add
  this entry and commit.

### What was built

- `app/(site)/grave/[slug]/page.tsx`: the grave page. It has the big stone (the page's
  `<h1>`), a "Death certificate" list of details, "Past lives" and "Risen from this
  grave". `generateStaticParams` prerenders every grave, and `generateMetadata` sets
  the title and description. React's `cache()` makes the metadata and the page share
  one fetch.
- `app/(site)/grave/[slug]/not-found.tsx`: "This grave is empty." with a link back
- `components/Tombstone.tsx` and `.module.css`: three new props. `size` is
  mini/regular/large. `href` makes the whole stone a link, which lifts on hover and
  gets a green focus ring. `headingLevel` lets the grave page use the name as its
  `<h1>`. The cracks now sit behind the text using `z-index: -1`, and the earth mound
  is limited to the screen width.
- `lib/graves.ts`: shared helpers `lookFor`, `diedAt`, `statusLabel` and `formatDate`
  (previously spread across the homepage and the Tombstone)
- `sanity/lib/statuses.ts`: the status list, moved out of the schema file (see below)
- `sanity/lib/queries.ts`: `GRAVE_QUERY` and `GRAVE_SLUGS_QUERY`; `sanity/types.ts`
  regenerated
- `app/(site)/page.tsx`: every tombstone links to `/grave/<slug>`; a screen-reader-only
  `<h1>`
- `app/(site)/layout.tsx`: the site title is no longer an `<h1>`, because each page now
  has its own

To test past lives beyond 3 levels, a temporary 5-grave zombie chain
(`test-bug-chain-1` to `-5`) was published, checked and deleted again.

### What went wrong and how we fixed it

- **The grave page was 16px too wide on phones.** Phone emulation measured the page as
  406px wide on a 390px screen. The big stone fills the column (358px), and its earth
  mound is 118% of that (422px). Fix: the mound's `max-width` is
  `calc(100vw - 1rem)`. It then measured 390 against 390.
- **The 404 page's title.** `generateMetadata` returns "This grave is empty" for an
  unknown slug, but the HTML `<head>` still says "Bug Graveyard". On a 404, Next.js
  sends the page's metadata later in the stream rather than in the head. A browser does
  end up with the right title (`document.title` in headless Chrome was "This grave is
  empty"), and the page is marked `noindex` anyway, so this was left alone.
- **The past-lives arrows didn't line up** with the stones and the "this grave" label.
  Fix: the whole row is centred together.
- **The homepage was stale even after a rebuild.** The test chain was published with no
  browser open, and afterwards the homepage showed 3 graves instead of 8, even after
  `next build`. Next.js keeps its fetch cache in `.next/cache`, and that survives
  rebuilds. This is the gap from Phase 3 again. Publishing with `/studio` open updated
  it in 1.8s.
- **A deleted grave came back after a server restart.** `/grave/test-bug-live-new`
  returned 200 after its bug had been deleted and the server restarted. `next start`
  saves pages rendered on demand as files (`.next/server/app/grave/*.html`), but the
  "out of date" markers from `<SanityLive />` are kept in memory, so after a restart
  the old file was served again. This only affects `next start` on a laptop: the next
  `next build` replaced those files, leaving exactly the 3 real graves.
- **Test script problems, not app bugs:** `sanity documents create` rejected
  newline-delimited JSON and needed a JSON array instead. Node's `fetch` sometimes
  failed with `ECONNRESET` after long pauses, because it reused a connection the server
  had already closed, so the script now retries.
- **Still open:** content changed while neither the site nor the Studio is open still
  needs a Sanity webhook to reach the cache (planned for the Vercel deploy).

### Sanity notes for the write-up

- **One GROQ query can follow a chain of references:**
  `previousLife->{…, previousLife->{…, previousLife->{…}}}`. GROQ has no recursion, so
  the depth is fixed in the query. The deepest level asks
  `"hasOlderLives": defined(previousLife)` to know whether to show "…and older lives".
- **TypeGen understands queries built from pieces.** The fields for one past life are a
  plain string constant, inserted three times into `GRAVE_QUERY` with `${PAST_LIFE}`.
  TypeGen still resolved it and generated full types for all three levels.
- **Looking up zombies from their grave:**
  `"risen": *[_type == "bug" && previousLife._ref == ^._id]` lists the zombies that rose
  from a grave, each with its own "disturbed" flag.
- **Live updates reach prerendered pages.** Grave pages are built as static HTML with
  `generateStaticParams`, yet with `/studio` open an edit showed up in 2.0s. A slug that
  had been a 404 became a page in 2.6s, and a deleted grave became a 404 again. This
  works because `sanityFetch` tags each fetch with Sanity's sync tags, and clearing a
  tag also clears the pages built from it.
- **Keep `sanity` out of the site's code.** Schema files import from `sanity`, the whole
  Studio package, so anything the site shares with the schema (like the status list)
  lives in its own plain module.
- **Throwaway test data from the CLI:** `sanity documents create file.json --replace`
  takes a JSON array and creates or replaces every document in it;
  `sanity documents get <id>` prints one document; `sanity documents delete <ids…>`
  removes them.
