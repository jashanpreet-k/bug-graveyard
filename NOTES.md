# Bug Graveyard — build log

Build log for my DEV Sanity Challenge entry (Path 2: vibe-code something strange).
Bug Graveyard is a site where developers bury bugs they fixed. Each bug gets a
tombstone, and if it comes back it rises as a zombie linked to its old grave.

Stack: Next.js 16 (App Router, TypeScript, Tailwind v4) + Sanity, with the Studio
embedded at `/studio`. Deploying on Vercel.

A new entry is added at the end of every phase.

**About the graves:** the 18 bugs in `content/graves.ts` are classic, well-known
developer bugs (off-by-one, `0.1 + 0.2`, the div that won't centre, a cron job at a
daylight-saving switch…), written in the graveyard's voice with made-up but realistic
dates. They are not claimed as my personal history. A search of my other repos on this
Mac found no bug-fix commits to use instead (see Phase 9).

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

---

## First deploy (2026-09-29)

### What I asked for

- Create a public GitHub repo "bug-graveyard" and push `main`. When `gh` turned out
  not to be installed, I asked Claude to do it anyway.
- Deploy to Vercel with the CLI (I approved the login in the browser) and set the
  environment variables.
- Add the production URL as a Sanity CORS origin with credentials allowed.
- Set up a Sanity webhook so content changed while nobody has the site or Studio open
  still refreshes the live site, with the secret kept out of git.
- Check the live site: homepage, a grave page, the 404, `/studio` sign-in, and that a
  publish shows up. Then add this entry and commit.

### What was built

- **Live site:** https://bug-graveyard.vercel.app
- **Repo:** https://github.com/jashanpreet-k/bug-graveyard (public, website set to the
  live URL)
- `app/api/revalidate/route.ts`: the webhook endpoint. It checks the signature against
  `SANITY_REVALIDATE_SECRET` with next-sanity's `parseBody`, then calls
  `revalidateTag('sanity-content', {expire: 0})`.
- `sanity/lib/live.ts`: `sanityFetch` now adds the `sanity-content` tag to every fetch,
  so pages added later are covered automatically.
- `vercel.json`: sets Vercel's framework preset to Next.js.
- `.vercelignore`: keeps `.env*` out of anything `vercel deploy` uploads.
- `.env.local` (not committed): now also holds `SANITY_REVALIDATE_SECRET`, plus a
  `VERCEL_OIDC_TOKEN` that the Vercel CLI added.
- **Vercel project** `bug-graveyard` (team "Jashanpreet kaur", Hobby plan) with these
  environment variables:
  - `NEXT_PUBLIC_SANITY_PROJECT_ID` = `rzjmw6lg` (all environments)
  - `NEXT_PUBLIC_SANITY_DATASET` = `production` (all environments)
  - `SANITY_REVALIDATE_SECRET` (Production only, stored as a sensitive secret)
- **Sanity:** CORS origin `https://bug-graveyard.vercel.app` with credentials, and a
  webhook "Refresh the live site". It fires when a `bug`, `language` or
  `causeOfDeath` in `production` is created, updated or deleted, and sends a signed
  `POST` to `/api/revalidate`.

### What went wrong and how we fixed it

- **No `gh` CLI, and my SSH key isn't registered with GitHub.** But macOS's keychain
  already held a GitHub login for HTTPS (scopes `repo`, `workflow`). Claude used it,
  without ever printing it, to create the repo through GitHub's API
  (`POST /user/repos`) and to push over HTTPS.
- **Vercel couldn't connect the GitHub repo:** "You need to add a Login Connection to
  your GitHub account first." So the site was deployed with `vercel deploy --prod`
  instead. **Still open:** pushes to GitHub don't deploy automatically yet.
- **The first deploy failed:** `No Output Directory named "dist" found`. The project
  had been created with Framework Preset "Other". Fix: `vercel.json` with
  `"framework": "nextjs"`.
- **`vercel link` changed `.env.local` without asking**, adding `VERCEL_OIDC_TOKEN`.
  Harmless, and the file is gitignored.
- **`npx sanity api …` said "is not a sanity command".** Inside the project, `npx sanity`
  runs the project's own Sanity 5 CLI, which has no `api` command, while
  `npx sanity@latest api` works. This also explains the failed `sanity api` call in
  Phase 3.
