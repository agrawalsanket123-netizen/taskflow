import {
  format,
  parseISO,
  isToday,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isBefore,
  isAfter,
  addHours,
} from 'date-fns'

// ── Today as YYYY-MM-DD ────────────────────────────────────
export const todayStr = () => format(new Date(), 'yyyy-MM-dd')

// ── Format a YYYY-MM-DD string for display ─────────────────
export const formatDate = (dateStr) => {
  try { return format(parseISO(dateStr), 'EEE, d MMM') }
  catch { return dateStr }
}

export const formatDateShort = (dateStr) => {
  try { return format(parseISO(dateStr), 'd MMM') }
  catch { return dateStr }
}

// ── Full formatted date for header ────────────────────────
export const formatDateLong = (dateStr) => {
  try { return format(parseISO(dateStr), 'EEEE, d MMMM yyyy') }
  catch { return dateStr }
}

// ── Returns Mon–Sun Date[] for the week containing refDate ─
export const getWeekDays = (refDate = new Date()) => {
  const monday = startOfWeek(refDate, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

// ── Navigate week ──────────────────────────────────────────
export const nextWeek = (refDate) => addWeeks(refDate, 1)
export const prevWeek = (refDate) => subWeeks(refDate, 1)

// ── Is a Date today ────────────────────────────────────────
export const isDateToday = (date) => isToday(date)

// ── Date to YYYY-MM-DD ─────────────────────────────────────
export const dateToStr = (date) => format(date, 'yyyy-MM-dd')

// ── Due status: 'overdue' | 'soon' | null ─────────────────
export const getDueStatus = (task) => {
  if (task.done || !task.date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Build due datetime
  let dueDate
  try {
    dueDate = parseISO(task.date)
    if (task.dueTime) {
      const [h, m] = task.dueTime.split(':').map(Number)
      dueDate.setHours(h, m, 0, 0)
    } else {
      dueDate.setHours(23, 59, 59, 0)
    }
  } catch { return null }

  const now = new Date()
  if (isBefore(dueDate, now)) return 'overdue'
  if (isBefore(dueDate, addHours(now, 24))) return 'soon'
  return null
}

// ── Does this date string have any tasks ───────────────────
export const hasTasksOnDate = (tasks, dateStr) =>
  tasks.some((t) => t.date === dateStr)

// ── Format time for display ────────────────────────────────
export const formatTime = (timeStr) => {
  if (!timeStr) return ''
  try {
    const [h, m] = timeStr.split(':').map(Number)
    const d = new Date()
    d.setHours(h, m)
    return format(d, 'h:mm a')
  } catch { return timeStr }
}

// ── Format relative timestamp ──────────────────────────────
export const formatRelative = (isoStr) => {
  try {
    const diff = Date.now() - new Date(isoStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  } catch { return '' }
}
