'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

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
    router.replace(role === 'specialist' ? '/specialist/dashboard' : '/onboarding/profile')
  }

  if (checking) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f7' }}>
        <style>{`
          @keyframes logo-soft-in {
            from { opacity: 0; transform: scale(0.85); }
            to   { opacity: 1; transform: scale(1); }
          }
          @keyframes glow-out {
            0%   { transform: scale(1);   opacity: 0.45; filter: blur(8px); }
            100% { transform: scale(2.6); opacity: 0;    filter: blur(24px); }
          }
        `}</style>
        <div style={{ position: 'relative', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'logo-soft-in 0.6s ease-out forwards' }}>
          <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,78,216,0.35), transparent 70%)', animation: 'glow-out 1.4s ease-out infinite' }} />
          <Image src="/Logo1.png" alt="" width={40} height={40} className="rounded-xl object-contain" />
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes logo-soft-in {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes glow-out {
          0%   { transform: scale(1);   opacity: 0.5;  filter: blur(10px); }
          100% { transform: scale(3);   opacity: 0;    filter: blur(28px); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ob-half {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 3.5rem 2.5rem 3.5rem 3rem;
          opacity: 0;
          animation: fade-in 0.7s 0.25s ease forwards;
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }
        .ob-half-right {
          padding: 3.5rem 3rem 3.5rem 2.5rem;
        }
        .ob-content {
          opacity: 0;
          animation: fade-up 0.6s 0.65s ease forwards;
          position: relative;
          z-index: 2;
        }
        .ob-btn {
          margin-top: 2rem;
          background: rgba(255,255,255,0.95);
          border: none;
          border-radius: 14px;
          padding: 14px 24px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          width: 100%;
          max-width: 240px;
          transition: background 0.22s, color 0.22s, transform 0.18s;
        }
        .ob-btn-navy { color: #1d4ed8; }
        .ob-btn-teal { color: #0e7490; }
        .ob-btn:hover { transform: translateY(-2px); }
        .ob-btn-navy:hover { background: #1d4ed8; color: white; }
        .ob-btn-teal:hover  { background: #0891b2; color: white; }
        .ob-badge {
          display: inline-block;
          background: rgba(255,255,255,0.2);
          color: white;
          font-size: 11px;
          font-weight: 700;
          border-radius: 8px;
          padding: 4px 12px;
          margin-bottom: 14px;
          letter-spacing: 0.3px;
          backdrop-filter: blur(4px);
        }
        /* Мобиль — вертикальный split */
        @media (max-width: 580px) {
          .ob-wrap { flex-direction: column !important; }
          .ob-half { padding: 2.5rem 2rem 2rem 2rem !important; min-height: 50dvh; justify-content: flex-end !important; }
          .ob-half-right { padding: 2rem 2rem 2.5rem 2rem !important; justify-content: flex-start !important; }
          .ob-btn { max-width: 100% !important; }
        }
      `}</style>

      <div
        className="ob-wrap"
        style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'row', position: 'relative' }}
      >

        {/* ── Левая половина — Пациент (navy) ── */}
        <div
          className="ob-half"
          onClick={() => !loading && choose('user')}
          style={{
            background: 'radial-gradient(ellipse 80% 70% at 75% 42%, #3b82f6 0%, #1d4ed8 55%, #1e3a8a 100%)',
          }}
        >
          <div className="ob-content">
            <span className="ob-badge">Для себя</span>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.25, letterSpacing: '-0.3px' }}>
              Я хочу<br />разобраться в себе
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13.5, lineHeight: 1.65, margin: 0, maxWidth: 220 }}>
              Подготовлюсь к приёму у специалиста, буду вести дневник и отслеживать своё состояние
            </p>
            <button
              className="ob-btn ob-btn-navy"
              onClick={e => { e.stopPropagation(); choose('user') }}
              disabled={!!loading}
            >
              {loading === 'user' ? 'Загрузка…' : 'Начать'}
            </button>
          </div>
        </div>

        {/* ── Правая половина — Специалист (teal) ── */}
        <div
          className="ob-half ob-half-right"
          onClick={() => !loading && choose('specialist')}
          style={{
            background: 'radial-gradient(ellipse 80% 70% at 25% 42%, #22d3ee 0%, #06b6d4 55%, #0e7490 100%)',
          }}
        >
          <div className="ob-content" style={{ animationDelay: '0.8s' }}>
            <span className="ob-badge">Для специалистов</span>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.25, letterSpacing: '-0.3px' }}>
              Я психолог /<br />терапевт
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13.5, lineHeight: 1.65, margin: 0, maxWidth: 220 }}>
              Буду приглашать клиентов и помогать им подготовиться к сессиям
            </p>
            <button
              className="ob-btn ob-btn-teal"
              onClick={e => { e.stopPropagation(); choose('specialist') }}
              disabled={!!loading}
            >
              {loading === 'specialist' ? 'Загрузка…' : 'Войти как специалист'}
            </button>
          </div>
        </div>

      </div>
    </>
  )
}
