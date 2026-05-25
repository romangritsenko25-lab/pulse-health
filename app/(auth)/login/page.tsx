'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import LoginModal from '@/components/LoginModal'

// ── Quiz data ──────────────────────────────────────────────────────────────
const EMOTIONS = ['Тревожно', 'Подавленно', 'Раздражённо', 'Устало', 'Нормально', 'Хорошо']
const DURATIONS = ['Сегодня', 'Несколько дней', 'Больше недели', 'Давно']
const SUPPORTS = ['Да', 'Не всегда', 'Нет']
const EMOTION_COLORS: Record<string, string> = {
  'Тревожно':    '#fef3c7',
  'Подавленно':  '#ede9fe',
  'Раздражённо': '#fee2e2',
  'Устало':      '#f1f5f9',
  'Нормально':   '#f0fdf4',
  'Хорошо':      '#ecfeff',
}

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
function Chip({ label, selected, onClick, bgColor }: { label: string; selected: boolean; onClick: () => void; bgColor?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={selected
        ? { background: '#2563eb', borderColor: '#2563eb', color: 'white' }
        : bgColor
          ? { background: bgColor, borderColor: 'transparent' }
          : {}}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
        selected
          ? ''
          : bgColor
            ? 'text-slate-700 hover:border-[#2563eb] hover:text-[#2563eb]'
            : 'bg-white border-slate-200 text-slate-700 hover:border-[#2563eb] hover:text-[#2563eb]'
      }`}
    >
      {label}
    </button>
  )
}

// ── Value card ─────────────────────────────────────────────────────────────
function ValueCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div style={{
      background: 'white',
      borderColor: '#e2e8f0',
      boxShadow: '0 2px 12px rgba(37,99,235,0.06)',
      borderTop: '3px solid transparent',
      borderImage: 'linear-gradient(90deg, #2563eb, #06b6d4) 1',
    }} className="border rounded-2xl p-5 flex flex-col gap-2">
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff, #ecfeff)',
        borderRadius: '10px', padding: '8px',
        display: 'inline-flex', width: 'fit-content',
      }}>
        <span className="text-2xl">{icon}</span>
      </div>
      <p style={{ color: '#1e3a5f' }} className="font-semibold text-sm">{title}</p>
      <p style={{ color: '#64748b' }} className="text-sm leading-relaxed">{body}</p>
    </div>
  )
}

// ── Psychology card ────────────────────────────────────────────────────────
function PsychCard({ title, body, category, href }: { title: string; body: string; category?: string; href?: string }) {
  return (
    <a
      href={href ?? '/materials'}
      style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}
      className="border rounded-2xl p-5 flex flex-col gap-2.5 hover:border-blue-200 hover:shadow-sm transition block"
    >
      {category && (
        <span className="self-start text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
          {category}
        </span>
      )}
      <p style={{ color: '#1e3a5f' }} className="font-semibold text-sm">{title}</p>
      <p style={{ color: '#64748b' }} className="text-sm leading-relaxed">{body}</p>
    </a>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [showModal, setShowModal] = useState(false)
  const [emotion, setEmotion] = useState<string | null>(null)
  const [duration, setDuration] = useState<string | null>(null)
  const [support, setSupport] = useState<string | null>(null)
  const [insightVisible, setInsightVisible] = useState(false)

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


  return (
    <div className="min-h-screen">
      {/* ── CSS animations ─────────────────────────────────────────── */}
      <style>{`
        @keyframes blob-pulse {
          0%, 100% { transform: scale(1);   opacity: 1; }
          50%       { transform: scale(1.15); opacity: 0.7; }
        }
        .blob-1 { animation: blob-pulse 7s ease-in-out infinite; }
        .blob-2 { animation: blob-pulse 9s ease-in-out infinite 1.5s; }
        .blob-3 { animation: blob-pulse 11s ease-in-out infinite 3s; }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up    { animation: fade-up 0.6s ease-out forwards; }
        .fade-up-d1 { animation: fade-up 0.6s 0.15s ease-out forwards; opacity: 0; }
        .fade-up-d2 { animation: fade-up 0.6s 0.30s ease-out forwards; opacity: 0; }
        .fade-up-d3 { animation: fade-up 0.6s 0.45s ease-out forwards; opacity: 0; }
      `}</style>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ЗОНА 1 — БЕЛАЯ                                             */}
      {/* ════════════════════════════════════════════════════════════ */}

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 text-center min-h-[50vh] flex flex-col items-center pt-10 pb-16" style={{
        background: `
          radial-gradient(ellipse 70% 55% at 15% 50%, rgba(37,99,235,0.08) 0%, transparent 70%),
          radial-gradient(ellipse 55% 45% at 85% 15%, rgba(6,182,212,0.07) 0%, transparent 60%),
          radial-gradient(ellipse 40% 35% at 60% 85%, rgba(99,102,241,0.05) 0%, transparent 55%),
          #faf9f7
        `
      }}>
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="blob-1" style={{
            position: 'absolute', top: '-80px', right: '-60px',
            width: 320, height: 320, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.13) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />
          <div className="blob-2" style={{
            position: 'absolute', bottom: '-60px', left: '-40px',
            width: 280, height: 280, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.11) 0%, transparent 70%)',
            filter: 'blur(35px)',
          }} />
          <div className="blob-3" style={{
            position: 'absolute', top: '30%', left: '65%',
            width: 180, height: 180, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }} />
        </div>

        <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center gap-6">
          <div className="fade-up">
            <Image
              src="/Logo1.png"
              alt="Metanoia"
              width={110}
              height={110}
              className="rounded-2xl shadow-md"
            />
          </div>

          <h1 className="fade-up-d1 text-3xl sm:text-4xl font-bold leading-tight" style={{
            background: 'linear-gradient(135deg, #1e3a5f 30%, #2563eb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Что-то не так,<br />но сложно объяснить<br />даже себе?
          </h1>

          <p style={{ color: '#64748b' }} className="fade-up-d2 text-base leading-relaxed max-w-sm">
            Пройди глубокий AI-опрос и получи структурированный анализ своего состояния. Подготовься к встрече со специалистом за 10 минут.
          </p>

          <div className="fade-up-d3 flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            {authUser ? (
              <a
                href="/cabinet"
                style={{ background: '#2563eb' }}
                className="w-full flex items-center justify-center hover:opacity-90 text-white font-semibold py-3.5 rounded-2xl transition shadow-lg text-sm"
              >
                В кабинет →
              </a>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                style={{ background: '#2563eb' }}
                className="w-full hover:opacity-90 text-white font-semibold py-3.5 rounded-2xl transition shadow-lg text-sm"
              >
                Попробовать бесплатно
              </button>
            )}
          </div>

          <div className="fade-up-d3 flex flex-wrap justify-center gap-x-5 gap-y-1.5">
            {['✓ 10 минут', '✓ 4 блока вопросов', '✓ 3 опроса бесплатно'].map((t) => (
              <span key={t} style={{ color: '#64748b' }} className="text-xs">{t}</span>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-300">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-slate-200" />
          <span className="text-xs">↓</span>
        </div>
      </section>

      {/* ── Мини-опрос ─────────────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: '#f8fafc' }}>
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <p style={{ color: '#2563eb' }} className="text-xs font-bold uppercase tracking-widest mb-2">Мини-опрос</p>
            <h2 style={{ color: '#1e3a5f' }} className="text-2xl font-bold">Как ты себя чувствуешь прямо сейчас?</h2>
          </div>

          {/* Прогресс-индикатор */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[emotion, duration, support].map((val, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${val ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                  {val ? '✓' : i + 1}
                </div>
                {i < 2 && <div className={`h-px w-8 transition-all duration-300 ${val ? 'bg-blue-300' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {/* Карточка 1 — Эмоция (всегда активна) */}
            <div
              className="border-2 rounded-2xl p-6 transition-all duration-300"
              style={emotion
                ? { background: '#f0fdf4', borderColor: '#86efac' }
                : { background: 'white', borderColor: '#2563eb', boxShadow: '0 4px 20px rgba(37,99,235,0.1)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <p style={{ color: '#1e3a5f' }} className="text-sm font-semibold">Выбери одно из состояний</p>
                {emotion && <span style={{ color: '#16a34a' }} className="text-xs font-medium">✓ {emotion}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map((e) => (
                  <Chip key={e} label={e} selected={emotion === e} onClick={() => setEmotion(e)} bgColor={EMOTION_COLORS[e]} />
                ))}
              </div>
            </div>

            {/* Карточка 2 — Длительность */}
            <div
              className={`border-2 rounded-2xl p-6 transition-all duration-300 ${!emotion ? 'pointer-events-none' : ''}`}
              style={duration
                ? { background: '#f0fdf4', borderColor: '#86efac' }
                : emotion
                  ? { background: 'white', borderColor: '#2563eb', boxShadow: '0 4px 20px rgba(37,99,235,0.1)' }
                  : { background: '#f8fafc', borderColor: '#e2e8f0', opacity: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <p style={{ color: '#1e3a5f' }} className="text-sm font-semibold">Как давно это состояние?</p>
                {duration && <span style={{ color: '#16a34a' }} className="text-xs font-medium">✓ {duration}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <Chip key={d} label={d} selected={duration === d} onClick={() => setDuration(d)} />
                ))}
              </div>
            </div>

            {/* Карточка 3 — Поддержка */}
            <div
              className={`border-2 rounded-2xl p-6 transition-all duration-300 ${!duration ? 'pointer-events-none' : ''}`}
              style={support
                ? { background: '#f0fdf4', borderColor: '#86efac' }
                : duration
                  ? { background: 'white', borderColor: '#2563eb', boxShadow: '0 4px 20px rgba(37,99,235,0.1)' }
                  : { background: '#f8fafc', borderColor: '#e2e8f0', opacity: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <p style={{ color: '#1e3a5f' }} className="text-sm font-semibold">Есть ли рядом кто-то с кем можно поговорить?</p>
                {support && <span style={{ color: '#16a34a' }} className="text-xs font-medium">✓ {support}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {SUPPORTS.map((s) => (
                  <Chip key={s} label={s} selected={support === s} onClick={() => setSupport(s)} />
                ))}
              </div>
            </div>

            {allAnswered && (
              <div
                style={{
                  background: '#eff6ff',
                  borderColor: '#bfdbfe',
                  opacity: insightVisible ? 1 : 0,
                  transform: insightVisible ? 'translateY(0)' : 'translateY(8px)',
                }}
                className="border rounded-2xl p-6 transition-all duration-400"
              >
                <p style={{ color: '#2563eb' }} className="text-xs font-bold uppercase tracking-widest mb-3">Metanoia AI</p>
                <p style={{ color: '#1e3a5f' }} className="text-sm leading-relaxed mb-5">
                  {getInsight(emotion!, duration!, support!)}
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  style={{ background: '#2563eb' }}
                  className="w-full hover:opacity-90 text-white font-semibold py-3 rounded-xl transition text-sm"
                >
                  Получить полный анализ →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Как это работает ───────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: '#faf9f7' }}>
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <p style={{ color: '#2563eb' }} className="text-xs font-bold uppercase tracking-widest mb-2">Что ты получишь</p>
            <h2 style={{ color: '#1e3a5f' }} className="text-2xl font-bold">Как это работает</h2>
          </div>
          <div className="flex flex-col">
            {[
              { num: '1', title: 'Отвечаешь на вопросы', tag: '4 блока · 10 минут', body: 'Тело, эмоции, контекст и свободный рассказ. Вопросы помогают назвать то, что сложно выразить самому' },
              { num: '2', title: 'AI анализирует', tag: 'Стиль психолога-консультанта', body: 'Находит паттерны и связи между физическим и эмоциональным состоянием. Без осуждения — с пониманием' },
              { num: '3', title: 'Получаешь результат', tag: 'PDF + темы для специалиста', body: 'Приходишь на сессию подготовленным. Специалист сразу переходит к работе — экономия 30–40 минут' },
            ].map((step, i, arr) => (
              <div key={step.num} className="flex gap-4">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-sm shadow-md"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #0ea5e9)' }}
                  >
                    {step.num}
                  </div>
                  {i < arr.length - 1 && (
                    <div
                      className="w-px flex-1 mt-2"
                      style={{ background: 'linear-gradient(to bottom, #bfdbfe, transparent)', minHeight: '28px' }}
                    />
                  )}
                </div>
                <div className={i < arr.length - 1 ? 'pb-7' : ''}>
                  <p style={{ color: '#1e3a5f' }} className="font-bold text-base mb-1">{step.title}</p>
                  <span className="inline-block text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5 mb-2">
                    {step.tag}
                  </span>
                  <p style={{ color: '#64748b' }} className="text-sm leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div
            className="mt-6 rounded-2xl px-5 py-3.5 text-center border border-blue-100"
            style={{ background: 'linear-gradient(135deg, #eff6ff, #ecfeff)' }}
          >
            <p className="text-sm font-semibold" style={{ color: '#1d4ed8' }}>
              10 минут → анализ в стиле психолога + PDF для специалиста
            </p>
          </div>
        </div>
      </section>

      {/* ── Психология ─────────────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: '#ffffff' }}>
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <p style={{ color: '#2563eb' }} className="text-xs font-bold uppercase tracking-widest mb-2">Почему это работает</p>
            <h2 style={{ color: '#1e3a5f' }} className="text-2xl font-bold">Немного психологии</h2>
          </div>
          <div className="flex flex-col gap-4">
            <PsychCard
              category="Самопознание"
              title="Почему сложно объяснить своё состояние"
              body="Около 70% людей испытывают затруднения с называнием своих эмоций — это называется алекситимия. AI-опрос помогает структурировать то что сложно выразить словами через конкретные вопросы о теле и контексте."
              href="/materials"
            />
            <PsychCard
              category="Практика"
              title="Как подготовка меняет эффективность терапии"
              body="Первые 2–3 сессии часто уходят на сбор истории. Клиенты которые приходят с подготовленным резюме состояния начинают работу быстрее и получают больше от каждой встречи."
              href="/materials"
            />
            <PsychCard
              category="Самопознание"
              title="Что такое алекситимия и почему это нормально"
              body="Неспособность распознать и описать свои эмоции — распространённая особенность. Структурированный опрос обходит этот барьер через конкретные вопросы о теле, контексте и поведении."
              href="/materials"
            />
          </div>
          <div className="text-center mt-4">
            <a href="/materials" style={{ color: '#2563eb' }} className="text-sm font-semibold hover:opacity-70 transition">
              Все статьи и материалы →
            </a>
          </div>
        </div>
      </section>

      {/* ── Материалы ──────────────────────────────────────────────── */}
      <section className="py-12 px-4" style={{ background: '#faf9f7' }}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p style={{ color: '#2563eb' }} className="text-xs font-bold uppercase tracking-widest mb-1">Материалы</p>
              <h2 style={{ color: '#1e3a5f' }} className="text-xl font-bold">Библиотека для подготовки к сессии</h2>
            </div>
            <a href="/materials" style={{ color: '#2563eb' }} className="text-sm font-semibold hover:opacity-70 transition shrink-0">
              Смотреть все →
            </a>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { title: 'Тело помнит всё', hook: 'Травма и тело', cover: 'https://cdn.litres.ru/pub/c/cover_415/51388931.webp' },
              { title: 'Токсичный позитив', hook: 'Честность к себе', cover: 'https://cdn.litres.ru/pub/c/cover_415/69036151.webp' },
              { title: 'Эмоциональный интеллект', hook: 'Понять эмоции', cover: 'https://cdn.litres.ru/pub/c/cover_415/5024477.webp' },
            ].map((b) => (
              <a key={b.title} href="/materials" className="flex flex-col gap-2 group">
                <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                  <img src={b.cover} alt={b.title} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p style={{ color: '#1e3a5f' }} className="font-semibold text-xs leading-snug line-clamp-2">{b.title}</p>
                  <p style={{ color: '#94a3b8' }} className="text-[10px] mt-0.5">{b.hook}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Teal CTA ───────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 60%, #06b6d4 100%)' }} className="py-12 px-4 text-center">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            Понимай себя между сессиями
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)' }} className="text-base">
            Ежедневный журнал · AI-ассистент · PDF для специалиста
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{ color: '#2563eb' }}
            className="bg-white hover:opacity-90 font-semibold py-3.5 px-10 rounded-2xl transition text-sm shadow-lg"
          >
            Начать бесплатно
          </button>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8 bg-white">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>© 2026 Metanoia AI · ИП Гриценко</span>
          <div className="flex gap-6">
            <a href="/terms" className="hover:text-gray-600 transition-colors">Условия использования</a>
            <a href="/privacy" className="hover:text-gray-600 transition-colors">Конфиденциальность</a>
            <a href="/refund" className="hover:text-gray-600 transition-colors">Возврат средств</a>
          </div>
        </div>
      </footer>

      {showModal && <LoginModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
