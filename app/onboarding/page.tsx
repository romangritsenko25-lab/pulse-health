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
          border-color: #2563eb;
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(37,99,235,0.13);
        }
        .ob-card:hover .ob-illo { background: #e0faf6; }
        .ob-card:hover .ob-svg-wrap { transform: scale(1.06); }
        .ob-illo {
          background: #eff6ff;
          height: 190px;
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
          background: #2563eb !important;
          color: white !important;
        }
      `}</style>

      <div style={{ background: '#faf9f7', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1.5rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 3C16 3 5 12 5 19.5C5 25.5 10 29.5 16 29.5C22 29.5 27 25.5 27 19.5C27 12 16 3 16 3Z" fill="#2563eb"/>
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
                <svg width="130" height="160" viewBox="0 0 130 160" fill="none">
                  <ellipse cx="65" cy="145" rx="40" ry="7" fill="#dbeafe"/>
                  <ellipse cx="52" cy="130" rx="18" ry="9" fill="#2563eb" opacity="0.8"/>
                  <ellipse cx="78" cy="130" rx="18" ry="9" fill="#2563eb" opacity="0.6"/>
                  <rect x="44" y="90" width="42" height="42" rx="14" fill="#2563eb"/>
                  <path d="M44 105 Q32 110 34 122" stroke="#F5C5A3" strokeWidth="9" strokeLinecap="round" fill="none"/>
                  <path d="M86 105 Q98 110 96 122" stroke="#F5C5A3" strokeWidth="9" strokeLinecap="round" fill="none"/>
                  <rect x="36" y="116" width="32" height="22" rx="4" fill="white"/>
                  <rect x="36" y="116" width="3" height="22" rx="1.5" fill="#dbeafe"/>
                  <line x1="43" y1="123" x2="63" y2="123" stroke="#2563eb" strokeWidth="1.2" opacity="0.35"/>
                  <line x1="43" y1="127" x2="63" y2="127" stroke="#2563eb" strokeWidth="1.2" opacity="0.35"/>
                  <line x1="43" y1="131" x2="57" y2="131" stroke="#2563eb" strokeWidth="1.2" opacity="0.35"/>
                  <rect x="91" y="114" width="3.5" height="16" rx="1.8" fill="#5eead4" transform="rotate(-20 91 114)"/>
                  <rect x="59" y="73" width="12" height="18" rx="6" fill="#F5C5A3"/>
                  <circle cx="65" cy="60" r="19" fill="#F5C5A3"/>
                  <path d="M46 56 Q46 38 65 38 Q84 38 84 56 Q84 48 78 44 Q65 36 52 44 Q46 48 46 56Z" fill="#5C3D2E"/>
                  <ellipse cx="46" cy="61" rx="3.5" ry="5" fill="#F0B090"/>
                  <ellipse cx="84" cy="61" rx="3.5" ry="5" fill="#F0B090"/>
                  <path d="M56 59 Q58.5 56 61 59" stroke="#5C3D2E" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                  <path d="M69 59 Q71.5 56 74 59" stroke="#5C3D2E" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                  <path d="M58 67 Q65 73 72 67" stroke="#5C3D2E" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  <circle cx="90" cy="40" r="13" fill="white" stroke="#2563eb" strokeWidth="1.5"/>
                  <path d="M83 37 C83 34 86 32 90 34 C94 32 97 34 97 37 C97 40 90 44.5 90 44.5 C90 44.5 83 40 83 37Z" fill="#2563eb" opacity="0.65"/>
                  <circle cx="80" cy="52" r="3.5" fill="white" stroke="#2563eb" strokeWidth="1.2"/>
                  <circle cx="76" cy="59" r="2.2" fill="white" stroke="#2563eb" strokeWidth="1"/>
                </svg>
              </div>
            </div>
            <div style={{ padding: '20px 22px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ display: 'inline-block', background: '#eff6ff', color: '#2563eb', fontSize: '11px', fontWeight: 700, borderRadius: '8px', padding: '3px 10px', width: 'fit-content' }}>Для себя</span>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#1e3a5f', margin: 0, lineHeight: 1.3 }}>Я хочу разобраться в себе</p>
              <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.6, margin: '0 0 4px', flex: 1 }}>Подготовлюсь к приёму у специалиста, буду вести дневник и отслеживать своё состояние</p>
              <button
                onClick={e => { e.stopPropagation(); choose('user') }}
                disabled={!!loading}
                style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '14px', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', width: '100%' }}
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
                <svg width="130" height="160" viewBox="0 0 130 160" fill="none">
                  <ellipse cx="65" cy="145" rx="40" ry="7" fill="#dbeafe"/>
                  <rect x="50" y="120" width="14" height="26" rx="7" fill="#1e3a5f" opacity="0.8"/>
                  <rect x="66" y="120" width="14" height="26" rx="7" fill="#1e3a5f" opacity="0.8"/>
                  <rect x="38" y="82" width="54" height="42" rx="14" fill="white" stroke="#e2e8f0" strokeWidth="1.5"/>
                  <rect x="50" y="82" width="30" height="42" rx="4" fill="#2563eb"/>
                  <path d="M56 82 L50 110 L65 100 L80 110 L74 82" fill="white"/>
                  <path d="M38 95 Q24 102 26 118" stroke="#F5C5A3" strokeWidth="9" strokeLinecap="round" fill="none"/>
                  <path d="M92 95 Q106 100 104 116" stroke="#F5C5A3" strokeWidth="9" strokeLinecap="round" fill="none"/>
                  <rect x="96" y="104" width="20" height="26" rx="3" fill="white" stroke="#e2e8f0" strokeWidth="1"/>
                  <rect x="101" y="100" width="10" height="7" rx="3.5" fill="#5eead4"/>
                  <line x1="99" y1="113" x2="113" y2="113" stroke="#2563eb" strokeWidth="1.1" opacity="0.4"/>
                  <line x1="99" y1="117" x2="113" y2="117" stroke="#2563eb" strokeWidth="1.1" opacity="0.4"/>
                  <line x1="99" y1="121" x2="110" y2="121" stroke="#2563eb" strokeWidth="1.1" opacity="0.4"/>
                  <path d="M100 125 L103 128.5 L109 122" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
                  <path d="M42 100 Q34 110 36 120 Q38 126 44 126" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                  <circle cx="44" cy="127" r="4" fill="none" stroke="#2563eb" strokeWidth="2"/>
                  <rect x="56" y="90" width="18" height="12" rx="3" fill="#eff6ff" stroke="#2563eb" strokeWidth="0.8"/>
                  <line x1="59" y1="94" x2="71" y2="94" stroke="#2563eb" strokeWidth="1" opacity="0.5"/>
                  <line x1="59" y1="97" x2="68" y2="97" stroke="#2563eb" strokeWidth="1" opacity="0.5"/>
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
            </div>
            <div style={{ padding: '20px 22px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ display: 'inline-block', background: '#eff6ff', color: '#2563eb', fontSize: '11px', fontWeight: 700, borderRadius: '8px', padding: '3px 10px', width: 'fit-content' }}>Для специалистов</span>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#1e3a5f', margin: 0, lineHeight: 1.3 }}>Я психолог / терапевт</p>
              <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.6, margin: '0 0 4px', flex: 1 }}>Буду приглашать клиентов и помогать им подготовиться к сессиям</p>
              <button
                className="ob-btn-outline"
                onClick={e => { e.stopPropagation(); choose('specialist') }}
                disabled={!!loading}
                style={{ background: 'white', color: '#2563eb', border: '2px solid #2563eb', borderRadius: '14px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', width: '100%', transition: 'background 0.2s, color 0.2s' }}
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
