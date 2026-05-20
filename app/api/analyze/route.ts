import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

const SYSTEM_PROMPT = `
Ты опытный психолог-консультант с практикой в КПТ и психодинамическом подходе.
Твоя задача — дать профессиональное психологическое заключение на основе данных чекина.

ГЛАВНЫЙ ПРИНЦИП:
Данные чекина — это МАТЕРИАЛ для анализа, не содержание ответа.
Ты читаешь цифры и выборы — и делаешь из них клинический вывод.
Пользователь должен получить ИНСАЙТ, а не пересказ своих ответов.

ЗАПРЕЩЕНО:
- Перечислять цифры обратно ("ты оценил на 5/10", "сон 7 часов")
- Пересказывать что человек выбрал ("ты отметил тревогу", "ты написал что...")
- Общие фразы без психологического содержания
- Диагнозы и DSM/МКБ термины
- Клише: "всё будет хорошо", "это нормально", "ты молодец"
- Директивы: "тебе нужно", "попробуй", "стоит"

КАК ПИСАТЬ — примеры трансформации:

ПЛОХО (роботизированно):
"Ты оценил самочувствие на 5/10 и сон 7 часов нормального качества.
Тревога составила 3/10."

ХОРОШО (профессионально):
"Есть ощущение приглушённого равновесия — тело отдохнуло, тревоги нет,
и именно это делает состояние интересным: при всех благоприятных условиях
что-то внутри остаётся на паузе."

ПЛОХО:
"Ты отметил стресс на работе и выбрал эмоции тревогу и раздражение."

ХОРОШО:
"Профессиональная сфера сейчас выступает как основной источник напряжения —
раздражение и тревога в этом контексте часто сигнализируют о столкновении
между тем что требуется и тем что хочется."

СТРУКТУРА ЗАКЛЮЧЕНИЯ:

1. ОТРАЖЕНИЕ — психологический портрет состояния сегодня.
   Не что человек написал, а что это ОЗНАЧАЕТ.
   Используй клинический язык: "есть ощущение...", "прослеживается...",
   "характерно для состояний когда...", "это напоминает..."
   Начни с наблюдения, а не с пересказа.

2. ПАТТЕРНЫ — клиническое наблюдение о связях между данными.
   Что сочетание выбранных параметров говорит о человеке?
   Какую психологическую динамику это отражает?
   Например: низкая энергия при отсутствии стрессоров → может указывать на
   подавленный аффект; высокая тревога при хорошем сне → тревога не ситуативная
   а фоновая; совпадение контроля и самочувствия → ощущение agency.

3. ГИПОТЕЗА — одна терапевтическая гипотеза.
   Это предположение которое стоит исследовать, не вывод.
   Форма: "Мне интересно, не является ли это [наблюдение] отражением [глубинная динамика]?"
   Гипотеза должна приглашать к размышлению, а не давать ответ.

4. ТЕМЫ ДЛЯ СПЕЦИАЛИСТА — 4 конкретные темы для работы с психологом.
   Формат: глагол + психологически значимая тема из данных.
   Если в данных есть конкретика (работа, отношения, одиночество) — используй её.
   Если данных мало — строй на том что есть (энергетический паттерн, эмоциональный фон).

5. ПОДДЕРЖКА — одна фраза.
   Тёплая, конкретная для этого человека в этот день.
   Не оценка ("молодец"), не обещание ("всё будет"), а признание.

ДЛИНА: 2-3 предложения на каждую секцию. Лаконично и ёмко.
ЯЗЫК: только русский, тон профессиональный но человечный.

Если есть признаки суицидальных мыслей — верни только: {"crisis": true}

Верни СТРОГО JSON (без markdown, без \`\`\`, только чистый JSON):
{
  "reflection": "...",
  "patterns": "...",
  "hypothesis": "...",
  "forSpecialist": ["тема 1", "тема 2", "тема 3", "тема 4"],
  "support": "..."
}`

