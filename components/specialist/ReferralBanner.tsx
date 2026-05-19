'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  specialistId: string
  referralCode: string
}

export default function ReferralBanner({ specialistId, referralCode }: Props) {
  const [count, setCount] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { count: total } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('specialist_id', specialistId)
      setCount(total ?? 0)
    }
    load()
  }, [specialistId])

  if (count === null || count > 0) return null

  async function handleCopy() {
    await navigator.clipboard.writeText(
      `https://pulse-health-smoky.vercel.app/join/${referralCode}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-800 p-6 mb-6 text-white">
      <p className="text-lg font-semibold mb-1">
        Приглашайте пользователей и зарабатывайте 💰
      </p>
      <p className="text-sm text-white/80 mb-4">
        20% от каждой Pro-подписки вашего пациента — ваши
      </p>
      <button
        onClick={handleCopy}
        className="rounded-lg bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 text-sm font-medium text-white"
      >
        {copied ? 'Скопировано ✓' : 'Скопировать ссылку'}
      </button>
    </div>
  )
}
