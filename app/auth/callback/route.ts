import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const ref = searchParams.get('ref')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Collect cookies set during session exchange
  const pendingCookies: Array<Parameters<typeof Response.prototype.headers.append>> = []

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
            // @ts-expect-error — collect for later
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
  pendingCookies.forEach(({ name, value, options }: { name: string; value: string; options: Record<string, unknown> }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  })

  return response
}
