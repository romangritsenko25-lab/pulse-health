import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'

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

  return `Ты опытный психолог-консультант. Ты только что провёл анализ состояния пользователя и получил следующие выводы:

${sections.join('\n\n')}

Теперь пользователь задаёт уточняющие вопросы по этому анализу. Отвечай:
- На русском языке
- Тепло, принимающе, без осуждения
- Опираясь на уже проведённый анализ
- Без постановки диагнозов
- Коротко (2-4 предложения) — это диалог, не монолог
- Если вопрос уходит далеко от анализа, мягко верни разговор к нему`
}

export async function POST(req: NextRequest) {
  const { messages, analysis } = await req.json() as ChatRequest

  if (!messages?.length || !analysis) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  // Safety: refuse if any message contains crisis signals
  const lastMsg = messages[messages.length - 1].content.toLowerCase()
  const crisisWords = ['суицид', 'убить себя', 'не хочу жить', 'покончить']
  if (crisisWords.some((w) => lastMsg.includes(w))) {
    return NextResponse.json({
      reply: 'Я слышу тебя. Пожалуйста, позвони на линию помощи прямо сейчас: Казахстан 150 · Россия 8-800-2000-122 · Украина 7333. Это бесплатно и анонимно.',
    })
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: buildSystemPrompt(analysis),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })

    const reply = message.content[0].type === 'text'
      ? message.content[0].text.trim()
      : 'Не удалось получить ответ.'

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
