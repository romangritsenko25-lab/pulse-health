import Link from 'next/link'

const BENEFITS = [
  {
    icon: '📋',
    title: 'Клиент приходит подготовленным',
    body: 'Перед сессией он проходит структурированный AI-опрос и приносит PDF с паттернами, эмоциями и темами. Вы сразу работаете в глубину.',
  },
  {
    icon: '⏱️',
    title: 'Больше времени на работу',
    body: 'Меньше времени уходит на "с чего начать" и "как вы себя чувствуете". Первые 10 минут — уже терапия.',
  },
  {
    icon: '📊',
    title: 'Динамика между сессиями',
    body: 'Дашборд показывает как меняется состояние клиента между встречами — без лишних звонков и сообщений.',
  },
  {
    icon: '🔗',
    title: 'Личная реферальная ссылка',
    body: 'Отправляете клиенту до первой сессии. Он видит ваш профиль, подключается к вам и проходит подготовку.',
  },
]

const STEPS = [
  { step: '1', text: 'Создайте профиль специалиста — это бесплатно' },
  { step: '2', text: 'Получите личную ссылку и отправьте клиенту перед сессией' },
  { step: '3', text: 'Клиент проходит AI-опрос и приносит структурированный PDF' },
  { step: '4', text: 'Вы начинаете сессию с готовым контекстом' },
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
            Metanoia AI помогает клиентам сформулировать своё состояние до встречи с вами.
            Вы получаете больше пространства для глубокой работы с первой минуты.
          </p>
          <Link
            href="/specialist/register"
            className="inline-flex items-center px-7 py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl transition shadow-lg shadow-teal-200 text-sm"
          >
            Создать профиль специалиста →
          </Link>
          <p className="text-slate-400 text-xs mt-3">Бесплатно · Настройка за 5 минут</p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-slate-800 text-center mb-8">Что это даёт вашей практике</h2>
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

      {/* Quote */}
      <section className="py-16 px-4">
        <div className="max-w-lg mx-auto bg-teal-50 border border-teal-100 rounded-3xl p-8 text-center">
          <p className="text-slate-700 text-base leading-relaxed italic mb-4">
            «Когда клиент уже назвал свои паттерны до сессии — мы начинаем там, где обычно заканчиваем через час»
          </p>
          <p className="text-slate-400 text-xs">Психолог-консультант, КПТ</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-md mx-auto flex flex-col items-center gap-5">
          <h2 className="text-2xl font-bold text-slate-800">Попробуйте бесплатно</h2>
          <p className="text-slate-400 text-sm">
            Зарегистрируйтесь как специалист и отправьте ссылку первому клиенту уже сегодня.
          </p>
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
