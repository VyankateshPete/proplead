import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { AppDataProvider } from './context/AppDataContext'
import { ScoringConfigProvider } from './context/ScoringConfigContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ScoringConfigProvider>
        <AppDataProvider>
          <App />
        </AppDataProvider>
      </ScoringConfigProvider>
    </BrowserRouter>
  </StrictMode>,
)
