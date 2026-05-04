'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const SPECIALTIES = [
  'Психолог',
  'Психотерапевт',
  'Психиатр',
  'Клинический психолог',
  'Нейропсихолог',
  'Арт-терапевт',
  'Семейный психолог',
  'КПТ-терапевт',
  'Другое',
]

export default function SpecialistRegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }

      // Pre-fill if already registered
      const { data: existing } = await supabase
        .from('specialists')
        .select('name, specialty, photo_url')
        .eq('id', data.user.id)
        .single()

      if (existing) {
        setName(existing.name)
        setSpecialty(existing.specialty)
        setPhotoUrl(existing.photo_url ?? '')
      }
      setCheckingAuth(false)
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !specialty) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/specialist/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), specialty, photo_url: photoUrl.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'registration_failed')
      router.push('/specialist/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Загрузка…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Metanoia AI</p>
          <h1 className="text-2xl font-bold text-slate-800">Портал специалиста</h1>
          <p className="text-slate-400 text-sm mt-1">
            Зарегистрируйтесь чтобы получить реферальные ссылки для клиентов
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Имя и фамилия
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Анна Иванова"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Specialty */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Специальность
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Выберите специальность</option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Photo URL */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Фото <span className="font-normal text-slate-400">(необязательно)</span>
              </label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <p className="text-slate-400 text-xs mt-1">Ссылка на ваше фото</p>
            </div>

            {/* Preview */}
            {(name || specialty || photoUrl) && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-4">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-lg shrink-0">
                    {name ? name[0].toUpperCase() : '?'}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{name || 'Имя специалиста'}</p>
                  <p className="text-indigo-600 text-xs">{specialty || 'Специальность'}</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || !specialty}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl transition text-sm"
          >
            {loading ? 'Сохранение…' : 'Создать профиль специалиста'}
          </button>
        </form>

        <div className="mt-6 bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-amber-800 text-sm font-semibold mb-1">Как это работает</p>
          <ul className="text-amber-700 text-xs space-y-1.5 list-disc list-inside">
            <li>После регистрации вы получите уникальную реферальную ссылку</li>
            <li>Клиент переходит по ссылке и видит ваш профиль</li>
            <li>После входа через Google — клиент появляется в вашем дашборде</li>
            <li>Вы видите их опросы и динамику состояния</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
