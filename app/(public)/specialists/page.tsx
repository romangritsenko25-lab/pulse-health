'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SpecialistData {
  id: string
  name: string
  specialty: string
  photo_url: string | null
  bio: string | null
  referral_code: string
  client_count: number
  avg_rating: number | null
  review_count: number
  city: string | null
  is_demo?: boolean
}

type RankInfo = {
  label: string
  icon: string
  bg: string
  text: string
  border: string
  next: number | null
  current: number
}

function getRank(n: number): RankInfo {
  if (n >= 30) return { label: 'Мастер',    icon: '🏆', bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   next: null, current: 30 }
  if (n >= 15) return { label: 'Наставник', icon: '💎', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', next: 30,   current: 15 }
  if (n >= 5)  return { label: 'Эксперт',   icon: '🏅', bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   next: 15,   current: 5  }
  if (n >= 1)  return { label: 'Практик',   icon: '⭐', bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  next: 5,    current: 1  }
  return         { label: 'Новичок',   icon: '🌱', bg: 'bg-slate-50',  text: 'text-slate-500',  border: 'border-slate-100',  next: 1,    current: 0  }
}

function pluralClients(n: number) {
  if (n === 0) return 'Нет клиентов пока'
  if (n === 1) return '1 клиент'
  if (n < 5)   return `${n} клиента`
  return `${n} клиентов`
}

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  if (photoUrl) return <img src={photoUrl} alt={name} className="w-14 h-14 rounded-2xl object-cover shrink-0" />
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('')
  return (
    <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
      <span className="text-blue-600 font-bold text-lg">{initials}</span>
    </div>
  )
}

