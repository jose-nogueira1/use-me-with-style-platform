import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import '@fontsource-variable/inter/wght.css'
import './index.css'
import App from './App.tsx'
import { applyRuntimeEnvMetadata, publicEnv } from './config/env'
import { redirectToDetectedMarketIfNeeded } from './lib/market'
import { HOME_RUNTIME_READY_EVENT } from './lib/prerenderBootstrap'

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
  const prerendered = root.dataset.prerendered === 'true'
  const application = (
    <StrictMode>
      <App />
      <Analytics />
      <SpeedInsights />
    </StrictMode>
  )

  // A prerendered page stays intact until React has a complete replacement.
  // Home is code-split, so mount it invisibly alongside the snapshot and
  // reveal it only when the real Home component commits. Its hero is seeded
  // from the embedded CMS data and therefore matches the visible snapshot.
  if (prerendered && window.location.pathname === '/') {
    root.id = 'ump-prerender-snapshot'
    const runtimeRoot = document.createElement('div')
    runtimeRoot.id = 'root'
    runtimeRoot.setAttribute('aria-hidden', 'true')
    runtimeRoot.style.position = 'absolute'
    runtimeRoot.style.visibility = 'hidden'
    runtimeRoot.style.width = '100%'
    root.after(runtimeRoot)

    let revealed = false
    const revealRuntime = () => {
      if (revealed) return
      revealed = true
      runtimeRoot.removeAttribute('aria-hidden')
      runtimeRoot.style.removeProperty('position')
      runtimeRoot.style.removeProperty('visibility')
      runtimeRoot.style.removeProperty('width')
      root.remove()
    }
    window.addEventListener(HOME_RUNTIME_READY_EVENT, revealRuntime, { once: true })
    // If the lazy route fails, expose AppErrorBoundary's recovery UI rather
    // than leaving an inert snapshot on screen forever.
    window.setTimeout(revealRuntime, 15_000)
    createRoot(runtimeRoot).render(application)
  } else if (prerendered) {
    const appRoot = createRoot(root)
    flushSync(() => appRoot.render(application))
  } else {
    createRoot(root).render(application)
  }
})
