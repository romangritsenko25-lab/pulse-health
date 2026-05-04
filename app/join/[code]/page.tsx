'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface SpecialistData {
  id: string
  name: string
  specialty: string
  photo_url: string | null
}

export default function JoinPage() {
  const params = useParams()
  const code = params.code as string
  const router = useRouter()

  const [specialist, setSpecialist] = useState<SpecialistData | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function init() {
      // Fetch specialist by referral code (public read)
      const { data: spec, error } = await supabase
        .from('specialists')
        .select('id, name, specialty, photo_url')
        .eq('referral_code', code)
        .single()

      if (error || !spec) {
        setNotFound(true)
        setPageLoading(false)
        return
      }

      setSpecialist(spec)
      setPageLoading(false)

      // If user already logged in — link immediately and go to checkin
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('specialist_clients')
          .upsert({ specialist_id: spec.id, client_id: user.id })
        router.push('/checkin')
      }
    }

    init()
  }, [code, router])

  async function handleGoogleLogin() {
    setAuthLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/checkin&ref=${code}`,
      },
    })
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Загрузка…</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-4">🔗</p>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Ссылка недействительна</h1>
          <p className="text-slate-500 text-sm mb-5">Попросите специалиста отправить актуальную ссылку</p>
          <button
            onClick={() => router.push('/login')}
            className="text-indigo-600 text-sm font-semibold hover:underline"
          >
            Войти в Metanoia AI →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-10">
      {/* Branding */}
      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-8">Metanoia AI</p>

      {/* Specialist card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-100 p-8 max-w-sm w-full mb-6">
        {/* Avatar + name */}
        <div className="flex flex-col items-center text-center gap-4 mb-6">
          {specialist?.photo_url ? (
            <img
              src={specialist.photo_url}
              alt={specialist.name}
              className="w-20 h-20 rounded-full object-cover border-4 border-indigo-100"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600">
              {specialist?.name[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-lg font-bold text-slate-800">{specialist?.name}</p>
            <p className="text-indigo-600 text-sm font-medium">{specialist?.specialty}</p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-slate-50 rounded-2xl p-4 mb-6">
          <p className="text-slate-600 text-sm leading-relaxed text-center">
            Ваш специалист использует <strong className="text-slate-800">Metanoia AI</strong> для подготовки к сессии.
            Пройдите опрос — специалист увидит ваш анализ до встречи.
          </p>
        </div>

        {/* What client gets */}
        <ul className="flex flex-col gap-2 mb-6">
          {[
            '10-минутный AI-опрос о состоянии',
            'Структурированный анализ в стиле психолога',
            'PDF-документ для приёма',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
              <span className="text-indigo-500 font-bold text-xs">✓</span>
              {item}
            </li>
          ))}
        </ul>

        {/* Google login */}
        <button
          onClick={handleGoogleLogin}
          disabled={authLoading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-700 font-semibold py-3.5 rounded-2xl border border-slate-200 shadow-sm transition text-sm"
        >
          {authLoading ? (
            <span className="animate-spin inline-block">⏳</span>
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {authLoading ? 'Перенаправление…' : 'Войти через Google'}
        </button>
      </div>

      <p className="text-slate-300 text-xs text-center">
        Metanoia AI · Данные зашифрованы и конфиденциальны
      </p>
    </div>
  )
}
