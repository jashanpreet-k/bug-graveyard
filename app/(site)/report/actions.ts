'use server'

import {createHmac, randomUUID} from 'node:crypto'

import {headers} from 'next/headers'
import {after} from 'next/server'
import {createClient, type SanityClient} from 'next-sanity'

import {hasLink, isProfane, tidy} from '@/lib/moderation'
import {apiVersion, dataset, projectId} from '@/sanity/env'
import {CORONER_SKIPPED} from '@/sanity/lib/coroner'
import {type DetectorBug, findResurrection, MATCH_CANDIDATE, MATCH_NONE, RISING_GRAVES_QUERY} from '@/sanity/lib/detector'
import {slugify, todayUTC} from '@/sanity/lib/lifecycle'
import {
  exampleCutoff,
  EXAMPLES_PER_DAY,
  EXAMPLES_PER_IP_PER_DAY,
  EXPIRED_EXAMPLES_QUERY,
  isExampleReport,
  REPORT_COMPONENT_MAX,
  REPORT_NAME_MAX,
  REPORT_PENDING,
  REPORT_STORY_MAX,
  REPORT_STORY_MIN,
  REPORTS_PER_DAY,
  REPORTS_PER_IP_PER_DAY,
} from '@/sanity/lib/publicReport'

type Values = {name: string; language: string; component: string; whatHappened: string}

export interface ReportState {
  status: 'idle' | 'ok' | 'error'
  message: string
  /** What the visitor typed, so the form keeps it after an error */
  values?: Values
  /** When the server answered, so the form knows whether this answer is newer than "Try an example" */
  at?: number
  /** The new bug's ID, so the page can show the detector's result for it */
  reportId?: string
}

const THANKS =
  'Report received. The coroner and the Zombie Detector are on their way: the result appears here in a few seconds, and the bug joins the graveyard once it’s approved.'
const EXAMPLE_THANKS =
  'Example received. The coroner and the Zombie Detector are on their way: the result appears here in a few seconds. Examples stay out of the public list and are removed after an hour.'
const EXAMPLE_WITHOUT_AI =
  'Example received. Today’s AI budget is used, so the coroner is resting, but the Zombie Detector needs no AI: its result appears here in a moment. Examples stay out of the public list and are removed after an hour.'
const BUDGET_USED =
  'The coroner has used today’s AI budget, so the graveyard can’t take new reports until tomorrow (UTC). “👻 Try an example” still works: the Zombie Detector needs no AI.'

const error = (message: string, values?: Values): ReportState => ({status: 'error', message, values, at: Date.now()})

function readValues(formData: FormData): Values {
  return {
    name: tidy(formData.get('name')),
    language: tidy(formData.get('language')),
    component: tidy(formData.get('component')).toLowerCase(),
    whatHappened: tidy(formData.get('whatHappened')),
  }
}

// Creates a suspected-dead bug from the "Report a dead bug" form. It's published so
// the coroner function drafts its epitaph, but `publicReport.status: "pending"` keeps
// it out of the graveyard until someone approves it in the Studio. Whatever goes
// wrong, the visitor gets a message, never an error page.
export async function submitReport(_previous: ReportState, formData: FormData): Promise<ReportState> {
  try {
    return await receiveReport(formData)
  } catch (err) {
    console.error('The report page could not take a report:', err)
    return error('Something went wrong on our side, so the report wasn’t sent. Please try again in a minute.', readValues(formData))
  }
}

