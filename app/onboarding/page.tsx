'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<'user' | 'specialist' | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      // If already has role — skip onboarding
      supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
        .then(({ data: profile }) => {
          if (profile?.role === 'user') router.replace('/cabinet')
          else if (profile?.role === 'specialist') router.replace('/specialist/dashboard')
          else setChecking(false)
        })
    })
  }, [router])

  async function choose(role: 'user' | 'specialist') {
    setLoading(role)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    await supabase.from('profiles').update({ role }).eq('id', user.id)

    router.replace(role === 'specialist' ? '/specialist/dashboard' : '/cabinet')
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Загрузка…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <Image src="/logo-icon.svg" alt="Metanoia AI" width={72} height={72} unoptimized style={{ borderRadius: '16px' }} />
        <span className="font-bold text-teal-600 text-[17px] tracking-tight">Metanoia <span className="font-normal">AI</span></span>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Как вы будете использовать Metanoia?</h1>
        <p className="text-slate-400 text-sm">Выберите — это определит ваш интерфейс</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
        {/* User card */}
        <button
          onClick={() => choose('user')}
          disabled={!!loading}
          className="flex-1 flex flex-col items-center gap-4 p-7 bg-white border-2 border-slate-200 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-50 rounded-3xl transition-all disabled:opacity-60 text-left group"
        >
          <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition">
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="#0d9488"/>
              <path d="M8 28 L8 10 L20 20 L32 10 L32 28" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-900 text-base mb-1">Я хочу разобраться в себе</p>
            <p className="text-slate-500 text-sm leading-relaxed">
              Подготовлюсь к приёму у специалиста, буду вести дневник и отслеживать своё состояние
            </p>
          </div>
          <span className="mt-auto w-full py-3 bg-teal-600 group-hover:bg-teal-500 text-white text-sm font-semibold rounded-2xl transition text-center">
            {loading === 'user' ? 'Загрузка…' : 'Начать'}
          </span>
        </button>

        {/* Specialist card */}
        <button
          onClick={() => choose('specialist')}
          disabled={!!loading}
          className="flex-1 flex flex-col items-center gap-4 p-7 bg-white border-2 border-slate-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-50 rounded-3xl transition-all disabled:opacity-60 text-left group"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-4xl group-hover:bg-indigo-100 transition">
            🩺
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-900 text-base mb-1">Я психолог / терапевт</p>
            <p className="text-slate-500 text-sm leading-relaxed">
              Буду приглашать клиентов, помогать им подготовиться к сессиям
            </p>
          </div>
          <span className="mt-auto w-full py-3 bg-indigo-600 group-hover:bg-indigo-500 text-white text-sm font-semibold rounded-2xl transition text-center">
            {loading === 'specialist' ? 'Загрузка…' : 'Войти как специалист'}
          </span>
        </button>
      </div>
    </div>
  )
}
