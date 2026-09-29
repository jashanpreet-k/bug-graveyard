import {englishDataset, englishRecommendedTransformers, RegExpMatcher} from 'obscenity'

// Checks for text the public can send or see: bug reports, and the coroner's AI
// drafts that the report page shows before anyone has approved them.

const profanity = new RegExpMatcher({...englishDataset.build(), ...englishRecommendedTransformers})

// Links are what spam is for; a bug report doesn't need one
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|ru|cn|xyz|app|dev|info|biz|top|click|link)\b)/i

/** Whether the text contains profanity (including disguised spellings like "sh1t"). */
export function isProfane(text: string) {
  return profanity.hasMatch(text)
}

/** Whether the text contains a link or a bare domain name. */
export function hasLink(text: string) {
  return LINK.test(text)
}

/** Collapses whitespace and drops control characters. */
export function tidy(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
