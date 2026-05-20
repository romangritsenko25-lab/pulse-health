'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

const BG = 'radial-gradient(ellipse 80% 70% at 75% 42%, #3b82f6 0%, #1d4ed8 55%, #1e3a8a 100%)'

const REQUESTS = [
  { id: 'anxiety', label: 'Тревога' },
  { id: 'stress', label: 'Стресс' },
  { id: 'sleep', label: 'Сон' },
  { id: 'relationships', label: 'Отношения' },
  { id: 'self_esteem', label: 'Самооценка' },
  { id: 'burnout', label: 'Выгорание' },
  { id: 'depression', label: 'Депрессия' },
  { id: 'growth', label: 'Саморазвитие' },
]

const PSYCHOLOGIST_OPTIONS = [
  { id: 'yes', label: 'Да, сейчас работаю' },
  { id: 'previously', label: 'Раньше работал(а)' },
  { id: 'want', label: 'Нет, но хочу' },
  { id: 'no', label: 'Нет' },
]

const RELATIONSHIP_OPTIONS = [
  { id: 'single', label: 'Один / одна' },
  { id: 'relationship', label: 'В отношениях' },
  { id: 'married', label: 'Женат / замужем' },
  { id: 'divorced', label: 'Разведён(а)' },
]

const OCCUPATION_OPTIONS = [
  { id: 'employee', label: 'Наёмный сотрудник' },
  { id: 'entrepreneur', label: 'Предприниматель' },
  { id: 'student', label: 'Учусь' },
  { id: 'unemployed', label: 'Не работаю' },
  { id: 'other', label: 'Другое' },
]

interface ProfileData {
  name: string
  last_name: string
  email: string
  gender: string
  birth_date: string
  main_request: string[]
  address_style: string
  has_psychologist: string
  relationship_status: string
  has_children: boolean | null
  occupation: string
}

const EMPTY: ProfileData = {
  name: '', last_name: '', email: '', gender: '', birth_date: '',
  main_request: [], address_style: 'ты', has_psychologist: '',
  relationship_status: '', has_children: null, occupation: '',
}

function getAge(birthDate: string): string {
  if (!birthDate) return ''
  const years = Math.floor((Date.now() - new Date(birthDate).getTime()) / 31_557_600_000)
  return `${years} лет`
}

function genderLabel(g: string) {
  if (g === 'male') return 'Мужской'
  if (g === 'female') return 'Женский'
  if (g === 'other') return 'Другой'
  return ''
}

