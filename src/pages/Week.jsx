import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, CheckCircle2, Search, X as CloseIcon, BarChart3, Clock, Target, Flame } from 'lucide-react'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import {
  getTasksForDate, addTask, updateTask, deleteTask, getTasks, getHabitCompletions, getHabits
} from '../utils/storage'
import {
  getWeekDays, nextWeek, prevWeek, isDateToday, dateToStr, formatDate,
} from '../utils/dateHelpers'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const CATEGORIES = ['All', 'Work', 'Personal', 'Health', 'Study']
const PRIO_SCORE = { high: 3, medium: 2, low: 1 }

export default function Week({ selectedDay, setSelectedDay }) {
  const [weekRef, setWeekRef] = useState(new Date())
  const [modal, setModal] = useState({ open: false, task: null })
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  const weekDays = useMemo(() => getWeekDays(weekRef), [weekRef])
  const allTasks = getTasks()
  const selectedDateStr = selectedDay || dateToStr(new Date())
  const dayTasks = useMemo(() => getTasksForDate(selectedDateStr), [selectedDateStr, refreshKey])

  const refresh = () => setRefreshKey(k => k + 1)

  const handleToggle = (id) => {
    const task = dayTasks.find(t => t.id === id)
    if (task) { updateTask(id, { done: !task.done }); refresh() }
  }
  const handleSave = (task) => {
    if (modal.task) updateTask(task.id, task)
    else addTask(task)
    refresh()
  }
  const handleDelete = (id) => { deleteTask(id); refresh() }

  const filteredDayTasks = useMemo(() => {
    return dayTasks
      .filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase())
        const matchesFilter = filter === 'All' || t.category?.toLowerCase() === filter.toLowerCase()
        return matchesSearch && matchesFilter
      })
      .sort((a, b) => (PRIO_SCORE[b.priority || 'medium'] - PRIO_SCORE[a.priority || 'medium']))
  }, [dayTasks, search, filter])

  // Stats calculation
  const stats = useMemo(() => {
    const weekStartStr = dateToStr(weekDays[0])
    const weekEndStr = dateToStr(weekDays[6])
    
    const weekTasks = allTasks.filter(t => t.date >= weekStartStr && t.date <= weekEndStr)
    const completed = weekTasks.filter(t => t.done).length
    const pending = weekTasks.filter(t => !t.done).length
    const rate = weekTasks.length > 0 ? Math.round((completed / weekTasks.length) * 100) : 0
    
    // Best streak (from habit completions)
    const completions = getHabitCompletions()
    const habits = getHabits()
    let maxStreak = 0
    
    habits.forEach(h => {
      let currentStreak = 0
      let d = new Date()
      while (true) {
        const dStr = dateToStr(d)
        if (completions[`${h.id}_${dStr}`]) {
          currentStreak++
          d.setDate(d.getDate() - 1)
        } else {
          // If it's today and not done, it might still continue from yesterday
          if (dStr === dateToStr(new Date())) {
            d.setDate(d.getDate() - 1)
            continue
          }
          break
        }
      }
      if (currentStreak > maxStreak) maxStreak = currentStreak
    })

    return { completed, pending, rate, maxStreak }
  }, [allTasks, weekDays, refreshKey])

  return (
    <div className="page-bg px-0 pt-6 pb-24 min-h-screen transition-colors">
      {/* Header */}
      <div className="px-4 mb-5">
        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1">Weekly View</p>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Plan Your Week</h1>
      </div>

      {/* Week strip */}
      <div className="px-4 mb-5">
        <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
          {/* Week nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setWeekRef(d => prevWeek(d))}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {formatDate(dateToStr(weekDays[0]))} – {formatDate(dateToStr(weekDays[6]))}
            </span>
            <button
              onClick={() => setWeekRef(d => nextWeek(d))}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              aria-label="Next week"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day columns */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, i) => {
              const dStr = dateToStr(day)
              const isSelected = dStr === selectedDateStr
              const isToday = isDateToday(day)
              const hasTasks = allTasks.some(t => t.date === dStr)

              return (
                <button
                  key={dStr}
                  onClick={() => setSelectedDay(dStr)}
                  className={`flex flex-col items-center py-2.5 px-1 rounded-xl transition-all duration-200
                    ${isSelected
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none scale-105'
                      : isToday
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-800'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                  <span className={`text-[10px] font-semibold uppercase tracking-wide
                    ${isSelected ? 'text-indigo-100' : isToday ? 'text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {DAY_NAMES[i]}
                  </span>
                  <span className={`text-sm font-bold mt-0.5 ${isSelected ? 'text-white' : ''}`}>
                    {day.getDate()}
                  </span>
                  {hasTasks && (
                    <span className={`w-1.5 h-1.5 rounded-full mt-1
                      ${isSelected ? 'bg-indigo-200' : 'bg-indigo-400'}`}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="px-4 mb-6 space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-11 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all
                ${filter === cat
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none scale-105'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-200'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Task list for selected day */}
      <div className="px-4 mb-10">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          {formatDate(selectedDateStr)}
        </p>

        {filteredDayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-3 text-indigo-300 dark:text-indigo-400">
              {search || filter !== 'All' ? <Search size={24} /> : <CheckCircle2 size={24} />}
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-sm">
              {search || filter !== 'All' ? 'No results found' : 'No tasks this day'}
            </p>
          </div>
        ) : (
          filteredDayTasks.map(task => (
            <TaskCard
              key={task.id + refreshKey}
              task={task}
              onToggle={handleToggle}
              onEdit={(t) => setModal({ open: true, task: t })}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Stats Section */}
      <div className="px-4 mb-6">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-indigo-500" />
          Weekly Productivity
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-emerald-500">
              <CheckCircle2 size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.completed}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-indigo-500">
              <Clock size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-amber-500">
              <Target size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Rate</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.rate}%</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-rose-500">
              <Flame size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Best Streak</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.maxStreak}d</p>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setModal({ open: true, task: null })}
        className="btn-accent fixed right-5 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl z-40 transition-transform active:scale-90"
        aria-label="Add task"
        style={{ bottom: 'calc(6.5rem + env(safe-area-inset-bottom))' }}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <TaskModal
        open={modal.open}
        task={modal.task}
        defaultDate={selectedDateStr}
        onSave={handleSave}
        onClose={() => setModal({ open: false, task: null })}
      />
    </div>
  )
}
