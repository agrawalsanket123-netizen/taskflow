import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Persistent User ID for sync
export const getUserId = () => {
  let userId = localStorage.getItem('tf_user_id')
  if (!userId) {
    userId = crypto.randomUUID()
    localStorage.setItem('tf_user_id', userId)
  }
  return userId
}
