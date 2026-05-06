import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

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

  const response = NextResponse.redirect(new URL(redirectPath, request.url))

  // Set session cookies directly on the redirect response
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}
