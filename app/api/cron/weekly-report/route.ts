import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pulse-health-smoky.vercel.app'

export async function GET(req: Request) {
  // Protect cron endpoint
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Get all profiles with email
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, name')
    .not('email', 'is', null)

  if (!profiles?.length) return NextResponse.json({ sent: 0 })

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  let sent = 0

  for (const profile of profiles) {
    const { data: checkins } = await supabase
      .from('checkins')
      .select('wellbeing, mood, energy, sleep, created_at')
      .eq('user_id', profile.id)
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: false })

    if (!checkins?.length) continue

    const summary = checkins
      .map((c) => {
        const d = new Date(c.created_at).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })
        return `${d}: самочувствие ${c.wellbeing}/10, настроение: ${c.mood || '—'}`
      })
      .join('\n')

    let insight = `За неделю ты заполнил(а) ${checkins.length} опрос(а). Средний балл самочувствия: ${(checkins.reduce((a, b) => a + (b.wellbeing ?? 5), 0) / checkins.length).toFixed(1)}/10.`

    try {
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 120,
        system: 'Ты помощник по самочувствию. Напиши 2 предложения на русском: один позитивный итог недели и одно мягкое предложение на следующую неделю. Без вводных слов.',
        messages: [{ role: 'user', content: `Данные за неделю:\n${summary}` }],
      })
      if (msg.content[0].type === 'text') insight = msg.content[0].text.trim()
    } catch (_) { /* keep fallback */ }

    const name = profile.name ?? 'друг'
    const count = checkins.length
    const avgScore = (checkins.reduce((a, b) => a + (b.wellbeing ?? 5), 0) / count).toFixed(1)

    await resend.emails.send({
      from: 'Metanoia AI <noreply@metanoia.ai>',
      to: profile.email,
      subject: `${name}, твой отчёт за неделю готов`,
      html: `
<!DOCTYPE html>
<html lang="ru">
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="background:#6366f1;padding:28px 32px;">
      <p style="margin:0;font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:3px;text-transform:uppercase;">Metanoia AI</p>
      <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Твой отчёт за неделю</h1>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 20px;font-size:15px;color:#334155;">Привет, ${name}!</p>
      <div style="background:#f1f5f9;border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;gap:24px;">
        <div style="text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#6366f1;">${count}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px;">опросов</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#6366f1;">${avgScore}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px;">средний балл</div>
        </div>
      </div>
      <div style="background:#eff6ff;border-left:4px solid #6366f1;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;line-height:1.7;color:#1e3a8a;">${insight}</p>
      </div>
      <a href="${SITE_URL}/dashboard"
         style="display:block;background:#6366f1;color:#ffffff;text-decoration:none;text-align:center;font-weight:600;font-size:14px;padding:14px 24px;border-radius:12px;">
        Открыть дашборд →
      </a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center;">
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