async function receiveReport(formData: FormData): Promise<ReportState> {
  // Only the server has this token (an editor token in Vercel's environment)
  const token = process.env.SANITY_WRITE_TOKEN
  if (!token) return error('The graveyard isn’t taking reports right now. Try again later.')

  const values = readValues(formData)
  const {name, language, component, whatHappened} = values

  // A honeypot: people never see this field, but bots fill in everything. Pretend it worked.
  if (tidy(formData.get('website'))) return {status: 'ok', message: THANKS, at: Date.now()}

  if (name.length < 3 || name.length > REPORT_NAME_MAX) {
    return error(`Give the bug a name of 3 to ${REPORT_NAME_MAX} characters.`, values)
  }
  if (whatHappened.length < REPORT_STORY_MIN || whatHappened.length > REPORT_STORY_MAX) {
    return error(`Say what happened in ${REPORT_STORY_MIN} to ${REPORT_STORY_MAX} characters.`, values)
  }
  if (component.length > REPORT_COMPONENT_MAX) {
    return error(`Name the component in ${REPORT_COMPONENT_MAX} characters or fewer.`, values)
  }
  if (hasLink(name) || hasLink(whatHappened) || hasLink(component)) return error('Please leave out links.', values)
  if (isProfane(name) || isProfane(whatHappened) || isProfane(component)) {
    return error('Please keep it clean: the graveyard is a family place.', values)
  }

  const client = createClient({projectId, dataset, apiVersion, token, useCdn: false})
  const languageDoc = await client.fetch<{_id: string; name: string | null} | null>(
    '*[_type == "language" && _id == $id][0]{_id, name}',
    {id: language},
  )
  if (!languageDoc) return error('Pick a language from the list.', values)

  // Rate limits, counted in private documents: the dot in their IDs keeps them out of
  // the public API. The IP address is only stored as a keyed hash. After answering,
  // yesterday's counters and examples older than an hour are deleted.
  const day = todayUTC()
  const ipKey = createHmac('sha256', token).update(`${day}|${await visitorIp()}`).digest('hex').slice(0, 32)
  const aiPerVisitor = `reportLimit.ip.${ipKey}`
  const aiPerDay = `reportLimit.day.${day}`
  after(() => cleanUp(client, day))

  // The AI budget: examples count too. Beyond it, a real report is turned away and an
  // example gets the Zombie Detector alone, which needs no AI.
  const example = isExampleReport(values)
  let useAi = true
  if (example) {
    if ((await countOne(client, `reportLimit.example.ip.${ipKey}`, day)) > EXAMPLES_PER_IP_PER_DAY) {
      return error(`You’ve tried the example ${EXAMPLES_PER_IP_PER_DAY} times today. Come back tomorrow, or report a real bug.`, values)
    }
    if ((await countOne(client, `reportLimit.example.day.${day}`, day)) > EXAMPLES_PER_DAY) {
      return error('The example has been tried a lot today. Please come back tomorrow.', values)
    }
    useAi = (await countOf(client, aiPerVisitor)) < REPORTS_PER_IP_PER_DAY && (await countOf(client, aiPerDay)) < REPORTS_PER_DAY
    if (useAi) {
      await countOne(client, aiPerVisitor, day)
      await countOne(client, aiPerDay, day)
    }
  } else {
    if ((await countOne(client, aiPerVisitor, day)) > REPORTS_PER_IP_PER_DAY) {
      return error(
        `You’ve used today’s ${REPORTS_PER_IP_PER_DAY} reports (examples count too). The coroner needs a rest: come back tomorrow.`,
        values,
      )
    }
    if ((await countOne(client, aiPerDay, day)) > REPORTS_PER_DAY) return error(BUDGET_USED, values)
  }

  const id = `report-${randomUUID()}`
  const bug = {
    _id: id,
    _type: 'bug',
    name,
    slug: {_type: 'slug', current: `${slugify(name) || 'bug'}-${id.slice(-6)}`},
    status: 'suspected-dead',
    language: {_type: 'reference', _ref: languageDoc._id},
    // What happened is the bug's symptoms, which the Zombie Detector compares
    symptoms: whatHappened,
    ...(component && {component}),
    timesResurrected: 0,
    ...(example && {isExample: true}),
    publicReport: {status: REPORT_PENDING, whatHappened, submittedAt: new Date().toISOString()},
  }

  if (useAi) {
    // The coroner function takes it from here
    await client.create(bug)
    return {status: 'ok', message: example ? EXAMPLE_THANKS : THANKS, at: Date.now(), reportId: id}
  }

  // No AI left today: run the Zombie Detector here, with no cause of death to compare.
  // coronerStatus keeps the coroner function (and its Agent Actions) away.
  const graves = await client.fetch<DetectorBug[]>(RISING_GRAVES_QUERY, {id})
  const {best, passes} = findResurrection(
    {
      _id: id,
      name,
      causeId: null,
      cause: null,
      languageId: languageDoc._id,
      language: languageDoc.name,
      component: component || null,
      symptoms: whatHappened,
    },
    graves,
  )
  await client.create({
    ...bug,
    coronerStatus: CORONER_SKIPPED,
    ...(best && passes
      ? {
          matchStatus: MATCH_CANDIDATE,
          resurrectionCandidate: {_type: 'reference', _ref: best.grave._id},
          matchScore: best.score,
          matchSignals: best.signals,
        }
      : {matchStatus: MATCH_NONE, matchScore: best?.score ?? 0}),
  })
  return {status: 'ok', message: EXAMPLE_WITHOUT_AI, at: Date.now(), reportId: id}
}

// Yesterday's counters, and examples that have had their hour. Failures don't matter:
// the next report, or the gravedigger's daily run, tries again.
async function cleanUp(client: SanityClient, day: string) {
  await Promise.allSettled([
    client.delete({query: '*[_type == "reportLimit" && day < $day]', params: {day}}),
    client.delete({query: EXPIRED_EXAMPLES_QUERY, params: {cutoff: exampleCutoff()}}),
  ])
}

// Adds one to a counter document (creating it if needed) and returns the new count
async function countOne(client: SanityClient, id: string, day: string) {
  await client
    .transaction()
    .createIfNotExists({_id: id, _type: 'reportLimit', day, count: 0})
    .patch(id, (patch) => patch.inc({count: 1}))
    .commit()
  return countOf(client, id)
}

async function countOf(client: SanityClient, id: string) {
  return (await client.fetch<number | null>('*[_id == $id][0].count', {id})) ?? 0
}

// Vercel sets x-real-ip to the visitor's address
async function visitorIp() {
  const h = await headers()
  return h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}
