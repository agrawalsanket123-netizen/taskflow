import { supabase, getUserId } from './supabase'

// Sync task to Supabase (only if it has reminder or due time)
export async function syncTaskToSupabase(task) {
  if (!task.dueTime && !task.reminder?.enabled) return
  
  const userId = getUserId()
  const { error } = await supabase
    .from('tasks')
    .upsert({
      id: task.id,
      user_id: userId,
      title: task.title,
      category: task.category || 'work',
      priority: task.priority || 'medium',
      date: task.date,
      due_time: task.dueTime || null,
      note: task.note || '',
      done: task.done || false,
      reminder_enabled: task.reminder?.enabled || false,
      reminder_interval_minutes: task.reminder?.intervalMinutes || 60,
      updated_at: new Date().toISOString()
    })
  
  if (error) console.error('Sync error:', error)
}

// Remove task from Supabase
export async function removeTaskFromSupabase(taskId) {
  await supabase.from('tasks').delete().eq('id', taskId)
}

// Sync FCM token to Supabase
export async function syncFcmToken(token) {
  const userId = getUserId()
  const { error } = await supabase
    .from('fcm_tokens')
    .upsert({ user_id: userId, token, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  
  if (error) console.error('Token sync error:', error)
}

// Sync habit to Supabase
export async function syncHabitToSupabase(habit) {
  if (!habit.reminder?.enabled) return
  
  const userId = getUserId()
  await supabase
    .from('habits')
    .upsert({
      id: habit.id,
      user_id: userId,
      title: habit.title,
      emoji: habit.emoji || '🔥',
      interval_days: habit.intervalDays || 1,
      reminder_enabled: habit.reminder?.enabled || false,
      reminder_interval_minutes: habit.reminder?.intervalMinutes || 60,
    })
}

// Remove habit from Supabase
export async function removeHabitFromSupabase(habitId) {
  await supabase.from('habits').delete().eq('id', habitId)
}
