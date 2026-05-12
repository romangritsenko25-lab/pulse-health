import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
        <h1 className="text-3xl font-semibold mb-2">Политика конфиденциальности</h1>
        <p className="text-gray-400 text-sm mb-10">Последнее обновление: 12 мая 2026</p>

        <Section title="1. Кто мы">
          ИП Гриценко (ИИН: 931225350096), Республика Казахстан. Контакт: <a href="mailto:support@metanoia.ai" className="underline">support@metanoia.ai</a>
        </Section>

        <Section title="2. Какие данные собираем">
          • Email и имя при регистрации<br />
          • Ответы на вопросы чек-инов<br />
          • Сообщения AI-чата<br />
          • Данные об использовании сервиса<br /><br />
          Платёжные данные (данные карты) обрабатывает только Paddle — мы их не храним.
        </Section>

        <Section title="3. Как используем данные">
          • Для работы сервиса<br />
          • Для генерации AI-инсайтов и PDF-документов<br />
          • Для персонализации AI-ассистента<br />
          • Для обработки платежей<br />
          • Для отправки сервисных email (маркетинговые рассылки — только с вашего согласия)
        </Section>

        <Section title="4. AI-обработка">
          Ваши ответы передаются в Anthropic Claude API для генерации персональных инсайтов. Данные не используются для обучения моделей Anthropic.
        </Section>

        <Section title="5. Хранение данных">
          Данные хранятся на серверах Supabase (регион EU / eu-west-1) с применением стандартов безопасности уровня industry-level.
        </Section>

        <Section title="6. Третьи стороны">
          Мы работаем со следующими провайдерами:<br />
          • <strong>Paddle</strong> — обработка платежей<br />
          • <strong>Anthropic</strong> — AI-генерация<br />
          • <strong>Supabase</strong> — база данных<br />
          • <strong>Vercel</strong> — хостинг
        </Section>

        <Section title="7. Срок хранения">
          Данные хранятся пока аккаунт активен. При удалении аккаунта данные удаляются в течение 30 дней.
        </Section>

        <Section title="8. Ваши права">
          Вы можете запросить доступ, исправление, экспорт или удаление своих данных, написав на <a href="mailto:support@metanoia.ai" className="underline">support@metanoia.ai</a>.
        </Section>

        <Section title="9. Cookies">
          Мы используем только сессионные cookies для авторизации. Рекламных трекеров нет.
        </Section>

        <Section title="10. Дети">
          Сервис не предназначен для лиц младше 18 лет.
        </Section>

        <Section title="11. Изменения">
          При существенных изменениях политики мы уведомляем вас по email.
        </Section>

        <Section title="12. Контакт">
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
