import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { sendTelegram } from '@/lib/telegram'
import { emailHtml } from '@/lib/email-template'

const resend = new Resend(process.env.RESEND_API_KEY)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pulse-health-smoky.vercel.app'

function welcomeEmailHtml(name: string, userId: string): string {
  return emailHtml({
    title: `Добро пожаловать, ${name}`,
    subtitle: 'Твой AI-ассистент подготовки к специалисту',
    body: `
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
        Рады видеть тебя в Metanoia. За 10 минут ты получишь структурированный анализ своего состояния — готовый документ для разговора со специалистом.
      </p>
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="min-width:28px;height:28px;background:#eff6ff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#2563eb;">01</span>
          <p style="margin:0;font-size:14px;color:#475569;">Пройди AI-опрос — 4 блока за 10 минут</p>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="min-width:28px;height:28px;background:#eff6ff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#2563eb;">02</span>
          <p style="margin:0;font-size:14px;color:#475569;">Получи анализ состояния в стиле психолога</p>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="min-width:28px;height:28px;background:#eff6ff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#2563eb;">03</span>
          <p style="margin:0;font-size:14px;color:#475569;">Покажи PDF-отчёт специалисту на приёме</p>
        </div>
      </div>`,
    ctaText: 'Начать первый опрос',
    ctaUrl: `${SITE_URL}/checkin`,
    userId,
  })
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

  const isNewUser = redirectPath === '/onboarding' && !!data.user.email
  console.log('[auth/callback]', { email: data.user.email, redirectPath, isNewUser })

  if (isNewUser) {
    const name = (data.user.user_metadata?.name as string | undefined)
      ?? data.user.email!.split('@')[0]
    const results = await Promise.allSettled([
      resend.emails.send({
        from: 'Metanoia AI <hello@metanoia.ai>',
        to: data.user.email!,
        subject: `Добро пожаловать в Metanoia, ${name}!`,
        html: welcomeEmailHtml(name, data.user.id),
      }),
      sendTelegram(`Новый пользователь!\nEmail: ${data.user.email}\nИмя: ${name}`),
    ])
    console.log('[auth/callback] notifications:', results.map(r => r.status))
  }

  const response = NextResponse.redirect(new URL(redirectPath, request.url))

  // Set session cookies directly on the redirect response
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}
