'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import PersonalAI from '@/components/PersonalAI'
import CalendarTab from '@/components/CalendarTab'

// ── Types ──────────────────────────────────────────────────────────────────
interface Profile { name: string | null; email: string | null }
interface CheckinRow {
  id: string; wellbeing: number | null; mood: string | null; created_at: string
}
interface JournalEntry {
  id: string; content: string; mood: string | null; voice_input: boolean; created_at: string
}

const MOODS = [
  { emoji: '😔', label: 'Грустно' }, { emoji: '😰', label: 'Тревожно' },
  { emoji: '😐', label: 'Нейтрально' }, { emoji: '🙂', label: 'Неплохо' },
  { emoji: '😊', label: 'Хорошо' }, { emoji: '😤', label: 'Раздражённо' },
]

// ── Streak ─────────────────────────────────────────────────────────────────
function calcStreak(checkins: CheckinRow[]): number {
  if (!checkins.length) return 0
  const days = new Set(checkins.map((c) => new Date(c.created_at).toLocaleDateString('ru-RU')))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    if (days.has(d.toLocaleDateString('ru-RU'))) streak++
    else if (i > 0) break
  }
  return streak
}

// ── Voice hook ─────────────────────────────────────────────────────────────
function useSpeech(onResult: (t: string) => void) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null)
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const cb = useCallback(onResult, [onResult])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) { setSupported(false); return }
    const rec = new SR(); rec.lang = 'ru-RU'; rec.continuous = false; rec.interimResults = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => cb(e.results[0][0].transcript)
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    ref.current = rec
  }, [cb])

  function toggle() {
    if (!ref.current) return
    if (listening) { ref.current.stop(); setListening(false) }
    else { ref.current.start(); setListening(true) }
  }
  return { listening, supported, toggle }
}

