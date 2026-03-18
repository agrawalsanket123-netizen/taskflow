import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { todayStr } from '../utils/dateHelpers'

const CATEGORIES = ['work', 'personal', 'health', 'study']
const CAT_LABELS = { work: 'Work', personal: 'Personal', health: 'Health', study: 'Study' }
const CAT_COLORS = {
  work: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 ring-violet-400',
  personal: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-emerald-400',
  health: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 ring-rose-400',
  study: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-amber-400',
}

const PRIORITIES = ['high', 'medium', 'low']
const PRIO_LABELS = { high: 'High', medium: 'Medium', low: 'Low' }
const PRIO_COLORS = {
  high: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-red-400',
  medium: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-amber-400',
  low: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 ring-green-400',
}

const empty = (date) => ({
  id: uuidv4(),
  title: '',
  category: 'work',
  priority: 'medium',
  date: date || todayStr(),
  dueTime: '',
  note: '',
  done: false,
  reminder: { enabled: false, intervalMinutes: 60 },
  createdAt: new Date().toISOString(),
})

export default function TaskModal({ open, task, defaultDate, onSave, onClose }) {
  const [form, setForm] = useState(empty(defaultDate))
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(task ? { 
        priority: 'medium', 
        ...task, 
        reminder: task.reminder || { enabled: false, intervalMinutes: 60 } 
      } : empty(defaultDate))
      setError('')
    }
  }, [open, task, defaultDate])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setReminder = (k, v) => setForm(f => ({ ...f, reminder: { ...f.reminder, [k]: v } }))

  const handleSave = () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    onSave({ ...form, title: form.title.trim() })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end animate-[fade-in_0.2s_ease]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative bottom-sheet bg-white dark:bg-slate-900 rounded-t-3xl shadow-modal px-5 pt-5 pb-8 max-h-[92vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Title */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => { set('title', e.target.value); setError('') }}
            placeholder="What needs to be done?"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            autoFocus
          />
          {error && <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>}
        </div>

        {/* Category */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Category
          </label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => set('category', c)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border-2
                  ${form.category === c
                    ? `${CAT_COLORS[c]} ring-2 border-transparent shadow-sm scale-110`
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
              >
                {CAT_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Priority
          </label>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => set('priority', p)}
                className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all border-2
                  ${form.priority === p
                    ? `${PRIO_COLORS[p]} ring-2 border-transparent shadow-sm scale-105`
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
              >
                {PRIO_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Date + Time */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Due time
            </label>
            <input
              type="time"
              value={form.dueTime}
              onChange={(e) => set('dueTime', e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>
        </div>

        {/* Reminder Section */}
        <div className="mb-6 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Persistent Reminder</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Alerts until completed</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={form.reminder?.enabled}
                onChange={(e) => setReminder('enabled', e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          
          {form.reminder?.enabled && (
            <div className="animate-[fade-in_0.2s_ease]">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Remind me every (minutes)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={form.reminder?.intervalMinutes}
                  onChange={(e) => setReminder('intervalMinutes', parseInt(e.target.value) || 60)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                />
                <div className="flex gap-1">
                  {[15, 60, 120, 1440].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setReminder('intervalMinutes', m)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all
                        ${form.reminder?.intervalMinutes === m 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700'}`}
                    >
                      {m >= 1440 ? '1d' : m >= 60 ? `${m/60}h` : `${m}m`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Note */}
        <div className="mb-7">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Note <span className="text-slate-400 normal-case font-normal">(optional)</span>
          </label>
          <textarea
            value={form.note}
            onChange={(e) => set('note', e.target.value)}
            placeholder="Add a note…"
            rows={2}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3.5 rounded-2xl btn-accent font-semibold text-sm"
          >
            {task ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  )
}
