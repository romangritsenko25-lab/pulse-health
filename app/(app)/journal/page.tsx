'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const MOODS = [
  { emoji: '??', label: 'Грустно' },
  { emoji: '??', label: 'Тревожно' },
  { emoji: '??', label: 'Нейтрально' },
  { emoji: '??', label: 'Неплохо' },
  { emoji: '??', label: 'Хорошо' },
  { emoji: '??', label: 'Раздражённо' },
]

type Entry = {
  id: string
  content: string
  mood: string | null
  voice_input: boolean
  created_at: string
}

// -- Voice recording hook ------------------------------------------------------
function useSpeechRecognition(onResult: (text: string) => void) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null)
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = typeof window !== 'undefined' ? (window as any) : null
    const SR = w ? (w.SpeechRecognition || w.webkitSpeechRecognition) : null
    if (!SR) { setSupported(false); return }

    const rec = new SR()
    rec.lang = 'ru-RU'
    rec.continuous = false
    rec.interimResults = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      onResult(transcript)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)

    recRef.current = rec
  }, [onResult])

  function toggle() {
    if (!recRef.current) return
    if (listening) {
      recRef.current.stop()
      setListening(false)
    } else {
      recRef.current.start()
      setListening(true)
    }
  }

  return { listening, supported, toggle }
}

// -- New entry modal -----------------------------------------------------------
function NewEntryModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: (entry: Entry) => void
}) {
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [voiceUsed, setVoiceUsed] = useState(false)

  const handleVoiceResult = (text: string) => {
    setContent((prev) => (prev ? prev + ' ' + text : text))
    setVoiceUsed(true)
  }

  const { listening, supported, toggle } = useSpeechRecognition(handleVoiceResult)

  async function save() {
    if (!content.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ user_id: user.id, content: content.trim(), mood, voice_input: voiceUsed })
      .select()
      .single()

    if (!error && data) onSaved(data as Entry)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg">Новая запись</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Textarea + mic */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Что сейчас происходит? Пиши свободно..."
            className="w-full resize-none rounded-2xl border border-slate-200 focus:border-blue-400 focus:outline-none p-4 text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed"
            style={{ minHeight: 200 }}
          />
          <button
            type="button"
            onClick={toggle}
            disabled={!supported}
            title={supported ? (listening ? 'Остановить запись' : 'Диктовать') : 'Браузер не поддерживает голосовой ввод'}
            className={`absolute bottom-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center transition ${
              !supported
                ? 'opacity-30 cursor-not-allowed bg-slate-100'
                : listening
                ? 'bg-red-500 shadow-lg shadow-red-200 animate-pulse'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
            }`}
          >
            <svg className="w-4 h-4" fill={listening ? 'white' : 'currentColor'} viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          {listening && (
            <p className="absolute bottom-14 right-3 text-xs text-red-500 font-medium bg-white px-2 py-1 rounded-lg border border-red-100">
              Слушаю…
            </p>
          )}
          {!supported && (
            <p className="mt-1 text-xs text-slate-400">Голосовой ввод не поддерживается в этом браузере</p>
          )}
        </div>

        {/* Mood picker */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Настроение</p>
          <div className="flex gap-2 flex-wrap">
            {MOODS.map((m) => (
              <button
                key={m.emoji}
                type="button"
                onClick={() => setMood(mood === m.emoji ? null : m.emoji)}
                title={m.label}
                className={`w-11 h-11 rounded-xl text-xl transition border ${
                  mood === m.emoji
                    ? 'border-blue-400 bg-blue-50 shadow-sm scale-110'
                    : 'border-slate-100 bg-slate-50 hover:border-blue-200 hover:scale-105'
                }`}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
          >
            Отмена
          </button>
          <button
            onClick={save}
            disabled={!content.trim() || saving}
            className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition"
          >
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}

// -- Entry card ----------------------------------------------------------------
function EntryCard({ entry }: { entry: Entry }) {
  const date = new Date(entry.created_at)
  const formatted = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const preview = entry.content.length > 100 ? entry.content.slice(0, 100) + '…' : entry.content

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-sm transition">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {entry.mood && <span className="text-xl">{entry.mood}</span>}
          <p className="text-xs text-slate-400">{formatted} · {time}</p>
        </div>
        {entry.voice_input && (
          <span className="text-xs text-blue-400 font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            </svg>
            Голос
          </span>
        )}
      </div>
      <p className="text-slate-600 text-sm leading-relaxed">{preview}</p>
    </div>
  )
}

// -- Main page -----------------------------------------------------------------
export default function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  useEffect(() => { router.replace('/cabinet?tab=journal') }, [router])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('journal_entries')
        .select('id, content, mood, voice_input, created_at')
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) setEntries(data as Entry[])
      setLoading(false)
    }
    load()
  }, [])

  function handleSaved(entry: Entry) {
    setEntries((prev) => [entry, ...prev])
    setShowModal(false)
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href="/" className="text-slate-400 hover:text-blue-600 text-sm transition mb-2 inline-flex items-center gap-1">
              < Главная
            </a>
            <h1 className="text-2xl font-bold text-slate-900">Мой журнал</h1>
            <p className="text-slate-400 text-sm mt-1">{entries.length} {entries.length === 1 ? 'запись' : entries.length < 5 ? 'записи' : 'записей'}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-2xl transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Новая запись
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">??</p>
            <p className="font-semibold text-slate-700 mb-2">Записей пока нет</p>
            <p className="text-slate-400 text-sm mb-6">Начни вести журнал — фиксируй мысли и настроение каждый день</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-2xl transition"
            >
              Написать первую запись
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((e) => (
              <EntryCard key={e.id} entry={e} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <NewEntryModal onClose={() => setShowModal(false)} onSaved={handleSaved} />
      )}
    </div>
  )
}
