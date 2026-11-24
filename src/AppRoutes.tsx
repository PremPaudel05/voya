import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import App from './App'

// Each page downloads only when it is visited, so the home page stays light.
const CountryPage = lazy(() => import('./pages/CountryPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const AboutDeveloperPage = lazy(() => import('./pages/AboutDeveloperPage'))

// Fetch the country page in idle time, so the first search does not wait for its code.
const warmCountryPage = () => { void import('./pages/CountryPage') }
if ('requestIdleCallback' in window) window.requestIdleCallback(warmCountryPage, { timeout: 4000 })
else setTimeout(warmCountryPage, 2500)

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" aria-busy="true" />}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/country/:name" element={<CountryPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/about-developer" element={<AboutDeveloperPage />} />
      </Routes>
    </Suspense>
  )
}
