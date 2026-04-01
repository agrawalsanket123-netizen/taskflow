import { useState, useEffect, useRef } from 'react'
import { Bot, Send, Sparkles, Loader2, ArrowRight } from 'lucide-react'
import Groq from 'groq-sdk'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { v4 as uuidv4 } from 'uuid'
import { getGroqApiKey, getGroqModel, getChatHistory, saveChatHistory, getTasks, addTask, updateTask } from '../utils/storage'
import { todayStr } from '../utils/dateHelpers'
import { useNavigate } from 'react-router-dom'

export default function Assistant() {
  const [messages, setMessages] = useState(getChatHistory())
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [apiKey, setApiKey] = useState(getGroqApiKey())
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
      const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true })

      const systemPrompt = {
        role: "system",
        content: `You are TaskFlow AI, an intelligent, positive, and proactive productivity assistant.
Your goal is to help the user break down their goals, organize their month/week, and schedule tasks effectively.
Current Date: ${todayStr()}

Context of user's current tasks (ID, Title, Date, Completed, Priority):
${JSON.stringify(getTasks().map(t => ({ id: t.id, title: t.title, date: t.date, completed: t.completed, priority: t.priority })))}

You are equipped with tools to schedule and reschedule tasks. 
CRITICAL TOOL INSTRUCTIONS:
Always use the tools exactly according to their schema. If you use 'create_tasks', your output MUST perfectly match this internal syntax natively expected by the system:
<function=create_tasks>{"tasks": [{"title": "Example", "date": "2026-04-10", "priority": "high", "category": "health", "note": "Notes here."}]}</function>
DO NOT forget the {"tasks": [...]} object wrapper. DO NOT use malformed tags like <function=create_tasks=[...]>!

CRITICAL LIMITS: To avoid output limits, do NOT schedule more than 14 tasks in a single response. If the user requests a full month, schedule the first 2 weeks and ask if they are ready for the rest. Keep task notes very concise.`
      }

      const tools = [
        {
          type: "function",
          function: {
            name: "create_tasks",
            description: "Creates one or more scheduled tasks in the user's task tracker.",
            parameters: {
              type: "object",
              properties: {
                tasks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "The task name/title" },
                      date: { type: "string", description: "YYYY-MM-DD date string for scheduling" },
                      priority: { type: "string", enum: ["high", "medium", "low"], description: "Task priority" },
                      category: { type: "string", description: "Category enum (work, personal, health, study)" },
                      note: { type: "string", description: "Optional notes or details for the task" }
                    },
                    required: ["title", "date", "priority", "category"]
                  }
                }
              },
              required: ["tasks"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "reschedule_tasks",
            description: "Updates the scheduled date for existing tasks.",
            parameters: {
              type: "object",
              properties: {
                updates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string", description: "The existing task id to reschedule" },
                      date: { type: "string", description: "YYYY-MM-DD new date string" }
                    },
                    required: ["id", "date"]
                  }
                }
              },
              required: ["updates"]
            }
          }
        }
      ]

      // Only send the last 2 valid messages to preserve aggressive 6k token limits
      const validMessages = newMessages.filter(m => !m.content.startsWith('**Error:**'))
      const recentMessages = validMessages.slice(-2)
      const apiMessages = [systemPrompt, ...recentMessages.map(m => ({ role: m.role, content: m.content }))]

      const selectedModel = getGroqModel()

      let runResponse = await groq.chat.completions.create({
        model: selectedModel,
        messages: apiMessages,
        tools: tools,
        tool_choice: "auto",
        max_tokens: 1500
      })

      const responseMessage = runResponse.choices[0].message

      // Handle function calling
      if (responseMessage.tool_calls) {
        setMessages(prev => [...prev, { role: 'assistant', content: "I'm scheduling these tasks for you right now..." }])
        
        let totalCreated = 0
        let totalUpdated = 0

        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.function.name === 'create_tasks') {
            try {
              const args = JSON.parse(toolCall.function.arguments)
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
          } else if (toolCall.function.name === 'reschedule_tasks') {
            try {
              const args = JSON.parse(toolCall.function.arguments)
              if (args.updates && Array.isArray(args.updates)) {
                args.updates.forEach(update => {
                  updateTask(update.id, { date: update.date })
                  totalUpdated++
                })
              }
            } catch (err) {
              console.error("Tool parse error:", err)
            }
          }
        }

        // We completely skip the second LLM API call to save 50% of tokens and prevent Double-Hop Rate Limiting!
        setMessages(prev => {
          const updated = [...prev]
          updated.pop()
          const actionText = []
          if (totalCreated > 0) actionText.push(`created ${totalCreated} new tasks`)
          if (totalUpdated > 0) actionText.push(`rescheduled ${totalUpdated} tasks`)
          
          if (actionText.length > 0) {
            return [...updated, { role: 'assistant', content: `✅ Successfully ${actionText.join(' and ')} on your calendar! Let me know if you need to schedule anything else.` }]
          } else {
            return [...updated, { role: 'assistant', content: `⚠️ I tried to schedule tasks but validation failed. Could you try asking me to schedule just a few tasks at a time?` }]
          }
        })

      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: responseMessage.content }])
      }

    } catch (error) {
      console.error(error)
      const errStr = error.message || ''
      let friendlyError = `⚠️ **AI Connection Error**\n\nSomething went wrong connecting to the AI. Check your internet or API key in Settings.`
      
      if (errStr.includes('429') || errStr.includes('Rate limit') || errStr.includes('tokens per minute') || errStr.includes('tokens per day')) {
        const timeMatch = errStr.match(/try again in (?:([0-9]+)m)?([0-9.]+)s/)
        let mins = 0, secs = 30
        if (timeMatch) {
          mins = timeMatch[1] ? parseInt(timeMatch[1], 10) : 0
          secs = Math.ceil(parseFloat(timeMatch[2]))
        }
        
        const isDaily = errStr.includes('tokens per day (TPD)')
        
        if (isDaily) {
          friendlyError = `🛑 **Daily Token Allowance Reached!**\n\nYou've exhausted your free 100,000 tokens for this specific model today! You must wait **${mins} minutes and ${secs} seconds** before you can use it again. \n\n**Quick Fix:** Go to the Settings page and swap your AI Model to **Llama 3.1 8B** to immediately start using a fresh, massive token bucket!`
        } else {
          friendlyError = `⏳ **Speed Limit Reached!**\n\nThe AI hit its free-tier speed limit. Groq's servers require you to wait **exactly ${mins ? mins + 'm ' : ''}${secs} seconds** before sending another message. \n\nTapping CLEAR deletes the conversational history so your tokens stay low, but you still must wait out the physical clock!`
        }
      } else if (errStr.includes('400') || errStr.includes('tool call validation failed') || errStr.includes('failed_generation')) {
        friendlyError = `🤯 **AI formatting hiccup!**\n\nThe AI stumbled while trying to schedule such a massive block of tasks at once. Try asking it to schedule just **one week** at a time!`
      } else if (errStr.includes('413')) {
        friendlyError = `📉 **Message too large!**\n\nYour history is too long for this specific model. Tap **CLEAR** and try again.`
      }

      setMessages(prev => [...prev, { role: 'assistant', content: friendlyError }])
    } finally {
      setIsTyping(false)
      setCooldown(15) // Apply 15s cooldown after every API request completes
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
          <Bot size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Welcome to TaskFlow AI</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-8">
          Powered by Llama 3.3 70B, your assistant can break down goals and automatically schedule your week.
        </p>
        <button 
          onClick={() => navigate('/settings')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2"
        >
          Add Groq API Key <ArrowRight size={18} />
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
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-1">Llama 3.3 70B</p>
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
