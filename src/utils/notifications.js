import { 
  getNotificationPreference, 
  getTasks, 
  getHabits, 
  getHabitCompletions,
  getReminders,
  saveReminders,
  getScheduledNotifications,
  saveScheduledNotifications
} from './storage'
import { todayStr } from './dateHelpers'

/**
 * Requests browser notification permission
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  const permission = await Notification.requestPermission()
  return permission
}

/**
 * Shows a browser notification using Service Worker
 */
export async function showNotification(title, body) {
  if (Notification.permission === 'granted' && getNotificationPreference()) {
    if ('serviceWorker' in navigator) {
      try {
        const sw = await navigator.serviceWorker.ready
        sw.showNotification(title, {
          body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          vibrate: [100, 50, 100],
          data: { url: window.location.origin }
        })
      } catch (e) {
        console.error('SW notification failed', e)
        new Notification(title, { body, icon: '/icons/icon-192.png' })
      }
    } else {
      new Notification(title, { body, icon: '/icons/icon-192.png' })
    }
  }
}

let activeReminders = new Map()

/**
 * Checks for tasks due now and triggers notifications
 * Also manages persistent reminders
 */
export function checkAndNotifyTasks() {
  if (Notification.permission !== 'granted' || !getNotificationPreference()) return

  const now = new Date()
  const today = todayStr()
  const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  
  const tasks = getTasks()
  const habits = getHabits()
  const completions = getHabitCompletions()
  const scheduled = getScheduledNotifications()

  // 1. Due Tasks
  const dueTasks = tasks.filter(t => t.date === today && t.dueTime === nowStr && !t.done)
  dueTasks.forEach(task => {
    const id = `${task.id}_${nowStr}`
    if (!scheduled.includes(id)) {
      showNotification(task.title, 'Due now!')
      saveScheduledNotifications([...scheduled, id])
    }
  })

  // 2. Persistent Reminders
  const reminders = getReminders()
  
  // Combine tasks and habits with reminders
  const itemsWithReminders = [
    ...tasks.map(t => ({ ...t, type: 'task' })),
    ...habits.map(h => ({ ...h, type: 'habit' }))
  ].filter(item => item.reminder?.enabled && (item.type === 'task' ? !item.done : !completions[`${item.id}_${today}`]))

  itemsWithReminders.forEach(item => {
    if (!activeReminders.has(item.id)) {
      const interval = setInterval(() => {
        // Re-check if item is done before firing
        const currentTasks = getTasks()
        const currentCompletions = getHabitCompletions()
        const isDone = item.type === 'task' 
          ? currentTasks.find(t => t.id === item.id)?.done 
          : currentCompletions[`${item.id}_${today}`]
        
        if (isDone) {
          clearInterval(activeReminders.get(item.id))
          activeReminders.delete(item.id)
        } else {
          showNotification(item.title, `Reminder: ${item.type === 'task' ? 'Task' : 'Habit'} still pending!`)
        }
      }, item.reminder.intervalMinutes * 60000)
      
      activeReminders.set(item.id, interval)
    }
  })

  // Cleanup reminders for items no longer needed or marked done
  activeReminders.forEach((interval, id) => {
    const item = itemsWithReminders.find(i => i.id === id)
    if (!item) {
      clearInterval(interval)
      activeReminders.delete(id)
    }
  })
}
