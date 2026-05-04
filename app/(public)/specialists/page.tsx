'use client'

import { useState, useMemo } from 'react'
import type { Metadata } from 'next'

const SPECIALISTS = [
  {
    id: '1',
    name: 'Айгерим Бекова',
    specialty: 'КПТ-терапевт',
    city: 'Алматы',
    bio: 'Работаю с тревожными расстройствами, депрессией и выгоранием. 8 лет практики в когнитивно-поведенческом направлении. Провела более 2000 сессий.',
    rating: 4.9,
    reviewCount: 47,
    photo: null,
    referralCode: 'bekova-ak',
    weeklyClients: 12,
  },
  {
    id: '2',
    name: 'Дмитрий Волков',
    specialty: 'Психоаналитический терапевт',
    city: 'Москва',
    bio: 'Специализируюсь на работе с отношениями, сепарационной тревогой и психосоматикой. 12 лет практики, длительная терапия.',
    rating: 4.8,
    reviewCount: 63,
    photo: null,
    referralCode: 'volkov-dm',
    weeklyClients: 9,
  },
  {
    id: '3',
    name: 'Наталья Иванова',
    specialty: 'Семейный психолог',
    city: 'Санкт-Петербург',
    bio: 'Работаю с парами и семьями, детско-родительскими отношениями. Метод — системная семейная терапия и нарративный подход.',
    rating: 4.9,
    reviewCount: 38,
    photo: null,
    referralCode: 'ivanova-ns',
    weeklyClients: 15,
  },
  {
    id: '4',
    name: 'Азамат Джумабеков',
    specialty: 'Клинический психолог',
    city: 'Астана',
    bio: 'Специализируюсь на ПТСР, травме и диссоциативных расстройствах. Метод — EMDR и соматическое переживание. 6 лет практики.',
    rating: 4.7,
    reviewCount: 29,
    photo: null,
    referralCode: 'dzhumabekov-az',
    weeklyClients: 7,
  },
  {
    id: '5',
    name: 'Ольга Мельник',
    specialty: 'Гештальт-терапевт',
    city: 'Киев',
    bio: 'Работаю с экзистенциальными вопросами, потерями и жизненными переходами. 10 лет практики, гештальт и психодрама.',
    rating: 4.8,
    reviewCount: 55,
    photo: null,
    referralCode: 'melnik-ol',
    weeklyClients: 11,
  },
  {
    id: '6',
    name: 'Светлана Ковалёва',
    specialty: 'КПТ-терапевт',
    city: 'Минск',
    bio: 'Тревожность, панические атаки, ОКР и депрессия. 7 лет практики, сертифицированный CBT-специалист. Работаю онлайн и очно.',
    rating: 4.8,
    reviewCount: 41,
    photo: null,
    referralCode: 'kovaleva-sv',
    weeklyClients: 10,
  },
  {
    id: '7',
    name: 'Асель Нурланова',
    specialty: 'Психолог',
    city: 'Алматы',
    bio: 'Работаю с самооценкой, отношениями и профессиональным выгоранием. Интегративный подход, ACT и схема-терапия.',
    rating: 4.7,
    reviewCount: 22,
    photo: null,
    referralCode: 'nurlanova-as',
    weeklyClients: 6,
  },
  {
    id: '8',
    name: 'Михаил Соколов',
    specialty: 'Психотерапевт',
    city: 'Москва',
    bio: 'Специализируюсь на мужской психологии, идентичности и кризисах смысла. 9 лет практики, юнгианский анализ.',
    rating: 4.6,
    reviewCount: 34,
    photo: null,
    referralCode: 'sokolov-mi',
    weeklyClients: 8,
  },
  {
    id: '9',
    name: 'Диана Хачатурян',
    specialty: 'Детский и подростковый психолог',
    city: 'Тбилиси',
    bio: 'Работаю с детьми и подростками 5–18 лет. Трудности в школе, тревога, самоповреждение, кризисы идентичности.',
    rating: 4.9,
    reviewCount: 17,
    photo: null,
    referralCode: 'khachaturyan-di',
    weeklyClients: 5,
  },
  {
    id: '10',
    name: 'Алибек Исмаилов',
    specialty: 'Психоаналитический терапевт',
    city: 'Ташкент',
    bio: 'Долгосрочная аналитическая терапия, работа с личностными паттернами и ранними отношениями. 5 лет практики.',
    rating: 4.7,
    reviewCount: 14,
    photo: null,
    referralCode: 'ismailov-al',
    weeklyClients: 4,
  },
]

const SPECIALTIES = [...new Set(SPECIALISTS.map((s) => s.specialty))].sort()
const CITIES = [...new Set(SPECIALISTS.map((s) => s.city))].sort()

const TOP5 = [...SPECIALISTS].sort((a, b) => b.weeklyClients - a.weeklyClients).slice(0, 5)

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

function Avatar({ name, photo }: { name: string; photo: string | null }) {
  if (photo) {
    return <img src={photo} alt={name} className="w-14 h-14 rounded-2xl object-cover" />
  }
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
  return (
    <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
      <span className="text-indigo-600 font-bold text-lg">{initials}</span>
    </div>
  )
}

