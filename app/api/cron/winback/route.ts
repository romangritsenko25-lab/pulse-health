import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
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

  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
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
    // Send only if last checkin is between 5 and 6 days ago (avoid duplicate sends)
    if (lastAt >= fiveDaysAgo || lastAt < sixDaysAgo) continue

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
      subject: `${name}, возвращайся когда будешь готов`,
      html: emailHtml({
        title: `Привет, ${name}`,
        body: `
          <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
            Несколько дней без чек-ина — это нормально. Иногда нужна пауза.
          </p>
          ${total > 0 ? `<p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
            У тебя уже <strong style="color:#1e293b;">${total} опрос${total === 1 ? '' : total < 5 ? 'а' : 'ов'}</strong> позади — это реальная работа над собой. Когда будешь готов, мы здесь.
          </p>` : '<p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">Когда будешь готов — мы здесь. Десять минут помогут лучше понять что происходит.</p>'}`,
        ctaText: 'Вернуться к опросу',
        ctaUrl: `${SITE_URL}/checkin`,
        userId: profile.id,
      }),
    })

    sent++
  }

  return NextResponse.json({ sent })
}
