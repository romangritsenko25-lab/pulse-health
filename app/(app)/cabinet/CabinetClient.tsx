'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import PersonalAI from '@/components/PersonalAI'
import CalendarTab from '@/components/CalendarTab'

// ── Homework ───────────────────────────────────────────────────────────────
interface HomeworkItem {
  id: string
  template: string
  title: string
  description: string | null
  due_date: string | null
  status: 'assigned' | 'completed' | 'skipped'
  assigned_at: string
  completed_at: string | null
}

const HOMEWORK_TEMPLATES: Record<string, { icon: string; desc: string }> = {
  breathing_478: { icon: '🌬️', desc: '4 сек вдох — 7 задержка — 8 выдох. Повторите 4 цикла.' },
  breathing_box: { icon: '⬜', desc: '4 сек вдох — 4 задержка — 4 выдох — 4 задержка. 5 циклов.' },
  cpt_diary:     { icon: '📝', desc: '' },
  act_defusion:  { icon: '🍃', desc: '' },
  act_values:    { icon: '🧭', desc: '' },
  custom:        { icon: '📋', desc: '' },
}

// ── HomeworkCompleteModal ──────────────────────────────────────────────────
function HomeworkCompleteModal({
  hw,
  onClose,
  onDone,
}: {
  hw: HomeworkItem
  onClose: () => void
  onDone: () => void
}) {
  const isBreathing = hw.template === 'breathing_478' || hw.template === 'breathing_box'
  const isCpt = hw.template === 'cpt_diary'
  const totalCycles = hw.template === 'breathing_478' ? 4 : 5

  // Breathing state
  const phases478 = [
    { label: 'Вдох', dur: 4, color: '#a78bfa' },
    { label: 'Задержка', dur: 7, color: '#818cf8' },
    { label: 'Выдох', dur: 8, color: '#6366f1' },
  ]
  const phasesBox = [
    { label: 'Вдох', dur: 4, color: '#a78bfa' },
    { label: 'Задержка', dur: 4, color: '#818cf8' },
    { label: 'Выдох', dur: 4, color: '#6366f1' },
    { label: 'Задержка', dur: 4, color: '#7c3aed' },
  ]
  const phases = hw.template === 'breathing_478' ? phases478 : phasesBox

  const [phaseIdx, setPhaseIdx] = useState(0)
  const [phaseTimer, setPhaseTimer] = useState(phases[0].dur)
  const [cycle, setCycle] = useState(1)
  const [running, setRunning] = useState(false)
  const [breathingDone, setBreathingDone] = useState(false)

  useEffect(() => {
    if (!running || !isBreathing || breathingDone) return
    const interval = setInterval(() => {
      setPhaseTimer((t) => {
        if (t <= 1) {
          const nextPhase = (phaseIdx + 1) % phases.length
          if (nextPhase === 0) {
            if (cycle >= totalCycles) {
              setBreathingDone(true)
              setRunning(false)
              return 0
            }
            setCycle((c) => c + 1)
          }
          setPhaseIdx(nextPhase)
          return phases[nextPhase].dur
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [running, phaseIdx, cycle, breathingDone, isBreathing, phases, totalCycles])

  // CPT state
  const [situation, setSituation] = useState('')
  const [thought, setThought] = useState('')
  const [emotion, setEmotion] = useState('')
  const [alternative, setAlternative] = useState('')

  // Free text state
  const [freeNote, setFreeNote] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(note?: string) {
    setSubmitting(true)
    await fetch('/api/homework/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homework_id: hw.id, client_note: note }),
    })
    setSubmitting(false)
    setDone(true)
  }

  const tmpl = HOMEWORK_TEMPLATES[hw.template] ?? HOMEWORK_TEMPLATES.custom

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[88dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{tmpl.icon}</span>
            <div>
              <p className="text-sm font-bold text-slate-800">{hw.title}</p>
              <p className="text-xs font-bold text-violet-600 uppercase tracking-widest">Задание</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {done ? (
            <div className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">🌿</div>
              <p className="text-lg font-bold text-slate-800">Отлично!</p>
              <p className="text-sm text-slate-500">Задание выполнено. Специалист увидит результат.</p>
              <button
                onClick={onDone}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition"
              >
                Закрыть
              </button>
            </div>
          ) : isBreathing ? (
            <div className="flex flex-col items-center gap-6 p-8">
              {breathingDone ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-3xl">✨</div>
                  <p className="text-base font-bold text-slate-800">Все {totalCycles} цикла завершены</p>
                  <button
                    onClick={() => submit()}
                    disabled={submitting}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition"
                  >
                    {submitting ? 'Сохраняем…' : 'Отметить выполненным'}
                  </button>
                </div>
              ) : (
                <>
                  {/* Animated circle */}
                  <div className="relative w-36 h-36">
                    <div
                      className="w-36 h-36 rounded-full flex items-center justify-center transition-all duration-1000"
                      style={{
                        background: phases[phaseIdx].color,
                        transform: running && phases[phaseIdx].label === 'Вдох' ? 'scale(1.15)' : 'scale(1)',
                        opacity: running ? 1 : 0.5,
                      }}
                    >
                      <div className="text-center text-white">
                        <p className="text-sm font-semibold">{phases[phaseIdx].label}</p>
                        <p className="text-3xl font-bold">{phaseTimer}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500">Цикл {cycle} из {totalCycles}</p>

                  {!running ? (
                    <button
                      onClick={() => setRunning(true)}
                      className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition"
                    >
                      {cycle === 1 ? 'Начать' : 'Продолжить'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setRunning(false)}
                      className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-xl transition"
                    >
                      Пауза
                    </button>
                  )}
                </>
              )}
            </div>
          ) : isCpt ? (
            <div className="flex flex-col gap-4 p-6">
              <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 leading-relaxed">
                Опишите ситуацию, которая вас взволновала, и пройдите через 4 шага КПТ.
              </p>
              {[
                { label: '1. Ситуация', placeholder: 'Что произошло? Когда и где?', value: situation, onChange: setSituation },
                { label: '2. Автоматическая мысль', placeholder: 'Что пришло в голову в тот момент?', value: thought, onChange: setThought },
                { label: '3. Эмоции и интенсивность', placeholder: 'Тревога 7/10, злость 5/10...', value: emotion, onChange: setEmotion },
                { label: '4. Альтернативная мысль', placeholder: 'Более взвешенный взгляд на ситуацию...', value: alternative, onChange: setAlternative },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{f.label}</label>
                  <textarea
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    placeholder={f.placeholder}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-violet-400 resize-none"
                  />
                </div>
              ))}
              <button
                onClick={() => submit(JSON.stringify({ situation, thought, emotion, alternative }))}
                disabled={!situation.trim() || submitting}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition"
              >
                {submitting ? 'Сохраняем…' : 'Отправить специалисту'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 p-6">
              {hw.description && (
                <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                  <p className="text-sm text-slate-700 leading-relaxed">{hw.description}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Ваши мысли и наблюдения <span className="font-normal text-slate-400">(необязательно)</span>
                </label>
                <textarea
                  value={freeNote}
                  onChange={(e) => setFreeNote(e.target.value)}
                  placeholder="Что заметили? Что было сложно или легко?"
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-violet-400 resize-none"
                />
              </div>
              <button
                onClick={() => submit(freeNote.trim() || undefined)}
                disabled={submitting}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition"
              >
                {submitting ? 'Сохраняем…' : 'Отметить выполненным'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Clinical scales ────────────────────────────────────────────────────────
const PHQ9_QUESTIONS = [
  'Мало интереса или удовольствия от дел',
  'Подавленность, безнадёжность',
  'Проблемы со сном (трудно заснуть, прерывистый или избыточный сон)',
  'Усталость, нехватка энергии',
  'Плохой аппетит или переедание',
  'Плохое мнение о себе, ощущение неудачи',
  'Трудности с концентрацией',
  'Замедленность или, наоборот, беспокойство (замечают другие)',
  'Мысли о том, что лучше умереть или причинить себе вред',
]
const GAD7_QUESTIONS = [
  'Нервозность, тревога, состояние «на взводе»',
  'Невозможность остановить или контролировать беспокойство',
  'Чрезмерное беспокойство о разных вещах',
  'Трудно расслабиться',
  'Такое беспокойство, что трудно усидеть на месте',
  'Раздражительность',
  'Страх, что может произойти что-то ужасное',
]
const CLINICAL_OPTIONS = ['Совсем нет', 'Несколько дней', 'Больше половины дней', 'Почти каждый день']

function getPhq9Severity(score: number) {
  if (score < 5)  return { label: 'Норма',         color: 'text-green-600',  bg: 'bg-green-50'  }
  if (score < 10) return { label: 'Лёгкая',        color: 'text-yellow-600', bg: 'bg-yellow-50' }
  if (score < 15) return { label: 'Умеренная',     color: 'text-orange-500', bg: 'bg-orange-50' }
  if (score < 20) return { label: 'Умер. тяжёлая', color: 'text-red-500',    bg: 'bg-red-50'    }
  return               { label: 'Тяжёлая',         color: 'text-red-700',    bg: 'bg-red-100'   }
}
function getGad7Severity(score: number) {
  if (score < 5)  return { label: 'Норма',     color: 'text-green-600',  bg: 'bg-green-50'  }
  if (score < 10) return { label: 'Лёгкая',    color: 'text-yellow-600', bg: 'bg-yellow-50' }
  if (score < 15) return { label: 'Умеренная', color: 'text-orange-500', bg: 'bg-orange-50' }
  return               { label: 'Тяжёлая',    color: 'text-red-600',    bg: 'bg-red-100'   }
}

// ── ClinicalModal ──────────────────────────────────────────────────────────
function ClinicalModal({
  type,
  specialistId,
  onClose,
  onDone,
}: {
  type: 'PHQ9' | 'GAD7'
  specialistId: string
  onClose: () => void
  onDone: (score: number) => void
}) {
  const questions = type === 'PHQ9' ? PHQ9_QUESTIONS : GAD7_QUESTIONS
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<number | null>(null)

  async function handleAnswer(val: number) {
    const newAnswers = [...answers, val]
    if (step < questions.length - 1) {
      setAnswers(newAnswers)
      setStep(step + 1)
    } else {
      setSubmitting(true)
      const score = newAnswers.reduce((a, b) => a + b, 0)
      await fetch('/api/clinical/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, answers: newAnswers, specialist_id: specialistId }),
      })
      setSubmitting(false)
      setResult(score)
    }
  }

  const severity = result !== null
    ? (type === 'PHQ9' ? getPhq9Severity(result) : getGad7Severity(result))
    : null

  const progress = ((step) / questions.length) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-20 sm:pb-0">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">
              {type === 'PHQ9' ? 'PHQ-9 · Депрессия' : 'GAD-7 · Тревога'}
            </p>
            {result === null && (
              <p className="text-xs text-slate-400 mt-0.5">
                Вопрос {step + 1} из {questions.length}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {result === null ? (
          <div className="flex flex-col gap-5 p-6">
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Question */}
            <p className="text-base font-semibold text-slate-800 leading-snug min-h-[3rem]">
              {questions[step]}
            </p>
            <p className="text-xs text-slate-400 -mt-3">
              Насколько часто за последние 2 недели?
            </p>

            {/* Options */}
            <div className="flex flex-col gap-2">
              {CLINICAL_OPTIONS.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => !submitting && handleAnswer(i)}
                  disabled={submitting}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50 text-sm text-slate-700 font-medium transition disabled:opacity-50"
                >
                  <span className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                    {i}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${severity!.bg}`}>
              <span className={severity!.color}>{result}</span>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800">
                {type === 'PHQ9' ? 'PHQ-9' : 'GAD-7'}: {result} / {type === 'PHQ9' ? 27 : 21}
              </p>
              <p className={`text-sm font-semibold mt-1 ${severity!.color}`}>{severity!.label}</p>
            </div>
            <p className="text-xs text-slate-400 max-w-xs">
              Результат сохранён и виден вашему специалисту. Следующий опросник — через месяц.
            </p>
            <button
              onClick={() => onDone(result)}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition"
            >
              Готово
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Types ──────────────────────────────────────────────────────────────────
interface Profile { name: string | null; email: string | null }
interface CheckinRow {
  id: string; wellbeing: number | null; mood: string | null; created_at: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deep_data?: any
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-20 sm:pb-0">
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
            className="w-full resize-none rounded-2xl border border-slate-200 focus:border-blue-400 focus:outline-none p-4 text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed"
            style={{ minHeight: 160, fontSize: 16 }} />
          <button type="button" onClick={toggle} disabled={!supported}
            className={`absolute bottom-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center transition ${
              !supported ? 'opacity-30 cursor-not-allowed bg-slate-100'
              : listening ? 'bg-red-500 shadow-lg animate-pulse'
              : 'bg-blue-50 hover:bg-blue-100 text-blue-600'}`}>
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
                className={`w-11 h-11 rounded-xl text-xl transition border ${mood === m.emoji ? 'border-blue-400 bg-blue-50 scale-110' : 'border-slate-100 bg-slate-50 hover:border-blue-200'}`}>
                {m.emoji}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">Отмена</button>
          <button onClick={save} disabled={!content.trim() || saving}
            className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold">
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

  const nowStr = new Date().toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const scoreBar = (value: number | null | undefined): string => {
    if (value == null) return '<span style="font-size:12px;color:#94a3b8;">—</span>'
    const pct = Math.round((value / 10) * 100)
    return `<div style="display:flex;align-items:center;gap:8px;"><div style="width:90px;height:5px;background:#e2e8f0;border-radius:3px;overflow:hidden;flex-shrink:0;"><div style="height:5px;background:#2563eb;width:${pct}%;border-radius:3px;"></div></div><span style="font-size:13px;font-weight:600;color:#1e293b;">${value}<span style="font-size:10px;font-weight:400;color:#94a3b8;">/10</span></span></div>`
  }

  const specialistHtml = specialist?.name
    ? `<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:28px;">
        <div style="width:3px;height:34px;background:#2563eb;border-radius:2px;flex-shrink:0;"></div>
        <div>
          <p style="font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;margin:0 0 3px;">Подготовлено для</p>
          <p style="font-size:13px;font-weight:600;color:#1e293b;margin:0;">${specialist.name}<span style="font-weight:400;color:#64748b;"> · ${specialist.specialty || ''}</span></p>
        </div>
      </div>`
    : ''

  const html = `
    <div style="width:794px;padding:52px 60px 80px;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1e293b;box-sizing:border-box;">

      <!-- ШАПКА -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2px solid #1e293b;margin-bottom:30px;">
        <div>
          <p style="font-size:9px;font-weight:700;color:#2563eb;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px;">Metanoia AI</p>
          <p style="font-size:20px;font-weight:700;color:#1e293b;margin:0 0 4px;letter-spacing:-0.5px;">Психологический профиль</p>
          <p style="font-size:11px;color:#64748b;margin:0;">Подготовка к приёму у специалиста</p>
        </div>
        <div style="text-align:right;">
          <p style="font-size:12px;font-weight:600;color:#1e293b;margin:0 0 3px;">${userName}</p>
          <p style="font-size:11px;color:#64748b;margin:0 0 5px;">${date}</p>
          <p style="font-size:8px;color:#94a3b8;margin:0;letter-spacing:2px;text-transform:uppercase;">Конфиденциально</p>
        </div>
      </div>

      ${specialistHtml}

      <!-- 01 ПОКАЗАТЕЛИ -->
      <div style="border-top:1.5px solid #94a3b8;padding-top:20px;margin-bottom:28px;">
        <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:18px;">
          <span style="font-size:10px;font-weight:700;color:#2563eb;letter-spacing:3px;">01</span>
          <span style="font-size:10px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;">Показатели состояния</span>
          <span style="font-size:9px;color:#94a3b8;margin-left:4px;">${checkinDate}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px 32px;margin-bottom:18px;">
          <div>
            <p style="font-size:9px;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px;">Самочувствие</p>
            ${scoreBar(checkin.wellbeing)}
          </div>
          <div>
            <p style="font-size:9px;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px;">Тревога</p>
            ${scoreBar(checkin.anxiety)}
          </div>
          <div>
            <p style="font-size:9px;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px;">Сон</p>
            <p style="font-size:13px;font-weight:600;color:#1e293b;margin:0;">${checkin.sleep != null ? `${checkin.sleep} ч` : '—'}</p>
          </div>
          <div>
            <p style="font-size:9px;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px;">Ощущение контроля</p>
            ${scoreBar(checkin.control)}
          </div>
        </div>
        ${energyParts.length ? `<div style="margin-bottom:14px;">
          <p style="font-size:9px;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin:0 0 5px;">Энергия</p>
          <p style="font-size:12px;color:#1e293b;margin:0;">${energyStr}</p>
        </div>` : ''}
        ${checkin.emotions?.length ? `<div style="margin-bottom:14px;">
          <p style="font-size:9px;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin:0 0 5px;">Эмоции</p>
          <p style="font-size:12px;color:#1e293b;margin:0;">${emotionsStr}</p>
        </div>` : ''}
        ${checkin.stressors?.length ? `<div style="${checkin.freeText ? 'margin-bottom:14px;' : ''}">
          <p style="font-size:9px;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin:0 0 5px;">Стрессоры</p>
          <p style="font-size:12px;color:#1e293b;margin:0;">${checkin.stressors.join(', ')}</p>
        </div>` : ''}
        ${checkin.freeText ? `<div style="border-left:2px solid #2563eb;padding-left:14px;">
          <p style="font-size:9px;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin:0 0 5px;">Своими словами</p>
          <p style="font-size:12px;line-height:1.75;color:#334155;font-style:italic;margin:0;">${checkin.freeText}</p>
        </div>` : ''}
      </div>

      <!-- 02 РЕЗЮМЕ -->
      <div style="border-top:1.5px solid #94a3b8;padding-top:20px;margin-bottom:28px;">
        <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:16px;">
          <span style="font-size:10px;font-weight:700;color:#2563eb;letter-spacing:3px;">02</span>
          <span style="font-size:10px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;">Резюме состояния</span>
          <span style="font-size:9px;color:#94a3b8;margin-left:6px;">AI‑анализ</span>
        </div>
        <p style="font-size:13px;line-height:1.8;color:#1e293b;margin:0;white-space:pre-wrap;">${cleanResume}</p>
      </div>

      ${topics.length > 0 ? `
      <!-- 03 ТЕМЫ -->
      <div style="border-top:1.5px solid #94a3b8;padding-top:20px;margin-bottom:28px;">
        <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:16px;">
          <span style="font-size:10px;font-weight:700;color:#2563eb;letter-spacing:3px;">03</span>
          <span style="font-size:10px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;">Темы для обсуждения</span>
        </div>
        ${topics.map((t, i) => `<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:11px;">
          <span style="font-size:11px;font-weight:700;color:#2563eb;min-width:16px;margin-top:1px;flex-shrink:0;">${i + 1}</span>
          <p style="font-size:13px;line-height:1.65;color:#1e293b;margin:0;flex:1;">${t}</p>
        </div>`).join('')}
      </div>` : ''}

      <!-- ФУТЕР -->
      <div style="border-top:1px solid #e2e8f0;padding-top:12px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
        <p style="font-size:9px;color:#94a3b8;margin:0;">Metanoia AI · Не является медицинским заключением</p>
        <p style="font-size:9px;color:#94a3b8;margin:0;">${nowStr}</p>
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

  const topMarginMm = 14
  pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH)

  let pageStart = pageH
  while (pageStart < imgH) {
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, topMarginMm - pageStart, pageW, imgH)
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, pageW, topMarginMm, 'F')
    pageStart += pageH
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
        <p key={p.dataKey} style={{ color: '#2563eb', fontWeight: 600 }}>
          {LABEL_MAP[p.dataKey] ?? p.dataKey}: {p.value}
        </p>
      ))}
    </div>
  )
}

// ── Week strip ─────────────────────────────────────────────────────────────
function WeekStrip({ checkins }: { checkins: CheckinRow[] }) {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  const checkinDays = new Set(checkins.map((c) => new Date(c.created_at).toLocaleDateString('ru-RU')))
  const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  const todayStr = today.toLocaleDateString('ru-RU')

  return (
    <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #ede9e4' }}>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Эта неделя</p>
      <div className="flex justify-between">
        {days.map((d, i) => {
          const dStr = d.toLocaleDateString('ru-RU')
          const done = checkinDays.has(dStr)
          const isToday = dStr === todayStr
          const isFuture = d > today
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-slate-400">{DAY_LABELS[i]}</span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition"
                style={{
                  background: done ? '#2563eb' : isToday ? '#eff6ff' : 'transparent',
                  border: isToday ? '2px solid #2563eb' : done ? 'none' : '1.5px solid #d1d5db',
                  color: done ? '#fff' : isToday ? '#2563eb' : isFuture ? '#e5e7eb' : '#9ca3af',
                  opacity: isFuture ? 0.4 : 1,
                }}
              >
                {done ? '✓' : d.getDate()}
              </div>
            </div>
          )
        })}
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

// ── Bottom nav SVG icons ────────────────────────────────────────────────────
function IconHome({ active }: { active: boolean }) {
  const c = active ? '#007AFF' : '#6C6C70'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" fill={c}/>
      <path d="M9 21V12h6v9" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconJournal({ active }: { active: boolean }) {
  const c = active ? '#007AFF' : '#6C6C70'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="14" height="20" rx="2" fill={c}/>
      <path d="M8 7h6M8 11h6M8 15h4" stroke="white" strokeWidth={1.5} strokeLinecap="round"/>
    </svg>
  )
}
function IconChart({ active }: { active: boolean }) {
  const c = active ? '#007AFF' : '#6C6C70'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 17l4.5-5 4 3.5 5-7 4 4V21H3V17z" fill={c} fillOpacity="0.2"/>
      <path d="M3 17l4.5-5 4 3.5 5-7 4 4" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="3" y1="21" x2="21" y2="21" stroke={c} strokeWidth={1.5} strokeLinecap="round"/>
    </svg>
  )
}
function IconAI({ active }: { active: boolean }) {
  const c = active ? '#007AFF' : '#6C6C70'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 3C7.03 3 3 6.58 3 11c0 2.05.85 3.9 2.24 5.28L4 21l4.72-1.24A9.3 9.3 0 0012 20c4.97 0 9-3.58 9-8s-4.03-8-9-8z" fill={c}/>
      <circle cx="9" cy="11" r="1.2" fill="white"/>
      <circle cx="12" cy="11" r="1.2" fill="white"/>
      <circle cx="15" cy="11" r="1.2" fill="white"/>
    </svg>
  )
}
function IconMore({ active }: { active: boolean }) {
  const c = active ? '#007AFF' : '#6C6C70'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="5" cy="12" r="1.5" fill={c}/>
      <circle cx="12" cy="12" r="1.5" fill={c}/>
      <circle cx="19" cy="12" r="1.5" fill={c}/>
    </svg>
  )
}

// ── Dynamics helpers ───────────────────────────────────────────────────────
type MetricId = 'wellbeing' | 'anxiety' | 'sleep' | 'energy'
const METRIC_CONFIG: Record<MetricId, {
  label: string; color: string; unit: string
  lowerIsBetter: boolean; yDomain: [number, number]
}> = {
  wellbeing: { label: 'Самочувствие', color: '#2563eb', unit: '/ 10', lowerIsBetter: false, yDomain: [0, 10] },
  anxiety:   { label: 'Тревога',      color: '#f97316', unit: '/ 10', lowerIsBetter: true,  yDomain: [0, 10] },
  sleep:     { label: 'Сон',          color: '#7c3aed', unit: 'ч',    lowerIsBetter: false, yDomain: [0, 12] },
  energy:    { label: 'Энергия',      color: '#16a34a', unit: '/ 5',  lowerIsBetter: false, yDomain: [0, 5]  },
}
function getMetricValue(c: CheckinRow, metric: MetricId): number | null {
  const dd = c.deep_data
  switch (metric) {
    case 'wellbeing': return c.wellbeing ?? null
    case 'anxiety':   return dd?.anxietyLevel ?? null
    case 'sleep':     return dd?.sleepHours ?? null
    case 'energy': {
      const m = dd?.energyMorning, a = dd?.energyAfternoon, e = dd?.energyEvening
      if (m == null && a == null && e == null) return null
      return ((m ?? 0) + (a ?? 0) + (e ?? 0)) / 3
    }
  }
}
function avgMetric(list: CheckinRow[], metric: MetricId): number | null {
  const vals = list.map(c => getMetricValue(c, metric)).filter((v): v is number => v !== null)
  if (!vals.length) return null
  return parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
}
function metricTrend(delta: number | null, lowerIsBetter: boolean) {
  if (delta === null) return null
  if (Math.abs(delta) <= 0.1) return { icon: '→', color: '#94a3b8', deltaStr: '' }
  const improved = lowerIsBetter ? delta < 0 : delta > 0
  return { icon: delta > 0 ? '↗' : '↘', color: improved ? '#16a34a' : '#ef4444', deltaStr: (delta > 0 ? '+' : '') + delta.toFixed(1) }
}
function TinySparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1
  const w = 72, h = 28, step = w / (data.length - 1)
  const pts = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(' ')
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function CabinetClient() {
  const router = useRouter()
  const [tab, setTab] = useState<TabId>('today')

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab') as TabId | null
    if (t && TABS.some((x) => x.id === t)) setTab(t)
  }, [])

  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [checkins, setCheckins] = useState<CheckinRow[]>([])
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [isPro, setIsPro] = useState(false)

  // Review banner state
  const [reviewBanner, setReviewBanner] = useState<{
    specialistId: string
    specialistName: string
  } | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewDismissed, setReviewDismissed] = useState(false)

  // Clinical scales state
  const [clinicalDue, setClinicalDue] = useState<Array<'PHQ9' | 'GAD7'>>([])
  const [clinicalHistory, setClinicalHistory] = useState<{
    PHQ9: Array<{ score: number; created_at: string }>
    GAD7: Array<{ score: number; created_at: string }>
  }>({ PHQ9: [], GAD7: [] })
  const [clinicalModal, setClinicalModal] = useState<'PHQ9' | 'GAD7' | null>(null)
  const [linkedSpecialistId, setLinkedSpecialistId] = useState<string | null>(null)

  // Homework state
  const [homework, setHomework] = useState<HomeworkItem[]>([])
  const [completingHw, setCompletingHw] = useState<HomeworkItem | null>(null)

  // Dynamics state
  const [dynamicsPeriod, setDynamicsPeriod] = useState<30 | 90>(30)
  const [selectedMetric, setSelectedMetric] = useState<MetricId>('wellbeing')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setUserEmail(user.email ?? null)

      const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

      const [{ data: prof }, { data: chk }, { data: ent }, { data: links }, { data: clinical }, { data: hw }] = await Promise.all([
        supabase.from('profiles').select('name, email').eq('id', user.id).single(),
        supabase.from('checkins').select('id, wellbeing, mood, created_at, deep_data').eq('user_id', user.id).order('created_at', { ascending: false }).limit(90),
        supabase.from('journal_entries').select('id, content, mood, voice_input, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('specialist_clients')
          .select('specialist_id, created_at, specialists(id, name)')
          .eq('client_id', user.id)
          .lt('created_at', sevenDaysAgo)
          .limit(1),
        supabase.from('clinical_assessments')
          .select('type, total_score, created_at')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('homework')
          .select('id, template, title, description, due_date, status, assigned_at, completed_at')
          .eq('client_id', user.id)
          .order('assigned_at', { ascending: false })
          .limit(20),
      ])

      setProfile(prof)
      setCheckins(chk ?? [])
      setEntries(ent ?? [])
      setHomework((hw ?? []) as HomeworkItem[])
      setLoading(false)

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()
      setIsPro(!!sub)

      // Clinical: check which are due (never taken or > 30 days ago)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()
      const lastPHQ9 = clinical?.find(c => c.type === 'PHQ9')
      const lastGAD7 = clinical?.find(c => c.type === 'GAD7')
      const due: Array<'PHQ9' | 'GAD7'> = []
      if (!lastPHQ9 || lastPHQ9.created_at < thirtyDaysAgo) due.push('PHQ9')
      if (!lastGAD7 || lastGAD7.created_at < thirtyDaysAgo) due.push('GAD7')
      setClinicalDue(due)
      setClinicalHistory({
        PHQ9: (clinical ?? []).filter(c => c.type === 'PHQ9').slice(0, 6).reverse().map(c => ({ score: c.total_score, created_at: c.created_at })),
        GAD7: (clinical ?? []).filter(c => c.type === 'GAD7').slice(0, 6).reverse().map(c => ({ score: c.total_score, created_at: c.created_at })),
      })

      // Save linked specialist id (from any link, not just old ones)
      const { data: anyLink } = await supabase
        .from('specialist_clients')
        .select('specialist_id')
        .eq('client_id', user.id)
        .limit(1)
        .single()
      if (anyLink?.specialist_id) setLinkedSpecialistId(anyLink.specialist_id)

      // Check if review banner should show
      if (links && links.length > 0) {
        const link = links[0]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spec = link.specialists as any
        if (spec?.id && spec?.name) {
          const { data: existing } = await supabase
            .from('specialist_reviews')
            .select('id')
            .eq('specialist_id', spec.id)
            .eq('user_id', user.id)
            .maybeSingle()
          if (!existing) {
            setReviewBanner({ specialistId: spec.id, specialistName: spec.name })
          }
        }
      }
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

  function handleGoHome() {
    router.push('/')
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  async function submitReview() {
    if (!reviewBanner || reviewRating === 0) return
    setReviewSubmitting(true)
    try {
      await fetch('/api/specialist/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialist_id: reviewBanner.specialistId,
          rating: reviewRating,
          text: reviewText.trim() || null,
        }),
      })
    } finally {
      setReviewSubmitting(false)
      setReviewBanner(null)
    }
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
    <div className="flex flex-col overflow-hidden" style={{ height: '100dvh', background: '#faf9f7' }}>
      {/* Header */}
      <header className="bg-white shrink-0 z-40" style={{ borderBottom: '1px solid #ede9e4' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/login">
            <Logo size="md" />
          </a>
          <div className="relative flex items-center">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 text-sm text-slate-600 font-medium hover:text-slate-800 transition px-2 py-1.5 rounded-lg hover:bg-slate-50"
            >
              <span className="hidden sm:inline">{displayName}</span>
              <span className="sm:hidden text-slate-400 text-xs">Меню</span>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg py-1 min-w-[180px] z-50">
                  <button
                    onClick={() => { setShowUserMenu(false); router.push('/cabinet/profile') }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                    Личные данные
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); handleGoHome() }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                  >
                    На главную
                  </button>
                  <div className="my-1 border-t border-slate-50" />
                  <button
                    onClick={() => { setShowUserMenu(false); handleSignOut() }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
                  >
                    Выйти из аккаунта
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Tab bar — desktop only */}
      <div className="hidden md:block bg-white shrink-0 z-30" style={{ borderBottom: '1px solid #ede9e4' }}>
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex overflow-x-auto no-scrollbar">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="shrink-0 px-4 py-3.5 text-sm font-medium border-b-2 transition whitespace-nowrap"
                style={{
                  borderColor: tab === t.id ? '#2563eb' : 'transparent',
                  color: tab === t.id ? '#2563eb' : '#64748b',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-x-hidden ${tab === 'ai' ? 'overflow-hidden flex flex-col min-h-0' : 'overflow-y-auto'}`}>
        <div className={`max-w-2xl w-full mx-auto px-4 ${tab === 'ai' ? 'flex flex-col flex-1 min-h-0' : 'py-6 pb-32 md:pb-6'}`}>

        {/* ── СЕГОДНЯ ── */}
        {tab === 'today' && (
          <div className="flex flex-col gap-4">

            {/* 1. Приветствие */}
            <div>
              <h1 className="text-xl font-bold text-slate-900">Привет, {firstName}!</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p className="text-slate-500 text-sm mt-2">Рады видеть тебя. Как ты сегодня?</p>
            </div>

            {/* 2. Стрик */}
            {streak > 0 && (
              <div
                className="rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fde68a' }}
              >
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#92400e' }}>
                    {streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'} подряд
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#b45309' }}>Продолжай — это работает</p>
                </div>
              </div>
            )}

            {/* 3. Полоска недели */}
            <WeekStrip checkins={checkins} />

            {/* Review banner */}
            {reviewBanner && !reviewDismissed && (
              <div className="bg-white border border-amber-200 rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Оцените вашего специалиста</p>
                    <p className="text-xs text-slate-400 mt-0.5">{reviewBanner.specialistName}</p>
                  </div>
                  <button
                    onClick={() => setReviewDismissed(true)}
                    className="text-slate-300 hover:text-slate-500 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="text-2xl transition-transform hover:scale-110"
                    >
                      <span className={star <= reviewRating ? 'text-amber-400' : 'text-slate-200'}>★</span>
                    </button>
                  ))}
                </div>
                {reviewRating > 0 && (
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Написать отзыв (необязательно)"
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 resize-none"
                  />
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setReviewDismissed(true)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50"
                  >
                    Пропустить
                  </button>
                  <button
                    onClick={submitReview}
                    disabled={reviewRating === 0 || reviewSubmitting}
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold"
                  >
                    {reviewSubmitting ? 'Отправка…' : 'Отправить'}
                  </button>
                </div>
              </div>
            )}

            {/* Clinical scale banners */}
            {clinicalDue.length > 0 && linkedSpecialistId && clinicalDue.map((type) => (
              <div key={type} className="bg-white border border-purple-200 rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {type === 'PHQ9' ? 'PHQ-9: опросник депрессии' : 'GAD-7: опросник тревоги'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ~2 минуты · {type === 'PHQ9' ? '9' : '7'} вопросов · раз в месяц
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setClinicalModal(type)}
                  className="self-start px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition"
                >
                  Пройти опросник →
                </button>
              </div>
            ))}

            {/* Homework cards */}
            {homework.filter((h) => {
              if (h.status === 'assigned') return true
              if (h.status === 'completed' && h.completed_at) {
                return new Date(h.completed_at).toDateString() === new Date().toDateString()
              }
              return false
            }).map((hw) => {
              const tmpl = HOMEWORK_TEMPLATES[hw.template] ?? HOMEWORK_TEMPLATES.custom
              const isDone = hw.status === 'completed'
              return (
                <div key={hw.id} className={`border rounded-2xl p-5 flex items-start gap-4 ${
                  isDone ? 'bg-green-50 border-green-200 opacity-80' : 'bg-white border-violet-200'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 mt-0.5 ${
                    isDone ? 'bg-green-100' : 'bg-violet-100'
                  }`}>
                    {isDone ? '✅' : tmpl.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isDone ? 'text-slate-400' : 'text-slate-800'}`}>{hw.title}</p>
                    {!isDone && tmpl.desc && !hw.description && (
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{tmpl.desc}</p>
                    )}
                    {!isDone && hw.description && (
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{hw.description}</p>
                    )}
                    {isDone ? (
                      <p className="text-xs text-green-600 mt-1 font-medium">Выполнено сегодня ✓</p>
                    ) : hw.due_date && (
                      <p className="text-xs text-violet-400 mt-1 font-medium">
                        до {new Date(hw.due_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                  {isDone ? (
                    <span className="shrink-0 px-3 py-2 bg-green-100 text-green-700 text-xs font-semibold rounded-xl mt-0.5">
                      ✓ Готово
                    </span>
                  ) : (
                    <button
                      onClick={() => setCompletingHw(hw)}
                      className="shrink-0 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition mt-0.5"
                    >
                      Выполнить
                    </button>
                  )}
                </div>
              )
            })}

            {/* 4. Блок чек-ина */}
            {todayCheckin ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Чек-ин пройден сегодня</p>
                </div>
                <a href={`/cabinet?tab=dynamics`}
                  className="inline-flex text-blue-600 hover:text-blue-500 text-sm font-semibold transition">
                  Посмотреть анализ →
                </a>
              </div>
            ) : (
              <div
                className="rounded-3xl p-6 flex flex-col gap-4"
                style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    Ежедневный чек-ин
                  </p>
                  <h2 className="text-white font-bold text-lg leading-snug">
                    Как ты себя чувствуешь сегодня?
                  </h2>
                </div>
                <a
                  href="/checkin"
                  className="self-start px-5 py-2.5 text-sm font-bold rounded-2xl transition"
                  style={{ background: '#ffffff', color: '#2563eb' }}
                >
                  Пройти чек-ин →
                </a>
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
              <button onClick={() => isPro ? setShowNewEntry(true) : router.push('/upgrade?reason=journal')}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-2xl transition shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {isPro ? 'Новая запись' : '🔒 Новая запись'}
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
                    <div key={e.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-sm transition">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {e.mood && <span className="text-lg">{e.mood}</span>}
                          <p className="text-xs text-slate-400">
                            {d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} · {d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {e.voice_input && <span className="text-xs text-blue-400 font-medium">🎙 Голос</span>}
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Динамика</h2>
              {checkins.length >= 2 && (
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                  {([30, 90] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setDynamicsPeriod(p)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                        dynamicsPeriod === p ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {p} дней
                    </button>
                  ))}
                </div>
              )}
            </div>

            {checkins.length < 2 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
                <p className="text-slate-400 text-sm">Нужно минимум 2 чек-ина для графика</p>
                <a href="/checkin" className="mt-3 inline-flex text-blue-600 text-sm font-semibold hover:text-blue-500">Пройти чек-ин →</a>
              </div>
            ) : (
              <>
                {/* Stats */}
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

                {/* 4 metric cards */}
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(METRIC_CONFIG) as MetricId[]).map((metric) => {
                    const cfg = METRIC_CONFIG[metric]
                    const curr = checkins.slice(0, dynamicsPeriod)
                    const prev = checkins.slice(dynamicsPeriod, dynamicsPeriod * 2)
                    const currAvg = avgMetric(curr, metric)
                    const prevAvg = avgMetric(prev, metric)
                    const delta = currAvg !== null && prevAvg !== null ? currAvg - prevAvg : null
                    const trend = metricTrend(delta, cfg.lowerIsBetter)
                    const sparkData = [...curr].reverse().map(c => getMetricValue(c, metric)).filter((v): v is number => v !== null)
                    const isSelected = selectedMetric === metric
                    return (
                      <button
                        key={metric}
                        onClick={() => setSelectedMetric(metric)}
                        className={`bg-white rounded-2xl p-4 text-left flex flex-col gap-1.5 transition border-2 ${
                          isSelected ? 'shadow-sm' : 'border-transparent border hover:border-slate-200'
                        }`}
                        style={isSelected ? { borderColor: cfg.color } : { borderColor: 'transparent' }}
                      >
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{cfg.label}</p>
                        {currAvg !== null ? (
                          <>
                            <p className="text-2xl font-bold text-slate-800 leading-none">
                              {currAvg.toFixed(1)}
                              <span className="text-sm font-normal text-slate-400 ml-1">{cfg.unit}</span>
                            </p>
                            {trend && trend.deltaStr && (
                              <p className="text-xs font-semibold" style={{ color: trend.color }}>
                                {trend.icon} {trend.deltaStr} vs ранее
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-slate-400">нет данных</p>
                        )}
                        {sparkData.length >= 2 && (
                          <TinySparkline data={sparkData} color={isSelected ? cfg.color : '#cbd5e1'} />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Detailed chart */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 min-w-0 overflow-hidden">
                  <p className="text-sm font-semibold text-slate-700 mb-4">
                    {METRIC_CONFIG[selectedMetric].label} · {dynamicsPeriod} дней
                  </p>
                  {(() => {
                    const cfg = METRIC_CONFIG[selectedMetric]
                    const detailData = [...checkins.slice(0, dynamicsPeriod)].reverse().map((c) => ({
                      date: new Date(c.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
                      value: getMetricValue(c, selectedMetric),
                    })).filter((d): d is { date: string; value: number } => d.value !== null)
                    if (detailData.length < 2) return <p className="text-sm text-slate-400">Недостаточно данных для этой метрики</p>
                    return (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={detailData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                          <YAxis domain={cfg.yDomain} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null
                              const v = payload[0].value as number
                              return (
                                <div className="bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-lg text-xs">
                                  <p className="font-semibold text-slate-800">{v.toFixed(1)} {cfg.unit}</p>
                                  <p className="text-slate-400">{payload[0].payload.date}</p>
                                </div>
                              )
                            }}
                          />
                          <Line type="monotone" dataKey="value" stroke={cfg.color} strokeWidth={2} dot={{ r: 3, fill: cfg.color }} activeDot={{ r: 5 }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    )
                  })()}
                </div>
              </>
            )}

            {/* Clinical scales history */}
            {(clinicalHistory.PHQ9.length > 0 || clinicalHistory.GAD7.length > 0) && (
              <div className="bg-white border border-slate-100 rounded-2xl p-5">
                <p className="text-sm font-semibold text-slate-700 mb-4">Клинические шкалы</p>
                {clinicalHistory.PHQ9.length > 0 && (() => {
                  const latest = clinicalHistory.PHQ9[clinicalHistory.PHQ9.length - 1]
                  const sev = getPhq9Severity(latest.score)
                  return (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-500 mb-1">PHQ-9 (депрессия · макс. 27)</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm text-slate-700">
                            {clinicalHistory.PHQ9.map(h => h.score).join(' → ')}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sev.bg} ${sev.color}`}>
                            {sev.label}
                          </span>
                        </div>
                      </div>
                      <div className={`w-10 h-10 rounded-xl ${sev.bg} flex items-center justify-center shrink-0`}>
                        <span className={`text-sm font-bold ${sev.color}`}>{latest.score}</span>
                      </div>
                    </div>
                  )
                })()}
                {clinicalHistory.GAD7.length > 0 && (() => {
                  const latest = clinicalHistory.GAD7[clinicalHistory.GAD7.length - 1]
                  const sev = getGad7Severity(latest.score)
                  return (
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-500 mb-1">GAD-7 (тревога · макс. 21)</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm text-slate-700">
                            {clinicalHistory.GAD7.map(h => h.score).join(' → ')}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sev.bg} ${sev.color}`}>
                            {sev.label}
                          </span>
                        </div>
                      </div>
                      <div className={`w-10 h-10 rounded-xl ${sev.bg} flex items-center justify-center shrink-0`}>
                        <span className={`text-sm font-bold ${sev.color}`}>{latest.score}</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
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

            {!isPro ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">🔒</div>
                <div>
                  <p className="font-semibold text-slate-800 mb-1">Доступно в Pro</p>
                  <p className="text-slate-500 text-sm">PDF-отчёт для специалиста — функция Pro-плана. Покажи специалисту картину своего состояния.</p>
                </div>
                <button
                  onClick={() => router.push('/upgrade?reason=pdf')}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-2xl transition"
                >
                  Перейти к Pro
                </button>
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">01</span>
                    Последний чек-ин — самочувствие, эмоции, стрессоры
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">02</span>
                    Резюме состояния — AI-синтез без цитирования источников
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">03</span>
                    Темы для обсуждения — конкретные, из твоего контекста
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
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-2xl transition"
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
            )}

            <p className="text-slate-400 text-xs text-center px-4">
              Специалист видит психологический портрет — не переписку. Источники не раскрываются.
            </p>
          </div>
        )}
        </div>
      </div>

      {completingHw && (
        <HomeworkCompleteModal
          hw={completingHw}
          onClose={() => setCompletingHw(null)}
          onDone={() => {
            const id = completingHw.id
            setHomework((prev) => prev.map((h) =>
              h.id === id ? { ...h, status: 'completed', completed_at: new Date().toISOString() } : h
            ))
            setCompletingHw(null)
          }}
        />
      )}

      {clinicalModal && linkedSpecialistId && (
        <ClinicalModal
          type={clinicalModal}
          specialistId={linkedSpecialistId}
          onClose={() => setClinicalModal(null)}
          onDone={(score) => {
            const type = clinicalModal
            setClinicalDue((prev) => prev.filter((t) => t !== type))
            setClinicalHistory((prev) => ({
              ...prev,
              [type]: [...prev[type], { score, created_at: new Date().toISOString() }],
            }))
            setClinicalModal(null)
          }}
        />
      )}

      {showNewEntry && (
        <NewEntryModal
          onClose={() => setShowNewEntry(false)}
          onSaved={(e) => { setEntries((prev) => [e, ...prev]); setShowNewEntry(false) }}
        />
      )}

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed z-50 flex justify-around items-center"
        style={{
          bottom: 16,
          left: 16,
          right: 16,
          background: 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          border: '0.5px solid rgba(0, 0, 0, 0.1)',
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 8,
          paddingRight: 8,
        }}
      >
        {/* Сегодня */}
        <button
          onClick={() => setTab('today')}
          className="flex flex-col items-center gap-0.5 transition-all"
          style={{
            background: tab === 'today' ? 'rgba(116,116,128,0.12)' : 'transparent',
            borderRadius: 14, padding: '6px 14px',
          }}
        >
          <IconHome active={tab === 'today'} />
          <span className="text-[10px] font-semibold" style={{ color: tab === 'today' ? '#007AFF' : '#6C6C70' }}>Сегодня</span>
        </button>
        {/* Журнал */}
        <button
          onClick={() => setTab('journal')}
          className="flex flex-col items-center gap-0.5 transition-all"
          style={{
            background: tab === 'journal' ? 'rgba(116,116,128,0.12)' : 'transparent',
            borderRadius: 14, padding: '6px 14px',
          }}
        >
          <IconJournal active={tab === 'journal'} />
          <span className="text-[10px] font-semibold" style={{ color: tab === 'journal' ? '#007AFF' : '#6C6C70' }}>Журнал</span>
        </button>
        {/* Динамика */}
        <button
          onClick={() => setTab('dynamics')}
          className="flex flex-col items-center gap-0.5 transition-all"
          style={{
            background: tab === 'dynamics' ? 'rgba(116,116,128,0.12)' : 'transparent',
            borderRadius: 14, padding: '6px 14px',
          }}
        >
          <IconChart active={tab === 'dynamics'} />
          <span className="text-[10px] font-semibold" style={{ color: tab === 'dynamics' ? '#007AFF' : '#6C6C70' }}>Динамика</span>
        </button>
        {/* AI */}
        <button
          onClick={() => setTab('ai')}
          className="flex flex-col items-center gap-0.5 transition-all"
          style={{
            background: tab === 'ai' ? 'rgba(116,116,128,0.12)' : 'transparent',
            borderRadius: 14, padding: '6px 14px',
          }}
        >
          <IconAI active={tab === 'ai'} />
          <span className="text-[10px] font-semibold" style={{ color: tab === 'ai' ? '#007AFF' : '#6C6C70' }}>AI</span>
        </button>
        {/* Ещё */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="flex flex-col items-center gap-0.5 transition-all"
            style={{
              background: tab === 'pdf' || tab === 'calendar' ? 'rgba(116,116,128,0.12)' : 'transparent',
              borderRadius: 14, padding: '6px 14px',
            }}
          >
            <IconMore active={tab === 'pdf' || tab === 'calendar'} />
            <span
              className="text-[10px] font-semibold"
              style={{ color: tab === 'pdf' || tab === 'calendar' ? '#007AFF' : '#6C6C70' }}
            >
              Ещё
            </span>
          </button>
          {showMoreMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
              <div
                className="absolute bottom-full right-0 mb-2 rounded-2xl shadow-lg overflow-hidden z-50 min-w-[140px]"
                style={{
                  background: 'rgba(255, 255, 255, 0.94)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '0.5px solid rgba(0, 0, 0, 0.1)',
                }}
              >
                <button
                  onClick={() => { setTab('pdf'); setShowMoreMenu(false) }}
                  className="w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2.5"
                  style={{ color: tab === 'pdf' ? '#007AFF' : '#1a2535', background: tab === 'pdf' ? '#e8f2ff' : 'transparent' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                    <path d="M14 2v6h6M12 18v-6M9 15h6"/>
                  </svg>
                  PDF
                </button>
                <div style={{ height: 1, background: '#ede9e4' }} />
                <button
                  onClick={() => { setTab('calendar'); setShowMoreMenu(false) }}
                  className="w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2.5"
                  style={{ color: tab === 'calendar' ? '#007AFF' : '#1a2535', background: tab === 'calendar' ? '#e8f2ff' : 'transparent' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  Календарь
                </button>
              </div>
            </>
          )}
        </div>
      </nav>
    </div>
  )
}
