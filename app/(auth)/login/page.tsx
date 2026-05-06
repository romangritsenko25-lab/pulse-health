'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Quiz data ──────────────────────────────────────────────────────────────
const EMOTIONS = ['Тревожно', 'Подавленно', 'Раздражённо', 'Устало', 'Нормально', 'Хорошо']
const DURATIONS = ['Сегодня', 'Несколько дней', 'Больше недели', 'Давно']
const SUPPORTS = ['Да', 'Не всегда', 'Нет']

function getInsight(emotion: string, duration: string, support: string): string {
  const negative = ['Тревожно', 'Подавленно', 'Раздражённо'].includes(emotion)
  const longDuration = ['Больше недели', 'Давно'].includes(duration)
  const noSupport = support === 'Нет'
  const positive = ['Нормально', 'Хорошо'].includes(emotion)

  if (positive) {
    return 'Хорошо, что сейчас неплохо. Даже в спокойные периоды полезно лучше понять себя — это помогает когда становится тяжелее. Metanoia AI поможет составить карту своего состояния.'
  }
  if (emotion === 'Тревожно' && longDuration && noSupport) {
    return 'Длительная тревога без поддержки — это сигнал который стоит обсудить со специалистом. Metanoia AI поможет сформулировать что именно происходит перед первой встречей.'
  }
  if (emotion === 'Подавленно' && longDuration) {
    return 'Длительное подавленное состояние заслуживает внимания. Metanoia AI поможет структурировать твои мысли и чувства так, чтобы разговор со специалистом сразу шёл в глубину.'
  }
  if (emotion === 'Раздражённо' && longDuration) {
    return 'Хроническое раздражение часто сигнализирует о накопленном стрессе или неудовлетворённой потребности. Разобраться с этим поможет структурированный анализ.'
  }
  if (emotion === 'Устало' && longDuration) {
    return 'Хроническая усталость часто маскирует более глубокие процессы. Структурированный опрос поможет понять откуда она берётся и что за ней стоит.'
  }
  if (negative && noSupport) {
    return 'Переживать сложное состояние в одиночку тяжело. Первый шаг — назвать что именно происходит. Именно это делает Metanoia AI перед встречей со специалистом.'
  }
  if (negative) {
    return 'Эти ощущения — сигнал на который стоит обратить внимание. Metanoia AI поможет структурировать то что сложно выразить словами и подготовиться к разговору со специалистом.'
  }
  return 'Усталость может быть первым признаком что что-то требует внимания. Metanoia AI поможет исследовать своё состояние глубже и понять что за ней стоит.'
}

