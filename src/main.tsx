import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './AppRoutes'
import { AccountProvider } from './account/AccountProvider'
import { PreferencesProvider } from './preferences/PreferencesProvider'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AccountProvider>
      <PreferencesProvider>
        <AppRoutes />
      </PreferencesProvider>
      </AccountProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