export default function ProfilePage() {
  const router = useRouter()
  const [form, setForm] = useState<ProfileData>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      supabase.from('profiles')
        .select('name, last_name, email, gender, birth_date, main_request, address_style, has_psychologist, relationship_status, has_children, occupation')
        .eq('id', data.user.id)
        .single()
        .then(({ data: p }) => {
          if (p) setForm({
            name: p.name ?? '',
            last_name: p.last_name ?? '',
            email: p.email ?? data.user.email ?? '',
            gender: p.gender ?? '',
            birth_date: p.birth_date ?? '',
            main_request: p.main_request ?? [],
            address_style: p.address_style ?? 'ты',
            has_psychologist: p.has_psychologist ?? '',
            relationship_status: p.relationship_status ?? '',
            has_children: p.has_children ?? null,
            occupation: p.occupation ?? '',
          })
          setLoading(false)
        })
    })
  }, [router])

  function toggleRequest(id: string) {
    setForm(f => ({
      ...f,
      main_request: f.main_request.includes(id)
        ? f.main_request.filter(r => r !== id)
        : [...f.main_request, id],
    }))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, profile_complete: true }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Загрузка…</p>
      </div>
    )
  }

  const displayName = form.name || 'Профиль'
  const subtitle = [genderLabel(form.gender), form.birth_date ? getAge(form.birth_date) : ''].filter(Boolean).join(' · ')

  return (
    <>
      <style>{`
        .pp-chip {
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          color: #475569;
          border-radius: 20px;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s, color 0.18s;
        }
        .pp-chip.selected { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
        .pp-chip:hover:not(.selected) { background: #f1f5f9; border-color: #cbd5e1; }
        .pp-radio {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 11px;
          border: 1.5px solid #e2e8f0; background: #f8fafc;
          color: #374151; font-size: 13.5px; font-weight: 500;
          cursor: pointer; transition: background 0.18s, border-color 0.18s;
          width: 100%;
        }
        .pp-radio.selected { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
        .pp-radio:hover:not(.selected) { background: #f1f5f9; }
        .pp-input {
          width: 100%; border: 1.5px solid #e2e8f0; border-radius: 11px;
          padding: 11px 14px; font-size: 14px; color: #1a2535;
          background: #f8fafc; outline: none; transition: border-color 0.18s;
          box-sizing: border-box;
        }
        .pp-input:focus { border-color: #93c5fd; background: white; }
        .pp-label { font-size: 12px; font-weight: 700; color: #64748b; letter-spacing: 0.3px; margin-bottom: 8px; display: block; }
        .pp-section { background: white; border-radius: 16px; padding: 20px; border: 1px solid #ede9e4; display: flex; flex-direction: column; gap: 16px; }
        .pp-section-title { font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
      `}</style>

      <div style={{ minHeight: '100dvh', background: '#faf9f7' }}>

        {/* Header с градиентом */}
        <div style={{ background: BG, padding: '0 0 40px' }}>
          <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, paddingBottom: 4 }}>
              <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <Image src="/Logo1.png" alt="" width={28} height={28} className="rounded-lg object-contain" />
            </div>

            <div style={{ marginTop: 28 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 26 }}>
                {form.name ? form.name[0].toUpperCase() : '?'}
              </div>
              <h1 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>
                {displayName} {form.last_name}
              </h1>
              {subtitle && <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, margin: 0 }}>{subtitle}</p>}
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '2px 0 0' }}>{form.email}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div style={{ maxWidth: 560, margin: '-24px auto 0', padding: '0 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Основные данные */}
          <div className="pp-section">
            <p className="pp-section-title">Основные данные</p>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <span className="pp-label">Имя</span>
                <input className="pp-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Имя" />
              </div>
              <div style={{ flex: 1 }}>
                <span className="pp-label">Фамилия</span>
                <input className="pp-input" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Фамилия" />
              </div>
            </div>

            <div>
              <span className="pp-label">Пол</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ id: 'female', label: 'Женский' }, { id: 'male', label: 'Мужской' }, { id: 'other', label: 'Другой' }].map(g => (
                  <button key={g.id} className={`pp-chip${form.gender === g.id ? ' selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, gender: g.id }))}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="pp-label">Дата рождения{form.birth_date ? ` · ${getAge(form.birth_date)}` : ''}</span>
              <input type="date" className="pp-input" value={form.birth_date}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} />
            </div>

            <div>
              <span className="pp-label">Обращение</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ id: 'ты', label: 'На ты' }, { id: 'вы', label: 'На вы' }].map(s => (
                  <button key={s.id} className={`pp-chip${form.address_style === s.id ? ' selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, address_style: s.id }))}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Запрос */}
          <div className="pp-section">
            <p className="pp-section-title">С чем работаю</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {REQUESTS.map(r => (
                <button key={r.id} className={`pp-chip${form.main_request.includes(r.id) ? ' selected' : ''}`}
                  onClick={() => toggleRequest(r.id)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Контекст */}
          <div className="pp-section">
            <p className="pp-section-title">Контекст жизни</p>

            <div>
              <span className="pp-label">Работаю с психологом</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PSYCHOLOGIST_OPTIONS.map(o => (
                  <button key={o.id} className={`pp-radio${form.has_psychologist === o.id ? ' selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, has_psychologist: o.id }))}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${form.has_psychologist === o.id ? '#2563eb' : '#cbd5e1'}`, background: form.has_psychologist === o.id ? '#2563eb' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {form.has_psychologist === o.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
                    </div>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <span className="pp-label">Семейное положение</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {RELATIONSHIP_OPTIONS.map(o => (
                    <button key={o.id} className={`pp-chip${form.relationship_status === o.id ? ' selected' : ''}`}
                      style={{ borderRadius: 10, padding: '8px 12px', textAlign: 'left' }}
                      onClick={() => setForm(f => ({ ...f, relationship_status: o.id }))}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="pp-label">Сфера деятельности</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {OCCUPATION_OPTIONS.map(o => (
                    <button key={o.id} className={`pp-chip${form.occupation === o.id ? ' selected' : ''}`}
                      style={{ borderRadius: 10, padding: '8px 12px', textAlign: 'left' }}
                      onClick={() => setForm(f => ({ ...f, occupation: o.id }))}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <span className="pp-label">Есть дети</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ v: true, label: 'Да' }, { v: false, label: 'Нет' }].map(o => (
                  <button key={String(o.v)} className={`pp-chip${form.has_children === o.v ? ' selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, has_children: o.v }))}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ width: '100%', background: saving ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 14, padding: '15px 0', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
          >
            {saving ? 'Сохраняем…' : saved ? '✓ Сохранено' : 'Сохранить изменения'}
          </button>

        </div>
      </div>
    </>
  )
}
