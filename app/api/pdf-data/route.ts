import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = user.id
    const admin = adminClient()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [
      { data: lastCheckin },
      { data: journalEntries },
      { data: conversations },
      { data: userMemory },
      { data: profile },
      { data: specialistLink },
    ] = await Promise.all([
      admin.from('checkins')
        .select('wellbeing, sleep, energy, mood, notes, deep_data, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin.from('journal_entries')
        .select('content, created_at')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(20),
      admin.from('ai_conversations')
        .select('id')
        .eq('user_id', userId),
      admin.from('user_memory')
        .select('category, content, relevance')
        .eq('user_id', userId)
        .order('relevance', { ascending: false })
        .limit(10),
      admin.from('profiles')
        .select('name, email')
        .eq('id', userId)
        .maybeSingle(),
      admin.from('specialist_clients')
        .select('specialist_id')
        .eq('client_id', userId)
        .maybeSingle(),
    ])

    let aiMessages: { content: string; role: string }[] = []
    if (conversations && conversations.length > 0) {
      const convIds = conversations.map((c: { id: string }) => c.id)
      const { data: msgs } = await admin.from('ai_messages')
        .select('content, role, created_at')
        .in('conversation_id', convIds)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(30)
      aiMessages = msgs ?? []
    }

    let specialist: { name: string; specialty: string } | null = null
    if (specialistLink?.specialist_id) {
      const { data: spec } = await admin.from('specialists')
        .select('name, specialty')
        .eq('id', specialistLink.specialist_id)
        .maybeSingle()
      if (spec) specialist = spec
    }

    const rawDeepData = lastCheckin?.deep_data
    const deepData: Record<string, unknown> = typeof rawDeepData === 'string'
      ? JSON.parse(rawDeepData)
      : (rawDeepData ?? {})

    const emotions: string[] = Array.isArray(deepData.emotions) ? deepData.emotions as string[] : []
    const stressors: string[] = Array.isArray(deepData.stressFactors) ? deepData.stressFactors as string[] : []
    const energyMorning = (deepData.energyMorning as number | undefined) ?? null
    const energyDay = (deepData.energyAfternoon as number | undefined) ?? null
    const energyEvening = (deepData.energyEvening as number | undefined) ?? null
    const anxiety = (deepData.anxietyLevel as number | undefined) ?? null
    const control = (deepData.controlFeeling as number | undefined) ?? null
    const freeText = (deepData.freeText as string | undefined) ?? lastCheckin?.notes ?? null
    const sleepHours = (deepData.sleepHours as number | undefined) ?? null

    const dataForClaude = `
ПОСЛЕДНИЙ ЧЕК-ИН (${lastCheckin?.created_at ? new Date(lastCheckin.created_at).toLocaleDateString('ru-RU') : 'нет данных'}):
- Самочувствие: ${lastCheckin?.wellbeing ?? '—'}/10
- Тревога: ${anxiety ?? '—'}/10
- Контроль над жизнью: ${control ?? '—'}/10
- Сон: ${lastCheckin?.sleep ?? '—'} часов
- Энергия: утро ${energyMorning ?? '—'}, день ${energyDay ?? '—'}, вечер ${energyEvening ?? '—'}
- Эмоции: ${emotions.length ? emotions.join(', ') : '—'}
- Стрессоры: ${stressors.length ? stressors.join(', ') : '—'}
${freeText ? `- Своими словами: ${freeText}` : ''}

ЖУРНАЛ ЗА 30 ДНЕЙ (${journalEntries?.length ?? 0} записей):
${journalEntries?.slice(0, 5).map((e: { content: string; created_at: string }) =>
  `[${new Date(e.created_at).toLocaleDateString('ru-RU')}]: ${e.content.substring(0, 200)}`
).join('\n') ?? 'Нет записей'}

ДИАЛОГИ С AI (последние ${aiMessages.length} сообщений за 30 дней):
${aiMessages.slice(0, 10).filter((m) => m.role === 'user').map((m) => m.content.substring(0, 150)).join('\n') ?? 'Нет диалогов'}

ПАМЯТЬ О ПОЛЬЗОВАТЕЛЕ:
${userMemory?.map((m: { category: string; content: string }) => `[${m.category}]: ${m.content}`).join('\n') ?? 'Нет данных'}
    `.trim()

    const anthropic = new Anthropic()
    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `Ты опытный клинический психолог.
На основе данных пользователя напиши профессиональное резюме его психологического состояния для коллеги-специалиста.

ПРАВИЛА:
- Пиши от третьего лица: "Клиент отмечает...", "Прослеживается...", "Характерно..."
- НЕ цитируй источники (не упоминай журнал, AI-чат, чек-ин)
- НЕ ставь диагнозов
- 3-4 абзаца максимум
- Выдели основные паттерны и триггеры
- Язык: русский, профессиональный но понятный

После резюме добавь строку:
TOPICS: тема1 | тема2 | тема3 | тема4

Темы должны быть конкретными и полезными для сессии (не общими).`,
      messages: [{ role: 'user', content: `Данные пользователя:\n\n${dataForClaude}` }],
    })

    const rawText = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : ''
    const topicsMatch = rawText.match(/TOPICS:\s*(.+)$/m)
    const topicsRaw = topicsMatch ? topicsMatch[1] : ''
    const topics = topicsRaw.split('|').map((t: string) => t.trim()).filter(Boolean)
    const resume = rawText.replace(/TOPICS:.*$/m, '').trim()

    const userName = profile?.name ?? profile?.email ?? 'Пользователь'
    const date = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

    return NextResponse.json({
      checkin: {
        wellbeing: lastCheckin?.wellbeing,
        sleep: sleepHours ?? lastCheckin?.sleep,
        anxiety,
        control,
        energyMorning,
        energyDay,
        energyEvening,
        emotions,
        stressors,
        freeText,
        date: lastCheckin?.created_at,
      },
      resume,
      topics,
      specialist,
      userName,
      date,
    })
  } catch (err) {
    console.error('[pdf-data]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
