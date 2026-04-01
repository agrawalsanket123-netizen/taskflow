import { CalendarDays, LayoutGrid, StickyNote, Flame, Heart, Settings, Bot } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Today', icon: CalendarDays, end: true },
  { to: '/week', label: 'Week', icon: LayoutGrid },
  { to: '/habits', label: 'Habits', icon: Flame },
  { to: '/health', label: 'Health', icon: Heart },
  { to: '/notes', label: 'Notes', icon: StickyNote },
  { to: '/assistant', label: 'AI', icon: Bot },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Navbar() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl transition-colors shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around px-1 py-3">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-2xl transition-all duration-200 min-w-[45px] relative
                ${isActive
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-all duration-200 ${isActive ? 'scale-110' : ''}`}
                  />
                  <span className={`text-[10px] font-bold tracking-tight transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                    {label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
