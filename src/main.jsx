import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

registerSW({ onOfflineReady() { console.log('DeepDive ready offline') } })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
