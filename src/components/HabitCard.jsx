import { Flame, CheckCircle2 } from 'lucide-react'

export function HabitCard({ habit, isCompleted, onToggle, onClick, streak, dueDays }) {
  const isDue = dueDays <= 0

  return (
    <div 
      onClick={onClick}
      className={`glass-card rounded-2xl p-4 mb-3 flex items-center gap-4 transition-all active:scale-95 cursor-pointer
        ${isCompleted 
          ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/50' 
          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl
        ${isCompleted ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-slate-50 dark:bg-slate-800'}`}>
        {habit.emoji || '🔥'}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className={`font-bold text-sm truncate ${isCompleted ? 'text-indigo-600 dark:text-indigo-400 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
          {habit.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
          <div className="flex items-center gap-1 text-[11px] font-bold text-rose-500">
            <Flame size={12} fill="currentColor" />
            {streak} day streak
          </div>
          {habit.intervalDays > 1 && (
            <span className="text-[11px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
              Every {habit.intervalDays} days
            </span>
          )}
          {habit.targetValue && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Goal: {habit.targetValue} {habit.unit}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        {isDue ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle(habit.id)
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
              ${isCompleted 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-none' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-500'}`}
          >
            <CheckCircle2 size={20} />
          </button>
        ) : (
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-400 dark:text-slate-500">
            Due in {dueDays} {dueDays === 1 ? 'day' : 'days'}
          </div>
        )}
      </div>
    </div>
  )
}
