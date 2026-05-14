'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import EarningsTab from '@/components/specialist/EarningsTab'
import ReferralBanner from '@/components/specialist/ReferralBanner'

interface Client {
  client_id: string
  name: string | null
  email: string | null
  lastCheckin: { created_at: string; wellbeing: number | null; mood: string | null } | null
  checkinCount: number
  avgWellbeing: number | null
  recentScores: number[]
}

interface SpecialistInfo {
  name: string
  specialty: string
  referral_code: string
  photo_url: string | null
}

// Tiny sparkline: 5 dots
function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null
  const max = 10
  const w = 48
  const h = 20
  const step = w / (scores.length - 1)
  const points = scores
    .map((s, i) => `${i * step},${h - (s / max) * h}`)
    .join(' ')
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="#6366f1"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function SpecialistDashboard() {
  const router = useRouter()
  const [specialist, setSpecialist] = useState<SpecialistInfo | null>(null)
  const [specialistId, setSpecialistId] = useState<string>('')
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showColleagueModal, setShowColleagueModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [activeTab, setActiveTab] = useState<'clients' | 'earnings'>('clients')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setSpecialistId(user.id)

      // Check if specialist
      const { data: spec } = await supabase
        .from('specialists')
        .select('name, specialty, referral_code, photo_url')
        .eq('id', user.id)
        .single()

      if (!spec) { router.push('/specialist/register'); return }
      setSpecialist(spec)

      // Load client ids
      const { data: clientLinks } = await supabase
        .from('specialist_clients')
        .select('client_id')
        .eq('specialist_id', user.id)

      if (!clientLinks?.length) { setLoading(false); return }

      const clientIds = clientLinks.map((c) => c.client_id)

      // Load profiles and checkins in parallel
      const [profilesRes, checkinsRes] = await Promise.all([
        supabase.from('profiles').select('id, name, email').in('id', clientIds),
        supabase
          .from('checkins')
          .select('id, user_id, wellbeing, mood, created_at')
          .in('user_id', clientIds)
          .order('created_at', { ascending: false }),
      ])

      const profiles = profilesRes.data ?? []
      const allCheckins = checkinsRes.data ?? []

      const clientsData: Client[] = clientIds.map((clientId) => {
        const profile = profiles.find((p) => p.id === clientId)
        const clientCheckins = allCheckins.filter((c) => c.user_id === clientId)
        const lastCheckin = clientCheckins[0] ?? null
        const avg = clientCheckins.length
          ? clientCheckins.reduce((a, c) => a + (c.wellbeing ?? 5), 0) / clientCheckins.length
          : null
        const recentScores = clientCheckins
          .slice(0, 7)
          .reverse()
          .map((c) => c.wellbeing ?? 5)

        return {
          client_id: clientId,
          name: profile?.name ?? null,
          email: profile?.email ?? null,
          lastCheckin,
          checkinCount: clientCheckins.length,
          avgWellbeing: avg ? parseFloat(avg.toFixed(1)) : null,
          recentScores,
        }
      })

      // Sort: clients with most recent checkin first
      clientsData.sort((a, b) => {
        const aDate = a.lastCheckin?.created_at ?? ''
        const bDate = b.lastCheckin?.created_at ?? ''
        return bDate.localeCompare(aDate)
      })

      setClients(clientsData)
      setLoading(false)
    }
    load()
  }, [router])

  function copyLink() {
    if (!specialist) return
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? origin
    navigator.clipboard.writeText(`${siteUrl}/join/${specialist.referral_code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Загрузка…</p>
      </div>
    )
  }

  const referralUrl = specialist
    ? `${process.env.NEXT_PUBLIC_SITE_URL ?? (typeof window !== 'undefined' ? window.location.origin : '')}/join/${specialist.referral_code}`
    : ''

  const totalCheckins = clients.reduce((a, c) => a + c.checkinCount, 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <ReferralBanner specialistId={specialistId} referralCode={specialist?.referral_code ?? ''} />
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-0.5">Metanoia AI</p>
            <h1 className="text-2xl font-bold text-slate-800">Дашборд специалиста</h1>
            {specialist && (
              <p className="text-slate-500 text-sm mt-0.5">
                {specialist.name} · {specialist.specialty}
              </p>
            )}
          </div>

          {/* Burger menu */}
          <div className="relative shrink-0 ml-3">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 text-slate-500 hover:text-indigo-600 transition"
              aria-label="Меню"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-slate-100 rounded-2xl shadow-lg py-1 min-w-[210px]">
                  <button
                    onClick={() => { setShowMenu(false); router.push('/dashboard') }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition text-left"
                  >
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Мой дашборд
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); router.push('/specialist/register') }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition text-left"
                  >
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                    </svg>
                    Редактировать профиль
                  </button>
                  <div className="my-1 border-t border-slate-50" />
                  <a
                    href="/login"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                  >
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Посмотреть лендинг
                  </a>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === 'clients'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Клиенты
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === 'earnings'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Доходы 💰
          </button>
        </div>

        {/* Earnings tab */}
        {activeTab === 'earnings' && (
          <EarningsTab specialistId={specialistId} />
        )}

        {/* Clients tab */}
        {activeTab === 'clients' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{clients.length}</div>
                <div className="text-xs text-slate-400 mt-0.5">Клиентов</div>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{totalCheckins}</div>
                <div className="text-xs text-slate-400 mt-0.5">Всего опросов</div>
              </div>
            </div>

            {/* Referral link */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5">
              <div className="flex items-center gap-2 mb-1">
                <span>🔗</span>
                <p className="font-semibold text-slate-800 text-sm">Реферальная ссылка</p>
              </div>
              <p className="text-slate-400 text-xs mb-3">
                Отправьте клиенту — он увидит ваш профиль и сразу подключится
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={referralUrl}
                  className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-500 truncate"
                />
                <button
                  onClick={copyLink}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shrink-0"
                >
                  {copied ? '✓ Скопировано' : 'Копировать'}
                </button>
              </div>
            </div>

            {/* Colleague referral banner */}
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-800 text-sm">Пригласи коллегу — заработай 30% комиссии</p>
                <p className="text-slate-500 text-xs mt-0.5">Реферальная программа для специалистов</p>
              </div>
              <button
                onClick={() => setShowColleagueModal(true)}
                className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition"
              >
                Узнать подробнее
              </button>
            </div>

            {/* Colleague modal */}
            {showColleagueModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <h2 className="font-bold text-slate-800 text-lg">Реферальная программа</h2>
                    <button onClick={() => setShowColleagueModal(false)} className="p-1 text-slate-400 hover:text-slate-600 transition">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex flex-col gap-3 text-sm text-slate-600">
                    <div className="flex items-start gap-3 bg-indigo-50 rounded-xl p-3">
                      <span className="text-xl">🔗</span>
                      <div>
                        <p className="font-semibold text-slate-800">Поделись личной ссылкой</p>
                        <p className="text-xs text-slate-500 mt-0.5">Отправь коллеге ссылку на регистрацию специалиста</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-indigo-50 rounded-xl p-3">
                      <span className="text-xl">💰</span>
                      <div>
                        <p className="font-semibold text-slate-800">Получай 30% комиссии</p>
                        <p className="text-xs text-slate-500 mt-0.5">С каждой оплаченной подписки приглашённого коллеги — первые 12 месяцев</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-3">
                      <span className="text-xl">💳</span>
                      <div>
                        <p className="font-semibold text-slate-800">Вывод от $30</p>
                        <p className="text-xs text-slate-500 mt-0.5">Или зачти в счёт своей подписки Pro</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 text-center">Функция в разработке — напишем когда запустим</p>
                  <button
                    onClick={() => setShowColleagueModal(false)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition"
                  >
                    Понятно
                  </button>
                </div>
              </div>
            )}

            {/* Client list */}
            {clients.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center">
                <p className="text-3xl mb-3">👥</p>
                <p className="font-semibold text-slate-700 mb-1">Пока нет клиентов</p>
                <p className="text-slate-400 text-sm">
                  Отправьте реферальную ссылку — клиенты появятся здесь автоматически
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-600">Клиенты</h2>
                </div>

                <div className="divide-y divide-slate-50">
                  {clients.map((client) => {
                    const displayName = client.name ?? client.email ?? 'Клиент'
                    const initials = displayName
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)

                    const wellbeingColor =
                      client.lastCheckin?.wellbeing !== null && client.lastCheckin?.wellbeing !== undefined
                        ? client.lastCheckin.wellbeing >= 7
                          ? 'text-indigo-500'
                          : client.lastCheckin.wellbeing >= 4
                          ? 'text-amber-500'
                          : 'text-red-400'
                        : 'text-slate-400'

                    return (
                      <div key={client.client_id} className="px-5 py-4 flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                          {initials}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{displayName}</p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            {client.checkinCount}{' '}
                            {client.checkinCount === 1 ? 'опрос' : client.checkinCount < 5 ? 'опроса' : 'опросов'}
                            {client.lastCheckin && (
                              <>
                                {' · '}
                                {new Date(client.lastCheckin.created_at).toLocaleDateString('ru-RU', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </>
                            )}
                          </p>
                        </div>

                        {/* Sparkline */}
                        {client.recentScores.length >= 2 && (
                          <div className="shrink-0">
                            <Sparkline scores={client.recentScores} />
                          </div>
                        )}

                        {/* Last score */}
                        {client.lastCheckin?.wellbeing !== null &&
                          client.lastCheckin?.wellbeing !== undefined && (
                            <div className="text-center shrink-0">
                              <div className={`text-sm font-bold ${wellbeingColor}`}>
                                {client.lastCheckin.wellbeing}/10
                              </div>
                              <div className="text-xs text-slate-400">сейчас</div>
                            </div>
                          )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
