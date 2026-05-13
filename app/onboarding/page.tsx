'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<'user' | 'specialist' | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#faf9f7' }}>
        <p className="text-sm animate-pulse" style={{ color: '#9ca3af' }}>Загрузка…</p>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        .onboarding-card:hover .card-illo {
          transform: scale(1.05);
          transition: transform 0.3s ease;
        }
        .card-illo {
          transition: transform 0.3s ease;
        }
      `}</style>

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: '#faf9f7' }}>
        <div className="mb-10">
          <Logo size="lg" />
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
            className="onboarding-card flex-1 flex flex-col items-center gap-4 p-7 bg-white border-2 border-slate-200 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-50 rounded-3xl transition-all disabled:opacity-60 text-left group"
          >
            <div
              className="card-illo"
              style={{ opacity: 0, animation: 'fade-up 0.6s ease forwards, float 4s ease-in-out 0.6s infinite' }}
            >
              <svg width="130" height="160" viewBox="0 0 130 160" fill="none">
                <ellipse cx="65" cy="145" rx="40" ry="7" fill="#ccfbf1"/>
                <rect x="83" y="110" width="12" height="38" rx="6" fill="#6366f1" opacity="0.8"/>
                <rect x="99" y="110" width="12" height="38" rx="6" fill="#6366f1" opacity="0.8"/>
                <rect x="74" y="72" width="46" height="42" rx="14" fill="#a5b4fc"/>
                <path d="M74 85 Q62 92 65 108" stroke="#F5C5A3" strokeWidth="9" strokeLinecap="round" fill="none"/>
                <path d="M120 85 Q132 92 129 108" stroke="#F5C5A3" strokeWidth="9" strokeLinecap="round" fill="none"/>
                <rect x="120" y="100" width="14" height="20" rx="3" fill="white" stroke="#e2e8f0" strokeWidth="1"/>
                <rect x="122" y="104" width="10" height="2" rx="1" fill="#0d9488" opacity="0.4"/>
                <rect x="122" y="108" width="10" height="2" rx="1" fill="#0d9488" opacity="0.4"/>
                <rect x="91" y="58" width="12" height="16" rx="6" fill="#F5C5A3"/>
                <circle cx="97" cy="46" r="18" fill="#F5C5A3"/>
                <path d="M79 41 Q79 25 97 25 Q115 25 115 41 Q113 32 105 28 Q97 24 89 28 Q81 32 79 41Z" fill="#5C3D2E"/>
                <ellipse cx="79" cy="47" rx="3" ry="4.5" fill="#F0B090"/>
                <ellipse cx="115" cy="47" rx="3" ry="4.5" fill="#F0B090"/>
                <circle cx="91" cy="45" r="2.2" fill="#3D2B1F"/>
                <circle cx="103" cy="45" r="2.2" fill="#3D2B1F"/>
                <path d="M90 53 Q97 58 104 53" stroke="#5C3D2E" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                <circle cx="88" cy="40" r="13" fill="white" stroke="#0d9488" strokeWidth="1.5"/>
                <path d="M83 37 C83 34 86 32 90 34 C94 32 97 34 97 37 C97 40 90 44.5 90 44.5 C90 44.5 83 40 83 37Z" fill="#0d9488" opacity="0.65"/>
                <circle cx="80" cy="52" r="3.5" fill="white" stroke="#0d9488" strokeWidth="1.2"/>
                <circle cx="76" cy="59" r="2.2" fill="white" stroke="#0d9488" strokeWidth="1"/>
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
            className="onboarding-card flex-1 flex flex-col items-center gap-4 p-7 bg-white border-2 rounded-3xl transition-all disabled:opacity-60 text-left group"
            style={{ borderColor: '#ede9e4' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,148,136,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#ede9e4'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div
              className="card-illo"
              style={{ opacity: 0, animation: 'fade-up 0.6s ease 0.15s forwards, float 4s ease-in-out 0.75s infinite' }}
            >
              <svg width="130" height="160" viewBox="0 0 130 160" fill="none">
                <ellipse cx="65" cy="145" rx="40" ry="7" fill="#ccfbf1"/>
                <rect x="50" y="120" width="14" height="26" rx="7" fill="#1e3a5f" opacity="0.8"/>
                <rect x="66" y="120" width="14" height="26" rx="7" fill="#1e3a5f" opacity="0.8"/>
                <rect x="38" y="82" width="54" height="42" rx="14" fill="white" stroke="#e2e8f0" strokeWidth="1.5"/>
                <rect x="50" y="82" width="30" height="42" rx="4" fill="#0d9488"/>
                <path d="M56 82 L50 110 L65 100 L80 110 L74 82" fill="white"/>
                <path d="M38 95 Q24 102 26 118" stroke="#F5C5A3" strokeWidth="9" strokeLinecap="round" fill="none"/>
                <path d="M92 95 Q106 100 104 116" stroke="#F5C5A3" strokeWidth="9" strokeLinecap="round" fill="none"/>
                <rect x="96" y="104" width="20" height="26" rx="3" fill="white" stroke="#e2e8f0" strokeWidth="1"/>
                <rect x="101" y="100" width="10" height="7" rx="3.5" fill="#5eead4"/>
                <line x1="99" y1="113" x2="113" y2="113" stroke="#0d9488" strokeWidth="1.1" opacity="0.4"/>
                <line x1="99" y1="117" x2="113" y2="117" stroke="#0d9488" strokeWidth="1.1" opacity="0.4"/>
                <line x1="99" y1="121" x2="110" y2="121" stroke="#0d9488" strokeWidth="1.1" opacity="0.4"/>
                <path d="M40 90 Q32 100 34 112 Q36 118 40 118" stroke="#0d9488" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <circle cx="40" cy="119" r="4" fill="none" stroke="#0d9488" strokeWidth="2"/>
                <rect x="59" y="69" width="12" height="14" rx="6" fill="#F5C5A3"/>
                <circle cx="65" cy="56" r="19" fill="#F5C5A3"/>
                <path d="M46 50 Q46 34 65 34 Q84 34 84 50 Q82 40 72 36 Q65 33 58 36 Q48 40 46 50Z" fill="#3D2B1F"/>
                <path d="M46 50 Q44 56 46 64" stroke="#3D2B1F" strokeWidth="5" strokeLinecap="round"/>
                <path d="M84 50 Q86 56 84 64" stroke="#3D2B1F" strokeWidth="5" strokeLinecap="round"/>
                <ellipse cx="46" cy="57" rx="3.5" ry="5" fill="#F0B090"/>
                <ellipse cx="84" cy="57" rx="3.5" ry="5" fill="#F0B090"/>
                <rect x="52" y="51" width="12" height="9" rx="4" fill="none" stroke="#5C3D2E" strokeWidth="1.5"/>
                <rect x="66" y="51" width="12" height="9" rx="4" fill="none" stroke="#5C3D2E" strokeWidth="1.5"/>
                <line x1="64" y1="55" x2="66" y2="55" stroke="#5C3D2E" strokeWidth="1.5"/>
                <line x1="46" y1="55" x2="52" y2="55" stroke="#5C3D2E" strokeWidth="1.5"/>
                <line x1="78" y1="55" x2="84" y2="55" stroke="#5C3D2E" strokeWidth="1.5"/>
                <circle cx="58" cy="56" r="2.5" fill="#3D2B1F"/>
                <circle cx="72" cy="56" r="2.5" fill="#3D2B1F"/>
                <path d="M58 65 Q65 71 72 65" stroke="#5C3D2E" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              </svg>
            </div>

            <div className="text-center">
              <p className="font-bold text-base mb-1" style={{ color: '#1a2535' }}>Я психолог / терапевт</p>
              <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                Буду приглашать клиентов, помогать им подготовиться к сессиям
              </p>
            </div>
            <span
              className="mt-auto w-full py-3 text-white text-sm font-semibold rounded-2xl transition text-center"
              style={{ background: '#0d9488' }}
            >
              {loading === 'specialist' ? 'Загрузка…' : 'Войти как специалист'}
            </span>
          </button>

        </div>
      </div>
    </>
  )
}
