import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