// ── New Entry Modal ────────────────────────────────────────────────────────
function NewEntryModal({ onClose, onSaved }: { onClose: () => void; onSaved: (e: JournalEntry) => void }) {
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [voiceUsed, setVoiceUsed] = useState(false)
  const { listening, supported, toggle } = useSpeech((t) => {
    setContent((p) => p ? p + ' ' + t : t); setVoiceUsed(true)
  })

  async function save() {
    if (!content.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { data, error } = await supabase.from('journal_entries')
      .insert({ user_id: user.id, content: content.trim(), mood, voice_input: voiceUsed })
      .select().single()
    if (!error && data) onSaved(data as JournalEntry)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg">Новая запись</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="relative">
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="Что сейчас происходит? Пиши свободно..."
            className="w-full resize-none rounded-2xl border border-slate-200 focus:border-teal-400 focus:outline-none p-4 text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed"
            style={{ minHeight: 160 }} />
          <button type="button" onClick={toggle} disabled={!supported}
            className={`absolute bottom-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center transition ${
              !supported ? 'opacity-30 cursor-not-allowed bg-slate-100'
              : listening ? 'bg-red-500 shadow-lg animate-pulse'
              : 'bg-teal-50 hover:bg-teal-100 text-teal-600'}`}>
            <svg className="w-4 h-4" fill={listening ? 'white' : 'currentColor'} viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Настроение</p>
          <div className="flex gap-2 flex-wrap">
            {MOODS.map((m) => (
              <button key={m.emoji} type="button" onClick={() => setMood(mood === m.emoji ? null : m.emoji)} title={m.label}
                className={`w-11 h-11 rounded-xl text-xl transition border ${mood === m.emoji ? 'border-teal-400 bg-teal-50 scale-110' : 'border-slate-100 bg-slate-50 hover:border-teal-200'}`}>
                {m.emoji}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">Отмена</button>
          <button onClick={save} disabled={!content.trim() || saving}
            className="flex-1 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold">
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tabs ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'today', label: 'Сегодня' },
  { id: 'journal', label: 'Журнал' },
  { id: 'dynamics', label: 'Динамика' },
  { id: 'ai', label: 'Мой AI' },
  { id: 'pdf', label: 'PDF' },
  { id: 'calendar', label: 'Календарь' },
] as const
type TabId = typeof TABS[number]['id']

// ── Main ───────────────────────────────────────────────────────────────────
export default function CabinetClient() {
  const router = useRouter()
  const [tab, setTab] = useState<TabId>('today')

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab') as TabId | null
    if (t && TABS.some((x) => x.id === t)) setTab(t)
  }, [])

  const [profile, setProfile] = useState<Profile | null>(null)
  const [checkins, setCheckins] = useState<CheckinRow[]>([])
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewEntry, setShowNewEntry] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const [{ data: prof }, { data: chk }, { data: ent }] = await Promise.all([
        supabase.from('profiles').select('name, email').eq('id', user.id).single(),
        supabase.from('checkins').select('id, wellbeing, mood, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
        supabase.from('journal_entries').select('id, content, mood, voice_input, created_at').order('created_at', { ascending: false }).limit(50),
      ])

      setProfile(prof)
      setCheckins(chk ?? [])
      setEntries(ent ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Загрузка…</p>
      </div>
    )
  }

  const firstName = profile?.name?.split(' ')[0] ?? 'друг'
  const streak = calcStreak(checkins)
  const todayStr = new Date().toLocaleDateString('ru-RU')
  const todayCheckin = checkins.find(
    (c) => new Date(c.created_at).toLocaleDateString('ru-RU') === todayStr
  )
  const lastEntry = entries[0]
  const chartData = [...checkins].reverse().map((c) => ({
    date: new Date(c.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    wellbeing: c.wellbeing ?? null,
  }))

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/login" className="flex items-center gap-2">
            <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="#0d9488"/>
              <path d="M8 28 L8 10 L20 20 L32 10 L32 28" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-bold text-slate-900 text-sm tracking-tight hidden sm:inline">
              metanoia<span className="text-teal-600 text-[9px] font-bold align-super ml-0.5">AI</span>
            </span>
          </a>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 font-medium hidden sm:inline">{profile?.name ?? profile?.email}</span>
            <button onClick={signOut} className="text-slate-400 hover:text-slate-600 text-xs transition px-3 py-1.5 rounded-lg hover:bg-slate-100">
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-slate-100 sticky top-14 z-30">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex overflow-x-auto no-scrollbar">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`shrink-0 px-4 py-3.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  tab === t.id ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* ── СЕГОДНЯ ── */}
        {tab === 'today' && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Привет, {firstName}!</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>

            {streak > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">🔥</span>
                <p className="text-sm font-semibold text-amber-800">{streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'} подряд</p>
              </div>
            )}

            {!todayCheckin ? (
              <div className="bg-teal-600 rounded-3xl p-6 flex flex-col gap-3">
                <div>
                  <p className="text-teal-100 text-xs font-bold uppercase tracking-widest mb-1">Чек-ин сегодня</p>
                  <h2 className="text-white font-bold text-lg">Пройти чек-ин — 10 минут</h2>
                  <p className="text-teal-100 text-sm mt-1">Ответь на вопросы и получи AI-анализ состояния</p>
                </div>
                <a href="/checkin"
                  className="self-start px-5 py-2.5 bg-white text-teal-600 text-sm font-bold rounded-2xl hover:bg-teal-50 transition">
                  Начать →
                </a>
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-teal-600 uppercase tracking-widest">Чек-ин пройден</p>
                  {todayCheckin.mood && <span className="text-xl">{todayCheckin.mood}</span>}
                </div>
                <p className="text-slate-700 text-sm">
                  Самочувствие: <span className="font-semibold">{todayCheckin.wellbeing ?? '—'} / 10</span>
                </p>
                <a href="/checkin" className="mt-3 inline-flex text-teal-600 hover:text-teal-500 text-xs font-semibold transition">
                  Пройти ещё раз →
                </a>
              </div>
            )}

            {lastEntry && (
              <div className="bg-white border border-slate-100 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Последняя запись</p>
                  {lastEntry.mood && <span className="text-lg">{lastEntry.mood}</span>}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed line-clamp-2">{lastEntry.content}</p>
                <button onClick={() => setTab('journal')}
                  className="mt-3 text-teal-600 hover:text-teal-500 text-xs font-semibold transition">
                  Открыть журнал →
                </button>
              </div>
            )}

            {!lastEntry && (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-5 text-center">
                <p className="text-slate-400 text-sm mb-3">Дневник пуст — начни вести записи</p>
                <button onClick={() => { setTab('journal'); setShowNewEntry(true) }}
                  className="text-teal-600 text-sm font-semibold hover:text-teal-500">
                  Написать первую запись →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ЖУРНАЛ ── */}
        {tab === 'journal' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Журнал</h2>
                <p className="text-slate-400 text-sm mt-0.5">{entries.length} {entries.length === 1 ? 'запись' : entries.length < 5 ? 'записи' : 'записей'}</p>
              </div>
              <button onClick={() => setShowNewEntry(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-2xl transition shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Новая запись
              </button>
            </div>

            {entries.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📓</p>
                <p className="font-semibold text-slate-700 mb-1">Записей пока нет</p>
                <p className="text-slate-400 text-sm">Фиксируй мысли и настроение каждый день</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {entries.map((e) => {
                  const d = new Date(e.created_at)
                  return (
                    <div key={e.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-teal-200 hover:shadow-sm transition">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {e.mood && <span className="text-lg">{e.mood}</span>}
                          <p className="text-xs text-slate-400">
                            {d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} · {d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {e.voice_input && <span className="text-xs text-teal-400 font-medium">🎙 Голос</span>}
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">{e.content}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ДИНАМИКА ── */}
        {tab === 'dynamics' && (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-bold text-slate-900">Динамика</h2>
            {checkins.length < 2 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
                <p className="text-slate-400 text-sm">Нужно минимум 2 чек-ина для графика</p>
                <a href="/checkin" className="mt-3 inline-flex text-teal-600 text-sm font-semibold hover:text-teal-500">Пройти чек-ин →</a>
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-2xl p-5">
                <p className="text-sm font-semibold text-slate-700 mb-4">Самочувствие (30 дней)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }} />
                    <Line type="monotone" dataKey="wellbeing" stroke="#0d9488" strokeWidth={2} dot={{ r: 3, fill: '#0d9488' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-800">{checkins.length}</p>
                <p className="text-xs text-slate-400 mt-0.5">Чек-инов всего</p>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-800">🔥 {streak}</p>
                <p className="text-xs text-slate-400 mt-0.5">Дней подряд</p>
              </div>
            </div>
          </div>
        )}

        {/* ── МОЙ AI ── */}
        {tab === 'ai' && (
          <PersonalAI userName={firstName} />
        )}

        {/* ── КАЛЕНДАРЬ ── */}
        {tab === 'calendar' && <CalendarTab />}

        {/* ── PDF ── */}
        {tab === 'pdf' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-slate-900">PDF для приёма</h2>
            <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-4">
              <div>
                <p className="font-semibold text-slate-800">Создать PDF для специалиста</p>
                <p className="text-slate-400 text-sm mt-1">Включает чек-ины и дневник за 30 дней. Покажи на приёме.</p>
              </div>
              <a href="/result"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-2xl transition">
                ↓ Перейти к результату и PDF
              </a>
            </div>
            <p className="text-slate-400 text-xs text-center">PDF создаётся на странице результата после чек-ина</p>
          </div>
        )}
      </div>

      {showNewEntry && (
        <NewEntryModal
          onClose={() => setShowNewEntry(false)}
          onSaved={(e) => { setEntries((prev) => [e, ...prev]); setShowNewEntry(false) }}
        />
      )}
    </div>
  )
}
