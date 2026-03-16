import { Trash2, Pencil, FileText } from 'lucide-react'
import { formatRelative } from '../utils/dateHelpers'

export default function NoteCard({ note, onEdit, onDelete }) {
  return (
    <div className="task-card glass-card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-4 mb-3 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0">
            <FileText size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-snug truncate">
              {note.title || 'Untitled Note'}
            </h3>
            {note.body && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                {note.body}
              </p>
            )}
            <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              {formatRelative(note.updatedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(note)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
            aria-label="Edit note"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
            aria-label="Delete note"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
