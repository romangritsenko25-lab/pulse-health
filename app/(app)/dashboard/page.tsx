'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface CheckinEntry {
  id: string
  mood: number
  energy: number
  sleep: number
  stress: number
  score: number
  created_at: string
}

const MOCK_DATA: CheckinEntry[] = [
  { id: '1', mood: 3, energy: 3, sleep: 6, stress: 4, score: 45, created_at: '2024-04-22' },
  { id: '2', mood: 4, energy: 4, sleep: 8, stress: 2, score: 72, created_at: '2024-04-23' },
  { id: '3', mood: 2, energy: 2, sleep: 5, stress: 5, score: 30, created_at: '2024-04-24' },
  { id: '4', mood: 4, energy: 5, sleep: 9, stress: 2, score: 82, created_at: '2024-04-25' },
  { id: '5', mood: 5, energy: 4, sleep: 8, stress: 1, score: 88, created_at: '2024-04-26' },
  { id: '6', mood: 3, energy: 3, sleep: 7, stress: 3, score: 58, created_at: '2024-04-27' },
  { id: '7', mood: 4, energy: 4, sleep: 8, stress: 2, score: 74, created_at: '2024-04-28' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [data] = useState<CheckinEntry[]>(MOCK_DATA)
  const [trendInsight, setTrendInsight] = useState<string | null>(null)
  const [trendLoading, setTrendLoading] = useState(true)

  useEffect(() => {
    fetch('/api/trend')
      .then((r) => r.json())
      .then((d) => setTrendInsight(d.insight ?? null))
      .catch(() => setTrendInsight(null))
      .finally(() => setTrendLoading(false))
  }, [])

  const avgScore = Math.round(data.reduce((a, b) => a + b.score, 0) / data.length)
  const avgMood = (data.reduce((a, b) => a + b.mood, 0) / data.length).toFixed(1)
  const avgSleep = (data.reduce((a, b) => a + b.sleep, 0) / data.length).toFixed(1)
  const avgStress = (data.reduce((a, b) => a + b.stress, 0) / data.length).toFixed(1)

  const chartData = data.map((d) => ({
    date: new Date(d.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    score: d.score,
    mood: d.mood * 20,
  }))

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-0.5">Metanoia AI</p>
            <h1 className="text-2xl font-bold text-slate-800">Дашборд</h1>
            <p className="text-slate-400 text-sm">Последние 7 дней</p>
          </div>
          <button
            onClick={() => router.push('/checkin')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-xl transition font-semibold"
          >
            + Новый опрос
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Индекс', value: avgScore, suffix: '' },
            { label: 'Настроение', value: avgMood, suffix: '/5' },
            { label: 'Сон', value: avgSleep, suffix: 'ч' },
            { label: 'Стресс', value: avgStress, suffix: '/5' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-slate-800">
                {s.value}
                <span className="text-sm text-slate-400">{s.suffix}</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* AI trend insight */}
        {(trendLoading || trendInsight) && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 mb-4 flex items-start gap-3">
            <span className="text-lg mt-0.5">🧠</span>
            {trendLoading ? (
              <p className="text-sm text-indigo-400 animate-pulse">Анализирую твои данные…</p>
            ) : (
              <p className="text-sm text-indigo-800 leading-relaxed">{trendInsight}</p>
            )}
          </div>
        )}

        {/* Line chart */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-4">
          <h2 className="text-sm font-semibold text-slate-600 mb-4">Динамика самочувствия</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  color: '#1e293b',
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: '#6366f1', r: 3 }}
                name="Индекс"
              />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#14b8a6"
                strokeWidth={2}
                dot={{ fill: '#14b8a6', r: 3 }}
                name="Настроение"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* History */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-600 mb-4">История опросов</h2>
          <div className="space-y-2">
            {[...data].reverse().map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
              >
                <span className="text-slate-500 text-sm">
                  {new Date(entry.created_at).toLocaleDateString('ru-RU', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    😴 {entry.sleep}ч · 😤 {entry.stress}/5
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      entry.score >= 70
                        ? 'text-teal-500'
                        : entry.score >= 40
                        ? 'text-amber-500'
                        : 'text-red-400'
                    }`}
                  >
                    {entry.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
