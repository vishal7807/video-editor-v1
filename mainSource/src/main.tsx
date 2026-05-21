import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import App from './App'
// @ts-ignore: CSS import type declarations are not available in this project
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark">
      <Router>
        <App />
      </Router>
    </ThemeProvider>
  </React.StrictMode>,
)
