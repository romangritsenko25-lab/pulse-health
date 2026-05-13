import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const DEMO_SPECIALISTS = [
  {
    id: 'demo-1',
    name: 'Айгерим Бекова',
    specialty: 'Психолог',
    photo_url: 'https://randomuser.me/api/portraits/women/45.jpg',
    bio: 'Специализируюсь на тревожных расстройствах, депрессии и профессиональном выгорании. Использую интегративный подход: КПТ, ACT и элементы схема-терапии. 10 лет практики, более 3000 сессий. Работаю на русском и казахском языках.',
    referral_code: 'demo-bekova',
    client_count: 35,
    is_demo: true,
  },
  {
    id: 'demo-2',
    name: 'Дмитрий Волков',
    specialty: 'Психотерапевт',
    photo_url: 'https://randomuser.me/api/portraits/men/32.jpg',
    bio: 'Гештальт-терапевт, работаю с экзистенциальными кризисами, потерями и сложностями в отношениях. 8 лет практики, прошёл личную терапию более 300 часов. Убеждён: понять себя можно только через живой контакт с другим.',
    referral_code: 'demo-volkov',
    client_count: 22,
    is_demo: true,
  },
  {
    id: 'demo-3',
    name: 'Наталья Соколова',
    specialty: 'Психиатр',
    photo_url: 'https://randomuser.me/api/portraits/women/67.jpg',
    bio: 'Детский и взрослый психиатр. Специализируюсь на аффективных расстройствах, СДВГ и расстройствах тревожного спектра. Сторонник доказательной медицины и комплексного подхода: фармакотерапия в сочетании с психотерапией.',
    referral_code: 'demo-sokolova',
    client_count: 8,
    is_demo: true,
  },
  {
    id: 'demo-4',
    name: 'Азамат Джумабеков',
    specialty: 'Клинический психолог',
    photo_url: 'https://randomuser.me/api/portraits/men/18.jpg',
    bio: 'Клинический психолог, работаю с ПТСР и острыми стрессовыми реакциями. Прошёл специализацию по EMDR. Помогаю людям, пережившим травматические события, восстановить ощущение безопасности и найти внутреннюю устойчивость.',
    referral_code: 'demo-dzhumabekov',
    client_count: 3,
    is_demo: true,
  },
  {
    id: 'demo-5',
    name: 'Анна Корнева',
    specialty: 'Нейропсихолог',
    photo_url: 'https://randomuser.me/api/portraits/women/23.jpg',
    bio: 'Нейропсихолог, специализируюсь на когнитивных нарушениях и нейрореабилитации. Работаю с последствиями черепно-мозговых травм, инсультов и нейродегенеративных заболеваний. Помогаю восстанавливать память, внимание и исполнительные функции.',
    referral_code: 'demo-korneva',
    client_count: 0,
    is_demo: true,
  },
  {
    id: 'demo-6',
    name: 'Максим Иванов',
    specialty: 'Арт-терапевт',
    photo_url: 'https://randomuser.me/api/portraits/men/54.jpg',
    bio: 'Арт-терапевт и психолог. Использую творческие методы для работы с эмоциями, которые сложно выразить словами. 12 лет практики с детьми, подростками и взрослыми. Специализация: детская травма, расстройства пищевого поведения, работа с горем.',
    referral_code: 'demo-ivanov',
    client_count: 42,
    is_demo: true,
  },
  {
    id: 'demo-7',
    name: 'Ольга Мельник',
    specialty: 'Семейный психолог',
    photo_url: 'https://randomuser.me/api/portraits/women/78.jpg',
    bio: 'Семейный системный терапевт. Работаю с парами в кризисе, после измен, при разводах и в сложных ситуациях воспитания детей. 7 лет практики, более 500 семейных сессий. Создаю безопасное пространство, где каждый может быть услышан.',
    referral_code: 'demo-melnik',
    client_count: 19,
    is_demo: true,
  },
  {
    id: 'demo-8',
    name: 'Виктор Скляров',
    specialty: 'КПТ-терапевт',
    photo_url: 'https://randomuser.me/api/portraits/men/41.jpg',
    bio: 'Сертифицированный КПТ-терапевт. Специализация: ОКР, панические атаки, социальная тревога и агорафобия. Строго придерживаюсь доказательного подхода. Краткосрочная терапия с фокусом на конкретных измеримых изменениях.',
    referral_code: 'demo-sklyarov',
    client_count: 11,
    is_demo: true,
  },
  {
    id: 'demo-9',
    name: 'Зарина Алиева',
    specialty: 'Другое',
    photo_url: 'https://randomuser.me/api/portraits/women/12.jpg',
    bio: 'Телесно-ориентированный психотерапевт. Специализируюсь на работе с телесными зажимами, хроническим стрессом и психосоматическими симптомами. Сертифицированный практик биодинамической терапии. Каждая сессия — путь к себе через тело и дыхание.',
    referral_code: 'demo-alieva',
    client_count: 2,
    is_demo: true,
  },
  {
    id: 'demo-10',
    name: 'Александр Попов',
    specialty: 'Психолог',
    photo_url: 'https://randomuser.me/api/portraits/men/29.jpg',
    bio: 'Психолог-консультант с 14-летним опытом. Работаю с кризисами идентичности, карьерными переходами и экзистенциальными вопросами. Автор онлайн-курса по управлению тревогой. Ориентируюсь на видимые результаты: обычно достаточно 8–12 сессий.',
    referral_code: 'demo-popov',
    client_count: 51,
    is_demo: true,
  },
  {
    id: 'demo-11',
    name: 'Роман Шевченко',
    specialty: 'Семейный психолог',
    photo_url: 'https://randomuser.me/api/portraits/men/63.jpg',
    bio: 'Семейный психолог, специализируюсь на детско-родительских отношениях и подростковых кризисах. Недавно завершил магистратуру по психологическому консультированию, прохожу супервизию. Открыт к новым клиентам — первая консультация бесплатно.',
    referral_code: 'demo-shevchenko',
    client_count: 0,
    is_demo: true,
  },
]

export async function GET() {
  const [{ data: specialists }, { data: clientLinks }] = await Promise.all([
    adminSupabase
      .from('specialists')
      .select('id, name, specialty, photo_url, bio, referral_code'),
    adminSupabase
      .from('specialist_clients')
      .select('specialist_id'),
  ])

  const countMap = new Map<string, number>()
  for (const link of clientLinks ?? []) {
    countMap.set(link.specialist_id, (countMap.get(link.specialist_id) ?? 0) + 1)
  }

  const realSpecialists = (specialists ?? []).map((s) => ({
    ...s,
    client_count: countMap.get(s.id) ?? 0,
    is_demo: false,
  }))

  const result = [...realSpecialists, ...DEMO_SPECIALISTS]
    .sort((a, b) => b.client_count - a.client_count)

  return NextResponse.json(result)
}
