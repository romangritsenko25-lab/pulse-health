import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ insight: null })

  const { data: checkins } = await supabase
    .from('checkins')
    .select('wellbeing, sleep, energy, mood, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(7)

  if (!checkins || checkins.length < 2) {
    return NextResponse.json({
      insight: 'Заполни ещё несколько опросов — и я найду твои паттерны.',
    })
  }

  const summary = checkins
    .map((c) => {
      const d = new Date(c.created_at).toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'short',
      })
      return `${d}: самочувствие ${c.wellbeing}/10, настроение: ${c.mood || 'не указано'}, сон: ${c.sleep || '—'}`
    })
    .join('\n')

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 80,
      system: 'Ты аналитик самочувствия. Смотришь на данные за несколько дней и находишь один самый заметный тренд. Отвечай ОДНИМ предложением на русском, тепло и конкретно. Без вводных "Я вижу" или "Замечаю". Сразу называй тренд.',
      messages: [{
        role: 'user',
        content: `Данные:\n${summary}\n\nОдин главный тренд:`,
      }],
    })

    const insight = message.content[0].type === 'text'
      ? message.content[0].text.trim()
      : null

    return NextResponse.json({ insight })
  } catch (err) {
    console.error('Trend API error:', err)
    return NextResponse.json({ insight: null })
  }
}
