import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const anthropic = new Anthropic()

const FREE_LIMIT = 5
const PRO_LIMIT = 20

function adminClient() {
  return createSupabaseClient(
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

    const { data: sub } = await admin
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
    const isPro = sub?.plan === 'pro'
    const limit = isPro ? 20 : 5
    const today = new Date().toISOString().split('T')[0]

    const { data: countRow } = await supabase
      .from('ai_message_counts')
      .select('count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    return NextResponse.json({ used: countRow?.count ?? 0, limit })
  } catch (err) {
    console.error('personal-ai count error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, conversation_id } = await req.json() as {
      messages: { role: 'user' | 'assistant'; content: string }[]
      conversation_id?: string
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = user.id
    const admin = adminClient()

    // Check subscription
    const { data: sub } = await admin
      .from('subscriptions').select('plan, status').eq('user_id', userId).eq('status', 'active').maybeSingle()
    const isPro = sub?.plan === 'pro'
    const limit = isPro ? PRO_LIMIT : FREE_LIMIT
    const today = new Date().toISOString().split('T')[0]

    // Check daily limit
    const { data: countRow } = await supabase
      .from('ai_message_counts')
      .select('count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    const usedCount = countRow?.count ?? 0
    if (usedCount >= limit) {
      return NextResponse.json({
        error: 'limit_reached',
        message: `Лимит сообщений на сегодня исчерпан. ${isPro ? '' : 'Upgrade до Pro для 20 сообщений в день.'}`,
        used: usedCount,
        limit,
      }, { status: 429 })
    }

    // Load user context in parallel
    const [{ data: profile }, checkins, journal, memory] = await Promise.all([
      supabase.from('profiles').select('name').eq('id', userId).single(),
      supabase.from('checkins')
        .select('created_at, wellbeing, mood, context, free_text, deep_data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(14),
      supabase.from('journal_entries')
        .select('created_at, content, mood')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('user_memory')
        .select('category, content, relevance')
        .eq('user_id', userId)
        .order('relevance', { ascending: false })
        .limit(15),
    ])

    const name = profile?.name ?? 'пользователь'

    const SYSTEM_PROMPT = `
Ты персональный AI-ассистент Metanoia AI.
Твоя роль — поддерживающий собеседник между сессиями
с психологом. Ты НЕ психолог, НЕ ставишь диагнозов.

ТЕОРЕТИЧЕСКАЯ БАЗА:

КПТ (когнитивно-поведенческая терапия):
- Связь мыслей, эмоций и поведения
- Замечай когнитивные искажения мягко, без ярлыков
- Помогай исследовать автоматические мысли

DBT (диалектическая поведенческая терапия):
- Принятие И изменение одновременно
- Валидация переживаний как первый шаг
- Навыки осознанности и регуляции эмоций

ACT (терапия принятия и ответственности):
- Ценности важнее правил
- Дефузия от мыслей — мысль это не факт
- Психологическая гибкость

МОТИВАЦИОННОЕ ИНТЕРВЬЮИРОВАНИЕ:
- Не убеждай — исследуй вместе
- Отражай, не советуй
- Усиливай внутреннюю мотивацию

ПОРТРЕТ ПОЛЬЗОВАТЕЛЯ:
Имя: ${name}

Долгосрочная память:
${memory.data?.map((m: { category: string; content: string }) => `[${m.category}] ${m.content}`).join('\n') || 'Пока пусто — это первый диалог'}

Последние 14 дней (чек-ины):
${checkins.data?.map((c: { created_at: string; wellbeing: number | null; mood: string | null }) =>
  `${new Date(c.created_at).toLocaleDateString('ru')} — самочувствие: ${c.wellbeing}/10, настроение: ${c.mood || '—'}`
).join('\n') || 'Нет данных'}

Последние записи журнала:
${journal.data?.map((j: { created_at: string; content: string }) =>
  `${new Date(j.created_at).toLocaleDateString('ru')}: ${j.content?.slice(0, 150)}...`
).join('\n') || 'Нет записей'}

ПРАВИЛА ОБЩЕНИЯ:
- Язык: только русский
- Тон: тёплый, принимающий, без осуждения
- Длина ответов: 2-4 предложения обычно,
  развёрнуто только когда человек явно хочет глубины
- Ссылайся на конкретные записи пользователя:
  "Три дня назад ты писал что..."
  "Я заметил что последнюю неделю..."
- Задавай один вопрос за раз, не несколько
- Помогай формулировать темы для специалиста
- Замечай прогресс и называй его

РЕЖИМ ПЕРВЫХ СЕССИЙ:
Если в истории диалога меньше 6 сообщений от пользователя —
ты в режиме сбора информации.
После каждого содержательного ответа пользователя добавляй:

"→ Добавлено в темы для специалиста: [краткая суть]"

Примеры:
"→ Добавлено в темы для специалиста: конфликт с руководством длится 2 года"
"→ Добавлено в темы для специалиста: апатия и потеря интереса к работе"

Это показывает пользователю что разговор строит
реальный документ для приёма.

После 6 сообщений — этот маркер не нужен,
человек уже понимает ценность.

ЗАПРЕЩЕНО:
- Диагнозы и медицинские термины как ярлыки
- "Ты должен", "тебе надо", "попробуй"
- Советы без запроса
- Длинные монологи-лекции
- Клише типа "это нормально", "всё будет хорошо"

КРИЗИСНЫЙ ПРОТОКОЛ:
Если есть признаки суицидальных мыслей —
немедленно прекрати обычный диалог и напиши:
"Я слышу тебя. Пожалуйста, позвони сейчас:
Казахстан: 150 (бесплатно)
Россия: 8-800-2000-122
Украина: 7333"
`

    // Build messages for Claude:
    // if conversation_id — load history from DB and append new user message
    // if no conversation_id — use messages as-is
    let claudeMessages: { role: 'user' | 'assistant'; content: string }[]
    let convId = conversation_id ?? null

    // Extract the last user message from incoming messages
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')

    if (convId) {
      const { data: dbMessages } = await admin
        .from('ai_messages')
        .select('role, content')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(50)

      claudeMessages = [
        ...(dbMessages ?? []) as { role: 'user' | 'assistant'; content: string }[],
        ...(lastUserMessage ? [lastUserMessage] : []),
      ]
    } else {
      claudeMessages = messages
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: claudeMessages,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Save to conversation
    if (!convId) {
      // Create new conversation with title from first user message
      const title = (lastUserMessage?.content ?? 'Новый чат').slice(0, 50)
      const { data: newConv } = await admin
        .from('ai_conversations')
        .insert({ user_id: userId, title })
        .select('id')
        .single()
      convId = newConv?.id ?? null
    }

    if (convId && lastUserMessage) {
      // Save user message + AI response, update conversation timestamp
      await Promise.all([
        admin.from('ai_messages').insert([
          { conversation_id: convId, role: 'user', content: lastUserMessage.content },
          { conversation_id: convId, role: 'assistant', content: text },
        ]),
        admin.from('ai_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', convId),
      ])
    }

    // Increment daily count
    await supabase.from('ai_message_counts').upsert(
      { user_id: userId, date: today, count: usedCount + 1 },
      { onConflict: 'user_id,date' }
    )

    // Update long-term memory after 2+ user messages (fire and forget)
    const userMessageCount = claudeMessages.filter(m => m.role === 'user').length
    if (userMessageCount >= 2) {
      updateUserMemory(userId, claudeMessages).catch(console.error)
    }

    return NextResponse.json({ text, conversation_id: convId, used: usedCount + 1, limit })
  } catch (err) {
    console.error('personal-ai error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function updateUserMemory(
  userId: string,
  conversationHistory: { role: string; content: string }[]
) {
  const admin = adminClient()

  const conversationText = conversationHistory
    .map(m => `${m.role === 'user' ? 'Пользователь' : 'AI'}: ${m.content}`)
    .join('\n')

  const memoryPrompt = `
Проанализируй этот диалог и извлеки 2-3 важных факта
о пользователе для долгосрочной памяти.

Диалог: ${conversationText}

Верни JSON массив:
[
  {"category": "triggers", "content": "...", "relevance": 8},
  {"category": "patterns", "content": "...", "relevance": 7}
]

Категории: triggers, patterns, goals, progress, style, events
relevance: 1-10 (10 = очень важно)
Только JSON, без объяснений.
`

  const memResponse = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{ role: 'user', content: memoryPrompt }],
  })

  const rawText = memResponse.content[0].type === 'text' ? memResponse.content[0].text : '[]'
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  let memories: { category: string; content: string; relevance: number }[]
  try {
    memories = JSON.parse(cleaned)
  } catch {
    return
  }

  if (!Array.isArray(memories)) return

  for (const mem of memories) {
    if (!mem.category || !mem.content) continue

    const { data: existing } = await admin
      .from('user_memory')
      .select('id, relevance')
      .eq('user_id', userId)
      .eq('category', mem.category)
      .ilike('content', `%${mem.content.slice(0, 30)}%`)
      .maybeSingle()

    if (existing) {
      await admin
        .from('user_memory')
        .update({ relevance: Math.max(existing.relevance, mem.relevance), updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await admin
        .from('user_memory')
        .insert({ user_id: userId, category: mem.category, content: mem.content, relevance: mem.relevance })
    }
  }
}
