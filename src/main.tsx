import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import '@fontsource-variable/inter/wght.css'
import './index.css'
import App from './App.tsx'
import { applyRuntimeEnvMetadata, publicEnv } from './config/env'
import { redirectToDetectedMarketIfNeeded } from './lib/market'

applyRuntimeEnvMetadata()

// On the apex/marketing domain (not already ao./pt.), geo-detect the
// visitor's market and redirect before the SPA ever mounts -- Angola loads
// the Angola subdomain, everywhere else loads Portugal (2026-07-10 decision).
// Resolves to false immediately on ao./pt. subdomains, localhost, and
// preview URLs, so this is a no-op there.
const apexHostname = (() => {
  try {
    return new URL(publicEnv.siteUrl).hostname
  } catch {
    return ''
  }
})()

redirectToDetectedMarketIfNeeded(apexHostname).then((redirected) => {
  if (redirected) return // navigation already under way -- don't mount on this page load

  const root = document.getElementById('root')!
  // Task 9 prerendering deliberately keeps the existing SPA as the runtime
  // application. Build-time browser snapshots give crawlers complete HTML,
  // then the client clears that inert snapshot and mounts the same React app
  // visitors used before this change. Hydrating a browser snapshot would be
  // unsafe: its CMS-loaded state is not serialized, so React's initial empty
  // catalogue would not match the captured DOM.
  if (root.dataset.prerendered === 'true') root.replaceChildren()

  createRoot(root).render(
    <StrictMode>
      <App />
      <Analytics />
    </StrictMode>,
  )
})
