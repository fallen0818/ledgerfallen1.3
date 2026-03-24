import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from './components/Shared/Toast'
import { ErrorBoundary } from './components/Shared/ErrorBoundary'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
)
