import { useState, useEffect } from 'react'
import { Bell, BellOff, Settings as SettingsIcon, ShieldCheck, Info, Copy, CheckCircle2 } from 'lucide-react'
import { getNotificationPreference, setNotificationPreference, getGeminiApiKey, setGeminiApiKey, getGeminiModel, setGeminiModel } from '../utils/storage'
import { requestNotificationPermission } from '../utils/fcm'
import { Bot } from 'lucide-react'

export default function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(getNotificationPreference())
  const [permissionStatus, setPermissionStatus] = useState(Notification.permission)
  const [fcmToken, setFcmToken] = useState(localStorage.getItem('tf_fcm_token'))
  const [copied, setCopied] = useState(false)
  const [geminiKey, setGeminiKeyLocal] = useState(getGeminiApiKey())
  const [geminiModel, setGeminiModelLocal] = useState(getGeminiModel())

  const handleSaveGeminiKey = (e) => {
    const val = e.target.value
    setGeminiKeyLocal(val)
    setGeminiApiKey(val)
  }

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      const token = await requestNotificationPermission()
      const status = Notification.permission
      setPermissionStatus(status)
      
      if (status === 'granted' && token) {
        setNotificationsEnabled(true)
        setNotificationPreference(true)
        setFcmToken(token)
      } else if (status === 'denied') {
        alert('Notification permission denied. Please enable it in your browser settings to receive task reminders.')
      }
    } else {
      setNotificationsEnabled(false)
      setNotificationPreference(false)
    }
  }

  const copyToken = () => {
    if (fcmToken) {
      navigator.clipboard.writeText(fcmToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
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
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">Get real-time alerts even when the app is closed.</p>
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
            
            <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-400">System Status</span>
                <span className={`px-2.5 py-1 rounded-lg ${permissionStatus === 'granted' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {permissionStatus.toUpperCase()}
                </span>
              </div>

              {fcmToken && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FCM Device Token</span>
                    <button onClick={copyToken} className="text-indigo-500 hover:text-indigo-600 transition-colors">
                      {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 break-all line-clamp-2">
                    {fcmToken}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">AI Integration</h3>
          <div className="glass-card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center shrink-0">
                <Bot size={20} />
              </div>
              <div className="w-full">
                <p className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">Google Gemini API Key</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                  Required for TaskFlow AI. Get your free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 underline">Google AI Studio</a>.
                </p>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={handleSaveGeminiKey}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono mb-4"
                />
                <p className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1 mt-2">AI Model</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Choose the Gemini model that powers your assistant.</p>
                <select
                  value={geminiModel}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGeminiModelLocal(val);
                    setGeminiModel(val);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Max Speed & High Limit)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Max Intelligence)</option>
                </select>
              </div>
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
                <p className="font-bold">Version 3.0</p>
                <p className="text-slate-400">Powered by Google Gemini 1.5.</p>
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
