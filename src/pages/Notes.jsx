import { useState } from 'react'
import { Plus, StickyNote } from 'lucide-react'
import NoteCard from '../components/NoteCard'
import NoteModal from '../components/NoteModal'
import { getNotes, addNote, updateNote, deleteNote } from '../utils/storage'

export default function Notes() {
  const [notes, setNotes] = useState(() => getNotes().slice().reverse())
  const [modal, setModal] = useState({ open: false, note: null })

  const refresh = () => setNotes(getNotes().slice().reverse())

  const handleSave = (note) => {
    if (modal.note) updateNote(note.id, note)
    else addNote(note)
    refresh()
  }
  const handleDelete = (id) => { deleteNote(id); refresh() }

  return (
    <div className="page-bg px-4 pt-6 pb-24 min-h-screen transition-colors">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1">Notes</p>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Notes</h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
            <StickyNote size={32} className="text-indigo-300 dark:text-indigo-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No notes yet</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Tap + to write your first note</p>
        </div>
      ) : (
        notes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            onEdit={(n) => setModal({ open: true, note: n })}
            onDelete={handleDelete}
          />
        ))
      )}

      {/* FAB */}
      <button
        onClick={() => setModal({ open: true, note: null })}
        className="btn-accent fixed right-5 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl z-40"
        aria-label="Add note"
        style={{ bottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <NoteModal
        open={modal.open}
        note={modal.note}
        onSave={handleSave}
        onClose={() => setModal({ open: false, note: null })}
      />
    </div>
  )
}
