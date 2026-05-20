import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

const SYSTEM_PROMPT = `
Ты опытный психолог-консультант. Анализируй ТОЛЬКО то что
человек написал — не додумывай, не обобщай.

ОБЯЗАТЕЛЬНЫЕ ПРАВИЛА КОНКРЕТНОСТИ:

1. ОТРАЖЕНИЕ — используй точные цифры и слова человека:
   ПЛОХО: "Твоё самочувствие говорит о многом"
   ХОРОШО: "Ты оценил самочувствие на 5/10 и написал что
   причина — [конкретная фраза из ответа]"

   Начни с: "Из того что ты описал(а)..."
   Назови конкретные эмоции которые человек выбрал.
   Упомяни конкретные цифры: сон N часов, тревога N/10.

2. ПАТТЕРНЫ — связывай конкретные данные между собой:
   ПЛОХО: "Сон и тревога могут влиять друг на друга"
   ХОРОШО: "Ты спал(а) [N] часов и отметил(а) тревогу [N]/10
   — это конкретная связь которую стоит отследить"

   Если человек отметил стрессоры — назови их конкретно.
   Если выбрал эмоции — свяжи их с контекстом дня.
   Если написал свободный текст — процитируй ключевую фразу.

3. ГИПОТЕЗА — строй только на том что человек написал:
   ПЛОХО: "Мне интересно, не связано ли это с накопленным напряжением"
   ХОРОШО: "Ты упомянул [конкретное] — мне интересно,
   не связано ли твоё [конкретная эмоция] именно с этим?"

   Форма: "Мне интересно, не связано ли..."
   Никогда не повторяй одну и ту же гипотезу дважды.

4. ТЕМЫ ДЛЯ СПЕЦИАЛИСТА — только актуальные этому человеку:
   Формат: "глагол + конкретная тема из его ответов"

   ПЛОХО: "Обсудить источники стресса"
   ХОРОШО: "Исследовать связь между [конкретный стрессор
   который назвал человек] и [конкретная эмоция которую выбрал]"

   Если человек написал про работу — тема про работу.
   Если написал про одиночество — тема про одиночество.
   Никаких общих тем если они не упомянуты в ответах.

5. ПОДДЕРЖКА — одна тёплая фраза без клише:
   Нельзя: "Всё будет хорошо", "Ты молодец", "Это нормально"
   Можно: что-то конкретное про этого человека в этот день.

ЖЁСТКИЕ ПРАВИЛА:
- Отвечай только на русском
- Не ставь диагнозов
- Не используй DSM/МКБ термины
- Длина каждой секции: 2-3 предложения максимум
- Если человек упомянул суицидальные мысли —
  только кризисные ресурсы, никакого анализа:
  Казахстан: 150, Россия: 8-800-2000-122, Украина: 7333

Верни ответ СТРОГО в формате JSON (без markdown, без \`\`\`, только чистый JSON):
{
  "reflection": "2-3 предложения начиная с 'Из того что ты описал(а)...'",
  "patterns": "2-3 предложения о конкретных паттернах с цифрами",
  "hypothesis": "1-2 предложения в форме вопроса про конкретное",
  "forSpecialist": ["конкретная тема 1", "конкретная тема 2", "конкретная тема 3", "конкретная тема 4"],
  "support": "1 конкретная фраза без клише"
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
      system: SYSTEM_PROMPT,
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
