import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'О нас — Metanoia AI',
  description: 'Философия, команда и контакты Metanoia AI',
}

export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Philosophy */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3">Философия</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-12">О Metanoia AI</h1>
          <div className="flex flex-col gap-10 text-slate-600 leading-relaxed">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Почему мы создали Metanoia AI</h2>
              <p>
                Большинство людей, которые впервые идут к психологу, сталкиваются с одной и той же проблемой: сложно
                объяснить что именно происходит. Первые две-три сессии часто уходят на сбор истории, а не на настоящую
                работу. Мы создали инструмент, который помогает структурировать состояние до встречи — чтобы разговор
                начинался в глубине, а не с нуля.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Во что мы верим</h2>
              <p>
                Каждый человек — эксперт своей жизни. AI не ставит диагнозы и не заменяет специалиста. Он помогает тебе
                лучше понять себя и сформулировать то, что раньше оставалось невысказанным. Инсайт, который возникает в
                процессе — твой, а не алгоритма. Психолог нужен для глубокой работы, Metanoia — для того чтобы к ней
                лучше подготовиться.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Наша миссия</h2>
              <p>
                Снизить барьер к первой сессии. Многие откладывают поход к психологу потому что не знают с чего начать
                разговор или боятся что «недостаточно серьёзная причина». Metanoia AI делает этот первый шаг менее
                пугающим: ты приходишь уже с картой своего состояния, и работа может начаться сразу.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3">Команда</p>
          <h2 className="text-2xl font-bold text-slate-800 mb-8">Кто за этим стоит</h2>
          <div className="bg-white rounded-2xl border border-slate-100 p-6 flex gap-5 items-start">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-teal-400">👤</span>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Основатель</p>
              <p className="text-teal-600 text-sm mb-3">Продукт · Технологии</p>
              <p className="text-slate-500 text-sm leading-relaxed">
                Строю Metanoia AI потому что сам прошёл через опыт поиска подходящего специалиста и понял: проблема не
                в доступности психологов, а в том что первый шаг слишком сложен. Хочу сделать психологическую помощь
                более доступной — начиная с этого первого шага.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contacts */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3">Контакты</p>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Связаться с нами</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:istheproman2015@gmail.com"
              className="flex items-center gap-3 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-teal-200 hover:bg-teal-50 transition group"
            >
              <span className="text-2xl">✉️</span>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Email</p>
                <p className="text-sm font-semibold text-slate-700 group-hover:text-teal-600 transition">
                  istheproman2015@gmail.com
                </p>
              </div>
            </a>
            <a
              href="https://t.me/metanoia_ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-teal-200 hover:bg-teal-50 transition group"
            >
              <span className="text-2xl">✈️</span>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Telegram</p>
                <p className="text-sm font-semibold text-slate-700 group-hover:text-teal-600 transition">
                  @metanoia_ai
                </p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-10 px-4 bg-amber-50 border-t border-amber-100">
        <div className="max-w-2xl mx-auto flex gap-3">
          <span className="text-xl mt-0.5 shrink-0">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm mb-1">Важное уточнение</p>
            <p className="text-amber-700 text-sm leading-relaxed">
              Metanoia AI не является медицинским сервисом и не заменяет работу со специалистом. Приложение помогает
              структурировать состояние и подготовиться к сессии, но не ставит диагнозы и не оказывает психологическую
              помощь. Если вы находитесь в кризисной ситуации — обратитесь к специалисту или позвоните на горячую
              линию психологической помощи.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
