import {SanityApp, type SanityConfig} from '@sanity/sdk-react'

import {Morgue} from './Morgue'
import './App.css'

// The same project and dataset as the site and its Studio
const config: SanityConfig[] = [{projectId: 'rzjmw6lg', dataset: 'production'}]

export default function App() {
  return (
    <SanityApp config={config} fallback={<p className="loading">Opening the morgue…</p>}>
      <Morgue />
    </SanityApp>
  )
}
