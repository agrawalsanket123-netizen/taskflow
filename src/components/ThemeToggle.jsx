import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getTheme, setTheme as saveTheme } from '../utils/storage'

export default function ThemeToggle() {
  const [theme, setThemeState] = useState(getTheme())

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    saveTheme(theme)
  }, [theme])

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  )
}
