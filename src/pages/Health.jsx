import { useState, useMemo } from 'react'
import { Heart, Plus, Target, TrendingDown, Scale } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { getWeightLog, logWeight, getTargetWeight, setTargetWeight as saveTarget } from '../utils/storage'
import { todayStr, formatDateShort } from '../utils/dateHelpers'

export default function Health() {
  const [weightInput, setWeightInput] = useState('')
  const [targetInput, setTargetInput] = useState(getTargetWeight())
  const [refreshKey, setRefreshKey] = useState(0)

  const log = getWeightLog()
  const target = parseFloat(targetInput) || 0

  const refresh = () => setRefreshKey(k => k + 1)

  const handleLogWeight = () => {
    const w = parseFloat(weightInput)
    if (isNaN(w) || w <= 0) return
    logWeight({ date: todayStr(), weight: w })
    setWeightInput('')
    refresh()
  }

  const handleSaveTarget = () => {
    saveTarget(targetInput)
    refresh()
  }

  const chartData = useMemo(() => {
    return log.map(entry => ({
      ...entry,
      formattedDate: formatDateShort(entry.date)
    }))
  }, [log, refreshKey])

  const stats = useMemo(() => {
    if (log.length === 0) return null
    const latest = log[log.length - 1].weight
    const first = log[0].weight
    const diff = target > 0 ? (latest - target).toFixed(1) : null
    const progress = (first - latest).toFixed(1)
    return { latest, first, diff, progress }
  }, [log, target, refreshKey])

  return (
    <div className="page-bg px-4 pt-6 pb-24 min-h-screen transition-colors">
      <div className="mb-6">
        <p className="text-xs font-semibold text-rose-500 uppercase tracking-widest mb-1">Health & Wellness</p>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">Weight Tracker</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass-card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Current Weight</label>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats?.latest || '--'}</span>
            <span className="text-xs font-bold text-slate-400 mb-1">kg</span>
          </div>
        </div>
        <div className="glass-card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Target Goal</label>
          <div className="flex items-center gap-2">
            <input 
              type="number"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              onBlur={handleSaveTarget}
              placeholder="Set"
              className="w-full bg-transparent text-2xl font-black text-slate-800 dark:text-slate-100 focus:outline-none"
            />
            <span className="text-xs font-bold text-slate-400">kg</span>
          </div>
        </div>
      </div>

      {log.length > 0 && (
        <div className="glass-card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 mb-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Progress Chart</h3>
            {stats?.progress !== '0.0' && (
              <div className={`flex items-center gap-1 text-xs font-bold ${parseFloat(stats?.progress) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                <TrendingDown size={14} className={parseFloat(stats?.progress) < 0 ? 'rotate-180' : ''} />
                {Math.abs(stats?.progress)} kg lost
              </div>
            )}
          </div>
          
          <div className="h-48 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="formattedDate" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  hide 
                  domain={['dataMin - 2', 'dataMax + 2']} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
                {target > 0 && (
                  <ReferenceLine y={target} stroke="#f43f5e" strokeDasharray="5 5" strokeWidth={2} opacity={0.5} />
                )}
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#6366f1" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="glass-card bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none mb-6">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <Scale size={18} />
          Log Today's Weight
        </h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input 
              type="number"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder="00.0"
              className="w-full bg-white/20 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 font-bold focus:outline-none focus:ring-2 focus:ring-white/50 transition"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white/50">kg</span>
          </div>
          <button 
            onClick={handleLogWeight}
            className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-50 transition active:scale-95 shadow-lg"
          >
            <Plus size={18} />
            Log
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-rose-500">
            <Target size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">To Goal</span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {stats?.diff ? `${stats.diff < 0 ? '+' : ''}${Math.abs(stats.diff)}` : '--'}
            <span className="text-xs ml-1">kg</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-indigo-500">
            <Scale size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Start</span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {stats?.first || '--'}
            <span className="text-xs ml-1">kg</span>
          </p>
        </div>
      </div>
    </div>
  )
}
