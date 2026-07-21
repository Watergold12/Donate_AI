import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './store/AuthProvider'
import { ToastProvider } from './store/ToastProvider'

const savedTheme = localStorage.getItem('theme') ?? 'dark'
document.documentElement.classList.remove('light', 'dark')
document.documentElement.classList.add(savedTheme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)
