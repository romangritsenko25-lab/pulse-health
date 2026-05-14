'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'

interface CheckinRow {
  id: string
  wellbeing: number | null
  mood: string | null
  energy: string | null
  sleep: string | null
  created_at: string
}

// -- Streak helpers ---------------------------------------------------------
function calcStreak(checkins: CheckinRow[]): number {
  if (!checkins.length) return 0
  const days = new Set(
    checkins.map((c) => new Date(c.created_at).toLocaleDateString('ru-RU'))
  )
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    if (days.has(d.toLocaleDateString('ru-RU'))) {
      streak++
    } else if (i > 0) {
      break
    }
  }
  return streak
}

function streakMilestone(streak: number): string | null {
  if (streak === 100) return '?? 100 дней подряд — это невероятно!'
  if (streak === 30) return '?? Месяц подряд — ты в потоке!'
  if (streak === 7) return '? Неделя без пропусков — отличное начало!'
  return null
}

// -- Main -------------------------------------------------------------------
export default function DashboardPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/cabinet') }, [router])
  const [checkins, setCheckins] = useState<CheckinRow[]>([])
  const [loading, setLoading] = useState(true)
  const [trendInsight, setTrendInsight] = useState<string | null>(null)
  const [trendLoading, setTrendLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('checkins')
        .select('id, wellbeing, mood, energy, sleep, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)

      setCheckins(data ?? [])
      setLoading(false)
    }
    loadData()

    fetch('/api/trend')
      .then((r) => r.json())
      .then((d) => setTrendInsight(d.insight ?? null))
      .catch(() => setTrendInsight(null))
      .finally(() => setTrendLoading(false))
  }, [router])

  const streak = calcStreak(checkins)
  const milestone = streakMilestone(streak)

  const last7 = checkins.slice(0, 7)
  const avgWellbeing = last7.length
    ? (last7.reduce((a, b) => a + (b.wellbeing ?? 5), 0) / last7.length).toFixed(1)
    : '—'

  // Parse sleep hours from "7ч, Нормально"
  const avgSleep = (() => {
    const vals = last7.map((c) => {
      const m = c.sleep?.match(/(\d+(?:\.\d+)?)/)
      return m ? parseFloat(m[1]) : null
    }).filter((v): v is number => v !== null)
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—'
  })()

  // Count unique emotion mentions
  const topMood = (() => {
    const freq: Record<string, number> = {}
    last7.forEach((c) => {
      if (!c.mood) return
      c.mood.split(',').forEach((e) => {
        const k = e.trim()
        if (k) freq[k] = (freq[k] ?? 0) + 1
      })
    })
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
    return sorted[0]?.[0] ?? '—'
  })()

  const chartData = [...last7].reverse().map((c) => ({
    date: new Date(c.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    score: c.wellbeing ?? 5,
  }))

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 animate-pulse text-sm">Загрузка…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-0.5">Metanoia AI</p>
            <h1 className="text-2xl font-bold text-slate-800">Дашборд</h1>
            <p className="text-slate-400 text-sm">Последние 7 дней</p>
          </div>
          <button
            onClick={() => router.push('/checkin')}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-xl transition font-semibold"
          >
            + Новый опрос
          </button>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center shrink-0">
              <span className="text-2xl">??</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-800 text-sm">
                Стрик: <span className="text-orange-500">{streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}</span> подряд
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                {milestone ?? 'Продолжай — это работает!'}
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {checkins.length === 0 && (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center mb-4">
            <p className="text-3xl mb-3">??</p>
            <p className="font-semibold text-slate-700 mb-1">Пока нет данных</p>
            <p className="text-slate-400 text-sm mb-4">Пройди первый опрос чтобы увидеть свою динамику</p>
            <button
              onClick={() => router.push('/checkin')}
              className="bg-blue-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-500 transition"
            >
              Начать опрос
            </button>
          </div>
        )}

        {checkins.length > 0 && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Самочувствие', value: avgWellbeing, suffix: '/10' },
                { label: 'Сон', value: avgSleep, suffix: 'ч' },
                { label: 'Топ эмоция', value: topMood, suffix: '' },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-4 text-center">
                  <div className="text-xl font-bold text-slate-800 truncate">
                    {s.value}
                    {s.suffix && <span className="text-sm text-slate-400">{s.suffix}</span>}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* AI trend insight */}
            {(trendLoading || trendInsight) && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 mb-4 flex items-start gap-3">
                <span className="text-lg mt-0.5">??</span>
                {trendLoading ? (
                  <p className="text-sm text-blue-400 animate-pulse">Анализирую твои данные…</p>
                ) : (
                  <p className="text-sm text-indigo-800 leading-relaxed">{trendInsight}</p>
                )}
              </div>
            )}

            {/* Chart */}
            {chartData.length > 1 && (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-4">
                <h2 className="text-sm font-semibold text-slate-600 mb-4">Динамика самочувствия</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[1, 10]} />
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }}
                    />
                    <Line
                      type="monotone" dataKey="score" stroke="#2563eb"
                      strokeWidth={2} dot={{ fill: '#2563eb', r: 3 }} name="Самочувствие"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* History */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-slate-600 mb-4">История опросов</h2>
              <div className="space-y-2">
                {checkins.slice(0, 10).map((entry) => (
                  <div key={entry.id}
                    className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-slate-500 text-sm">
                      {new Date(entry.created_at).toLocaleDateString('ru-RU', {
                        weekday: 'short', day: 'numeric', month: 'short',
                      })}
                    </span>
                    <div className="flex items-center gap-3">
                      {entry.mood && (
                        <span className="text-xs text-slate-400 max-w-[120px] truncate">{entry.mood.split(',')[0]}</span>
                      )}
                      <span className={`text-sm font-bold ${
                        (entry.wellbeing ?? 5) >= 7 ? 'text-blue-500'
                          : (entry.wellbeing ?? 5) >= 4 ? 'text-amber-500'
                          : 'text-red-400'
                      }`}>
                        {entry.wellbeing ?? '—'}/10
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
