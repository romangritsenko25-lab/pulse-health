'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ClipboardList, Sparkles, BookOpen, TrendingUp, MessageCircle, FileText, ChevronDown, Activity, ShieldCheck, Repeat2, Users } from 'lucide-react'
import LoginModal from '@/components/LoginModal'

const TOOLS = [
  {
    icon: ClipboardList,
    title: 'Чек-ин',
    what: 'Ежедневный AI-опрос — 4 блока, 10 минут',
    why: [
      'Структурирует то, что сложно объяснить словами',
      'Выявляет паттерны которые не видны в моменте',
      'Готовит готовый контекст для разговора со специалистом',
    ],
  },
  {
    icon: Sparkles,
    title: 'AI-анализ',
    what: 'Резюме состояния после каждого чек-ина — в стиле психолога',
    why: [
      'Видишь своё состояние со стороны, структурировано',
      'Получаешь конкретные темы для сессии со специалистом',
      'Понимаешь связи между эмоциями, сном и самочувствием',
    ],
  },
  {
    icon: BookOpen,
    title: 'Журнал',
    what: 'Свободные заметки в любой момент между чек-инами',
    why: [
      'Фиксируешь важные мысли пока они свежие',
      'Видишь хронологию событий и реакций',
      'Материал для разбора с психологом',
    ],
  },
  {
    icon: TrendingUp,
    title: 'Динамика',
    what: 'Графики самочувствия, тревоги и сна за выбранный период',
    why: [
      'Видишь тренды — что улучшается, что требует внимания',
      'Сравниваешь периоды: до и после терапии, событий, изменений',
      'Объективная картина вместо ощущений',
    ],
  },
  {
    icon: MessageCircle,
    title: 'Мой AI',
    what: 'Чат-ассистент который знает твои анализы и историю',
    why: [
      'Обсуждаешь что происходит между сессиями — без осуждения',
      'Задаёшь вопросы о своём состоянии в любое время',
      'AI отвечает с учётом твоего реального контекста, не абстрактно',
    ],
  },
  {
    icon: FileText,
    title: 'PDF-отчёт',
    what: 'Профессиональный документ для специалиста — одна кнопка',
    why: [
      'Специалист сразу видит полный контекст — не тратите сессию на «расскажи о себе»',
      'Выглядит как медицинский документ — легко воспринимается профессионалом',
      'Сохраняется история всех отчётов — можно скачать повторно',
    ],
  },
]

const ACTIVITY_BENEFITS = [
  {
    icon: TrendingUp,
    title: 'Паттерны видны только в динамике',
    body: 'Один чек-ин — это точка. Семь чек-инов — это линия. AI начинает видеть связи: как сон влияет на тревогу, как события влияют на самочувствие.',
  },
  {
    icon: Sparkles,
    title: 'AI становится точнее',
    body: 'Чем больше данных — тем персональнее анализ. Со временем ассистент знает тебя лучше и даёт более точные наблюдения.',
  },
  {
    icon: Repeat2,
    title: '10 минут → привычка рефлексии',
    body: 'Регулярная короткая работа с собой эффективнее редких глубоких сессий. Ежедневный ритуал меняет отношение к своему состоянию.',
  },
  {
    icon: Users,
    title: 'Специалист работает эффективнее',
    body: 'Приходишь с готовым PDF и историей за недели. Сессия начинается с места в карьер — глубокая работа, а не сбор анамнеза.',
  },
]

type FaqItem = { q: string; a: string }
type FaqSection = { title: string; items: FaqItem[] }

