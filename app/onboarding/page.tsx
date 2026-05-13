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
                {/* Background */}
                <circle cx="65" cy="80" r="68" fill="#f0fdfa"/>
                {/* Shadow */}
                <ellipse cx="65" cy="155" rx="25" ry="5" fill="#ccfbf1"/>
                {/* Shoes */}
                <ellipse cx="57" cy="150" rx="10" ry="5" fill="#5C3D2E"/>
                <ellipse cx="75" cy="150" rx="10" ry="5" fill="#5C3D2E"/>
                {/* Legs */}
                <rect x="50" y="115" width="13" height="37" rx="5" fill="#818cf8"/>
                <rect x="67" y="115" width="13" height="37" rx="5" fill="#818cf8"/>
                {/* Body */}
                <rect x="44" y="80" width="42" height="38" rx="10" fill="#a5b4fc"/>
                {/* Left arm */}
                <rect x="31" y="82" width="13" height="30" rx="6" fill="#a5b4fc"/>
                {/* Right arm (raised to hold phone) */}
                <rect x="86" y="82" width="13" height="26" rx="6" fill="#a5b4fc"/>
                {/* Left hand */}
                <circle cx="37" cy="114" r="6" fill="#F5C5A3"/>
                {/* Right hand */}
                <circle cx="92" cy="110" r="6" fill="#F5C5A3"/>
                {/* Phone */}
                <rect x="87" y="96" width="12" height="20" rx="2.5" fill="#1e293b"/>
                <rect x="88.5" y="98" width="9" height="14" rx="1.5" fill="#7dd3fc"/>
                {/* Neck */}
                <rect x="59" y="72" width="12" height="12" rx="4" fill="#F5C5A3"/>
                {/* Head */}
                <circle cx="65" cy="57" r="19" fill="#F5C5A3"/>
                {/* Ears */}
                <circle cx="46" cy="59" r="5" fill="#F0B090"/>
                <circle cx="84" cy="59" r="5" fill="#F0B090"/>
                {/* Hair */}
                <path d="M46 57 C46 34 84 34 84 57 L80 51 Q65 37 50 51Z" fill="#5C3D2E"/>
                {/* Eyes */}
                <circle cx="59" cy="57" r="2" fill="#3D2B1F"/>
                <circle cx="71" cy="57" r="2" fill="#3D2B1F"/>
                {/* Smile */}
                <path d="M60 64 Q65 68 70 64" fill="none" stroke="#3D2B1F" strokeWidth="1.5" strokeLinecap="round"/>
                {/* Speech bubble tail (drawn before circle) */}
                <path d="M85 34 L79 46 L91 38Z" fill="white"/>
                <polyline points="85,34 79,46 91,38" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeLinejoin="round"/>
                {/* Speech bubble */}
                <circle cx="100" cy="24" r="17" fill="white" stroke="#e2e8f0" strokeWidth="1.5"/>
                {/* Heart: two circles + triangle */}
                <circle cx="96" cy="22" r="5" fill="#0d9488"/>
                <circle cx="104" cy="22" r="5" fill="#0d9488"/>
                <polygon points="91,26 100,34 109,26" fill="#0d9488"/>
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
                {/* Background */}
                <circle cx="65" cy="80" r="68" fill="#f0fdfa"/>
                {/* Shadow */}
                <ellipse cx="65" cy="155" rx="25" ry="5" fill="#ccfbf1"/>
                {/* Shoes */}
                <ellipse cx="57" cy="150" rx="10" ry="5" fill="#3D2B1F"/>
                <ellipse cx="75" cy="150" rx="10" ry="5" fill="#3D2B1F"/>
                {/* Legs */}
                <rect x="50" y="115" width="13" height="37" rx="5" fill="#0d9488"/>
                <rect x="67" y="115" width="13" height="37" rx="5" fill="#0d9488"/>
                {/* Underlying clothes */}
                <rect x="44" y="80" width="42" height="38" rx="10" fill="#0d9488"/>
                {/* White coat body */}
                <rect x="40" y="80" width="50" height="42" rx="10" fill="white"/>
                {/* V-neck opening */}
                <polygon points="65,82 57,106 65,100 73,106 65,82" fill="#0d9488"/>
                {/* Left coat arm */}
                <rect x="27" y="82" width="14" height="30" rx="7" fill="white"/>
                {/* Right coat arm */}
                <rect x="89" y="82" width="14" height="30" rx="7" fill="white"/>
                {/* Stethoscope tube */}
                <path d="M52 80 Q42 88 38 100 Q36 110 43 116" fill="none" stroke="#0d9488" strokeWidth="3" strokeLinecap="round"/>
                {/* Stethoscope chest piece */}
                <circle cx="44" cy="118" r="5" fill="none" stroke="#0d9488" strokeWidth="2.5"/>
                {/* Clipboard (before hands so hand appears on top) */}
                <rect x="91" y="86" width="22" height="30" rx="3" fill="#f8f4ee"/>
                <rect x="94" y="82" width="16" height="8" rx="3" fill="#94a3b8"/>
                <line x1="94" y1="100" x2="110" y2="100" stroke="#cbd5e1" strokeWidth="1.5"/>
                <line x1="94" y1="106" x2="110" y2="106" stroke="#cbd5e1" strokeWidth="1.5"/>
                <line x1="94" y1="112" x2="110" y2="112" stroke="#cbd5e1" strokeWidth="1.5"/>
                {/* Left hand */}
                <circle cx="34" cy="114" r="6" fill="#F5C5A3"/>
                {/* Right hand (gripping clipboard) */}
                <circle cx="96" cy="114" r="6" fill="#F5C5A3"/>
                {/* Neck */}
                <rect x="59" y="72" width="12" height="12" rx="4" fill="#F5C5A3"/>
                {/* Head */}
                <circle cx="65" cy="57" r="19" fill="#F5C5A3"/>
                {/* Ears */}
                <circle cx="46" cy="59" r="5" fill="#F0B090"/>
                <circle cx="84" cy="59" r="5" fill="#F0B090"/>
                {/* Hair (darker) */}
                <path d="M46 57 C46 34 84 34 84 57 L80 51 Q65 37 50 51Z" fill="#3D2B1F"/>
                {/* Glasses */}
                <rect x="51" y="51" width="12" height="8" rx="2.5" fill="none" stroke="#5C3D2E" strokeWidth="1.5"/>
                <rect x="67" y="51" width="12" height="8" rx="2.5" fill="none" stroke="#5C3D2E" strokeWidth="1.5"/>
                <line x1="63" y1="55" x2="67" y2="55" stroke="#5C3D2E" strokeWidth="1.5"/>
                <line x1="46" y1="55" x2="51" y2="55" stroke="#5C3D2E" strokeWidth="1.5"/>
                <line x1="79" y1="55" x2="84" y2="55" stroke="#5C3D2E" strokeWidth="1.5"/>
                {/* Eyes */}
                <circle cx="57" cy="55" r="1.5" fill="#3D2B1F"/>
                <circle cx="73" cy="55" r="1.5" fill="#3D2B1F"/>
                {/* Smile */}
                <path d="M60 64 Q65 67 70 64" fill="none" stroke="#3D2B1F" strokeWidth="1.5" strokeLinecap="round"/>
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
