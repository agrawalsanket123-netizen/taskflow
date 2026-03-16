import { useState, useCallback, useMemo } from 'react'
import { Plus, CheckCircle2, Search, X as CloseIcon } from 'lucide-react'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import {
  getTasksForDate, addTask, updateTask, deleteTask,
} from '../utils/storage'
import { formatDateLong, todayStr } from '../utils/dateHelpers'

const CATEGORIES = ['All', 'Work', 'Personal', 'Health', 'Study']
const PRIO_SCORE = { high: 3, medium: 2, low: 1 }

export default function Today({ selectedDay, setSelectedDay }) {
  const dateStr = selectedDay || todayStr()
  const [tasks, setTasks] = useState(() => getTasksForDate(dateStr))
  const [modal, setModal] = useState({ open: false, task: null })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  const refresh = useCallback(() => {
    setTasks(getTasksForDate(dateStr))
  }, [dateStr])

  // When selectedDay changes, refresh tasks
  useState(() => { refresh() }, [dateStr])

  const handleToggle = (id) => { updateTask(id, { done: !tasks.find(t => t.id === id)?.done }); refresh() }
  const handleSave = (task) => {
    if (modal.task) updateTask(task.id, task)
    else addTask(task)
    refresh()
  }
  const handleDelete = (id) => { deleteTask(id); refresh() }

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase())
        const matchesFilter = filter === 'All' || t.category?.toLowerCase() === filter.toLowerCase()
        return matchesSearch && matchesFilter
      })
      .sort((a, b) => (PRIO_SCORE[b.priority || 'medium'] - PRIO_SCORE[a.priority || 'medium']))
  }, [tasks, search, filter])

  const doneTasks = filteredTasks.filter(t => t.done)
  const pendingTasks = filteredTasks.filter(t => !t.done)

  return (
    <div className="page-bg px-4 pt-6 pb-24 min-h-screen transition-colors">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1">Today</p>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
          {formatDateLong(dateStr)}
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {pendingTasks.length} pending
          </span>
          {doneTasks.length > 0 && (
            <>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-sm text-emerald-500 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 size={13} /> {doneTasks.length} done
              </span>
            </>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 space-y-4">
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
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4 text-indigo-300 dark:text-indigo-400">
            {search || filter !== 'All' ? <Search size={32} /> : <CheckCircle2 size={32} />}
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
            {search || filter !== 'All' ? 'No results found' : 'No tasks for today'}
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            {search || filter !== 'All' ? 'Try adjusting your search or filters' : 'Tap + to add your first task'}
          </p>
        </div>
      ) : (
        <>
          {pendingTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onEdit={(t) => setModal({ open: true, task: t })}
              onDelete={handleDelete}
            />
          ))}
          {doneTasks.length > 0 && (
            <>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-5 mb-3 px-1">
                Completed
              </p>
              {doneTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onEdit={(t) => setModal({ open: true, task: t })}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}
        </>
      )}

      {/* FAB */}
      <button
        onClick={() => setModal({ open: true, task: null })}
        className="btn-accent fixed bottom-8 right-5 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl z-40"
        aria-label="Add task"
        style={{ bottom: 'calc(6.5rem + env(safe-area-inset-bottom))' }}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <TaskModal
        open={modal.open}
        task={modal.task}
        defaultDate={dateStr}
        onSave={handleSave}
        onClose={() => setModal({ open: false, task: null })}
      />
    </div>
  )
}