// ── Chip ───────────────────────────────────────────────────────────────────
function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={selected ? { background: '#0d9488', borderColor: '#0d9488', color: 'white' } : {}}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
        selected ? '' : 'bg-white border-slate-200 text-slate-700 hover:border-[#0d9488] hover:text-[#0d9488]'
      }`}
    >
      {label}
    </button>
  )
}

// ── Value card ─────────────────────────────────────────────────────────────
function ValueCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div style={{ background: '#f8fafc', borderColor: '#e2e8f0' }} className="border rounded-2xl p-5 flex flex-col gap-2">
      <div style={{ background: '#f0fdfa', borderRadius: '10px', padding: '8px', display: 'inline-flex', width: 'fit-content' }}>
        <span className="text-2xl">{icon}</span>
      </div>
      <p style={{ color: '#1e3a5f' }} className="font-semibold text-sm">{title}</p>
      <p style={{ color: '#64748b' }} className="text-sm leading-relaxed">{body}</p>
    </div>
  )
}

// ── Psychology card ────────────────────────────────────────────────────────
function PsychCard({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ background: '#f8fafc', borderColor: '#e2e8f0' }} className="border rounded-2xl p-5">
      <p style={{ color: '#1e3a5f' }} className="font-semibold text-sm mb-2">{title}</p>
      <p style={{ color: '#64748b' }} className="text-sm leading-relaxed">{body}</p>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [emotion, setEmotion] = useState<string | null>(null)
  const [duration, setDuration] = useState<string | null>(null)
  const [support, setSupport] = useState<string | null>(null)
  const [insightVisible, setInsightVisible] = useState(false)
  const loginRef = useRef<HTMLDivElement>(null)

  const [emailMode, setEmailMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState('')

  const [authUser, setAuthUser] = useState<{ id: string; email?: string } | null>(null)

  const allAnswered = !!(emotion && duration && support)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setAuthUser(data.user)
    })
  }, [])

  useEffect(() => {
    if (allAnswered) {
      const t = setTimeout(() => setInsightVisible(true), 60)
      return () => clearTimeout(t)
    } else {
      setInsightVisible(false)
    }
  }, [allAnswered])

  function scrollToLogin() {
    loginRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleGoogleLogin() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEmailError('')
    setEmailLoading(true)
    const supabase = createClient()
    if (emailMode === 'login') {
      const { error, data: signInData } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setEmailError('Неверный email или пароль')
      } else if (signInData.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', signInData.user.id).maybeSingle()
        if (!profile?.role) window.location.href = '/onboarding'
        else if (profile.role === 'specialist') window.location.href = '/specialist/dashboard'
        else window.location.href = '/cabinet'
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (error) {
        setEmailError(error.message === 'User already registered' ? 'Этот email уже зарегистрирован' : 'Ошибка регистрации. Попробуй снова.')
      } else {
        setEmailError('')
        setEmailMode('login')
        setPassword('')
        setEmailError('Проверь почту — отправили письмо для подтверждения')
      }
    }
    setEmailLoading(false)
  }

  return (
    <div className="min-h-screen">
      {/* ── CSS animations ─────────────────────────────────────────── */}
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: translate(-50%, -50%) scale(0.95); opacity: 0.12; }
          50%  { transform: translate(-50%, -50%) scale(1.05); opacity: 0.06; }
          100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.12; }
        }
        .pr1 { animation: pulse-ring 6s  ease-in-out infinite; }
        .pr2 { animation: pulse-ring 8s  ease-in-out infinite; }
        .pr3 { animation: pulse-ring 10s ease-in-out infinite; }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .circles-container { animation: fadeIn 1.5s ease-in-out; z-index: 0; }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up    { animation: fade-up 0.6s ease-out forwards; }
        .fade-up-d1 { animation: fade-up 0.6s 0.15s ease-out forwards; opacity: 0; }
        .fade-up-d2 { animation: fade-up 0.6s 0.30s ease-out forwards; opacity: 0; }
        .fade-up-d3 { animation: fade-up 0.6s 0.45s ease-out forwards; opacity: 0; }
        .dark-input {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          width: 100%;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .dark-input::placeholder { color: rgba(255,255,255,0.4); }
        .dark-input:focus { border-color: rgba(255,255,255,0.5); }
      `}</style>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ЗОНА 1 — БЕЛАЯ                                             */}
      {/* ════════════════════════════════════════════════════════════ */}

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white pt-10 pb-24 px-4 text-center min-h-[92vh] flex flex-col items-center justify-center">
        {/* Concentric animated rings */}
        <div className="circles-container absolute inset-0 pointer-events-none overflow-hidden" style={{ position: 'absolute' }}>
          {[
            { size: 300, cls: 'pr1' },
            { size: 500, cls: 'pr2' },
            { size: 700, cls: 'pr3' },
          ].map(({ size, cls }) => (
            <div
              key={size}
              className={cls}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: size,
                height: size,
                borderRadius: '50%',
                border: '1px solid #0d9488',
                backgroundColor: 'transparent',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center gap-6">
          <div className="fade-up flex flex-col items-center gap-3">
            <div className="w-16 h-16 flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Metanoia AI">
                <circle cx="20" cy="20" r="20" fill="#0d9488"/>
                <path d="M8 28 L8 10 L20 20 L32 10 L32 28" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ color: '#0d9488' }} className="text-sm font-bold tracking-widest uppercase">Metanoia AI</span>
          </div>

          <h1 style={{ color: '#1e3a5f' }} className="fade-up-d1 text-3xl sm:text-4xl font-bold leading-tight">
            Что-то не так,<br />но сложно объяснить<br />даже себе?
          </h1>

          <p style={{ color: '#64748b' }} className="fade-up-d2 text-base leading-relaxed max-w-sm">
            Пройди глубокий AI-опрос и получи структурированный анализ своего состояния. Подготовься к встрече со специалистом за 10 минут.
          </p>

          <div className="fade-up-d3 flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            {authUser ? (
              <a
                href="/cabinet"
                style={{ background: '#0d9488' }}
                className="w-full flex items-center justify-center hover:opacity-90 text-white font-semibold py-3.5 rounded-2xl transition shadow-lg text-sm"
              >
                В кабинет →
              </a>
            ) : (
              <button
                onClick={scrollToLogin}
                style={{ background: '#0d9488' }}
                className="w-full hover:opacity-90 text-white font-semibold py-3.5 rounded-2xl transition shadow-lg text-sm"
              >
                Попробовать бесплатно
              </button>
            )}
          </div>

          <p style={{ color: '#94a3b8' }} className="fade-up-d3 text-xs">Без кредитной карты · Бесплатно навсегда для первых опросов</p>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-300">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-slate-200" />
          <span className="text-xs">↓</span>
        </div>
      </section>

      {/* ── Мини-опрос ─────────────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: '#f8fafc' }}>
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <p style={{ color: '#0d9488' }} className="text-xs font-bold uppercase tracking-widest mb-2">Мини-опрос</p>
            <h2 style={{ color: '#1e3a5f' }} className="text-2xl font-bold">Как ты себя чувствуешь прямо сейчас?</h2>
          </div>

          <div className="flex flex-col gap-8">
            <div style={{ background: '#f8fafc', borderColor: '#e2e8f0' }} className="border rounded-2xl p-6">
              <p style={{ color: '#1e3a5f' }} className="text-sm font-semibold mb-4">Выбери одно из состояний</p>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map((e) => (
                  <Chip key={e} label={e} selected={emotion === e} onClick={() => setEmotion(e)} />
                ))}
              </div>
            </div>

            <div
              style={{ background: '#f8fafc', borderColor: '#e2e8f0', opacity: emotion ? 1 : 0.35, pointerEvents: emotion ? 'auto' : 'none' }}
              className="border rounded-2xl p-6 transition-all duration-300"
            >
              <p style={{ color: '#1e3a5f' }} className="text-sm font-semibold mb-4">Как давно это состояние?</p>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <Chip key={d} label={d} selected={duration === d} onClick={() => setDuration(d)} />
                ))}
              </div>
            </div>

            <div
              style={{ background: '#f8fafc', borderColor: '#e2e8f0', opacity: duration ? 1 : 0.35, pointerEvents: duration ? 'auto' : 'none' }}
              className="border rounded-2xl p-6 transition-all duration-300"
            >
              <p style={{ color: '#1e3a5f' }} className="text-sm font-semibold mb-4">Есть ли рядом кто-то с кем можно поговорить?</p>
              <div className="flex flex-wrap gap-2">
                {SUPPORTS.map((s) => (
                  <Chip key={s} label={s} selected={support === s} onClick={() => setSupport(s)} />
                ))}
              </div>
            </div>

            {allAnswered && (
              <div
                style={{
                  background: '#f0fdfa',
                  borderColor: '#99f6e4',
                  opacity: insightVisible ? 1 : 0,
                  transform: insightVisible ? 'translateY(0)' : 'translateY(8px)',
                }}
                className="border rounded-2xl p-6 transition-all duration-400"
              >
                <p style={{ color: '#0d9488' }} className="text-xs font-bold uppercase tracking-widest mb-3">Metanoia AI</p>
                <p style={{ color: '#1e3a5f' }} className="text-sm leading-relaxed mb-5">
                  {getInsight(emotion!, duration!, support!)}
                </p>
                <button
                  onClick={scrollToLogin}
                  style={{ background: '#0d9488' }}
                  className="w-full hover:opacity-90 text-white font-semibold py-3 rounded-xl transition text-sm"
                >
                  Получить полный анализ →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Карточки ценности ──────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <p style={{ color: '#0d9488' }} className="text-xs font-bold uppercase tracking-widest mb-2">Что ты получишь</p>
            <h2 style={{ color: '#1e3a5f' }} className="text-2xl font-bold">Не просто опрос</h2>
          </div>
          <div className="flex flex-col gap-4">
            <ValueCard
              icon="🔍"
              title="Глубокий AI-опрос"
              body="4 блока вопросов о теле, эмоциях, контексте и свободный рассказ. AI находит связи которые сложно увидеть самому."
            />
            <ValueCard
              icon="📋"
              title="PDF для специалиста"
              body="Структурированный документ с анализом и темами для обсуждения. Принеси на первую сессию — сэкономит 30–40 минут."
            />
            <ValueCard
              icon="🔒"
              title="Только твои данные"
              body="Всё зашифровано. Никакой рекламы, никакой передачи данным третьим лицам — никогда."
            />
          </div>
        </div>
      </section>

      {/* ── Психология ─────────────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: '#f8fafc' }}>
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <p style={{ color: '#0d9488' }} className="text-xs font-bold uppercase tracking-widest mb-2">Почему это работает</p>
            <h2 style={{ color: '#1e3a5f' }} className="text-2xl font-bold">Немного психологии</h2>
          </div>
          <div className="flex flex-col gap-4">
            <PsychCard
              title="Почему сложно объяснить своё состояние"
              body="Около 70% людей испытывают затруднения с называнием своих эмоций — это называется алекситимия. AI-опрос помогает структурировать то что сложно выразить словами через конкретные вопросы о теле и контексте."
            />
            <PsychCard
              title="Как подготовка меняет эффективность терапии"
              body="Первые 2–3 сессии часто уходят на сбор истории. Клиенты которые приходят с подготовленным резюме состояния начинают работу быстрее и получают больше от каждой встречи."
            />
            <PsychCard
              title="Что такое алекситимия и почему это нормально"
              body="Неспособность распознать и описать свои эмоции — распространённая особенность. Структурированный опрос обходит этот барьер через конкретные вопросы о теле, контексте и поведении."
            />
          </div>
        </div>
      </section>

      {/* ── Материалы ──────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p style={{ color: '#0d9488' }} className="text-xs font-bold uppercase tracking-widest mb-1">Материалы</p>
              <h2 style={{ color: '#1e3a5f' }} className="text-xl font-bold">Книги и видео для самопознания</h2>
            </div>
            <a href="/materials" style={{ color: '#0d9488' }} className="text-sm font-semibold hover:opacity-70 transition shrink-0">
              Смотреть все →
            </a>
          </div>
          <div className="flex flex-col gap-3 mb-6">
            {[
              { title: 'Тело помнит всё', author: 'Бессел ван дер Колк', emoji: '📖' },
              { title: 'Когнитивная терапия депрессии', author: 'Аарон Бек', emoji: '📗' },
              { title: 'Токсичный позитив', author: 'Уитни Гудман', emoji: '📘' },
            ].map((b) => (
              <div key={b.title} style={{ background: '#f8fafc', borderColor: '#e2e8f0' }} className="flex items-center gap-3 border rounded-2xl p-4">
                <span className="text-2xl">{b.emoji}</span>
                <div>
                  <p style={{ color: '#1e3a5f' }} className="font-semibold text-sm">{b.title}</p>
                  <p style={{ color: '#94a3b8' }} className="text-xs">{b.author}</p>
                </div>
              </div>
            ))}
          </div>
          <a
            href="/materials"
            style={{ borderColor: '#e2e8f0', color: '#64748b' }}
            className="flex items-center justify-center w-full py-3 bg-white border hover:border-[#0d9488] hover:text-[#0d9488] text-sm font-semibold rounded-2xl transition"
          >
            Смотреть все материалы
          </a>
        </div>
      </section>

      {/* ── Teal CTA ───────────────────────────────────────────────── */}
      <section style={{ background: '#0d9488' }} className="py-12 px-4 text-center">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            Понимай себя между сессиями
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)' }} className="text-base">
            Ежедневный журнал · AI-ассистент · PDF для специалиста
          </p>
          <button
            onClick={scrollToLogin}
            style={{ color: '#0d9488' }}
            className="bg-white hover:opacity-90 font-semibold py-3.5 px-10 rounded-2xl transition text-sm shadow-lg"
          >
            Начать бесплатно
          </button>
        </div>
      </section>

      {/* ── Dark blue login ────────────────────────────────────────── */}
      <section ref={loginRef} style={{ background: '#1e3a5f' }} className="py-16 px-4">
        <div className="max-w-sm mx-auto flex flex-col items-center gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Начни прямо сейчас — бесплатно</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)' }} className="text-sm mt-2">
              Без кредитной карты · 3 опроса бесплатно
            </p>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{ color: '#1e3a5f' }}
            className="w-full flex items-center justify-center gap-3 bg-white hover:opacity-90 disabled:opacity-60 font-semibold py-3.5 rounded-2xl border-0 shadow-lg transition text-sm"
          >
            {loading ? (
              <span className="animate-spin text-xl inline-block">⏳</span>
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {loading ? 'Перенаправление…' : 'Войти через Google'}
          </button>

          <div className="flex items-center gap-3 w-full">
            <div style={{ background: 'rgba(255,255,255,0.2)' }} className="flex-1 h-px" />
            <span style={{ color: 'rgba(255,255,255,0.4)' }} className="text-xs">или</span>
            <div style={{ background: 'rgba(255,255,255,0.2)' }} className="flex-1 h-px" />
          </div>

          <form onSubmit={handleEmailSubmit} className="w-full flex flex-col gap-3">
            {emailMode === 'register' && (
              <input
                type="text"
                placeholder="Имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="dark-input"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="dark-input"
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="dark-input"
            />
            {emailError && (
              <p style={{ color: emailError.includes('Проверь') ? '#5eead4' : '#fca5a5' }} className="text-xs text-center">
                {emailError}
              </p>
            )}
            <button
              type="submit"
              disabled={emailLoading}
              style={{ background: '#0d9488' }}
              className="w-full py-3.5 hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold rounded-2xl transition"
            >
              {emailLoading ? '…' : emailMode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => { setEmailMode(emailMode === 'login' ? 'register' : 'login'); setEmailError('') }}
            style={{ color: 'rgba(255,255,255,0.5)' }}
            className="hover:text-white text-xs transition"
          >
            {emailMode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>

          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }} className="text-center leading-relaxed">
            Твои данные зашифрованы и видны только тебе
          </p>
        </div>
      </section>

      {/* ── Footer (в тёмно-синей зоне) ────────────────────────────── */}
      <footer style={{ background: '#1e3a5f' }} className="pb-8 px-4 text-center">
        <div style={{ borderTopColor: 'rgba(255,255,255,0.1)' }} className="border-t pt-6 max-w-lg mx-auto">
          <p style={{ color: 'rgba(255,255,255,0.3)' }} className="text-xs">
            © 2026 Metanoia AI · Не является медицинским сервисом
          </p>
        </div>
      </footer>
    </div>
  )
}
