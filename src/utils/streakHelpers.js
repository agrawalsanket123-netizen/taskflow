import { dateToStr } from './dateHelpers'

/**
 * Calculates current streak for a habit
 * @param {string} habitId 
 * @param {Object} completions { habitId_YYYY-MM-DD: true }
 * @returns {number} streak count
 */
export function calculateStreak(habitId, completions) {
  let streak = 0
  let d = new Date()
  
  // If not completed today, check if it was completed yesterday to continue streak
  const todayKey = `${habitId}_${dateToStr(d)}`
  if (!completions[todayKey]) {
    d.setDate(d.getDate() - 1)
  }

  while (true) {
    const dStr = dateToStr(d)
    const key = `${habitId}_${dStr}`
    if (completions[key]) {
      streak++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}
