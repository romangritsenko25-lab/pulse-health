import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function replyToTelegram(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

export async function POST(req: Request) {
  const body = await req.json()
  const message = body?.message
  if (!message?.text || !message?.chat?.id) {
    return NextResponse.json({ ok: true })
  }

  const chatId: number = message.chat.id
  const userText: string = message.text
  const allowedChatId = process.env.TELEGRAM_CHAT_ID

  if (allowedChatId && String(chatId) !== String(allowedChatId)) {
    await replyToTelegram(chatId, 'Доступ закрыт.')
    return NextResponse.json({ ok: true })
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `Ты ассистент Романа — создателя приложения Metanoia AI (психологический помощник на Next.js + Supabase).
Отвечай кратко и по делу на русском языке. Если речь о задачах в коде — описывай план, не пиши сам код в Telegram.`,
      messages: [{ role: 'user', content: userText }],
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : 'Не понял запрос.'
    await replyToTelegram(chatId, reply)
  } catch {
    await replyToTelegram(chatId, 'Ошибка при обращении к Claude. Попробуй ещё раз.')
  }

  return NextResponse.json({ ok: true })
}
