import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

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

    // Only nudge if last checkin was more than 20 hours ago
    const lastCheckin = new Date(recent.created_at)
    if (Date.now() - lastCheckin.getTime() < 20 * 60 * 60 * 1000) continue

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
      subject: isYesterday ? `${nudge}` : `Как ты сегодня, ${name}?`,
      html: `
<!DOCTYPE html>
<html lang="ru">
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="padding:28px 32px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#6366f1;letter-spacing:2px;text-transform:uppercase;">Metanoia AI</p>
      <p style="margin:0 0 20px;font-size:16px;color:#1e293b;line-height:1.6;">${nudge}</p>
      <a href="${SITE_URL}/checkin"
         style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:12px;">
        Начать опрос →
      </a>
    </div>
    <div style="padding:12px 32px;border-top:1px solid #f1f5f9;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">Metanoia AI · Не является медицинским заключением</p>
    </div>
  </div>
</body>
</html>`,
    })

    sent++
  }

  return NextResponse.json({ sent })
}
