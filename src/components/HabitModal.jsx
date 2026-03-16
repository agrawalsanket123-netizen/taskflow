import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

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
  targetValue: '',
  unit: '',
  createdAt: new Date().toISOString(),
})

export default function HabitModal({ open, habit, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(empty())
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(habit ? { ...habit } : empty())
      setError('')
    }
  }, [open, habit])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    onSave({ ...form, title: form.title.trim() })
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
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-tight">{p.title}</span>
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

        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Emoji Icon</label>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
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

        <div className="flex gap-3 mb-8">
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