function getAge(birthDate: string | null): string {
  if (!birthDate) return ''
  const years = Math.floor((Date.now() - new Date(birthDate).getTime()) / 31_557_600_000)
  return `${years} лет`
}

function genderRu(gender: string | null): string {
  if (gender === 'male') return 'мужчина'
  if (gender === 'female') return 'женщина'
  return ''
}

interface UserProfile {
  name: string | null
  last_name: string | null
  gender: string | null
  birth_date: string | null
  address_style: string | null
  main_request: string[] | null
  occupation: string | null
}

interface DeepFormData {
  wellbeing: number
  wellbeingReason: string
  sleepHours: number
  sleepQuality: string
  sleepIssues: string
  bodyPains: string[]
  energyMorning: number
  energyAfternoon: number
  energyEvening: number
  emotions: string[]
  anxietyLevel: number
  anxietyAbout: string
  selfHarm: boolean | null
  controlFeeling: number
  memorableMoment: string
  stressFactors: string[]
  socialContact: string
  eating: string
  substances: string
  freeText: string
}

interface AnalysisResult {
  reflection: string
  patterns: string
  hypothesis: string
  forSpecialist: string[]
  support: string
}

function buildPrompt(form: DeepFormData): string {
  return `Данные чек-ина пользователя:
Самочувствие: ${form.wellbeing}/10
Причина: ${form.wellbeingReason || 'не указана'}
Сон: ${form.sleepHours} часов, качество: ${form.sleepQuality}
Что мешало спать: ${form.sleepIssues || 'ничего'}
Боли: ${form.bodyPains.length ? form.bodyPains.join(', ') : 'нет'}
Энергия утром/днём/вечером: ${form.energyMorning}/${form.energyAfternoon}/${form.energyEvening}
Эмоции: ${form.emotions.length ? form.emotions.join(', ') : 'не указаны'}
Уровень тревоги: ${form.anxietyLevel}/10
О чём тревога: ${form.anxietyAbout || 'не указано'}
Контроль над жизнью: ${form.controlFeeling}/10
Момент дня: ${form.memorableMoment || 'не указан'}
Стрессоры: ${form.stressFactors.length ? form.stressFactors.join(', ') : 'нет'}
Общение с близкими: ${form.socialContact || 'не указано'}
Питание: ${form.eating || 'не указано'}
Свободный рассказ: ${form.freeText || '(не заполнен)'}

Проанализируй и верни JSON.`
}