- **`sanity hooks create` only opens a web page,** so the webhook was created through
  Sanity's API (`POST hooks/projects/<id>`). The first try failed with `"name" is
  required` because the body wasn't sent as JSON. Adding
  `-H "Content-Type: application/json"` fixed it.
- **The first batch of `vercel env add` calls quietly did nothing,** because of how
  they were wrapped in a shell function. They were re-run one at a time, and
  `vercel env ls` confirmed exactly one of each.

**Verified on the live URL (all passed):**
- The homepage has 3 graves.
- A grave page is served prerendered, titled "RIP Timezone bug in scheduler".
- The zombie page shows its past life.
- `/grave/no-such-bug` returns 404 "This grave is empty.".
- `/studio` shows "Choose login provider" with no CORS errors.
- An unsigned webhook call gets 401.
- **With nothing open,** a published bug appeared on the live homepage 5.9s later,
  refreshed by the webhook.
- **With a tab open,** `<SanityLive />` connected from the live origin, and the tab
  dropped back to 3 graves 3.0s after the delete, without reloading.

The publish in that test came from the CLI, which writes to Sanity exactly like the
Studio does. I still need to try a real publish from the live Studio after signing in.

### Sanity notes for the write-up

- **Webhooks are signed.** Sanity signs each request with the secret (HMAC-SHA256, in
  the `sanity-webhook-signature` header). next-sanity's `parseBody` checks it, and then
  waits until the change is readable from Sanity's API, so a page rebuilt right away
  doesn't fetch the old content. Each delivery took about 3.6s end to end.
- **A webhook is a GROQ filter plus a projection.** The filter
  `_type in ["bug", "language", "causeOfDeath"]` decides when it fires, and the
  projection `{_id, _type}` is the whole payload.
- **Two refresh paths, each measured.** `<SanityLive />` updates open tabs in about 3s,
  without a reload. The webhook covers the case where nobody is connected, in about 6s.
- **Webhook deliveries are logged.** `hooks/projects/<id>/<hookId>/attempts` shows
  every call, with its HTTP status and response body. Both test deliveries got 200.
- **CORS again.** The Studio and `<SanityLive />` on the Vercel domain only work
  because that origin is allowed, with credentials for the Studio's sign-in.
- **Which Sanity CLI runs matters.** `npx sanity` is the project's CLI (v5), and
  `npx sanity@latest` is the newest (v8), which adds `api`, `organizations` and more.

---

## Phase 5: Lifecycle document actions (2026-09-29)

### What I asked for

- Three custom Studio actions on bugs, registered through `document.actions` in
  `sanity.config.ts`, keeping Sanity's own Publish, Delete and so on:
  - **🩹 Mark fix merged**, enabled for suspected-dead bugs: status becomes fix-merged,
    `fixMergedAt` becomes today, and the change is published.
  - **🪦 Declare buried**, enabled once a fix has held for 7 days; otherwise the label
    says how long is left ("Can bury in 4 days"). Status becomes buried, `buriedAt`
    becomes today, and the change is published.
  - **🧟 Report resurrection**, for fix-merged or buried bugs. After a confirm dialog
    ("Are you sure? This bug will rise from its grave.") it creates a new zombie bug:
    `previousLife` points at this bug, `timesResurrected` goes up by one, the name
    becomes "<name> (Zombie #n)", with the same language and cause, a unique slug and
    today as `bornAt`. Then it opens the zombie so I can write its epitaph.
- UTC dates. Drafts handled properly: act on the published document and leave no
  stray drafts. Zombies go through the same lifecycle, so zombies of zombies work. The
  7-day rule in a single constant.
- Test it end to end with temporary bugs, check that the site updates live, run build,
  lint and type-check, add this entry, commit and deploy. Explain document actions for
  the write-up.

### What was built

- `sanity/actions/lifecycle.tsx`: the three actions
- `sanity/lib/lifecycle.ts`: `BURIAL_WAIT_DAYS = 7` and small helpers: `todayUTC`,
  `daysBetween`, `daysUntilBurial`, `zombieName`, `slugify`. It doesn't import
  `sanity`, so the site could use it too.
- `sanity.config.ts`: `document.actions` adds the three actions right after Publish,
  for bugs only

**Decisions that go beyond the brief:**
- **"Mark fix merged" also works on a walking zombie.** Without that, a zombie could
  never start its own lifecycle.
- **The actions write straight to the published document,** in one change guarded by
  its revision (`ifRevisionId`). There is no draft step, so nothing gets left behind.
  They are disabled while the bug has unpublished edits ("Publish or discard your
  changes first"), because that draft would later overwrite the new status.
- **The zombie is created already published,** so it appears on the site straight
  away, then opens in the Studio. Writing its epitaph is then an ordinary edit and
  publish.
- **A grave only rises once.** "Report resurrection" is disabled on a grave a zombie
  already came from ("It already rose as …"), and this is checked again at the moment
  of confirming. The next resurrection belongs on the zombie's own grave, which keeps
  every chain a single line.
- **The zombie copies the language and cause of death, but not the severity.** Its
  slug gets `-2`, `-3` and so on if the name is already taken.

**End-to-end test:** a production build, with headless Chrome clicking the real Studio
buttons. Five temporary bugs covered every situation, and **all 34 checks passed**:
- **Enabled/disabled states** in each status, including "🪦 Can bury in 7 days" right
  after a fix and "Can bury in 4 days" for a fix 3 days old.
- **Mark fix merged and Declare buried** wrote today's UTC date, and no drafts were
  left behind.
- **Cancel in the confirm dialog** created nothing.
- **Unpublished edits** disabled all three actions.
- **Resurrecting a buried bug** created "(Zombie #1)" with the correct fields and a
  unique slug, and opened it in the Studio.
- **A grave tab that was already open** showed "Risen from this grave" 1.4s later,
  without reloading.
- **The old grave could not rise twice.**
- **A zombie of a zombie** was named "(Zombie #2)", not "(Zombie #1) (Zombie #2)", and
  its page lists both past lives, oldest first.

Every temporary document was deleted afterwards. After the deploy, a read-only check of
the live Studio showed the right menu for each of the three real bugs.

### What went wrong and how we fixed it

- **"Report resurrection" stayed disabled right after another action.** My first
  version disabled it while it was still checking whether the grave had already
  risen. Sanity re-creates the action component whenever the document changes, so
  each change restarted that check, and the button was disabled for a second or two.
  The test clicked during that window, and the confirm dialog never opened. Fix: don't
  block while checking. The button is only disabled once a zombie is known to exist,
  and the final check happens when you confirm.
- **Test script problem, not an app bug:** headless Chrome slows down tabs in the
  background, so the Studio stalled after the test opened a second tab.
  `Page.bringToFront` fixed it.
- **Signing the headless Studio in:** the Studio keeps its token in `localStorage`
  under `__studio_auth_token_<projectId>`. The test put my CLI login token there
  before the page loaded, in a throwaway Chrome profile, and never printed it.
- **Still open: backfilling old bugs.** `fixMergedAt`, `buriedAt` and
  `timesResurrected` are read-only in the Studio, and the actions always use today. So
  a bug fixed months ago can't be given its real dates by hand; only a script or the
  API can do that.

### Sanity notes for the write-up

**How document actions work, in plain words:**
- The buttons at the bottom of a document in Sanity Studio (Publish, Duplicate, Delete,
  and so on) are all *document actions*, and you can add your own.
- **An action is a small React component.** Sanity renders it for the open document
  and gives it the document's current state: the published version, any unpublished
  draft, its ID and type. It returns a description of a button: a label, whether it's
  disabled, a tooltip, what happens on click, and optionally a dialog such as a
  confirm box.
- **It updates itself.** Because it's a component, Sanity re-renders it whenever the
  document changes. That's how "Can bury in 4 days" and the enabled/disabled states
  stay correct without any refresh logic.
- **It can use the Studio's hooks:** `useClient` to write data, `useRouter` to open
  another document, and `useDocumentStore().listenQuery` for a live GROQ subscription.
- **It runs as the signed-in person.** The action runs in the browser with that
  person's Sanity permissions, so there's no API token in the code.
- **You register actions in `sanity.config.ts`.** `document.actions` is a function
  that receives Sanity's default list plus some context (which type of document, and
  so on) and returns the list to show. The first one becomes the big button; the rest
  go in the "…" menu. Here the lifecycle actions go right after Publish, and only for
  bugs.

**Other things worth mentioning:**
- **Actions can own read-only fields.** Marking fields `readOnly` stops people editing
  them by hand while code can still set them. That turns the dates and the
  resurrection counter into a record of what actually happened.
- **Drafts are separate documents.** Editing creates a `drafts.<id>` copy, and
  publishing copies it over the real one. These actions skip that step and change the
  published document directly, with `ifRevisionId` (the write fails if someone else
  changed the bug first).
- **The built-in dialogs are declarative:** `dialog: {type: 'confirm', message,
  onConfirm, onCancel}`, and `navigateIntent('edit', {id, type})` opens a document.
- **The whole lifecycle runs on the same live pipeline as the site.** Clicking an
  action updates the homepage and grave pages within about a second, through the
  Studio's `<SanityLive />` and the webhook.

---

## Phase 6: Live Tombstone preview in the Studio (2026-09-29)

### What I asked for

- Use the structure tool's `defaultDocumentNode` to give bug documents a second tab:
  "Editor" (the normal form) and "🪦 Tombstone".
- The Tombstone tab shows the site's own Tombstone component (resting, disturbed or
  zombie), large, on a small night sky so it looks like the site.
- It updates live as I type, using the draft if there is one and the published bug
  otherwise, including the epitaph, name, dates and status. The language and cause of
  death are resolved so the badges show.
- A counter under the stone for the 140-character epitaph limit, and "Rose from
  <previous life>" for zombies, as on the site.
- A better Studio sidebar: All graves, Zombies, Suspected dead, Fix merged and Buried,
  then Languages and Causes of death, with icons for the document types.
- Test it, run build, lint and type-check, add this entry, commit and deploy.

### What was built

- `sanity/components/TombstoneView.tsx` and `.module.css`: the Tombstone tab. It
  renders the site's `Tombstone` from `document.displayed`, which is the draft while
  you edit and the published bug otherwise. It adds a night-sky backdrop, the site's
  grass, and the epitaph counter.
- `sanity/structure.ts`: the new sidebar, plus `defaultDocumentNode` giving bugs the
  Editor and 🪦 Tombstone tabs
- `sanity.config.ts`: passes `defaultDocumentNode` to `structureTool`
- `sanity/schemaTypes/*.ts`: icons for the document types (bug 🐛, language ⌨️,
  cause of death ☠️), and `EPITAPH_MAX_LENGTH = 140`, shared by the validation rule and
  the counter
- `app/fonts.ts` and `app/layout.tsx`: the fonts are defined once and their CSS
  variables sit on `<html>`, so the Studio can use the site's gothic font
- `app/(site)/layout.tsx`: now uses those shared fonts

**Decisions:**
- **The sidebar's emoji sit in each item's icon slot,** so they line up with the
  Languages and Causes of death icons.
- **"Buried" got ⚰️,** since 🪦 is taken by "All graves".
- **Only "All graves" and "Suspected dead" offer "create".** A new bug always starts as
  suspected dead, and the other statuses are only reached through the lifecycle
  actions, so a bug created from "Zombies" would vanish from that list straight away.

**Tested in the real Studio, all 22 checks passed:**
- **Sidebar:** the order and icons are right, and the Zombies and Buried lists show
  only those statuses.
- **The three looks, with references resolved:** the language badge shows in its own
  colour, and the cause of death and "Rose from “…”" appear. The Studio uses the site's
  gothic font.
- **Live typing, with the form and preview side by side:** the epitaph, counter, name
  and status all update the stone within a few milliseconds of each keystroke or click.
  Typing 150 characters shows "Epitaph: 150 / 140 · 10 too long", and switching the
  status to Zombie makes it glow.

The test bugs and the draft the typing created were deleted afterwards. A read-only
check of the live Studio showed the right tab for all three real bugs.

### What went wrong and how we fixed it

- **The badges and "Rose from" didn't show up in time.** My first version resolved the
  references with one `listenQuery` subscription. Once the draft loaded, the references
  changed and the subscription restarted, and a restarted `listenQuery` takes a few
  seconds to answer. Fix: resolve each reference through the Studio's preview store
  (`useDocumentPreviewStore().observePaths`), the same cached source the Studio uses
  for its own reference previews. After that the badges appeared within about 100ms.
  `listenQuery` is kept only for "has a zombie risen from this grave", which depends on
  the bug's own ID and so starts once.
- **Fonts:** the site's gothic font only existed inside the site layout, so the Studio
  preview would have fallen back to Georgia. Putting the font variables on the root
  `<html>` fixed that without changing the Studio's own fonts.
- **Test script problems, not app bugs:** a list pane is `document-list-pane`, not a
  second `pane-content`. The status radio is easiest to click through its label.
  `innerText` returns "RISEN", because the kicker is uppercased with CSS.

### Sanity notes for the write-up

- **The Studio can show any React view of a document.** `defaultDocumentNode` in
  `structureTool` decides which tabs ("views") a document gets.
  `S.view.form()` is the normal editor, and `S.view.component(MyComponent)` is anything
  you like.
- **A custom view gets the live document.** Its `document` prop holds `draft`,
  `published` and `displayed`. `displayed` changes on every keystroke, so a preview is
  just a React component rendering that prop.
- **Your site's components can run inside the Studio.** The Studio is embedded in the
  Next.js app, so the preview reuses the exact `Tombstone` component, CSS module and
  fonts the site uses. There is no second copy to keep in sync. The Sanity CLI still
  loads the config fine (schema validation shows 0 errors) even though it now imports
  site code.
- **The preview store for references:** `observePaths({_ref}, ['name', 'color'])` gives
  a live, cached view of another document's fields. Recolour a language and the badge
  in an open preview changes.
- **Split view:** the Studio can show the form and the preview side by side, and it's
  just a URL (`bug;<id>|,view=tombstone`), which is handy for screenshots.
- **The Structure Builder turns GROQ filters into sidebar lists:**
  `S.documentList().filter('_type == "bug" && status == $status')`, with
  `.initialValueTemplates([])` to hide "create" where it makes no sense.

---

## Phase 7: Most Haunted leaderboard and a content importer (2026-09-29)

### What I asked for

- **A) "Most Haunted" at `/leaderboard`,** in the same spooky style: the deadliest bugs
  (top 5 by hours to kill), the most haunted languages (zombies per language), the
  most common causes of death (bugs per cause), and the most resurrected bug chain.
  Built with GROQ aggregations and `sanityFetch` so it updates live, with Graveyard /
  Most Haunted links in the header, and working on phones.
- **B) An importer for my real bugs with their historical dates.** I write bugs as a
  simple list in `content/graves.ts`, with an optional `risesFrom` for zombie chains.
  `scripts/import-graves.ts` turns that into published documents with fixed IDs,
  matches languages and causes by name, links `previousLife`, and counts
  `timesResurrected` along the chain. It's safe to re-run and updates existing
  documents. Two example entries only (no real content), plus a `--delete-test` flag
  that removes every "test-bug-" document.
- Build, lint and type-check, add this entry, commit and deploy.

### What was built

**A) Leaderboard**
- `app/(site)/leaderboard/page.tsx`: four cards (two columns on desktop, stacked on
  phones), with an empty-state line for each
- `sanity/lib/queries.ts`: `LEADERBOARD_QUERY`, one GROQ query with four
  aggregations: `order()` plus `[0...5]` for the deadliest, `count()` subqueries with
  a filter afterwards (`[zombies > 0]`) for the languages and causes, and the top
  `timesResurrected` with its chain three lives back
- `components/RankedBars.tsx`: ranked rows with thin bars; each row links to the grave,
  or to the homepage filtered by that language or cause
- `components/LifeChain.tsx`: the row of small linked tombstones, now shared by the
  grave page and the leaderboard. `lib/graves.ts` gained `pastLivesOf` to go with it.
- `components/SiteNav.tsx`: the Graveyard / Most Haunted links, highlighting the current
  page (grave pages count as Graveyard)
- `app/(site)/globals.css`: colour tokens for the cards (`crypt`) and bars (`zombie`,
  `ghost`)

**Chart decisions:** the dataviz guidance was followed. Each card is a single series,
so the heading names it and there's no legend. Every value is printed at its bar's
tip in text colour, and nothing is only visible on hover. The bars are thin and
rounded at the data end. The aqua and violet were picked from the reference palette's
dark-mode steps; my first choices failed the validator (too light, and the bone
colour read as grey).

**"Haunted" means every bug that came back:** anything with a previous life counts,
not only zombies still walking. A zombie that gets fixed and buried still haunted its
language.

**B) Importer**
- `content/graves.ts`: the list I edit, with two examples (a buried bug and the zombie
  that rose from it)
- `content/types.ts`: the entry format, with every field explained
- `scripts/lib/plan-graves.ts`: checks the list and builds the documents. It reads and
  writes nothing, so it can be tested on its own.
- `scripts/import-graves.ts`: the command itself, with `--dry-run` (check only) and
  `--delete-test`

**How the importer behaves:**
- Each entry becomes `grave-<key>`, with the key as the slug, written with
  `createOrReplace`. So the file wins over Studio edits to imported bugs.
- Nothing is written if any entry has a problem, and every problem is listed with its
  entry's key.
- It checks the key, name, status, severity, known language and cause (listing the
  valid names), real dates in order, the 140-character epitaph, hours ≥ 0, and slugs
  another bug already uses.
- It checks chains: `risesFrom` must exist, a zombie needs one, it can't point at
  itself or loop, it must point at a fix-merged or buried bug, and a grave rises only
  once. Those are the same rules as the Studio actions.
- It warns about unpublished Studio edits on imported bugs, and lists `grave-*` bugs
  no longer in the file without deleting them.
- `--delete-test` refuses, and names the documents, if a non-test document still
  points at a test bug. Sanity wouldn't allow that delete anyway.

**Tested:**
- The planner, **32 checks passed**: the examples, a three-life chain (0, 1, 2
  resurrections), case-insensitive matching, about 20 kinds of mistake, and the
  perspective behaviour below.
- Against production and the live site, **18 checks passed**:
  - importing the examples, with the live homepage, zombie page and leaderboard all
    updated by the webhook within 1–2 seconds;
  - a re-run said "update" twice, with no duplicates;
  - `--delete-test` refused while a temporary blocker pointed at a test bug;
  - `--delete-test` ran for real from a backup, and the live homepage showed just the 2
    imported graves;
  - the 3 test bugs were restored field for field, and the examples were removed again.
- The leaderboard renders correctly at desktop and at 390px wide, with no horizontal
  scrolling.

### What went wrong and how we fixed it

- **Queries hide drafts by default.** With this API version (2026-09-28), a query that
  doesn't name a perspective gets `published`, which leaves drafts out. A check
  confirmed it: a draft counted 0 by default and 1 with `perspective: 'raw'`. The
  importer asks for `raw` wherever drafts matter. `seed-test-bugs --delete` had the same
  hidden bug: it would never have found `drafts.test-bug-*`. Fixed.
- **`sanity exec` doesn't allow top-level `await`,** because it compiles scripts to
  CommonJS. The temporary test failed with `Top-level await is currently not supported
  with the "cjs" output format`. The real scripts already use a `main()` function.
- **My date check could crash:** `new Date('2026-02-30…').toISOString()` throws
  instead of returning false. It now checks that the date is real first.
- **One deploy failed at the last step:** Vercel built the site, then failed with
  `fetch failed` while uploading, and my filtered output hid the error. A retry worked.
  After a deploy, check that the live URL actually has the new page.

### Sanity notes for the write-up

- **GROQ does the leaderboard in one request:** `order(hoursToKill desc)[0...5]`, a
  `count(*[… && language._ref == ^._id])` subquery per language, and a filter applied
  after the projection (`{…, "zombies": count(…)}[zombies > 0]`). The `^` refers to the
  document one level up, which is how each language counts its own bugs.
- **One query feeds several views.** The same query result drives the leaderboard
  cards, the ranked bars and the resurrection chain, and `sanityFetch` keeps it all
  live. Importing two bugs updated the live leaderboard in 1.6s.
- **Content as code is optional.** Editors use the Studio, while a TypeScript file plus
  a script import historical data in bulk. Fixed IDs (`grave-<key>`) and
  `createOrReplace` make re-running safe, and a transaction writes everything or
  nothing.
- **Sanity checks references for you.** Deleting a bug that another document still
  references fails, so `--delete-test` looks first with `references($ids)` and says
  exactly what's in the way.
- **Perspectives matter in scripts.** With this API version, the default is
  `published`. Anything that needs drafts must ask for `raw` (or `drafts`), or it
  silently misses them.

---

## Phase 8: Real content (2026-09-29)

### What I asked for

- Seed six more causes of death (CSS, Cache, Dependency hell, Floating point,
  Encoding, Merge conflict) and a CSS language (#663399), and run the seed.
- Replace the two examples in `content/graves.ts` with my real graves: 14 bugs, a
  three-life timezone zombie chain, and a stale-cache zombie. My epitaphs word for
  word; realistic dates across 2024–2026 (born < fixed < buried, burial at least 7
  days after the fix); 1–40 hours to kill; sensible severities; killed by
  "Jashanpreet".
- Dry run, import, then `--delete-test` to remove the test bugs.
- Check the live site: the looks on the homepage, the chain's past lives, and that the
  leaderboard makes sense. Then this entry, commit and push.

### What was built

- `scripts/seed.ts`: 6 new causes of death, each with a one-line description like the
  others, plus the CSS language. The run created exactly those 7 and skipped the 11
  that already existed.
- `content/graves.ts`: 18 graves. The 14 bugs are all buried, with dates spread from
  February 2024 to April 2026.
  - **The timezone chain starts on real daylight-saving switches:** the original on
    30 March 2025, Zombie #1 on 26 October 2025 ("Came back after daylight saving"),
    and Zombie #2 on 29 March 2026, still walking.
  - **"Cron job that ran twice at DST" was born on 27 October 2024,** the night
    European clocks fell back an hour.
  - **Zombie names follow the Studio's pattern,** "<name> (Zombie #n)", with the same
    language and cause as the grave they rose from.
  - **Walking zombies have only a birth date.** No fix or burial date, killer or hours,
    since they aren't dead yet.
- `scripts/lib/plan-graves.ts` and `content/types.ts`: two new importer checks, so the
  importer follows the same rules as the Studio:
  - burial must come at least `BURIAL_WAIT_DAYS` (7) after the fix;
  - a zombie can't be born before the fix it regressed.

**Result in Sanity:** 18 published graves (`grave-<key>`), 0 other bugs, 0 drafts.
`--delete-test` removed the 3 test bugs.

### Checks

- An independent script checked the brief directly: all 18 epitaphs are word for word
  (including ₹0.30000000000000004 and "Ã©"), and every date, hour count and killedBy
  follows the rules.
- The two new importer rules each passed a failing case and a passing case, including
  a burial exactly 7 days after the fix being allowed.
- The dry run listed 18 "create" lines, with the chain counted as 1× and 2× and the
  stale-cache zombie as 1×.
- **On the live site (after the webhook, within about a second):**
  - The homepage says "18 graves · 2 zombies walking".
  - **Disturbed:** the original timezone bug, timezone Zombie #1 and the stale cache.
  - **Zombies:** timezone Zombie #2 and stale-cache Zombie #1. The other 13 rest.
  - `<<<<<<< HEAD in production` and "Jashan's" render correctly, and CSS appears as a
    language filter.
  - All 18 grave pages load, and the old test-bug pages now return 404.
  - Zombie #2's page shows its past lives in order (the original, then Zombie #1),
    with no "…and older lives", "Times resurrected: 2", and the title "RIP Timezone
    bug in scheduler (Zombie #2)".
  - **Leaderboard:**
    - **Deadliest:** Two threads, one counter (38h), Array index −1 (22h), Zombie #1
      (20h), the original timezone bug (16h), and the laptop bug (14h).
    - **Haunted languages:** Python 2, TypeScript 1.
    - **Causes:** Timezone 4, then Cache, Null reference and Off-by-one with 2 each,
      in alphabetical order, then the rest.
    - **Most resurrected:** Zombie #2, "has risen 2 times", with the three-life chain.

### What went wrong

- **Two of my own checks had wrong expectations; the site was right both times.** The
  content uses 12 distinct causes of death, not the 14 I expected. And on a grave page
  the big stone's name is the page's `<h1>`, not an `<h2>`, so my helper missed it.
  Both were confirmed against the live page directly.
- **A layout nit, not fixed yet:** on desktop, the three-stone chain in "Most
  resurrected" wraps onto a second line in its half-width card, and the long causes
  list leaves that card with empty space beside it.

### Sanity notes for the write-up

- **Going from test data to real content was three commands and no code:** seed the
  new reference data, import the file, delete the test bugs. The live site, the
  leaderboard and the Studio's filtered lists all updated through the webhook within
  about a second.
- **The rules live in one place each.** The 7-day burial wait is the same constant in
  the Studio action and the importer, so bulk-imported history can't break a rule the
  Studio enforces.
- **References made the clean-up safe.** `--delete-test` checks with
  `references($ids)` before deleting, and the imported graves never pointed at test
  bugs, so it could remove them in one transaction.

---

## Phase 9: Polish before submission (2026-09-29)

### What I asked for

- Skip the real-bug interview and keep `content/graves.ts` as it is, with a note that
  the graves are classic developer bugs, not my history. (Before this, a search of
  `~/Desktop` and `~/Documents` found three repos and 10 commits, none of them bug
  fixes: `BTP_BEST` has only setup commits, `ml_challnege` has none, and
  `color-norm-btp` is a teammate's work.)
- The polish pass:
  - fix the leaderboard layout;
  - vary the tombstones naturally but deterministically;
  - a favicon, a site-wide share image and per-grave share images;
  - check every page at 375px and 1440px;
  - accessibility (labels, contrast, focus, reduced motion);
  - titles and descriptions everywhere;
  - a footer with the repo link;
  - a proper README;
  - a check of the repo and history for secrets;
  - then build, deploy with every grave prerendered, verify, note and commit.

### What was built

- **Leaderboard:** "Most resurrected" spans the full width, so the three-stone chain
  stays on one line. Below it are two columns (Deadliest and Haunted languages on the
  left, Causes of death on the right) that end level; the last card stretches.
  `RankedBars` gained a `compact` mode (label and bar on one line) for short labels.
- **Natural stones:** `stoneStyleFor(id)` in `lib/graves.ts` hashes the bug's ID (with
  FNV-1a, a simple hash) into one of four shapes (dome, tall, flat, low), a height
  within ±1.5rem, a width from 17 to 18.5rem, and a tilt within ±1.2°. Only resting
  stones tilt. The same ID always gives the same stone, so nothing moves between the
  server and the browser. The homepage grid lines the stones up by their bottoms, like
  a ground line.
- **Icons and share images:**
  - `app/icon.svg` is a tombstone favicon, replacing the default `favicon.ico`, and
    `app/apple-icon.tsx` is the home-screen icon.
  - `app/(site)/opengraph-image.tsx` is the site-wide card: the title and three stones
    (resting, disturbed, zombie).
  - `grave/[slug]/opengraph-image.tsx` gives each grave its own stone with name, dates,
    epitaph, language and cause, and "Rose from …".
  - All of them are drawn in `lib/og.tsx`, using fonts in `assets/fonts` with their
    OFL licences.
- **Metadata:** `lib/metadata.ts` provides the site name and description, `metadataBase`
  and an `openGraph()` helper. Titles use the template "%s · Bug Graveyard", grave
  pages keep "RIP <name>", and every page has Open Graph data and a
  `summary_large_image` Twitter card.
- **Footer:** "Built with Next.js + Sanity for the DEV Sanity Challenge · Source on
  GitHub".
- **Accessibility:**
  - a "Skip to content" link;
  - a global focus ring for links and buttons;
  - mini-stone captions kept for screen readers instead of `display: none`;
  - muted text lifted above 4.5:1 (rank numbers, chip counts, and the kicker and dates
    on a stone);
  - reduced motion was already respected, and is now tested.
- **`app/not-found.tsx`:** a styled 404 for any unknown URL.
- **`README.md`:** the pitch, three screenshots (`docs/`), the live link, the features,
  the schema design and why, the stack, local setup, deployment, and a note about the
  content.

### Checks

- **Every page at 375px (phone emulation) and 1440px:** no horizontal overflow on the
  homepage, a filtered view, the leaderboard, two grave pages, both 404s and the
  Studio. Each page has exactly one `<h1>`, and no link lacks an accessible name.
- **Keyboard:** tabbing through the homepage (70 stops), the leaderboard (56) and a
  grave page (16) showed a visible focus ring at every stop. The first Tab reveals
  "Skip to content".
- **Reduced motion:** the fog, the zombie glow and the hover lift all stop.
- **Contrast** was measured on the darkest, lightest and foggiest backgrounds; three
  cases below 4.5:1 were fixed.
- **Share images:** the ₹ in "Owed ₹0.30000000000000004" renders thanks to the symbol
  fallback font, and zombies glow.
- **Secrets:** none of the real webhook secret, Vercel OIDC token or Sanity CLI token
  appears in any file or in any of the 13 commits. There are 0 hits for token and
  private-key patterns, and no `.env` file was ever committed. `.env.local`, `.vercel/`,
  `.next/` and `node_modules/` are all ignored.
- **Live, after deploying:**
  - all 18 grave pages are served as `PRERENDER`;
  - the share tags point at absolute production URLs;
  - the share images and icons load;
  - the footer is there;
  - `/studio` loads no global site CSS;
  - both 404s work.

### What went wrong and how we fixed it

- **Satori rejected `transform: 'none'`.** The build failed with `Unexpected token type:
  word`, because the share-image renderer's transform parser only accepts functions like
  `rotate()`. Fix: leave the property out for stones that aren't disturbed.
- **The build prerendered deleted bugs.** `generateStaticParams` read the slug list
  from Next's local fetch cache in `.next/cache`, which still held the test bugs,
  because content changes never reach a local cache. Fix: `allGraveSlugs()` fetches
  the list with `cache: 'no-store'`. The stale local cache was cleared too.
- **The site CSS leaked into the Studio.** The root 404 page first imported the site's
  global CSS, and a root not-found's styles load on **every** route, which pulled
  Tailwind into `/studio` (3 stylesheets). Fix: a scoped CSS module. `/studio` now loads
  only scoped modules and the font faces.
- **The leaderboard lost its share image.** A page that sets `openGraph` replaces the
  inherited file-based image, so `leaderboard/opengraph-image.tsx` re-exports the
  site-wide one.
- **"Works on my machine" was cut off** in the compact label column. The column was
  widened from 10rem to 12rem.
- **Test script mistakes, not app bugs:** the shell's `grep` is ugrep, which choked on
  one long pattern, so the system grep was used. And a `[class*="stone"]` selector also
  matched every `Tombstone-module` class.

### Not fixed (known limits)

- **Pushing to GitHub still doesn't deploy.** Vercel needs a GitHub login connection
  added in the browser first, so deploys are done with `vercel deploy --prod`.
- **The share-image fallback only covers a few symbols:** ₹ € £ ¥, curly quotes and
  dashes. Emoji or non-Latin text in a name or epitaph would show as empty boxes in
  that grave's share image (the site itself is fine).
- **An unknown grave's 404 has the site title in its `<head>`.** The "This grave is
  empty" title arrives later in the page load, so browsers show it but plain HTML
  readers don't. It's a 404 and isn't indexed.
- **The leaderboard columns only end level through stretching.** With very different
  content the stretched card could hold some empty space.
- **Tested with automated checks and emulation only:** no real screen reader, and no
  real phones.

### Sanity notes for the write-up

- **The same Tombstone runs in three places:** the site, the Studio preview, and (in
  redrawn form) the share images, all from the same content.
- **Build-time data and live data are different problems.** Live updates and the
  webhook keep the running site fresh, but `generateStaticParams` at build time needs
  its own fresh read (`cache: 'no-store'`), or a build can prerender content that no
  longer exists.

---

## Bonus investigation: Sanity Workflows and the App SDK (2026-09-29)

### What I asked for

With a 3-hour time box and nothing that works allowed to break: find out honestly
whether Sanity Workflows is usable on my project and plan, and what it would take to
model the bug lifecycle (suspected dead → fix merged → buried → zombie) as a Workflow
while keeping the existing document actions. Build it on a separate branch if it fits
in 3 hours; otherwise propose the smallest App SDK app (a "Morgue" dashboard). Don't
deploy. Record the findings here.

### Verdict

**Workflows is usable on this project and plan today, but a proper integration
doesn't fit in 3 hours.** What I built instead is a working proof of the model on a
separate branch, `explore/workflows` (local, not merged, not pushed).

The facts, from the current docs (`npx sanity@latest docs read /docs/workflows/...`)
and npm:
- **It's in early access.** The packages are at 0.35.0, still pre-1.0, and a minor
  version can break things.
- **It's a library plus a CLI, and it stores definitions and instances as ordinary
  documents.** No plan gate is mentioned anywhere, so the free plan works. Only
  Enterprise user attributes, and how often Scheduled Functions may run, depend on
  the plan.
- **The Studio plugin needs Sanity Studio 6.15 or later** (`@sanity/workflow-studio`
  requires `sanity ^6`), and this project runs Sanity 5.31.
- **"You run the runtime."** Nothing moves by itself. Effects (for example, writing
  `status` back onto the bug) need a runtime you operate, such as a Sanity Function
  deployed with a Blueprint and a robot token, a server, or the CLI while developing.
  The generated runtimes are marked experimental.
- **Every engine check is advisory, and guards aren't enforced** by the Content Lake
  yet. They grey out buttons; they don't stop writes.
- **Deploying shares the definitions with Sanity by default.** `--no-share-defs` opts
  out.
- **There's a dependency conflict.** The Workflows CLI's `@sanity/workflow-blueprint`
  optionally needs TypeScript 6 or 7, while this project's `typescript-eslint` 8 needs
  TypeScript below 6.1. TypeScript 6.0.x would satisfy both; the experiment used
  `--legacy-peer-deps` instead.
- **The docs search command is broken right now:** `npx sanity docs search` fails with
  "Invalid response format from documentation search API". `docs read <path>` works.

### What was built (branch `explore/workflows`, 2 commits)

1. **The Sanity 6 upgrade.** `sanity` and `@sanity/vision` moved to 6.16, alongside
   next-sanity 13.3. Only two small changes were needed: `sanity schemas extract` now
   needs `--force` to overwrite, and TypeGen's new global query registry trips an
   ESLint rule, so the generated types file is ignored. The type-check, lint, schema
   validation (0 errors) and production build all pass. A read-only Studio smoke test
   found the custom sidebar, the Tombstone view (after the document loads) and the
   lifecycle menus on real graves all correct, with no errors. **Not yet tested on
   v6:** clicking the lifecycle actions, which write data.
2. **The lifecycle as a Workflow** (`workflows/bug-lifecycle.ts`,
   `sanity.workflow.ts`):
   - **Two definitions:** `bug-lifecycle` starts at *suspected dead* and
     `zombie-lifecycle` starts at *walking*.
   - **From there:** → *fix merged*. There, "Declare buried" is gated by a requirement,
     `dateTime($now) >= dateTime($fields.fixMergedAt) + 7 days` (reusing
     `BURIAL_WAIT_DAYS`), while "Report resurrection" stays available → *buried* →
     *risen* (terminal; the zombie runs its own instance).
   - **Each exit action stamps its own date,** so each transition's `when` knows which
     one fired.
   - **One lifecycle per bug,** via a `singleSubject` start requirement.
   - `npx sanity-workflows deploy --check` passes for both definitions, without
     contacting the dataset.
   - **4 vitest tests pass against the real engine in memory**
     (`@sanity/workflow-engine-test`, controlled clock):
     - the full path, with burial refused (`ActionDisabledError`) until exactly 7
       days, then allowed;
     - a regression before burial going to *risen*;
     - a zombie starting as *walking*;
     - one lifecycle per bug.

### What a real integration would take (roughly 1.5 to 2 days)

1. Merge the Sanity 6 upgrade after running the lifecycle-action end-to-end test on v6
   (about 1 hour), and settle the TypeScript peer conflict with TypeScript 6.0.x
   (about 30 minutes).
2. **Decide which copy of the status is the source of truth; this is the hard part.**
   Right now `status`, `fixMergedAt` and `buriedAt` live on the bug, and the site reads
   them there. There are two options:
   - **The workflow drives, and effects write the bug's fields.** This needs an effect
     drainer (a Sanity Function, a Blueprint and a robot token) and is half a day or
     more.
   - **The bug stays authoritative, and each document action also fires the matching
     Workflow action.** This takes 2–3 hours, but two copies of the state can drift
     apart.
3. Deploy the definitions to a separate `workflows` dataset. Start instances for the
   18 existing graves in the right stage (with the `set-stage` admin command), and for
   new bugs (the Studio's create flow, or a Function). About 1–2 hours.
4. Add a UI: the Studio plugin (needs Sanity 6), or a Workflows screen in an App SDK
   app via `@sanity/workflow-sdk` / `@sanity/workflow-react`, which only need React
   19. About 2–3 hours.
5. End-to-end tests. About 1–2 hours.

### Proposal instead: a "Morgue" App SDK app (about 2–3 hours, not built)

- **What:** a small real-time dashboard in the Sanity Dashboard. Its columns would be:
  - **"Ready to bury today":** fix merged at least 7 days ago;
  - **"Waiting":** fix merged, with "can bury in N days";
  - **"Walking zombies";**
  - **"Suspected dead".**
  Each card would have one-click **Mark fix merged / Declare buried / Report
  resurrection** buttons (with the same confirm dialog), updating live as anyone
  changes a bug.
- **How:** scaffold it in `apps/morgue/` with `npx sanity@latest init --template
  app-quickstart`, pointed at `rzjmw6lg/production`. Run it with `npm run dev`; it
  opens inside the Sanity Dashboard.
  - **One copy of the logic:** the lifecycle rules already live in the plain module
    `sanity/lib/lifecycle.ts`. Moving the mutations out of the Studio actions into a
    shared module would let the Studio and the Morgue run the same code.
  - **No Studio upgrade needed.**
  - **Deploying later** would be one command, `npx sanity deploy --title "Morgue"`,
    once approved.
- **Why this one:** it earns the App SDK bonus without touching anything that works.
  Later, the same app could host the Workflows interface (`@sanity/workflow-sdk`) once
  the source-of-truth question is settled.

### Sanity notes for the write-up

- **Workflows puts a process next to the content, as data:**
  - a *definition* (stages, activities, actions, transitions);
  - *instances*, each a run pinned to a definition version;
  - *conditions* written in GROQ over the instance and its subject document.

  An agent (over the Workflows MCP server) and a person (in the Studio or an app) move
  it through the same actions.
- **A rule like "the fix must hold 7 days" needs no timer.** It's a GROQ requirement
  against `$now`, checked when someone asks. Only automatic transitions need a `tick`
  from a runtime.
- **You can test a workflow without a project.** `@sanity/workflow-engine-test` runs
  the real engine in memory with a clock you control, so the 7-day rule was tested by
  moving the clock forward 6 days, then 1 more.
- **Early access means advice, not enforcement.** Disabled actions and guards shape
  the UI, but anything with a write token can bypass them until the Content Lake
  enforces guards.

---

## DEV submission (2026-09-29)

### What I asked for

Do the whole DEV submission for me, stopping only for logins and approvals:
- **Media:** Playwright screenshots of the live site at 1440px (homepage, the Zombie #2
  grave page with its past lives, `/leaderboard`), the Studio's "…" menu with the three
  lifecycle actions, and a GIF of the Studio split pane (typing an epitaph, switching to
  Zombie) made with a temporary test bug that is deleted afterwards. All of it in
  `docs/post/`, committed, and used in the post through raw.githubusercontent.com URLs.
- **The post:** fill in every image and "my words" placeholder with short, honest lines
  based only on NOTES.md and our sessions, say clearly that the graves are classic
  developer bugs, fact-check every claim, number and snippet, and remove the comments.
- **The agent session:** a copy of the Claude Code transcript with every secret replaced
  by `[REDACTED]`, saved to `~/Desktop/bug-graveyard-session.jsonl`.
- **DEV:** create the article through the DEV API as an unpublished draft (tags
  `devchallenge, sanitychallenge, sanity, nextjs`), show me the final text and wait, and
  only publish after I reply "publish". Then verify the live article.

Then: "do all this by yourself" for the steps before publishing (uploading and embedding
the agent session, the cover image).

### What was built

- `docs/post/homepage.png`, `grave-zombie-2.png`, `leaderboard.png`: the live site at 1440px
- `docs/post/studio-lifecycle-actions.png`: the "…" menu on a bug whose fix merged 3 days
  ago ("Can bury in 4 days")
- `docs/post/studio-live-tombstone.gif`: the Studio split pane, 1200×814, 12fps, 2.2MB
  (ffmpeg 9.0.2 `palettegen`/`paletteuse`)
- `docs/post/cover.png`: the site's share image widened to 2000×840 for DEV's cover
- `bug-graveyard-dev-post.md`: the final post, using the Path Two template's headings
- `~/Desktop/bug-graveyard-session.jsonl` (outside the repo): the redacted transcript
- A DEV agent session, "Building Bug Graveyard (Next.js + Sanity) with Claude Code"
  (719 messages, public), embedded in the post as the Phase 5 slice with
  `{% agent_session … 358..398 %}`
- **The published article:**
  https://dev.to/jashanpreet_kaur_917e774f/bug-graveyard-where-fixed-bugs-are-buried-and-regressions-rise-as-zombies-5hcf

The capture, redaction and DEV scripts stayed in the session's scratchpad, not the repo.

**Checked after publishing (logged out):** the page returns 200 with all seven headings,
all 5 images and the cover load (DEV copies them to its own storage; the GIF is still
animated, 109 frames), all 6 links return 200, and the embed renders "41 messages
(range 358-398) of 719 total".

### What went wrong and how we fixed it

- **Playwright's `recordVideo` failed** when creating the browser context, because
  Playwright's own ffmpeg wasn't installed. Fix: `npx playwright install ffmpeg`.
- **The Studio rendered in light mode, and Sanity's "What's new" card covered the form.**
  Fix: `colorScheme: 'dark'`, and a script that hides the card during the capture only.
- **The first recording left a draft** (`drafts.test-bug-demo`), which would have
  disabled the lifecycle actions in the menu screenshot. It was deleted before capturing.
- **The homepage and leaderboard were first captured while the test bug existed**
  (19 graves). They were captured again after deleting it (18 graves). Sanity ended with
  18 bugs and 0 drafts.
- **The draft post had factual errors,** fixed against the code and these notes:
  - The actions sit after Publish in the "…" menu; they aren't "buttons next to Publish".
  - Only `fixMergedAt`, `buriedAt` and `timesResurrected` are read-only (`bornAt` isn't),
    and the importer sets dates too.
  - `vercel.json` isn't "two lines".
  - The CSS leak came from the root 404 page importing global CSS.
  - The timezone and dotted-ID items were traps avoided from the start, not bugs.
  - The site never links to `/studio` at all.
  - The Workflows rule is really
    `dateTime($now) >= dateTime($fields.fixMergedAt) + 604800`.
- **The redaction's first pass hit random text.** Token patterns matched letter runs
  inside base64 screenshots (16 hits) and the README placeholder `"a-long-random-string"`.
  Fix: walk each parsed JSON line, skip image data and signatures, and allow known
  placeholders. None of the real secrets appeared anywhere in the transcript: the
  webhook secret, the Vercel OIDC token, the Sanity CLI token, the Vercel token, the
  GitHub token and the DEV key. What was redacted was the one-time Vercel device login
  code (14 mentions) and a teammate's email address, including fragments of it, which
  came from the git log in the repo scan (40 mentions).
- **A colon in the title breaks DEV's front matter.** The file quotes it, and the API
  gets the title and tags as fields, so publishing only had to flip `published`.
- **A draft's preview needs a login** (404 when logged out), so the rendered check could
  only happen after publishing.
- **DEV's API can create an agent session but can't make it public.**
  `POST /api/agent_sessions` with `curated_data` (built with DEV's own open-source Claude
  Code parser) worked. DEV added 2 redactions of its own. "Make Public" only exists in
  the web app, and Claude Code's permission check blocked my automated attempt as a
  publishing step, so I clicked Make Public myself.

### Sanity notes for the write-up

- **Checked while writing the post:** a published document with a dotted ID (the test
  used `claimcheck.dotted`) is left out of a public API query but returned with a token,
  so the dashed seed IDs were the right call.
- **A public dataset can be linked to directly,** which is how the post shares the
  project: `https://rzjmw6lg.api.sanity.io/v2026-09-28/data/query/production?query=…`.
- **Headless Studio capture needs no extra token.** Setting
  `__studio_auth_token_<projectId>` in `localStorage` from the CLI login signs the
  Studio in, which is how the screenshots and the GIF were made on the live Studio.

---

## Phase 10: The Morgue (App SDK) and the leftovers (2026-09-29)

### What I asked for

After publishing, Claude listed what was left for me to do by hand: revoke the DEV API
key, connect Vercel to GitHub, decide what to do with the `explore/workflows` branch,
decide on the Morgue App SDK app, and reply to comments. I said: "do it by yourself if
you need any pass or something I will give you."

Decisions made for me:
- **`explore/workflows`:** push it, so the Workflows work described in the post can be
  checked. It stays unmerged.
- **The Morgue:** build it. The App SDK is one of the two things the challenge names
  for bonus points, and it lives in its own folder, so nothing that works changes.
- Vercel and the DEV key need my browser logins, so they're asked for at the end.

### What was built

- Pushed `explore/workflows` to GitHub (2 commits; a scan found no secrets). Vercel wasn't
  connected to GitHub yet, so the push couldn't deploy it.
- `apps/morgue/`: the Morgue, a Sanity App SDK app (`@sanity/sdk-react` 3.5.0, `sanity`
  6.16 as its CLI), scaffolded with `npx sanity@latest init --template app-quickstart`:
  - `src/Morgue.tsx`: four live columns (Suspected dead, Walking, Waiting, Ready to bury),
    each a `useDocuments` list with a GROQ filter, plus a buried count
  - `src/BugCard.tsx`: one `useDocumentProjection` per card, and the three lifecycle
    buttons through `useApplyDocumentActions` (`editDocument` / `createDocument` on
    `liveEdit` handles, so they write straight to the published bug)
  - `src/facts.ts`: one live `useQuery` (raw perspective) for which bugs have Studio
    drafts or release versions, and which graves have already risen
  - `run-sanity.mjs`: runs the Sanity CLI from a mirror folder (see below)
  - `README.md`, `icon.svg`, `sanity.cli.ts` (organization `o0zfmcbiy`, title "Morgue")
- `sanity/lib/lifecycle.ts`: only its comment changed; the Morgue imports the same
  `BURIAL_WAIT_DAYS`, `daysUntilBurial`, `zombieName`, `slugify` and `todayUTC`
- `tsconfig.json`, `eslint.config.mjs`, `.vercelignore`: the site now skips `apps/`
- `README.md`: the Morgue and the Workflows branch
- `docs/post/morgue.png`, `docs/post/morgue-live.gif` (1200×750, 12fps, 1.9MB)
- **Vercel is connected to GitHub.** `vercel git connect` kept failing with "You need to add
  a Login Connection to your GitHub account first. (400)". I connected it from the
  project's Settings → Git page instead, installing Vercel's GitHub app for the
  `bug-graveyard` repo only. The project is now linked to `jashanpreet-k/bug-graveyard`
  with `main` as the production branch, so pushes to `main` deploy the site (no more
  `vercel deploy --prod`), and pushes to other branches get preview deploys.
  The first push after connecting built and went live in about 40 seconds.
- **The published post got a new section,** "Reaching past the Studio: the App SDK",
  with the Morgue GIF and the `apps/morgue` link. It also links the `explore/workflows`
  branch instead of calling it local, lists `apps/morgue/` under "Where to look", and has
  one new "What I learned" bullet. The update went through the DEV API, and only after
  checking that the live post still matched the published version. It used a new DEV
  key, which I pasted into the chat by mistake (so it's in the session log) and revoke
  right after.

**End-to-end test, 18/18 checks passed.** Headless Chrome opened the local Morgue inside
the real Sanity Dashboard and clicked its buttons on four temporary test bugs (one with a
Studio draft):
- the right bugs in the right columns;
- "Can bury in 4 days" disabled for a fix 3 days old;
- the draft warning, with every button disabled;
- Mark fix merged moved a card to Waiting live, writing the published bug with today's
  UTC date and no draft;
- Declare buried took a card off the board, and the buried count went from 16 to 17;
- Cancel in the confirm created nothing;
- "Let it rise" created exactly one published zombie with the right name, slug, count,
  language and cause, which appeared in Walking live;
- the grave then couldn't rise twice.

Everything was deleted afterwards: 18 bugs, 0 drafts, 0 test documents.

### What went wrong and how we fixed it

- **`sanity build` in `apps/morgue` built the site's Studio instead,** into a new `dist/`
  and `.sanity/` at the repo root (both deleted; nothing tracked was touched). The CLI's
  `findProjectRootSync` looks for `sanity.config.(ts|js)` in the current folder and every
  parent *before* it looks for `sanity.cli.(ts|js)`, and it has no option to override
  that. So an app inside a repo with a Studio config at the root always resolves to that
  Studio, and `sanity deploy` would deploy the Studio. Fix: `run-sanity.mjs`, used by
  `npm run dev|build|deploy`, symlinks the app into a folder under the system temp
  folder and runs the CLI there. The build then says "Building Sanity application".
- **The dev server answered 403:** "The request id "…/.sanity/runtime/index.html" is
  outside of Vite serving allow list." Setting `server.fs.allow` (so Vite can serve the
  shared `sanity/lib/lifecycle.ts`) replaces Vite's defaults. Fix: allow the mirror
  folder (both its `/var` and `/private/var` spellings) as well as the repo root.
- **The Dashboard showed an empty frame in headless Chrome.** Chrome asks before a public
  site may frame `localhost` (local network access), and headless Chrome can't answer.
  For the local test only, it ran with
  `--disable-features=LocalNetworkAccessChecks,…`. Signing in needed no password: the
  CLI login token as a `sanitySession` cookie on `api.sanity.io` signed the Dashboard in.
- **The site's lint ran out of memory** ("JavaScript heap out of memory") because it
  tried to lint the stray root `dist/` from the first build. Fixed by deleting it.
- **The app's lint flagged `process` and `URL` in `run-sanity.mjs`,** because the
  Studio lint config assumes browser code. Fix: Node globals for that one file.
- **A GROQ trap in the "Waiting" filter:** `!(fixMergedAt <= $cutoff)` drops bugs that
  have no fix date, because a comparison with null is null and `!null` is still null.
  It's written as `!defined(fixMergedAt) || fixMergedAt > $cutoff`.

### Sanity notes for the write-up

- **An App SDK app is a React app that runs in the Dashboard.** `<SanityApp>` gets the
  signed-in user's token from the Dashboard, so there's no login code and no token in
  the app. Every hook is live: a change from the Studio, the site's scripts or another
  Morgue tab moves the cards without a refresh.
- **The App SDK's building blocks map onto the Studio's:** `useDocuments` gives
  handles, `useDocumentProjection` gives fields, and `useApplyDocumentActions` with
  `editDocument` / `createDocument` does what the document actions do with `useClient`.
  A `liveEdit: true` handle writes to the published document with no draft step, which
  matches how the Studio's lifecycle actions work.
- **One rulebook, two interfaces.** The Studio's actions and the Morgue import the same
  `sanity/lib/lifecycle.ts`, so "a fix must hold 7 days" can't drift between them.
- **App SDK apps and a root-level Studio config don't mix** without a workaround (see
  above), which matters for any Next.js project with an embedded Studio.

---

## Phase 11: Sanity Functions and the AI coroner (2026-09-29)

### What I asked for

Two self-contained features on a `functions` branch, without breaking anything live,
shown to me before any merge or deploy:
1. First, check the current docs for Functions (Blueprints) and Agent Actions: whether
   they're available on my free plan, their quotas, and how to deploy. Tell me honestly.
2. **The gravedigger:** a scheduled function that runs daily and buries every bug whose
   fix has held for 7 days (the same `BURIAL_WAIT_DAYS` rule), setting `buriedAt` to
   today (UTC) and logging what it buried.
3. **The coroner:** a document function that, when a new bug is created as suspected
   dead with no epitaph, uses an Agent Action to draft a funny epitaph (at most 140
   characters, in the style of the existing graves) and suggest a cause of death from
   the existing ones. It writes the suggestion to new fields (`coronerEpitaph`,
   `coronerCause`, `coronerStatus: "awaiting approval"`), and a "✅ Accept coroner's
   report" action in the Studio copies it into the real fields. The AI never publishes
   on its own.
4. Test both end to end with temporary bugs (deleted afterwards), including a forced run
   of the gravedigger, then build, lint, type-check and write this entry.

### What the docs said (checked before building)

- **My project isn't on the Free plan yet.** `GET /v1/subscriptions/project/rzjmw6lg`
  says "Growth Trial", status `trialing`, until 2026-10-28. After that it drops to Free
  unless I upgrade.
- **Both features are on the Free plan too** (the pricing page, "Compute & AI (per
  organization)"):
  - **Functions:** 500K invocations and 20K GB-seconds a month, with no paid overage on
    Free.
  - **Scheduled functions:** up to 5, and at most **daily** on Free (hourly on Growth).
  - **Agent Actions:** included, with **1,000 AI credits a month**. Each Agent Action
    request costs 1 credit ($0.05), and Free can't buy more: AI pauses until the next
    month.
  - My organization has AI features enabled (`aiFeaturesStatus: "enabled"`).
- **Agent Actions are marked experimental,** use API version `vX`, and need a deployed
  schema for the actions that write documents. They don't write `readOnly` or `hidden`
  fields, and writing references needs the deprecated Embeddings Index API. Prompt
  avoids all of that: it only returns text or JSON, so it needs no schema, and the
  function writes the fields itself.
- **Deploying:** `npx sanity@latest blueprints deploy`, from a stack that
  `blueprints init` creates remotely. Scheduled functions need an organization-scoped
  stack, which needs the organization admin role (me).
  - A document function gets an editor-role robot token automatically.
  - A scheduled function needs one defined in the blueprint.
  - The `@sanity/blueprints` 0.27.0 types still label `defineScheduledFunction` "@alpha
    … not available publicly yet", while the docs launched Scheduled Functions on
    2026-05-07. Only a deploy will tell.

### What was built (branch `functions`, not merged, nothing deployed)

- `sanity.blueprint.ts`: a robot token for the gravedigger (editor on this project only),
  the scheduled `gravedigger` (`15 0 * * *` UTC, timeout 60s) and the document function
  `coroner` (on `create`, filter `_type == "bug" && status == "suspected-dead" &&
  (!defined(epitaph) || epitaph == "") && !defined(coronerStatus)`, dataset
  `rzjmw6lg.production`)
- `functions/gravedigger/index.ts`:
  - It uses `burialCutoff` to narrow the query, then `daysUntilBurial(...) === 0` to
    decide, both from `sanity/lib/lifecycle.ts`.
  - Each burial is an `ifRevisionId` patch on the published bug.
  - It skips bugs with a draft or release version, and `DRY_RUN=1` only logs.
- `functions/coroner/index.ts`:
  - It re-checks the bug first, then fetches the causes of death and 12 real graves'
    epitaphs as style examples.
  - It calls `client.agent.action.prompt` (format JSON, temperature 0.8), with one
    retry if the epitaph is too long and a word-boundary cut as a last resort.
  - It keeps a cause only if it's a real cause ID, and writes the report with
    `setIfMissing`, so a report is never overwritten.
- `sanity/actions/coroner.tsx`: "✅ Accept coroner's report".
  - It's shown only while a report is awaiting approval.
  - Its confirm popover shows the suggested epitaph and cause.
  - Accepting copies them into `epitaph` and `causeOfDeath` and sets `coronerStatus:
    "accepted"`, in one revision-guarded patch on the published bug.
  - Like the lifecycle actions (whose `blockedBecause` and `useRun` it now shares), it
    waits while there's a draft.
- `sanity/schemaTypes/bug.ts`: a "Coroner's report" group with the three read-only
  fields, hidden until there's a report
- `sanity/lib/coroner.ts` (the two report statuses), `sanity/lib/epitaph.ts` (the
  140-character limit, moved out of the schema file so the function doesn't bundle
  `sanity`), `burialCutoff` added to `sanity/lib/lifecycle.ts` (the Morgue uses it too)
- `package.json`: `@sanity/client` ^7.27.0 and `@sanity/functions` ^1.8.0, plus
  `@sanity/blueprints` ^0.27.0 as a dev dependency (next, sanity and next-sanity
  unchanged)
- `.gitignore`, `eslint.config.mjs`, `.vercelignore`: skip `functions/*/.build`; Vercel
  skips `functions` and the blueprint
- `README.md`: a Functions section; `docs/post/coroner.png`; regenerated TypeGen types

**End-to-end test, 23/23 checks passed.** The functions ran through Sanity's local runner
(`npx sanity@latest functions test … --with-user-token`), which bundles them like a
deploy, against the real dataset. The Accept action was clicked in the branch's Studio
(`next start` on port 3333). Seven temporary bugs, one of them with a draft:
- **Gravedigger, dry run:** it listed the two due bugs, left the one with a draft, and
  changed nothing.
- **Gravedigger, forced run:** it buried the bugs whose fixes were 8 and exactly 7 days
  old, with `buriedAt` 2026-09-29 and no drafts. It left the 6-day-old one, the one with
  a draft (the draft untouched) and the one with no fix date. The 16 real buried graves
  were unchanged. (Before the test, no real bug was fix-merged or suspected dead.)
- **Coroner:** it filed "Paid once. Charged for the encore." with the cause Race
  condition for "Checkout button that charged twice" (the first run's suggestion was
  "Paid once. Charged twice. Now permanently declined."). The real `epitaph` and
  `causeOfDeath` stayed empty. A second run and a bug that already had an epitaph were
  both stopped by the event filter.
- **Studio:** no action on a bug without a report. On the reported bug, the "Coroner's
  report" tab showed the suggestion, the popover showed the epitaph and cause, and
  Accept copied both into the real fields, marked the report accepted and left no
  draft.

Everything was deleted afterwards (0 test documents left). The coroner used **2 AI
credits** in total, one per full test run.

### What went wrong and how we fixed it

- **The test looked for a modal and waited forever.** Sanity shows a document action's
  `type: 'confirm'` dialog as a popover next to the button
  (`confirm-popover-confirm-button`), not as a `[role="dialog"]`.
- **"A second run skips it" failed at first,** but the function was right. The local
  runner applies the blueprint's event filter first ("Filter … returned an empty result.
  Skipping invoke."), so the function never ran; the check now accepts either guard.
- **`functions test` leaves bundled output** in `functions/<name>/.build/`. It's now
  ignored by git, ESLint and Vercel. (It did show the shared `lifecycle.ts` code bundled
  into the gravedigger, so relative imports outside the function folder work.)
- **Local runs need flags.** Without `--dataset`, `--project-id` and `--with-user-token`,
  `context.clientOptions` has no dataset and no token. The gravedigger falls back to its
  own project and dataset constants, because scheduled functions aren't tied to one.

### Sanity notes for the write-up

- **Functions make the lifecycle move by itself** without any server of mine. The
  7-day rule now lives in one file used by the Studio action, the Morgue app and the
  gravedigger.
- **Human-in-the-loop AI:** the Agent Action only suggests, into separate fields. A
  person reads the suggestion in the Studio and accepts it with a document action. The
  blueprint's event filter (`!defined(coronerStatus)`) plus `setIfMissing` make it
  run once per bug.
- **Prompt is the most flexible Agent Action for this:** JSON out, no schema needed, and
  the model is given the real causes of death by ID, so it can only pick one that
  exists.
- **Functions can be tested locally against real data** with the same bundling, filters
  and projections as a deploy, before anything is deployed.
