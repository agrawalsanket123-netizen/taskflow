import { getNotificationPreference, getTasks } from './storage'

/**
 * Requests browser notification permission
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  const permission = await Notification.requestPermission()
  return permission
}

/**
 * Shows a browser notification
 */
export function showNotification(title, body) {
  if (Notification.permission === 'granted' && getNotificationPreference()) {
    new Notification(title, { body, icon: '/pwa-192x192.png' })
  }
}

/**
 * Checks for tasks due now and triggers notifications
 * This should be called periodically (e.g. every minute)
 */
let scheduledNotifications = new Set()

export function checkAndNotifyTasks() {
  if (Notification.permission !== 'granted' || !getNotificationPreference()) return

  const now = new Date()
  const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  const today = format(now, 'yyyy-MM-dd')
  
  const tasks = getTasks()
  const dueTasks = tasks.filter(t => t.date === today && t.dueTime === nowStr && !t.done)

  dueTasks.forEach(task => {
    const taskId = `${task.id}_${nowStr}`
    if (!scheduledNotifications.has(taskId)) {
      showNotification(task.title, 'Due now!')
      scheduledNotifications.add(taskId)
      // Clear from set after 1 minute to allow re-notifying if needed (though time will have passed)
      setTimeout(() => scheduledNotifications.delete(taskId), 61000)
    }
  })
}

// Internal helper for simple date format
function format(date, fmt) {
  const d = new Date(date)
  if (fmt === 'yyyy-MM-dd') {
    return d.toISOString().split('T')[0]
  }
  return d.toString()
}
