import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App.tsx'
import ThemeProvider from '@/src/providers/theme.tsx'

import '../styles/base.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
