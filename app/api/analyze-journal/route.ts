import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { period = 7 } = await req.json() as { period?: number }
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: 3 analyses per day for free users
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    const isPro = !!sub

    if (!isPro) {
      const dayStart = new Date()
      dayStart.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('journal_analysis_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', dayStart.toISOString())

      if ((count ?? 0) >= 3) {
        return NextResponse.json(
          { error: 'limit_reached', message: 'Достигнут дневной лимит (3 анализа). Обновитесь до Pro для безлимитного доступа.' },
          { status: 429 }
        )
      }
    }

    const since = new Date()
    since.setDate(since.getDate() - period)

    const { data: entries, error: dbError } = await supabase
      .from('journal_entries')
      .select('content, mood, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true })

    if (dbError) {
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({ summary: null, themes: [] })
    }

    const entriesText = entries
      .map((e, i) => {
        const date = new Date(e.created_at).toLocaleDateString('ru-RU')
        const moodStr = e.mood ? ` [Настроение: ${e.mood}]` : ''
        return `Запись ${i + 1} (${date})${moodStr}:\n${e.content}`
      })
      .join('\n\n---\n\n')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: `Ты психолог-ассистент. Проанализируй записи дневника человека за период. Найди повторяющиеся темы и паттерны. Отвечай на русском. Структура ответа:
ПАТТЕРНЫ: что повторяется (2-3 предложения)
ДИНАМИКА: как менялось состояние за период
ТЕМЫ: список 3-5 тем для обсуждения со специалистом
Без диагнозов. Тон тёплый.`,
      messages: [
        {
          role: 'user',
          content: `Записи дневника за последние ${period} дней (${entries.length} записей):\n\n${entriesText}`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse themes list from the ТЕМЫ section
    const themesMatch = raw.match(/ТЕМЫ:\s*([\s\S]+?)(?:\n\n|$)/i)
    const themes: string[] = themesMatch
      ? themesMatch[1]
          .split('\n')
          .map((l) => l.replace(/^[-•\d.]\s*/, '').trim())
          .filter(Boolean)
          .slice(0, 5)
      : []

    await supabase.from('journal_analysis_logs').insert({ user_id: user.id })

    // Save extracted themes to long-term memory
    if (themes.length > 0) {
      const topThemes = themes.slice(0, 3)
      for (const theme of topThemes) {
        const { data: existing } = await supabase
          .from('user_memory')
          .select('id, relevance')
          .eq('user_id', user.id)
          .eq('category', 'patterns')
          .ilike('content', `%${theme.slice(0, 40)}%`)
          .maybeSingle()

        if (existing) {
          await supabase
            .from('user_memory')
            .update({ relevance: Math.min(10, existing.relevance + 1), updated_at: new Date().toISOString() })
            .eq('id', existing.id)
        } else {
          await supabase
            .from('user_memory')
            .insert({ user_id: user.id, category: 'patterns', content: `Тема из журнала: ${theme}`, relevance: 6 })
        }
      }
    }

    return NextResponse.json({ summary: raw, themes })
  } catch (err) {
    console.error('analyze-journal error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
