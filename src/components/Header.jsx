import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="fixed top-0 inset-x-0 z-[60] bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-900 transition-colors">
      <div className="flex items-center justify-between px-5 h-16 pt-[env(safe-area-inset-top)]">
        <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          TaskFlow
        </h1>
        <ThemeToggle />
      </div>
    </header>
  )
}
