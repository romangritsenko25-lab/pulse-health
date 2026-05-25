import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { emailHtml } from '@/lib/email-template'

const resend = new Resend(process.env.RESEND_API_KEY)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pulse-health-smoky.vercel.app'

function generateCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, specialty, photo_url, bio, city } = await req.json()

  if (!name || !specialty) {
    return NextResponse.json({ error: 'name and specialty required' }, { status: 400 })
  }

  // Check if already registered — update instead of insert
  const { data: existing } = await supabase
    .from('specialists')
    .select('id, referral_code')
    .eq('id', user.id)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('specialists')
      .update({ name, specialty, photo_url: photo_url ?? null, bio: bio ?? null, city: city ?? null })
      .eq('id', user.id)
    if (error) {
      console.error('specialist update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ referral_code: existing.referral_code })
  }

  const referral_code = generateCode()

  const { error } = await supabase.from('specialists').insert({
    id: user.id,
    name,
    specialty,
    photo_url: photo_url ?? null,
    bio: bio ?? null,
    city: city ?? null,
    referral_code,
  })

  if (error) {
    console.error('specialist insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send welcome email to new specialist
  const email = user.email
  if (email) {
    const refUrl = `${SITE_URL}/ref/${referral_code}`
    resend.emails.send({
      from: 'Metanoia AI <hello@metanoia.ai>',
      to: email,
      subject: 'Кабинет специалиста Metanoia готов',
      html: emailHtml({
        title: 'Добро пожаловать в Metanoia',
        subtitle: 'Кабинет психолога',
        body: `
          <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
            Ваш кабинет специалиста создан. Отправляйте реферальную ссылку клиентам — они автоматически привяжутся к вашему профилю после регистрации.
          </p>
          <div style="border-left:3px solid #2563eb;padding:12px 16px;margin-bottom:20px;background:#f8fafc;border-radius:0 8px 8px 0;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#64748b;letter-spacing:1px;text-transform:uppercase;">Ваша реферальная ссылка</p>
            <p style="margin:0;font-size:13px;color:#2563eb;word-break:break-all;">${refUrl}</p>
          </div>
          <p style="margin:0;font-size:14px;color:#64748b;line-height:1.5;">В кабинете вы найдёте список клиентов, их AI-анализы и инструменты для домашних заданий.</p>`,
        ctaText: 'Открыть кабинет специалиста',
        ctaUrl: `${SITE_URL}/specialist`,
        userId: user.id,
      }),
    }).catch(console.error)
  }

  return NextResponse.json({ referral_code })
}
