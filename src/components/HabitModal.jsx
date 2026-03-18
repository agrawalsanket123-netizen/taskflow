import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { schedulePersistentReminder } from '../utils/fcm'

const PRESETS = [
  { title: '10,000 Steps', emoji: '🚶', targetValue: 10000, unit: 'steps' },
  { title: 'Drink 8 Glasses of Water', emoji: '💧', targetValue: 8, unit: 'glasses' },
  { title: 'Read 30 Minutes', emoji: '📚', targetValue: 30, unit: 'minutes' },
  { title: 'Workout', emoji: '🏋️', targetValue: 1, unit: 'session' },
  { title: 'Sleep 8 Hours', emoji: '😴', targetValue: 8, unit: 'hours' },
  { title: 'Meditate', emoji: '🧘', targetValue: 10, unit: 'minutes' },
]

const EMOJIS = ['🔥', '🚶', '💧', '📚', '🏋️', '😴', '🧘', '🍎', '💪', '🌿', '🎯', '✨']

const empty = () => ({
  id: uuidv4(),
  title: '',
  emoji: '🔥',
  intervalDays: 1,
  targetValue: '',
  unit: '',
  reminder: { enabled: false, intervalMinutes: 60 },
  createdAt: new Date().toISOString(),
})

export default function HabitModal({ open, habit, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(empty())
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(habit ? { 
        ...habit, 
        intervalDays: habit.intervalDays || 1,
        reminder: habit.reminder || { enabled: false, intervalMinutes: 60 } 
      } : empty())
      setError('')
    }
  }, [open, habit])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setReminder = (k, v) => setForm(f => ({ ...f, reminder: { ...f.reminder, [k]: v } }))

  const handleSave = () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    const savedHabit = { ...form, title: form.title.trim() }
    onSave(savedHabit)

    // Schedule Persistent Reminder
    if (savedHabit.reminder?.enabled) {
      schedulePersistentReminder(savedHabit.id, savedHabit.title, savedHabit.reminder.intervalMinutes)
    }

    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end animate-[fade-in_0.2s_ease]">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bottom-sheet bg-white dark:bg-slate-900 rounded-t-3xl shadow-modal px-5 pt-5 pb-8 max-h-[92vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
        <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mb-5" />

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {habit ? 'Edit Habit' : 'New Habit'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {!habit && (
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Quick Add Presets</label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.title}
                  onClick={() => setForm({ ...empty(), ...p })}
                  className="flex items-center gap-2 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all text-left group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">{p.emoji}</span>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">{p.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Habit Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => { set('title', e.target.value); setError('') }}
            placeholder="e.g. Morning Yoga"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />
          {error && <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Repeat Every (Days)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={form.intervalDays}
              onChange={(e) => set('intervalDays', parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Emoji Icon</label>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar h-[46px]">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => set('emoji', e)}
                  className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all
                    ${form.emoji === e ? 'bg-indigo-100 dark:bg-indigo-900 border-2 border-indigo-500 scale-110 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:bg-slate-100'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-5">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Goal (Value)</label>
            <input
              type="number"
              value={form.targetValue}
              onChange={(e) => set('targetValue', e.target.value)}
              placeholder="e.g. 10"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Unit</label>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => set('unit', e.target.value)}
              placeholder="e.g. glass"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>
        </div>

        {/* Reminder Section */}
        <div className="mb-8 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
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

        <div className="flex gap-3">
          {habit && (
            <button
              onClick={() => { onDelete(habit.id); onClose() }}
              className="w-14 h-14 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-rose-500 flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex-1 py-3.5 rounded-2xl btn-accent font-semibold text-sm h-14"
          >
            {habit ? 'Save Changes' : 'Create Habit'}
          </button>
        </div>
      </div>
    </div>
  )
}
