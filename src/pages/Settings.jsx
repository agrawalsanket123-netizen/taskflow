import { useState, useEffect } from 'react'
import { Bell, BellOff, Settings as SettingsIcon, ShieldCheck, Info } from 'lucide-react'
import { getNotificationPreference, setNotificationPreference } from '../utils/storage'
import { requestNotificationPermission } from '../utils/notifications'

export default function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(getNotificationPreference())
  const [permissionStatus, setPermissionStatus] = useState(Notification.permission)

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      const status = await requestNotificationPermission()
      setPermissionStatus(status)
      if (status === 'granted') {
        setNotificationsEnabled(true)
        setNotificationPreference(true)
      } else if (status === 'denied') {
          alert('Notification permission denied. Please enable it in your browser settings to receive task reminders.')
      }
    } else {
      setNotificationsEnabled(false)
      setNotificationPreference(false)
    }
  }

  return (
    <div className="page-bg px-4 pt-6 pb-24 min-h-screen transition-colors">
      <div className="mb-8">
        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1">Preferences</p>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">Settings</h1>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">Notifications</h3>
          <div className="glass-card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors
                  ${notificationsEnabled ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                  {notificationsEnabled ? <Bell size={24} /> : <BellOff size={24} />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">Push Notifications</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">Get reminded when your tasks are due.</p>
                </div>
              </div>
              <button 
                onClick={handleToggleNotifications}
                className={`w-14 h-8 rounded-full relative transition-colors duration-300
                  ${notificationsEnabled ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-300
                  ${notificationsEnabled ? 'left-7' : 'left-1'}`} 
                />
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-xs font-medium">
              <span className="text-slate-400">System Status</span>
              <span className={`px-2.5 py-1 rounded-lg ${permissionStatus === 'granted' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {permissionStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">About TaskFlow</h3>
          <div className="glass-card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
              <ShieldCheck size={20} className="text-indigo-500" />
              <div className="text-xs">
                <p className="font-bold">Privacy First</p>
                <p className="text-slate-400">All data stays locally on your device.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
              <Info size={20} className="text-indigo-500" />
              <div className="text-xs">
                <p className="font-bold">Version 2.0</p>
                <p className="text-slate-400">Upgraded with Habits, Health, and Dark Mode.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-12 text-center">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Designed with ❤️ for Productivity</p>
      </div>
    </div>
  )
}
