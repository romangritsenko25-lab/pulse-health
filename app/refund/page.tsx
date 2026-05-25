import Link from 'next/link'
import type { Metadata } from 'next'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'Возврат средств — Metanoia AI',
}

export default function RefundPage() {
  return (
    <div className="bg-white min-h-screen">
      <NavBar />
      <div className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
        <h1 className="text-3xl font-semibold mb-2">Политика возврата средств</h1>
        <p className="text-gray-400 text-sm mb-10">Последнее обновление: 12 мая 2026</p>

        <Section title="1. Общее">
          Мы хотим, чтобы вы были довольны сервисом. Все платежи обрабатываются через платёжного провайдера.
        </Section>

        <Section title="2. Бесплатный пробный период">
          Пробный период составляет 7 дней без оплаты. Если вы отменяете подписку до окончания пробного периода — списания не происходит.
        </Section>

        <Section title="3. Месячная подписка">
          Возврат возможен в течение 7 дней с момента первой оплаты. После истечения этого срока возврат не производится. Отмена подписки прекращает будущие списания; доступ сохраняется до конца оплаченного периода.
        </Section>

        <Section title="4. Годовая подписка">
          Возврат возможен в течение 14 дней с момента оплаты. После истечения этого срока возможен пропорциональный возврат за неиспользованный период — по решению команды поддержки.
        </Section>

        <Section title="5. Как запросить возврат">
          Напишите на <a href="mailto:support@metanoia.ai" className="underline">support@metanoia.ai</a>, указав email аккаунта и причину запроса. Обработка занимает 5–10 рабочих дней.
        </Section>

        <Section title="6. Случаи без возврата">
          • Запрос подан после истечения допустимого срока<br />
          • Аккаунт был заблокирован за нарушение Условий использования
        </Section>

        <Section title="7. Отмена подписки">
          Подписку можно отменить в настройках аккаунта. Доступ к сервису сохраняется до конца оплаченного периода.
        </Section>

        <Section title="8. Обработка платежей">
          Все возвраты осуществляются через платёжного провайдера на исходный способ оплаты.
        </Section>

        <Section title="9. Контакт">
          По всем вопросам: <a href="mailto:support@metanoia.ai" className="underline">support@metanoia.ai</a>
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
