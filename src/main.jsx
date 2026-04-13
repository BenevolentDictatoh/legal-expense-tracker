import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TariffProvider } from './context/TariffContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TariffProvider>
      <App />
    </TariffProvider>
  </StrictMode>,
)
