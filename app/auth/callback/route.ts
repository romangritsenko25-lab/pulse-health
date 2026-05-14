import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { sendTelegram } from '@/lib/telegram'

const resend = new Resend(process.env.RESEND_API_KEY)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pulse-health-smoky.vercel.app'

function welcomeEmailHtml(name: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1d4ed8 0%,#06b6d4 100%);padding:32px;text-align:center;">
      <p style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">metanoia</p>
      <p style="margin:4px 0 0;font-size:10px;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:3px;text-transform:uppercase;">AI ASSISTANT</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e293b;">Привет, ${name}!</p>
      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">Рады видеть тебя в Metanoia. Здесь ты сможешь лучше понять своё состояние и подготовиться к разговору со специалистом.</p>
      <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#1e293b;">С чего начать:</p>
      <div style="margin:0 0 12px;padding:16px;background:#eff6ff;border-radius:12px;">
        <p style="margin:0;font-size:14px;color:#1e40af;">🧠 <strong>Пройди первый опрос</strong> — займёт 10 минут. AI проанализирует твоё состояние.</p>
      </div>
      <div style="margin:0 0 28px;padding:16px;background:#ecfeff;border-radius:12px;">
        <p style="margin:0;font-size:14px;color:#0e7490;">📋 <strong>Получи структурированный анализ</strong> для разговора со специалистом.</p>
      </div>
      <a href="${SITE_URL}/checkin"
         style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#06b6d4);color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:12px;">
        Начать опрос →
      </a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f1f5f9;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">Metanoia AI · Не является медицинским заключением</p>
    </div>
  </div>
</body>
</html>`
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const ref = searchParams.get('ref')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  type PendingCookie = { name: string; value: string; options: CookieOptions }
  const pendingCookies: PendingCookie[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, options })
          })
        },
      },
    }
  )

  const { error, data } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Link client to specialist when referral code present
  if (ref) {
    const { data: spec } = await supabase
      .from('specialists')
      .select('id')
      .eq('referral_code', ref)
      .single()

    if (spec) {
      await supabase
        .from('specialist_clients')
        .upsert(
          { specialist_id: spec.id, client_id: data.user.id },
          { onConflict: 'specialist_id,client_id' }
        )
    }
  }

  // Role-based redirect
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle()

  let redirectPath: string
  if (!profile?.role) redirectPath = '/onboarding'
  else if (profile.role === 'specialist') redirectPath = '/specialist/dashboard'
  else redirectPath = '/cabinet'

  if (redirectPath === '/onboarding' && data.user.email) {
    const name = (data.user.user_metadata?.name as string | undefined)
      ?? data.user.email.split('@')[0]
    await Promise.allSettled([
      resend.emails.send({
        from: 'Metanoia AI <noreply@metanoia.ai>',
        to: data.user.email,
        subject: `Добро пожаловать в Metanoia, ${name}!`,
        html: welcomeEmailHtml(name),
      }),
      sendTelegram(`🆕 <b>Новый пользователь</b>\nEmail: ${data.user.email}\nИмя: ${name}`),
    ])
  }

  const response = NextResponse.redirect(new URL(redirectPath, request.url))

  // Set session cookies directly on the redirect response
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}
