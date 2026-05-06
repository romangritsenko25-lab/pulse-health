import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

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

  try {
    const anthropic = new Anthropic()

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: buildSystemPrompt(analysis),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })

    const reply = response.content[0]?.type === 'text'
      ? response.content[0].text.trim()
      : 'Не удалось получить ответ.'
    return NextResponse.json({ reply })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('Chat (Claude) error:', detail)
    return NextResponse.json({ error: 'server_error', detail }, { status: 500 })
  }
}
