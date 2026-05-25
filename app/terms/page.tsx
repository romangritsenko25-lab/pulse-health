import Link from 'next/link'
import type { Metadata } from 'next'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'Условия использования — Metanoia AI',
}

export default function TermsPage() {
  return (
    <div className="bg-white min-h-screen">
      <NavBar />
      <div className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
        <h1 className="text-3xl font-semibold mb-2">Условия использования</h1>
        <p className="text-gray-400 text-sm mb-10">Последнее обновление: 12 мая 2026</p>

        <Section title="1. Принятие условий">
          Использование сервиса означает согласие с настоящими условиями. Сервис управляется ИП Гриценко (ИИН: 931225350096), Республика Казахстан.
        </Section>

        <Section title="2. Описание сервиса">
          Metanoia AI — инструмент для подготовки к сессиям с психологом. Сервис не является медицинской услугой и не заменяет профессиональную психологическую или медицинскую помощь.
        </Section>

        <Section title="3. Не является медицинской помощью">
          Все AI-инсайты носят исключительно информационный характер. При кризисных состояниях, включая мысли о самоповреждении, немедленно обращайтесь к специалисту.<br /><br />
          Телефоны доверия: Казахстан — <strong>150</strong>, Украина — <strong>7333</strong>.
        </Section>

        <Section title="4. Аккаунт пользователя">
          Использование сервиса допустимо с 18 лет. Пользователь несёт ответственность за конфиденциальность данных своего аккаунта.
        </Section>

        <Section title="5. Подписка и оплата">
          Платежи обрабатываются через платёжного провайдера. Действующие тарифы:<br /><br />
          • Pro — $9.99 в месяц<br />
          • Specialist Pro — $19.99 в месяц
        </Section>

        <Section title="6. Бесплатный пробный период">
          Пробный период составляет 7 дней. По окончании пробного периода списание происходит автоматически, если подписка не была отменена заблаговременно.
        </Section>

        <Section title="7. Допустимое использование">
          Запрещено использование сервиса для взлома систем, автоматического сбора данных (скрейпинга), а также в любых незаконных целях.
        </Section>

        <Section title="8. Интеллектуальная собственность">
          Весь контент сервиса, включая тексты, дизайн и программный код, принадлежит ИП Гриценко.
        </Section>

        <Section title="9. Прекращение доступа">
          Мы оставляем за собой право заблокировать аккаунт при нарушении настоящих условий.
        </Section>

        <Section title="10. Ограничение ответственности">
          Сервис предоставляется «как есть» без каких-либо явных или подразумеваемых гарантий.
        </Section>

        <Section title="11. Изменения условий">
          Об изменениях условий мы уведомляем по email не менее чем за 14 дней.
        </Section>

        <Section title="12. Применимое право">
          К настоящим условиям применяется законодательство Республики Казахстан.
        </Section>

        <Section title="13. Контакт">
          По всем вопросам обращайтесь: <a href="mailto:support@metanoia.ai" className="underline">support@metanoia.ai</a>
        </Section>

        <div className="mt-12">
          <Link href="/" className="text-gray-500 hover:text-gray-800 transition-colors text-sm">← На главную</Link>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p className="text-gray-600 leading-relaxed">{children}</p>
    </div>
  )
}
