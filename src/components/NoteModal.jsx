import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

const emptyNote = () => ({
  id: uuidv4(),
  title: '',
  body: '',
  updatedAt: new Date().toISOString(),
})

export default function NoteModal({ open, note, onSave, onClose }) {
  const [form, setForm] = useState(emptyNote())
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(note ? { ...note } : emptyNote())
      setError('')
    }
  }, [open, note])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    onSave({ ...form, title: form.title.trim(), updatedAt: new Date().toISOString() })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end animate-[fade-in_0.2s_ease]">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bottom-sheet bg-white dark:bg-slate-900 rounded-t-3xl shadow-modal px-5 pt-5 pb-8 max-h-[92vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {note ? 'Edit Note' : 'New Note'}
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
            placeholder="Note title"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            autoFocus
          />
          {error && <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>}
        </div>

        {/* Body */}
        <div className="mb-7">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Content
          </label>
          <textarea
            value={form.body}
            onChange={(e) => set('body', e.target.value)}
            placeholder="Write your note here…"
            rows={7}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
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
            {note ? 'Save Changes' : 'Add Note'}
          </button>
        </div>
      </div>
    </div>
  )
}
