// ── Storage keys ──────────────────────────────────────────
const TASKS_KEY = 'tf_tasks'
const NOTES_KEY = 'tf_notes'
const THEME_KEY = 'tf_theme'
const HABITS_KEY = 'tf_habits'
const HABIT_COMPLETIONS_KEY = 'tf_habit_completions'
const TARGET_WEIGHT_KEY = 'tf_target_weight'
const WEIGHT_LOG_KEY = 'tf_weight_log'
const NOTIFICATIONS_KEY = 'tf_notifications'

// ── Helpers ───────────────────────────────────────────────
const parse = (key, fallback = []) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : fallback
  } catch {
    return fallback
  }
}
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data))

// ── Tasks ─────────────────────────────────────────────────
export const getTasks = () => parse(TASKS_KEY)

export const getTasksForDate = (dateStr) =>
  getTasks().filter((t) => t.date === dateStr)

export const addTask = (task) => {
  const tasks = getTasks()
  save(TASKS_KEY, [...tasks, task])
}

export const updateTask = (id, patch) => {
  const tasks = getTasks().map((t) => (t.id === id ? { ...t, ...patch } : t))
  save(TASKS_KEY, tasks)
}

export const deleteTask = (id) => {
  save(TASKS_KEY, getTasks().filter((t) => t.id !== id))
}

export const saveTasks = (tasks) => save(TASKS_KEY, tasks)

// ── Notes ─────────────────────────────────────────────────
export const getNotes = () => parse(NOTES_KEY)

export const addNote = (note) => {
  save(NOTES_KEY, [...getNotes(), note])
}

export const updateNote = (id, patch) => {
  const notes = getNotes().map((n) => (n.id === id ? { ...n, ...patch } : n))
  save(NOTES_KEY, notes)
}

export const deleteNote = (id) => {
  save(NOTES_KEY, getNotes().filter((n) => n.id !== id))
}

// ── Theme ─────────────────────────────────────────────────
export const getTheme = () => localStorage.getItem(THEME_KEY) || 'light'
export const setTheme = (theme) => localStorage.setItem(THEME_KEY, theme)

// ── Habits ────────────────────────────────────────────────
export const getHabits = () => parse(HABITS_KEY)
export const saveHabits = (habits) => save(HABITS_KEY, habits)
export const addHabit = (habit) => save(HABITS_KEY, [...getHabits(), habit])

export const getHabitCompletions = () => parse(HABIT_COMPLETIONS_KEY, {})
export const saveHabitCompletions = (completions) => save(HABIT_COMPLETIONS_KEY, completions)
export const toggleHabitCompletion = (habitId, dateStr) => {
  const completions = getHabitCompletions()
  const key = `${habitId}_${dateStr}`
  if (completions[key]) {
    delete completions[key]
  } else {
    completions[key] = true
  }
  saveHabitCompletions(completions)
}

// ── Weight ────────────────────────────────────────────────
export const getTargetWeight = () => localStorage.getItem(TARGET_WEIGHT_KEY) || ''
export const setTargetWeight = (weight) => localStorage.setItem(TARGET_WEIGHT_KEY, weight)

export const getWeightLog = () => parse(WEIGHT_LOG_KEY)
export const logWeight = (entry) => {
  const log = getWeightLog()
  const existingIndex = log.findIndex(e => e.date === entry.date)
  if (existingIndex > -1) {
    log[existingIndex] = entry
  } else {
    log.push(entry)
  }
  save(WEIGHT_LOG_KEY, log.sort((a, b) => a.date.localeCompare(b.date)))
}

// ── Notifications ─────────────────────────────────────────
export const getNotificationPreference = () => localStorage.getItem(NOTIFICATIONS_KEY) === 'true'
export const setNotificationPreference = (pref) => localStorage.setItem(NOTIFICATIONS_KEY, pref)

