import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/ibm-plex-sans-hebrew/hebrew-400.css'
import '@fontsource/ibm-plex-sans-hebrew/hebrew-600.css'
import '@fontsource/ibm-plex-sans-hebrew/latin-400.css'
import '@fontsource/ibm-plex-sans-hebrew/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import './design/tokens.css'
import './design/base.css'
import { App } from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
