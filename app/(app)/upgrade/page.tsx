'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const PADDLE_VENDOR_ID = process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID ?? ''

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'навсегда',
    features: [
      '3 опроса',
      'AI-анализ (5 секций)',
      '3 вопроса к AI после анализа',
      'PDF-отчёт',
    ],
    cta: 'Текущий план',
    current: true,
    paddleId: null,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9',
    period: 'в месяц',
    features: [
      'Безлимитные опросы',
      'Глубокий AI-анализ',
      'Безлимитный чат с AI',
      'PDF-отчёты',
      'История без ограничений',
      'Еженедельный email-отчёт',
    ],
    cta: 'Начать Pro',
    current: false,
    highlight: true,
    paddleId: process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID,
  },
  {
    id: 'specialist',
    name: 'Для специалиста',
    price: '$29',
    period: 'в месяц',
    features: [
      'Всё из Pro',
      'Реферальная ссылка для клиентов',
      'До 50 клиентов',
      'Сводный дашборд',
      'Приоритетная поддержка',
    ],
    cta: 'Для специалистов',
    current: false,
    paddleId: process.env.NEXT_PUBLIC_PADDLE_SPECIALIST_PRICE_ID,
  },
]

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle?: any
  }
}

export default function UpgradePage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [fromPaywall, setFromPaywall] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email)
    })
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('reason') === 'limit') {
      setFromPaywall(true)
    }
  }, [])

  function handlePaddle(priceId: string | null | undefined) {
    if (!priceId) {
      alert('Оплата ещё не подключена. Paddle будет настроен в ближайшее время.')
      return
    }
    if (typeof window === 'undefined' || !window.Paddle) {
      alert('Paddle не загружен. Попробуй ещё раз.')
      return
    }
    setLoading(priceId)
    window.Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email: userEmail },
      successUrl: `${window.location.origin}/dashboard?upgraded=1`,
    })
    setLoading(null)
  }

  return (
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      {/* Paddle.js */}
      {PADDLE_VENDOR_ID && (
        <script
          src="https://cdn.paddle.com/paddle/v2/paddle.js"
          onLoad={() => window.Paddle?.Setup({ vendor: parseInt(PADDLE_VENDOR_ID) })}
        />
      )}

      <div className="max-w-lg mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600 text-sm mb-6 transition">
          < Назад
        </button>

        {fromPaywall && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
            <span className="text-xl">??</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">Бесплатный лимит исчерпан</p>
              <p className="text-amber-700 text-xs mt-0.5">Ты использовал(а) 3 бесплатных опроса. Обновись до Pro для продолжения.</p>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Metanoia AI</p>
          <h1 className="text-2xl font-bold text-slate-800">Выбери тариф</h1>
          <p className="text-slate-400 text-sm mt-1">Оплата через Paddle · Отмена в любой момент</p>
        </div>

        <div className="flex flex-col gap-4">
          {PLANS.map((plan) => (
            <div key={plan.id}
              className={`bg-white rounded-2xl border p-6 relative ${
                plan.highlight ? 'border-blue-400 shadow-md shadow-blue-100' : 'border-slate-200'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Рекомендуем
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold text-slate-800">{plan.name}</p>
                  <p className="text-slate-400 text-xs">{plan.period}</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-slate-800">{plan.price}</span>
                  {plan.period !== 'навсегда' && <span className="text-slate-400 text-xs">/мес</span>}
                </div>
              </div>

              <ul className="flex flex-col gap-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-blue-500 font-bold text-xs">?</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => !plan.current && handlePaddle(plan.paddleId)}
                disabled={plan.current || loading === plan.paddleId}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition ${
                  plan.current
                    ? 'bg-slate-100 text-slate-400 cursor-default'
                    : plan.highlight
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                {loading === plan.paddleId ? 'Открываем…' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Referral block */}
        <ReferralBlock />

        <p className="text-slate-300 text-xs text-center mt-6">
          Безопасная оплата · Не является медицинским сервисом
        </p>
      </div>
    </div>
  )
}

function ReferralBlock() {
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const ref = btoa(data.user.id).replace(/=/g, '').slice(0, 12)
        setLink(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pulse-health-smoky.vercel.app'}/login?ref=${ref}`)
      }
    })
  }, [])

  function copy() {
    if (!link) return
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!link) return null

  return (
    <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-5">
      <p className="font-semibold text-slate-800 text-sm mb-1">Реферальная ссылка</p>
      <p className="text-slate-400 text-xs mb-3">Пригласи друга — оба получите бонусный опрос</p>
      <div className="flex gap-2">
        <input
          readOnly value={link}
          className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-500 truncate"
        />
        <button
          onClick={copy}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shrink-0"
        >
          {copied ? '?' : 'Копировать'}
        </button>
      </div>
    </div>
  )
}
