import { Trash2, Pencil, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { useState } from 'react'
import { getDueStatus, formatTime } from '../utils/dateHelpers'

const CATEGORY_LABELS = {
  work: 'Work', personal: 'Personal', health: 'Health', study: 'Study',
}

const chipClass = {
  work: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  personal: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  health: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
  study: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
}

const PRIO_LABELS = { high: 'High', medium: 'Medium', low: 'Low' }
const PRIO_CHIP_COLORS = {
  high: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300',
  medium: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300',
  low: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300',
}

export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const [noteOpen, setNoteOpen] = useState(false)
  const dueStatus = getDueStatus(task)

  return (
    <div className={`task-card glass-card rounded-2xl px-4 py-3.5 mb-3 transition-colors ${task.done ? 'task-done opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          className="custom-check mt-0.5"
          checked={task.done}
          onChange={() => onToggle(task.id)}
          id={`task-${task.id}`}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <label
              htmlFor={`task-${task.id}`}
              className="task-title font-semibold text-slate-800 dark:text-slate-100 text-sm leading-snug cursor-pointer select-none"
            >
              {task.title}
            </label>
            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onEdit(task)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                aria-label="Edit task"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                aria-label="Delete task"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {task.category && (
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${chipClass[task.category]}`}>
                {CATEGORY_LABELS[task.category]}
              </span>
            )}

            {task.priority && (
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${PRIO_CHIP_COLORS[task.priority]}`}>
                {PRIO_LABELS[task.priority]}
              </span>
            )}

            {/* Due badge */}
            {dueStatus === 'overdue' && (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300">
                <Clock size={10} />
                {task.dueTime ? formatTime(task.dueTime) : 'Overdue'}
              </span>
            )}
            {dueStatus === 'soon' && (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                <Clock size={10} />
                Due {task.dueTime ? formatTime(task.dueTime) : 'soon'}
              </span>
            )}
            {!dueStatus && task.dueTime && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                <Clock size={10} />
                {formatTime(task.dueTime)}
              </span>
            )}

            {/* Note toggle */}
            {task.note && (
              <button
                onClick={() => setNoteOpen((o) => !o)}
                className="flex items-center gap-1 text-[11px] text-indigo-500 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors ml-auto"
              >
                {noteOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                Note
              </button>
            )}
          </div>

          {/* Expandable note */}
          {noteOpen && task.note && (
            <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700 animate-[fade-in_0.2s_ease]">
              {task.note}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
