import { dateToStr } from './dateHelpers'

/**
 * Calculates current streak for a habit
 * @param {string} habitId 
 * @param {Object} completions { habitId_YYYY-MM-DD: true }
 * @param {number} intervalDays 
 * @returns {number} streak count
 */
export function calculateStreak(habitId, completions, intervalDays = 1) {
  let streak = 0
  let d = new Date()
  d.setHours(0, 0, 0, 0)
  
  const todayStr = dateToStr(d)
  const isCompletedToday = !!completions[`${habitId}_${todayStr}`]
  
  if (!isCompletedToday) {
    // If not completed today, find the most recent completion
    let foundRecent = false
    for (let i = 1; i <= intervalDays; i++) {
      const checkDate = new Date(d)
      checkDate.setDate(checkDate.getDate() - i)
      if (completions[`${habitId}_${dateToStr(checkDate)}`]) {
        d = checkDate
        foundRecent = true
        break
      }
    }
    if (!foundRecent) return 0
  }

  // Now d is at the latest completion. Start counting backwards.
  streak = 1
  let lastCompletionDate = new Date(d)
  
  while (true) {
    let foundPrevious = false
    // Look back from lastCompletionDate up to intervalDays
    for (let i = 1; i <= intervalDays; i++) {
      const checkDate = new Date(lastCompletionDate)
      checkDate.setDate(checkDate.getDate() - i)
      if (completions[`${habitId}_${dateToStr(checkDate)}`]) {
        streak++
        lastCompletionDate = checkDate
        foundPrevious = true
        break
      }
    }
    
    if (!foundPrevious) break
  }

  return streak
}
