import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const admin = adminClient()

    // Verify ownership
    const { data: conv, error: convError } = await admin
      .from('ai_conversations')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (convError) throw convError
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: messages, error } = await admin
      .from('ai_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
      .limit(50)

    if (error) throw error

    return NextResponse.json(messages ?? [])
  } catch (err) {
    console.error('GET /api/conversations/[id] error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const admin = adminClient()

    // Verify ownership before delete
    const { data: conv } = await admin
      .from('ai_conversations')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { error } = await admin
      .from('ai_conversations')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/conversations/[id] error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
