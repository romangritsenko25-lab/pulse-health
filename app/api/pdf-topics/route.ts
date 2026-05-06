import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = adminClient()
    const { data, error: dbErr } = await admin
      .from('pdf_topics')
      .select('id, content, source, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (dbErr) throw dbErr
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[pdf-topics GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content } = await req.json() as { content: string }
    if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 })

    const admin = adminClient()
    const { data, error: dbErr } = await admin
      .from('pdf_topics')
      .insert({ user_id: user.id, content: content.trim(), source: 'ai_suggested' })
      .select('id')
      .single()

    if (dbErr) throw dbErr
    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error('[pdf-topics POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
