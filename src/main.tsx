import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import CountryPage from './pages/CountryPage'
import AccountPage from './pages/AccountPage'
import { AccountProvider } from './account/AccountProvider'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AccountProvider>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/country/:name" element={<CountryPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Routes>
      </AccountProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
