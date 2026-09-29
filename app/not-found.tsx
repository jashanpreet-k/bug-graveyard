import type {Metadata} from 'next'
import Link from 'next/link'

import styles from './not-found.module.css'

export const metadata: Metadata = {title: 'Page not found'}

// Any URL that matches no route (unknown graves have their own page). Styled with
// a CSS module, not the site's global CSS: a root not-found's styles load on
// every page, and global Tailwind would leak into the Studio.
export default function NotFound() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Nothing is buried here.</h1>
      <p className={styles.text}>This page doesn’t exist. It may never have lived at all.</p>
      <Link href="/" className={styles.link}>
        Back to the graveyard
      </Link>
    </main>
  )
}