const FAQ: FaqSection[] = [
  {
    title: 'О продукте',
    items: [
      {
        q: 'Что такое Metanoia AI и кому это подходит?',
        a: 'Metanoia AI — инструмент самопознания и подготовки к работе со специалистом. Подходит тем, кто уже ходит к психологу и хочет использовать время сессий эффективнее, тем кто только собирается начать и не знает с чего начать разговор, и тем кто просто хочет лучше понимать своё состояние.',
      },
      {
        q: 'Это заменит психолога?',
        a: 'Нет. Metanoia AI — не терапия и не замена специалисту. Это инструмент для работы между сессиями: структурирует состояние, помогает сформулировать то что сложно объяснить, и даёт специалисту готовый контекст. Глубокую работу делает живой человек.',
      },
      {
        q: 'С чего начать?',
        a: 'Зарегистрируйся и пройди первый чек-ин — это займёт 10 минут. После него получишь полный AI-анализ состояния. Дальше — проходи чек-ин ежедневно или когда чувствуешь что нужно зафиксировать состояние.',
      },
    ],
  },
  {
    title: 'О чек-ине',
    items: [
      {
        q: 'Что такое 4 блока опроса?',
        a: 'Блок 1 — физическое состояние: самочувствие, сон, уровень энергии в течение дня. Блок 2 — эмоциональный фон: настроение, тревога, основные эмоции. Блок 3 — когнитивное состояние: концентрация, контроль, ментальная нагрузка. Блок 4 — свободный текст: что происходит своими словами, без структуры.',
      },
      {
        q: 'Как часто нужно проходить чек-ин?',
        a: 'Идеально — ежедневно, в одно и то же время (утром или вечером). Но даже 3-4 раза в неделю дают достаточно данных для анализа паттернов. Главное — регулярность, а не частота.',
      },
      {
        q: 'Что если у меня нет слов описать состояние?',
        a: 'Именно для этого и существует структурированный опрос — можно выбрать эмоции из списка, поставить цифру от 1 до 10 и написать даже одно предложение. AI сделает остальное. Не нужно быть красноречивым — нужно быть честным.',
      },
    ],
  },
  {
    title: 'Об AI-анализе',
    items: [
      {
        q: 'Как AI анализирует мои ответы?',
        a: 'AI рассматривает все ответы чек-ина в комплексе: числовые показатели, выбранные эмоции и свободный текст. Он находит связи между параметрами, замечает противоречия и формулирует резюме в том стиле, который понятен как тебе, так и специалисту.',
      },
      {
        q: 'AI ставит диагнозы?',
        a: 'Нет. Metanoia AI не диагностирует, не ставит клинических диагнозов и не назначает лечение. Он описывает состояние и выявляет паттерны — для понимания себя и подготовки к разговору со специалистом. Любые клинические решения принимает только квалифицированный специалист.',
      },
      {
        q: 'Откуда берутся «темы для специалиста»?',
        a: 'AI выделяет из твоих ответов три наиболее значимые темы — то, что требует внимания или проработки. Это не диагноз, а точки входа для разговора: специалист может начать с них или использовать как контекст.',
      },
    ],
  },
  {
    title: 'О данных и безопасности',
    items: [
      {
        q: 'Кто видит мои ответы?',
        a: 'Только ты. Специалист видит только то, что ты явно передаёшь ему через PDF-отчёт — по своей инициативе. Без твоего действия никакой специалист доступа к твоим данным не имеет.',
      },
      {
        q: 'Где хранятся данные?',
        a: 'Все данные хранятся в защищённой базе данных (Supabase) на серверах в Европе. Передача данных зашифрована. Мы не передаём твои данные третьим лицам и не используем их для обучения AI-моделей.',
      },
      {
        q: 'Что видит мой специалист?',
        a: 'Только то, что ты сам показываешь — PDF-отчёт, который ты создаёшь и скачиваешь. Если ты привязан к специалисту через реферальную ссылку, он может видеть твои анализы в своём кабинете — только если ты сам использовал его ссылку при регистрации.',
      },
    ],
  },
  {
    title: 'О подписке',
    items: [
      {
        q: 'Что входит в бесплатный план?',
        a: '3 AI-анализа состояния без ограничений по времени. Этого достаточно чтобы понять формат и получить первые инсайты о своём состоянии.',
      },
      {
        q: 'Что даёт Pro-подписка?',
        a: 'Ежедневный чек-ин без ограничений, журнал, AI-ассистент с личным контекстом, PDF-отчёты для специалиста и полная история анализов. Pro создан для тех, кто использует Metanoia как регулярный инструмент работы с собой.',
      },
      {
        q: 'Как отменить подписку?',
        a: 'В любой момент через кабинет или написав на support@metanoia.ai. Отмена вступает в силу в конце оплаченного периода — доступ сохраняется до его окончания.',
      },
    ],
  },
]

