'use server'

import {createHmac, randomUUID} from 'node:crypto'

import {headers} from 'next/headers'
import {createClient, type SanityClient} from 'next-sanity'

import {hasLink, isProfane, tidy} from '@/lib/moderation'
import {apiVersion, dataset, projectId} from '@/sanity/env'
import {slugify, todayUTC} from '@/sanity/lib/lifecycle'
import {
  REPORT_NAME_MAX,
  REPORT_PENDING,
  REPORT_STORY_MAX,
  REPORT_STORY_MIN,
  REPORTS_PER_DAY,
  REPORTS_PER_IP_PER_DAY,
} from '@/sanity/lib/publicReport'

export interface ReportState {
  status: 'idle' | 'ok' | 'error'
  message: string
  /** What the visitor typed, so the form keeps it after an error */
  values?: {name: string; language: string; whatHappened: string}
  /** When a report was accepted, so the form can start again empty */
  sentAt?: number
}

const THANKS =
  'Report received. The coroner is on its way: its draft appears under “Awaiting the coroner’s approval” in a few seconds, and the bug joins the graveyard once it’s approved.'

const error = (message: string, values: ReportState['values']): ReportState => ({status: 'error', message, values})

// Creates a suspected-dead bug from the "Report a dead bug" form. It's published so
// the coroner function drafts its epitaph, but `publicReport.status: "pending"` keeps
// it out of the graveyard until someone approves it in the Studio.
export async function submitReport(_previous: ReportState, formData: FormData): Promise<ReportState> {
  // Only the server has this token (an editor token in Vercel's environment)
  const token = process.env.SANITY_WRITE_TOKEN
  if (!token) return {status: 'error', message: 'The graveyard isn’t taking reports right now. Try again later.'}

  const name = tidy(formData.get('name'))
  const language = tidy(formData.get('language'))
  const whatHappened = tidy(formData.get('whatHappened'))
  const values = {name, language, whatHappened}

  // A honeypot: people never see this field, but bots fill in everything. Pretend it worked.
  if (tidy(formData.get('website'))) return {status: 'ok', message: THANKS, sentAt: Date.now()}

  if (name.length < 3 || name.length > REPORT_NAME_MAX) {
    return error(`Give the bug a name of 3 to ${REPORT_NAME_MAX} characters.`, values)
  }
  if (whatHappened.length < REPORT_STORY_MIN || whatHappened.length > REPORT_STORY_MAX) {
    return error(`Say what happened in ${REPORT_STORY_MIN} to ${REPORT_STORY_MAX} characters.`, values)
  }
  if (hasLink(name) || hasLink(whatHappened)) return error('Please leave out links.', values)
  if (isProfane(name) || isProfane(whatHappened)) {
    return error('Please keep it clean: the graveyard is a family place.', values)
  }

  const client = createClient({projectId, dataset, apiVersion, token, useCdn: false})
  const languageId = await client.fetch<string | null>('*[_type == "language" && _id == $id][0]._id', {id: language})
  if (!languageId) return error('Pick a language from the list.', values)

  // Rate limits, counted in private documents: the dot in their IDs keeps them out of
  // the public API. The IP address is only stored as a keyed hash, and yesterday's
  // counters are deleted.
  const day = todayUTC()
  const ipKey = createHmac('sha256', token).update(`${day}|${await visitorIp()}`).digest('hex').slice(0, 32)
  if ((await countOne(client, `reportLimit.ip.${ipKey}`, day)) > REPORTS_PER_IP_PER_DAY) {
    return error(`You’ve reported ${REPORTS_PER_IP_PER_DAY} bugs today. The coroner needs a rest: come back tomorrow.`, values)
  }
  if ((await countOne(client, `reportLimit.day.${day}`, day)) > REPORTS_PER_DAY) {
    return error('The graveyard has taken all the reports it can today. Come back tomorrow.', values)
  }
  client.delete({query: '*[_type == "reportLimit" && day < $day]', params: {day}}).catch(() => {})

  const id = `report-${randomUUID()}`
  await client.create({
    _id: id,
    _type: 'bug',
    name,
    slug: {_type: 'slug', current: `${slugify(name) || 'bug'}-${id.slice(-6)}`},
    status: 'suspected-dead',
    language: {_type: 'reference', _ref: languageId},
    timesResurrected: 0,
    publicReport: {status: REPORT_PENDING, whatHappened, submittedAt: new Date().toISOString()},
  })
  return {status: 'ok', message: THANKS, sentAt: Date.now()}
}

// Adds one to a counter document (creating it if needed) and returns the new count
async function countOne(client: SanityClient, id: string, day: string) {
  await client
    .transaction()
    .createIfNotExists({_id: id, _type: 'reportLimit', day, count: 0})
    .patch(id, (patch) => patch.inc({count: 1}))
    .commit()
  return (await client.fetch<number | null>('*[_id == $id][0].count', {id})) ?? 0
}

// Vercel sets x-real-ip to the visitor's address
async function visitorIp() {
  const h = await headers()
  return h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}