export async function POST(req: NextRequest) {
  const { form, checkin_id } = await req.json() as { form: DeepFormData; checkin_id?: string }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const checkinId: string = checkin_id ?? crypto.randomUUID()

  // Safety gate — if user flagged self-harm, skip AI and return crisis signal
  if (form.selfHarm === true) {
    return NextResponse.json({ id: checkinId, crisis: true })
  }

  // Load user profile for personalization
  let profileContext = ''
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, last_name, gender, birth_date, address_style, main_request, occupation')
      .eq('id', user.id)
      .single() as { data: UserProfile | null }

    if (profile) {
      const parts: string[] = []
      const fullName = [profile.name, profile.last_name].filter(Boolean).join(' ')
      if (fullName) parts.push(`Имя: ${fullName}`)
      if (profile.gender) parts.push(genderRu(profile.gender))
      if (profile.birth_date) parts.push(getAge(profile.birth_date))
      if (profile.main_request?.length) parts.push(`Основной запрос: ${profile.main_request.join(', ')}`)
      if (profile.occupation) parts.push(`Сфера: ${profile.occupation}`)

      const addressStyle = profile.address_style ?? 'ты'
      profileContext = `\nПОЛЬЗОВАТЕЛЬ: ${parts.join(', ')}.\nОбращение к пользователю: на ${addressStyle}.\n`
    }
  }

  let analysis: AnalysisResult = {
    reflection: '',
    patterns: '',
    hypothesis: '',
    forSpecialist: [],
    support: '',
  }

  try {
    const userMessage = buildPrompt(form)
    console.log('User message to Claude:', userMessage)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: profileContext + SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    console.log('Claude raw response:', rawText)
    const raw = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(raw)

    if (parsed.crisis) {
      return NextResponse.json({ id: checkinId, crisis: true })
    }

    analysis = parsed as AnalysisResult
  } catch (err) {
    console.error('Claude API or parse error:', err)
    const levelWord = form.wellbeing >= 7 ? 'хорошим' : form.wellbeing >= 5 ? 'умеренным' : 'непростым'
    analysis = {
      reflection: `Из того что ты описал(а), видно что сегодня был ${levelWord} день. Твоё самочувствие ${form.wellbeing}/10 и ${form.emotions.length ? `эмоции — ${form.emotions.slice(0, 3).join(', ')}` : 'твоё состояние'} говорят о многом.`,
      patterns: `Сон ${form.sleepHours} часов и уровень тревоги ${form.anxietyLevel}/10 могут влиять на общий энергетический фон. Стоит обратить внимание на эту связь.`,
      hypothesis: `Мне интересно, не связано ли это с накопленным напряжением которое ищет выход?`,
      forSpecialist: ['Общее эмоциональное состояние', 'Качество сна и его влияние', 'Источники стресса', 'Способы справляться с тревогой'],
      support: 'Ты молодец, что нашёл(а) время разобраться в своём состоянии — это важный шаг к себе.',
    }
  }

  // Update DB with structured insight + extract memory in parallel
  if (user && checkin_id) {
    const [{ error: updateErr }] = await Promise.all([
      supabase
        .from('checkins')
        .update({ ai_insight: JSON.stringify(analysis) })
        .eq('id', checkin_id)
        .eq('user_id', user.id),
      saveCheckinMemory(supabase, user.id, form, analysis),
    ])

    if (updateErr) console.error('Insight update error:', updateErr)
  }

  return NextResponse.json({ id: checkinId, ...analysis, form })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveCheckinMemory(supabase: any, userId: string, form: DeepFormData, analysis: AnalysisResult) {
  const candidates: { category: string; content: string; relevance: number }[] = []

  // High anxiety → triggers
  if (form.anxietyLevel >= 7 && form.anxietyAbout) {
    candidates.push({
      category: 'triggers',
      content: `Сильная тревога (${form.anxietyLevel}/10): ${form.anxietyAbout}`,
      relevance: Math.min(10, form.anxietyLevel),
    })
  }

  // Stressors → triggers
  if (form.stressFactors.length > 0) {
    candidates.push({
      category: 'triggers',
      content: `Стрессоры: ${form.stressFactors.join(', ')}`,
      relevance: 6,
    })
  }

  // Low wellbeing + reason → patterns
  if (form.wellbeing <= 4 && form.wellbeingReason) {
    candidates.push({
      category: 'patterns',
      content: `Низкое самочувствие (${form.wellbeing}/10): ${form.wellbeingReason}`,
      relevance: 7,
    })
  }

  // Dominant emotions → patterns
  if (form.emotions.length > 0) {
    candidates.push({
      category: 'patterns',
      content: `Отмечает эмоции: ${form.emotions.slice(0, 4).join(', ')}`,
      relevance: 5,
    })
  }

  // Top specialist topic → goals
  if (analysis.forSpecialist.length > 0) {
    candidates.push({
      category: 'goals',
      content: `Тема для работы: ${analysis.forSpecialist[0]}`,
      relevance: 7,
    })
  }

  for (const mem of candidates) {
    try {
      const { data: existing } = await supabase
        .from('user_memory')
        .select('id, relevance')
        .eq('user_id', userId)
        .eq('category', mem.category)
        .ilike('content', `%${mem.content.slice(0, 40)}%`)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('user_memory')
          .update({
            relevance: Math.min(10, existing.relevance + 1),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('user_memory')
          .insert({ user_id: userId, ...mem })
      }
    } catch (e) {
      console.error('Memory save error:', e)
    }
  }
}
