import * as React from 'react'

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: 'light' | 'dark'
  storageKey?: string
}

const ThemeContext = React.createContext<{
  theme: 'light' | 'dark'
  toggleTheme: () => void
} | undefined>(undefined)

export function ThemeProvider({ 
  children, 
  defaultTheme = 'light',
  storageKey = 'video-editor-theme'
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(defaultTheme)

  // Load theme from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem(storageKey) as 'light' | 'dark' | null
    const initialTheme = stored || defaultTheme
    setTheme(initialTheme)
    applyTheme(initialTheme)
  }, [defaultTheme, storageKey])

  const applyTheme = (newTheme: 'light' | 'dark') => {
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
    localStorage.setItem(storageKey, newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
