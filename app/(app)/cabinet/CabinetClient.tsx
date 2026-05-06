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
            style={{ minHeight: 160, fontSize: 16 }} />
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

// ── PDF data types ─────────────────────────────────────────────────────────
interface PdfCheckin {
  wellbeing?: number | null
  sleep?: string | null
  anxiety?: number | null
  control?: number | null
  energyMorning?: string | number | null
  energyDay?: string | number | null
  energyEvening?: string | number | null
  emotions?: string[]
  stressors?: string[]
  freeText?: string | null
  date?: string | null
}

interface PdfData {
  checkin: PdfCheckin
  resume: string
  topics: string[]
  specialist: { name: string; specialty: string } | null
  userName: string
  date: string
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/^#+\s/gm, '')
    .replace(/^---$/gm, '')
    .replace(/\*/g, '')
    .trim()
}

async function generateProfessionalPdf(data: PdfData) {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ])

  const { checkin, resume, topics, specialist, userName, date } = data

  const emotionsStr = checkin.emotions?.length ? checkin.emotions.join(', ') : '—'
  const checkinDate = checkin.date ? new Date(checkin.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
  const cleanResume = cleanMarkdown(resume)

  // Bug 2: energy formatting — filter nulls, format "Утро: X · День: X · Вечер: X"
  const energyParts = [
    checkin.energyMorning != null ? `Утро: ${checkin.energyMorning}` : null,
    checkin.energyDay != null ? `День: ${checkin.energyDay}` : null,
    checkin.energyEvening != null ? `Вечер: ${checkin.energyEvening}` : null,
  ].filter(Boolean)
  const energyStr = energyParts.length ? energyParts.join(' · ') : 'Не указано'

  // Bug 1: anxiety/control — show "Не указано" when null
  const anxietyStr = checkin.anxiety != null ? `${checkin.anxiety}<span style="font-size:11px;font-weight:400;color:#94a3b8;">/10</span>` : '<span style="font-size:13px;color:#94a3b8;">Не указано</span>'
  const controlStr = checkin.control != null ? `${checkin.control}<span style="font-size:11px;font-weight:400;color:#94a3b8;">/10</span>` : '<span style="font-size:13px;color:#94a3b8;">Не указано</span>'

  const topicsHtml = topics.map((t, i) => `
    <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
      <div style="min-width:24px;height:24px;background:#0d9488;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;padding-top:1px;">${i + 1}</div>
      <p style="font-size:13px;line-height:1.6;color:#1e3a5f;margin:3px 0 0;flex:1;">${t}</p>
    </div>`).join('')

  // Bug 6: specialist block only if specialist exists
  const specialistBlock = specialist?.name
    ? `<div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:14px 18px;margin-bottom:24px;display:flex;align-items:center;gap:12px;">
        <div>
          <p style="font-size:9px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin:0 0 3px;">Подготовлено для</p>
          <p style="font-size:14px;font-weight:700;color:#0f766e;margin:0;">${specialist.name} · ${specialist.specialty}</p>
        </div>
      </div>`
    : ''

  // Bug 3: stressors — show only if not empty
  const stressorsBlock = checkin.stressors?.length
    ? `<div style="margin-bottom:${checkin.freeText ? '14px' : '0'};">
        <p style="font-size:10px;color:#64748b;margin:0 0 4px;">Стрессоры</p>
        <p style="font-size:13px;color:#1e3a5f;margin:0;">${checkin.stressors.join(', ')}</p>
      </div>`
    : ''

  const nowStr = new Date().toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const html = `
    <div style="width:794px;padding:52px 60px 80px;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1e3a5f;box-sizing:border-box;">
      <!-- ШАПКА -->
      <div style="border-bottom:2px solid #ccfbf1;padding-bottom:22px;margin-bottom:28px;">
        <p style="font-size:22px;font-weight:800;color:#0d9488;margin:0 0 4px;letter-spacing:-0.5px;">Metanoia AI</p>
        <p style="font-size:13px;font-weight:600;color:#1e3a5f;margin:0 0 6px;">Подготовка к приёму у специалиста</p>
        <p style="font-size:11px;color:#94a3b8;margin:0;">${userName} · ${date}</p>
      </div>

      ${specialistBlock}

      <!-- 01 ЧЕК-ИН -->
      <div style="margin-bottom:24px;">
        <p style="font-size:10px;font-weight:700;color:#0d9488;letter-spacing:3px;text-transform:uppercase;margin:0 0 14px;">01 · Последний чек-ин <span style="color:#94a3b8;font-weight:400;font-size:9px;">${checkinDate}</span></p>
        <div style="background:#f8fafc;border-radius:10px;padding:18px 20px;margin-bottom:14px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;margin-bottom:12px;">
            <div>
              <p style="font-size:10px;color:#64748b;margin:0 0 2px;">Самочувствие</p>
              <p style="font-size:16px;font-weight:700;color:#1e3a5f;margin:0;">${checkin.wellbeing ?? '—'}<span style="font-size:11px;font-weight:400;color:#94a3b8;">/10</span></p>
            </div>
            <div>
              <p style="font-size:10px;color:#64748b;margin:0 0 2px;">Тревога</p>
              <p style="font-size:16px;font-weight:700;color:#1e3a5f;margin:0;">${anxietyStr}</p>
            </div>
            <div>
              <p style="font-size:10px;color:#64748b;margin:0 0 2px;">Сон</p>
              <p style="font-size:16px;font-weight:700;color:#1e3a5f;margin:0;">${checkin.sleep ?? '—'}<span style="font-size:11px;font-weight:400;color:#94a3b8;"> ч</span></p>
            </div>
            <div>
              <p style="font-size:10px;color:#64748b;margin:0 0 2px;">Контроль</p>
              <p style="font-size:16px;font-weight:700;color:#1e3a5f;margin:0;">${controlStr}</p>
            </div>
          </div>
          <div style="border-top:1px solid #e2e8f0;padding-top:10px;margin-top:2px;">
            <p style="font-size:10px;color:#64748b;margin:0 0 4px;">Энергия (утро / день / вечер)</p>
            <p style="font-size:13px;font-weight:600;color:#1e3a5f;margin:0;">${energyStr}</p>
          </div>
        </div>
        <div style="margin-bottom:8px;">
          <p style="font-size:10px;color:#64748b;margin:0 0 4px;">Эмоции</p>
          <p style="font-size:13px;color:#1e3a5f;margin:0;">${emotionsStr}</p>
        </div>
        ${stressorsBlock}
        ${checkin.freeText ? `<div style="background:#fffbeb;border-left:3px solid #fbbf24;padding:12px 16px;border-radius:0 8px 8px 0;margin-top:8px;">
          <p style="font-size:10px;font-weight:700;color:#92400e;margin:0 0 6px;">Своими словами:</p>
          <p style="font-size:12px;line-height:1.65;color:#78350f;margin:0;">${checkin.freeText}</p>
        </div>` : ''}
      </div>

      <!-- 02 РЕЗЮМЕ -->
      <div style="margin-bottom:24px;">
        <p style="font-size:10px;font-weight:700;color:#0d9488;letter-spacing:3px;text-transform:uppercase;margin:0 0 14px;">02 · Резюме состояния</p>
        <div style="background:#f0fdfa;border-radius:10px;padding:18px 20px;border:1px solid #ccfbf1;">
          <p style="font-size:13px;line-height:1.75;color:#1e3a5f;margin:0;white-space:pre-wrap;">${cleanResume}</p>
        </div>
      </div>

      <!-- 03 ТЕМЫ -->
      ${topics.length > 0 ? `<div style="margin-bottom:28px;">
        <p style="font-size:10px;font-weight:700;color:#0d9488;letter-spacing:3px;text-transform:uppercase;margin:0 0 14px;">03 · Темы для обсуждения</p>
        <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;">
          ${topicsHtml}
        </div>
      </div>` : ''}

      <!-- ФУТЕР -->
      <div style="border-top:1px solid #e2e8f0;padding-top:14px;margin-top:4px;">
        <p style="font-size:11px;color:#94a3b8;margin:0 0 3px;">Составлено AI-ассистентом Metanoia AI · Не является медицинским заключением</p>
        <p style="font-size:10px;color:#cbd5e1;margin:0;">${nowStr}</p>
      </div>
    </div>`

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'position:fixed;top:-9999px;left:-9999px;'
  wrapper.innerHTML = html
  document.body.appendChild(wrapper)

  const canvas = await html2canvas(wrapper.firstElementChild as HTMLElement, {
    scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
  })
  document.body.removeChild(wrapper)

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const imgH = (canvas.height * pageW) / canvas.width

  // Bug 5: page breaks — add white overlay at top of new pages to avoid cut text
  const topMargin = 10
  let remaining = imgH
  let yPos = 0
  pdf.addImage(imgData, 'PNG', 0, yPos, pageW, imgH)
  remaining -= pageH

  while (remaining > 0) {
    pdf.addPage()
    yPos = -(imgH - remaining) + topMargin
    pdf.addImage(imgData, 'PNG', 0, yPos, pageW, imgH)
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, pageW, topMargin, 'F')
    remaining -= pageH
  }

  const filename = `metanoia-specialist-${new Date().toISOString().slice(0, 10)}.pdf`
  pdf.save(filename)
}