function RankBadge({ n }: { n: number }) {
  const r = getRank(n)
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${r.bg} ${r.text} ${r.border}`}>
      {r.icon} {r.label}
    </span>
  )
}

function RankProgress({ n }: { n: number }) {
  const r = getRank(n)
  if (r.next === null) return <p className="text-xs text-blue-600 font-medium">Максимальный ранг 🏆</p>
  const pct = Math.min(100, ((n - r.current) / (r.next - r.current)) * 100)
  return (
    <div>
      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-1 bg-blue-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-400 mt-1">{n} / {r.next} клиентов до следующего ранга</p>
    </div>
  )
}

function StarRating({ rating, count }: { rating: number | null; count: number }) {
  if (!rating || count === 0) return null
  const full = Math.round(rating)
  return (
    <div className="flex items-center gap-1">
      <span className="text-amber-400 text-xs">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>
      <span className="text-xs text-slate-500">{rating.toFixed(1)} · {count} {count === 1 ? 'отзыв' : count < 5 ? 'отзыва' : 'отзывов'}</span>
    </div>
  )
}

function SpecialistCard({ sp, isTop, onClick }: { sp: SpecialistData; isTop?: boolean; onClick: () => void }) {
  return (
    <div
      className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-4 hover:border-blue-200 hover:shadow-sm transition cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <Avatar name={sp.name} photoUrl={sp.photo_url} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-800 text-sm">{sp.name}</p>
            {isTop && (
              <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                Топ Metanoia
              </span>
            )}
          </div>
          <p className="text-blue-600 text-xs font-medium mt-0.5">{sp.specialty}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <RankBadge n={sp.client_count} />
            {sp.city && (
              <span className="text-xs text-slate-400">📍 {sp.city}</span>
            )}
          </div>
          <div className="mt-1">
            <StarRating rating={sp.avg_rating} count={sp.review_count} />
          </div>
        </div>
      </div>
      {sp.bio && <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">{sp.bio}</p>}
      <RankProgress n={sp.client_count} />
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{pluralClients(sp.client_count)}</span>
        <a
          href={sp.is_demo ? '/login' : `/join/${sp.referral_code}`}
          onClick={(e) => e.stopPropagation()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition"
        >
          Записаться
        </a>
      </div>
    </div>
  )
}

interface ReviewRow {
  id: string
  rating: number
  text: string | null
  created_at: string
}

function SpecialistModal({ sp, onClose }: { sp: SpecialistData | null; onClose: () => void }) {
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  useEffect(() => {
    if (!sp || sp.is_demo) { setReviews([]); return }
    setReviewsLoading(true)
    const supabase = createClient()
    supabase
      .from('specialist_reviews')
      .select('id, rating, text, created_at')
      .eq('specialist_id', sp.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews(data ?? [])
        setReviewsLoading(false)
      })
  }, [sp?.id])

  useEffect(() => {
    if (!sp) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [sp, onClose])

  if (!sp) return null

  const rank = getRank(sp.client_count)
  const joinHref = sp.is_demo ? '/login' : `/join/${sp.referral_code}`

  function StarsFull({ n }: { n: number }) {
    return (
      <span>
        {[1,2,3,4,5].map((i) => (
          <span key={i} className={i <= n ? 'text-amber-400' : 'text-slate-200'}>★</span>
        ))}
      </span>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="px-6 pt-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            {sp.photo_url ? (
              <img src={sp.photo_url} alt={sp.name} className="w-20 h-20 rounded-2xl object-cover shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-blue-600 font-bold text-2xl">
                  {sp.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-base leading-snug">{sp.name}</p>
              <p className="text-blue-600 text-sm font-medium mt-0.5">{sp.specialty}</p>
              {sp.city && <p className="text-slate-400 text-xs mt-1">📍 {sp.city}</p>}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${rank.bg} ${rank.text} ${rank.border}`}>
                  {rank.icon} {rank.label}
                </span>
                {sp.avg_rating && sp.review_count > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-amber-400 text-xs">{'★'.repeat(Math.round(sp.avg_rating))}{'☆'.repeat(5 - Math.round(sp.avg_rating))}</span>
                    <span className="text-xs text-slate-500">{sp.avg_rating.toFixed(1)} · {sp.review_count} {sp.review_count === 1 ? 'отзыв' : sp.review_count < 5 ? 'отзыва' : 'отзывов'}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 text-slate-400 shrink-0 mt-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          {/* Bio */}
          {sp.bio && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">О специалисте</p>
              <p className="text-slate-600 text-sm leading-relaxed">{sp.bio}</p>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-2xl p-3 text-center">
              <p className="text-xl font-bold text-slate-800">{sp.client_count}</p>
              <p className="text-xs text-slate-400 mt-0.5">клиентов</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3 text-center">
              <p className="text-xl font-bold text-slate-800">{sp.avg_rating ? sp.avg_rating.toFixed(1) : '—'}</p>
              <p className="text-xs text-slate-400 mt-0.5">рейтинг</p>
            </div>
          </div>

          {/* Reviews */}
          {!sp.is_demo && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                Отзывы {sp.review_count > 0 ? `· ${sp.review_count}` : ''}
              </p>
              {reviewsLoading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-slate-50 rounded-2xl p-4 animate-pulse flex flex-col gap-2">
                      <div className="h-3 bg-slate-200 rounded w-24" />
                      <div className="h-3 bg-slate-200 rounded w-full" />
                      <div className="h-3 bg-slate-200 rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-6 text-center">
                  <p className="text-slate-400 text-sm">Отзывов пока нет</p>
                  <p className="text-slate-300 text-xs mt-1">Будьте первым, кто оценит специалиста</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {reviews.map((r) => (
                    <div key={r.id} className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <StarsFull n={r.rating} />
                        <span className="text-xs text-slate-400">
                          {new Date(r.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      {r.text && <p className="text-slate-600 text-sm leading-relaxed">{r.text}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100">
          <a
            href={joinHref}
            className="flex items-center justify-center w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition text-sm"
          >
            Записаться к специалисту →
          </a>
        </div>
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100 px-5 py-4 animate-pulse">
      <div className="w-6 h-6 bg-slate-100 rounded shrink-0" />
      <div className="w-14 h-14 rounded-2xl bg-slate-100 shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 bg-slate-100 rounded w-36" />
        <div className="h-3 bg-slate-100 rounded w-24" />
      </div>
      <div className="h-8 bg-slate-100 rounded w-14 shrink-0" />
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-4 bg-slate-100 rounded w-32" />
          <div className="h-3 bg-slate-100 rounded w-24" />
          <div className="h-5 bg-slate-100 rounded-full w-20" />
        </div>
      </div>
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-3/4" />
      <div className="h-1 bg-slate-100 rounded" />
      <div className="flex justify-between">
        <div className="h-3 bg-slate-100 rounded w-20" />
        <div className="h-8 bg-slate-100 rounded-xl w-24" />
      </div>
    </div>
  )
}

export default function SpecialistsPage() {
  const [specialists, setSpecialists] = useState<SpecialistData[]>([])
  const [loading, setLoading] = useState(true)
  const [specialty, setSpecialty] = useState('all')
  const [city, setCity] = useState('all')
  const [sortBy, setSortBy] = useState<'clients' | 'rating'>('clients')
  const [selected, setSelected] = useState<SpecialistData | null>(null)

  useEffect(() => {
    fetch('/api/specialists')
      .then((r) => r.json())
      .then((data) => { setSpecialists(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const specialties = useMemo(() => [...new Set(specialists.map((s) => s.specialty))].sort(), [specialists])
  const cities = useMemo(
    () => [...new Set(specialists.map((s) => s.city).filter(Boolean) as string[])].sort(),
    [specialists]
  )

  const filtered = useMemo(() => {
    let list = specialists
    if (specialty !== 'all') list = list.filter((s) => s.specialty === specialty)
    if (city !== 'all') list = list.filter((s) => s.city === city)
    if (sortBy === 'rating') {
      list = [...list].sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0))
    }
    return list
  }, [specialists, specialty, city, sortBy])

  const top5 = specialists.slice(0, 5)
  const top5Ids = new Set(top5.map((s) => s.id))

  return (
    <div className="bg-white min-h-screen">
      <SpecialistModal sp={selected} onClose={() => setSelected(null)} />

      {/* Hero */}
      <section className="py-14 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Специалисты</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Найдите своего психолога
          </h1>
          <p className="text-slate-500 text-base max-w-xl mx-auto">
            Специалисты платформы Metanoia — проверенные профессионалы, которые помогут вам начать работу.
          </p>
        </div>
      </section>

      {/* Top-5 */}
      {(loading || top5.length > 0) && (
        <section className="py-10 px-4 bg-slate-50 border-y border-slate-100">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Рейтинг платформы</p>
            <h2 className="text-xl font-bold text-slate-800 mb-6">Топ-5 специалистов</h2>
            <div className="flex flex-col gap-3">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
                : top5.map((sp, i) => (
                    <div
                      key={sp.id}
                      className={`flex items-center gap-4 bg-white rounded-2xl border px-5 py-4 ${i === 0 ? 'border-amber-200 shadow-sm' : 'border-slate-100'}`}
                    >
                      <span className={`text-lg font-black w-6 text-center shrink-0 ${i === 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                        {i + 1}
                      </span>
                      <Avatar name={sp.name} photoUrl={sp.photo_url} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-800 text-sm">{sp.name}</p>
                          {i === 0 && (
                            <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                              Топ Metanoia
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">{sp.specialty}</p>
                        <div className="mt-1"><RankBadge n={sp.client_count} /></div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-800">{sp.client_count}</p>
                        <p className="text-xs text-slate-400">клиентов</p>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* Catalog */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                Все специалисты
                {!loading && specialists.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-slate-400">{filtered.length}</span>
                )}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {specialties.length > 0 && (
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 bg-white focus:outline-none focus:border-blue-400"
                >
                  <option value="all">Все специальности</option>
                  {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              {cities.length > 0 && (
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 bg-white focus:outline-none focus:border-blue-400"
                >
                  <option value="all">Все города</option>
                  {cities.map((c) => <option key={c} value={c}>📍 {c}</option>)}
                </select>
              )}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'clients' | 'rating')}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 bg-white focus:outline-none focus:border-blue-400"
              >
                <option value="clients">По клиентам</option>
                <option value="rating">По рейтингу</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : specialists.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-4xl mb-3">👥</p>
              <p className="font-medium text-slate-600">Специалисты скоро появятся</p>
              <p className="text-sm mt-1">Будьте первым — зарегистрируйтесь как специалист</p>
              <a href="/specialist/register" className="inline-block mt-5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition">
                Присоединиться →
              </a>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-medium">Специалисты не найдены</p>
              <p className="text-sm mt-1">Попробуйте изменить фильтр</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((sp) => (
                <SpecialistCard key={sp.id} sp={sp} isTop={top5Ids.has(sp.id)} onClick={() => setSelected(sp)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Join as specialist */}
      <section className="py-16 px-4" style={{ background: '#f8fafc' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p style={{ color: '#2563eb' }} className="text-xs font-bold uppercase tracking-widest mb-3">Для специалистов</p>
            <h2 style={{ color: '#1e3a5f' }} className="text-2xl sm:text-3xl font-bold mb-3">
              Вы психолог или терапевт?
            </h2>
            <p style={{ color: '#64748b' }} className="text-sm leading-relaxed max-w-md mx-auto">
              Место где вас найдут те, кто уже готов работать
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { icon: '✅', title: 'Подготовленные клиенты', body: 'Клиент приходит с готовым PDF-анализом своего состояния. Первая сессия сразу по делу — без 30 минут сбора анамнеза.' },
              { icon: '📈', title: 'Динамика между сессиями', body: 'Видите как меняется состояние клиента между встречами. Журнал, чек-ины, паттерны — всё в одном дашборде.' },
              { icon: '🏆', title: 'Система рангов', body: 'Зарабатывайте ранги по мере роста клиентской базы: от Новичка до Мастера. Рейтинг обновляется в реальном времени.' },
            ].map((c) => (
              <div key={c.title} style={{ background: '#ffffff', borderColor: '#e2e8f0' }} className="border rounded-2xl p-5 flex flex-col gap-3">
                <div style={{ background: '#eff6ff', borderRadius: '10px', padding: '8px', display: 'inline-flex', width: 'fit-content' }}>
                  <span className="text-2xl">{c.icon}</span>
                </div>
                <p style={{ color: '#1e3a5f' }} className="font-semibold text-sm">{c.title}</p>
                <p style={{ color: '#64748b' }} className="text-sm leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>

          {/* Rank legend */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 mb-8">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Система рангов Metanoia</p>
            <div className="flex flex-col gap-2">
              {[
                { n: 0,  label: 'Новичок',   next: '1 клиент' },
                { n: 1,  label: 'Практик',   next: '5 клиентов' },
                { n: 5,  label: 'Эксперт',   next: '15 клиентов' },
                { n: 15, label: 'Наставник', next: '30 клиентов' },
                { n: 30, label: 'Мастер',    next: null },
              ].map((row) => {
                const r = getRank(row.n)
                return (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${r.bg} ${r.text} ${r.border} w-28 justify-center`}>
                      {r.icon} {r.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      {row.n === 0 ? 'при регистрации' : `от ${row.n} клиентов`}
                      {row.next && ` · следующий: ${row.next}`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="text-center">
            <a
              href="/specialist/register"
              style={{ background: '#2563eb' }}
              className="inline-flex items-center px-8 py-3.5 hover:opacity-90 text-white font-bold rounded-2xl transition text-sm shadow-lg"
            >
              Присоединиться как специалист →
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
