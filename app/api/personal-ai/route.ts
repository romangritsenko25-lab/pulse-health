import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic()

const FREE_LIMIT = 5
const PRO_LIMIT = 20

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json() as { messages: { role: 'user' | 'assistant'; content: string }[] }
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check subscription
    const { data: sub } = await supabase
      .from('subscriptions').select('status').eq('user_id', user.id).eq('status', 'active').maybeSingle()
    const isPro = !!sub
    const limit = isPro ? PRO_LIMIT : FREE_LIMIT
    const today = new Date().toISOString().split('T')[0]

    // Check daily limit
    const { data: countRow } = await supabase
      .from('ai_message_counts')
      .select('count')
      .eq('user_id', user.id)
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

    // Load user context
    const [{ data: profile }, { data: checkins }, { data: journalEntries }] = await Promise.all([
      supabase.from('profiles').select('name').eq('id', user.id).single(),
      supabase.from('checkins').select('wellbeing, mood, created_at').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(14),
      supabase.from('journal_entries').select('content, mood, created_at').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(20),
    ])

    const name = profile?.name ?? 'пользователь'

    const checkinContext = (checkins ?? []).map((c) => {
      const d = new Date(c.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
      return `${d}: самочувствие ${c.wellbeing ?? '?'}/10${c.mood ? `, настроение ${c.mood}` : ''}`
    }).join('\n')

    const journalContext = (journalEntries ?? []).map((e) => {
      const d = new Date(e.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
      return `${d}${e.mood ? ` [${e.mood}]` : ''}: ${e.content.slice(0, 200)}`
    }).join('\n\n')

    const systemPrompt = `Ты персональный AI-ассистент Metanoia AI для пользователя ${name}.
Ты знаешь историю этого человека по его записям.
Ты НЕ психолог и НЕ ставишь диагнозов.
Ты поддерживающий собеседник который помогает человеку понять себя между сессиями со специалистом.

ИСТОРИЯ ЧЕК-ИНОВ (последние 14):
${checkinContext || 'Нет данных'}

ЗАПИСИ ЖУРНАЛА (последние 20):
${journalContext || 'Нет записей'}

Правила:
- Отвечай на русском, тепло и принимающе
- Ссылайся на конкретные записи когда уместно: "Три дня назад ты писал..."
- Помогай формулировать что принести специалисту
- При упоминании суицидальных мыслей: дай ресурсы — KZ: 150, RU: 8-800-2000-122, UA: 7333
- НЕ давай медицинских советов
- Ответы 2-4 предложения, не монологи`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: systemPrompt,
      messages,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Increment count
    await supabase.from('ai_message_counts').upsert(
      { user_id: user.id, date: today, count: usedCount + 1 },
      { onConflict: 'user_id,date' }
    )

    return NextResponse.json({ text, used: usedCount + 1, limit })
  } catch (err) {
    console.error('personal-ai error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
