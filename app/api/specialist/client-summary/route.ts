import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const anthropic = new Anthropic()

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getAge(birthDate: string | null): string {
  if (!birthDate) return ''
  const years = Math.floor((Date.now() - new Date(birthDate).getTime()) / 31_557_600_000)
  return `${years} лет`
}

interface SummaryResult {
  trend: 'улучшение' | 'стабильно' | 'ухудшение'
  avg_wellbeing: number
  avg_anxiety: number
  dominant_emotions: string[]
  top_themes: string[]
  risk_flags: string[]
  summary: string
}

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('client_id')
  if (!clientId) {
    return NextResponse.json({ error: 'client_id required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = adminClient()

  // Verify specialist has this client
  const { data: link } = await admin
    .from('specialist_clients')
    .select('client_id')
    .eq('specialist_id', user.id)
    .eq('client_id', clientId)
    .maybeSingle()

  if (!link) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const since = new Date(Date.now() - 7 * 86_400_000).toISOString()

  // Load all client data in parallel
  const [checkinsRes, journalRes, memoryRes, profileRes] = await Promise.all([
    admin
      .from('checkins')
      .select('wellbeing, mood, created_at, deep_data')
      .eq('user_id', clientId)
      .gte('created_at', since)
      .order('created_at', { ascending: true }),

    admin
      .from('journal_entries')
      .select('content, mood, created_at')
      .eq('user_id', clientId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10),

    admin
      .from('user_memory')
      .select('category, content, relevance')
      .eq('user_id', clientId)
      .order('relevance', { ascending: false })
      .limit(10),

    admin
      .from('profiles')
      .select('name, last_name, gender, birth_date')
      .eq('id', clientId)
      .single(),
  ])

  const checkins = checkinsRes.data ?? []
  const journal = journalRes.data ?? []
  const memory = memoryRes.data ?? []
  const profile = profileRes.data

  // Not enough data
  if (checkins.length === 0 && journal.length === 0) {
    return NextResponse.json({ empty: true })
  }

  // Build client context string
  const fullName = [profile?.name, profile?.last_name].filter(Boolean).join(' ') || 'Клиент'
  const genderStr = profile?.gender === 'male' ? 'мужчина' : profile?.gender === 'female' ? 'женщина' : ''
  const ageStr = getAge(profile?.birth_date ?? null)
  const clientDesc = [fullName, genderStr, ageStr].filter(Boolean).join(', ')

  const checkinsText = checkins.map((c, i) => {
    const date = new Date(c.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    const deep = c.deep_data as Record<string, unknown> | null
    const anxiety = deep?.anxietyLevel ?? '—'
    const emotions = Array.isArray(deep?.emotions) ? (deep.emotions as string[]).join(', ') : '—'
    const stressors = Array.isArray(deep?.stressFactors) ? (deep.stressFactors as string[]).join(', ') : '—'
    return `Чекин ${i + 1} (${date}): самочувствие ${c.wellbeing ?? '—'}/10, тревога ${anxiety}/10, эмоции: ${emotions}, стрессоры: ${stressors}`
  }).join('\n')

  const journalText = journal.map((j) => {
    const date = new Date(j.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    return `Журнал (${date}): ${j.content?.slice(0, 200)}`
  }).join('\n')

  const memoryText = memory.map((m) => `[${m.category}] ${m.content}`).join('\n')

  const prompt = `Ты ассистент психолога. Сделай краткую предсессионную сводку клиента — для специалиста, не для клиента. Клинический, нейтральный тон.

Клиент: ${clientDesc}

Данные за последние 7 дней:

ЧЕКИНЫ:
${checkinsText || 'Нет данных'}

ЖУРНАЛ:
${journalText || 'Нет записей'}

ДОЛГОСРОЧНАЯ ПАМЯТЬ (важные паттерны):
${memoryText || 'Нет данных'}

Верни СТРОГО JSON (без markdown):
{
  "trend": "улучшение" | "стабильно" | "ухудшение",
  "avg_wellbeing": число 0-10,
  "avg_anxiety": число 0-10,
  "dominant_emotions": ["топ 2-3 эмоции"],
  "top_themes": ["тема 1", "тема 2", "тема 3"],
  "risk_flags": [],
  "summary": "2-3 предложения клинического наблюдения для специалиста"
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const result = JSON.parse(cleaned) as SummaryResult

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'private, max-age=300' },
    })
  } catch (err) {
    console.error('client-summary error:', err)
    // Fallback: compute basic stats without AI
    const avgWellbeing = checkins.length
      ? parseFloat((checkins.reduce((a, c) => a + (c.wellbeing ?? 5), 0) / checkins.length).toFixed(1))
      : 0
    const anxietyVals = checkins.map((c) => {
      const d = c.deep_data as Record<string, unknown> | null
      return typeof d?.anxietyLevel === 'number' ? d.anxietyLevel : null
    }).filter((v): v is number => v !== null)
    const avgAnxiety = anxietyVals.length
      ? parseFloat((anxietyVals.reduce((a, b) => a + b, 0) / anxietyVals.length).toFixed(1))
      : 0

    const fallback: SummaryResult = {
      trend: 'стабильно',
      avg_wellbeing: avgWellbeing,
      avg_anxiety: avgAnxiety,
      dominant_emotions: [],
      top_themes: memory.slice(0, 3).map((m) => m.content),
      risk_flags: avgAnxiety >= 7 ? ['Высокий уровень тревоги'] : [],
      summary: `За период зафиксировано ${checkins.length} чекинов. Среднее самочувствие ${avgWellbeing}/10.`,
    }
    return NextResponse.json(fallback, {
      headers: { 'Cache-Control': 'private, max-age=300' },
    })
  }
}
