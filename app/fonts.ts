import {Geist, Grenze_Gotisch} from 'next/font/google'

// Defined once and exposed as CSS variables on <html>, so the Tombstone looks the
// same on the site and in the Studio's Tombstone preview.
export const sans = Geist({variable: '--font-geist-sans', subsets: ['latin']})
export const gothic = Grenze_Gotisch({variable: '--font-gothic', subsets: ['latin']})
