import { useState, useMemo } from 'react'
import { Plus, Flame, Sparkles } from 'lucide-react'
import { 
  getHabits, saveHabits, getHabitCompletions, toggleHabitCompletion 
} from '../utils/storage'
import { todayStr } from '../utils/dateHelpers'
import { calculateStreak } from '../utils/streakHelpers'
import { HabitCard } from '../components/HabitCard'
import HabitModal from '../components/HabitModal'

export default function Habits() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [modal, setModal] = useState({ open: false, habit: null })
  
  const habits = getHabits()
  const completions = getHabitCompletions()
  const today = todayStr()

  const refresh = () => setRefreshKey(k => k + 1)

  const handleToggle = (id) => {
    toggleHabitCompletion(id, today)
    refresh()
  }

  const handleSave = (habit) => {
    const current = getHabits()
    if (modal.habit) {
      saveHabits(current.map(h => h.id === habit.id ? habit : h))
    } else {
      saveHabits([...current, habit])
    }
    refresh()
  }

  const handleDelete = (id) => {
    saveHabits(getHabits().filter(h => h.id !== id))
    refresh()
  }

  const sortedHabits = useMemo(() => {
    return [...habits].sort((a, b) => {
      const aDone = completions[`${a.id}_${today}`]
      const bDone = completions[`${b.id}_${today}`]
      if (aDone === bDone) return 0
      return aDone ? 1 : -1
    })
  }, [habits, completions, today, refreshKey])

  const stats = useMemo(() => {
    const total = habits.length
    const done = habits.filter(h => completions[`${h.id}_${today}`]).length
    const percent = total > 0 ? Math.round((done / total) * 100) : 0
    return { total, done, percent }
  }, [habits, completions, today, refreshKey])

  return (
    <div className="page-bg px-4 pt-6 pb-24 min-h-screen transition-colors">
      <div className="mb-6">
        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1">Daily Routine</p>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">Habit Tracker</h1>
        
        {habits.length > 0 && (
          <div className="mt-4 glass-card bg-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-200 dark:shadow-none overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-wider">Today's Progress</p>
                  <p className="text-2xl font-black">{stats.percent}%</p>
                </div>
                <p className="text-sm font-bold text-indigo-100">{stats.done}/{stats.total} habits</p>
              </div>
              <div className="h-2 bg-indigo-400/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${stats.percent}%` }}
                />
              </div>
            </div>
            <Sparkles className="absolute -right-2 -bottom-2 text-indigo-400/20" size={80} />
          </div>
        )}
      </div>

      <div className="space-y-1 mb-4">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
          Your Habits
        </p>
      </div>

      {habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-4 text-rose-300 dark:text-rose-400">
            <Flame size={32} />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Start a new streak</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Consistency is key. Add your first habit!</p>
        </div>
      ) : (
        <div className="animate-[fade-in_0.3s_ease]">
          {sortedHabits.map((habit) => (
            <HabitCard
              key={habit.id + refreshKey}
              habit={habit}
              isCompleted={!!completions[`${habit.id}_${today}`]}
              streak={calculateStreak(habit.id, completions)}
              onToggle={handleToggle}
              onClick={() => setModal({ open: true, habit })}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setModal({ open: true, habit: null })}
        className="btn-accent fixed bottom-8 right-5 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl z-40"
        aria-label="Add habit"
        style={{ bottom: 'calc(6.5rem + env(safe-area-inset-bottom))' }}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <HabitModal
        open={modal.open}
        habit={modal.habit}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => setModal({ open: false, habit: null })}
      />
    </div>
  )
}