export default function GuideClient() {
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [showLogin, setShowLogin] = useState(false)

  function toggleFaq(key: string) {
    setOpenFaq(prev => prev === key ? null : key)
  }

  return (
    <div className="bg-white min-h-screen">

      {/* Hero */}
      <section className="py-20 px-4 border-b border-slate-100">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Гид по приложению</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-5 tracking-tight">
            Как работает Metanoia AI
          </h1>
          <p className="text-lg text-slate-500 mb-8 leading-relaxed">
            Всё что нужно знать — от первого чек-ина до разговора со специалистом
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['10 минут в день', 'Без диагнозов', 'Конфиденциально'].map(b => (
              <span key={b} className="inline-flex items-center gap-1.5 text-sm text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
                <span className="text-blue-500 font-bold text-xs">✓</span> {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">01</p>
            <h2 className="text-2xl font-bold text-slate-900">Инструменты кабинета</h2>
            <p className="text-slate-500 mt-2">Шесть разделов — каждый решает свою задачу</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TOOLS.map(({ icon: Icon, title, what, why }) => (
              <div key={title} className="border border-slate-200 rounded-xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5 text-blue-600" size={18} />
                  </div>
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{what}</p>
                <ul className="flex flex-col gap-2 mt-auto">
                  {why.map(w => (
                    <li key={w} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-blue-500 font-bold mt-0.5 shrink-0">→</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why be active */}
      <section className="py-20 px-4 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">02</p>
            <h2 className="text-2xl font-bold text-slate-900">Зачем быть активным</h2>
            <p className="text-slate-500 mt-2">Почему регулярность важнее идеального результата</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {ACTIVITY_BENEFITS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-xl p-6 flex gap-4">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="text-blue-600" size={18} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 mb-1.5">{title}</p>
                  <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">03</p>
            <h2 className="text-2xl font-bold text-slate-900">Частые вопросы</h2>
          </div>
          <div className="flex flex-col gap-10">
            {FAQ.map((section) => (
              <div key={section.title}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{section.title}</p>
                <div className="flex flex-col divide-y divide-slate-100">
                  {section.items.map((item) => {
                    const key = `${section.title}::${item.q}`
                    const isOpen = openFaq === key
                    return (
                      <div key={item.q}>
                        <button
                          onClick={() => toggleFaq(key)}
                          className="w-full flex items-center justify-between py-4 text-left gap-4 group"
                        >
                          <span className="text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                            {item.q}
                          </span>
                          <ChevronDown
                            size={16}
                            className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {isOpen && (
                          <p className="text-sm text-slate-500 leading-relaxed pb-4 pr-6">
                            {item.a}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-slate-100">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-6">
            <Activity className="text-blue-600" size={22} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Готов начать?</h2>
          <p className="text-slate-500 mb-8">3 чек-ина бесплатно — без кредитной карты</p>
          <button
            onClick={() => setShowLogin(true)}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-sm"
          >
            Попробовать бесплатно
          </button>
          <p className="mt-4 text-xs text-slate-400">
            Уже есть аккаунт?{' '}
            <button onClick={() => setShowLogin(true)} className="text-blue-500 hover:underline">
              Войти
            </button>
          </p>
        </div>
      </section>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  )
}
