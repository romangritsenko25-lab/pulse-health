'use client'

import { useState, useEffect, useRef } from 'react'

interface Msg { role: 'user' | 'assistant'; content: string }

export default function PersonalAI({ userName }: { userName: string }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [used, setUsed] = useState(0)
  const [limit, setLimit] = useState(5)
  const [limitReached, setLimitReached] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Initial greeting from AI
  useEffect(() => {
    const greeting: Msg = {
      role: 'assistant',
      content: `Привет, ${userName}! Я прочитал твои последние записи. Как ты сейчас?`,
    }
    setMessages([greeting])

    // Load today's count from API (includes subscription-aware limit)
    fetch('/api/personal-ai')
      .then(res => res.json())
      .then(data => {
        if (typeof data.used === 'number') setUsed(data.used)
        if (typeof data.limit === 'number') setLimit(data.limit)
      })
      .catch(() => {})
  }, [userName])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    setShowHint(false)

    const newMessages: Msg[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)

    const res = await fetch('/api/personal-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages }),
    })

    const data = await res.json()

    if (res.status === 429) {
      setLimitReached(true)
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.message ?? 'Лимит сообщений исчерпан на сегодня.',
      }])
    } else if (data.text) {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.text }])
      if (typeof data.used === 'number') setUsed(data.used)
      if (typeof data.limit === 'number') setLimit(data.limit)
    } else {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Произошла ошибка. Попробуй снова.' }])
    }

    setSending(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] min-h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Твой ассистент</h2>
          <p className="text-slate-400 text-xs mt-0.5">Знает историю за последние 30 дней</p>
        </div>
        <div className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
          used >= limit ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
          {used} / {limit} сегодня
        </div>
      </div>

      {/* Hint */}
      {showHint && (
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 mb-4 text-sm text-teal-700 leading-relaxed">
          Этот ассистент знает твои чек-ины и дневник. Спроси о своих паттернах или подготовься к встрече со специалистом.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                <svg width="14" height="14" viewBox="0 0 40 40" fill="none">
                  <path d="M8 28 L8 10 L20 20 L32 10 L32 28" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-teal-600 text-white rounded-tr-sm'
                : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 40 40" fill="none">
                <path d="M8 28 L8 10 L20 20 L32 10 L32 28" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <span className="flex gap-1">
                {[0,1,2].map((i) => (
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
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Напиши что-нибудь…"
            rows={1}
            className="flex-1 resize-none px-4 py-3 rounded-2xl border border-slate-200 focus:border-teal-400 focus:outline-none text-sm placeholder:text-slate-400 leading-relaxed"
            style={{ maxHeight: 120 }}
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
    </div>
  )
}
