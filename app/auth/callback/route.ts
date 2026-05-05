import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/checkin'
  const ref = searchParams.get('ref') // specialist referral code

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
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

      if (!profile?.role) return NextResponse.redirect(`${origin}/onboarding`)
      if (profile.role === 'specialist') return NextResponse.redirect(`${origin}/specialist/dashboard`)
      return NextResponse.redirect(`${origin}/cabinet`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
