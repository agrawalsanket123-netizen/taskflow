import { messaging } from '../firebase'
import { getToken, onMessage } from 'firebase/messaging'
import { syncFcmToken } from './sync'

// Request permission and get FCM token
export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;
    
    const currentToken = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
    if (currentToken) {
        console.log('FCM Token:', currentToken)
        localStorage.setItem('tf_fcm_token', currentToken)
        
        // Sync token to Supabase
        await syncFcmToken(currentToken)
        
        return currentToken
      }
  } catch (err) {
    console.error('FCM token error:', err);
    return null;
  }
}

// Listen for foreground messages
export function onForegroundMessage(callback) {
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
}

// Schedule a notification for a specific time
export function scheduleNotification(id, title, body, scheduledTime) {
  const delay = new Date(scheduledTime).getTime() - Date.now();
  if (delay <= 0) return;
  
  const schedule = JSON.parse(localStorage.getItem('tf_notification_schedule') || '{}');
  schedule[id] = { title, body, scheduledTime };
  localStorage.setItem('tf_notification_schedule', JSON.stringify(schedule));
  
  setTimeout(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(sw => {
        sw.showNotification(title, {
          body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          vibrate: [200, 100, 200],
          tag: id
        });
      });
    }
    // Remove from schedule after firing
    const s = JSON.parse(localStorage.getItem('tf_notification_schedule') || '{}');
    delete s[id];
    localStorage.setItem('tf_notification_schedule', JSON.stringify(s));
  }, delay);
}

// Cancel a scheduled notification
export function cancelNotification(id) {
  const schedule = JSON.parse(localStorage.getItem('tf_notification_schedule') || '{}');
  if (schedule[id]) {
    delete schedule[id];
    localStorage.setItem('tf_notification_schedule', JSON.stringify(schedule));
  }
}

// Schedule persistent reminder (fires every X minutes until task is done)
export function schedulePersistentReminder(id, title, intervalMinutes) {
  const intervalMs = intervalMinutes * 60 * 1000;
  
  const intervalId = setInterval(() => {
    // Check if task/habit is still not done
    const tasks = JSON.parse(localStorage.getItem('tf_tasks') || '[]');
    const habits = JSON.parse(localStorage.getItem('tf_habits') || '[]');
    const task = tasks.find(t => t.id === id);
    const habit = habits.find(h => h.id === id);
    
    if ((task && task.done) || (habit && habit.done)) {
      clearInterval(intervalId);
      return;
    }
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(sw => {
        sw.showNotification(title, {
          body: 'Reminder: This task is still pending!',
          icon: '/icons/icon-192.png',
          vibrate: [200, 100, 200],
          tag: `reminder-${id}`
        });
      });
    }
  }, intervalMs);
  
  // Store interval reference
  window._reminderIntervals = window._reminderIntervals || {};
  window._reminderIntervals[id] = intervalId;
}

// Stop persistent reminder
export function stopPersistentReminder(id) {
  if (window._reminderIntervals && window._reminderIntervals[id]) {
    clearInterval(window._reminderIntervals[id]);
    delete window._reminderIntervals[id];
  }
}
