import Link from 'next/link'

const BENEFITS = [
  {
    icon: '🔗',
    title: 'Личная реферальная ссылка',
    body: 'Отправьте клиенту перед первой сессией — он приходит уже подготовленным.',
  },
  {
    icon: '📋',
    title: 'Структурированный анализ',
    body: 'Клиент проходит глубокий AI-опрос и приносит PDF с паттернами и темами для обсуждения.',
  },
  {
    icon: '📊',
    title: 'Дашборд специалиста',
    body: 'Видите динамику состояния клиентов между сессиями — без лишних звонков и сообщений.',
  },
  {
    icon: '💰',
    title: 'До 30% комиссии',
    body: 'За каждого клиента пришедшего по вашей ссылке — первые 12 месяцев подписки.',
  },
]

const STEPS = [
  { step: '1', text: 'Зарегистрируйтесь как специалист — это бесплатно' },
  { step: '2', text: 'Получите личную реферальную ссылку' },
  { step: '3', text: 'Отправьте клиенту перед первой или следующей сессией' },
  { step: '4', text: 'Клиент приходит подготовленным — вы работаете эффективнее' },
]

export default function ForSpecialistsPage() {
  return (
    <div className="bg-white min-h-screen">

      {/* Hero */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-4">Для специалистов</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-5">
            Ваши клиенты приходят<br />уже подготовленными
          </h1>
          <p className="text-slate-500 text-base leading-relaxed mb-8 max-w-lg mx-auto">
            Metanoia AI помогает клиентам структурировать состояние перед сессией.
            Вы получаете больше времени на работу — меньше на «с чего начать».
          </p>
          <Link
            href="/specialist/register"
            className="inline-flex items-center px-7 py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl transition shadow-lg shadow-teal-200 text-sm"
          >
            Зарегистрироваться бесплатно →
          </Link>
          <p className="text-slate-400 text-xs mt-3">Без кредитной карты · Настройка за 5 минут</p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-slate-800 text-center mb-8">Что вы получаете</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {BENEFITS.map((b) => (
              <div key={b.title} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col gap-2">
                <span className="text-3xl">{b.icon}</span>
                <p className="font-semibold text-slate-800 text-sm">{b.title}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-slate-800 text-center mb-8">Как это работает</h2>
          <div className="flex flex-col gap-4">
            {STEPS.map((s) => (
              <div key={s.step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {s.step}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed pt-1">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-md mx-auto flex flex-col items-center gap-5">
          <h2 className="text-2xl font-bold text-slate-800">Готовы попробовать?</h2>
          <p className="text-slate-400 text-sm">Уже используют специалисты в психологии, коучинге и психотерапии.</p>
          <Link
            href="/specialist/register"
            className="w-full flex items-center justify-center py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl transition text-sm"
          >
            Создать профиль специалиста
          </Link>
          <Link href="/specialists" className="text-slate-400 hover:text-teal-600 text-xs transition">
            Посмотреть каталог специалистов →
          </Link>
        </div>
      </section>

      <footer className="py-6 px-4 border-t border-slate-100 text-center">
        <p className="text-slate-300 text-xs">© 2025 Metanoia AI · Не является медицинским сервисом</p>
      </footer>
    </div>
  )
}
