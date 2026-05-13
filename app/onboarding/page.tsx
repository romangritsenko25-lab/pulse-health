'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-9px); }
        }
        .ob-card {
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 24px;
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
          display: flex;
          flex-direction: column;
        }
        .ob-card:hover {
          border-color: #0d9488;
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(13,148,136,0.13);
        }
        .ob-card:hover .ob-illo { background: #e0faf6; }
        .ob-card:hover .ob-svg-wrap { transform: scale(1.06); }
        .ob-illo {
          background: #f0fdfa;
          height: 210px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.25s;
        }
        .ob-svg-wrap {
          transition: transform 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ob-btn-outline:hover {
          background: #0d9488 !important;
          color: white !important;
        }
      `}</style>

      <div style={{ background: '#faf9f7', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1.5rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 3C16 3 5 12 5 19.5C5 25.5 10 29.5 16 29.5C22 29.5 27 25.5 27 19.5C27 12 16 3 16 3Z" fill="#0d9488"/>
            <circle cx="16" cy="21" r="5" fill="white" fillOpacity="0.2"/>
          </svg>
          <div>
            <span style={{ fontSize: '20px', color: '#1e3a5f', fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.3px' }}>metanoia</span>
            <span style={{ display: 'block', fontSize: '8px', letterSpacing: '3px', color: '#94a3b8', textTransform: 'uppercase', marginTop: '-2px' }}>AI Assistant</span>
          </div>
        </div>

        <h1 style={{ fontSize: '26px', color: '#1e3a5f', fontWeight: 700, textAlign: 'center', margin: '0 0 0.5rem', letterSpacing: '-0.5px' }}>
          Как вы будете использовать Metanoia?
        </h1>
        <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: '0 0 2.2rem', textAlign: 'center' }}>
          Выберите — это определит ваш интерфейс
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', width: '100%', maxWidth: '560px' }}>

          {/* Карточка 1 — Пользователь */}
          <div
            className="ob-card"
            onClick={() => choose('user')}
            style={{ opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }}
          >
            <div className="ob-illo">
              <div className="ob-svg-wrap" style={{ opacity: 0, animation: 'fade-up 0.6s ease forwards, float 4s ease-in-out 0.6s infinite' }}>
                <svg width="140" height="170" viewBox="0 0 140 170" fill="none">
                  <ellipse cx="70" cy="158" rx="44" ry="8" fill="#ccfbf1"/>
                  <rect x="52" y="112" width="14" height="44" rx="7" fill="#818cf8"/>
                  <rect x="74" y="112" width="14" height="44" rx="7" fill="#818cf8"/>
                  <rect x="40" y="74" width="60" height="44" rx="18" fill="#a5b4fc"/>
                  <rect x="14" y="82" width="28" height="13" rx="6.5" fill="#F5C5A3"/>
                  <rect x="98" y="82" width="28" height="13" rx="6.5" fill="#F5C5A3"/>
                  <rect x="120" y="72" width="16" height="24" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1.5"/>
                  <rect x="123" y="77" width="10" height="2" rx="1" fill="#0d9488" fillOpacity="0.5"/>
                  <rect x="123" y="81" width="10" height="2" rx="1" fill="#0d9488" fillOpacity="0.5"/>
                  <rect x="123" y="85" width="7" height="2" rx="1" fill="#0d9488" fillOpacity="0.5"/>
                  <rect x="63" y="58" width="14" height="18" rx="7" fill="#F5C5A3"/>
                  <circle cx="70" cy="44" r="22" fill="#F5C5A3"/>
                  <path d="M48 38 Q48 18 70 18 Q92 18 92 38 Q89 26 81 21 Q70 16 59 21 Q51 26 48 38Z" fill="#5C3D2E"/>
                  <ellipse cx="48" cy="45" rx="4" ry="5.5" fill="#F0B090"/>
                  <ellipse cx="92" cy="45" rx="4" ry="5.5" fill="#F0B090"/>
                  <circle cx="62" cy="43" r="3.5" fill="#3D2B1F"/>
                  <circle cx="78" cy="43" r="3.5" fill="#3D2B1F"/>
                  <circle cx="63" cy="42" r="1.2" fill="white"/>
                  <circle cx="79" cy="42" r="1.2" fill="white"/>
                  <path d="M62 53 Q70 60 78 53" stroke="#5C3D2E" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  <circle cx="100" cy="16" r="15" fill="white" stroke="#0d9488" strokeWidth="1.8"/>
                  <path d="M93 13.5 C93 10.5 96 8.5 100 11 C104 8.5 107 10.5 107 13.5 C107 17 100 22 100 22 C100 22 93 17 93 13.5Z" fill="#0d9488"/>
                  <circle cx="88" cy="27" r="4" fill="white" stroke="#0d9488" strokeWidth="1.5"/>
                  <circle cx="82" cy="34" r="2.5" fill="white" stroke="#0d9488" strokeWidth="1.2"/>
                </svg>
              </div>
            </div>
            <div style={{ padding: '20px 22px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ display: 'inline-block', background: '#f0fdfa', color: '#0d9488', fontSize: '11px', fontWeight: 700, borderRadius: '8px', padding: '3px 10px', width: 'fit-content' }}>Для себя</span>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#1e3a5f', margin: 0, lineHeight: 1.3 }}>Я хочу разобраться в себе</p>
              <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.6, margin: '0 0 4px', flex: 1 }}>Подготовлюсь к приёму у специалиста, буду вести дневник и отслеживать своё состояние</p>
              <button
                onClick={e => { e.stopPropagation(); choose('user') }}
                disabled={!!loading}
                style={{ background: '#0d9488', color: 'white', border: 'none', borderRadius: '14px', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', width: '100%' }}
              >
                {loading === 'user' ? 'Загрузка…' : 'Начать →'}
              </button>
            </div>
          </div>

          {/* Карточка 2 — Специалист */}
          <div
            className="ob-card"
            onClick={() => choose('specialist')}
            style={{ opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }}
          >
            <div className="ob-illo">
              <div className="ob-svg-wrap" style={{ opacity: 0, animation: 'fade-up 0.6s ease 0.15s forwards, float 4s ease-in-out 0.75s infinite' }}>
                <svg width="140" height="170" viewBox="0 0 140 170" fill="none">
                  <ellipse cx="70" cy="158" rx="44" ry="8" fill="#ccfbf1"/>
                  <rect x="52" y="120" width="14" height="38" rx="7" fill="#1e3a5f" fillOpacity="0.85"/>
                  <rect x="74" y="120" width="14" height="38" rx="7" fill="#1e3a5f" fillOpacity="0.85"/>
                  <rect x="34" y="76" width="72" height="48" rx="18" fill="white" stroke="#e2e8f0" strokeWidth="2"/>
                  <rect x="50" y="76" width="40" height="48" rx="8" fill="#0d9488"/>
                  <path d="M58 76 L50 112 L70 100 L90 112 L82 76Z" fill="white"/>
                  <rect x="10" y="86" width="26" height="13" rx="6.5" fill="#F5C5A3"/>
                  <path d="M34 96 Q22 108 24 122 Q26 130 32 130" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  <circle cx="32" cy="131" r="5" fill="none" stroke="#0d9488" strokeWidth="2.2"/>
                  <rect x="104" y="86" width="26" height="13" rx="6.5" fill="#F5C5A3"/>
                  <rect x="108" y="98" width="22" height="30" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1.5"/>
                  <rect x="114" y="93" width="10" height="8" rx="4" fill="#5eead4"/>
                  <line x1="111" y1="110" x2="127" y2="110" stroke="#0d9488" strokeWidth="1.2" strokeOpacity="0.4"/>
                  <line x1="111" y1="115" x2="127" y2="115" stroke="#0d9488" strokeWidth="1.2" strokeOpacity="0.4"/>
                  <line x1="111" y1="120" x2="122" y2="120" stroke="#0d9488" strokeWidth="1.2" strokeOpacity="0.4"/>
                  <path d="M112 124 L116 128 L124 121" stroke="#0d9488" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  <rect x="56" y="84" width="20" height="13" rx="4" fill="#f0fdfa" stroke="#0d9488" strokeWidth="0.8"/>
                  <line x1="59" y1="88" x2="73" y2="88" stroke="#0d9488" strokeWidth="1" strokeOpacity="0.5"/>
                  <line x1="59" y1="92" x2="70" y2="92" stroke="#0d9488" strokeWidth="1" strokeOpacity="0.5"/>
                  <rect x="63" y="58" width="14" height="20" rx="7" fill="#F5C5A3"/>
                  <circle cx="70" cy="44" r="22" fill="#F5C5A3"/>
                  <path d="M48 37 Q48 18 70 18 Q92 18 92 37 Q89 26 82 22 Q70 16 58 22 Q51 26 48 37Z" fill="#3D2B1F"/>
                  <path d="M48 37 Q46 44 48 56" stroke="#3D2B1F" strokeWidth="6" strokeLinecap="round"/>
                  <path d="M92 37 Q94 44 92 56" stroke="#3D2B1F" strokeWidth="6" strokeLinecap="round"/>
                  <ellipse cx="48" cy="45" rx="4" ry="5.5" fill="#F0B090"/>
                  <ellipse cx="92" cy="45" rx="4" ry="5.5" fill="#F0B090"/>
                  <rect x="55" y="40" width="14" height="10" rx="4.5" fill="none" stroke="#5C3D2E" strokeWidth="1.8"/>
                  <rect x="71" y="40" width="14" height="10" rx="4.5" fill="none" stroke="#5C3D2E" strokeWidth="1.8"/>
                  <line x1="69" y1="45" x2="71" y2="45" stroke="#5C3D2E" strokeWidth="1.8"/>
                  <line x1="48" y1="45" x2="55" y2="45" stroke="#5C3D2E" strokeWidth="1.8"/>
                  <line x1="85" y1="45" x2="92" y2="45" stroke="#5C3D2E" strokeWidth="1.8"/>
                  <circle cx="62" cy="46" r="3" fill="#3D2B1F"/>
                  <circle cx="78" cy="46" r="3" fill="#3D2B1F"/>
                  <path d="M62 56 Q70 63 78 56" stroke="#5C3D2E" strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
              </div>
            </div>
            <div style={{ padding: '20px 22px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ display: 'inline-block', background: '#f0fdfa', color: '#0d9488', fontSize: '11px', fontWeight: 700, borderRadius: '8px', padding: '3px 10px', width: 'fit-content' }}>Для специалистов</span>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#1e3a5f', margin: 0, lineHeight: 1.3 }}>Я психолог / терапевт</p>
              <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.6, margin: '0 0 4px', flex: 1 }}>Буду приглашать клиентов и помогать им подготовиться к сессиям</p>
              <button
                className="ob-btn-outline"
                onClick={e => { e.stopPropagation(); choose('specialist') }}
                disabled={!!loading}
                style={{ background: 'white', color: '#0d9488', border: '2px solid #0d9488', borderRadius: '14px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', width: '100%', transition: 'background 0.2s, color 0.2s' }}
              >
                {loading === 'specialist' ? 'Загрузка…' : 'Войти как специалист'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
