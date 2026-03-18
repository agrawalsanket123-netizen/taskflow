const CURRENT_VERSION = '2.1'

export function runMigrations() {
  const savedVersion = localStorage.getItem('tf_version')
  if (savedVersion === CURRENT_VERSION) return
  
  // Migration from v1.0 to v2.0
  if (!savedVersion || savedVersion === '1.0') {
    // Add priority field to existing tasks
    const rawTasks = localStorage.getItem('tf_tasks')
    if (rawTasks) {
      try {
        const tasks = JSON.parse(rawTasks)
        const migrated = tasks.map(t => ({ priority: 'medium', ...t }))
        localStorage.setItem('tf_tasks', JSON.stringify(migrated))
      } catch (e) {
        console.error('Migration 1.0 -> 2.0 failed', e)
      }
    }
  }
  
  // Migration from v2.0 to v2.1
  if (!savedVersion || savedVersion === '1.0' || savedVersion === '2.0') {
    // Add intervalDays field to existing habits
    const rawHabits = localStorage.getItem('tf_habits')
    if (rawHabits) {
      try {
        const habits = JSON.parse(rawHabits)
        const migrated = habits.map(h => ({ 
          intervalDays: 1, 
          reminder: { enabled: false, intervalMinutes: 60 },
          ...h 
        }))
        localStorage.setItem('tf_habits', JSON.stringify(migrated))
      } catch (e) {
        console.error('Migration 2.0 -> 2.1 (habits) failed', e)
      }
    }
    
    // Add reminder field to existing tasks
    const rawTasks = localStorage.getItem('tf_tasks')
    if (rawTasks) {
      try {
        const tasks = JSON.parse(rawTasks)
        const migratedTasks = tasks.map(t => ({ 
          reminder: { enabled: false, intervalMinutes: 60 }, 
          ...t 
        }))
        localStorage.setItem('tf_tasks', JSON.stringify(migratedTasks))
      } catch (e) {
        console.error('Migration 2.0 -> 2.1 (tasks) failed', e)
      }
    }
  }
  
  // Always update version at end
  localStorage.setItem('tf_version', CURRENT_VERSION)
}