// ── Chart helpers ──────────────────────────────────────────────────────────
const LABEL_MAP: Record<string, string> = {
  wellbeing: 'Самочувствие',
  anxiety: 'Тревога',
  energy: 'Энергия',
  mood: 'Настроение',
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '8px 12px', fontSize: 12 }}>
      <p style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: '#0d9488', fontWeight: 600 }}>
          {LABEL_MAP[p.dataKey] ?? p.dataKey}: {p.value}
        </p>
      ))}
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
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [checkins, setCheckins] = useState<CheckinRow[]>([])
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setUserEmail(user.email ?? null)

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

  async function handleCreatePdf() {
    setPdfLoading(true)
    setPdfError(null)
    try {
      const res = await fetch('/api/pdf-data')
      if (!res.ok) throw new Error('Ошибка загрузки данных')
      const data: PdfData = await res.json()
      await generateProfessionalPdf(data)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('pdf_downloads').insert({ user_id: user.id })
      }
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : 'Неизвестная ошибка')
    } finally {
      setPdfLoading(false)
    }
  }

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

  const displayName = profile?.name || userEmail?.split('@')[0] || 'Пользователь'
  const firstName = profile?.name?.split(' ')[0] ?? userEmail?.split('@')[0] ?? 'друг'
  const streak = calcStreak(checkins)
  const todayStr = new Date().toLocaleDateString('ru-RU')
  const todayCheckin = checkins.find(
    (c) => new Date(c.created_at).toLocaleDateString('ru-RU') === todayStr
  )
  const lastEntry = entries[0] ?? null
  const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const recentEntry = lastEntry && new Date(lastEntry.created_at) >= threeDaysAgo ? lastEntry : null
  const reversedCheckins = [...checkins].reverse()
  const allSameDay = reversedCheckins.length > 1 && reversedCheckins.every(
    (c) => new Date(c.created_at).toLocaleDateString('ru-RU') === new Date(reversedCheckins[0].created_at).toLocaleDateString('ru-RU')
  )
  const chartData = reversedCheckins.map((c) => {
    const d = new Date(c.created_at)
    return {
      date: allSameDay
        ? d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      wellbeing: c.wellbeing ?? null,
    }
  })

  return (
    <div className="bg-slate-50 flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-100 shrink-0 z-40">
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
            <span className="text-sm text-slate-600 font-medium hidden sm:inline">{displayName}</span>
            <button onClick={signOut} className="text-slate-400 hover:text-slate-600 text-xs transition px-3 py-1.5 rounded-lg hover:bg-slate-100">
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-slate-100 shrink-0 z-30">
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-2xl mx-auto px-4 py-6">

        {/* ── СЕГОДНЯ ── */}
        {tab === 'today' && (
          <div className="flex flex-col gap-4">

            {/* 1. Приветствие */}
            <div>
              <h1 className="text-xl font-bold text-slate-900">Привет, {firstName}!</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>

            {/* 2. Стрик */}
            {streak > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">🔥</span>
                <p className="text-sm font-semibold text-amber-800">{streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'} подряд</p>
              </div>
            )}

            {/* 3. Блок чек-ина */}
            {todayCheckin ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Чек-ин пройден сегодня</p>
                </div>
                <a href={`/cabinet?tab=dynamics`}
                  className="inline-flex text-teal-600 hover:text-teal-500 text-sm font-semibold transition">
                  Посмотреть анализ →
                </a>
              </div>
            ) : (
              <div className="bg-teal-600 rounded-3xl p-6 flex flex-col gap-3">
                <div>
                  <p className="text-teal-100 text-xs font-bold uppercase tracking-widest mb-1">Чек-ин</p>
                  <h2 className="text-white font-bold text-lg">Как ты себя чувствуешь сегодня?</h2>
                </div>
                <a href="/checkin"
                  className="self-start px-5 py-2.5 bg-white text-teal-600 text-sm font-bold rounded-2xl hover:bg-teal-50 transition">
                  Пройти чек-ин →
                </a>
              </div>
            )}

            {/* 4. Блок AI-ассистента */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">AI-ассистент</p>
              <p className="text-slate-700 text-sm font-medium mb-3">Хочешь поговорить?</p>
              <button onClick={() => setTab('ai')}
                className="text-teal-600 hover:text-teal-500 text-sm font-semibold transition">
                Открыть ассистента →
              </button>
            </div>

            {/* 5. Последняя запись журнала (за последние 3 дня) */}
            {recentEntry ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Из дневника</p>
                  <p className="text-xs text-slate-400">
                    {new Date(recentEntry.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {recentEntry.content.slice(0, 80)}{recentEntry.content.length > 80 ? '…' : ''}
                </p>
                <button onClick={() => setTab('journal')}
                  className="mt-3 text-teal-600 hover:text-teal-500 text-xs font-semibold transition">
                  Читать →
                </button>
              </div>
            ) : (
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
                    <Tooltip content={<CustomTooltip />} />
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
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">PDF для специалиста</h2>
              <p className="text-slate-400 text-sm mt-0.5">Клинический документ подготовки к сессии</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-bold flex-shrink-0">01</span>
                  Последний чек-ин — самочувствие, эмоции, стрессоры
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-bold flex-shrink-0">02</span>
                  Резюме состояния — AI-синтез без цитирования источников
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-bold flex-shrink-0">03</span>
                  Темы для обсуждения — конкретные, из вашего контекста
                </div>
              </div>

              {pdfError && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <p className="text-red-600 text-sm">{pdfError}</p>
                </div>
              )}

              <button
                onClick={handleCreatePdf}
                disabled={pdfLoading}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-2xl transition"
              >
                {pdfLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Подготавливаем документ…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    Создать PDF
                  </>
                )}
              </button>
            </div>

            <p className="text-slate-400 text-xs text-center px-4">
              Специалист видит психологический портрет — не переписку. Источники не раскрываются.
            </p>
          </div>
        )}
        </div>
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
