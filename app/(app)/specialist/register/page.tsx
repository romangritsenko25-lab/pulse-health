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
  const [bio, setBio] = useState('')
  const [photoSource, setPhotoSource] = useState<'file' | 'url'>('file')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }

      setUserId(data.user.id)

      const { data: existing } = await supabase
        .from('specialists')
        .select('name, specialty, photo_url, bio')
        .eq('id', data.user.id)
        .single()

      if (existing) {
        setName(existing.name)
        setSpecialty(existing.specialty)
        setPhotoUrl(existing.photo_url ?? '')
        setBio(existing.bio ?? '')
        if (existing.photo_url) setPhotoSource('url')
      }
      setCheckingAuth(false)
    })
  }, [router])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploading(true)
    setError('')
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('specialist-photos')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage
        .from('specialist-photos')
        .getPublicUrl(path)
      setPhotoUrl(publicUrl)
    } catch (err) {
      setError('Ошибка загрузки фото. Попробуйте снова.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !specialty) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/specialist/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          specialty,
          photo_url: photoUrl.trim() || null,
          bio: bio.trim() || null,
        }),
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
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-900 px-4 py-10">
        <div className="max-w-lg mx-auto text-white">
          <p className="text-xs font-bold uppercase tracking-widest mb-1 text-indigo-200">Metanoia AI</p>
          <h1 className="text-2xl font-bold">Портал специалиста</h1>
          <p className="text-indigo-100 text-sm mt-1 opacity-90">
            Зарегистрируйтесь чтобы получить реферальные ссылки для клиентов
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
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

            {/* Photo */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Фото <span className="font-normal text-slate-400">(необязательно)</span>
              </label>
              {/* Toggle */}
              <div className="flex gap-1 mb-3 bg-slate-100 rounded-xl p-1 w-fit">
                <button
                  type="button"
                  onClick={() => setPhotoSource('file')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    photoSource === 'file'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  С устройства
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoSource('url')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    photoSource === 'url'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  По ссылке
                </button>
              </div>

              {photoSource === 'file' ? (
                <div>
                  <label className="flex flex-col items-center justify-center w-full h-28 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 transition">
                    {uploading ? (
                      <span className="text-sm text-slate-400 animate-pulse">Загрузка…</span>
                    ) : photoUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={photoUrl} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200" />
                        <span className="text-xs text-indigo-600 font-medium">Фото загружено · нажмите чтобы заменить</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <span className="text-xs">Нажмите чтобы выбрать фото</span>
                        <span className="text-xs text-slate-300">JPG, PNG до 5 МБ</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
              ) : (
                <div>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <p className="text-slate-400 text-xs mt-1">Прямая ссылка на изображение</p>
                </div>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                О себе <span className="font-normal text-slate-400">(необязательно)</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Расскажите о вашем подходе и специализации. Например: работаю с тревожными расстройствами и депрессией, использую КПТ и ACT..."
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
              <p className="text-slate-400 text-xs mt-1">Клиенты увидят это описание на вашей странице профиля</p>
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
                  {bio && <p className="text-slate-500 text-xs mt-1 line-clamp-2">{bio}</p>}
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || !specialty || uploading}
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
