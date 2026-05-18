import { StrictMode } from 'react'
import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import ToastManager from './components/Toast/ToastManager'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <ToastManager />
  </StrictMode>,
)
