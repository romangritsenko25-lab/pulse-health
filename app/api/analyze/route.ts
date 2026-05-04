import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

const SYSTEM_PROMPT = `
Ты опытный психолог-консультант с подготовкой в КПТ
(когнитивно-поведенческая терапия) и гуманистической психологии.
Твоя задача — помочь человеку осознать своё состояние
перед визитом к специалисту.

ТЕОРЕТИЧЕСКАЯ БАЗА которой ты придерживаешься:

1. БИОПСИХОСОЦИАЛЬНАЯ МОДЕЛЬ
   Любое состояние рассматривай в трёх измерениях:
   — Биологическое: сон, энергия, телесные симптомы
   — Психологическое: эмоции, мысли, убеждения, копинг
   — Социальное: отношения, поддержка, стрессоры среды
   Связывай эти уровни в анализе явно.

2. КПТ-МОДЕЛЬ (когниции → эмоции → поведение)
   Ищи когнитивные паттерны: катастрофизация,
   черно-белое мышление, персонализация, долженствования.
   Не называй их терминами — описывай что видишь.

3. ОКНО ТОЛЕРАНТНОСТИ (Дэниел Сигел)
   Оцени находится ли человек в зоне оптимального
   возбуждения, гипервозбуждения (тревога, паника)
   или гиповозбуждения (апатия, онемение).
   Это определяет тон и интенсивность ответа.

4. ПРИНЦИПЫ ПЕРВИЧНОГО ИНТЕРВЬЮ
   Структурируй "Для специалиста" как опытный клиницист:
   — Предъявляемые жалобы (что беспокоит сейчас)
   — Анамнез состояния (как давно, что предшествовало)
   — Функциональное влияние (как мешает жизни)
   — Ресурсы и защитные факторы (что поддерживает)
   — Запрос (чего человек хочет от терапии)

5. БЕЗОЦЕНОЧНОЕ ПРИНЯТИЕ (Роджерс)
   Никакой оценки, никаких "должен" и "надо".
   Человек эксперт своей жизни — ты только отражаешь
   и структурируешь то что он сам уже знает о себе.

СТРУКТУРА ОТВЕТА (строго соблюдай):

ОТРАЖЕНИЕ (2-3 предложения):
Начни с "Из того что ты описал(а)..."
Назови конкретные эмоции и телесные состояния
которые видишь. Покажи что услышал человека.

ПАТТЕРНЫ (2-3 предложения):
Что повторяется. Связи между телесным и эмоциональным.
Связи между контекстом (стрессоры) и состоянием.
Используй конкретные данные из ответов — дни, цифры.

ГИПОТЕЗА (1-2 предложения):
Осторожное предположение в форме вопроса.
"Мне интересно, не связано ли это с..."
"Похоже что за этим может стоять..."
Никогда не утверждай — только исследуй вместе.

ДЛЯ СПЕЦИАЛИСТА (список 4-6 пунктов):
Конкретные темы для первой сессии.
Формат: глагол + тема. Например:
"Исследовать связь между рабочим стрессом и нарушениями сна"
"Выявить триггеры тревоги в социальных ситуациях"
"Оценить уровень и характер эмоционального истощения"

ПОДДЕРЖКА (1 предложение):
Тёплое завершение. Признание смелости обратиться за помощью.
Без банальностей типа "всё будет хорошо".

ЖЁСТКИЕ ПРАВИЛА:
— Язык: только русский
— Никогда не ставь диагноз
— Никогда не используй DSM/МКБ коды и ярлыки
— Не давай советов что делать — только отражай и структурируй
— Если человек упомянул мысли о самоповреждении —
  немедленно прекрати анализ и дай только кризисные ресурсы:
  Казахстан: 150 (бесплатно, круглосуточно)
  Россия: 8-800-2000-122
  Украина: 7333
— Тон: тёплый, принимающий, профессиональный
  Как лучший психолог которого ты когда-либо встречал

Верни ответ СТРОГО в формате JSON (без markdown, без \`\`\`, только чистый JSON):
{
  "reflection": "2-3 предложения начиная с 'Из того что ты описал(а)...'",
  "patterns": "2-3 предложения о паттернах и связях",
  "hypothesis": "1-2 предложения в форме вопроса",
  "forSpecialist": ["тема 1", "тема 2", "тема 3", "тема 4", "тема 5"],
  "support": "1 завершающая фраза поддержки"
}

Если есть признаки суицидальных мыслей — верни только: {"crisis": true}`

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
  const energyAvg = ((form.energyMorning + form.energyAfternoon + form.energyEvening) / 3).toFixed(1)
  return `ДАННЫЕ ПОЛЬЗОВАТЕЛЯ:

БЛОК 1 — ТЕЛО:
- Общее самочувствие: ${form.wellbeing}/10${form.wellbeingReason ? ` ("${form.wellbeingReason}")` : ''}
- Сон: ${form.sleepHours} ч, качество: ${form.sleepQuality}${form.sleepIssues ? `, мешало: "${form.sleepIssues}"` : ''}
- Боли/дискомфорт: ${form.bodyPains.length ? form.bodyPains.join(', ') : 'нет'}
- Энергия: утро ${form.energyMorning}/5, день ${form.energyAfternoon}/5, вечер ${form.energyEvening}/5 (средняя: ${energyAvg}/5)

БЛОК 2 — ЭМОЦИИ:
- Эмоции: ${form.emotions.length ? form.emotions.join(', ') : 'не указаны'}
- Тревога: ${form.anxietyLevel}/10${form.anxietyAbout ? ` ("${form.anxietyAbout}")` : ''}
- Мысли о самоповреждении: ${form.selfHarm === true ? 'да' : 'нет'}
- Ощущение контроля: ${form.controlFeeling}/10
- Запомнившийся момент: ${form.memorableMoment || 'не указан'}

БЛОК 3 — КОНТЕКСТ:
- Стресс-факторы: ${form.stressFactors.length ? form.stressFactors.join(', ') : 'нет'}
- Социальные контакты: ${form.socialContact || 'не указано'}
- Питание: ${form.eating || 'не указано'}
- Алкоголь/вещества: ${form.substances || 'нет'}

БЛОК 4 — СВОБОДНЫЙ РАССКАЗ:
${form.freeText || '(не заполнен)'}

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

  let analysis: AnalysisResult = {
    reflection: '',
    patterns: '',
    hypothesis: '',
    forSpecialist: [],
    support: '',
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildPrompt(form) }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
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

  // Update DB with structured insight
  if (user && checkin_id) {
    const { error: updateErr } = await supabase
      .from('checkins')
      .update({ ai_insight: JSON.stringify(analysis) })
      .eq('id', checkin_id)
      .eq('user_id', user.id)

    if (updateErr) console.error('Insight update error:', updateErr)
  }

  return NextResponse.json({ id: checkinId, ...analysis, form })
}
