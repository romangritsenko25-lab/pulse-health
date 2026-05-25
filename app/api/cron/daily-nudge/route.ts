import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { sendTelegram } from '@/lib/telegram'
import { emailHtml } from '@/lib/email-template'

const resend = new Resend(process.env.RESEND_API_KEY)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pulse-health-smoky.vercel.app'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, name')
    .not('email', 'is', null)
    .eq('email_unsubscribed', false)

  if (!profiles?.length) return NextResponse.json({ sent: 0 })

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  let sent = 0

  for (const profile of profiles) {
    // Get most recent checkin
    const { data: recent } = await supabase
      .from('checkins')
      .select('wellbeing, mood, emotions, created_at, deep_data')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!recent) continue

    // Only nudge if last checkin was more than 48 hours ago (2 days)
    const lastCheckin = new Date(recent.created_at)
    if (Date.now() - lastCheckin.getTime() < 48 * 60 * 60 * 1000) continue

    const deepData = recent.deep_data as Record<string, unknown> | null
    const emotions: string[] = (deepData?.emotions as string[]) ?? (recent.mood ? [recent.mood] : [])
    const emotionText = emotions.length ? emotions.slice(0, 2).join(', ') : null
    const wellbeing = recent.wellbeing ?? 5

    let nudge = 'Как ты сегодня? Пройди короткий опрос — это займёт 10 минут.'

    try {
      const context = emotionText
        ? `Вчера пользователь отметил: самочувствие ${wellbeing}/10, эмоции: ${emotionText}.`
        : `Вчера самочувствие было ${wellbeing}/10.`

      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 60,
        system: 'Ты заботливый помощник. Напиши ОДНО предложение-напоминание на русском языке (неформально, "ты"). Упомяни вчерашние данные. Без эмодзи. Без кавычек.',
        messages: [{ role: 'user', content: context }],
      })
      if (msg.content[0].type === 'text') nudge = msg.content[0].text.trim()
    } catch (_) { /* keep fallback */ }

    const name = profile.name ?? 'друг'
    const isYesterday = Date.now() - lastCheckin.getTime() < 48 * 60 * 60 * 1000

    await resend.emails.send({
      from: 'Metanoia AI <noreply@metanoia.ai>',
      to: profile.email,
      subject: isYesterday ? nudge : `Как ты сегодня, ${name}?`,
      html: emailHtml({
        title: `Привет, ${name}`,
        body: `<p style="margin:0;font-size:15px;color:#475569;line-height:1.6;">${nudge}</p>`,
        ctaText: 'Пройти опрос',
        ctaUrl: `${SITE_URL}/checkin`,
        userId: profile.id,
      }),
    })

    sent++
  }

  // Daily Telegram report
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count: newUsersToday } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())
  const { count: checkinsToday } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())

  await sendTelegram(
    `📊 <b>Дневной отчёт Metanoia</b>\n` +
    `👤 Всего юзеров: ${profiles.length}\n` +
    `🆕 Новых сегодня: ${newUsersToday ?? 0}\n` +
    `✅ Чекинов сегодня: ${checkinsToday ?? 0}\n` +
    `📧 Писем отправлено: ${sent}`
  )

  return NextResponse.json({ sent })
}
