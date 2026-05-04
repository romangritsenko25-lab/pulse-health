'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────────
interface DeepFormData {
  // Block 1 — Body
  wellbeing: number
  wellbeingReason: string
  sleepHours: number
  sleepQuality: string
  sleepIssues: string
  bodyPains: string[]
  energyMorning: number
  energyAfternoon: number
  energyEvening: number

  // Block 2 — Emotions
  emotions: string[]
  anxietyLevel: number
  anxietyAbout: string
  selfHarm: boolean | null
  controlFeeling: number
  memorableMoment: string

  // Block 3 — Context
  stressFactors: string[]
  socialContact: string
  eating: string
  substances: string

  // Block 4 — Free narrative
  freeText: string
}

// ── Constants ──────────────────────────────────────────────────────────────
const TOTAL_BLOCKS = 4

const BODY_PAINS = ['Голова', 'Шея/плечи', 'Спина', 'Грудь', 'Живот', 'Ноги', 'Нет болей']

const SLEEP_QUALITY = ['Очень плохо', 'Плохо', 'Нормально', 'Хорошо', 'Отлично']

const EMOTIONS_LIST = [
  { label: 'Спокойствие', emoji: '😌' },
  { label: 'Тревога', emoji: '😰' },
  { label: 'Грусть', emoji: '😢' },
  { label: 'Злость', emoji: '😠' },
  { label: 'Радость', emoji: '😊' },
  { label: 'Апатия', emoji: '😶' },
  { label: 'Раздражение', emoji: '😤' },
  { label: 'Страх', emoji: '😨' },
  { label: 'Вина', emoji: '😔' },
  { label: 'Стыд', emoji: '🫣' },
  { label: 'Одиночество', emoji: '🥺' },
  { label: 'Надежда', emoji: '🌱' },
]

const STRESS_FACTORS = [
  'Работа / учёба', 'Отношения', 'Деньги', 'Здоровье', 'Семья',
  'Будущее', 'Одиночество', 'Перегрузка', 'Ничего особенного',
]

const SOCIAL_OPTIONS = ['Ни с кем не общался', 'Поверхностно', 'Нормально', 'Хорошо общался']
const EATING_OPTIONS = ['Почти не ел', 'Поел мало', 'Нормально', 'Хорошо']

// ── Helpers ────────────────────────────────────────────────────────────────
function SliderRow({ label, value, onChange, min = 1, max = 10 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 font-medium">{label}</span>
        <span className="text-sm font-bold text-teal-600 w-6 text-right">{value}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 accent-teal-500 cursor-pointer"
      />
    </div>
  )
}

