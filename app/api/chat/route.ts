import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic()

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  messages: Message[]
  analysis: {
    reflection?: string
    patterns?: string
    hypothesis?: string
    forSpecialist?: string[]
    support?: string
  }
}

function buildSystemPrompt(analysis: ChatRequest['analysis']): string {
  const sections: string[] = []
  if (analysis.reflection) sections.push(`ОТРАЖЕНИЕ: ${analysis.reflection}`)
  if (analysis.patterns) sections.push(`ПАТТЕРНЫ: ${analysis.patterns}`)
  if (analysis.hypothesis) sections.push(`ГИПОТЕЗА: ${analysis.hypothesis}`)
  if (analysis.forSpecialist?.length) {
    sections.push(`ТЕМЫ ДЛЯ СПЕЦИАЛИСТА:\n${analysis.forSpecialist.map((t, i) => `${i + 1}. ${t}`).join('\n')}`)
  }
  if (analysis.support) sections.push(`ПОДДЕРЖКА: ${analysis.support}`)

  return `КРИТИЧЕСКИ ВАЖНО: Отвечай ТОЛЬКО на русском языке. Никаких иероглифов, никакого английского, никакого смешения языков. Только русский.

Ты опытный психолог-консультант. Ты только что провёл анализ состояния пользователя.

${sections.length ? sections.join('\n\n') : '(анализ не передан)'}

Отвечай: только на русском языке, тепло и принимающе, коротко (2-4 предложения), без диагнозов. Опирайся на анализ выше.`
}

export async function POST(req: NextRequest) {
  let body: ChatRequest
  try {
    body = await req.json() as ChatRequest
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 })
  }

  const { messages, analysis } = body
  if (!messages?.length || !analysis) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const lastMsg = messages[messages.length - 1].content.toLowerCase()
  const crisisWords = ['суицид', 'убить себя', 'не хочу жить', 'покончить']
  if (crisisWords.some((w) => lastMsg.includes(w))) {
    return NextResponse.json({
      reply: 'Я слышу тебя. Пожалуйста, позвони: Казахстан 150 · Россия 8-800-2000-122 · Украина 7333. Это бесплатно.',
    })
  }

  // Auth — optional, memory saved only if logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  try {
    const userMsgCount = messages.filter(m => m.role === 'user').length

    const [response] = await Promise.all([
      anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: buildSystemPrompt(analysis),
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    ])

    const reply = response.content[0]?.type === 'text'
      ? response.content[0].text.trim()
      : 'Не удалось получить ответ.'

    // Save insights to memory after 2+ user messages
    if (user && userMsgCount >= 2) {
      saveCheckinChatMemory(supabase, user.id, messages, analysis).catch(console.error)
    }

    return NextResponse.json({ reply })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('Chat (Claude) error:', detail)
    return NextResponse.json({ error: 'server_error', detail }, { status: 500 })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveCheckinChatMemory(supabase: any, userId: string, messages: Message[], analysis: ChatRequest['analysis']) {
  const conversationText = messages
    .map(m => `${m.role === 'user' ? 'Пользователь' : 'AI'}: ${m.content}`)
    .join('\n')

  const contextText = [
    analysis.reflection && `Контекст анализа: ${analysis.reflection}`,
    analysis.patterns && `Паттерны: ${analysis.patterns}`,
  ].filter(Boolean).join('\n')

  const prompt = `Проанализируй уточняющий диалог после чекина. Извлеки конкретные факты которые пользователь раскрыл о себе.

Контекст чекина:
${contextText}

Диалог:
${conversationText}

Категории:
- triggers: конкретные ситуации/темы вызывающие тревогу
- patterns: повторяющееся поведение или эмоции
- goals: что хочет изменить или достичь
- events: значимые события которые назвал
- relationships: важные люди и динамика с ними
- resources: что помогает справляться

Правила: relevance >= 6 только, content конкретный ("конфликт с боссом", не "проблемы на работе"), максимум 2 факта.
Если ничего конкретного — memories: []

Верни только JSON:
{"memories": [{"category": "triggers", "content": "...", "relevance": 7}]}`

  const memResponse = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const rawText = memResponse.content[0].type === 'text' ? memResponse.content[0].text : '{}'
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  let parsed: { memories?: { category: string; content: string; relevance: number }[] }
  try { parsed = JSON.parse(cleaned) } catch { return }

  if (!Array.isArray(parsed.memories)) return

  for (const mem of parsed.memories) {
    if (!mem.category || !mem.content || mem.relevance < 6) continue

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
        .update({ relevance: Math.min(10, existing.relevance + 1), updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('user_memory')
        .insert({ user_id: userId, category: mem.category, content: mem.content, relevance: mem.relevance })
    }
  }
}