function SpecialistCard({ sp, rank }: { sp: (typeof SPECIALISTS)[0]; rank?: number }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-4 hover:border-indigo-200 hover:shadow-sm transition">
      <div className="flex items-start gap-4">
        <Avatar name={sp.name} photo={sp.photo} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-800 text-sm">{sp.name}</p>
            {rank === 1 && (
              <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                Топ Metanoia
              </span>
            )}
          </div>
          <p className="text-indigo-600 text-xs font-medium mt-0.5">{sp.specialty}</p>
          <p className="text-slate-400 text-xs mt-0.5">{sp.city}</p>
        </div>
      </div>
      <p className="text-slate-500 text-sm leading-relaxed">{sp.bio}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Stars rating={sp.rating} />
          <span className="text-slate-600 text-xs font-semibold">{sp.rating}</span>
          <span className="text-slate-400 text-xs">({sp.reviewCount})</span>
        </div>
        <a
          href={`/join/${sp.referralCode}`}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition"
        >
          Записаться
        </a>
      </div>
    </div>
  )
}

export default function SpecialistsPage() {
  const [specialty, setSpecialty] = useState<string>('all')
  const [city, setCity] = useState<string>('all')
  const [minRating, setMinRating] = useState<string>('all')

  const filtered = useMemo(() => {
    return SPECIALISTS.filter((s) => {
      if (specialty !== 'all' && s.specialty !== specialty) return false
      if (city !== 'all' && s.city !== city) return false
      if (minRating !== 'all' && s.rating < Number(minRating)) return false
      return true
    })
  }, [specialty, city, minRating])

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="py-14 px-4 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Специалисты</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Найдите своего психолога
          </h1>
          <p className="text-slate-500 text-base max-w-xl mx-auto">
            Специалисты платформы Metanoia — проверенные профессионалы, которые помогут вам начать работу.
          </p>
        </div>
      </section>

      {/* Top-5 */}
      <section className="py-10 px-4 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">Рейтинг недели</p>
          <h2 className="text-xl font-bold text-slate-800 mb-6">Топ-5 специалистов</h2>
          <div className="flex flex-col gap-3">
            {TOP5.map((sp, i) => (
              <div
                key={sp.id}
                className={`flex items-center gap-4 bg-white rounded-2xl border px-5 py-4 ${
                  i === 0 ? 'border-amber-200 shadow-sm' : 'border-slate-100'
                }`}
              >
                <span
                  className={`text-lg font-black w-6 text-center ${
                    i === 0 ? 'text-amber-500' : 'text-slate-300'
                  }`}
                >
                  {i + 1}
                </span>
                <Avatar name={sp.name} photo={sp.photo} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 text-sm">{sp.name}</p>
                    {i === 0 && (
                      <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                        Топ Metanoia
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs">{sp.specialty} · {sp.city}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-800">{sp.weeklyClients}</p>
                  <p className="text-xs text-slate-400">клиентов</p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <div className="flex items-center gap-1">
                    <Stars rating={sp.rating} />
                    <span className="text-xs font-semibold text-slate-600">{sp.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h2 className="text-xl font-bold text-slate-800">Все специалисты</h2>
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 bg-white focus:outline-none focus:border-indigo-400"
              >
                <option value="all">Все специальности</option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 bg-white focus:outline-none focus:border-indigo-400"
              >
                <option value="all">Все города</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 bg-white focus:outline-none focus:border-indigo-400"
              >
                <option value="all">Любой рейтинг</option>
                <option value="4.9">4.9+</option>
                <option value="4.8">4.8+</option>
                <option value="4.7">4.7+</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-medium">Специалисты не найдены</p>
              <p className="text-sm mt-1">Попробуйте изменить фильтры</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((sp) => {
                const rank = TOP5.findIndex((t) => t.id === sp.id) + 1
                return <SpecialistCard key={sp.id} sp={sp} rank={rank || undefined} />
              })}
            </div>
          )}
        </div>
      </section>

      {/* Join as specialist */}
      <section className="py-16 px-4 bg-indigo-600">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-3">Для специалистов</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Вы психолог? Присоединяйтесь к платформе
          </h2>
          <p className="text-indigo-100 text-sm leading-relaxed mb-8 max-w-lg mx-auto">
            Получайте клиентов через реферальную ссылку, зарабатывайте до 30% от подписок. Вывод от $30 или зачёт в подписку.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            {[
              { icon: '🔗', text: 'Личная реферальная ссылка' },
              { icon: '💰', text: 'До 30% от подписок клиентов' },
              { icon: '💳', text: 'Вывод от $30 или в подписку' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-white text-sm">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
          <a
            href="/specialist/register"
            className="inline-flex items-center px-6 py-3.5 bg-white hover:bg-indigo-50 text-indigo-600 font-bold rounded-2xl transition text-sm shadow-lg shadow-indigo-800/20"
          >
            Зарегистрироваться как специалист →
          </a>
        </div>
      </section>
    </div>
  )
}
