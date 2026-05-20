import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { specialist_id, rating, text } = await req.json()
  if (!specialist_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'specialist_id and rating (1-5) required' }, { status: 400 })
  }

  const admin = adminClient()

  // Verify user is linked to this specialist
  const { data: link } = await admin
    .from('specialist_clients')
    .select('client_id')
    .eq('specialist_id', specialist_id)
    .eq('client_id', user.id)
    .maybeSingle()

  if (!link) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await admin
    .from('specialist_reviews')
    .upsert(
      { specialist_id, user_id: user.id, rating, text: text ?? null },
      { onConflict: 'specialist_id,user_id' }
    )

  if (error) {
    console.error('review upsert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
