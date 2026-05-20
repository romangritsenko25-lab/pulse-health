import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ProfileUpdateBody {
  name?: string
  last_name?: string
  gender?: string
  birth_date?: string
  main_request?: string[]
  has_psychologist?: string
  relationship_status?: string
  has_children?: boolean
  address_style?: string
  occupation?: string
  profile_complete?: boolean
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as ProfileUpdateBody

  const allowed: (keyof ProfileUpdateBody)[] = [
    'name', 'last_name', 'gender', 'birth_date', 'main_request',
    'has_psychologist', 'relationship_status', 'has_children',
    'address_style', 'occupation', 'profile_complete',
  ]

  const update: Partial<ProfileUpdateBody> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key] as never
  }

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', user.id)

  if (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
