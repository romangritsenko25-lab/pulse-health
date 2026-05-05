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

// ── Reusable chip button ───────────────────────────────────────────────────
function Chip({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
        selected
          ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-200'
          : 'bg-white border-slate-200 text-slate-700 hover:border-teal-300 hover:text-teal-700'
      }`}
    >
      {label}
    </button>
  )
}

// ── Value card ─────────────────────────────────────────────────────────────
function ValueCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-2">
      <span className="text-3xl">{icon}</span>
      <p className="font-semibold text-slate-800 text-sm">{title}</p>
      <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
    </div>
  )
}

// ── Psychology card ────────────────────────────────────────────────────────
function PsychCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
      <p className="font-semibold text-slate-800 text-sm mb-2">{title}</p>
      <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
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

  // Email/password form
  const [emailMode, setEmailMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState('')

  const allAnswered = !!(emotion && duration && support)

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
    <div className="bg-white min-h-screen">
      {/* ── CSS animations ─────────────────────────────────────────── */}
      <style>{`
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.40; transform: translate(-50%, -50%) scale(0.88); }
          50%       { opacity: 0.10; transform: translate(-50%, -50%) scale(1.14); }
        }
        .pr1 { animation: pulse-ring 6s ease-in-out infinite; animation-delay: 0s; }
        .pr2 { animation: pulse-ring 6s ease-in-out infinite; animation-delay: 1.2s; }
        .pr3 { animation: pulse-ring 6s ease-in-out infinite; animation-delay: 2.4s; }
        .pr4 { animation: pulse-ring 6s ease-in-out infinite; animation-delay: 3.6s; }
        .pr5 { animation: pulse-ring 6s ease-in-out infinite; animation-delay: 4.8s; }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.6s ease-out forwards; }
        .fade-up-d1 { animation: fade-up 0.6s 0.15s ease-out forwards; opacity: 0; }
        .fade-up-d2 { animation: fade-up 0.6s 0.30s ease-out forwards; opacity: 0; }
        .fade-up-d3 { animation: fade-up 0.6s 0.45s ease-out forwards; opacity: 0; }
      `}</style>

      {/* ── 1. HERO ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white pt-10 pb-24 px-4 text-center min-h-[92vh] flex flex-col items-center justify-center">
        {/* Concentric animated rings */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { size: 220, cls: 'pr1' },
            { size: 380, cls: 'pr2' },
            { size: 540, cls: 'pr3' },
            { size: 700, cls: 'pr4' },
            { size: 860, cls: 'pr5' },
          ].map(({ size, cls }) => (
            <div
              key={size}
              className={cls}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: size,
                height: size,
                borderRadius: '50%',
                border: '2px solid rgba(13,148,136,0.55)',
                backgroundColor: 'rgba(13,148,136,0.05)',
                boxShadow: '0 0 24px rgba(13,148,136,0.08)',
              }}
            />
          ))}
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center gap-6">
          <div className="fade-up flex flex-col items-center gap-3">
            <div className="w-16 h-16 flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Metanoia AI">
                <circle cx="20" cy="20" r="20" fill="#0d9488"/>
                <path d="M8 28 L8 10 L20 20 L32 10 L32 28" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-teal-600 tracking-widest uppercase">Metanoia AI</span>
          </div>

          <h1 className="fade-up-d1 text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
            Что-то не так,<br />но сложно объяснить<br />даже себе?
          </h1>

          <p className="fade-up-d2 text-slate-500 text-base leading-relaxed max-w-sm">
            Пройди глубокий AI-опрос и получи структурированный анализ своего состояния. Подготовься к встрече со специалистом за 10 минут.
          </p>

          <div className="fade-up-d3 flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button
              onClick={scrollToLogin}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3.5 rounded-2xl transition shadow-lg shadow-teal-200 text-sm"
            >
              Попробовать бесплатно
            </button>
          </div>

          <p className="fade-up-d3 text-slate-400 text-xs">Без кредитной карты · Бесплатно навсегда для первых опросов</p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-300">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-slate-200" />
          <span className="text-xs">↓</span>
        </div>
      </section>

      {/* ── 2. МИНИ-ОПРОС ─────────────────────────────────────────── */}
      <section className="bg-slate-50 py-16 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">Мини-опрос</p>
            <h2 className="text-2xl font-bold text-slate-800">Как ты себя чувствуешь прямо сейчас?</h2>
          </div>

          <div className="flex flex-col gap-8">
            {/* Q1 */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <p className="text-sm font-semibold text-slate-700 mb-4">Выбери одно из состояний</p>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map((e) => (
                  <Chip key={e} label={e} selected={emotion === e} onClick={() => setEmotion(e)} />
                ))}
              </div>
            </div>

            {/* Q2 — appears after Q1 */}
            <div
              className="bg-white rounded-2xl border border-slate-100 p-6 transition-all duration-300"
              style={{ opacity: emotion ? 1 : 0.35, pointerEvents: emotion ? 'auto' : 'none' }}
            >
              <p className="text-sm font-semibold text-slate-700 mb-4">Как давно это состояние?</p>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <Chip key={d} label={d} selected={duration === d} onClick={() => setDuration(d)} />
                ))}
              </div>
            </div>

            {/* Q3 — appears after Q2 */}
            <div
              className="bg-white rounded-2xl border border-slate-100 p-6 transition-all duration-300"
              style={{ opacity: duration ? 1 : 0.35, pointerEvents: duration ? 'auto' : 'none' }}
            >
              <p className="text-sm font-semibold text-slate-700 mb-4">Есть ли рядом кто-то с кем можно поговорить?</p>
              <div className="flex flex-wrap gap-2">
                {SUPPORTS.map((s) => (
                  <Chip key={s} label={s} selected={support === s} onClick={() => setSupport(s)} />
                ))}
              </div>
            </div>

            {/* Insight */}
            {allAnswered && (
              <div
                className="rounded-2xl border border-teal-200 bg-teal-50 p-6 transition-all duration-400"
                style={{ opacity: insightVisible ? 1 : 0, transform: insightVisible ? 'translateY(0)' : 'translateY(8px)' }}
              >
                <p className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-3">Metanoia AI</p>
                <p className="text-slate-800 text-sm leading-relaxed mb-5">
                  {getInsight(emotion!, duration!, support!)}
                </p>
                <button
                  onClick={scrollToLogin}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3 rounded-xl transition text-sm"
                >
                  Получить полный анализ →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 3. КАРТОЧКИ ЦЕННОСТИ ─────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">Что ты получишь</p>
            <h2 className="text-2xl font-bold text-slate-800">Не просто опрос</h2>
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

      {/* ── 4. ПСИХОЛОГИЯ ─────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">Почему это работает</p>
            <h2 className="text-2xl font-bold text-slate-800">Немного психологии</h2>
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

      {/* ── 6. МАТЕРИАЛЫ PREVIEW ──────────────────────────────────── */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1">Материалы</p>
              <h2 className="text-xl font-bold text-slate-800">Книги и видео для самопознания</h2>
            </div>
            <a href="/materials" className="text-teal-600 text-sm font-semibold hover:text-teal-500 transition shrink-0">
              Смотреть все →
            </a>
          </div>
          <div className="flex flex-col gap-3 mb-6">
            {[
              { title: 'Тело помнит всё', author: 'Бессел ван дер Колк', emoji: '📖' },
              { title: 'Когнитивная терапия депрессии', author: 'Аарон Бек', emoji: '📗' },
              { title: 'Токсичный позитив', author: 'Уитни Гудман', emoji: '📘' },
            ].map((b) => (
              <div key={b.title} className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-4">
                <span className="text-2xl">{b.emoji}</span>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{b.title}</p>
                  <p className="text-slate-400 text-xs">{b.author}</p>
                </div>
              </div>
            ))}
          </div>
          <a
            href="/materials"
            className="flex items-center justify-center w-full py-3 bg-white border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-600 text-sm font-semibold rounded-2xl transition"
          >
            Смотреть все материалы
          </a>
        </div>
      </section>

      {/* ── 7. ФОРМА ВХОДА ────────────────────────────────────────── */}
      <section ref={loginRef} className="py-20 px-4 bg-white">
        <div className="max-w-sm mx-auto flex flex-col items-center gap-6">
          <div className="text-center">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">Начать</p>
            <h2 className="text-2xl font-bold text-slate-800">Начни прямо сейчас — бесплатно</h2>
            <p className="text-slate-400 text-sm mt-2">Первые опросы бесплатно. Без кредитной карты.</p>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-700 font-semibold py-3.5 rounded-2xl border border-slate-200 shadow-sm transition text-sm"
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

          {/* Divider */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-xs">или</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleEmailSubmit} className="w-full flex flex-col gap-3">
            {emailMode === 'register' && (
              <input
                type="text"
                placeholder="Имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-teal-400 focus:outline-none text-sm text-slate-800 placeholder:text-slate-400"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-teal-400 focus:outline-none text-sm text-slate-800 placeholder:text-slate-400"
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-teal-400 focus:outline-none text-sm text-slate-800 placeholder:text-slate-400"
            />
            {emailError && (
              <p className={`text-xs text-center ${emailError.includes('Проверь') ? 'text-teal-600' : 'text-red-500'}`}>
                {emailError}
              </p>
            )}
            <button
              type="submit"
              disabled={emailLoading}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold rounded-2xl transition"
            >
              {emailLoading ? '…' : emailMode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => { setEmailMode(emailMode === 'login' ? 'register' : 'login'); setEmailError('') }}
            className="text-slate-400 hover:text-teal-600 text-xs transition"
          >
            {emailMode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>

          <p className="text-slate-400 text-xs text-center leading-relaxed">
            Твои данные зашифрованы и видны только тебе.<br />
            Мы никогда не передаём личную информацию третьим лицам.
          </p>
        </div>
      </section>

      {/* ── 8. FOOTER ──────────────────────────────────────────────── */}
      <footer className="py-6 px-4 border-t border-slate-100 text-center">
        <p className="text-slate-300 text-xs">© 2025 Metanoia AI · Не является медицинским сервисом</p>
      </footer>
    </div>
  )
}
