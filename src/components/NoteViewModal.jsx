import { X, Pencil } from 'lucide-react'

export default function NoteViewModal({ open, note, onEdit, onClose }) {
  if (!open || !note) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end animate-[fade-in_0.2s_ease]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative bottom-sheet bg-white dark:bg-slate-900 rounded-t-3xl shadow-modal px-5 pt-5 pb-8 max-h-[92vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            View Note
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            {note.title || 'Untitled Note'}
          </h3>
          <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
            {note.body || <span className="italic text-slate-400">No content</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              onClose()
              onEdit(note)
            }}
            className="flex-1 py-3.5 rounded-2xl btn-accent font-semibold text-sm flex items-center justify-center gap-2"
          >
            <Pencil size={18} />
            Edit Note
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
