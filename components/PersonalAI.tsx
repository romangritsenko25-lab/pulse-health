'use client'

import { useState, useEffect, useRef } from 'react'

interface Msg { role: 'user' | 'assistant'; content: string }
interface Conversation {
  id: string
  title: string
  updated_at: string
  last_message: string | null
}

function greeting(name: string): Msg {
  return { role: 'assistant', content: `Привет, ${name}! Я прочитал твои последние записи. Как ты сейчас?` }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru', { day: 'numeric', month: 'long' })
}

export default function PersonalAI({ userName }: { userName: string }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [used, setUsed] = useState(0)
  const [limitState, setLimitState] = useState(5)
  const [limitReached, setLimitReached] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load usage count + conversation list in parallel
    Promise.all([
      fetch('/api/personal-ai').then(r => r.json()),
      fetch('/api/conversations').then(r => r.json()),
    ]).then(([usage, convs]) => {
      setUsed(usage.used ?? 0)
      setLimitState(usage.limit ?? 5)

      if (Array.isArray(convs) && convs.length > 0) {
        setConversations(convs)
        loadConversation(convs[0].id)
      } else {
        setMessages([greeting(userName)])
      }
    }).catch(() => {
      setMessages([greeting(userName)])
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversation(id: string) {
    setHistoryLoading(true)
    try {
      const msgs = await fetch(`/api/conversations/${id}`).then(r => r.json())
      if (Array.isArray(msgs)) {
        setMessages(msgs)
        setConversationId(id)
        setShowHistory(false)
      }
    } finally {
      setHistoryLoading(false)
    }
  }

  function startNewChat() {
    setConversationId(null)
    setMessages([greeting(userName)])
    setShowHistory(false)
  }

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)

    const userMsg: Msg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])

    const res = await fetch('/api/personal-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [userMsg], conversation_id: conversationId }),
    })
    const data = await res.json()

    if (res.status === 429) {
      setLimitReached(true)
      setMessages(prev => [...prev, { role: 'assistant', content: data.message ?? 'Лимит сообщений исчерпан на сегодня.' }])
    } else if (data.text) {
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }])
      if (typeof data.used === 'number') setUsed(data.used)

      if (data.conversation_id) {
        const newId = data.conversation_id
        setConversationId(newId)

        // Update conversations list
        setConversations(prev => {
          const exists = prev.find(c => c.id === newId)
          if (exists) {
            return [
              { ...exists, updated_at: new Date().toISOString(), last_message: data.text },
              ...prev.filter(c => c.id !== newId),
            ]
          }
          return [{ id: newId, title: text.slice(0, 50), updated_at: new Date().toISOString(), last_message: data.text }, ...prev]
        })
      }
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Произошла ошибка. Попробуй снова.' }])
    }

    setSending(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const AIIcon = () => (
    <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center shrink-0 mt-0.5">
      <svg width="14" height="14" viewBox="0 0 40 40" fill="none">
        <path d="M8 28 L8 10 L20 20 L32 10 L32 28" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100dvh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <button
          onClick={() => setShowHistory(h => !h)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-teal-600 transition px-2 py-1.5 rounded-xl hover:bg-teal-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"/>
          </svg>
          История
        </button>

        <div className="text-center flex-1">
          <h2 className="text-base font-bold text-slate-900">Твой ассистент</h2>
          <div className={`text-xs font-medium mt-0.5 ${used >= limitState ? 'text-red-400' : 'text-slate-400'}`}>
            {used} / {limitState} сегодня
          </div>
        </div>

        <button
          onClick={startNewChat}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-teal-600 transition px-2 py-1.5 rounded-xl hover:bg-teal-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Новый
        </button>
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-center text-slate-400 text-sm mt-8">Нет сохранённых чатов</div>
          ) : (
            <div className="flex flex-col gap-2">
              {conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => loadConversation(c.id)}
                  className={`text-left px-4 py-3 rounded-2xl border transition ${
                    c.id === conversationId
                      ? 'border-teal-300 bg-teal-50'
                      : 'border-slate-100 bg-white hover:border-teal-200 hover:bg-teal-50/50'
                  }`}
                >
                  <div className="text-xs text-slate-400 mb-1">{fmtDate(c.updated_at)}</div>
                  <div className="text-sm font-medium text-slate-800 truncate">{c.title}</div>
                  {c.last_message && (
                    <div className="text-xs text-slate-400 truncate mt-0.5">{c.last_message}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat */}
      {!showHistory && (
        <>
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-4">
            {historyLoading ? (
              <div className="flex justify-center mt-8">
                <span className="flex gap-1">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </span>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && <AIIcon />}
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-teal-600 text-white rounded-tr-sm'
                      : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex gap-2 justify-start">
                <AIIcon />
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <span className="flex gap-1">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {limitReached ? (
            <div className="text-center py-4 text-sm text-slate-400">
              Лимит исчерпан. Возвращайся завтра или{' '}
              <a href="/upgrade" className="text-teal-600 font-semibold hover:text-teal-500">перейди на Pro</a>.
            </div>
          ) : (
            <div className="flex gap-2 items-end bg-slate-50 pt-2" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Напиши что-нибудь…"
                rows={1}
                className="flex-1 resize-none px-4 py-3 rounded-2xl border border-slate-200 focus:border-teal-400 focus:outline-none text-sm placeholder:text-slate-400 leading-relaxed"
                style={{ maxHeight: 120, fontSize: 16 }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                className="w-11 h-11 rounded-2xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 flex items-center justify-center transition shrink-0"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
