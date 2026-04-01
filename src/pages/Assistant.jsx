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
  const [apiKey, setApiKey] = useState(getGroqApiKey())
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()

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
    if (!input.trim() || !apiKey) return

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

You are equipped with tools to schedule and reschedule tasks. When a user agrees to a plan or asks you to schedule items, call the relevant tool to add them to their calendar.
CRITICAL: To avoid output limits, do NOT schedule more than 14 tasks in a single response. If the user requests a full month, schedule the first 2 weeks and ask if they are ready for the rest. Keep task notes very concise.`
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

      // Only send the last 6 valid messages to preserve token limits
      const validMessages = newMessages.filter(m => !m.content.startsWith('**Error:**'))
      const recentMessages = validMessages.slice(-6)
      const apiMessages = [systemPrompt, ...recentMessages.map(m => ({ role: m.role, content: m.content }))]

      const selectedModel = getGroqModel()

      let runResponse = await groq.chat.completions.create({
        model: selectedModel,
        messages: apiMessages,
        tools: tools,
        tool_choice: "auto",
        max_tokens: 2048
      })

      const responseMessage = runResponse.choices[0].message

      // Handle function calling
      if (responseMessage.tool_calls) {
        setMessages(prev => [...prev, { role: 'assistant', content: "I'm scheduling these tasks for you right now..." }])
        
        let toolResults = []
        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.function.name === 'create_tasks') {
            const args = JSON.parse(toolCall.function.arguments)
            let count = 0
            args.tasks.forEach(task => {
              addTask({
                id: uuidv4(),
                title: task.title,
                date: task.date,
                priority: task.priority.toLowerCase(),
                category: ['work', 'personal', 'health', 'study'].includes((task.category || '').toLowerCase()) ? task.category.toLowerCase() : 'personal',
                completed: false,
                hasTime: false,
                time: '',
                note: task.note || 'Scheduled by TaskFlow AI',
                subtasks: [],
                reminder: false
              })
              count++
            })
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "create_tasks",
              content: `Successfully created ${count} tasks.`
            })
          } else if (toolCall.function.name === 'reschedule_tasks') {
            const args = JSON.parse(toolCall.function.arguments)
            let count = 0
            args.updates.forEach(update => {
              updateTask(update.id, { date: update.date })
              count++
            })
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "reschedule_tasks",
              content: `Successfully rescheduled ${count} tasks.`
            })
          }
        }

        // Call API again with tool results to get the final conversational response
        const messagesWithToolResponse = [
          ...apiMessages,
          responseMessage,
          ...toolResults
        ]

        const secondResponse = await groq.chat.completions.create({
          model: selectedModel,
          messages: messagesWithToolResponse,
        })
        
        // Replace temporary scheduling message with real response
        setMessages(prev => {
          const updated = [...prev]
          updated.pop()
          return [...updated, { role: 'assistant', content: secondResponse.choices[0].message.content }]
        })

      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: responseMessage.content }])
      }

    } catch (error) {
      console.error(error)
      setMessages(prev => [...prev, { role: 'assistant', content: `**Error:** Let's double check your Groq API key in Settings. \`\`\`${error.message}\`\`\`` }])
    } finally {
      setIsTyping(false)
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
            disabled={!input.trim() || isTyping}
            className={`p-3 rounded-xl shrink-0 transition-all ${
              input.trim() && !isTyping 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
            }`}
          >
            <Send size={18} className={input.trim() && !isTyping ? 'translate-x-[1px] -translate-y-[1px]' : ''} />
          </button>
        </div>
      </div>
    </div>
  )
}
