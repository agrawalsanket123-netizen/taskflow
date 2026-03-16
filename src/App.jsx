import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Today from './pages/Today'
import Week from './pages/Week'
import Habits from './pages/Habits'
import Health from './pages/Health'
import Notes from './pages/Notes'
import Settings from './pages/Settings'
import ThemeToggle from './components/ThemeToggle'
import { todayStr } from './utils/dateHelpers'
import { getTheme } from './utils/storage'
import { checkAndNotifyTasks } from './utils/notifications'

export default function App() {
  const [selectedDay, setSelectedDay] = useState(todayStr())

  useEffect(() => {
    const theme = getTheme()
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    }

    // Initial check and interval for notifications
    checkAndNotifyTasks()
    const interval = setInterval(checkAndNotifyTasks, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative pt-16 transition-colors duration-300">
        <div className="fixed top-2 right-4 z-[60]">
          <ThemeToggle />
        </div>
        <Routes>
          <Route path="/" element={
            <Today selectedDay={selectedDay} setSelectedDay={setSelectedDay} />
          } />
          <Route path="/week" element={
            <Week selectedDay={selectedDay} setSelectedDay={setSelectedDay} />
          } />
          <Route path="/habits" element={<Habits />} />
          <Route path="/health" element={<Health />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <Navbar />
      </div>
    </BrowserRouter>
  )
}
