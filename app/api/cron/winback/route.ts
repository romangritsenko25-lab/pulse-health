import { NextResponse } from 'next/server'
import { Resend } from 'resend'
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

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  let sent = 0

  for (const profile of profiles) {
    // Find users whose LAST checkin was exactly 3 days ago (between 3 and 4 days)
    const { data: recent } = await supabase
      .from('checkins')
      .select('created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!recent) continue

    const lastAt = recent.created_at
    // Send only if last checkin is between 3 and 4 days ago (avoid duplicate sends)
    if (lastAt >= threeDaysAgo || lastAt < fourDaysAgo) continue

    // Count total checkins for streak context
    const { count } = await supabase
      .from('checkins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)

    const name = profile.name ?? 'друг'
    const total = count ?? 0

    await resend.emails.send({
      from: 'Metanoia AI <noreply@metanoia.ai>',
      to: profile.email,
      subject: 'Твой стрик ещё жив — загляни сегодня',
      html: `
<!DOCTYPE html>
<html lang="ru">
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="padding:28px 32px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#6366f1;letter-spacing:2px;text-transform:uppercase;">Metanoia AI</p>
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#1e293b;">Привет, ${name} 👋</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
        Ты не заходил(а) уже 3 дня. ${total > 0 ? `А ведь у тебя уже <strong>${total} опрос${total === 1 ? '' : total < 5 ? 'а' : 'ов'}</strong> позади — это реальная работа над собой.` : ''}
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
        10 минут сегодня — и ты снова в потоке. Вернись, пока стрик не угас.
      </p>
      <a href="${SITE_URL}/checkin"
         style="display:block;background:#6366f1;color:#ffffff;text-decoration:none;text-align:center;font-weight:600;font-size:14px;padding:14px 24px;border-radius:12px;">
        Вернуться и пройти опрос →
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
