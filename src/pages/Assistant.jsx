import { useState, useEffect, useRef } from 'react'
import { Bot, Send, Sparkles, Loader2, ArrowRight } from 'lucide-react'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { v4 as uuidv4 } from 'uuid'
import { getGeminiApiKey, getGeminiModel, getChatHistory, saveChatHistory, getTasks, addTask, updateTask, addNote } from '../utils/storage'
import { todayStr } from '../utils/dateHelpers'
import { useNavigate } from 'react-router-dom'

export default function Assistant() {
  const [messages, setMessages] = useState(getChatHistory())
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [apiKey] = useState(getGeminiApiKey())
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [cooldown])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    saveChatHistory(messages)
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !apiKey || cooldown > 0) return

    const userMsg = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsTyping(true)

    try {
      const currentApiKey = getGeminiApiKey()
      const selectedModelName = getGeminiModel()

      if (!currentApiKey) {
        setMessages(prev => [...prev, { role: 'assistant', content: "🔑 **Missing API Key!**\n\nPlease go to **Settings** and add your free Google Gemini API key to start using the AI Planner." }])
        setIsTyping(false)
        return
      }

      const genAI = new GoogleGenerativeAI(currentApiKey)
      
      const systemInstruction = {
        parts: [{ text: `You are TaskFlow AI, an intelligent, positive, and proactive productivity assistant.
Your goal is to help the user break down their goals, organize their month/week, and schedule tasks effectively.
Current Date: ${todayStr()}

Context of user's current tasks (ID, Title, Date, Completed, Priority):
${JSON.stringify(getTasks().map(t => ({ id: t.id, title: t.title, date: t.date, completed: t.completed, priority: t.priority })))}

You are equipped with tools to schedule tasks and create long-form notes.
CRITICAL LIMITS: To avoid API payload limits, do NOT schedule more than 14 tasks in a single response. If the user requests a full month, schedule 14 days and ask if they want the rest.
NOTES vs TASKS: 
- Use **create_tasks** for actionable items with dates.
- Use **create_note** for static information, goals, or observations (e.g., "Weight loss starting stats", "Vegetarian diet preferences", "My name is Sanket").
- Use **update_tasks** to modify existing items.
If the user says "add to my notes", and it's a general fact, use **create_note**.` }]
      }

      const tools = [
        {
          functionDeclarations: [
            {
              name: "create_tasks",
              description: "Creates one or more scheduled tasks in the user's task tracker.",
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  tasks: {
                    type: SchemaType.ARRAY,
                    items: {
                      type: SchemaType.OBJECT,
                      properties: {
                        title: { type: SchemaType.STRING, description: "The task name/title" },
                        date: { type: SchemaType.STRING, description: "YYYY-MM-DD date string for scheduling" },
                        priority: { type: SchemaType.STRING, description: "Task priority: high, medium, low" },
                        category: { type: SchemaType.STRING, description: "Category enum: work, personal, health, study" },
                        note: { type: SchemaType.STRING, description: "Optional notes or details for the task" }
                      },
                      required: ["title", "date", "priority", "category"]
                    }
                  }
                },
                required: ["tasks"]
              }
            },
            {
              name: "update_tasks",
              description: "Updates any properties of existing tasks.",
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  updates: {
                    type: SchemaType.ARRAY,
                    items: {
                      type: SchemaType.OBJECT,
                      properties: {
                        id: { type: SchemaType.STRING, description: "The existing task id to update" },
                        title: { type: SchemaType.STRING, description: "New title (optional)" },
                        date: { type: SchemaType.STRING, description: "YYYY-MM-DD new date (optional)" },
                        priority: { type: SchemaType.STRING, description: "high, medium, low (optional)" },
                        category: { type: SchemaType.STRING, description: "work, personal, health, study (optional)" },
                        note: { type: SchemaType.STRING, description: "Appended or new notes (optional)" }
                      },
                      required: ["id"]
                    }
                  }
                },
                required: ["updates"]
              }
            },
            {
              name: "create_note",
              description: "Creates a permanent text note in the user's notebook.",
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING, description: "Short title for the note" },
                  body: { type: SchemaType.STRING, description: "Full content of the note" },
                  color: { type: SchemaType.STRING, description: "Optional: blue, purple, yellow, green, pink" }
                },
                required: ["title", "body"]
              }
            }
          ]
        }
      ]

      const model = genAI.getGenerativeModel({
        model: selectedModelName,
        systemInstruction: systemInstruction,
        tools: tools,
      })

      // Gemini strictly requires alternating user/model history
      const prevMessages = newMessages.slice(0, -1).filter(m => 
        !m.content.startsWith('**Error:**') && !m.content.startsWith('⚠️') && 
        !m.content.startsWith('⏳') && !m.content.startsWith('🛑') && !m.content.startsWith('🤯')
      )
      
      let safeHistory = []
      for (let i = prevMessages.length - 1; i >= 1; i--) {
        if (prevMessages[i].role === 'assistant' && prevMessages[i-1].role === 'user') {
          safeHistory.unshift({ role: 'model', parts: [{ text: prevMessages[i].content }] })
          safeHistory.unshift({ role: 'user', parts: [{ text: prevMessages[i-1].content }] })
          i-- // skip the user message we just processed
        }
        if (safeHistory.length >= 4) break // Keep max 2 full conversational pairs
      }

      const chat = model.startChat({ history: safeHistory })
      
      const result = await chat.sendMessage(input)
      const response = result.response
      
      const calls = response.functionCalls()

      if (calls && calls.length > 0) {
        setMessages(prev => [...prev, { role: 'assistant', content: "I'm scheduling these tasks for you right now..." }])
        
        let totalCreated = 0
        let totalUpdated = 0
        let totalNotes = 0

        for (const call of calls) {
          if (call.name === 'create_note') {
            try {
              const args = call.args;
              addNote({
                id: uuidv4(),
                title: args.title,
                body: args.body || args.content || args.text,
                color: args.color || 'blue',
                updatedAt: new Date().toISOString()
              })
              totalNotes++
            } catch (err) {
              console.error("Note tool error:", err)
            }
          } else if (call.name === 'create_tasks') {
            try {
              const args = call.args; // natively object in Gemini SDK
              if (args.tasks && Array.isArray(args.tasks)) {
                args.tasks.forEach(task => {
                  addTask({
                    id: uuidv4(),
                    title: task.title,
                    date: task.date,
                    priority: task.priority?.toLowerCase() || 'medium',
                    category: ['work', 'personal', 'health', 'study'].includes((task.category || '').toLowerCase()) ? task.category.toLowerCase() : 'personal',
                    completed: false,
                    hasTime: false,
                    time: '',
                    note: task.note || 'Scheduled by TaskFlow AI',
                    subtasks: [],
                    reminder: false
                  })
                  totalCreated++
                })
              }
            } catch (err) {
              console.error("Tool parse error:", err)
            }
          } else if (call.name === 'update_tasks' || call.name === 'reschedule_tasks') {
            try {
              const args = call.args;
              if (args.updates && Array.isArray(args.updates)) {
                args.updates.forEach(update => {
                  const payload = {}
                  if (update.title) payload.title = update.title
                  if (update.date) payload.date = update.date
                  if (update.priority) payload.priority = update.priority.toLowerCase()
                  if (update.category) payload.category = update.category.toLowerCase()
                  if (update.note) payload.note = update.note
                  
                  updateTask(update.id, payload)
                  totalUpdated++
                })
              }
            } catch (err) {
              console.error("Tool parse error:", err)
            }
          }
        }

        // We completely skip the second LLM API call to save latency and tokens!
        setMessages(prev => {
          const updated = [...prev]
          updated.pop() // Remove temporary message
          const actionText = []
          if (totalCreated > 0) actionText.push(`created ${totalCreated} new tasks`)
          if (totalUpdated > 0) actionText.push(`updated ${totalUpdated} tasks`)
          if (totalNotes > 0) actionText.push(`saved ${totalNotes} notes`)
          
          if (actionText.length > 0) {
            return [...updated, { role: 'assistant', content: `✅ Successfully ${actionText.join(' and ')} on your calendar! Let me know if you need to schedule anything else.` }]
          } else {
            return [...updated, { role: 'assistant', content: `⚠️ I tried to schedule tasks but validation failed. Could you try asking me to schedule just a few tasks at a time?` }]
          }
        })
      } else {
        let textResult = ""
        try {
          textResult = response.text()
        } catch (e) {
          textResult = "I've processed your request but couldn't generate a text summary. Please check your tasks for changes!"
        }
        setMessages(prev => [...prev, { role: 'assistant', content: textResult }])
      }

    } catch (error) {
      console.error("Gemini Error:", error)
      const errStr = error.message || ''
      let friendlyError = `⚠️ **AI Connection Error**\n\nSomething went wrong connecting to the AI. Check your internet or API key in Settings.`
      
      if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('exhausted')) {
        friendlyError = `🛑 **Token Limit Reached!**\n\nYou've somehow exhausted Google Gemini's massive free tier limit for this specific minute! Please wait 1 minute before trying again.`
      } else if (errStr.includes('400') || errStr.toLowerCase().includes('parse')) {
        friendlyError = `🤯 **AI formatting hiccup!**\n\nThe AI stumbled while trying to schedule tasks. Try asking it to schedule in smaller chunks!`
      } else if (errStr.includes('API key not valid')) {
        friendlyError = `🔑 **Invalid API Key!**\n\nYour Gemini API Key is invalid or missing. Go to settings and add a free Gemini API key from Google AI Studio.`
      }

      setMessages(prev => [...prev, { role: 'assistant', content: friendlyError }])
    } finally {
      setIsTyping(false)
      setCooldown(3) // 3 second anti-spam cooldown 
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!apiKey) {
    return (
      <div className="page-bg px-4 pt-6 pb-24 min-h-screen transition-colors flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center mb-6 shadow-sm">
          <Sparkles size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Welcome to TaskFlow AI</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-8">
          Powered by Google Gemini 2.5, your assistant can completely break down your goals into actionable daily schedules.
        </p>
        <button 
          onClick={() => navigate('/settings')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2"
        >
          Add Gemini API Key <ArrowRight size={18} />
        </button>
      </div>
    )
  }

  return (
    <div className="page-bg min-h-screen flex flex-col transition-colors absolute inset-0 pt-16 pb-[calc(env(safe-area-inset-bottom)+70px)]">
      {/* Header Area */}
      <div className="px-4 py-4 flex items-center justify-between border-b border-transparent">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            AI Planner
            <Sparkles size={18} className="text-yellow-500" />
          </h1>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-1">Gemini 2.5</p>
        </div>
        <button 
          onClick={() => {
            if(confirm('Clear entire chat history?')) {
              setMessages([])
            }
          }}
          className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors bg-white/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full"
        >
          CLEAR
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opcaity-60 mt-10">
            <Bot size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
            <p className="text-sm font-medium text-slate-400 max-w-[250px]">
              "I want to run 5k next month. Make a training plan for my first week."
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-bl-none'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot size={14} className="text-indigo-500" />
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">TaskFlow AI</span>
                  </div>
                )}
                <div className={`text-sm leading-relaxed prose prose-sm ${msg.role === 'user' ? 'prose-invert max-w-none text-white' : 'dark:prose-invert !max-w-none'}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-none p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Bot size={14} className="text-indigo-500" />
                <Loader2 size={14} className="text-indigo-500 animate-spin" />
                <span className="text-xs font-medium text-slate-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-4 bg-transparent border-t border-slate-100 dark:border-slate-800/50 mt-auto">
        <div className="relative flex items-end gap-2 bg-white dark:bg-slate-900 rounded-2xl p-2 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Plan my monthly goal..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none resize-none px-3 py-3 text-sm text-slate-800 dark:text-slate-100 focus:ring-0 focus:outline-none"
            rows="1"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping || cooldown > 0}
            className={`p-3 rounded-xl shrink-0 transition-all ${
              input.trim() && !isTyping && cooldown === 0
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
            }`}
          >
            {cooldown > 0 ? (
              <span className="text-xs font-bold w-[18px] flex items-center justify-center">{cooldown}</span>
            ) : (
              <Send size={18} className={input.trim() && !isTyping ? 'translate-x-[1px] -translate-y-[1px]' : ''} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
