'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Referral {
  id: string
  user_id: string
  created_at: string
  status: string
  code: string
}

interface Earning {
  user_id: string
  amount_kzt: number
  status: string
}

interface Profile {
  id: string
  email: string
}

interface ReferralRow {
  userId: string
  email: string
  createdAt: string
  status: string
  amountKzt: number
}

type Currency = 'KZT' | 'RUB' | 'USD'

const RATES: Record<Currency, number> = {
  KZT: 1,
  RUB: 0.19,
  USD: 0.002,
}
const SYMBOLS: Record<Currency, string> = { KZT: '₸', RUB: '₽', USD: '$' }
const MIN_KZT = 15000

function formatAmount(amountKzt: number, currency: Currency): string {
  const value = amountKzt * RATES[currency]
  if (currency === 'USD') return `$${value.toFixed(2)}`
  return `${Math.round(value).toLocaleString('ru')} ${SYMBOLS[currency]}`
}

function minWithdrawLabel(currency: Currency): string {
  const value = MIN_KZT * RATES[currency]
  if (currency === 'USD') return `$${value.toFixed(0)}`
  return `${Math.round(value).toLocaleString('ru')} ${SYMBOLS[currency]}`
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const visible = local.slice(0, 3)
  return `${visible}***@${domain}`
}

export default function EarningsTab({ specialistId }: { specialistId: string }) {
  const [rows, setRows] = useState<ReferralRow[]>([])
  const [totalKzt, setTotalKzt] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<Currency>('KZT')

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: referrals } = await supabase
        .from('referrals')
        .select('id, user_id, created_at, status, code')
        .eq('specialist_id', specialistId)

      const { data: earnings } = await supabase
        .from('specialist_earnings')
        .select('user_id, amount_kzt, status')
        .eq('specialist_id', specialistId)

      const refs: Referral[] = referrals ?? []
      const earns: Earning[] = earnings ?? []

      const userIds = refs.map((r) => r.user_id)
      let profiles: Profile[] = []

      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds)
        profiles = profileData ?? []
      }

      const profileMap = new Map(profiles.map((p) => [p.id, p.email]))
      const earningsMap = new Map(
        earns.map((e) => [e.user_id, e.amount_kzt ?? 0])
      )

      const combined: ReferralRow[] = refs.map((r) => ({
        userId: r.user_id,
        email: maskEmail(profileMap.get(r.user_id) ?? r.user_id),
        createdAt: r.created_at,
        status: r.status,
        amountKzt: earningsMap.get(r.user_id) ?? 0,
      }))

      const total = earns.reduce((sum, e) => sum + (e.amount_kzt ?? 0), 0)

      setRows(combined)
      setTotalKzt(total)
      setLoading(false)
    }

    load()
  }, [specialistId])

  const totalInvited = rows.length
  const totalConverted = rows.filter((r) => r.status === 'converted').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
        Загрузка...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Currency selector */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 font-medium">Валюта отображения</p>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(['KZT', 'RUB', 'USD'] as Currency[]).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                currency === c
                  ? 'bg-white text-cyan-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Всего приглашено</p>
          <p className="text-2xl font-bold text-cyan-600">{totalInvited}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Стали Pro</p>
          <p className="text-2xl font-bold text-cyan-600">{totalConverted}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Накоплено</p>
          <p className="text-xl font-bold text-cyan-600">
            {formatAmount(totalKzt, currency)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Мин. вывод</p>
          <p className="text-lg font-bold text-slate-400">{minWithdrawLabel(currency)}</p>
          <p className="text-xs text-slate-300 mt-0.5">≈ $30</p>
        </div>
      </div>

      {/* Table or empty state */}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-400 text-sm">
            Пригласите первого пользователя, чтобы начать зарабатывать
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Дата регистрации
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Статус
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Начислено ({currency})
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.userId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-700 font-mono">{row.email}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(row.createdAt).toLocaleDateString('ru-KZ', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {row.status === 'converted' ? (
                      <span className="inline-flex items-center rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium text-cyan-700 ring-1 ring-inset ring-cyan-600/20">
                        Pro
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        Free
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {row.amountKzt > 0 ? formatAmount(row.amountKzt, currency) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
