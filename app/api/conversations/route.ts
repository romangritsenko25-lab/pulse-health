import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = adminClient()

    const { data: conversations, error } = await admin
      .from('ai_conversations')
      .select('id, title, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20)

    if (error) throw error

    // Load last message for each conversation
    const withLastMessage = await Promise.all(
      (conversations ?? []).map(async (conv) => {
        const { data: msgs } = await admin
          .from('ai_messages')
          .select('content, role')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)

        return {
          ...conv,
          last_message: msgs?.[0]?.content ?? null,
        }
      })
    )

    return NextResponse.json(withLastMessage)
  } catch (err) {
    console.error('GET /api/conversations error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title } = await req.json() as { title?: string }

    const admin = adminClient()
    const { data, error } = await admin
      .from('ai_conversations')
      .insert({ user_id: user.id, title: title ?? 'Новый чат' })
      .select('id, title, created_at')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (err) {
    console.error('POST /api/conversations error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
