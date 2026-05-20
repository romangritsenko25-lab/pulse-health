'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

interface FormData {
  name: string
  last_name: string
  gender: string
  birth_date: string
  main_request: string[]
  address_style: string
  has_psychologist: string
  relationship_status: string
  has_children: boolean | null
  occupation: string
}

const INITIAL: FormData = {
  name: '',
  last_name: '',
  gender: '',
  birth_date: '',
  main_request: [],
  address_style: 'ты',
  has_psychologist: '',
  relationship_status: '',
  has_children: null,
  occupation: '',
}

export default function OnboardingProfilePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [saving, setSaving] = useState(false)

  function toggleRequest(id: string) {
    setForm(f => ({
      ...f,
      main_request: f.main_request.includes(id)
        ? f.main_request.filter(r => r !== id)
        : [...f.main_request, id],
    }))
  }

  function canNext() {
    if (step === 1) return form.name.trim().length > 0 && form.gender !== '' && form.birth_date !== ''
    if (step === 2) return form.main_request.length > 0
    return true
  }

  async function handleFinish() {
    setSaving(true)
    try {
      await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, profile_complete: true }),
      })
      router.replace('/cabinet')
    } catch {
      setSaving(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .op-card { animation: fade-up 0.5s ease forwards; }
        .op-chip {
          border: 1.5px solid rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.12);
          color: white;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s;
          backdrop-filter: blur(4px);
        }
        .op-chip.selected {
          background: white;
          color: #1d4ed8;
          border-color: white;
        }
        .op-chip:hover:not(.selected) { background: rgba(255,255,255,0.22); }
        .op-radio {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 16px;
          border-radius: 12px;
          border: 1.5px solid rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.1);
          color: white;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s;
        }
        .op-radio.selected { background: white; color: #1d4ed8; border-color: white; }
        .op-radio:hover:not(.selected) { background: rgba(255,255,255,0.18); }
        .op-input {
          width: 100%;
          background: rgba(255,255,255,0.15);
          border: 1.5px solid rgba(255,255,255,0.3);
          border-radius: 12px;
          padding: 12px 14px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color 0.18s;
          backdrop-filter: blur(4px);
        }
        .op-input::placeholder { color: rgba(255,255,255,0.5); }
        .op-input:focus { border-color: white; }
        .op-input option { color: #1a2535; background: white; }
        input[type="date"].op-input::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.7); }
        .op-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 420px) { .op-two-col { grid-template-columns: 1fr; } }
      `}</style>

      <div style={{ minHeight: '100dvh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', overflowX: 'hidden' }}>

        {/* Logo */}
        <div style={{ marginBottom: 24, opacity: 0.9 }}>
          <Image src="/Logo1.png" alt="" width={36} height={36} className="rounded-xl object-contain" />
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              width: s === step ? 28 : 8, height: 8, borderRadius: 4,
              background: s === step ? 'white' : 'rgba(255,255,255,0.35)',
              transition: 'width 0.3s, background 0.3s',
            }} />
          ))}
        </div>

        {/* Card */}
        <div className="op-card" key={step} style={{ width: '100%', maxWidth: 420 }}>

          {/* Step 1 — Основные данные */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>Шаг 1 из 3</p>
                <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: '0 0 6px', lineHeight: 1.2 }}>Расскажи о себе</h2>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13.5, margin: 0 }}>Это поможет ИИ обращаться к тебе правильно</p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <input className="op-input" placeholder="Имя *" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <input className="op-input" placeholder="Фамилия" value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
              </div>

              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Пол *</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[{ id: 'female', label: 'Женский' }, { id: 'male', label: 'Мужской' }, { id: 'other', label: 'Другой' }].map(g => (
                    <button key={g.id} className={`op-chip${form.gender === g.id ? ' selected' : ''}`}
                      onClick={() => setForm(f => ({ ...f, gender: g.id }))}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Дата рождения *</p>
                <input type="date" className="op-input" value={form.birth_date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} />
              </div>
            </div>
          )}

          {/* Step 2 — Запрос и обращение */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>Шаг 2 из 3</p>
                <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: '0 0 6px', lineHeight: 1.2 }}>С чем хочешь разобраться?</h2>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13.5, margin: 0 }}>Выбери одно или несколько</p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {REQUESTS.map(r => (
                  <button key={r.id} className={`op-chip${form.main_request.includes(r.id) ? ' selected' : ''}`}
                    onClick={() => toggleRequest(r.id)}>
                    {r.label}
                  </button>
                ))}
              </div>

              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Как к тебе обращаться?</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[{ id: 'ты', label: 'На ты' }, { id: 'вы', label: 'На вы' }].map(s => (
                    <button key={s.id} className={`op-chip${form.address_style === s.id ? ' selected' : ''}`}
                      onClick={() => setForm(f => ({ ...f, address_style: s.id }))}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Контекст */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>Шаг 3 из 3</p>
                <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: '0 0 6px', lineHeight: 1.2 }}>Немного о жизни</h2>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13.5, margin: 0 }}>Это необязательно, но помогает ИИ лучше понять тебя</p>
              </div>

              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Работаете с психологом?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PSYCHOLOGIST_OPTIONS.map(o => (
                    <button key={o.id} className={`op-radio${form.has_psychologist === o.id ? ' selected' : ''}`}
                      onClick={() => setForm(f => ({ ...f, has_psychologist: o.id }))}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${form.has_psychologist === o.id ? '#1d4ed8' : 'rgba(255,255,255,0.5)'}`, background: form.has_psychologist === o.id ? '#1d4ed8' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {form.has_psychologist === o.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
                      </div>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="op-two-col">
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Семейное положение</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {RELATIONSHIP_OPTIONS.map(o => (
                      <button key={o.id} className={`op-chip${form.relationship_status === o.id ? ' selected' : ''}`}
                        style={{ textAlign: 'left', borderRadius: 10, padding: '8px 12px' }}
                        onClick={() => setForm(f => ({ ...f, relationship_status: o.id }))}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Сфера</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {OCCUPATION_OPTIONS.map(o => (
                      <button key={o.id} className={`op-chip${form.occupation === o.id ? ' selected' : ''}`}
                        style={{ textAlign: 'left', borderRadius: 10, padding: '8px 12px' }}
                        onClick={() => setForm(f => ({ ...f, occupation: o.id }))}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Есть дети?</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[{ v: true, label: 'Да' }, { v: false, label: 'Нет' }].map(o => (
                    <button key={String(o.v)} className={`op-chip${form.has_children === o.v ? ' selected' : ''}`}
                      onClick={() => setForm(f => ({ ...f, has_children: o.v }))}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 14, padding: '14px 0', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(4px)' }}
              >
                Назад
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => canNext() && setStep(s => s + 1)}
                disabled={!canNext()}
                style={{ flex: 1, background: canNext() ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 14, padding: '14px 0', color: canNext() ? '#1d4ed8' : 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 700, cursor: canNext() ? 'pointer' : 'not-allowed', transition: 'background 0.2s, color 0.2s' }}
              >
                Далее →
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                style={{ flex: 1, background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: 14, padding: '14px 0', color: '#1d4ed8', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                {saving ? 'Сохраняем…' : 'Начать →'}
              </button>
            )}
          </div>

          {/* Skip */}
          <button
            onClick={() => router.replace('/cabinet')}
            style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Пропустить
          </button>
        </div>
      </div>
    </>
  )
}
