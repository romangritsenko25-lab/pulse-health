import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  return NextResponse.json({ referral_code })
}