function ChipSelect({ options, selected, onToggle }: {
  options: string[]; selected: string[]; onToggle: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt} type="button" onClick={() => onToggle(opt)}
          className={`px-3 py-1.5 rounded-xl text-sm border transition font-medium ${
            selected.includes(opt)
              ? 'border-teal-500 bg-teal-500 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function PillSelect({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt} type="button" onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-xl text-sm border transition font-medium ${
            value === opt
              ? 'border-teal-500 bg-teal-500 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function TagHints({ tags, onSelect }: { tags: string[]; onSelect: (t: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onSelect(tag)}
          className="px-2.5 py-1 rounded-lg text-xs border border-slate-200 bg-white text-slate-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 transition"
        >
          + {tag}
        </button>
      ))}
    </div>
  )
}

// ── Block components ───────────────────────────────────────────────────────
function Block1Body({ form, set }: { form: DeepFormData; set: <K extends keyof DeepFormData>(k: K, v: DeepFormData[K]) => void }) {
  function togglePain(pain: string) {
    const pains = form.bodyPains
    if (pain === 'Нет болей') {
      set('bodyPains', ['Нет болей'])
      return
    }
    const filtered = pains.filter((p) => p !== 'Нет болей')
    set('bodyPains', filtered.includes(pain) ? filtered.filter((p) => p !== pain) : [...filtered, pain])
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="font-semibold text-slate-800 mb-3">Общее самочувствие</h3>
        <div className="flex items-center gap-4 mb-3">
          <span className="text-5xl font-bold text-teal-600">{form.wellbeing}</span>
          <span className="text-slate-400 text-xl">/10</span>
        </div>
        <input
          type="range" min={1} max={10} value={form.wellbeing}
          onChange={(e) => set('wellbeing', Number(e.target.value))}
          className="w-full h-2 accent-teal-500 cursor-pointer mb-3"
        />
        <textarea
          value={form.wellbeingReason}
          onChange={(e) => set('wellbeingReason', e.target.value)}
          placeholder="Почему именно эта цифра? (необязательно)"
          rows={2}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
        />
        <TagHints
          tags={['болит голова', 'напряжение в плечах', 'тяжесть в груди']}
          onSelect={(t) => set('wellbeingReason', form.wellbeingReason ? `${form.wellbeingReason}, ${t}` : t)}
        />
      </section>

      <section>
        <h3 className="font-semibold text-slate-800 mb-3">Сон</h3>
        <div className="mb-4">
          <SliderRow
            label={`Количество часов: ${form.sleepHours} ч`}
            value={form.sleepHours}
            onChange={(v) => set('sleepHours', v)}
            min={3} max={12}
          />
        </div>
        <p className="text-sm text-slate-500 mb-2">Качество сна:</p>
        <PillSelect
          options={SLEEP_QUALITY}
          value={form.sleepQuality}
          onChange={(v) => set('sleepQuality', v)}
        />
        <input
          type="text"
          value={form.sleepIssues}
          onChange={(e) => set('sleepIssues', e.target.value)}
          placeholder="Что мешало спать? (необязательно)"
          className="mt-3 w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
      </section>

      <section>
        <h3 className="font-semibold text-slate-800 mb-3">Боли и дискомфорт</h3>
        <div className="flex flex-wrap gap-2">
          {BODY_PAINS.map((pain) => (
            <button
              key={pain} type="button" onClick={() => togglePain(pain)}
              className={`px-3 py-1.5 rounded-xl text-sm border transition font-medium ${
                form.bodyPains.includes(pain)
                  ? 'border-teal-500 bg-teal-500 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'
              }`}
            >
              {pain}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800 mb-3">Уровень энергии (1–5)</h3>
        <div className="flex flex-col gap-4">
          <SliderRow label="Утро" value={form.energyMorning} onChange={(v) => set('energyMorning', v)} min={1} max={5} />
          <SliderRow label="День" value={form.energyAfternoon} onChange={(v) => set('energyAfternoon', v)} min={1} max={5} />
          <SliderRow label="Вечер" value={form.energyEvening} onChange={(v) => set('energyEvening', v)} min={1} max={5} />
        </div>
      </section>
    </div>
  )
}

interface Block2Props {
  form: DeepFormData
  set: <K extends keyof DeepFormData>(k: K, v: DeepFormData[K]) => void
  onCrisis: () => void
}

function Block2Emotions({ form, set, onCrisis }: Block2Props) {
  function toggleEmotion(emotion: string) {
    const list = form.emotions
    set('emotions', list.includes(emotion) ? list.filter((e) => e !== emotion) : [...list, emotion])
  }

  function handleSelfHarm(answer: boolean) {
    set('selfHarm', answer)
    if (answer) onCrisis()
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="font-semibold text-slate-800 mb-3">Какие эмоции присутствовали сегодня?</h3>
        <div className="grid grid-cols-3 gap-2">
          {EMOTIONS_LIST.map((e) => (
            <button
              key={e.label} type="button" onClick={() => toggleEmotion(e.label)}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition text-xs font-medium ${
                form.emotions.includes(e.label)
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-teal-200'
              }`}
            >
              <span className="text-2xl">{e.emoji}</span>
              {e.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800 mb-3">Тревога</h3>
        <SliderRow label="Интенсивность тревоги" value={form.anxietyLevel} onChange={(v) => set('anxietyLevel', v)} />
        <textarea
          value={form.anxietyAbout}
          onChange={(e) => set('anxietyAbout', e.target.value)}
          placeholder="О чём тревога? (необязательно)"
          rows={2}
          className="mt-3 w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
        />
        <TagHints
          tags={['из-за работы', 'в отношениях', 'без причины']}
          onSelect={(t) => set('anxietyAbout', form.anxietyAbout ? `${form.anxietyAbout}, ${t}` : t)}
        />
      </section>

      <section>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <p className="text-slate-700 font-medium mb-3 text-sm leading-relaxed">
            Были ли у вас сегодня мысли о том, чтобы причинить себе вред или не хотеть жить?
          </p>
          <div className="flex gap-3">
            <button
              type="button" onClick={() => handleSelfHarm(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${
                form.selfHarm === false
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-green-300'
              }`}
            >
              Нет
            </button>
            <button
              type="button" onClick={() => handleSelfHarm(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${
                form.selfHarm === true
                  ? 'border-red-500 bg-red-500 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-red-300'
              }`}
            >
              Да
            </button>
          </div>
        </div>
      </section>

      <section>
        <SliderRow
          label="Ощущение контроля над своей жизнью"
          value={form.controlFeeling}
          onChange={(v) => set('controlFeeling', v)}
        />
      </section>

      <section>
        <h3 className="font-semibold text-slate-800 mb-2">Запомнившийся момент дня</h3>
        <textarea
          value={form.memorableMoment}
          onChange={(e) => set('memorableMoment', e.target.value)}
          placeholder="Один момент, который запомнился — хорошее или плохое…"
          rows={2}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
        />
      </section>
    </div>
  )
}

function Block3Context({ form, set }: { form: DeepFormData; set: <K extends keyof DeepFormData>(k: K, v: DeepFormData[K]) => void }) {
  function toggleStress(factor: string) {
    const list = form.stressFactors
    set('stressFactors', list.includes(factor) ? list.filter((f) => f !== factor) : [...list, factor])
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="font-semibold text-slate-800 mb-3">Стресс-факторы</h3>
        <ChipSelect options={STRESS_FACTORS} selected={form.stressFactors} onToggle={toggleStress} />
      </section>

      <section>
        <h3 className="font-semibold text-slate-800 mb-3">Социальные контакты</h3>
        <PillSelect options={SOCIAL_OPTIONS} value={form.socialContact} onChange={(v) => set('socialContact', v)} />
      </section>

      <section>
        <h3 className="font-semibold text-slate-800 mb-3">Питание</h3>
        <PillSelect options={EATING_OPTIONS} value={form.eating} onChange={(v) => set('eating', v)} />
      </section>

      <section>
        <h3 className="font-semibold text-slate-800 mb-2">Алкоголь / лекарства <span className="text-slate-400 font-normal text-sm">(необязательно)</span></h3>
        <input
          type="text"
          value={form.substances}
          onChange={(e) => set('substances', e.target.value)}
          placeholder="Например: выпил вино, принял антидепрессант..."
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
      </section>
    </div>
  )
}

function Block4Narrative({ form, set }: { form: DeepFormData; set: <K extends keyof DeepFormData>(k: K, v: DeepFormData[K]) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-slate-500 text-sm leading-relaxed">
        Расскажите своими словами — что сейчас происходит в вашей жизни? Что вас беспокоит, что радует, что давит? Это увидит только ваш AI-ассистент и поможет подготовиться к разговору со специалистом.
      </p>
      <textarea
        value={form.freeText}
        onChange={(e) => set('freeText', e.target.value)}
        placeholder="Начните писать свободно, без структуры…"
        rows={10}
        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
      />
      <p className="text-slate-400 text-xs text-right">{form.freeText.length} символов</p>
    </div>
  )
}

// ── Crisis screen ──────────────────────────────────────────────────────────
function CrisisScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto px-4 py-8">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold text-red-700 mb-3">Вы не одни</h2>
        <p className="text-slate-700 text-sm leading-relaxed mb-4">
          Если у вас есть мысли о причинении себе вреда — пожалуйста, позвоните на линию психологической помощи прямо сейчас. Это бесплатно и анонимно.
        </p>
        <div className="flex flex-col gap-3">
          <a href="tel:150" className="flex items-center gap-3 bg-white border border-red-200 rounded-xl px-4 py-3 text-red-700 font-semibold hover:bg-red-50 transition">
            <span className="text-xl">📞</span>
            <div>
              <div className="font-bold">150</div>
              <div className="text-xs text-slate-500">Казахстан — бесплатно</div>
            </div>
          </a>
          <a href="tel:88002000122" className="flex items-center gap-3 bg-white border border-red-200 rounded-xl px-4 py-3 text-red-700 font-semibold hover:bg-red-50 transition">
            <span className="text-xl">📞</span>
            <div>
              <div className="font-bold">8-800-2000-122</div>
              <div className="text-xs text-slate-500">Россия — бесплатно</div>
            </div>
          </a>
          <a href="tel:7333" className="flex items-center gap-3 bg-white border border-red-200 rounded-xl px-4 py-3 text-red-700 font-semibold hover:bg-red-50 transition">
            <span className="text-xl">📞</span>
            <div>
              <div className="font-bold">7333</div>
              <div className="text-xs text-slate-500">Украина</div>
            </div>
          </a>
        </div>
      </div>
      <button
        onClick={onBack}
        className="text-slate-500 text-sm text-center hover:text-slate-700 transition"
      >
        ← Вернуться к опросу
      </button>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
const BLOCK_META = [
  { title: 'Тело', subtitle: 'Как ваше физическое состояние?' },
  { title: 'Эмоции', subtitle: 'Что вы чувствовали сегодня?' },
  { title: 'Контекст', subtitle: 'Что происходило вокруг?' },
  { title: 'Свободный рассказ', subtitle: 'Расскажите своими словами' },
]

const defaultForm: DeepFormData = {
  wellbeing: 5,
  wellbeingReason: '',
  sleepHours: 7,
  sleepQuality: 'Нормально',
  sleepIssues: '',
  bodyPains: [],
  energyMorning: 3,
  energyAfternoon: 3,
  energyEvening: 3,
  emotions: [],
  anxietyLevel: 3,
  anxietyAbout: '',
  selfHarm: null,
  controlFeeling: 5,
  memorableMoment: '',
  stressFactors: [],
  socialContact: '',
  eating: '',
  substances: '',
  freeText: '',
}

export default function CheckinPage() {
  const router = useRouter()
  const [block, setBlock] = useState(1)
  const [visible, setVisible] = useState(true)
  const [form, setForm] = useState<DeepFormData>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCrisis, setShowCrisis] = useState(false)

  function set<K extends keyof DeepFormData>(key: K, value: DeepFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const goToBlock = useCallback(async (next: number) => {
    setVisible(false)
    await new Promise((r) => setTimeout(r, 180))
    setBlock(next)
    setVisible(true)
  }, [])

  function canGoNext(): boolean {
    if (block === 2 && form.selfHarm === null) return false
    return true
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        router.push('/login')
        return
      }

      // Paywall: free plan = 3 checkins
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status, plan')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      const isPro = !!sub
      if (!isPro) {
        const { count } = await supabase
          .from('checkins')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
        if ((count ?? 0) >= 3) {
          router.push('/upgrade?reason=limit')
          return
        }
      }

      const { data: checkin, error: insertError } = await supabase
        .from('checkins')
        .insert({
          user_id: user.id,
          wellbeing: form.wellbeing,
          sleep: `${form.sleepHours}ч, ${form.sleepQuality}`,
          energy: `утро:${form.energyMorning} день:${form.energyAfternoon} вечер:${form.energyEvening}`,
          mood: form.emotions.join(', ') || null,
          notes: form.freeText || null,
          deep_data: form,
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Checkin insert error:', insertError)
        setError(`Не удалось сохранить данные: ${insertError.message}`)
        setLoading(false)
        return
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, checkin_id: checkin.id }),
      })
      if (!res.ok) throw new Error('server_error')
      const data = await res.json()
      sessionStorage.setItem(`pulse_checkin_${data.id}`, JSON.stringify(data))
      router.push(`/result?id=${data.id}`)
    } catch (err) {
      console.error('handleSubmit error:', err)
      setError('Не удалось получить анализ. Проверьте соединение и попробуйте снова.')
      setLoading(false)
    }
  }

  if (showCrisis) {
    return <CrisisScreen onBack={() => { set('selfHarm', null); setShowCrisis(false) }} />
  }

  const meta = BLOCK_META[block - 1]
  const progress = (block / TOTAL_BLOCKS) * 100

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 px-4 pt-5 pb-3 max-w-lg mx-auto w-full sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-slate-400 font-medium">Блок {block} из {TOTAL_BLOCKS}</span>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-slate-400 hover:text-slate-600 text-sm transition"
          >
            Выйти
          </button>
        </div>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6">
        <div
          className={`transition-all duration-200 ease-out ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">{meta.title}</h2>
            <p className="text-slate-500 text-sm mt-0.5">{meta.subtitle}</p>
          </div>

          <div>
            {block === 1 && <Block1Body form={form} set={set} />}
            {block === 2 && <Block2Emotions form={form} set={set} onCrisis={() => setShowCrisis(true)} />}
            {block === 3 && <Block3Context form={form} set={set} />}
            {block === 4 && <Block4Narrative form={form} set={set} />}
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          {block > 1 && (
            <button
              type="button"
              onClick={() => goToBlock(block - 1)}
              className="flex-1 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition font-medium text-sm"
            >
              ← Назад
            </button>
          )}

          {block < TOTAL_BLOCKS ? (
            <button
              type="button"
              onClick={() => goToBlock(block + 1)}
              disabled={!canGoNext()}
              className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl transition text-sm"
            >
              Далее →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block">⏳</span>
                  Анализируем…
                </>
              ) : (
                'Получить анализ'
              )}
            </button>
          )}
        </div>

        {block === 4 && !loading && (
          <button
            type="button"
            onClick={handleSubmit}
            className="mt-3 text-slate-400 hover:text-slate-600 text-sm text-center w-full transition"
          >
            Пропустить и получить анализ
          </button>
        )}
      </div>
    </div>
  )
}
